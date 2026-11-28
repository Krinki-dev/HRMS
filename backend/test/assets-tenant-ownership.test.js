'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../modules/assets/assets.service');

const companyA = 'company-a';
const assetA = 'asset-a';
const employeeB = 'employee-b';

test('asset allocation rejects an employee from another company', async () => {
  let createCalled = false;
  const db = {
    assets: {
      findFirst: async () => ({ id: assetA, company_id: companyA, status: 'available', condition: 'good' }),
      update: async () => {},
    },
    employees: { findFirst: async ({ where }) => {
      assert.equal(where.company_id, companyA);
      return null;
    } },
    asset_allocations: { create: async () => { createCalled = true; } },
  };
  await assert.rejects(
    service.allocate(db, companyA, assetA, { employeeId: employeeB }),
    /NOT_FOUND/
  );
  assert.equal(createCalled, false);
});

test('asset deletion refuses an asset owned by another company', async () => {
  let allocationQueried = false;
  let updateCalled = false;
  const db = {
    assets: {
      findFirst: async ({ where }) => {
        assert.equal(where.company_id, companyA);
        return null;
      },
      update: async () => { updateCalled = true; },
    },
    asset_allocations: { findFirst: async () => { allocationQueried = true; return null; } },
  };
  await assert.rejects(service.remove(db, companyA, assetA), /NOT_FOUND/);
  assert.equal(allocationQueried, false);
  assert.equal(updateCalled, false);
});

test('asset return refuses an asset owned by another company', async () => {
  let allocationQueried = false;
  const db = {
    assets: { findFirst: async () => null },
    asset_allocations: { findFirst: async () => { allocationQueried = true; return null; } },
  };
  await assert.rejects(service.returnAsset(db, companyA, assetA, {}), /NOT_FOUND/);
  assert.equal(allocationQueried, false);
});

test('employee asset history verifies employee company and filters parent assets', async () => {
  let allocationsQueried = false;
  const db = {
    employees: { findFirst: async ({ where }) => {
      assert.equal(where.company_id, companyA);
      return null;
    } },
    asset_allocations: { findMany: async () => { allocationsQueried = true; return []; } },
  };
  await assert.rejects(service.byEmployee(db, companyA, employeeB), /NOT_FOUND/);
  assert.equal(allocationsQueried, false);
});
