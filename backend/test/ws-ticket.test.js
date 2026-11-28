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

test('WebSocket ticket permits a platform identity without operational company scope', () => {
  const ticket = issueTicket({ userId: 'platform-admin', tenantId: null, companyId: null });
  assert.deepEqual(consumeTicket(ticket), {
    userId: 'platform-admin',
    tenantId: null,
    companyId: null,
  });
});

test('WebSocket ticket refuses missing or invalid user identity', () => {
  assert.throws(() => issueTicket(), /userId is required/);
  assert.throws(() => issueTicket({ userId: 'user-a', tenantId: '' }), /tenantId/);
  assert.throws(() => issueTicket({ userId: 'user-a', companyId: '' }), /companyId/);
});
