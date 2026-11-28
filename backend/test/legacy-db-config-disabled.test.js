'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const controller = require('../modules/settings/settings.controller');

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('legacy database configuration endpoints fail closed with HTTP 410', async () => {
  for (const name of ['getDbConfig', 'updateDbConfig', 'testDbConnection']) {
    const res = response();
    await controller[name]({ body: { cloudDbUrl: 'postgresql://127.0.0.1/test' } }, res);
    assert.equal(res.statusCode, 410, name);
    assert.equal(res.body.code, 'LEGACY_DB_CONFIG_DISABLED', name);
  }
});

test('legacy settings controller no longer opens direct database connections or reads/writes tenant_db_config', () => {
  const source = fs.readFileSync(path.join(__dirname, '../modules/settings/settings.controller.js'), 'utf8');
  assert.doesNotMatch(source, /new PrismaClient/);
  assert.doesNotMatch(source, /tenant_db_config/);
  assert.doesNotMatch(source, /sqlserver:\/\//i);
  assert.doesNotMatch(source, /cloudDbUrl/);
});

test('obsolete database settings tab is removed from the tenant settings UI', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/settings/SettingsPage.jsx'), 'utf8');
  assert.doesNotMatch(source, /function DatabaseTab\(/);
  assert.doesNotMatch(source, /id:\s*'database'/);
  assert.doesNotMatch(source, /tab === 'database'/);
});
