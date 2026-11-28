'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../modules/performance/performance.service');

const companyA = 'company-a';
const cycleB = 'cycle-b';
const employeeB = 'employee-b';

test('cycle activation refuses a cycle owned by another company before changing any cycle', async () => {
  let updateManyCalled = false;
  const db = {
    appraisal_cycles: {
      findFirst: async () => null,
      updateMany: async () => { updateManyCalled = true; },
    },
  };
  await assert.rejects(service.activateCycle(db, companyA, cycleB), /CYCLE_NOT_FOUND/);
  assert.equal(updateManyCalled, false);
});

test('goal creation rejects a cycle outside the employee company', async () => {
  let createCalled = false;
  const db = {
    employees: { findFirst: async () => ({ id: 'employee-a' }) },
    appraisal_cycles: { findFirst: async () => null },
    performance_goals: { create: async () => { createCalled = true; } },
  };
  await assert.rejects(
    service.createGoal(db, companyA, 'employee-a', { cycleId: cycleB, title: 'Goal' }),
    /CYCLE_NOT_FOUND/
  );
  assert.equal(createCalled, false);
});

test('my-goal listing rejects an employee from another company', async () => {
  let queryCalled = false;
  const db = {
    employees: { findFirst: async () => null },
    performance_goals: { findMany: async () => { queryCalled = true; return []; } },
  };
  await assert.rejects(service.listMyGoals(db, companyA, employeeB), /NOT_FOUND/);
  assert.equal(queryCalled, false);
});

test('manager appraisal rejects a cross-company employee before writing', async () => {
  let createCalled = false;
  const db = {
    users: { findFirst: async () => ({ id: 'manager-a' }) },
    employees: { findFirst: async () => null },
    appraisal_cycles: { findFirst: async () => ({ id: 'cycle-a' }) },
    appraisals: { findFirst: async () => null, create: async () => { createCalled = true; } },
  };
  await assert.rejects(
    service.submitManagerAppraisal(db, companyA, 'manager-a', { employeeId: employeeB }),
    /NOT_FOUND/
  );
  assert.equal(createCalled, false);
});

test('appraisal finalization rejects an appraisal from another company', async () => {
  let updateCalled = false;
  const db = {
    appraisals: {
      findFirst: async () => null,
      update: async () => { updateCalled = true; },
    },
  };
  await assert.rejects(service.finalizeAppraisal(db, companyA, 'appraisal-b', {}), /NOT_FOUND/);
  assert.equal(updateCalled, false);
});

test('team appraisal query requires the selected cycle to belong to the company', async () => {
  let appraisalsQueried = false;
  const db = {
    appraisal_cycles: { findFirst: async () => null },
    appraisals: { findMany: async () => { appraisalsQueried = true; return []; } },
  };
  await assert.rejects(service.getTeamAppraisals(db, companyA, cycleB), /CYCLE_NOT_FOUND/);
  assert.equal(appraisalsQueried, false);
});
