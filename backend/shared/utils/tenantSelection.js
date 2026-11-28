'use strict';

/**
 * Selects a tenant row only when the result is unambiguous or the caller
 * explicitly selected a tenant UUID. Never fall back to the first row.
 */
function chooseTenantRow(rows, selectedTenantId = null) {
  if (!Array.isArray(rows)) return null;
  if (selectedTenantId) {
    const matches = rows.filter((row) => row.company_id === selectedTenantId || row.tenant_id === selectedTenantId || row.id === selectedTenantId);
    return matches.length === 1 ? matches[0] : null;
  }
  return rows.length === 1 ? rows[0] : null;
}

module.exports = { chooseTenantRow };
