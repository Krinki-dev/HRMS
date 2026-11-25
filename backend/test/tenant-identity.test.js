'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveTenantIdentity, matchesTenantContext } = require('../shared/utils/tenantIdentity');

test('maps legacy tenantId claim to companyId, not Central tenantId', () => {
  const identity = resolveTenantIdentity({
    claims: { tenantId: 'company-legacy-id' },
    indexedTenantId: 'central-tenant-id',
  });
  assert.deepEqual(identity, {
    companyId: 'company-legacy-id',
    centralTenantId: 'central-tenant-id',
    tenantId: 'central-tenant-id',
  });
});

test('maps explicit company and Central tenant claims independently', () => {
  const identity = resolveTenantIdentity({
    claims: {
      companyId: 'company-id',
      tenantId: 'central-tenant-id',
      centralTenantId: 'central-tenant-id',
    },
  });
  assert.deepEqual(identity, {
    companyId: 'company-id',
    centralTenantId: 'central-tenant-id',
    tenantId: 'central-tenant-id',
  });
});

test('legacy token is not rebound to a request tenant without central index resolution', () => {
  const identity = resolveTenantIdentity({
    claims: { tenantId: 'old-company-id' },
  });
  assert.equal(identity.companyId, 'old-company-id');
  assert.equal(identity.tenantId, null);
});

test('does not promote a legacy company claim to a Central tenant without resolution', () => {
  const identity = resolveTenantIdentity({
    claims: { tenantId: 'company-id' },
  });
  assert.equal(identity.companyId, 'company-id');
  assert.equal(identity.centralTenantId, null);
  assert.equal(identity.tenantId, null);
});

test('tenant host must match the authenticated Central tenant', () => {
  const identity = { centralTenantId: 'tenant-a' };
  assert.equal(matchesTenantContext(identity, 'tenant-a'), true);
  assert.equal(matchesTenantContext(identity, 'tenant-b'), false);
  assert.equal(matchesTenantContext({ centralTenantId: null }, 'tenant-a'), false);
});

test('new company claim without Central tenant claim cannot be rebound by host', () => {
  const identity = resolveTenantIdentity({
    claims: { companyId: 'company-id' },
    indexedTenantId: null,
  });
  assert.equal(identity.companyId, 'company-id');
  assert.equal(identity.centralTenantId, null);
});
