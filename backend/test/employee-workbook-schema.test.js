'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EMPLOYEE_WORKBOOK_SCHEMA } = require('../modules/employees/employee-workbook.schema');
const { IMPORT_MODES, validateWorkbookData } = require('../shared/import-export/workbookSchema');

const valid = {
  Employees: [{ employeeCode: 'EMP0001', firstName: 'Asha', lastName: 'Sharma', dateOfJoining: '2026-01-01' }],
  ContactDetails: [{ employeeCode: 'EMP0001', phone: '9876543210', personalEmail: 'asha@example.com' }],
  Addresses: [{ employeeCode: 'EMP0001', addressType: 'local', pincode: '110001' }],
  Family: [{ employeeCode: 'EMP0001', name: 'Ravi', relationship: 'spouse', isDependent: true }],
  Education: [{ employeeCode: 'EMP0001', eduLevel: 'graduate', passingYear: 2020 }],
  PreviousEmployment: [{ employeeCode: 'EMP0001', organizationName: 'Example Ltd' }],
};

test('employee workbook defines relational child sheets with stable Employee Code references', () => {
  assert.deepEqual(EMPLOYEE_WORKBOOK_SCHEMA.sheets.map((sheet) => sheet.name), [
    'Employees', 'ContactDetails', 'Addresses', 'Family', 'Education', 'PreviousEmployment',
  ]);
  for (const sheet of EMPLOYEE_WORKBOOK_SCHEMA.sheets.filter((item) => item.parent)) {
    assert.equal(sheet.parent.field, 'employeeCode');
    assert.equal(sheet.parent.sheet, 'Employees');
  }
  assert.equal(EMPLOYEE_WORKBOOK_SCHEMA.sheets.some((sheet) => sheet.name === 'BankAccounts'), false);
  assert.equal(EMPLOYEE_WORKBOOK_SCHEMA.sheets.some((sheet) => sheet.fields.aadhaarNumber), false);
});

test('validates a relational employee workbook', () => {
  const result = validateWorkbookData(EMPLOYEE_WORKBOOK_SCHEMA, valid, { mode: 'upsert' });
  assert.equal(result.valid, true);
  assert.equal(result.rowCount, 6);
  assert.deepEqual(result.errors, []);
});

test('rejects child rows whose Employee Code is not present in Employees sheet', () => {
  const data = { ...valid, Family: [{ employeeCode: 'EMP9999', name: 'Ravi', relationship: 'spouse' }] };
  const result = validateWorkbookData(EMPLOYEE_WORKBOOK_SCHEMA, data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.sheet === 'Family' && error.field === 'employeeCode'));
});

test('rejects duplicate parent keys, invalid enums, malformed dates and formula objects', () => {
  const data = {
    ...valid,
    Employees: [
      { employeeCode: 'EMP0001', firstName: 'Asha', lastName: 'Sharma', status: 'active' },
      { employeeCode: 'emp0001', firstName: 'Ravi', lastName: 'Kumar', status: 'unknown' },
      { employeeCode: 'EMP0003', firstName: 'Mina', lastName: 'Das', dateOfJoining: 'not-a-date', phone: { formula: '1+1' } },
    ],
  };
  const result = validateWorkbookData(EMPLOYEE_WORKBOOK_SCHEMA, data);
  assert.ok(result.errors.some((error) => error.field === 'employeeCode' && /Duplicate/.test(error.message)));
  assert.ok(result.errors.some((error) => error.field === 'status' && /one of/.test(error.message)));
  assert.ok(result.errors.some((error) => error.field === 'dateOfJoining'));
  assert.ok(result.errors.some((error) => error.field === 'phone' && /Formula/.test(error.message)));
});

test('rejects invalid calendar dates and unresolved manager Employee Code references', () => {
  const data = {
    ...valid,
    Employees: [{
      employeeCode: 'EMP0001',
      firstName: 'Asha',
      lastName: 'Sharma',
      dateOfJoining: '2026-02-31',
      managerEmployeeCode: 'EMP9999',
    }],
  };
  const result = validateWorkbookData(EMPLOYEE_WORKBOOK_SCHEMA, data);
  assert.ok(result.errors.some((error) => error.field === 'dateOfJoining' && /valid date/.test(error.message)));
  assert.ok(result.errors.some((error) => error.field === 'managerEmployeeCode' && /Reference/.test(error.message)));
});

test('supports only explicit non-destructive conflict modes', () => {
  assert.deepEqual(IMPORT_MODES, ['create-only', 'update-only', 'upsert']);
  assert.equal(validateWorkbookData(EMPLOYEE_WORKBOOK_SCHEMA, valid, { mode: 'replace-all' }).valid, false);
});

test('requires explicit child record IDs for update-only and forbids them in create-only', () => {
  const updateResult = validateWorkbookData(EMPLOYEE_WORKBOOK_SCHEMA, valid, { mode: 'update-only' });
  assert.ok(updateResult.errors.some((error) => error.sheet === 'Family' && error.field === 'recordId'));
  const createData = {
    ...valid,
    Family: [{ recordId: '123e4567-e89b-42d3-a456-426614174000', employeeCode: 'EMP0001', name: 'Ravi', relationship: 'spouse' }],
  };
  const createResult = validateWorkbookData(EMPLOYEE_WORKBOOK_SCHEMA, createData, { mode: 'create-only' });
  assert.ok(createResult.errors.some((error) => error.sheet === 'Family' && error.field === 'recordId'));
});

test('requires Employee Code and accepts native Excel date values', () => {
  const data = {
    Employees: [{ firstName: 'Asha', lastName: 'Sharma', dateOfJoining: new Date('2026-01-01T00:00:00.000Z') }],
  };
  const result = validateWorkbookData(EMPLOYEE_WORKBOOK_SCHEMA, data);
  assert.ok(result.errors.some((error) => error.sheet === 'Employees' && error.field === 'employeeCode'));
  assert.ok(!result.errors.some((error) => error.field === 'dateOfJoining'));
});
