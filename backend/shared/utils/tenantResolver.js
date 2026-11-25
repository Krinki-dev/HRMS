'use strict';

/**
 * Operational HR tables use companies.id from the tenant database.
 * Central SaaS tables use tenants.id from the platform database.
 * Keep these resolvers explicit: req.tenant.id is always a Central tenant id.
 */
function resolveCompanyId(req) {
  const companyId = req.user?.companyId;
  if (!companyId) {
    const error = new Error('Authenticated company context is required.');
    error.status = 403;
    error.code = 'COMPANY_CONTEXT_REQUIRED';
    throw error;
  }
  return companyId;
}

function resolveCentralTenantId(req) {
  const tenantId = req.user?.centralTenantId || req.tenant?.id || req.user?.tenantId;
  if (!tenantId) {
    const error = new Error('Central tenant context is required.');
    error.status = 400;
    error.code = 'TENANT_REQUIRED';
    throw error;
  }
  return tenantId;
}

// Compatibility export for any remaining operational imports. New code must
// choose the explicit resolver that matches the database being queried.
module.exports = {
  resolveCompanyId,
  resolveCentralTenantId,
  resolveTenantId: resolveCompanyId,
};
