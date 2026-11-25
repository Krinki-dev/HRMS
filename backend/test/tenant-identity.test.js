'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveTenantIdentity, matchesTenantContext } = require('../shared/utils/tenantIdentity');
const { resolveCompanyId, resolveCentralTenantId } = require('../shared/utils/tenantResolver');

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
  assert.equal(matchesTenantContext(identity, 'untrusted-request-tenant-id'), false);
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


test('operational resolver returns companyId, never Central tenantId', () => {
  assert.equal(resolveCompanyId({
    user: { companyId: 'company-id', centralTenantId: 'central-tenant-id', tenantId: 'central-tenant-id' },
    tenant: { id: 'central-tenant-id' },
  }), 'company-id');
});

test('Central resolver returns tenants.id, never operational companyId', () => {
  assert.equal(resolveCentralTenantId({
    user: { companyId: 'company-id', centralTenantId: 'central-tenant-id', tenantId: 'central-tenant-id' },
    tenant: { id: 'central-tenant-id' },
  }), 'central-tenant-id');
});

test('operational and Central resolvers fail closed when their own identity is absent', () => {
  assert.throws(() => resolveCompanyId({ user: { centralTenantId: 'central-tenant-id' } }), {
    code: 'COMPANY_CONTEXT_REQUIRED',
  });
  assert.throws(() => resolveCentralTenantId({ user: { companyId: 'company-id' } }), {
    code: 'TENANT_REQUIRED',
  });
});


test('platform admins use the explicitly selected Central tenant context', () => {
  assert.equal(resolveCentralTenantId({
    user: { is_platform_admin: true, centralTenantId: 'admin-home-tenant' },
    tenant: { id: 'selected-tenant-id' },
  }), 'selected-tenant-id');
});

test('ordinary tenant users cannot override their token Central tenant through request context', () => {
  assert.equal(resolveCentralTenantId({
    user: { is_platform_admin: false, centralTenantId: 'token-tenant-id' },
    tenant: { id: 'other-tenant-id' },
  }), 'token-tenant-id');
});
