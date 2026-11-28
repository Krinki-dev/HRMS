'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const attendance = require('../modules/attendance/attendance.service');
const employees = require('../modules/employees/employees.service');
const payroll = require('../modules/payroll/payroll.service');
const training = require('../modules/training/training.service');

const COMPANY_A = 'company-a';
const COMPANY_B = 'company-b';
const EMPLOYEE_A = 'employee-a';
const EMPLOYEE_B = 'employee-b';
const RUN_A = 'run-a';
const TRAINING_A = 'training-a';

test('holiday deletion refuses a holiday owned by another company', async () => {
  let updateCalled = false;
  const db = {
    holidays: {
      findFirst: async ({ where }) => {
        assert.deepEqual(where, { id: 'holiday-b', company_id: COMPANY_A, deleted_at: null });
        return null;
      },
      update: async () => { updateCalled = true; },
    },
  };
  await assert.rejects(attendance.deleteHoliday(db, 'holiday-b', COMPANY_A), /NOT_FOUND/);
  assert.equal(updateCalled, false);
});

for (const [name, method, childModel, childId] of [
  ['bank update', 'updateBankAccount', 'employee_bank_accounts', 'bank-b'],
  ['bank deletion', 'deleteBankAccount', 'employee_bank_accounts', 'bank-b'],
  ['document deletion', 'deleteDocument', 'employee_documents', 'document-b'],
]) {
  test(`${name} refuses an employee outside the authenticated company before querying child data`, async () => {
    let childQueried = false;
    let childWritten = false;
    const db = {
      employees: {
        findFirst: async ({ where }) => {
          assert.deepEqual(where, { id: EMPLOYEE_B, company_id: COMPANY_A, deleted_at: null });
          return null;
        },
      },
      [childModel]: {
        findFirst: async () => { childQueried = true; return null; },
        update: async () => { childWritten = true; },
      },
    };
    const args = method === 'updateBankAccount'
      ? [db, COMPANY_A, EMPLOYEE_B, childId, { bankName: 'Test' }]
      : method === 'deleteBankAccount'
        ? [db, COMPANY_A, EMPLOYEE_B, childId]
        : [db, COMPANY_A, EMPLOYEE_B, childId];
    await assert.rejects(employees[method](...args), /NOT_FOUND/);
    assert.equal(childQueried, false);
    assert.equal(childWritten, false);
  });
}

test('payroll payslip retrieval requires a payroll run owned by the authenticated company', async () => {
  let payslipQueried = false;
  const db = {
    payroll_runs: { findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: RUN_A, company_id: COMPANY_A });
      return null;
    } },
    payslips: { findFirst: async () => { payslipQueried = true; return null; } },
  };
  await assert.rejects(payroll.getPayslip(db, RUN_A, EMPLOYEE_A, COMPANY_A), /NOT_FOUND/);
  assert.equal(payslipQueried, false);
});

test('payroll payslip retrieval filters the employee through the same company', async () => {
  let payslipWhere;
  const db = {
    payroll_runs: { findFirst: async () => ({ id: RUN_A, company_id: COMPANY_A }) },
    payslips: { findFirst: async ({ where }) => { payslipWhere = where; return null; } },
  };
  await assert.rejects(payroll.getPayslip(db, RUN_A, EMPLOYEE_A, COMPANY_A), /NOT_FOUND/);
  assert.deepEqual(payslipWhere, {
    payroll_run_id: RUN_A,
    employee_id: EMPLOYEE_A,
    employee: { company_id: COMPANY_A },
  });
});

test('payroll bonus creation refuses an employee outside the payroll company', async () => {
  let createCalled = false;
  const db = {
    payroll_runs: { findFirst: async () => ({ id: RUN_A, status: 'processed' }) },
    employees: { findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: EMPLOYEE_B, company_id: COMPANY_A, deleted_at: null });
      return null;
    } },
    payroll_bonuses: { create: async () => { createCalled = true; } },
  };
  await assert.rejects(payroll.addBonus(db, RUN_A, COMPANY_A, { employee_id: EMPLOYEE_B, amount: 500 }), /NOT_FOUND/);
  assert.equal(createCalled, false);
});

test('payroll bonus deletion binds the bonus to the company-owned run and employee', async () => {
  let deleteCalled = false;
  let bonusWhere;
  const db = {
    payroll_runs: { findFirst: async () => ({ id: RUN_A, status: 'processed' }) },
    payroll_bonuses: {
      findFirst: async ({ where }) => { bonusWhere = where; return null; },
      delete: async () => { deleteCalled = true; },
    },
  };
  await assert.rejects(payroll.removeBonus(db, 'bonus-b', RUN_A, COMPANY_A), /NOT_FOUND/);
  assert.deepEqual(bonusWhere, { id: 'bonus-b', payroll_run_id: RUN_A });
  assert.equal(deleteCalled, false);
});

test('payroll controller passes the tenant database to payslip and bonus service methods', () => {
  const controller = fs.readFileSync(path.join(__dirname, '../modules/payroll/payroll.controller.js'), 'utf8');
  assert.match(controller, /svc\.getPayslip\(req\.db,/);
  assert.match(controller, /svc\.updatePayslip\(req\.db,/);
  assert.match(controller, /svc\.removeBonus\(req\.db,/);
});

test('training detail only returns employees belonging to the authenticated company', async () => {
  let employeeWhere;
  const db = {
    trainings: {
      findFirst: async () => ({
        id: TRAINING_A,
        nominations: [{ id: 'nom-a', employee_id: EMPLOYEE_A }, { id: 'nom-b', employee_id: EMPLOYEE_B }],
        attendance: [{ id: 'att-a', employee_id: EMPLOYEE_A }, { id: 'att-b', employee_id: EMPLOYEE_B }],
        feedback: [],
      }),
    },
    employees: {
      findMany: async ({ where }) => {
        employeeWhere = where;
        return [{ id: EMPLOYEE_A, first_name: 'Employee', last_name: 'A', employee_code: 'A-1' }];
      },
    },
  };
  const result = await training.get(db, COMPANY_A, TRAINING_A);
  assert.deepEqual(employeeWhere, { id: { in: [EMPLOYEE_A, EMPLOYEE_B] }, company_id: COMPANY_A, deleted_at: null });
  assert.deepEqual(result.nominations.map(x => x.employee_id), [EMPLOYEE_A]);
  assert.deepEqual(result.attendance.map(x => x.employee_id), [EMPLOYEE_A]);
});

test('attendance controller returns 404 for a holiday outside the authenticated company', () => {
  const controller = fs.readFileSync(path.join(__dirname, '../modules/attendance/attendance.controller.js'), 'utf8');
  assert.match(controller, /if \(e\.message === 'NOT_FOUND'\) return sendError\(res, ERROR_CODES\.NOT_FOUND, 'Holiday not found\.', 404\)/);
});
