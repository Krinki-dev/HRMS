'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  findKycByHash,
  findKycById,
  createKycRecord,
  upsertKycRecord,
  linkKycToEmployee,
} = require('../shared/utils/centralDb');

test('KYC lookup and mutation APIs reject missing Central tenant identity', async () => {
  await assert.rejects(findKycByHash(null, 'aadhaar-hash'), /Central tenant ID is required/);
  await assert.rejects(findKycById(null, 'record-id'), /Central tenant ID is required/);
  await assert.rejects(createKycRecord(null, {}), /Central tenant ID is required/);
  await assert.rejects(upsertKycRecord(null, 'aadhaar-hash', {}), /Central tenant ID is required/);
  await assert.rejects(linkKycToEmployee(null, 'record-id', 'employee-id'), /Central tenant ID is required/);
});
