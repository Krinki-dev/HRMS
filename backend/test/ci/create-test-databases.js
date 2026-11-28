'use strict';

const { Client } = require('pg');

const adminUrl = process.env.CI_POSTGRES_ADMIN_URL;
if (!adminUrl) throw new Error('CI_POSTGRES_ADMIN_URL is required.');

const databases = ['hrms_central_test', 'hrms_tenant_test'];

(async () => {
  const client = new Client({ connectionString: adminUrl });
  await client.connect();
  try {
    for (const name of databases) {
      const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
      if (exists.rowCount === 0) {
        // Names are fixed constants from this file, never user input.
        await client.query(`CREATE DATABASE "${name}"`);
      }
    }
  } finally {
    await client.end();
  }
})().catch((error) => {
  console.error('[CI PostgreSQL setup] Failed to create test databases:', error);
  process.exitCode = 1;
});
