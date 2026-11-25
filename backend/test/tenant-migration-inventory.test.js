'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyTenantTables } = require('../modules/platform/tenantMigrationInventory');

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
