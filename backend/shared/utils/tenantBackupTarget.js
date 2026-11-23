'use strict';

const { STORAGE_TIERS, STORAGE_STATUSES, deriveTenantSchemaName, assertSchemaName } = require('./tenantStorageConfig');

function getSafeBackupTarget(tenant) {
  if (!tenant || !tenant.id) {
    throw new Error('Tenant backup requires a valid tenant record.');
  }
  if (tenant.storage_tier !== STORAGE_TIERS.DEDICATED_SCHEMA ||
      tenant.storage_status !== STORAGE_STATUSES.READY) {
    throw new Error('Tenant-specific backup is blocked for shared, legacy, unready or dedicated-database storage.');
  }
  const schema = assertSchemaName(tenant.schema_name);
  if (schema !== deriveTenantSchemaName(tenant.id)) {
    throw new Error('Tenant backup schema does not match the tenant UUID.');
  }
  return schema;
}

module.exports = { getSafeBackupTarget };
