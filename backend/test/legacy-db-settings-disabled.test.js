'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const controller = require('../modules/settings/settings.controller');

function response() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

for (const [name, message] of [
  ['getDbConfig', 'Legacy database settings are disabled. Tenant storage is managed by secure platform provisioning.'],
  ['updateDbConfig', 'Legacy database settings are disabled. Contact support for tenant storage changes.'],
  ['testDbConnection', 'Direct database connection testing is disabled.'],
]) {
  test(`${name} fails closed without opening a database connection`, async () => {
    const req = {
      body: {
        dbMode: 'cloud',
        cloudDbUrl: 'postgresql://attacker.invalid:5432/probe',
        localDbHost: '127.0.0.1',
        localDbName: 'postgres',
      },
    };
    const res = response();

    await controller[name](req, res);

    assert.equal(res.statusCode, 410);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'LEGACY_DB_CONFIG_DISABLED');
    assert.equal(res.body.message, message);
  });
}
