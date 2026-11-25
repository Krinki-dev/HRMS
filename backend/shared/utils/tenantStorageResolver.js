'use strict';

// Resolve an already-classified tenant record to a PostgreSQL target.
// This module is intentionally side-effect free: it does not connect, create,
// alter, or drop schemas. Provisioning is a separate privileged operation.

const {
  STORAGE_TIERS,
  STORAGE_STATUSES,
  assertSchemaName,
  deriveTenantSchemaName,
  validatePostgresUrl,
} = require('./tenantStorageConfig');

function decryptConfiguredValue(value, decryptValue) {
  if (!value) return value;
  if (typeof decryptValue !== 'function') {
    throw new Error('A decryption function is required for encrypted tenant database URLs.');
  }
  return decryptValue(value);
}

function resolveTenantStorageTarget(tenant, {
  cloudDatabaseUrl,
  decryptValue,
} = {}) {
  if (!tenant || typeof tenant !== 'object' || !tenant.id) {
    throw new Error('A tenant record with an ID is required.');
  }

  const tier = tenant.storage_tier;
  const status = tenant.storage_status;

  if (tier === STORAGE_TIERS.LEGACY || status === STORAGE_STATUSES.LEGACY || !tier || !status) {
    const error = new Error('Tenant storage is not classified. Complete the audited legacy classification before routing.');
    error.code = 'TENANT_STORAGE_UNCLASSIFIED';
    throw error;
  }
  if (status !== STORAGE_STATUSES.READY) {
    const error = new Error(`Tenant storage is not ready (status: ${status}).`);
    error.code = 'TENANT_STORAGE_NOT_READY';
    throw error;
  }

  let rawUrl;
  switch (tenant.db_mode) {
    case 'cloud':
      rawUrl = tenant.db_url
        ? decryptConfiguredValue(tenant.db_url, decryptValue)
        : cloudDatabaseUrl;
      if (!rawUrl) throw new Error('The platform cloud PostgreSQL connection is not configured.');
      break;
    case 'external_cloud':
      rawUrl = decryptConfiguredValue(tenant.db_url, decryptValue);
      if (!rawUrl) throw new Error('External PostgreSQL connection is not configured for this tenant.');
      break;
    case 'local':
      // Local credentials must be converted to a URL by a separately tested
      // credential builder. Do not infer defaults or silently use cloud.
      throw new Error('Local PostgreSQL URL construction is not enabled in this resolver stage.');
    default:
      throw new Error(`Unsupported database mode "${tenant.db_mode}" for classified tenant storage.`);
  }

  const parsed = validatePostgresUrl(rawUrl);
  let schemaName = null;

  if (tier === STORAGE_TIERS.SHARED || tier === STORAGE_TIERS.DEDICATED_SCHEMA) {
    schemaName = assertSchemaName(tenant.schema_name);
    if (tier === STORAGE_TIERS.SHARED && schemaName !== 'public') {
      throw new Error('Free and Trial storage must use the public schema.');
    }
    if (tier === STORAGE_TIERS.DEDICATED_SCHEMA && schemaName !== deriveTenantSchemaName(tenant.id)) {
      throw new Error('Dedicated schema must match the immutable tenant UUID.');
    }
    parsed.searchParams.set('schema', schemaName);
  } else if (tier === STORAGE_TIERS.DEDICATED_DATABASE) {
    if (tenant.plan !== 'enterprise') {
      throw new Error('Dedicated database storage requires an Enterprise plan.');
    }
    if (tenant.schema_name) {
      throw new Error('Dedicated database storage must not specify a schema override.');
    }
    parsed.searchParams.delete('schema');
  } else {
    throw new Error(`Unsupported storage tier "${tier}".`);
  }

  return Object.freeze({
    tenantId: tenant.id,
    engine: 'postgresql',
    storageTier: tier,
    storageStatus: status,
    dbMode: tenant.db_mode,
    schemaName,
    databaseUrl: parsed.toString(),
  });
}

module.exports = { resolveTenantStorageTarget };
