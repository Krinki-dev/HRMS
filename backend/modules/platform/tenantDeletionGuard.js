'use strict';

const { STORAGE_TIERS, STORAGE_STATUSES, assertSchemaName } = require('../../shared/utils/tenantStorageConfig');

function deletionGuardError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.status = 409;
  return error;
}

/**
 * Return a validated destructive target. Shared and legacy tenants are never
 * eligible for schema/database DROP operations.
 */
function getSafeDeletionTarget(tenant) {
  if (!tenant || !tenant.id) {
    throw deletionGuardError('TENANT_STORAGE_UNCLASSIFIED', 'Tenant storage metadata is unavailable; deletion is blocked.');
  }

  if (tenant.storage_status !== STORAGE_STATUSES.READY) {
    throw deletionGuardError('TENANT_STORAGE_NOT_READY', 'Tenant storage is not verified as ready; deletion is blocked.');
  }

  if (tenant.storage_tier === STORAGE_TIERS.SHARED) {
    throw deletionGuardError('SHARED_STORAGE_DELETE_BLOCKED', 'A shared tenant schema must never be dropped for one tenant.');
  }

  if (tenant.storage_tier === STORAGE_TIERS.DEDICATED_DATABASE) {
    throw deletionGuardError('DEDICATED_DATABASE_DELETE_UNSUPPORTED', 'Dedicated database deletion requires a separately verified database-level deletion workflow.');
  }

  if (tenant.storage_tier !== STORAGE_TIERS.DEDICATED_SCHEMA) {
    throw deletionGuardError('TENANT_STORAGE_UNCLASSIFIED', 'Only a verified dedicated schema can be permanently deleted.');
  }

  let schemaName;
  try {
    schemaName = assertSchemaName(tenant.schema_name);
  } catch {
    throw deletionGuardError('TENANT_SCHEMA_INVALID', 'Tenant schema name is invalid; deletion is blocked.');
  }

  const expectedPrefix = `tenant_${String(tenant.id).replace(/-/g, '')}`;
  if (schemaName !== expectedPrefix) {
    throw deletionGuardError('TENANT_SCHEMA_OWNERSHIP_MISMATCH', 'Tenant schema does not match its immutable tenant ID; deletion is blocked.');
  }

  return { kind: 'dedicated_schema', schemaName };
}

module.exports = { getSafeDeletionTarget };
