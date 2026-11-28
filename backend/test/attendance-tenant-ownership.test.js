'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../modules/attendance/attendance.service');

const companyA = 'company-a';
const employeeB = 'employee-b';

test('check-in rejects an employee outside the authenticated company', async () => {
  let attendanceQueried = false;
  const db = {
    employees: { findFirst: async () => null },
    attendance: { findFirst: async () => { attendanceQueried = true; return null; } },
  };
  await assert.rejects(service.checkIn(db, companyA, employeeB), /NOT_FOUND/);
  assert.equal(attendanceQueried, false);
});

test('check-in does not persist location or IP until a privacy policy is approved', async () => {
  let created;
  const db = {
    employees: { findFirst: async () => ({ id: 'employee-a' }) },
    attendance: {
      findFirst: async () => null,
      upsert: async (args) => { created = args.create; },
    },
    employee_shifts: { findFirst: async () => null },
  };
  await service.checkIn(db, companyA, 'employee-a');
  assert.equal(created.location_lat, null);
  assert.equal(created.location_lng, null);
  assert.equal(created.ip_address, null);
});

test('check-out rejects an employee outside the authenticated company', async () => {
  let attendanceQueried = false;
  const db = {
    employees: { findFirst: async () => null },
    attendance: { findFirst: async () => { attendanceQueried = true; return null; } },
  };
  await assert.rejects(service.checkOut(db, companyA, employeeB), /NOT_FOUND/);
  assert.equal(attendanceQueried, false);
});


test('bulk attendance marking skips employees outside the company', async () => {
  let upsertCalled = false;
  const db = {
    employees: { findFirst: async () => null },
    attendance: { upsert: async () => { upsertCalled = true; } },
    audit_logs: { create: async () => {} },
  };
  const result = await service.bulkMark(db, companyA, 'manager-a', {
    date: new Date().toISOString().slice(0, 10),
    records: [{ employeeId: employeeB, status: 'present' }],
  });
  assert.equal(result.saved, 0);
  assert.equal(result.errors.length, 1);
  assert.equal(upsertCalled, false);
});

test('regularization submission rejects an employee outside the company', async () => {
  let createCalled = false;
  const db = {
    employees: { findFirst: async () => null },
    regularization_requests: {
      findFirst: async () => null,
      create: async () => { createCalled = true; },
    },
  };
  await assert.rejects(
    service.submitRegularization(db, employeeB, companyA, {
      date: '2026-11-28',
      reason: 'Please correct my attendance',
    }),
    /NOT_FOUND/
  );
  assert.equal(createCalled, false);
});

test('regularization rejection refuses a request owned by another company', async () => {
  let updateCalled = false;
  const db = {
    regularization_requests: {
      findFirst: async ({ where }) => {
        assert.equal(where.company_id, companyA);
        return null;
      },
      update: async () => { updateCalled = true; },
    },
  };
  await assert.rejects(
    service.rejectRegularization(db, 'request-b', companyA, 'manager-a', 'Invalid'),
    /NOT_FOUND/
  );
  assert.equal(updateCalled, false);
});

test('today attendance rejects an employee outside the authenticated company', async () => {
  let attendanceQueried = false;
  const db = {
    employees: { findFirst: async () => null },
    attendance: { findFirst: async () => { attendanceQueried = true; return null; } },
  };
  await assert.rejects(service.getToday(db, employeeB, companyA), /NOT_FOUND/);
  assert.equal(attendanceQueried, false);
});
