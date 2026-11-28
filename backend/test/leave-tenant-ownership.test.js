'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const service = require('../modules/leave/leave.service');
const routes = fs.readFileSync(path.join(__dirname, '../modules/leave/leave.routes.js'), 'utf8');

const companyA = 'company-a';
const employeeB = 'employee-b';

test('leave history refuses an employee outside the authenticated company', async () => {
  let queried = false;
  const db = {
    employees: { findFirst: async () => null },
    leave_applications: { findMany: async () => { queried = true; return []; } },
  };
  await assert.rejects(service.myApplications(db, employeeB, companyA), /NOT_FOUND/);
  assert.equal(queried, false);
});

test('leave balance lookup refuses an employee outside the authenticated company', async () => {
  let queried = false;
  const db = {
    employees: { findFirst: async () => null },
    leave_balances: { findMany: async () => { queried = true; return []; } },
  };
  await assert.rejects(service.getBalances(db, employeeB, companyA, 2026), /NOT_FOUND/);
  assert.equal(queried, false);
});

test('leave cancellation refuses cross-company employee/application identifiers', async () => {
  let queried = false;
  const db = {
    employees: { findFirst: async () => null },
    leave_applications: { findFirst: async () => { queried = true; return null; } },
  };
  await assert.rejects(service.cancelLeave(db, 'application-b', employeeB, companyA), /NOT_FOUND/);
  assert.equal(queried, false);
});

test('leave type deletion scopes the type to the company before update', async () => {
  let updateCalled = false;
  const db = {
    leave_types: {
      findFirst: async ({ where }) => {
        assert.equal(where.company_id, companyA);
        return null;
      },
      update: async () => { updateCalled = true; },
    },
  };
  await assert.rejects(service.deleteLeaveType(db, 'leave-type-b', companyA), /NOT_FOUND/);
  assert.equal(updateCalled, false);
});

test('company-wide leave balances are filtered through employee ownership', async () => {
  let query;
  const db = {
    leave_balances: { findMany: async (args) => { query = args; return []; } },
  };
  await service.getAllBalances(db, companyA, 2026);
  assert.deepEqual(query.where.employee, { company_id: companyA, deleted_at: null });
});

test('leave list and calendar routes require the view permission', () => {
  assert.match(routes, /router\.get\('\/',\s*checkPermission\('leave', 'view'\)/);
  assert.match(routes, /router\.get\('\/calendar',\s*checkPermission\('leave', 'view'\)/);
});

test('leave encashment stays disabled until a server-side valuation policy is configured', async () => {
  await assert.rejects(service.encashLeave({}, employeeB, companyA, { perDayValue: 999999 }), /ENCASHMENT_POLICY_REQUIRED/);
});
