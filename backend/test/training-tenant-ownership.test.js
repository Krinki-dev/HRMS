'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../modules/training/training.service');

const companyA = 'company-a';
const trainingA = 'training-a';
const employeeA = 'employee-a';
const employeeB = 'employee-b';

test('training deletion refuses a training owned by another company', async () => {
  let updateCalled = false;
  const db = {
    trainings: {
      findFirst: async ({ where }) => {
        assert.deepEqual(where, { id: trainingA, company_id: companyA, deleted_at: null });
        return null;
      },
      update: async () => { updateCalled = true; },
    },
  };
  await assert.rejects(service.remove(db, companyA, trainingA), /NOT_FOUND/);
  assert.equal(updateCalled, false);
});

test('training nominations reject employees outside the training company', async () => {
  let createCalled = false;
  const db = {
    trainings: { findFirst: async () => ({ id: trainingA }) },
    employees: { findMany: async ({ where }) => {
      assert.equal(where.company_id, companyA);
      return [];
    } },
    training_nominations: {
      findFirst: async () => null,
      create: async () => { createCalled = true; },
    },
  };
  await assert.rejects(
    service.nominate(db, companyA, trainingA, { employeeIds: [employeeB], nominatedBy: 'manager-a' }),
    /NOT_FOUND/
  );
  assert.equal(createCalled, false);
});

test('attendance marking rejects a cross-company employee before writing', async () => {
  let writeCalled = false;
  const db = {
    trainings: { findFirst: async () => ({ id: trainingA }) },
    employees: { findMany: async () => [] },
    training_attendance: {
      findFirst: async () => null,
      create: async () => { writeCalled = true; },
      update: async () => { writeCalled = true; },
    },
    trainingsUpdate: async () => { writeCalled = true; },
  };
  await assert.rejects(
    service.markAttendance(db, companyA, trainingA, [{ employeeId: employeeB, attended: true }]),
    /NOT_FOUND/
  );
  assert.equal(writeCalled, false);
});

test('feedback cannot be submitted for a training or employee outside the company', async () => {
  let createCalled = false;
  const db = {
    trainings: { findFirst: async () => ({ id: trainingA }) },
    employees: { findFirst: async () => null },
    training_feedback: {
      findFirst: async () => null,
      create: async () => { createCalled = true; },
    },
  };
  await assert.rejects(
    service.submitFeedback(db, companyA, trainingA, employeeB, { overallRating: 5 }),
    /NOT_FOUND/
  );
  assert.equal(createCalled, false);
});

test('employee training history is restricted to the authenticated company', async () => {
  const db = {
    employees: { findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: employeeB, company_id: companyA });
      return null;
    } },
    training_nominations: { findMany: async () => { throw new Error('must not query nominations'); } },
  };
  await assert.rejects(service.myTrainings(db, companyA, employeeB), /NOT_FOUND/);
});
