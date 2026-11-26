'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(path.join(__dirname, '../db-migrations/20261126_tenant_provisioning_leases.sql'), 'utf8');
const prismaSchema = fs.readFileSync(path.join(__dirname, '../prisma/central.prisma'), 'utf8');
const sqlBaseline = fs.readFileSync(path.join(__dirname, '../prisma/central_schema.sql'), 'utf8');

test('provisioning lease migration is additive and Central-database scoped', () => {
  assert.match(migration, /CENTRAL \/ PLATFORM PostgreSQL database only/i);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS storage_lease_token UUID/i);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS storage_lease_expires_at TIMESTAMPTZ/i);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS provisioning_attempts INTEGER NOT NULL DEFAULT 0/i);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_tenants_provisioning_lease_expiry/i);
  assert.match(migration, /BEGIN;/);
  assert.match(migration, /COMMIT;/);
});

test('provisioning attempt counter cannot become negative', () => {
  assert.match(migration, /CHECK \(provisioning_attempts >= 0\)/);
  assert.match(sqlBaseline, /CHECK \(provisioning_attempts >= 0\)/);
});

test('Central Prisma model and fresh-install SQL baseline contain matching lease fields', () => {
  for (const field of ['storage_lease_token', 'storage_lease_expires_at', 'provisioning_attempts']) {
    assert.match(prismaSchema, new RegExp('\\b' + field + '\\b'));
    assert.match(sqlBaseline, new RegExp('\\b' + field + '\\b'));
  }
  assert.match(prismaSchema, /storage_lease_token\s+String\?\s+@db\.Uuid/);
  assert.match(prismaSchema, /storage_lease_expires_at\s+DateTime\?\s+@db\.Timestamptz/);
  assert.match(prismaSchema, /provisioning_attempts\s+Int\s+@default\(0\)/);
});

test('lease schema migration does not silently retry, activate, or delete tenants', () => {
  assert.doesNotMatch(migration, /UPDATE\s+(?:public\.)?tenants\s+SET\s+storage_status\s*=\s*'ready'/i);
  assert.doesNotMatch(migration, /SET\s+is_active\s*=\s*true/i);
  assert.doesNotMatch(migration, /DELETE\s+FROM\s+(?:public\.)?tenants/i);
});
