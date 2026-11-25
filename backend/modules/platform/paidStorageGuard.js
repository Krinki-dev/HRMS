'use strict';

const { deriveTenantSchemaName } = require('../../shared/utils/tenantStorageConfig');

function isPaidStorageReady(tenant, planSlug) {
  if (!tenant || tenant.storage_status !== 'ready') return false;
  if (tenant.storage_tier === 'dedicated_schema') {
    try {
      return tenant.db_mode === 'cloud' && tenant.schema_name === deriveTenantSchemaName(tenant.id);
    } catch {
      return false;
    }
  }
  if (tenant.storage_tier !== 'dedicated_database') return false;
  return tenant.schema_name == null && (
    ['local', 'external_cloud'].includes(tenant.db_mode) ||
    (tenant.db_mode === 'cloud' && planSlug === 'enterprise')
  );
}

module.exports = { isPaidStorageReady };
