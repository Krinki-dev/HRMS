const jwt = require('jsonwebtoken');
const { sendError, ERROR_CODES } = require('../utils/response');
const { PrismaClient } = require('@prisma/client');
const { centralPrisma } = require('../utils/centralPrisma');

// ── Singleton Prisma client for the central (platform-level) database ─────────
function getCentralClient() {
  const url = process.env.CENTRAL_DATABASE_URL;
  if (!url) throw new Error('CENTRAL_DATABASE_URL not set');
  if (!getCentralClient._client) {
    getCentralClient._client = new PrismaClient({
      datasources: { db: { url } },
      log: ['error'],
    });
  }
  return getCentralClient._client;
}

// ── Primary auth middleware ────────────────────────────────────────────────────
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'No token provided. Please login.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Invalid token format.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // ── Fetch is_platform_admin from central DB (non-fatal fallback) ──────────
    let isPlatformAdmin = false;
    try {
      const central = getCentralClient();
      const rows = await central.$queryRaw`
        SELECT is_platform_admin FROM central_user_index
        WHERE user_id = ${decoded.id}::uuid AND is_active = true
        LIMIT 1
      `;
      if (rows.length > 0) {
        isPlatformAdmin = rows[0].is_platform_admin;
      }
    } catch (e) {
      // Non-fatal – fallback to false so a central DB hiccup doesn't lock out users
      console.warn('[Auth] Could not fetch is_platform_admin from central DB:', e.message);
    }

    req.user = {
      id:                decoded.id,
      employeeId:        decoded.employeeId,
      tenantId:          decoded.tenantId || req.tenant?.id,
      role:              decoded.role,
      permissions:       decoded.permissions,
      email:             decoded.email,
      is_platform_admin: isPlatformAdmin,   // ← sourced from central DB, not JWT
    };

    // Set JWT claims as Postgres session settings on central connection so
    // RLS policies that rely on current_setting('jwt.claims.*') can work.
    try {
      await centralPrisma.$executeRawUnsafe(`SET LOCAL "jwt.claims.is_platform_admin" = '${req.user.is_platform_admin ? 'true' : 'false'}'`);
      await centralPrisma.$executeRawUnsafe(`SET LOCAL "jwt.claims.sub" = '${req.user.id}'`);
      if (req.user.tenantId) {
        await centralPrisma.$executeRawUnsafe(`SET LOCAL "jwt.claims.tenantId" = '${req.user.tenantId}'`);
      }
    } catch (e) {
      console.warn('[Auth] Could not set jwt.claims.* settings on central DB:', e.message);
    }

    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Session expired. Please login again.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Invalid token. Please login again.', 401);
    }
    return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication failed.', 401);
  }
};

// ── Role-based access control middleware ─────────────────────────────────────
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) {
    return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Not authenticated. Please login.', 401);
  }
  if (!roles.includes(req.user.role)) {
    return sendError(res, ERROR_CODES.FORBIDDEN,
      `Access denied. Required role: ${roles.join(' or ')}`, 403);
  }
  next();
};

module.exports = authMiddleware;
module.exports.protect    = authMiddleware;
module.exports.restrictTo = restrictTo;

