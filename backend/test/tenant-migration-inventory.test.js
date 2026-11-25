'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyTenantTables, inspectTenantMigration } = require('../modules/platform/tenantMigrationInventory');

test('classifies direct company tables and descendants through foreign keys', () => {
  const result = classifyTenantTables({
    tables: ['companies', 'employees', 'attendance', 'leave_applications', 'lookup_values'],
    columns: [
      { table_name: 'companies', column_name: 'id' },
      { table_name: 'employees', column_name: 'company_id' },
      { table_name: 'attendance', column_name: 'employee_id' },
      { table_name: 'leave_applications', column_name: 'employee_id' },
      { table_name: 'lookup_values', column_name: 'id' },
    ],
    foreignKeys: [
      { table_name: 'attendance', foreign_table_name: 'employees' },
      { table_name: 'leave_applications', foreign_table_name: 'employees' },
    ],
  });
  assert.equal(result.companies.scope, 'direct');
  assert.equal(result.employees.scope, 'direct');
  assert.equal(result.attendance.scope, 'dependent');
  assert.deepEqual(result.attendance.via, ['employees']);
  assert.equal(result.leave_applications.scope, 'dependent');
  assert.equal(result.lookup_values.scope, 'unclassified');
});

test('does not classify a table as tenant-owned without an FK path', () => {
  const result = classifyTenantTables({
    tables: ['employees', 'orphan_records'],
    columns: [{ table_name: 'employees', column_name: 'company_id' }],
    foreignKeys: [],
  });
  assert.equal(result.orphan_records.scope, 'unclassified');
});

test('uses the shortest discoverable ownership path for dependent tables', () => {
  const result = classifyTenantTables({
    tables: ['employees', 'employee_documents', 'document_events'],
    columns: [{ table_name: 'employees', column_name: 'company_id' }],
    foreignKeys: [
      { table_name: 'employee_documents', foreign_table_name: 'employees' },
      { table_name: 'document_events', foreign_table_name: 'employee_documents' },
    ],
  });
  assert.deepEqual(result.document_events.via, ['employee_documents', 'employees']);
});


test('builds a read-only inventory using the verified operational company UUID', async () => {
  const calls = [];
  const pool = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.includes('information_schema.schemata')) {
        return { rows: [{ schema_name: 'public' }] };
      }
      if (sql.includes('information_schema.tables')) {
        return { rows: ['companies', 'employees', 'attendance', 'lookup_values'].map((table_name) => ({ table_name })) };
      }
      if (sql.includes('information_schema.columns')) {
        return { rows: [
          { table_name: 'companies', column_name: 'id', data_type: 'uuid' },
          { table_name: 'companies', column_name: 'gstin', data_type: 'text' },
          { table_name: 'companies', column_name: 'pan', data_type: 'text' },
          { table_name: 'employees', column_name: 'company_id', data_type: 'uuid' },
          { table_name: 'attendance', column_name: 'employee_id', data_type: 'uuid' },
          { table_name: 'lookup_values', column_name: 'id', data_type: 'uuid' },
        ] };
      }
      if (sql.includes('pg_constraint')) {
        return { rows: [{ table_name: 'attendance', foreign_table_name: 'employees' }] };
      }
      if (sql.includes('FROM "public".companies')) {
        assert.deepEqual(params, ['29ABCDE1234F1Z5', 'ABCDE1234F']);
        return { rows: [{ id: '11111111-1111-4111-8111-111111111111' }] };
      }
      if (sql.includes('FROM "public"."companies"')) return { rows: [{ count: '1' }] };
      if (sql.includes('FROM "public"."employees"')) {
        assert.deepEqual(params, ['11111111-1111-4111-8111-111111111111']);
        return { rows: [{ count: '3' }] };
      }
      throw new Error('Unexpected SQL in inventory test: ' + sql);
    },
    async end() {},
  };

  const result = await inspectTenantMigration({
    databaseUrl: 'postgresql://user:pass@localhost:5432/hrms?schema=public',
    tenantId: '22222222-2222-4222-8222-222222222222',
    gstin: '29ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    sourceSchema: 'public',
    destinationSchema: 'tenant_22222222222242228222222222222222',
    poolFactory: () => pool,
  });

  assert.equal(result.copyAllowed, false);
  assert.equal(result.inventoryOnly, true);
  assert.equal(result.summary.destinationSchemaExists, false);
  assert.equal(result.tables.find((row) => row.name === 'companies').sourceRows, 1);
  assert.equal(result.tables.find((row) => row.name === 'employees').sourceRows, 3);
  assert.equal(result.tables.find((row) => row.name === 'attendance').scope, 'dependent');
  assert.equal(result.tables.find((row) => row.name === 'lookup_values').scope, 'unclassified');
  assert.ok(calls.some((call) => call.params?.[0] === '11111111-1111-4111-8111-111111111111'));
});
