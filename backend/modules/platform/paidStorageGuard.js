'use strict';

function isPaidStorageReady(tenant, planSlug) {
  if (!tenant || tenant.storage_status !== 'ready') return false;
  if (tenant.storage_tier === 'dedicated_schema') return tenant.db_mode === 'cloud';
  if (tenant.storage_tier !== 'dedicated_database') return false;
  return ['local', 'external_cloud'].includes(tenant.db_mode) ||
    (tenant.db_mode === 'cloud' && planSlug === 'enterprise');
}

module.exports = { isPaidStorageReady };
