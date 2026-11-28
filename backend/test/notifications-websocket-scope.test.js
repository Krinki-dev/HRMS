'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const notifications = require('../modules/notifications/notifications.service');

function socket() {
  const ws = new EventEmitter();
  ws.readyState = 1;
  ws.messages = [];
  ws.send = (message) => ws.messages.push(JSON.parse(message));
  return ws;
}

test('company broadcast reaches only sockets with the exact tenant and company pair', () => {
  const companyA = socket();
  const companyB = socket();
  const sameCompanyOtherTenant = socket();

  notifications.register({ userId: 'user-a', tenantId: 'tenant-a', companyId: 'company-a' }, companyA);
  notifications.register({ userId: 'user-b', tenantId: 'tenant-a', companyId: 'company-b' }, companyB);
  notifications.register({ userId: 'user-c', tenantId: 'tenant-c', companyId: 'company-a' }, sameCompanyOtherTenant);

  notifications.pushToCompany('tenant-a', 'company-a', { type: 'announcement' });

  assert.equal(companyA.messages.length, 1);
  assert.equal(companyA.messages[0]._broadcast, true);
  assert.equal(companyB.messages.length, 0);
  assert.equal(sameCompanyOtherTenant.messages.length, 0);

  companyA.emit('close');
  companyB.emit('close');
  sameCompanyOtherTenant.emit('close');
});

test('user notification requires and matches the verified tenant/company pair', () => {
  const tenantA = socket();
  const tenantB = socket();

  notifications.register({ userId: 'same-user-id', tenantId: 'tenant-a', companyId: 'company-a' }, tenantA);
  notifications.register({ userId: 'same-user-id', tenantId: 'tenant-b', companyId: 'company-b' }, tenantB);

  notifications.pushToUser('same-user-id', { type: 'private' }, 'tenant-a', 'company-a');
  notifications.pushToUser('same-user-id', { type: 'unsafe' }, null, 'company-a');

  assert.equal(tenantA.messages.length, 1);
  assert.equal(tenantB.messages.length, 0);

  tenantA.emit('close');
  tenantB.emit('close');
});

test('company broadcast without tenant identity fails closed', () => {
  const ws = socket();
  notifications.register({ userId: 'user-a', tenantId: 'tenant-a', companyId: 'company-a' }, ws);

  notifications.pushToCompany(null, 'company-a', { type: 'must-not-broadcast' });

  assert.equal(ws.messages.length, 0);
  ws.emit('close');
});
