const logger = require('../utils/logger');
const { THEME } = require('../utils/uiConstants');

/**
 * Middleware to set session variables on the tenant DB connection used by Prisma.
 * This attempts to set `app.current_tenant` so DB RLS policies can rely on it.
 * Note: Prisma uses a connection pool; calling this on each request improves
 * the odds the session variable is present for subsequent queries in that
 * request. It's not a full-proof per-connection guarantee for pooled clients,
 * but is a pragmatic improvement.
 */
const tenantSessionMiddleware = async (req, res, next) => {
  try {
    if (!req.tenant || !req.tenant.id || !req.db) return next();

    // Use SET LOCAL to scope to current transaction when used inside a transaction.
    // Prisma may not run all queries in the same session, but this helps most cases.
    try {
      // Some PostgreSQL drivers do not support parameter binding in SET statements.
      // Use the unsafe variant with a properly quoted value to ensure the session
      // variable is set reliably.
      await req.db.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${req.tenant.id}'`);
    } catch (err) {
      logger.warn(`${THEME.ICONS.WARNING} [tenantSession] Could not set app.current_tenant: ${err.message}`);
    }

    return next();
  } catch (err) {
    logger.warn(`${THEME.ICONS.WARNING} [tenantSession] Unexpected: ${err.message}`);
    return next();
  }
};

module.exports = { tenantSessionMiddleware };
