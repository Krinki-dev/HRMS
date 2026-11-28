'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');

const { issueTicket, consumeTicket } = require('../shared/utils/wsTicket');
const notifications = require('../modules/notifications/notifications.service');

class FakeSocket extends EventEmitter {
  constructor() {
    super();
    this.readyState = 1;
    this.messages = [];
  }
  send(message) {
    this.messages.push(JSON.parse(message));
  }
}

test('WebSocket tickets preserve verified tenant/company identity and are single-use', () => {
  const identity = {
    userId: 'user-a',
    tenantId: 'tenant-a',
    companyId: 'company-a',
  };
  const ticket = issueTicket(identity);
  assert.deepEqual(consumeTicket(ticket), identity);
  assert.equal(consumeTicket(ticket), null);
});

test('WebSocket tickets reject incomplete tenant identity', () => {
  assert.throws(() => issueTicket({ userId: 'user-a' }), /userId, tenantId and companyId/);
  assert.throws(() => issueTicket({ userId: 'user-a', tenantId: 'tenant-a' }), /userId, tenantId and companyId/);
});

test('company broadcasts reach only sockets in the exact tenant and company', () => {
  const companyASocket = new FakeSocket();
  const sameCompanyOtherUserSocket = new FakeSocket();
  const companyBSocket = new FakeSocket();

  notifications.register({ userId: 'shared-user-id', tenantId: 'tenant-a', companyId: 'company-a' }, companyASocket);
  notifications.register({ userId: 'other-user', tenantId: 'tenant-a', companyId: 'company-a' }, sameCompanyOtherUserSocket);
  notifications.register({ userId: 'shared-user-id', tenantId: 'tenant-b', companyId: 'company-b' }, companyBSocket);

  notifications.pushToCompany('tenant-a', 'company-a', { type: 'announcement', title: 'Company A only' });

  assert.equal(companyASocket.messages.length, 1);
  assert.equal(sameCompanyOtherUserSocket.messages.length, 1);
  assert.equal(companyBSocket.messages.length, 0);
  assert.equal(companyASocket.messages[0].title, 'Company A only');
  assert.equal(companyASocket.messages[0]._broadcast, true);

  companyASocket.emit('close');
  sameCompanyOtherUserSocket.emit('close');
  companyBSocket.emit('close');
});

test('user notifications are also restricted to the matching tenant and company', () => {
  const tenantASocket = new FakeSocket();
  const tenantBSocket = new FakeSocket();

  notifications.register({ userId: 'same-user', tenantId: 'tenant-a', companyId: 'company-a' }, tenantASocket);
  notifications.register({ userId: 'same-user', tenantId: 'tenant-b', companyId: 'company-b' }, tenantBSocket);

  notifications.pushToUser('same-user', { type: 'private', title: 'Tenant B' }, 'tenant-b', 'company-b');

  assert.equal(tenantASocket.messages.length, 0);
  assert.equal(tenantBSocket.messages.length, 1);
  assert.equal(tenantBSocket.messages[0].title, 'Tenant B');

  tenantASocket.emit('close');
  tenantBSocket.emit('close');
});

test('company broadcasts fail closed when tenant or company context is missing', () => {
  const socket = new FakeSocket();
  notifications.register({ userId: 'user-a', tenantId: 'tenant-a', companyId: 'company-a' }, socket);

  notifications.pushToCompany(null, 'company-a', { title: 'must not broadcast' });
  notifications.pushToCompany('tenant-a', null, { title: 'must not broadcast' });

  assert.equal(socket.messages.length, 0);
  socket.emit('close');
});
