'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyTenantTables, buildDependentInventoryQuery, buildCrossTenantReferenceQuery, inspectTenantMigration } = require('../modules/platform/tenantMigrationInventory');

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
      { table_name: 'attendance', foreign_table_name: 'employees', constraint_name: 'attendance_employee_fk', child_columns: ['employee_id'], parent_columns: ['id'] },
      { table_name: 'leave_applications', foreign_table_name: 'employees', constraint_name: 'leave_employee_fk', child_columns: ['employee_id'], parent_columns: ['id'] },
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
      { table_name: 'employee_documents', foreign_table_name: 'employees', constraint_name: 'documents_employee_fk', child_columns: ['employee_id'], parent_columns: ['id'] },
      { table_name: 'document_events', foreign_table_name: 'employee_documents', constraint_name: 'events_document_fk', child_columns: ['document_id'], parent_columns: ['id'] },
    ],
  });
  assert.deepEqual(result.document_events.via, ['employee_documents', 'employees']);
});


test('preserves composite FK column order and rejects ambiguous or cyclic ownership paths', () => {
  const composite = classifyTenantTables({
    tables: ['companies', 'employees', 'payroll_rows'],
    columns: [
      { table_name: 'companies', column_name: 'id' },
      { table_name: 'employees', column_name: 'company_id' },
    ],
    foreignKeys: [{
      table_name: 'payroll_rows',
      foreign_table_name: 'employees',
      constraint_name: 'payroll_employee_company_fk',
      child_columns: ['employee_id', 'company_ref'],
      parent_columns: ['id', 'company_id'],
    }],
  });
  assert.equal(composite.payroll_rows.scope, 'dependent');
  assert.deepEqual(composite.payroll_rows.relations[0].childColumns, ['employee_id', 'company_ref']);
  assert.deepEqual(composite.payroll_rows.relations[0].parentColumns, ['id', 'company_id']);

  const ambiguous = classifyTenantTables({
    tables: ['companies', 'employees', 'departments', 'staff_assignments'],
    columns: [
      { table_name: 'companies', column_name: 'id' },
      { table_name: 'employees', column_name: 'company_id' },
      { table_name: 'departments', column_name: 'company_id' },
    ],
    foreignKeys: [
      { table_name: 'staff_assignments', foreign_table_name: 'employees', child_columns: ['employee_id'], parent_columns: ['id'] },
      { table_name: 'staff_assignments', foreign_table_name: 'departments', child_columns: ['department_id'], parent_columns: ['id'] },
    ],
  });
  assert.equal(ambiguous.staff_assignments.scope, 'ambiguous');

  const cycle = classifyTenantTables({
    tables: ['companies', 'cyclic_a', 'cyclic_b'],
    columns: [{ table_name: 'companies', column_name: 'id' }],
    foreignKeys: [
      { table_name: 'cyclic_a', foreign_table_name: 'cyclic_b', child_columns: ['b_id'], parent_columns: ['id'] },
      { table_name: 'cyclic_b', foreign_table_name: 'cyclic_a', child_columns: ['a_id'], parent_columns: ['id'] },
    ],
  });
  assert.equal(cycle.cyclic_a.scope, 'unclassified');
  assert.equal(cycle.cyclic_b.scope, 'unclassified');
});

test('builds parameterized composite-key joins and cross-tenant reference checks', () => {
  const dependentQuery = buildDependentInventoryQuery({
    sourceSchema: 'public',
    table: 'payroll_rows',
    rootTable: 'employees',
    relations: [{
      fromTable: 'payroll_rows',
      toTable: 'employees',
      childColumns: ['employee_id', 'company_ref'],
      parentColumns: ['id', 'company_id'],
      validated: true,
    }],
  });
  assert.match(dependentQuery.sql, /t0\."employee_id" = t1\."id"/);
  assert.match(dependentQuery.sql, /t0\."company_ref" = t1\."company_id"/);
  assert.match(dependentQuery.sql, /t1\."company_id" = \$1/);
  assert.throws(() => buildDependentInventoryQuery({
    sourceSchema: 'public',
    table: 'payroll_rows',
    rootTable: 'employees',
    relations: [{ toTable: 'employees', childColumns: ['employee_id'], parentColumns: ['id'], validated: false }],
  }), /Unvalidated foreign keys/);

  const crossTenantQuery = buildCrossTenantReferenceQuery({
    sourceSchema: 'public',
    foreignKey: {
      table_name: 'employee_notes',
      foreign_table_name: 'employees',
      child_columns: ['employee_id'],
      parent_columns: ['id'],
    },
  });
  assert.match(crossTenantQuery.sql, /child\."company_id" = \$1/);
  assert.match(crossTenantQuery.sql, /parent\."company_id" <> \$1/);
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
        return { rows: ['companies', 'employees', 'attendance', 'lookup_values', 'employee_notes'].map((table_name) => ({ table_name })) };
      }
      if (sql.includes('information_schema.columns')) {
        return { rows: [
          { table_name: 'companies', column_name: 'id', data_type: 'uuid' },
          { table_name: 'companies', column_name: 'gstin', data_type: 'text' },
          { table_name: 'companies', column_name: 'pan', data_type: 'text' },
          { table_name: 'employees', column_name: 'company_id', data_type: 'uuid' },
          { table_name: 'attendance', column_name: 'employee_id', data_type: 'uuid', is_nullable: 'NO' },
          { table_name: 'lookup_values', column_name: 'id', data_type: 'uuid' },
          { table_name: 'employee_notes', column_name: 'company_id', data_type: 'uuid', is_nullable: 'NO' },
          { table_name: 'employee_notes', column_name: 'employee_id', data_type: 'uuid', is_nullable: 'NO' },
        ] };
      }
      if (sql.includes('tenant_owned_rows')) return { rows: [{ tenant_owned_rows: '2', orphan_rows: '1', nullable_reference_rows: '1' }] };
      if (sql.includes('cross_tenant_rows')) return { rows: [{ cross_tenant_rows: '1' }] };
      if (sql.includes('pg_constraint')) {
        return { rows: [
          { child_schema: 'public', table_name: 'attendance', foreign_schema: 'public', foreign_table_name: 'employees', constraint_name: 'attendance_employee_id_fkey', child_columns: ['employee_id'], parent_columns: ['id'], is_validated: true, is_deferrable: false, match_type: 's' },
          { child_schema: 'public', table_name: 'audit_outbox', foreign_schema: 'shared', foreign_table_name: 'global_codes', constraint_name: 'audit_global_code_fk', child_columns: ['code_id'], parent_columns: ['id'], is_validated: false, is_deferrable: false, match_type: 's' },
          { child_schema: 'public', table_name: 'employee_notes', foreign_schema: 'public', foreign_table_name: 'employees', constraint_name: 'notes_employee_fk', child_columns: ['employee_id'], parent_columns: ['id'], is_validated: true, is_deferrable: false, match_type: 's' },
        ] };
      }
      if (sql.includes('FROM "public".companies') && sql.includes('WHERE ($1::text IS NULL')) {
        assert.deepEqual(params, ['29ABCDE1234F1Z5', 'ABCDE1234F']);
        return { rows: [{ id: '11111111-1111-4111-8111-111111111111' }] };
      }
      if (sql.includes('FROM "public".companies WHERE id = $1')) return { rows: [{ count: '1' }] };
      if (sql.includes('FROM "public"."employee_notes"')) return { rows: [{ count: '4', unowned_rows: '1' }] };
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
  assert.equal(result.summary.ambiguousTables, 0);
  assert.equal(result.summary.crossSchemaForeignKeyCount, 1);
  assert.equal(result.summary.crossTenantReferenceCount, 1);
  assert.equal(result.tables.find((row) => row.name === 'companies').sourceRows, 1);
  assert.equal(result.tables.find((row) => row.name === 'employees').sourceRows, 3);
  assert.equal(result.tables.find((row) => row.name === 'attendance').scope, 'dependent');
  assert.equal(result.tables.find((row) => row.name === 'attendance').sourceRows, 2);
  assert.equal(result.tables.find((row) => row.name === 'attendance').orphanRows, 1);
  assert.equal(result.tables.find((row) => row.name === 'attendance').nullableReferenceRows, 1);
  assert.equal(result.tables.find((row) => row.name === 'employee_notes').unownedRows, 1);
  assert.equal(result.tables.find((row) => row.name === 'lookup_values').scope, 'unclassified');
  assert.equal(result.copyAllowed, false);
  assert.ok(result.blockers.some((item) => item.includes('Dependent tables')));
  assert.ok(result.blockers.some((item) => item.includes('no proven tenant ownership path')));
  assert.ok(result.blockers.some((item) => item.includes('NOT VALID')));
  assert.ok(result.blockers.some((item) => item.includes('cross the source schema boundary')));
  assert.ok(result.blockers.some((item) => item.includes('reference records owned by another tenant')));
  assert.ok(result.blockers.some((item) => item.includes('orphaned or unowned foreign-key records')));
  assert.ok(result.blockers.some((item) => item.includes('nullable ownership references')));
  assert.ok(result.blockers.some((item) => item.includes('NULL company_id')));
  assert.equal(result.tables.find((row) => row.name === 'employee_notes').sourceRows, 4);
  assert.deepEqual(result.crossTenantReferences, [{ table: 'employee_notes', referencesTable: 'employees', constraint: 'notes_employee_fk', rows: 1 }]);
  assert.equal(result.foreignKeys.length, 3);
  assert.deepEqual(result.foreignKeys[0], {
    schema: 'public',
    table: 'attendance',
    referencesSchema: 'public',
    referencesTable: 'employees',
    constraint: 'attendance_employee_id_fkey',
    childColumns: ['employee_id'],
    parentColumns: ['id'],
    validated: true,
    deferrable: false,
    matchType: 's',
  });
  assert.ok(calls.some((call) => call.params?.[0] === '11111111-1111-4111-8111-111111111111'));
  assert.ok(calls.every((call) => /^\\s*SELECT/i.test(call.sql)), 'tenant data inventory must remain SELECT-only');
});
