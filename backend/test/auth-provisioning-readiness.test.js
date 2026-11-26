'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const authSource = fs.readFileSync(path.join(__dirname, '../modules/auth/auth.service.js'), 'utf8');
const platformSource = fs.readFileSync(path.join(__dirname, '../modules/platform/platform.service.js'), 'utf8');

test('email, phone and employee lookups only expose active tenants with ready storage', () => {
  for (const field of ['ui.email', 'ui.phone', 'ui.employee_id']) {
    const queryStart = authSource.indexOf(`WHERE ${field} =`);
    assert.notEqual(queryStart, -1, `missing lookup for ${field}`);
    const queryEnd = authSource.indexOf('`', queryStart);
    const query = authSource.slice(queryStart, queryEnd);
    assert.match(query, /t\.is_active = true/);
    assert.match(query, /t\.storage_status = 'ready'/);
    assert.match(query, /t\.deleted_at IS NULL/);
  }
});

test('admin-email fallback excludes inactive or still-provisioning tenants', () => {
  const start = authSource.indexOf('SELECT id, name, subdomain, logo_url, is_active, plan');
  const query = authSource.slice(start, authSource.indexOf('`', start));
  assert.match(query, /is_active = true/);
  assert.match(query, /storage_status = 'ready'/);
  assert.match(query, /deleted_at IS NULL/);
});

test('new tenant user-index row stays inactive until operational seeding succeeds', () => {
  assert.match(platformSource, /\$\{tenantId\}::uuid, \$\{adminUserId\}::uuid, false, false, NOW\(\)/);
  const failureGuard = platformSource.indexOf('if (!schemaProvisioned || !seedSucceeded)');
  const activation = platformSource.indexOf('UPDATE central_user_index');
  assert.ok(failureGuard >= 0 && activation > failureGuard);
  assert.match(platformSource.slice(activation, activation + 300), /SET is_active = true/);
});

test('OTP generation uses cryptographically secure randomness', () => {
  assert.match(authSource, /crypto\.randomInt\(100000, 1000000\)/);
  assert.doesNotMatch(authSource, /Math\.random\(\)/);
});

test('signup database preflight errors do not disclose raw connection details', () => {
  assert.match(platformSource, /TENANT_DATABASE_PREFLIGHT_FAILED/);
  assert.match(platformSource, /Check the database settings and installation/);
  assert.doesNotMatch(platformSource, /DB connection or schema check failed: \$\{e\.message\}/);
});

test('signup preflight verifies the minimum launch schema before marking storage ready', () => {
  for (const table of [
    'companies', 'roles', 'users', 'employees', 'departments', 'designations',
    'attendance', 'leave_types', 'leave_balances', 'leave_applications',
    'otp_store', 'audit_logs',
  ]) {
    assert.match(platformSource, new RegExp(`to_regclass\\('public\\.${table}'\\)`));
  }
  assert.match(platformSource, /missingTables\.length > 0/);
  assert.match(platformSource, /TENANT_SCHEMA_NOT_INSTALLED/);
});

test('company, Super Admin role and admin user are seeded in one operational transaction', () => {
  const seedStart = platformSource.indexOf('Keep company, role and admin creation atomic');
  const seedEnd = platformSource.indexOf('seedSucceeded = true', seedStart);
  assert.ok(seedStart >= 0 && seedEnd > seedStart);
  const seedBlock = platformSource.slice(seedStart, seedEnd);
  assert.match(seedBlock, /tenantPrisma\.\$transaction\(async \(tx\) =>/);
  assert.equal((seedBlock.match(/tx\.\$executeRaw/g) || []).length, 3);
  assert.match(seedBlock, /INSERT INTO companies/);
  assert.match(seedBlock, /INSERT INTO roles/);
  assert.match(seedBlock, /INSERT INTO users/);
});

test('role permissions are inserted using the Prisma schema text type', () => {
  const roleInsertStart = platformSource.indexOf('INSERT INTO roles (id, company_id, name, description, permissions');
  const roleInsertEnd = platformSource.indexOf('`;', roleInsertStart);
  const roleInsert = platformSource.slice(roleInsertStart, roleInsertEnd);
  assert.match(roleInsert, /\$\{permissions\}/);
  assert.doesNotMatch(roleInsert, /::jsonb/);
});

test('failed tenant seeding records an inactive failed lifecycle state', () => {
  const failureStart = platformSource.indexOf('if (!schemaProvisioned || !seedSucceeded)');
  const activationStart = platformSource.indexOf('UPDATE tenants', failureStart);
  const failureEnd = platformSource.indexOf('const portalUrl', failureStart);
  const failureBlock = platformSource.slice(failureStart, failureEnd);
  assert.ok(failureStart >= 0 && activationStart > failureStart);
  assert.match(failureBlock, /storage_status = 'failed'/);
  assert.match(failureBlock, /storage_error_code = 'TENANT_SEED_FAILED'/);
  assert.match(failureBlock, /is_active = false/);
  assert.match(failureBlock, /TENANT_PROVISIONING_FAILED/);
});
