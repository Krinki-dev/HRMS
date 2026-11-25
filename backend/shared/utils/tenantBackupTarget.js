'use strict';

const { STORAGE_TIERS, STORAGE_STATUSES, deriveTenantSchemaName, assertSchemaName } = require('./tenantStorageConfig');

function getSafeBackupTarget(tenant) {
  if (!tenant || !tenant.id) {
    throw new Error('Tenant backup requires a valid tenant record.');
  }
  if (tenant.storage_status !== STORAGE_STATUSES.READY) {
    throw new Error('Tenant-specific backup is blocked while storage is not ready.');
  }
  if (tenant.storage_tier === STORAGE_TIERS.DEDICATED_SCHEMA) {
    const schema = assertSchemaName(tenant.schema_name);
    if (schema !== deriveTenantSchemaName(tenant.id)) {
      throw new Error('Tenant backup schema does not match the tenant UUID.');
    }
    return schema;
  }
  if (tenant.storage_tier === STORAGE_TIERS.DEDICATED_DATABASE) {
    if (tenant.schema_name) {
      throw new Error('Dedicated database backup must not use a schema override.');
    }
    if (!['local', 'external_cloud', 'cloud'].includes(tenant.db_mode)) {
      throw new Error('Unsupported dedicated database backup mode.');
    }
    if (tenant.db_mode === 'cloud' && tenant.plan !== 'enterprise') {
      throw new Error('Platform-managed dedicated database backup is Enterprise-only.');
    }
    return null;
  }
  throw new Error('Tenant-specific backup is blocked for shared or legacy storage.');
}

module.exports = { getSafeBackupTarget };
