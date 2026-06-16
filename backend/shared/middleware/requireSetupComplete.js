const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const { THEME } = require('../utils/uiConstants');

let _centralPrisma = null;
function getCentralPrisma() {
  if (!_centralPrisma) {
    if (!process.env.CENTRAL_DATABASE_URL) {
      throw new Error('CENTRAL_DATABASE_URL is not set');
    }
    _centralPrisma = new PrismaClient({
      datasources: { db: { url: process.env.CENTRAL_DATABASE_URL } },
      log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    });
  }
  return _centralPrisma;
}

module.exports = async function requireSetupComplete(req, res, next) {
  const tenantId = req.tenant?.id || req.user?.tenantId;

  if (!tenantId) return next();

  try {
    const central = getCentralPrisma();
    const rows = await central.$queryRaw`
      SELECT is_setup_complete
      FROM   tenants
      WHERE  id = ${tenantId}::uuid
        AND  deleted_at IS NULL
      LIMIT  1
    `;

    if (!rows.length) {
      return res.status(403).json({
        success: false,
        code:    'TENANT_NOT_FOUND',
        message: `${THEME.ICONS.WARNING} Company account not found.`,
      });
    }

    if (!rows[0].is_setup_complete) {
      return res.status(403).json({
        success: false,
        code:    'SETUP_INCOMPLETE',
        message: `${THEME.ICONS.LOCK} Complete your company setup before accessing this feature.`,
      });
    }

    next();
  } catch (err) {
    logger.error(`${THEME.ICONS.ERROR} [requireSetupComplete] DB error:`, { message: err.message });
    
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        success: false,
        message: 'Could not verify company setup status. Please try again.',
      });
    }
    next();
  }
};

