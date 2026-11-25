'use strict';

function isPaidStorageReady(tenant, planSlug) {
  if (!tenant || tenant.storage_status !== 'ready') return false;
  if (tenant.storage_tier === 'dedicated_schema') return true;
  if (tenant.storage_tier !== 'dedicated_database') return false;
  return tenant.db_mode !== 'cloud' || planSlug === 'enterprise';
}

module.exports = { isPaidStorageReady };
