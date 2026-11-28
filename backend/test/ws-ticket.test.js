'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { issueTicket, consumeTicket } = require('../shared/utils/wsTicket');

test('WebSocket ticket carries verified user, tenant and company identity once', () => {
  const identity = {
    userId: 'user-a',
    tenantId: 'tenant-a',
    companyId: 'company-a',
  };
  const ticket = issueTicket(identity);

  assert.equal(typeof ticket, 'string');
  assert.deepEqual(consumeTicket(ticket), identity);
  assert.equal(consumeTicket(ticket), null, 'ticket must be single-use');
});

test('WebSocket ticket refuses identities without a verified tenant and company', () => {
  assert.throws(
    () => issueTicket({ userId: 'platform-admin', tenantId: null, companyId: null }),
    /tenantId and companyId are required/
  );
});

test('WebSocket ticket refuses missing or invalid user identity', () => {
  assert.throws(() => issueTicket(), /Verified userId, tenantId and companyId are required/);
  assert.throws(() => issueTicket({ userId: 'user-a', tenantId: '' }), /tenantId/);
  assert.throws(() => issueTicket({ userId: 'user-a', companyId: '' }), /companyId/);
});
