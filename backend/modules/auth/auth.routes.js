﻿/**
 * @file auth.routes.js
 * @description Authentication and authorization entry points for the HRMS.
 */
const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const rateLimit = require('express-rate-limit');

const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const auth     = require('../../shared/middleware/auth');
const emailSvc = require('../../shared/utils/emailService');
const authService = require('./auth.service');
const logger   = require('../../shared/utils/logger');
const { centralPrisma } = require('../../shared/utils/centralPrisma');
const { resolveTenantDbUrl } = require('../platform/platform.service');

const router       = express.Router();
const lookupRouter = express.Router();

/**
 * Validates security environment variables.
 */
function checkSecurityConfig() {
  if (process.env.NODE_ENV !== 'production') return;
  const secrets = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  secrets.forEach(s => {
    if (!process.env[s] || process.env[s].length < 32)
      throw new Error(`FATAL: ${s} must be 32+ chars in production.`);
  });
}

checkSecurityConfig();

/**
 * Rate limiter for login attempts.
 * Prevents brute-force attacks on the authentication endpoint.
 * Skips in development unless explicitly enabled.
 */
// ── Rate limiting ─────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  skip: (req) => process.env.NODE_ENV === 'development' && !process.env.TEST_LIMITER,
});

// ── Helpers ───────────────────────────────────────────────────────
/**
 * Safely parses a JSON string into an object.
 * @param {string|object} str - The string or object to parse.
 * @param {object} fallback - The default object if parsing fails.
 * @returns {object}
 */
const safeParseJSON = (str, fallback = {}) => {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return fallback; }
};

// ── signAccessToken ───────────────────────────────────────────────
/**
 * Signs a new JWT access token.
 * NOTE: is_platform_admin is intentionally excluded from the JWT payload.
 * It is fetched live from the central DB by auth middleware on every request.
 * @param {Object} user 
 * @param {Object} permissions 
 */
function signAccessToken(user, permissions) {
  if (!process.env.JWT_ACCESS_SECRET) throw new Error('SERVER_CONFIG_ERROR: JWT_ACCESS_SECRET is not set');
  
  return jwt.sign(
    {
      id:         user.id,
      employeeId: user.employee_id,
      tenantId:   user.company_id,
      role:       user.role?.name || 'employee',
      permissions,
      email:      user.email,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
}

/**
 * Signs a new JWT refresh token.
 * @param {string} userId 
 */
function signRefreshToken(userId) {
  if (!process.env.JWT_REFRESH_SECRET) throw new Error('SERVER_CONFIG_ERROR: JWT_REFRESH_SECRET is not set');
  
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
}

/**
 * Sets the HTTP-only refresh token cookie.
 * @param {Response} res 
 * @param {string} refreshToken 
 */
function setRefreshCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });
}

/**
 * Constructs the standard user payload for responses.
 * @param {Object} user 
 * @param {Object} permissions 
 * @param {Object} tenantInfo 
 */
function buildUserPayload(user, permissions, tenantInfo = {}) {
  const firstName = user.employee?.first_name || '';
  const lastName  = user.employee?.last_name  || '';

  return {
    id:    user.id,
    name:  `${firstName} ${lastName}`.trim() || user.email.split('@')[0],
    email: user.email,
    role:  user.role?.name || 'employee',
    permissions,
    isFirstLogin:      !!(user.is_first_login && user.employee_id),
    hasEmployeeId:      !!user.employee_id,
    employeeId:        user.employee_id || null,
    is_platform_admin: false, // Placeholder

    employee: user.employee ? {
      id:        user.employee.id || null,
      firstName: user.employee.first_name,
      lastName:  user.employee.last_name,
      photoUrl:  user.employee.photo_url || null,
    } : null,

    plan:            tenantInfo.plan            || 'free',
    isSetupComplete: tenantInfo.isSetupComplete ?? true,
    planExpiresAt:   tenantInfo.planExpiresAt   || null,
    tenantId:        tenantInfo.tenantId        || null,
    companyName:     tenantInfo.companyName     || null,
  };
}

/**
 * Fetches tenant-specific branding and setup info.
 * Replaces the need for multiple manual queryRaw calls across the module.
 * @param {string} tenantId 
 * @returns {Promise<Object>}
 */
async function handleAuthLookup(req, res) {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Email is required', 400);
    }

const normalizedEmail = email.toLowerCase().trim();
  const result = await authService.lookupEmail(normalizedEmail);
    const isDev = process.env.NODE_ENV === 'development';
    
    if (result.found) {
      if (!result.is_active) {
        return sendError(res, ERROR_CODES.LICENCE,
          'This account is suspended. Contact support@syntern.in', 403);
      }
      return sendSuccess(res, {
        found: true,
        subdomain: result.subdomain,
        companyName: result.company_name,
        logoUrl: result.logo_url || null,
        plan: result.plan,
      });
    }

    // 3. Local Environment Fallback
    if (isDev && req.db) {
       const devUser = await req.db.users.findFirst({
         where: { email: normalizedEmail, is_active: true }
       });
       if (devUser) {
         return sendSuccess(res, {
           found: true,
           subdomain: 'dev',
           companyName: 'Dev Environment',
           logoUrl: null,
           plan: 'dev'
         });
       }
    }

    return sendSuccess(res, { found: false });
  } catch (err) {
    logger.error('[Auth/Lookup] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Lookup failed. Please try again.', 500);
  }
}

router.post('/lookup', handleAuthLookup);
lookupRouter.post('/', handleAuthLookup);

// ════════════════════════════════════════════════════════════════════════════════
// POST /auth/lookup-phone — Lookup user by mobile phone number
// ════════════════════════════════════════════════════════════════════════════════
router.post('/lookup-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !phone.trim()) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Phone number is required', 400);
    }

    const result = await authService.lookupPhone(phone);
    if (!result.found) {
      return sendSuccess(res, { found: false });
    }

    return sendSuccess(res, {
      found: true,
      subdomain: result.subdomain,
      is_platform_admin: result.is_platform_admin,
      companyName: result.companyName,
      logoUrl: result.logoUrl,
      plan: result.plan,
    });
  } catch (err) {
    logger.error('[Auth/LookupPhone] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Phone lookup failed. Please try again.', 500);
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /auth/lookup-employeeid — Lookup user by employee ID
// ════════════════════════════════════════════════════════════════════════════════
router.post('/lookup-employeeid', async (req, res) => {
  try {
    const { employee_id } = req.body;
    if (!employee_id || !employee_id.trim()) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Employee ID is required', 400);
    }

    const result = await authService.lookupEmployeeId(employee_id);
    if (!result.found) {
      return sendSuccess(res, { found: false });
    }

    return sendSuccess(res, {
      found: true,
      subdomain: result.subdomain,
      is_platform_admin: result.is_platform_admin,
      companyName: result.companyName,
      logoUrl: result.logoUrl,
      plan: result.plan,
      email: result.email,
    });
  } catch (err) {
    logger.error('[Auth/LookupEmployeeId] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Employee ID lookup failed. Please try again.', 500);
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /auth/lookup-phone-email — Dual lookup by phone AND email (optional)
// ════════════════════════════════════════════════════════════════════════════════
router.post('/lookup-phone-email', async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email || !email.trim()) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Email is required', 400);
    }

    const result = await authService.lookupEmailAndPhone(email, phone);
    if (!result.found) {
      return sendSuccess(res, { found: false });
    }

    return sendSuccess(res, {
      found: true,
      subdomain: result.subdomain,
      is_platform_admin: result.is_platform_admin,
      companyName: result.companyName,
      logoUrl: result.logoUrl,
      plan: result.plan,
    });
  } catch (err) {
    logger.error('[Auth/LookupPhoneEmail] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Lookup failed. Please try again.', 500);
  }
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many OTP requests. Try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  skip: (req) => process.env.NODE_ENV === 'development' && !process.env.TEST_LIMITER,
});

const ALLOWED_OTP_PURPOSES = new Set(['login', 'reset', 'verify', 'aadhaar']);

/**
 * Dynamic DB Resolver Helper for Auth Routes
 */
async function getActiveContext(req, email) {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Use existing tenant context if already resolved by middleware.
  if (req.db) return { activeDb: req.db, tenantId: req.tenant?.id, isTemporary: false };

  // 2. Fallback: Resolve tenant by email for root auth requests.
  const ctx = await authService.resolveTenantDb(normalizedEmail);
  if (!ctx) return { activeDb: null, isTemporary: false };

  const { PrismaClient } = require('@prisma/client');
  const client = new PrismaClient({ datasources: { db: { url: ctx.url } } });
  return { activeDb: client, tenantId: ctx.tenantId, isTemporary: true };
}

/**
 * Refactored OTP flow
 */
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { email, purpose = 'login' } = req.body;
    if (!email || !email.trim()) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Email is required', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!ALLOWED_OTP_PURPOSES.has(purpose)) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Invalid OTP purpose', 400);
    }

    const { activeDb, tenantId, isTemporary } = await getActiveContext(req, normalizedEmail);
    if (!activeDb) return sendSuccess(res, null, 'Process completed'); // Silent fail for security

    try {
      await authService.sendOtp(activeDb, tenantId, normalizedEmail, purpose);
    } catch (err) {
      logger.error('[Auth/SendOTP] Error:', err);
    } finally {
      if (isTemporary) setTimeout(() => activeDb.$disconnect(), 5000);
    }

    return sendSuccess(res, null, 'If that email is registered, an OTP has been sent.');
  } catch (err) {
    console.error('[Auth/SendOTP] Error:', err.message);
    return sendError(res, ERROR_CODES.SERVER, 'OTP send failed. Please try again.', 500);
  }
});

router.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { email, otp, purpose = 'login' } = req.body;
    if (!email || !otp || !email.trim() || !otp.trim()) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Email and OTP are required', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!ALLOWED_OTP_PURPOSES.has(purpose)) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Invalid OTP purpose', 400);
    }

    const { activeDb, tenantId, isTemporary } = await getActiveContext(req, normalizedEmail);
    if (!activeDb) {
      return sendError(res, ERROR_CODES.SERVER, 'Unable to verify OTP at this time.', 500);
    }

    const verify = await authService.verifyOtp(activeDb, normalizedEmail, otp, purpose);
    if (!verify.valid) {
      if (isTemporary) setTimeout(() => activeDb.$disconnect(), 5000);
      return sendError(res, ERROR_CODES.UNAUTHORIZED, verify.message, 401);
    }

    if (purpose === 'login') {
      const user = await activeDb.users.findFirst({
        where: { email: normalizedEmail, is_active: true },
        include: { role: true, employee: true },
      });
      const permissions = safeParseJSON(user.role?.permissions);
      const accessToken = authService.signAccessToken(user, permissions);
      const refreshToken = authService.signRefreshToken(user.id);
      setRefreshCookie(res, refreshToken);

      const tenantInfo = await authService.getTenantInfo(tenantId || user.company_id);
      const isPlatformAdmin = await authService.isPlatformAdmin(user.id);
      const payload = authService.buildUserPayload(user, permissions, tenantInfo, isPlatformAdmin);

      if (isTemporary) setTimeout(() => activeDb.$disconnect(), 5000);
      return sendSuccess(res, { accessToken, user: payload }, 'Login successful');
    }

    await cleanupTemporaryDb(isTemporaryClient, activeDb);
    return sendSuccess(res, null, 'OTP verified successfully');
  } catch (err) {
    console.error('[Auth/VerifyOTP] Error:', err.message);
    return sendError(res, ERROR_CODES.SERVER, 'OTP verification failed. Please try again.', 500);
  }
});

// ================================================================
// POST /auth/login
// ================================================================
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Email and password are required', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    let { activeDb, tenantId, isTemporary } = await getActiveContext(req, normalizedEmail);
    
    if (!activeDb) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'INVALID_CREDENTIALS', 401);
    }

    const result = await authService.validateUserLogin(activeDb, normalizedEmail, password);
    if (!result.success) {
      if (isTemporary) setTimeout(() => activeDb.$disconnect(), 5000);
      return sendError(res, ERROR_CODES.UNAUTHORIZED, result.code, 401);
    }

    const { user } = result;
    const permissions = safeParseJSON(user.role?.permissions);
    const accessToken = authService.signAccessToken(user, permissions);
    const refreshToken = authService.signRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    const tenantInfo = await authService.getTenantInfo(tenantId || user.company_id);
    const isPlatformAdmin = await authService.isPlatformAdmin(user.id);
    const payload = authService.buildUserPayload(user, permissions, tenantInfo, isPlatformAdmin);

    if (isTemporary) setTimeout(() => activeDb.$disconnect(), 5000);
    return sendSuccess(res, { accessToken, user: payload }, 'Login successful');

  } catch (err) {
    logger.error('[Auth/Login] Error', { message: err.message, stack: err.stack });
    return sendError(res, ERROR_CODES.SERVER, 'Login failed.', 500);
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return sendError(res, ERROR_CODES.UNAUTHORIZED, 'No refresh token.', 401);

    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET); } 
    catch (jwtErr) {
      res.clearCookie('refreshToken');
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Session expired.', 401);
    }

    let activeDb = req.db;
    let isTemporary = false;
    if (!activeDb) {
      // Use findFirst with user_id, NOT findUnique with id
      const userIndex = await centralPrisma.central_user_index.findFirst({
        where: { user_id: decoded.id, is_active: true }
      });

      if (userIndex?.is_platform_admin) {
        activeDb = centralPrisma; // Admins exist in central DB
      } else if (userIndex?.company_id) {
        const ctx = await authService.resolveTenantDbById(userIndex.company_id);
        if (ctx) {
          const { PrismaClient } = require('@prisma/client');
          activeDb = new PrismaClient({ datasources: { db: { url: ctx.url } } });
          isTemporary = true;
        }
      }
    }

    if (!activeDb) return sendError(res, ERROR_CODES.SERVER, 'Configuration error.', 500);

    const user = await activeDb.users.findFirst({
      where:   { id: decoded.id, is_active: true },
      include: { role: true, employee: true },
    });

    if (!user) {
      if (isTemporary) await activeDb.$disconnect();
      res.clearCookie('refreshToken');
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'User not found.', 401);
    }

    const permissions = safeParseJSON(user.role?.permissions);
    const accessToken = authService.signAccessToken(user, permissions);
    const tenantInfo = await authService.getTenantInfo(req.tenant?.id || user.company_id);
    const isPlatformAdmin = await authService.isPlatformAdmin(user.id);
    const payload = authService.buildUserPayload(user, permissions, tenantInfo, isPlatformAdmin);

    if (isTemporary) await activeDb.$disconnect();
    return sendSuccess(res, { accessToken, user: payload }, 'Token refreshed');
  } catch (err) {
    console.error('[Auth/Refresh] Error:', err.message);
    res.clearCookie('refreshToken');
    return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Session expired. Please login again.', 401);
  }
});

// ================================================================
// POST /auth/logout
// ================================================================
router.post('/logout', auth, async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken && req.db) {
      // Ensure req.user and its ID exist before attempting to blacklist
      if (req.user?.id) {
        // Verify if the user still exists in the database
        const userExists = await req.db.users.findUnique({
          where: { id: req.user.id },
          select: { id: true }
        });

        if (userExists) {
          const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
          try {
            await req.db.token_blacklist.create({
              data: {
                token_hash: tokenHash,
                user_id:    req.user.id,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
            });
          } catch (e) {
            logger.warn(`[Auth/Logout] Blacklist failed (likely user mismatch): ${e.message}`);
          }
        } else {
          logger.warn(`[Auth/Logout] User (ID: ${req.user.id}) not found for token blacklisting. Skipping blacklist entry.`);
        }
      }
    }

    res.clearCookie('refreshToken');
    return sendSuccess(res, null, 'Logged out successfully');

  } catch (err) {
    res.clearCookie('refreshToken');
    return sendSuccess(res, null, 'Logged out');
  }
});

// ================================================================
// GET /auth/me
// ================================================================
router.get('/me', auth, async (req, res) => {
  try {
    if (!req.db) {
      return sendError(res, ERROR_CODES.SERVER, 'Server configuration error.', 500);
    }

    const user = await req.db.users.findFirst({
      where:   { id: req.user.id },
      include: {
        role:     true,
        employee: { select: { id: true, first_name: true, last_name: true, photo_url: true } },
      },
    });

    if (!user) {
      return sendError(res, ERROR_CODES.NOT_FOUND, 'User not found.', 404);
    }

    const permissions = safeParseJSON(user.role?.permissions);
    const tenantInfo  = await getTenantInfo(req.tenant?.id || req.user?.tenantId);

    const payload = buildUserPayload(user, permissions, tenantInfo);
    // auth middleware has already fetched is_platform_admin from central DB — use it directly.
    payload.is_platform_admin = req.user.is_platform_admin;

    return sendSuccess(res, payload);

  } catch (err) {
    console.error('[Auth/Me] Error:', err.message);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to get user info.', 500);
  }
});

// ================================================================
// POST /auth/forgot-password
// ================================================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Email is required', 400);
    }

    if (!req.db) {
      return sendError(res, ERROR_CODES.SERVER, 'Server configuration error.', 500);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await req.db.users.findFirst({
      where:   { email: normalizedEmail },
      include: { employee: true },
    });

    if (!user) {
      return sendSuccess(res, null, 'If that email exists, a reset link has been sent.');
    }

    await req.db.password_resets.deleteMany({ where: { user_id: user.id } });

    // Determine the subdomain for the reset link
    let subdomain = 'app'; // Default to 'app' if no tenant context
    let tenantId = null;
    let activeDb = req.db;
    let isTemporaryClient = false;

    if (req.tenant?.subdomain) {
      subdomain = req.tenant.subdomain;
      tenantId = req.tenant.id;
    } else {
      // If req.tenant is not set, try to resolve tenant by central index or admin email
      try {
        // 1. Try central_user_index for this email
        const indexRows = await centralPrisma.$queryRaw`
          SELECT * FROM central_user_index WHERE email = ${normalizedEmail} AND is_active = true LIMIT 1
        `;
        const idx = indexRows[0];
        if (idx?.company_id) {
          const ctx = await authService.resolveTenantDbById(idx.company_id);
          if (ctx) {
            const { PrismaClient } = require('@prisma/client');
            activeDb = new PrismaClient({ datasources: { db: { url: ctx.url } } });
            isTemporaryClient = true;
            subdomain = ctx.subdomain || subdomain;
            tenantId = ctx.tenantId || tenantId;
          }
        } else {
          // 2. Fallback: if this email is tenant admin (tenants.admin_email), resolve tenant
          const tenantRows = await centralPrisma.$queryRaw`
            SELECT id, subdomain, db_mode, db_url, schema_name, local_db_type,
                   local_db_host, local_db_port, local_db_name, local_db_user,
                   local_db_pass
            FROM tenants
            WHERE LOWER(admin_email) = LOWER(${normalizedEmail})
              AND deleted_at IS NULL
              AND is_active = true
            LIMIT 1
          `;
          const tenantRecord = tenantRows[0];
          if (tenantRecord) {
            subdomain = tenantRecord.subdomain || subdomain;
            tenantId = tenantRecord.id || tenantId;
            try {
              const tenantUrl = resolveTenantDbUrl(tenantRecord.db_mode, tenantRecord);
              if (tenantUrl) {
                const { PrismaClient: TenantClient } = require('@prisma/client');
                activeDb = new TenantClient({ datasources: { db: { url: tenantUrl } } });
                isTemporaryClient = true;
              }
            } catch (dbErr) {
              logger.warn('[Auth/ForgotPwd] Tenant DB resolution fallback failed', {
                error: dbErr.message,
                tenantId,
                subdomain,
              });
            }
          }
        }
      } catch (e) {
        logger.warn('[Auth/ForgotPwd] central lookup failed', { error: e.message });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await req.db.password_resets.create({
      data: {
        user_id:    user.id,
        token_hash: tokenHash,
        type:       'reset',
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const isDev = process.env.NODE_ENV === 'development';
    const resetLink = isDev 
      ? `http://${subdomain}.syntern.in:5173/reset-password?token=${token}`
      : `https://${subdomain}.syntern.in/reset-password?token=${token}`;

    try {
      await emailSvc.sendPasswordReset(activeDb, tenantId, {
        email: normalizedEmail,
        name:  user.employee
          ? `${user.employee.first_name} ${user.employee.last_name}`
          : normalizedEmail,
        resetLink,
      });
    } catch (err) {
      logger.error('[Auth/ForgotPwd] Email send failed', { error: err.message, email: normalizedEmail, tenantId, subdomain });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Password reset link for ${normalizedEmail}:`);
      console.log(`      ${resetLink}`);
    }

    if (isTemporaryClient) setTimeout(() => activeDb.$disconnect(), 5000);

    return sendSuccess(res, null, 'If that email exists, a reset link has been sent.');

  } catch (err) {
    console.error('[Auth/ForgotPwd] Error:', err.message);
    return sendError(res, ERROR_CODES.SERVER, 'Reset request failed. Please try again.', 500);
  }
});

// ================================================================
// POST /auth/reset-password
// ================================================================
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Token and new password are required', 400);
    }

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      return sendError(res, ERROR_CODES.VALIDATION,
        'Password must be 8+ characters with uppercase, number, and special character', 400);
    }

    if (!req.db) {
      return sendError(res, ERROR_CODES.SERVER, 'Server configuration error.', 500);
    }

    const tokenHash   = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await req.db.password_resets.findFirst({
      where: {
        token_hash: tokenHash,
        used:       false,
        expires_at: { gt: new Date() },
      },
    });

    if (!resetRecord) {
      return sendError(res, ERROR_CODES.VALIDATION, 'INVALID_TOKEN', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await req.db.users.update({
      where: { id: resetRecord.user_id },
      data:  { password_hash: passwordHash, is_first_login: false },
    });

    await req.db.password_resets.update({
      where: { id: resetRecord.id },
      data:  { used: true },
    });

    return sendSuccess(res, null, 'Password updated. You can now sign in.');

  } catch (err) {
    console.error('[Auth/ResetPwd] Error:', err.message);
    return sendError(res, ERROR_CODES.SERVER, 'Password reset failed. Please try again.', 500);
  }
});

// ================================================================
// POST /auth/change-password
// ================================================================
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, ERROR_CODES.VALIDATION,
        'Current and new password are required', 400);
    }

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      return sendError(res, ERROR_CODES.VALIDATION,
        'Password must be 8+ characters with uppercase, number, and special character', 400);
    }

    if (!req.db) {
      return sendError(res, ERROR_CODES.SERVER, 'Server configuration error.', 500);
    }

    const user = await req.db.users.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return sendError(res, ERROR_CODES.NOT_FOUND, 'User not found.', 404);
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'WRONG_PASSWORD', 401);
    }

    const sameAsOld = await bcrypt.compare(newPassword, user.password_hash);
    if (sameAsOld) {
      return sendError(res, ERROR_CODES.VALIDATION,
        'New password must be different from your current password', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await req.db.users.update({
      where: { id: user.id },
      data:  { password_hash: passwordHash, is_first_login: false },
    });

    const updatedUser = await req.db.users.findUnique({
      where: { id: user.id },
      include: { employee: true },
    });
    if (updatedUser) {
      try {
        await emailSvc.sendCustom(req.db, req.tenant?.id, {
          to: updatedUser.email,
          subject: 'Your password has been changed',
          html: `<p>Hello ${updatedUser.employee?.first_name || updatedUser.email},</p>
                 <p>Your password was successfully changed. If this wasn't you, please contact support immediately.</p>`,
        });
      } catch (err) {
        logger.error('[Auth/ChangePwd] Password change notification failed', {
          error: err.message,
          email: updatedUser.email,
          tenantId: req.tenant?.id,
        });
      }
    }

    return sendSuccess(res, null, 'Password changed successfully.');

  } catch (err) {
    console.error('[Auth/ChangePwd] Error:', err.message);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to change password.', 500);
  }
});

// ================================================================
// OTT (One-Time Token)
// ================================================================
const ottStore = new Map();

function cleanExpiredOTTs() {
  if (ottStore.size < 500) return;
  const now = Date.now();
  for (const [k, v] of ottStore) {
    if (v.expiresAt < now) ottStore.delete(k);
  }
}

router.post('/ott/create', auth, async (req, res) => {
  try {
    const { userId, subdomain, accessToken } = req.body;
    if (!userId || !subdomain || !accessToken) {
      return sendError(res, ERROR_CODES.VALIDATION,
        'userId, subdomain, and accessToken are required', 400);
    }

    cleanExpiredOTTs();

    const ott = crypto.randomBytes(32).toString('hex');
    ottStore.set(ott, {
      userId,
      subdomain,
      accessToken,
      expiresAt: Date.now() + 60_000,
    });

    return sendSuccess(res, { ott });

  } catch (err) {
    console.error('[Auth/OTT/Create] Error:', err.message);
    return sendError(res, ERROR_CODES.SERVER, 'OTT creation failed', 500);
  }
});

router.post('/ott/exchange', async (req, res) => {
  try {
    const { ott } = req.body;
    if (!ott) {
      return sendError(res, ERROR_CODES.VALIDATION, 'ott is required', 400);
    }

    const record = ottStore.get(ott);
    if (!record || record.expiresAt < Date.now()) {
      ottStore.delete(ott);
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'OTT expired or invalid.', 401);
    }

    ottStore.delete(ott);

    if (req.db) {
      const user = await req.db.users.findFirst({
        where:   { id: record.userId, is_active: true },
        include: { role: true, employee: true },
      });

      if (user) {
        const permissions  = safeParseJSON(user.role?.permissions);
        const accessToken  = signAccessToken(user, permissions);
        const refreshToken = signRefreshToken(user.id);
        setRefreshCookie(res, refreshToken);

        const tenantInfo = await getTenantInfo(req.tenant?.id || user.company_id);

        const payload = buildUserPayload(user, permissions, tenantInfo);
        // No auth middleware on this route — fallback to false.
        // Frontend should call /auth/me after exchange to get the live value.
        payload.is_platform_admin = req.user?.is_platform_admin || false;

        return sendSuccess(res, { accessToken, user: payload });
      }
    }

    return sendSuccess(res, { accessToken: record.accessToken });

  } catch (err) {
    console.error('[Auth/OTT/Exchange] Error:', err.message);
    return sendError(res, ERROR_CODES.SERVER, 'OTT exchange failed', 500);
  }
});

module.exports = router;
