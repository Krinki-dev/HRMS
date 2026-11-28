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

test('today attendance rejects an employee outside the authenticated company', async () => {
  let attendanceQueried = false;
  const db = {
    employees: { findFirst: async () => null },
    attendance: { findFirst: async () => { attendanceQueried = true; return null; } },
  };
  await assert.rejects(service.getToday(db, employeeB, companyA), /NOT_FOUND/);
  assert.equal(attendanceQueried, false);
});
