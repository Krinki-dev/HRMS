const test = require('node:test');
const assert = require('node:assert/strict');
const { isPlatformRootHost, getHostnameLookup } = require('./domainRouting');

test('treats hrms.syntern.in as the main platform host', () => {
  assert.equal(isPlatformRootHost('hrms.syntern.in'), true);
  assert.equal(isPlatformRootHost('www.hrms.syntern.in'), true);
});

test('treats hrms.client-domain.com as a dedicated tenant host', () => {
  assert.equal(isPlatformRootHost('hrms.client-domain.com'), false);
  assert.equal(getHostnameLookup('hrms.client-domain.com'), 'hrms.client-domain.com');
});

test('normalizes www hostnames before lookup', () => {
  assert.equal(getHostnameLookup('www.hrms.client-domain.com'), 'hrms.client-domain.com');
});
