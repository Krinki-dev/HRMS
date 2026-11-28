'use strict';

/**
 * Resolve a password-reset workspace without ever selecting an arbitrary
 * membership. A request tenant is authoritative for tenant-hosted requests;
 * platform-root requests must supply an explicit tenant when membership is
 * ambiguous.
 */
function selectPasswordResetWorkspace(choices, selectedTenantId = null, requestTenantId = null) {
  if (selectedTenantId && requestTenantId && selectedTenantId !== requestTenantId) {
    return { status: 'invalid_selection', tenant: null };
  }

  const rows = Array.isArray(choices) ? choices : [];
  const explicitTenantId = selectedTenantId || requestTenantId || null;

  if (!explicitTenantId) {
    if (rows.length === 0) return { status: 'not_found', tenant: null };
    if (rows.length !== 1) return { status: 'selection_required', tenant: null };
    return { status: 'selected', tenant: rows[0] };
  }

  const matches = rows.filter((row) => row?.tenantId === explicitTenantId);
  if (matches.length !== 1) return { status: 'invalid_selection', tenant: null };
  return { status: 'selected', tenant: matches[0] };
}

module.exports = { selectPasswordResetWorkspace };
