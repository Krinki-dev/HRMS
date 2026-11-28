/**
 * @file auth.routes.js
 * @description Authentication and authorization entry points for the HRMS.
 * Phase-0: Added WS ticket endpoint + lookup rate limiter.
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
const eventNotifier = require('../notifications/event-notifier.service');
const { centralPrisma } = require('../../shared/utils/centralPrisma');

const { issueTicket } = require('../../shared/utils/wsTicket');
const { withPlatformAdminRLS } = require('../../shared/utils/rlsContext');
const { selectPasswordResetWorkspace } = require('../../shared/utils/passwordResetWorkspace');

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

// Phase-0: Rate limit lookup endpoints to prevent email enumeration via timing attacks
const lookupLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1-minute window
  max: 20,                  // 20 lookups per minute per IP
  message: 'Too many lookup requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  skip: (req) => process.env.NODE_ENV === 'development' && !process.env.TEST_LIMITER,
});

// ── Helpers ───────────────────────────────────────────────────────
const safeParseJSON = (str, fallback = {}) => {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return fallback; }
};

function signAccessToken(user, permissions, centralTenantId = null) {
  if (!process.env.JWT_ACCESS_SECRET) throw new Error('SERVER_CONFIG_ERROR: JWT_ACCESS_SECRET is not set');
  return jwt.sign(
    {
      id:         user.id,
      employeeId: user.employee_id,
      companyId:  user.company_id,
      centralTenantId: centralTenantId || null,
      tenantId:   centralTenantId || null,
      role:       user.role?.name || 'employee',
      permissions,
      email:      user.email,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
}

function signRefreshToken(userId, centralTenantId = null, companyId = null) {
  if (!process.env.JWT_REFRESH_SECRET) throw new Error('SERVER_CONFIG_ERROR: JWT_REFRESH_SECRET is not set');
  return jwt.sign(
    { id: userId, centralTenantId: centralTenantId || null, companyId: companyId || null },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
}

function setRefreshCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });
}

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
    is_platform_admin: false,
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

async function handleAuthLookup(req, res) {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Email is required', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const result = await authService.lookupEmail(normalizedEmail, req.tenant?.id || null);
    const isDev = process.env.NODE_ENV === 'development';

    if (result.found) {
      if (result.is_active === false) {
        return sendError(res, ERROR_CODES.LICENCE,
          'This account is suspended. Contact support@syntern.in', 403);
      }
      return sendSuccess(res, {
        found: true,
        choices: result.choices || [],
        ...(result.choices?.length === 1 ? result.choices[0] : {}),
      });
    }

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

// Apply lookupLimiter to all lookup variants
router.post('/lookup',             lookupLimiter, handleAuthLookup);

router.post('/lookup-companies', lookupLimiter, async (req, res) => {
  let activeDb = req.db || null;
  let isTemporary = false;
  try {
    const { email, tenantId: requestedTenantId = null } = req.body || {};
    if (!email?.trim()) return sendSuccess(res, { found: false, choices: [] });
    const normalizedEmail = email.toLowerCase().trim();
    const requestTenantId = req.tenant?.id || null;
    if (requestedTenantId && requestTenantId && requestedTenantId !== requestTenantId) {
      return sendSuccess(res, { found: false, choices: [] });
    }
    const tenantId = requestTenantId || requestedTenantId;
    if (!activeDb) {
      if (!tenantId) return sendSuccess(res, { found: false, choices: [] });
      const membership = await authService.lookupEmail(normalizedEmail, tenantId);
      if (!membership.found) return sendSuccess(res, { found: false, choices: [] });
      const tenantContext = await authService.resolveTenantDbById(tenantId);
      if (!tenantContext?.url) return sendSuccess(res, { found: false, choices: [] });
      const { PrismaClient } = require('@prisma/client');
      activeDb = new PrismaClient({ datasources: { db: { url: tenantContext.url } } });
      isTemporary = true;
    }
    const choices = await authService.lookupCompanies(activeDb, normalizedEmail, tenantId);
    return sendSuccess(res, { found: choices.length > 0, choices });
  } catch (err) {
    logger.error('[Auth/LookupCompanies] Failure:', { message: err.message });
    return sendSuccess(res, { found: false, choices: [] });
  } finally {
    if (isTemporary && activeDb) {
      try { await activeDb.$disconnect(); } catch (err) {
        logger.warn('[Auth/LookupCompanies] Temporary client disconnect failed', { error: err.message });
      }
    }
  }
});

lookupRouter.post('/',             lookupLimiter, handleAuthLookup);
router.post('/lookup-phone',       lookupLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !phone.trim()) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Phone number is required', 400);
    }
    const result = await authService.lookupPhone(phone);
    if (!result.found) return sendSuccess(res, { found: false });
    return sendSuccess(res, {
      found: true,
      choices: result.choices || [],
      ...(result.choices?.length === 1 ? result.choices[0] : {}),
    });
  } catch (err) {
    logger.error('[Auth/LookupPhone] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Phone lookup failed. Please try again.', 500);
  }
});

router.post('/lookup-employeeid', lookupLimiter, async (req, res) => {
  try {
    const { employee_id } = req.body;
    if (!employee_id || !employee_id.trim()) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Employee ID is required', 400);
    }
    const result = await authService.lookupEmployeeId(employee_id);
    if (!result.found) return sendSuccess(res, { found: false });
    return sendSuccess(res, {
      found: true,
      choices: result.choices || [],
      ...(result.choices?.length === 1 ? result.choices[0] : {}),
    });
  } catch (err) {
    logger.error('[Auth/LookupEmployeeId] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Employee ID lookup failed. Please try again.', 500);
  }
});

router.post('/lookup-phone-email', lookupLimiter, async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email || !email.trim()) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Email is required', 400);
    }
    const result = await authService.lookupEmailAndPhone(email, phone);
    if (!result.found) return sendSuccess(res, { found: false });
    return sendSuccess(res, {
      found: true,
      choices: result.choices || [],
      ...(result.choices?.length === 1 ? result.choices[0] : {}),
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

async function getActiveContext(req, email) {
  const normalizedEmail = email.toLowerCase().trim();
  if (req.db) {
    const requestTenantId = req.body?.tenantId || null;
    const resolvedTenantId = req.tenant?.id || null;
    if (requestTenantId && requestTenantId !== resolvedTenantId) {
      return { activeDb: null, tenantId: null, isTemporary: false };
    }
    return { activeDb: req.db, tenantId: resolvedTenantId, isTemporary: false };
  }
  const selectedTenantId = req.body?.tenantId || null;
  const ctx = await authService.resolveTenantDb(normalizedEmail, selectedTenantId);
  if (!ctx) return { activeDb: null, isTemporary: false };
  const { PrismaClient } = require('@prisma/client');
  const client = new PrismaClient({ datasources: { db: { url: ctx.url } } });
  return { activeDb: client, tenantId: ctx.tenantId, isTemporary: true };
}

async function resolveCompanyForEmail(activeDb, tenantId, email, requestedCompanyId = null) {
  return authService.resolveUserIdentity(activeDb, tenantId, email, requestedCompanyId);
}

router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { email, companyId: requestedCompanyId = null, purpose = 'login' } = req.body;
    if (!email || !email.trim()) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Email is required', 400);
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (!ALLOWED_OTP_PURPOSES.has(purpose)) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Invalid OTP purpose', 400);
    }
    const { activeDb, tenantId, isTemporary } = await getActiveContext(req, normalizedEmail);
    if (!activeDb) return sendSuccess(res, null, 'Process completed');
    try {
      const companyResolution = await resolveCompanyForEmail(activeDb, tenantId, normalizedEmail, requestedCompanyId);
      if (companyResolution.status === 'selection_required') {
        return sendSuccess(res, { requiresCompanySelection: true, choices: companyResolution.choices }, 'Select a company to continue.');
      }
      if (companyResolution.status !== 'selected') return sendSuccess(res, null, 'If that email is registered, an OTP has been sent.');
      await authService.sendOtp(activeDb, tenantId, companyResolution.companyId, normalizedEmail, purpose);
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
    const { email, otp, companyId: requestedCompanyId = null, purpose = 'login' } = req.body;
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
    const companyResolution = await resolveCompanyForEmail(activeDb, tenantId, normalizedEmail, requestedCompanyId);
    if (companyResolution.status === 'selection_required') {
      if (isTemporary) await activeDb.$disconnect();
      return sendError(res, ERROR_CODES.VALIDATION, 'COMPANY_SELECTION_REQUIRED', 409, { choices: companyResolution.choices });
    }
    if (companyResolution.status !== 'selected') {
      if (isTemporary) await activeDb.$disconnect();
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Invalid or expired OTP', 401);
    }
    const companyId = companyResolution.companyId;
    const verify = await authService.verifyOtp(activeDb, tenantId, companyId, normalizedEmail, otp, purpose);
    if (!verify.valid) {
      if (isTemporary) setTimeout(() => activeDb.$disconnect(), 5000);
      return sendError(res, ERROR_CODES.UNAUTHORIZED, verify.message, 401);
    }
    if (purpose === 'login') {
      const user = await activeDb.users.findFirst({
        where: { id: companyResolution.userId, email: normalizedEmail, company_id: companyResolution.companyId, is_active: true },
        include: { role: true, employee: true },
      });
      const permissions = safeParseJSON(user.role?.permissions);
      const accessToken = authService.signAccessToken(user, permissions, tenantId || null);
      const refreshToken = authService.signRefreshToken(user.id, tenantId || null, user.company_id || null);
      setRefreshCookie(res, refreshToken);
      const tenantInfo = await authService.getTenantInfo(tenantId || null);
      const isPlatformAdmin = await authService.isPlatformAdmin(user.id);
      const payload = authService.buildUserPayload(user, permissions, tenantInfo, isPlatformAdmin);
      eventNotifier.notifyLogin({
        db: activeDb,
        tenantId,
        companyId: user.company_id,
        user,
        ipAddress: req.ip,
      }).catch((err) => {
        logger.warn('[Auth/VerifyOTP] Login notification failed', { error: err.message });
      });
      if (isTemporary) setTimeout(() => activeDb.$disconnect(), 5000);
      return sendSuccess(res, { accessToken, user: payload }, 'Login successful');
    }
    if (isTemporary) setTimeout(() => activeDb.$disconnect(), 5000);
    return sendSuccess(res, null, 'OTP verified successfully');
  } catch (err) {
    console.error('[Auth/VerifyOTP] Error:', err.message);
    return sendError(res, ERROR_CODES.SERVER, 'OTP verification failed. Please try again.', 500);
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password, companyId = null } = req.body;
    if (!email || !password) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Email and password are required', 400);
    }
    const normalizedEmail = email.toLowerCase().trim();
    let { activeDb, tenantId, isTemporary } = await getActiveContext(req, normalizedEmail);
    if (!activeDb) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'INVALID_CREDENTIALS', 401);
    }
    const result = await authService.validateUserLogin(activeDb, tenantId, normalizedEmail, password, companyId);
    if (!result.success) {
      if (isTemporary) setTimeout(() => activeDb.$disconnect(), 5000);
      return sendError(res, ERROR_CODES.UNAUTHORIZED, result.code, 401);
    }
    const { user } = result;
    const permissions = safeParseJSON(user.role?.permissions);
    const accessToken = authService.signAccessToken(user, permissions, tenantId || null);
    const refreshToken = authService.signRefreshToken(user.id, tenantId || null, user.company_id || null);
    setRefreshCookie(res, refreshToken);
    const tenantInfo = await authService.getTenantInfo(tenantId || null);
    const isPlatformAdmin = await authService.isPlatformAdmin(user.id);
    const payload = authService.buildUserPayload(user, permissions, tenantInfo, isPlatformAdmin);
    eventNotifier.notifyLogin({
      db: activeDb,
      tenantId,
      companyId: user.company_id,
      user,
      ipAddress: req.ip,
    }).catch((err) => {
      logger.warn('[Auth/Login] Login notification failed', { error: err.message });
    });
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
    if (decoded.centralTenantId && req.tenant?.id && decoded.centralTenantId !== req.tenant.id) {
      res.clearCookie('refreshToken');
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Refresh token belongs to a different workspace.', 401);
    }
    let resolvedCentralTenantId = decoded.centralTenantId || req.tenant?.id || null;

    if (!activeDb) {
      // A signed tenant claim is already an explicit workspace selection.
      // Resolve that tenant directly; do not depend on a possibly incomplete
      // central_user_index user_id backfill for normal refreshes.
      if (!resolvedCentralTenantId) {
        // Legacy tokens without a tenant claim may only resolve when there is
        // exactly one active membership. Never choose the first of many.
        const memberships = await withPlatformAdminRLS(centralPrisma, (tx) => tx.central_user_index.findMany({
          where: { user_id: decoded.id, is_active: true },
          select: { company_id: true },
          take: 2,
        }));
        if (memberships.length !== 1) {
          res.clearCookie('refreshToken');
          return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Workspace selection is required to refresh this session.', 401);
        }
        resolvedCentralTenantId = memberships[0].company_id;
      }

      const ctx = await authService.resolveTenantDbById(resolvedCentralTenantId);
      if (!ctx) {
        res.clearCookie('refreshToken');
        return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Workspace is no longer available for this session.', 401);
      }
      const { PrismaClient } = require('@prisma/client');
      activeDb = new PrismaClient({ datasources: { db: { url: ctx.url } } });
      isTemporary = true;
    }

    if (!activeDb) return sendError(res, ERROR_CODES.SERVER, 'Configuration error.', 500);
    const userWhere = { id: decoded.id, is_active: true };
    if (decoded.companyId && activeDb !== centralPrisma) userWhere.company_id = decoded.companyId;
    const user = await activeDb.users.findFirst({
      where: userWhere,
      include: { role: true, employee: true },
    });
    if (!user) {
      if (isTemporary) await activeDb.$disconnect();
      res.clearCookie('refreshToken');
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'User not found.', 401);
    }
    if (decoded.companyId && user.company_id && decoded.companyId !== user.company_id) {
      if (isTemporary) await activeDb.$disconnect();
      res.clearCookie('refreshToken');
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Refresh token company identity does not match the user.', 401);
    }
    const permissions = safeParseJSON(user.role?.permissions);
    const accessToken = authService.signAccessToken(user, permissions, resolvedCentralTenantId);
    const rotatedRefreshToken = authService.signRefreshToken(user.id, resolvedCentralTenantId, user.company_id || decoded.companyId || null);
    setRefreshCookie(res, rotatedRefreshToken);
    const tenantInfo = await authService.getTenantInfo(resolvedCentralTenantId);
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

router.post('/logout', auth, async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken && req.db) {
      if (req.user?.id) {
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
            logger.warn(`[Auth/Logout] Blacklist failed: ${e.message}`);
          }
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
    const tenantInfo  = await authService.getTenantInfo(req.tenant?.id || req.user?.centralTenantId || null);
    const payload = buildUserPayload(user, permissions, tenantInfo);
    payload.is_platform_admin = req.user.is_platform_admin;
    return sendSuccess(res, payload);
  } catch (err) {
    console.error('[Auth/Me] Error:', err.message);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to get user info.', 500);
  }
});

router.post('/forgot-password', async (req, res) => {
  let activeDb = null;
  let isTemporaryClient = false;
  try {
    const { email, tenantId: requestedTenantId = null, companyId: requestedCompanyId = null } = req.body;
    if (!email?.trim()) return sendError(res, ERROR_CODES.VALIDATION, 'Email is required', 400);

    const normalizedEmail = email.toLowerCase().trim();
    const requestTenantId = req.tenant?.id || null;
    if (requestedTenantId && requestTenantId && requestedTenantId !== requestTenantId) {
      return sendSuccess(res, null, 'If that email exists, a reset link has been sent.');
    }

    // lookupEmail validates that the selected Central tenant is an eligible
    // workspace for this address. Multiple memberships require an explicit
    // selection; never fall back to the first Central index row.
    const lookup = await authService.lookupEmail(normalizedEmail, requestedTenantId || requestTenantId);
    const resolution = selectPasswordResetWorkspace(
      lookup.choices || [],
      requestedTenantId,
      requestTenantId
    );
    if (resolution.status !== 'selected') {
      return sendSuccess(res, null, 'If that email exists, a reset link has been sent.');
    }

    const tenantId = resolution.tenant.tenantId;
    const tenantContext = await authService.resolveTenantDbById(tenantId);
    if (!tenantContext?.url) {
      return sendSuccess(res, null, 'If that email exists, a reset link has been sent.');
    }

    if (req.db && requestTenantId === tenantId) {
      activeDb = req.db;
    } else {
      const { PrismaClient } = require('@prisma/client');
      activeDb = new PrismaClient({ datasources: { db: { url: tenantContext.url } } });
      isTemporaryClient = true;
    }

    const companyResolution = await resolveCompanyForEmail(activeDb, normalizedEmail, requestedCompanyId);
    if (companyResolution.status !== 'selected') {
      return sendSuccess(res, null, 'If that email exists, a reset link has been sent.');
    }
    const companyId = companyResolution.companyId;
    const user = await activeDb.users.findFirst({
      where: { id: companyResolution.userId, email: normalizedEmail, company_id: companyResolution.companyId, is_active: true },
      include: { employee: true },
    });
    if (!user) {
      return sendSuccess(res, null, 'If that email exists, a reset link has been sent.');
    }

    // Keep reset-token creation and email delivery in the same selected
    // tenant database. This prevents cross-workspace token/database mismatch.
    await activeDb.password_resets.deleteMany({ where: { user_id: user.id } });
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await activeDb.password_resets.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        type: 'reset',
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const subdomain = tenantContext.subdomain || resolution.tenant.subdomain || 'app';
    const resetLink = process.env.NODE_ENV === 'development'
      ? `http://${subdomain}.syntern.in:5173/reset-password?token=${token}`
      : `https://${subdomain}.syntern.in/reset-password?token=${token}`;

    try {
      await emailSvc.sendPasswordReset(activeDb, tenantId, {
        email: normalizedEmail,
        name: user.employee
          ? `${user.employee.first_name} ${user.employee.last_name}`
          : normalizedEmail,
        resetLink,
      });
    } catch (err) {
      logger.error('[Auth/ForgotPwd] Email send failed', { error: err.message });
    }

    if (process.env.NODE_ENV === 'development') console.log(`[DEV] Reset link: ${resetLink}`);
    return sendSuccess(res, null, 'If that email exists, a reset link has been sent.');
  } catch (err) {
    logger.error('[Auth/ForgotPwd] Error:', { message: err.message });
    return sendError(res, ERROR_CODES.SERVER, 'Reset request failed. Please try again.', 500);
  } finally {
    if (isTemporaryClient && activeDb) {
      try { await activeDb.$disconnect(); } catch (err) {
        logger.warn('[Auth/ForgotPwd] Temporary tenant client disconnect failed', { error: err.message });
      }
    }
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return sendError(res, ERROR_CODES.VALIDATION, 'Token and new password are required', 400);
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Password must be 8+ characters with uppercase, number, and special character', 400);
    }
    if (!req.db) return sendError(res, ERROR_CODES.SERVER, 'Server configuration error.', 500);
    const tokenHash   = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await req.db.password_resets.findFirst({
      where: { token_hash: tokenHash, used: false, expires_at: { gt: new Date() } },
    });
    if (!resetRecord) return sendError(res, ERROR_CODES.VALIDATION, 'INVALID_TOKEN', 400);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const updatedByReset = await req.db.users.update({ where: { id: resetRecord.user_id }, data: { password_hash: passwordHash, is_first_login: false } });
    await req.db.password_resets.update({ where: { id: resetRecord.id }, data: { used: true } });
    eventNotifier.notifyPasswordChanged({
      db: req.db,
      tenantId: req.tenant?.id || null,
      companyId: updatedByReset.company_id,
      userId: updatedByReset.id,
    }).catch((err) => {
      logger.warn('[Auth/ResetPwd] Password change notification failed', { error: err.message });
    });
    return sendSuccess(res, null, 'Password updated. You can now sign in.');
  } catch (err) {
    console.error('[Auth/ResetPwd] Error:', err.message);
    return sendError(res, ERROR_CODES.SERVER, 'Password reset failed. Please try again.', 500);
  }
});

router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return sendError(res, ERROR_CODES.VALIDATION, 'Current and new password are required', 400);
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Password must be 8+ characters with uppercase, number, and special character', 400);
    }
    if (!req.db) return sendError(res, ERROR_CODES.SERVER, 'Server configuration error.', 500);
    const user = await req.db.users.findUnique({ where: { id: req.user.id } });
    if (!user) return sendError(res, ERROR_CODES.NOT_FOUND, 'User not found.', 404);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return sendError(res, ERROR_CODES.UNAUTHORIZED, 'WRONG_PASSWORD', 401);
    const sameAsOld = await bcrypt.compare(newPassword, user.password_hash);
    if (sameAsOld) return sendError(res, ERROR_CODES.VALIDATION, 'New password must be different from your current password', 400);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const changedUser = await req.db.users.update({ where: { id: user.id }, data: { password_hash: passwordHash, is_first_login: false } });
    const updatedUser = await req.db.users.findUnique({ where: { id: user.id }, include: { employee: true } });
    if (updatedUser) {
      try {
        await emailSvc.sendCustom(req.db, req.tenant?.id, {
          to: updatedUser.email,
          subject: 'Your password has been changed',
          html: `<p>Hello ${updatedUser.employee?.first_name || updatedUser.email},</p><p>Your password was changed. If this wasn't you, contact support immediately.</p>`,
        });
      } catch (err) {
        logger.error('[Auth/ChangePwd] Notification failed', { error: err.message });
      }
    }
    eventNotifier.notifyPasswordChanged({
      db: req.db,
      tenantId: req.tenant?.id || null,
      companyId: changedUser.company_id,
      userId: changedUser.id,
    }).catch((err) => {
      logger.warn('[Auth/ChangePwd] Password change notification failed', { error: err.message });
    });
    return sendSuccess(res, null, 'Password changed successfully.');
  } catch (err) {
    console.error('[Auth/ChangePwd] Error:', err.message);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to change password.', 500);
  }
});

// ── OTT (One-Time Token for tenant switching) ────────────────────────────────
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
      return sendError(res, ERROR_CODES.VALIDATION, 'userId, subdomain, and accessToken are required', 400);
    }
    cleanExpiredOTTs();
    const ott = crypto.randomBytes(32).toString('hex');
    ottStore.set(ott, { userId, subdomain, accessToken, expiresAt: Date.now() + 60_000 });
    return sendSuccess(res, { ott });
  } catch (err) {
    console.error('[Auth/OTT/Create] Error:', err.message);
    return sendError(res, ERROR_CODES.SERVER, 'OTT creation failed', 500);
  }
});

router.post('/ott/exchange', async (req, res) => {
  try {
    const { ott } = req.body;
    if (!ott) return sendError(res, ERROR_CODES.VALIDATION, 'ott is required', 400);
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
        const accessToken  = signAccessToken(user, permissions, req.tenant?.id || null);
        const refreshToken = signRefreshToken(user.id, req.tenant?.id || null, user.company_id || null);
        setRefreshCookie(res, refreshToken);
        const tenantInfo = await authService.getTenantInfo(req.tenant?.id || null);
        const payload = buildUserPayload(user, permissions, tenantInfo);
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

// ── Phase-0: WS Ticket endpoint ──────────────────────────────────────────────
// Replaces raw JWT in WebSocket upgrade URL (which leaks into server access logs)
// Client calls POST /auth/ws-ticket → gets { ticket } → opens ws://host/ws?ticket=...
router.post('/ws-ticket', auth, async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const companyId = req.user?.companyId;
    if (!req.db || !tenantId || !companyId || req.user?.centralTenantId !== tenantId) {
      return sendError(res, ERROR_CODES.FORBIDDEN, 'A verified tenant workspace is required for real-time notifications.', 403);
    }

    const membership = await req.db.users.findFirst({
      where: { id: req.user.id, company_id: companyId, is_active: true },
      select: { id: true, company_id: true },
    });
    if (!membership || membership.company_id !== companyId) {
      return sendError(res, ERROR_CODES.FORBIDDEN, 'Active company membership is required for real-time notifications.', 403);
    }

    const ticket = issueTicket({
      userId: membership.id,
      tenantId,
      companyId: membership.company_id,
    });
    return sendSuccess(res, { ticket }, 'WS ticket issued');
  } catch (err) {
    logger.error('[Auth/WsTicket] Error:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Could not issue WS ticket.', 500);
  }
});

module.exports = router;
