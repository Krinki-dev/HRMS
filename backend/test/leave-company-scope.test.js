'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const leaveService = require('../modules/leave/leave.service');

const COMPANY_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const COMPANY_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const EMPLOYEE_A = '11111111-1111-4111-8111-111111111111';

function baseDb(overrides = {}) {
  return {
    employees: {
      findFirst: async () => ({ id: EMPLOYEE_A, reporting_to: null }),
      ...overrides.employees,
    },
    leave_applications: {
      findMany: async () => [],
      findFirst: async () => null,
      count: async () => 0,
      ...overrides.leave_applications,
    },
    leave_balances: {
      findMany: async () => [],
      ...overrides.leave_balances,
    },
    leave_types: {
      findFirst: async () => null,
      update: async () => ({}),
      ...overrides.leave_types,
    },
    employee_shifts: { findFirst: async () => null },
    holidays: { findMany: async () => [] },
  };
}

test('self-service applications query is constrained to the authenticated employee and company', async () => {
  let query;
  const db = baseDb({
    leave_applications: {
      findMany: async (args) => { query = args; return []; },
    },
  });
  await leaveService.myApplications(db, EMPLOYEE_A, COMPANY_A, {});
  assert.deepEqual(query.where, {
    employee_id: EMPLOYEE_A,
    employee: { company_id: COMPANY_A },
  });
});

test('self-service balances query is constrained to the authenticated employee and company', async () => {
  let query;
  const db = baseDb({
    leave_balances: {
      findMany: async (args) => { query = args; return []; },
    },
  });
  await leaveService.getBalances(db, EMPLOYEE_A, COMPANY_A, 2026);
  assert.equal(query.where.employee_id, EMPLOYEE_A);
  assert.equal(query.where.employee.company_id, COMPANY_A);
});

test('dashboard non-HR team queries are restricted to direct reports in the same company', async () => {
  const calls = [];
  const db = baseDb({
    leave_applications: {
      findMany: async (args) => { calls.push(args.where); return []; },
      count: async (args) => { calls.push(args.where); return 0; },
    },
  });
  await leaveService.dashboard(db, EMPLOYEE_A, COMPANY_A, false);
  const teamScopes = calls.filter(where => where.employee);
  assert.equal(teamScopes.length, 2);
  for (const where of teamScopes) {
    assert.equal(where.employee.company_id, COMPANY_A);
    assert.equal(where.employee.reporting_to, EMPLOYEE_A);
  }
});

test('cross-company employee IDs are rejected before self-service queries', async () => {
  const db = baseDb({
    employees: { findFirst: async () => null },
    leave_applications: {
      findMany: async () => { throw new Error('query must not execute'); },
    },
  });
  await assert.rejects(
    leaveService.myApplications(db, EMPLOYEE_A, COMPANY_B, {}),
    /NOT_FOUND/
  );
});

test('leave type deletion refuses a record owned by another company', async () => {
  let updateCalled = false;
  const db = baseDb({
    leave_types: {
      findFirst: async () => null,
      update: async () => { updateCalled = true; },
    },
  });
  await assert.rejects(
    leaveService.deleteLeaveType(db, 'foreign-leave-type', COMPANY_A),
    /NOT_FOUND/
  );
  assert.equal(updateCalled, false);
});

test('company-wide leave listing requires the leave.view permission middleware', () => {
  const routes = fs.readFileSync(path.join(__dirname, '../modules/leave/leave.routes.js'), 'utf8');
  assert.match(routes, /router\.get\('\/',\s*checkPermission\('leave', 'view'\),\s*ctrl\.list\)/);
  assert.match(routes, /router\.get\('\/my',\s*ctrl\.myApplications\)/);
});

test('non-HR dashboard does not accept another employee ID from the query string', () => {
  const controller = fs.readFileSync(path.join(__dirname, '../modules/leave/leave.controller.js'), 'utf8');
  assert.match(controller, /req\.user\.employeeId \|\| \(isHR \? req\.query\.employeeId : null\)/);
});
