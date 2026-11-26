'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { extractTenantSubdomain } = require('../shared/middleware/tenant');

test('extracts managed Syntern tenant subdomains', () => {
  assert.equal(extractTenantSubdomain({ hostname: 'acme.syntern.in', headers: {} }), 'acme');
});

test('extracts local development tenant subdomains', () => {
  assert.equal(extractTenantSubdomain({ hostname: 'acme.localhost', headers: {} }), 'acme');
});

test('uses a validated explicit tenant header', () => {
  assert.equal(extractTenantSubdomain({ hostname: 'syntern.in', headers: { 'x-tenant-subdomain': 'Acme-India' } }), 'acme-india');
  assert.equal(extractTenantSubdomain({ hostname: 'syntern.in', headers: { 'x-tenant-subdomain': '../other' } }), null);
});

test('does not interpret platform roots, preview hosts or custom domains as subdomains', () => {
  assert.equal(extractTenantSubdomain({ hostname: 'syntern.in', headers: {} }), null);
  assert.equal(extractTenantSubdomain({ hostname: 'www.syntern.in', headers: {} }), null);
  assert.equal(extractTenantSubdomain({ hostname: 'preview.up.railway.app', headers: {} }), null);
  assert.equal(extractTenantSubdomain({ hostname: 'customer.example.com', headers: {} }), null);
});
