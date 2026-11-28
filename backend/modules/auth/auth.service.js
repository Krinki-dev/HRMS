'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../../shared/utils/logger');
const emailSvc = require('../../shared/utils/emailService');
const { centralPrisma } = require('../../shared/utils/centralPrisma');
const { withPlatformAdminRLS } = require('../../shared/utils/rlsContext');
const { decrypt } = require('../../shared/utils/encryption');
const { resolveTenantStorageTarget } = require('../../shared/utils/tenantStorageResolver');
const { chooseTenantRow } = require('../../shared/utils/tenantSelection');

/**
 * Service to handle Authentication, OTP, and Password logic.
 */
const authService = {
  // ─── Token Management ───────────────────────────────────────────────

  signAccessToken(user, permissions, centralTenantId = null) {
    return jwt.sign(
      {
        id: user.id,
        employeeId: user.employee_id,
        companyId: user.company_id,
        centralTenantId: centralTenantId || null,
        tenantId: centralTenantId || null,
        role: user.role?.name || 'employee',
        permissions,
        email: user.email,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
    );
  },

  signRefreshToken(userId, centralTenantId = null, companyId = null) {
    return jwt.sign(
      { id: userId, centralTenantId: centralTenantId || null, companyId: companyId || null },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
    );
  },

  // ─── Tenant & User Helpers ──────────────────────────────────────────

  async getTenantInfo(tenantId) {
    if (!tenantId) return {};
    try {
      const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
        SELECT id, plan, plan_expires_at, is_setup_complete, name, logo_url
        FROM tenants 
        WHERE id = ${tenantId}::uuid
          AND is_active = true
          AND storage_status = 'ready'
          AND deleted_at IS NULL
        LIMIT 1
      `);
      if (!rows.length) return {};
      return {
        tenantId: rows[0].id,
        plan: rows[0].plan,
        planExpiresAt: rows[0].plan_expires_at,
        isSetupComplete: rows[0].is_setup_complete,
        companyName: rows[0].name,
          logoUrl: rows[0].logo_url || null,
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
          companyLogoUrl: tenantInfo.logoUrl || null,
    };
  },

  // ─── Core Auth Logic ───────────────────────────────────────────────

  async lookupEmail(email, selectedTenantId = null) {
    const normalizedEmail = email.toLowerCase().trim();
    if (selectedTenantId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedTenantId)) {
      return { found: false, choices: [] };
    }

    const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
      SELECT ui.company_id AS tenant_id, ui.subdomain, ui.is_platform_admin,
             t.name AS company_name, t.logo_url, t.is_active, t.plan
      FROM central_user_index ui
      INNER JOIN tenants t ON t.id = ui.company_id
      WHERE LOWER(ui.email) = ${normalizedEmail}
        AND ui.is_active = true
        AND t.is_active = true
        AND t.storage_status = 'ready'
        AND t.deleted_at IS NULL
        AND (${selectedTenantId}::uuid IS NULL OR ui.company_id = ${selectedTenantId}::uuid)
      ORDER BY company_name, ui.company_id
    `);

    let eligibleRows = rows || [];
    if (eligibleRows.length === 0) {
      const tenantRows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
        SELECT id AS tenant_id, name AS company_name, subdomain, logo_url,
               is_active, plan, false AS is_platform_admin
        FROM tenants
        WHERE LOWER(admin_email) = ${normalizedEmail}
          AND is_active = true
          AND storage_status = 'ready'
          AND deleted_at IS NULL
          AND (${selectedTenantId}::uuid IS NULL OR id = ${selectedTenantId}::uuid)
        ORDER BY LOWER(name), id
      `);
      eligibleRows = tenantRows || [];

      for (const tenant of eligibleRows) {
        await withPlatformAdminRLS(centralPrisma, (tx) => tx.$executeRaw`
          INSERT INTO central_user_index (id, email, subdomain, company_id, is_active, created_at)
          VALUES (gen_random_uuid(), ${normalizedEmail}, ${tenant.subdomain}, ${tenant.tenant_id}::uuid, true, NOW())
          ON CONFLICT DO NOTHING
        `);
      }
    }

    const choices = eligibleRows.map((row) => ({
      tenantId: row.tenant_id,
      subdomain: row.subdomain,
      is_platform_admin: !!row.is_platform_admin,
      companyName: row.company_name,
      logoUrl: row.logo_url || null,
      is_active: row.is_active,
      plan: row.plan,
    }));

    return {
      found: choices.length > 0,
      choices,
      ...(choices.length === 1 ? choices[0] : {}),
    };
  },

  async resolveTenantDb(email, selectedTenantId = null) {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      if (selectedTenantId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedTenantId)) {
        return null;
      }

      const userRows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
        SELECT ui.company_id, ui.subdomain, ui.is_platform_admin
        FROM central_user_index ui
        INNER JOIN tenants t ON t.id = ui.company_id
        WHERE LOWER(ui.email) = ${normalizedEmail}
          AND ui.is_active = true
          AND t.is_active = true
          AND t.storage_status = 'ready'
          AND t.deleted_at IS NULL
          AND (${selectedTenantId}::uuid IS NULL OR ui.company_id = ${selectedTenantId}::uuid)
        ORDER BY ui.company_id
      `);

      let selected = chooseTenantRow(userRows, selectedTenantId);
      if (userRows.length > 0 && !selected) {
        // Never select an arbitrary workspace when an email belongs to multiple tenants.
        return null;
      }
      if (!selected) {
        const tenantRows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
          SELECT id, subdomain
          FROM tenants
          WHERE LOWER(admin_email) = ${normalizedEmail}
            AND is_active = true
            AND storage_status = 'ready'
            AND deleted_at IS NULL
            AND (${selectedTenantId}::uuid IS NULL OR id = ${selectedTenantId}::uuid)
          ORDER BY id
        `);
        const tenant = chooseTenantRow(tenantRows, selectedTenantId);
        if (tenantRows.length > 0 && !tenant) return null;
        if (tenant) {
          await withPlatformAdminRLS(centralPrisma, (tx) => tx.$executeRaw`
            INSERT INTO central_user_index (id, email, subdomain, company_id, is_active, created_at)
            VALUES (gen_random_uuid(), ${normalizedEmail}, ${tenant.subdomain}, ${tenant.id}::uuid, true, NOW())
            ON CONFLICT DO NOTHING
          `);
          selected = { company_id: tenant.id, subdomain: tenant.subdomain, is_platform_admin: false };
        }
      }

      if (!selected) return null;
      const tenantCtx = await this.resolveTenantDbById(selected.company_id);
      if (!tenantCtx) return null;
      return {
        ...tenantCtx,
        isPlatformAdmin: !!selected.is_platform_admin,
        subdomain: selected.subdomain,
      };
    } catch (err) {
      logger.error('[AuthService/resolveTenantDb] Error:', err);
      return null;
    }
  },

  async resolveTenantDbById(tenantId) {
    if (!tenantId) return null;
    const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
      SELECT id, subdomain, plan, db_mode, db_url, schema_name,
             storage_tier, storage_status, local_db_type, local_db_host,
             local_db_port, local_db_name, local_db_user, local_db_pass,
             is_active, deleted_at
      FROM tenants
      WHERE id = ${tenantId}::uuid
      LIMIT 1
    `);
    const t = rows[0];
      if (!t || t.deleted_at || !t.is_active) return null;
    const target = resolveTenantStorageTarget(t, {
      cloudDatabaseUrl: process.env.CLOUD_TENANT_DATABASE_URL || (process.env.NODE_ENV === 'development' ? process.env.DEV_TENANT_DATABASE_URL : null),
      decryptValue: (value) => decrypt(value) || value,
    });

    return { url: target.databaseUrl, tenantId: t.id, subdomain: t.subdomain, t, storageTarget: target };
  },

  async sendOtp(db, tenantId, email, purpose) {
    const otp = crypto.randomInt(100000, 1000000).toString();
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
      const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
        SELECT is_platform_admin FROM central_user_index
        WHERE user_id = ${userId}::uuid AND is_active = true
        LIMIT 1
      `);
      return rows.length > 0 ? rows[0].is_platform_admin : false;
    } catch { return false; }
  },

  async isPlatformAdminByEmail(email) {
    if (!process.env.CENTRAL_DATABASE_URL) return false;
    try {
      const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
        SELECT is_platform_admin FROM central_user_index
        WHERE email = ${email.toLowerCase().trim()} AND is_active = true
        LIMIT 1
      `);
      return rows.length > 0 ? rows[0].is_platform_admin : false;
    } catch { return false; }
  },

  // ─── Alternative Lookup Methods (Phone, User ID) ────────────────────

  /**
   * Look up user by mobile phone number across all tenants
   * @param {string} phone - E.164 format: +919876543210
   * @returns {Promise<{found: boolean, subdomain?: string, ...}>}
   */
  async lookupPhone(phone) {
    if (!phone || phone.trim().length === 0) return { found: false, choices: [], error: 'Phone required' };
    try {
      let normalizedPhone = phone.replace(/\D/g, '');
      if (!normalizedPhone.startsWith('91') && normalizedPhone.length === 10) normalizedPhone = '91' + normalizedPhone;
      const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
        SELECT DISTINCT ui.company_id AS tenant_id, ui.subdomain, ui.is_platform_admin,
               t.name AS company_name, t.logo_url, t.is_active, t.plan
        FROM central_user_index ui
        INNER JOIN tenants t ON t.id = ui.company_id
        WHERE ui.phone = ${normalizedPhone}
          AND ui.is_active = true
          AND t.is_active = true
          AND t.storage_status = 'ready'
          AND t.deleted_at IS NULL
        ORDER BY company_name, ui.company_id
      `);
      const choices = (rows || []).map((row) => ({
        tenantId: row.tenant_id, subdomain: row.subdomain,
        is_platform_admin: !!row.is_platform_admin, companyName: row.company_name,
        logoUrl: row.logo_url || null, is_active: row.is_active, plan: row.plan,
      }));
      return { found: choices.length > 0, choices, ...(choices.length === 1 ? choices[0] : {}) };
    } catch (err) {
      logger.error('[AuthService/lookupPhone] Error:', err);
      return { found: false, choices: [], error: err.message };
    }
  },

  async lookupEmployeeId(employeeId) {
    if (!employeeId || employeeId.trim().length === 0) return { found: false, choices: [], error: 'Employee ID required' };
    try {
      const normalizedId = employeeId.toUpperCase().trim();
      const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
        SELECT ui.company_id AS tenant_id, ui.subdomain, ui.is_platform_admin,
               t.name AS company_name, t.logo_url, t.is_active, t.plan, MIN(ui.email) AS email
        FROM central_user_index ui
        INNER JOIN tenants t ON t.id = ui.company_id
        WHERE ui.employee_id = ${normalizedId}
          AND ui.is_active = true
          AND t.is_active = true
          AND t.storage_status = 'ready'
          AND t.deleted_at IS NULL
        GROUP BY ui.company_id, ui.subdomain, ui.is_platform_admin, t.name, t.logo_url, t.is_active, t.plan
        ORDER BY company_name, ui.company_id
      `);
      const choices = (rows || []).map((row) => ({
        tenantId: row.tenant_id, subdomain: row.subdomain,
        is_platform_admin: !!row.is_platform_admin, companyName: row.company_name,
        logoUrl: row.logo_url || null, is_active: row.is_active, plan: row.plan, email: row.email,
      }));
      return { found: choices.length > 0, choices, ...(choices.length === 1 ? choices[0] : {}) };
    } catch (err) {
      logger.error('[AuthService/lookupEmployeeId] Error:', err);
      return { found: false, choices: [], error: err.message };
    }
  },

  async lookupEmailAndPhone(email, phone) {
    if (!email) return this.lookupEmail('');
    if (!phone) return this.lookupEmail(email);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      let normalizedPhone = phone.replace(/\D/g, '');
      if (!normalizedPhone.startsWith('91') && normalizedPhone.length === 10) normalizedPhone = '91' + normalizedPhone;
      const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
        SELECT DISTINCT ui.company_id AS tenant_id, ui.subdomain, ui.is_platform_admin,
               t.name AS company_name, t.logo_url, t.is_active, t.plan
        FROM central_user_index ui
        INNER JOIN tenants t ON t.id = ui.company_id
        WHERE LOWER(ui.email) = ${normalizedEmail}
          AND ui.phone = ${normalizedPhone}
          AND ui.is_active = true
          AND t.is_active = true
          AND t.storage_status = 'ready'
          AND t.deleted_at IS NULL
        ORDER BY company_name, ui.company_id
      `);
      const choices = (rows || []).map((row) => ({
        tenantId: row.tenant_id, subdomain: row.subdomain,
        is_platform_admin: !!row.is_platform_admin, companyName: row.company_name,
        logoUrl: row.logo_url || null, is_active: row.is_active, plan: row.plan,
      }));
      if (choices.length) return { found: true, choices, ...(choices.length === 1 ? choices[0] : {}) };
      return this.lookupEmail(email);
    } catch (err) {
      logger.error('[AuthService/lookupEmailAndPhone] Error:', err);
      return this.lookupEmail(email);
    }
  }
};

module.exports = authService;