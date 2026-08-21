/**
 * NOTE: This middleware is currently a no-op with respect to Row-Level Security.
 *
 * Two separate reasons:
 *   1. A bare `SET LOCAL` issued here, outside an explicit transaction, is
 *      discarded by Postgres as soon as this middleware's own implicit
 *      transaction ends — it has no effect on the queries route handlers run
 *      afterwards. Verified in backend/test/rls-tenant-isolation.test.js.
 *   2. Even if it were transaction-scoped, `req.db` is the tenant-specific
 *      database connection (see shared/middleware/tenant.js resolveTenantDB).
 *      None of the RLS policies in
 *      backend/db-migrations/20260606_rls_and_function_fix.sql that reference
 *      `app.current_tenant` are defined on tenant-DB tables — they're all on
 *      CENTRAL DB tables (tenant_modules, tenant_pricing_configs, invoices,
 *      tenant_branch_links), which are queried via `centralPrisma`, not `req.db`.
 *      Tenant isolation for tenant-DB tables is achieved by connecting to a
 *      separate database/schema per tenant (resolveTenantDB), not by RLS.
 *
 * Route handlers/services that query the central-DB RLS-guarded tables must
 * use shared/utils/rlsContext.js (withTenantRLS / withPlatformAdminRLS), which
 * sets the session variable and runs the query in the same `$transaction`.
 * This middleware is kept only so a request-scoped `req.tenant` is always
 * available; it is intentionally left as a no-op below rather than removed,
 * to avoid silently reintroducing a broken SET LOCAL call here in the future.
 */
const tenantSessionMiddleware = async (req, res, next) => {
  return next();
};

module.exports = { tenantSessionMiddleware };

