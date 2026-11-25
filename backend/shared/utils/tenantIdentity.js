'use strict';

/**
 * Normalizes the two distinct identifiers used by HRMS:
 * - companyId: tenant-database companies.id (operational HR data scope)
 * - centralTenantId: Central DB tenants.id (SaaS/platform scope)
 *
 * Legacy access tokens stored companyId in the tenantId claim. Resolve that
 * legacy claim as companyId only; never trust it as a Central tenant id.
 */
function resolveTenantIdentity({ claims = {}, requestTenantId = null, indexedTenantId = null } = {}) {
  const hasCompanyClaim = Boolean(claims.companyId);
  const legacyCompanyId = !hasCompanyClaim ? claims.tenantId : null;
  const centralTenantId =
    requestTenantId ||
    claims.centralTenantId ||
    indexedTenantId ||
    (hasCompanyClaim ? claims.tenantId : null) ||
    null;

  return {
    companyId: claims.companyId || legacyCompanyId || null,
    centralTenantId,
    tenantId: centralTenantId,
  };
}

module.exports = { resolveTenantIdentity };
