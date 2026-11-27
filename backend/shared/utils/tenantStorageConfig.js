'use strict';

// Pure storage-policy helpers. No database or network I/O occurs here.
// Legacy tenant records are intentionally handled by a separate audited process.

const STORAGE_TIERS = Object.freeze({
  SHARED: 'shared',
  DEDICATED_SCHEMA: 'dedicated_schema',
  DEDICATED_DATABASE: 'dedicated_database',
  LEGACY: 'legacy_unclassified',
});
const STORAGE_STATUSES = Object.freeze({
  PENDING: 'pending',
  PROVISIONING: 'provisioning',
  READY: 'ready',
  FAILED: 'failed',
  LEGACY: 'legacy_unclassified',
});
const SUPPORTED_DB_MODES = new Set(['cloud', 'external_cloud', 'local']);

// Customer-supplied database hosts are an SSRF boundary. Keep these modes
// disabled unless the deployment operator has installed and verified an
// outbound network policy that blocks loopback, link-local, metadata and
// unauthorized private infrastructure destinations.
function customerDatabaseConnectionsEnabled(env = process.env) {
  return env.CUSTOMER_DATABASE_CONNECTIONS_ENABLED === 'true';
}
const SCHEMA_PATTERN = /^[a-z][a-z0-9_]{0,62}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validatePostgresUrl(value, { required = true } = {}) {
  if (value == null || value === '') {
    if (required) throw new Error('A PostgreSQL connection URL is required for this storage mode.');
    return null;
  }
  if (typeof value !== 'string') throw new Error('PostgreSQL connection URL must be a string.');
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error('PostgreSQL connection URL is not a valid URL.'); }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('Only PostgreSQL connection URLs are supported.');
  }
  if (!parsed.hostname || !parsed.pathname || parsed.pathname === '/') {
    throw new Error('PostgreSQL connection URL must include a host and database name.');
  }
  if (parsed.searchParams.has('schema')) assertSchemaName(parsed.searchParams.get('schema'));
  return parsed;
}

function assertSchemaName(schemaName) {
  if (typeof schemaName !== 'string' || !SCHEMA_PATTERN.test(schemaName)) {
    throw new Error('Schema name must be a lowercase PostgreSQL identifier (1–63 characters).');
  }
  return schemaName;
}

function deriveTenantSchemaName(tenantId) {
  if (typeof tenantId !== 'string' || !UUID_PATTERN.test(tenantId)) {
    throw new Error('A valid tenant UUID is required to derive a schema name.');
  }
  return `tenant_${tenantId.replace(/-/g, '').toLowerCase()}`;
}

function buildStorageDescriptor({ tenantId, plan, dbMode='cloud', dbUrl=null, requestedTier=null } = {}) {
  if (typeof plan !== 'string' || !plan.trim()) throw new Error('A subscription plan is required to determine tenant storage.');
  if (!SUPPORTED_DB_MODES.has(dbMode)) {
    throw new Error(`Unsupported database mode "${dbMode}". Only PostgreSQL cloud, external_cloud, and local modes are accepted for new allocations.`);
  }
  const normalizedPlan = plan.trim().toLowerCase();
  const isFreeOrTrial = normalizedPlan === 'free' || normalizedPlan === 'trial';
  const isCustomerManagedDatabase = dbMode === 'external_cloud' || dbMode === 'local';
  let tier = requestedTier;
  if (tier == null) {
    tier = isCustomerManagedDatabase
      ? STORAGE_TIERS.DEDICATED_DATABASE
      : isFreeOrTrial ? STORAGE_TIERS.SHARED : STORAGE_TIERS.DEDICATED_SCHEMA;
  }
  if (![STORAGE_TIERS.SHARED, STORAGE_TIERS.DEDICATED_SCHEMA, STORAGE_TIERS.DEDICATED_DATABASE].includes(tier)) {
    throw new Error(`Unsupported storage tier "${tier}".`);
  }

  if (isCustomerManagedDatabase && tier !== STORAGE_TIERS.DEDICATED_DATABASE) {
    throw new Error('Customer-managed PostgreSQL must use its own dedicated database.');
  }
  if (dbMode === 'cloud' && isFreeOrTrial && tier !== STORAGE_TIERS.SHARED) {
    throw new Error('Free and Trial managed-cloud plans must use the shared public schema.');
  }
  if (dbMode === 'cloud' && !isFreeOrTrial && tier === STORAGE_TIERS.SHARED) {
    throw new Error('Paid managed-cloud plans must receive a dedicated PostgreSQL schema or an explicitly approved dedicated database.');
  }
  if (tier === STORAGE_TIERS.DEDICATED_DATABASE && !isCustomerManagedDatabase && normalizedPlan !== 'enterprise') {
    throw new Error('Platform-managed dedicated database isolation is reserved for an explicitly approved Enterprise allocation.');
  }

  const parsedUrl = validatePostgresUrl(dbUrl, { required: dbMode !== 'cloud' });
  let schemaName = null;
  if (tier === STORAGE_TIERS.SHARED) schemaName = 'public';
  else if (tier === STORAGE_TIERS.DEDICATED_SCHEMA) schemaName = deriveTenantSchemaName(tenantId);
  if (parsedUrl && schemaName) parsedUrl.searchParams.set('schema', schemaName);
  if (parsedUrl && tier === STORAGE_TIERS.DEDICATED_DATABASE) parsedUrl.searchParams.delete('schema');

  return Object.freeze({
    engine: 'postgresql',
    dbMode,
    storageTier: tier,
    storageStatus: STORAGE_STATUSES.PENDING,
    schemaName,
    databaseUrl: parsedUrl ? parsedUrl.toString() : null,
    connectionSource: dbMode === 'cloud' && !parsedUrl ? 'CLOUD_TENANT_DATABASE_URL' : 'tenant_configuration',
  });
}

module.exports={STORAGE_TIERS,STORAGE_STATUSES,SUPPORTED_DB_MODES,assertSchemaName,buildStorageDescriptor,customerDatabaseConnectionsEnabled,deriveTenantSchemaName,validatePostgresUrl};
