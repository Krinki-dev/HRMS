'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeTenantSubdomain, normalizeCustomDomain } = require('../shared/utils/domainValidation');

test('tenant subdomains are normalized and constrained to DNS label rules', () => {
  assert.equal(normalizeTenantSubdomain(' Acme-India '), 'acme-india');
  assert.equal(normalizeTenantSubdomain('a'), 'a');
  assert.equal(normalizeTenantSubdomain('a'.repeat(63)), 'a'.repeat(63));
  assert.equal(normalizeTenantSubdomain('a'.repeat(64)), null);
  assert.equal(normalizeTenantSubdomain('-acme'), null);
  assert.equal(normalizeTenantSubdomain('acme-'), null);
  assert.equal(normalizeTenantSubdomain('acme.example'), null);
});

test('custom domains enforce DNS label and total hostname length limits', () => {
  assert.equal(normalizeCustomDomain(' HR.Example.COM '), 'hr.example.com');
  assert.equal(normalizeCustomDomain('a.b'), 'a.b');
  assert.equal(normalizeCustomDomain('a'.repeat(63) + '.example'), 'a'.repeat(63) + '.example');
  assert.equal(normalizeCustomDomain('a'.repeat(64) + '.example'), null);
  assert.equal(normalizeCustomDomain('bad-.example'), null);
  assert.equal(normalizeCustomDomain('-bad.example'), null);
  assert.equal(normalizeCustomDomain('singlelabel'), null);
  assert.equal(normalizeCustomDomain(['a'.repeat(63), 'b'.repeat(63), 'c'.repeat(63), 'd'.repeat(63), 'e'].join('.')), null);
});
