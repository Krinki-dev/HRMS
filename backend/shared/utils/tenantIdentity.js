'use strict';

/**
 * Normalizes the two distinct identifiers used by HRMS:
 * - companyId: tenant-database companies.id (operational HR data scope)
 * - centralTenantId: Central DB tenants.id (SaaS/platform scope)
 *
 * Legacy access tokens stored companyId in the tenantId claim. Resolve that
 * legacy claim as companyId only; never trust it as a Central tenant id.
 */
function resolveTenantIdentity({ claims = {}, indexedTenantId = null } = {}) {
  const hasCompanyClaim = Boolean(claims.companyId);
  const legacyCompanyId = !hasCompanyClaim ? claims.tenantId : null;
  const tokenCentralTenantId = claims.centralTenantId || (hasCompanyClaim ? claims.tenantId : null);
  // Legacy tokens carry the operational company id in tenantId. Resolve their
  // Central tenant only through the authenticated user's central index; never
  // let an arbitrary request hostname rebind that token to another tenant.
  const centralTenantId = tokenCentralTenantId || indexedTenantId || null;

  return {
    companyId: claims.companyId || legacyCompanyId || null,
    centralTenantId,
    tenantId: centralTenantId,
  };
}

function matchesTenantContext(identity, requestTenantId) {
  if (!requestTenantId) return true;
  return Boolean(identity?.centralTenantId) && identity.centralTenantId === requestTenantId;
}

module.exports = { resolveTenantIdentity, matchesTenantContext };
