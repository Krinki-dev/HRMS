const { centralPrisma } = require('../utils/centralPrisma');
const logger = require('../utils/logger');
const { withPlatformAdminRLS } = require('./rlsContext');

async function resolveTenantId(req) {
  // Prefer JWT claim
  const jwtTenant = req.user?.tenantId;
  if (jwtTenant) return jwtTenant;

  // Then request-scoped tenant (set by tenantMiddleware)
  if (req.tenant?.id) return req.tenant.id;

  // Fallback: header subdomain lookup
  const subdomain = req.headers['x-tenant-subdomain'] || req.headers['x-tenant'];
  if (subdomain) {
    try {
      // No tenant is known yet (that's what we're resolving), so this runs
      // under the platform-admin RLS predicate — see shared/utils/rlsContext.js.
      const t = await withPlatformAdminRLS(centralPrisma, (tx) => tx.tenants.findFirst({ where: { subdomain } }));
      if (t) return t.id;
    } catch (e) {
      logger.error('tenantResolver: failed to lookup tenant by subdomain', e);
    }
  }

  return null;
}

module.exports = { resolveTenantId };
