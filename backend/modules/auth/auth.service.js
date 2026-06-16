'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../../shared/utils/logger');
const emailSvc = require('../../shared/utils/emailService');
const { centralPrisma } = require('../../shared/utils/centralPrisma');
const { resolveTenantDbUrl } = require('../platform/platform.service');

/**
 * Service to handle Authentication, OTP, and Password logic.
 */
const authService = {
  // ─── Token Management ───────────────────────────────────────────────

  signAccessToken(user, permissions) {
    return jwt.sign(
      {
        id: user.id,
        employeeId: user.employee_id,
        tenantId: user.company_id,
        role: user.role?.name || 'employee',
        permissions,
        email: user.email,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
    );
  },

  signRefreshToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
    );
  },

  // ─── Tenant & User Helpers ──────────────────────────────────────────

  async getTenantInfo(tenantId) {
    if (!tenantId) return {};
    try {
      const rows = await centralPrisma.$queryRaw`
        SELECT id, plan, plan_expires_at, is_setup_complete, name
        FROM tenants 
        WHERE id = ${tenantId}::uuid AND deleted_at IS NULL 
        LIMIT 1
      `;
      if (!rows.length) return {};
      return {
        tenantId: rows[0].id,
        plan: rows[0].plan,
        planExpiresAt: rows[0].plan_expires_at,
        isSetupComplete: rows[0].is_setup_complete,
        companyName: rows[0].name,
      };
    } catch { return {}; }
  },

  buildUserPayload(user, permissions, tenantInfo = {}, isPlatformAdmin = false) {
    const firstName = user.employee?.first_name || '';
    const lastName = user.employee?.last_name || '';

    return {
      id: user.id,
      name: `${firstName} ${lastName}`.trim() || user.email.split('@')[0],
      email: user.email,
      role: user.role?.name || 'employee',
      permissions,
      isFirstLogin: !!(user.is_first_login && user.employee_id),
      hasEmployeeId: !!user.employee_id,
      employeeId: user.employee_id || null,
      is_platform_admin: isPlatformAdmin,
      employee: user.employee ? {
        id: user.employee.id || null,
        firstName: user.employee.first_name,
        lastName: user.employee.last_name,
        photoUrl: user.employee.photo_url || null,
      } : null,
      plan: tenantInfo.plan || 'free',
      isSetupComplete: tenantInfo.isSetupComplete ?? true,
      planExpiresAt: tenantInfo.planExpiresAt || null,
      tenantId: tenantInfo.tenantId || null,
      companyName: tenantInfo.companyName || null,
    };
  },

  // ─── Core Auth Logic ───────────────────────────────────────────────

  async lookupEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // 1. Central Index
    const rows = await centralPrisma.$queryRaw`
      SELECT ui.subdomain, ui.is_platform_admin, t.name AS company_name, t.logo_url, t.is_active, t.plan
      FROM central_user_index ui
      LEFT JOIN tenants t ON t.id = ui.company_id
      WHERE ui.email = ${normalizedEmail} AND ui.is_active = true AND t.deleted_at IS NULL
      LIMIT 1
    `;

    if (rows && rows.length > 0) {
      return { found: true, ...rows[0] };
    }

    // 2. Tenant Admin Check
    const tenantRows = await centralPrisma.$queryRaw`
      SELECT id, name, subdomain, logo_url, is_active, plan
      FROM tenants
      WHERE admin_email = ${normalizedEmail} AND deleted_at IS NULL
      LIMIT 1
    `;

    if (tenantRows.length > 0) {
      const t = tenantRows[0];
      // Auto-index for future
      centralPrisma.$executeRaw`
        INSERT INTO central_user_index (id, email, subdomain, company_id, is_active, created_at)
        VALUES (gen_random_uuid(), ${normalizedEmail}, ${t.subdomain}, ${t.id}, true, NOW())
        ON CONFLICT DO NOTHING
      `.catch(() => {});

      return { 
        found: true, 
        subdomain: t.subdomain, 
        company_name: t.name, 
        logo_url: t.logo_url, 
        is_active: t.is_active,
        plan: t.plan 
      };
    }

    return { found: false };
  },

  async resolveTenantDb(email) {
    try {
      const userRows = await centralPrisma.$queryRaw`
        SELECT * FROM central_user_index 
        WHERE email = ${email.toLowerCase().trim()} AND is_active = true 
        LIMIT 1
      `;
      let u = userRows[0];
      if (!u) {
        const tenantRows = await centralPrisma.$queryRaw`
          SELECT id, subdomain, db_mode, db_url, schema_name, local_db_type,
                 local_db_host, local_db_port, local_db_name, local_db_user,
                 local_db_pass, is_active, deleted_at
          FROM tenants
          WHERE LOWER(admin_email) = LOWER(${email.toLowerCase().trim()})
            AND deleted_at IS NULL
            AND is_active = true
          LIMIT 1
        `;
        if (tenantRows.length > 0) {
          const tenant = tenantRows[0];
          await centralPrisma.$executeRaw`
            INSERT INTO central_user_index (id, email, subdomain, company_id, is_active, created_at)
            VALUES (gen_random_uuid(), ${email.toLowerCase().trim()}, ${tenant.subdomain}, ${tenant.id}::uuid, true, NOW())
            ON CONFLICT DO NOTHING
          `;
          u = { company_id: tenant.id, subdomain: tenant.subdomain, is_platform_admin: false };
        }
      }
      if (!u) return null;

      // Platform admin users are still tied to a company index row
      // and their actual user record lives in the tenant database.
      const tenantCtx = await this.resolveTenantDbById(u.company_id);
      if (!tenantCtx) return null;
      return {
        ...tenantCtx,
        isPlatformAdmin: !!u.is_platform_admin,
        subdomain: u.subdomain,
      };
    } catch (err) {
      logger.error('[AuthService/resolveTenantDb] Error:', err);
      return null;
    }
  },

  async resolveTenantDbById(tenantId) {
    if (!tenantId) return null;
    const rows = await centralPrisma.$queryRaw`
      SELECT id, subdomain, db_mode, db_url, schema_name, local_db_type,
             local_db_host, local_db_port, local_db_name, local_db_user,
             local_db_pass, is_active, deleted_at
      FROM tenants
      WHERE id = ${tenantId}::uuid
      LIMIT 1
    `;
    const t = rows[0];
      if (!t || t.deleted_at || !t.is_active) return null;
    let url = resolveTenantDbUrl(t.db_mode, t);

    // Ensure schema is appended for multi-tenant shared databases
    if (url && t.schema_name) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('schema', t.schema_name.toLowerCase());
      url = urlObj.toString();
    }

    return { url, tenantId: t.id, subdomain: t.subdomain, t };
  },

  async sendOtp(db, tenantId, email, purpose) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.otp_store.create({
      data: {
        identifier: email,
        otp_hash: otpHash,
        purpose,
        expires_at: expiresAt,
      },
    });

    await emailSvc.sendOTP(db, tenantId, {
      email,
      otp,
      purpose,
      expiryMinutes: 10,
    });

    return true;
  },

  async verifyOtp(db, email, otp, purpose) {
    const otpRecord = await db.otp_store.findFirst({
      where: {
        identifier: email,
        purpose,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!otpRecord) return { valid: false, message: 'Invalid or expired OTP' };

    const otpHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (otpHash !== otpRecord.otp_hash) {
      await db.otp_store.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 }
      });
      if (otpRecord.attempts + 1 >= 5) {
        await db.otp_store.delete({ where: { id: otpRecord.id } });
      }
      return { valid: false, message: 'Invalid OTP' };
    }

    await db.otp_store.delete({ where: { id: otpRecord.id } });
    return { valid: true };
  },

  async validateUserLogin(db, email, password) {
    const user = await db.users.findFirst({
      where: { email: email.toLowerCase().trim() },
      include: { role: true, employee: true },
    });

    if (!user) return { success: false, code: 'INVALID_CREDENTIALS' };
    if (!user.is_active) return { success: false, code: 'ACCOUNT_INACTIVE' };

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return { success: false, code: 'INVALID_CREDENTIALS' };

    // Background update
    db.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    }).catch(e => logger.warn(`[AuthService] last_login_at update failed: ${e.message}`));

    return { success: true, user };
  },

  async isPlatformAdmin(userId) {
    if (!process.env.CENTRAL_DATABASE_URL) return false;
    try {
      const rows = await centralPrisma.$queryRaw`
        SELECT is_platform_admin FROM central_user_index
        WHERE user_id = ${userId}::uuid AND is_active = true
        LIMIT 1
      `;
      return rows.length > 0 ? rows[0].is_platform_admin : false;
    } catch { return false; }
  },

  async isPlatformAdminByEmail(email) {
    if (!process.env.CENTRAL_DATABASE_URL) return false;
    try {
      const rows = await centralPrisma.$queryRaw`
        SELECT is_platform_admin FROM central_user_index
        WHERE email = ${email.toLowerCase().trim()} AND is_active = true
        LIMIT 1
      `;
      return rows.length > 0 ? rows[0].is_platform_admin : false;
    } catch { return false; }
  }
};

module.exports = authService;