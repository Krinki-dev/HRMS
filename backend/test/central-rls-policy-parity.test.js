'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const centralPrisma = fs.readFileSync(path.join(root, 'prisma/central.prisma'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'db-migrations/20261128_central_rls_policy_completion.sql'), 'utf8');
const bootstrap = fs.readFileSync(path.join(root, 'prisma/central_schema.sql'), 'utf8');

const centralTables = [
  'tenants',
  'backup_config',
  'tenant_db_config',
  'tenant_modules',
  'central_user_index',
  'tenant_branch_links',
  'central_kyc_records',
  'central_gst_records',
  'platform_settings',
  'tenant_pricing_configs',
  'invoices',
  'payment_orders',
  'payment_webhook_events',
  'billing_events',
  'company_documents',
  'company_document_reviews',
  'tenant_migration_jobs',
];

test('Central Prisma models match the expected 17-table RLS inventory', () => {
  const models = [...centralPrisma.matchAll(/model\s+(\w+)\s*\{/g)].map((match) => match[1]);
  assert.equal(models.length, 17);
  for (const table of centralTables) assert.ok(models.includes(table), `missing Prisma model ${table}`);
});

test('every Central table has RLS enabled and an explicit policy in the migration', () => {
  for (const table of centralTables) {
    assert.match(migration, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`), `RLS not enabled for ${table}`);
    assert.match(migration, new RegExp(`CREATE POLICY [a-z0-9_]+ ON public\\.${table}`), `policy missing for ${table}`);
  }
});

test('fresh-install Central schema contains the same RLS policy coverage', () => {
  for (const table of centralTables) {
    assert.match(bootstrap, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`), `bootstrap RLS missing for ${table}`);
    assert.match(bootstrap, new RegExp(`CREATE POLICY [a-z0-9_]+ ON public\\.${table}`), `bootstrap policy missing for ${table}`);
  }
});

test('tenant-owned Central tables require the matching tenant or platform-admin context', () => {
  for (const table of ['backup_config', 'tenant_db_config', 'tenant_modules', 'tenant_pricing_configs', 'invoices', 'tenant_branch_links', 'central_user_index', 'payment_orders', 'billing_events', 'company_documents']) {
    const start = migration.indexOf(`CREATE POLICY ${table === 'tenant_modules' ? 'tenant_modules_access' : table === 'tenant_pricing_configs' ? 'tenant_pricing_configs_access' : table === 'invoices' ? 'invoices_tenant_access' : table === 'tenant_branch_links' ? 'tenant_branch_links_access' : table === 'central_user_index' ? 'central_user_index_access' : table === 'payment_orders' ? 'payment_orders_tenant_access' : table === 'billing_events' ? 'billing_events_tenant_access' : table === 'company_documents' ? 'company_documents_tenant_access' : table + '_tenant_access'} ON public.${table}`);
    assert.ok(start >= 0, `tenant policy missing for ${table}`);
    const end = migration.indexOf(';', start);
    const policy = migration.slice(start, end);
    assert.match(policy, /jwt\.claims\.is_platform_admin/);
    assert.match(policy, /app\.current_tenant/);
  }
});

test('global Central ledgers and settings are restricted to platform-admin context', () => {
  for (const [table, policyName] of [
    ['payment_webhook_events', 'payment_webhook_events_platform_admin'],
    ['platform_settings', 'platform_settings_platform_admin'],
    ['central_kyc_records', 'central_kyc_records_platform_admin'],
    ['central_gst_records', 'central_gst_records_platform_admin'],
    ['company_document_reviews', 'company_document_reviews_platform_admin'],
    ['tenant_migration_jobs', 'tenant_migration_jobs_platform_admin'],
    ['tenants', 'tenants_platform_admin_access'],
  ]) {
    const start = migration.indexOf(`CREATE POLICY ${policyName} ON public.${table}`);
    assert.ok(start >= 0, `platform-only policy missing for ${table}`);
    const end = migration.indexOf(';', start);
    assert.match(migration.slice(start, end), /jwt\.claims\.is_platform_admin/);
  }
});

test('migration does not force table-owner RLS before deployed role ownership is verified', () => {
  assert.doesNotMatch(migration, /FORCE ROW LEVEL SECURITY/i);
  assert.match(migration, /app role must not own/i);
});
