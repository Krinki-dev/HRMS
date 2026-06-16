﻿'use strict';

const express     = require('express');
const router      = express.Router();
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const os = require('os');
const { encrypt, decrypt } = require('../../shared/utils/encryption');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const auth        = require('../../shared/middleware/auth');
const nodemailer  = require('nodemailer');
const { centralPrisma } = require('../../shared/utils/centralPrisma');
const logger = require('../../shared/utils/logger');
const { THEME } = require('../../shared/utils/uiConstants');
const { resolveTenantDbUrl } = require('./platform.service');

const getCentral = () => centralPrisma;

/**
 * Middleware to enforce platform-level super admin access.
 */
function superAdmin(req, res, next) {
  if (!req.user || (!req.user.is_platform_admin && req.user.role !== 'super_admin')) {
    return sendError(res, ERROR_CODES.FORBIDDEN, `${THEME.ICONS.LOCK} Super admin access required`, 403);
  }
  next();
}

router.use(auth, superAdmin);

/**
 * Safely attempts to decrypt a value.
 * @param {string} val 
 * @returns {string|null}
 */
function tryDecrypt(val) {
  if (!val) return null;
  try { return decrypt(val); } catch (e) { logger.debug(`${THEME.ICONS.LOCK} Decrypt failed for value: ${val.substring(0,10)}...`); return null; }
}

/**
 * Centralized normalization for section IDs to prevent mismatches.
 * Forces IDs to match the Frontend "UN" constants exactly.
 */
function normalizeSectionId(id) {
  const s = String(id || '').toLowerCase();
  if (s.includes('email') || s.includes('smtp')) return 'Email / SMTP';
  if (s.includes('sms')   || s.includes('gate')) return 'SMS gateway';
  if (s.includes('gst'))                         return 'GST settings';
  if (s.includes('mark'))                        return 'Marketing';
  if (s.includes('plat')  || s.includes('brand')) return 'Platform';
  if (s.includes('secu'))                        return 'Security';
  if (s.includes('plan')  || s.includes('subs'))  return 'Subscription Plans';
  return id;
}

function isManagedTenantDb(tenant) {
  return tenant && tenant.db_mode === 'cloud';
}

function isExternalTenantDb(tenant) {
  return tenant && ['external_cloud', 'local', 'hybrid'].includes(tenant.db_mode);
}

const ALL_MODULES = [
  'employees', 'attendance', 'leave', 'payroll', 'compliance',
  'recruitment', 'performance', 'training', 'assets', 'expenses',
  'reports', 'automation', 'notifications', 'settings', 'documents',
];

/**
 * GET /stats
 * Retrieves platform-wide statistics for the super admin dashboard.
 */
router.get('/stats', async (req, res) => {
  try {
    const c = getCentral();

    const [allTenants, recentTenants] = await Promise.all([
      c.$queryRaw`
        SELECT
          COUNT(*)                                                    AS total,
          COUNT(*) FILTER (WHERE is_active = true AND deleted_at IS NULL)  AS active,
          COUNT(*) FILTER (WHERE is_active = false AND deleted_at IS NULL) AS suspended,
          COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)              AS deleted,
          COUNT(*) FILTER (WHERE plan = 'free')                       AS plan_free,
          COUNT(*) FILTER (WHERE plan = 'trial')                      AS plan_trial,
          COUNT(*) FILTER (WHERE plan = 'starter')                    AS plan_starter,
          COUNT(*) FILTER (WHERE plan = 'pro')                        AS plan_pro,
          COUNT(*) FILTER (WHERE plan = 'enterprise')                 AS plan_enterprise,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days' AND deleted_at IS NULL) AS new_this_week,
          COUNT(*) FILTER (WHERE plan_expires_at IS NOT NULL AND plan_expires_at < NOW() + INTERVAL '7 days' AND plan_expires_at > NOW() AND deleted_at IS NULL) AS expiring_soon
        FROM tenants
      `,
      c.$queryRaw`
        SELECT id, name, subdomain, plan, is_active, created_at, admin_email, admin_name
        FROM tenants
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 10
      `,
    ]);

    const stats = allTenants[0] || {};

    return sendSuccess(res, {
      total:         Number(stats.total || 0),
      active:        Number(stats.active || 0),
      suspended:     Number(stats.suspended || 0),
      deleted:       Number(stats.deleted || 0),
      newThisWeek:   Number(stats.new_this_week || 0),
      expiringSoon:  Number(stats.expiring_soon || 0),
      byPlan: {
        free:       Number(stats.plan_free || 0),
        trial:      Number(stats.plan_trial || 0),
        starter:    Number(stats.plan_starter || 0),
        pro:        Number(stats.plan_pro || 0),
        enterprise: Number(stats.plan_enterprise || 0),
      },
      recentTenants: recentTenants.map(t => ({
        id:         t.id,
        name:       t.name,
        subdomain:  t.subdomain,
        plan:       t.plan,
        isActive:   t.is_active,
        adminEmail: t.admin_email,
        adminName:  t.admin_name,
        createdAt:  t.created_at,
      })),
    });
  } catch (err) {
    logger.error(`${THEME.ICONS.ERROR} [Admin/stats] Failure:`, err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to load stats', 500);
  }
});

/**
 * GET /tenants
 * Lists all tenants with pagination, searching, and filtering.
 */
router.get('/tenants', async (req, res) => {
  try {
    const c = getCentral();
    const { search = '', plan = '', status = 'active', limit = 20, cursor } = req.query;
    const take = Math.min(Number(limit) || 20, 100);

    const conditions = [`deleted_at IS NULL`];
    const params = [];
    let idx = 1;

    if (status === 'active')    conditions.push(`is_active = true`);
    if (status === 'suspended') conditions.push(`is_active = false`);

    if (plan) {
      conditions.push(`plan = $${idx++}`);
      params.push(plan);
    }
    if (search) {
      conditions.push(`(name ILIKE $${idx} OR subdomain ILIKE $${idx} OR admin_email ILIKE $${idx} OR gstin ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (cursor) {
      conditions.push(`created_at < (SELECT created_at FROM tenants WHERE id = $${idx++}::uuid)`);
      params.push(cursor);
    }

    const where = conditions.join(' AND ');

    const rows = await c.$queryRawUnsafe(
      `SELECT id, name, subdomain, custom_domain, plan, plan_expires_at,
              is_active, is_setup_complete, admin_name, admin_email, admin_phone,
              gstin, state, city, db_mode, created_at, updated_at
       FROM tenants
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT ${take + 1}`,
      ...params
    );

    const hasMore = rows.length > take;
    const data    = hasMore ? rows.slice(0, take) : rows;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return sendSuccess(res, {
      tenants: data.map(t => ({
        id:             t.id,
        name:           t.name,
        subdomain:      t.subdomain,
        customDomain:   t.custom_domain,
        plan:           t.plan,
        planExpiresAt:  t.plan_expires_at,
        isActive:       t.is_active,
        isSetupComplete: t.is_setup_complete,
        adminName:      t.admin_name,
        adminEmail:     t.admin_email,
        adminPhone:     t.admin_phone,
        gstin:          t.gstin,
        state:          t.state,
        city:           t.city,
        dbMode:         t.db_mode,
        createdAt:      t.created_at,
        updatedAt:      t.updated_at,
      })),
      cursor:  nextCursor,
      hasMore,
    });
  } catch (err) {
    logger.error('[Admin/tenants] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to list tenants', 500);
  }
});

/**
 * GET /tenants/:id
 * Retrieves full details for a specific tenant.
 */
router.get('/tenants/:id', async (req, res) => {
  try {
    const c = getCentral();

    // Fix: Prevent 500 error when ID is "new" or other non-UUID strings
    const id = req.params.id;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return sendError(res, ERROR_CODES.NOT_FOUND, 'Invalid tenant ID format', 404);
    }

    const rows = await c.$queryRaw`
      SELECT * FROM tenants
      WHERE id = ${id}::uuid
        AND deleted_at IS NULL
      LIMIT 1
    `;
    if (!rows.length) return sendError(res, ERROR_CODES.NOT_FOUND, 'Tenant not found', 404);

    const t = rows[0];
    return sendSuccess(res, {
      id:               t.id,
      name:             t.name,
      legalName:        t.legal_name,
      subdomain:        t.subdomain,
      customDomain:     t.custom_domain,
      logoUrl:          t.logo_url,
      plan:             t.plan,
      planExpiresAt:    t.plan_expires_at,
      maxEmployees:     t.max_employees,
      dbMode:           t.db_mode,
      isActive:         t.is_active,
      isSetupComplete:  t.is_setup_complete,
      suspendedAt:      t.suspended_at,
      suspensionReason: t.suspension_reason,
      gstin:            t.gstin,
      pan:              t.pan,
      city:             t.city,
      state:            t.state,
      address:          t.address,
      pincode:          t.pincode,
      gstStatus:        t.gst_status,
      constitution:     t.constitution,
      adminName:        t.admin_name,
      primaryColor:     t.primary_color,
      backgroundColor:  t.background_color,
      backgroundUrl:    t.background_url,
      sitemapUrl:       t.sitemap_url,
      adminEmail:       t.admin_email,
      adminPhone:       t.admin_phone,
      createdAt:        t.created_at,
      updatedAt:        t.updated_at,
    });
  } catch (err) {
    logger.error('[Admin/tenant detail] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to load tenant', 500);
  }
});

/**
 * PUT /tenants/:id
 * Updates tenant subscription and admin contact details.
 */
router.put('/tenants/:id', async (req, res) => {
  try {
    const c = getCentral();
    const {
      plan, planExpiresAt, maxEmployees,
      customDomain, logoUrl,
      primaryColor, backgroundColor, backgroundUrl, sitemapUrl, // Added branding fields
      adminName, adminEmail, adminPhone,
    } = req.body;

    const setParts = [`updated_at = NOW()`];
    const params   = [];
    let idx = 1;

    const set = (col, val) => {
      if (val !== undefined) {
        setParts.push(`${col} = $${idx++}`);
        params.push(val);
      }
    };

    set('plan',             plan);
    set('plan_expires_at',  planExpiresAt);
    set('max_employees',    maxEmployees);
    set('custom_domain',    customDomain);
    set('logo_url',         logoUrl);
    set('primary_color',    primaryColor);
    set('background_color', backgroundColor);
    set('background_url',   backgroundUrl);
    set('sitemap_url',      sitemapUrl);
    set('admin_name',       adminName);
    set('admin_email',      adminEmail);
    set('admin_phone',      adminPhone);

    params.push(req.params.id);

    const rows = await c.$queryRawUnsafe(
      `UPDATE tenants SET ${setParts.join(', ')}
       WHERE id = $${idx}::uuid AND deleted_at IS NULL
       RETURNING id, name, plan, is_active, updated_at`,
      ...params
    );

    if (!rows.length) return sendError(res, ERROR_CODES.NOT_FOUND, 'Tenant not found', 404);
    return sendSuccess(res, rows[0], 'Tenant updated');
  } catch (err) {
    logger.error('[Admin/tenant update] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to update tenant', 500);
  }
});

/**
 * POST /tenants/:id/suspend
 * Suspends a tenant's access to the portal.
 */
router.post('/tenants/:id/suspend', async (req, res) => {
  try {
    const c = getCentral();
    const { reason = '' } = req.body;
    const rows = await c.$queryRaw`
      UPDATE tenants
      SET is_active = false,
          suspended_at = NOW(),
          suspension_reason = ${reason},
          updated_at = NOW()
      WHERE id = ${req.params.id}::uuid AND deleted_at IS NULL
      RETURNING id, name, is_active, suspended_at
    `;
    if (!rows.length) return sendError(res, ERROR_CODES.NOT_FOUND, 'Tenant not found', 404);
    return sendSuccess(res, rows[0], 'Tenant suspended');
  } catch (err) {
    logger.error('[Admin/suspend] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to suspend', 500);
  }
});

/**
 * POST /tenants/:id/activate
 * Re-activates a suspended tenant.
 */
router.post('/tenants/:id/activate', async (req, res) => {
  try {
    const c = getCentral();
    const rows = await c.$queryRaw`
      UPDATE tenants
      SET is_active = true,
          suspended_at = NULL,
          suspension_reason = NULL,
          updated_at = NOW()
      WHERE id = ${req.params.id}::uuid AND deleted_at IS NULL
      RETURNING id, name, is_active
    `;
    if (!rows.length) return sendError(res, ERROR_CODES.NOT_FOUND, 'Tenant not found', 404);
    return sendSuccess(res, rows[0], 'Tenant activated');
  } catch (err) {
    logger.error('[Admin/activate] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to activate', 500);
  }
});

// ================================================================
// POST /api/v1/platform/admin/tenants/:id/delete-permanent
// Body: { password, reason, backup: true }
// ================================================================
/**
 * POST /tenants/:id/delete-permanent
 * Completely wipes a tenant, their schema, and their files. Highly destructive.
 */
router.post('/tenants/:id/delete-permanent', async (req, res) => {
  try {
    const c = getCentral();
    const { password, reason = '', backup = true } = req.body;

    // 1. Verify delete password
    const deletePwd = process.env.SUPER_ADMIN_DELETE_PASSWORD;
    if (!deletePwd) {
      return sendError(res, ERROR_CODES.SERVER, 'Delete password not configured on server', 500);
    }
    if (password !== deletePwd) {
      return sendError(res, ERROR_CODES.FORBIDDEN, 'Incorrect delete password', 403);
    }

    // 2. Fetch tenant info
    const tenantRows = await c.$queryRaw`
      SELECT *
      FROM tenants
      WHERE id = ${req.params.id}::uuid AND deleted_at IS NULL
      LIMIT 1
    `;
    if (!tenantRows.length) return sendError(res, ERROR_CODES.NOT_FOUND, 'Tenant not found', 404);

    const tenant = tenantRows[0];
    const dbUrl = resolveTenantDbUrl(tenant.db_mode, tenant);
    const managedDb = isManagedTenantDb(tenant);
    const externalDb = isExternalTenantDb(tenant);
    const confirmExternalDelete = req.body.confirmExternalDelete === true;

    if (!dbUrl) {
      return sendError(res, ERROR_CODES.SERVER, 'Tenant database URL could not be resolved. Deletion cannot proceed.', 500);
    }

    if (managedDb && !backup) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Backup is required before permanently deleting a cloud-hosted tenant database', 400);
    }
    if (externalDb && !confirmExternalDelete) {
      return sendError(res, ERROR_CODES.VALIDATION, 'External/dedicated tenant databases require explicit confirmation before permanent deletion', 400);
    }

    // 3. Backup entire database/schema (optional)
    let backupUrl = null;
    let backupSucceeded = false;
    if (backup && dbUrl) {
      try {
        const { execSync } = require('child_process');
        const urlObj = new URL(dbUrl);
        const host = urlObj.hostname;
        const port = urlObj.port || '5432';
        const database = urlObj.pathname.replace('/', '');
        const user = urlObj.username;
        const pass = urlObj.password;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup_${tenant.subdomain}_${timestamp}.sql`;
        const filePath = path.join(os.tmpdir(), fileName);

        // Build pg_dump command — if schema_name exists we dump only that schema, else whole DB
        let dumpCmd;
        if (tenant.schema_name) {
          dumpCmd = `pg_dump -h ${host} -p ${port} -U "${user}" -d "${database}" -n "${tenant.schema_name}" -f "${filePath}" --no-owner --no-privileges`;
        } else {
          dumpCmd = `pg_dump -h ${host} -p ${port} -U "${user}" -d "${database}" -f "${filePath}" --no-owner --no-privileges`;
        }
        execSync(dumpCmd, { env: { ...process.env, PGPASSWORD: pass }, shell: true });

        // Upload to MinIO
        const fs = require('fs');
        const minio = require('../../shared/utils/minio');
        if (!fs.existsSync(filePath)) throw new Error('Backup file was not created by pg_dump');
        const stats = fs.statSync(filePath);
        if (!stats.size) throw new Error('Backup file is empty');
        const fileBuffer = fs.readFileSync(filePath);
        await minio.uploadBuffer(fileBuffer, fileName, 'application/sql');
        backupUrl = `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${process.env.MINIO_BUCKET}/${fileName}`;
        fs.unlinkSync(filePath);
        backupSucceeded = true;
      } catch (backupErr) {
        logger.error('[Admin/delete-permanent] Backup failed:', backupErr);
      }
    }

    if (backup && !backupSucceeded) {
      return sendError(res, ERROR_CODES.SERVER, 'Backup failed or could not be verified. Deletion stopped.', 500);
    }

    // 4. Wipe tenant data
    if (dbUrl) {
      const { PrismaClient: TenantPrisma } = require('@prisma/client');
      const tenantDb = new TenantPrisma({ datasources: { db: { url: dbUrl } } });

      if (tenant.schema_name) {
        // Shared DB – drop the tenant's schema entirely
        await tenantDb.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${tenant.schema_name}" CASCADE`);
      } else {
        // Dedicated DB – drop the public schema (all tables) and recreate it
        // This is safe because the database is used by one tenant only.
        await tenantDb.$executeRawUnsafe(`DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public`);
      }
      await tenantDb.$disconnect();
    }

    // 5. Clean up central DB
    await c.$executeRaw`DELETE FROM tenant_modules WHERE tenant_id = ${tenant.id}::uuid`;
    await c.$executeRaw`DELETE FROM central_user_index WHERE company_id = ${tenant.id}::uuid`;
    await c.$executeRaw`DELETE FROM tenant_branch_links WHERE tenant_id = ${tenant.id}::uuid`;
    await c.$executeRaw`DELETE FROM tenants WHERE id = ${tenant.id}::uuid`;

    logger.info(`[Admin] Permanent delete: ${tenant.name} (${tenant.subdomain}). Backup: ${backupUrl || 'none'}, By: ${req.user.email}`);
    return sendSuccess(res, { backupUrl }, 'Tenant and all its data permanently deleted');
  } catch (err) {
    logger.error('[Admin/delete-permanent] Fatal:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Deletion failed', 500);
  }
});

/**
 * DELETE /tenants/:id
 * Soft-deletes a tenant by setting deleted_at.
 */
router.delete('/tenants/:id', async (req, res) => {
  try {
    const c = getCentral();
    await c.$queryRaw`
      UPDATE tenants
      SET deleted_at = NOW(), is_active = false, updated_at = NOW()
      WHERE id = ${req.params.id}::uuid AND deleted_at IS NULL
    `;
    return sendSuccess(res, null, 'Tenant deleted');
  } catch (err) {
    logger.error('[Admin/delete] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to delete', 500);
  }
});

/**
 * GET /tenants/:id/modules
 * Fetches current module access for a tenant.
 */
router.get('/tenants/:id/modules', async (req, res) => {
  try {
    const c = getCentral();
    const rows = await c.$queryRaw`
      SELECT module_name, is_active, enabled_at, disabled_at
      FROM tenant_modules
      WHERE tenant_id = ${req.params.id}::uuid
    `;

    const enabled = new Map(rows.map(r => [r.module_name, r]));

    const modules = ALL_MODULES.map(name => ({
      name,
      isActive:   enabled.has(name) ? enabled.get(name).is_active : false,
      enabledAt:  enabled.get(name)?.enabled_at  || null,
      disabledAt: enabled.get(name)?.disabled_at || null,
    }));

    return sendSuccess(res, { modules });
  } catch (err) {
    logger.error('[Admin/modules get] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to load modules', 500);
  }
});

/**
 * PUT /tenants/:id/modules
 * Updates which modules a tenant has enabled.
 */
router.put('/tenants/:id/modules', async (req, res) => {
  try {
    const c = getCentral();
    const { modules } = req.body;
    if (!Array.isArray(modules)) {
      return sendError(res, ERROR_CODES.VALIDATION, 'modules must be an array', 400);
    }

    for (const m of modules) {
      if (!ALL_MODULES.includes(m.name)) continue;
      await c.$queryRaw`
        INSERT INTO tenant_modules (tenant_id, module_name, is_active, enabled_at, custom_price_paise)
        VALUES (${req.params.id}::uuid, ${m.name}, ${!!m.isActive}, NOW(), ${m.customPricePaise || null})
        ON CONFLICT (tenant_id, module_name) DO UPDATE
          SET is_active  = ${!!m.isActive},
              custom_price_paise = ${m.customPricePaise || null},
              enabled_at  = CASE WHEN ${!!m.isActive} THEN NOW() ELSE tenant_modules.enabled_at END,
              disabled_at = CASE WHEN NOT ${!!m.isActive} THEN NOW() ELSE NULL END
      `;
    }

    return sendSuccess(res, null, 'Modules updated');
  } catch (err) {
    logger.error('[Admin/modules put] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to update modules', 500);
  }
});

/**
 * GET /tenants/:id/notifications
 * Retrieves notification (SMTP/SMS) config directly from the tenant's database.
 */
router.get('/tenants/:id/notifications', async (req, res) => {
  try {
    
    const c = getCentral();
    const tenantRows = await c.$queryRaw`
      SELECT db_url, db_mode, schema_name FROM tenants
      WHERE id = ${req.params.id}::uuid AND deleted_at IS NULL LIMIT 1
    `;
    if (!tenantRows.length) return sendError(res, ERROR_CODES.NOT_FOUND, 'Tenant not found', 404);

    const dbUrl = resolveTenantDbUrl(tenantRows[0].db_mode, tenantRows[0]);
    if (!dbUrl) {
      return sendSuccess(res, { config: null, message: 'Tenant DB not provisioned yet' });
    }

    const tenantDb = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    try {
      const cfg = await tenantDb.notification_config?.findFirst();
      if (!cfg) return sendSuccess(res, { config: null });

      return sendSuccess(res, {
        config: {
          emailProvider: cfg.email_provider,
          emailHost:     cfg.email_host,
          emailPort:     cfg.email_port,
          emailUser:     cfg.email_user,
          emailFrom:     cfg.email_from,
          emailSsl:      cfg.email_ssl,
          emailVerified: cfg.email_verified,
          
          hasEmailPass:  !!cfg.email_pass_enc,
          smsProvider:   cfg.sms_provider,
          smsSenderId:   cfg.sms_sender_id,
          hasSmsKey:     !!cfg.sms_api_key_enc,
          waProvider:    cfg.wa_provider,
          waPhoneId:     cfg.wa_phone_id,
          hasWaKey:      !!cfg.wa_api_key_enc,
        },
      });
    } finally {
      await tenantDb.$disconnect();
    }
  } catch (err) {
    logger.error('[Admin/notifications get] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to load notification config', 500);
  }
});

/**
 * PUT /tenants/:id/notifications
 * Updates notification settings in the tenant's database.
 */
router.put('/tenants/:id/notifications', async (req, res) => {
  try {
    const c = getCentral();
    const tenantRows = await c.$queryRaw`
      SELECT db_url, db_mode, schema_name FROM tenants
      WHERE id = ${req.params.id}::uuid AND deleted_at IS NULL LIMIT 1
    `;
    if (!tenantRows.length) return sendError(res, ERROR_CODES.NOT_FOUND, 'Tenant not found', 404);

    const dbUrl = resolveTenantDbUrl(tenantRows[0].db_mode, tenantRows[0]);
    if (!dbUrl) return sendError(res, ERROR_CODES.VALIDATION, 'Tenant DB not provisioned yet', 400);

    const {
      emailProvider = 'smtp',
      emailHost, emailPort = 587, emailUser, emailPass,
      emailFrom, emailSsl = false,
      smsProvider = 'none', smsApiKey, smsSenderId,
      waProvider = 'none', waApiKey, waPhoneId,
    } = req.body;

    const tenantDb = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    try {
      const data = {
        email_provider:  emailProvider,
        email_host:      emailHost  || null,
        email_port:      emailPort  ? Number(emailPort) : null,
        email_user:      emailUser  || null,
        email_from:      emailFrom  || null,
        email_ssl:       !!emailSsl,
        email_verified:  false, 
        sms_provider:    smsProvider,
        sms_sender_id:   smsSenderId || null,
        wa_provider:     waProvider,
        wa_phone_id:     waPhoneId  || null,
        updated_at:      new Date(),
      };

      if (emailPass) data.email_pass_enc = encrypt(emailPass);
      if (smsApiKey)  data.sms_api_key_enc = encrypt(smsApiKey);
      if (waApiKey)   data.wa_api_key_enc  = encrypt(waApiKey);

      const existing = await tenantDb.notification_config.findFirst();
      if (existing) {
        await tenantDb.notification_config.update({ where: { id: existing.id }, data });
      } else {
        
        const co = await tenantDb.companies.findFirst();
        await tenantDb.notification_config.create({
          data: { ...data, company_id: co?.id || req.params.id },
        });
      }

      return sendSuccess(res, null, 'Notification config saved');
    } finally {
      await tenantDb.$disconnect();
    }
  } catch (err) {
    logger.error('[Admin/notifications put] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to save notification config', 500);
  }
});

/**
 * POST /tenants/:id/notifications/test
 * Sends a test email using the tenant's SMTP configuration.
 */
router.post('/tenants/:id/notifications/test', async (req, res) => {
  try {
    const c = getCentral();
    const tenantRows = await c.$queryRaw`
      SELECT db_url, db_mode, schema_name, admin_email FROM tenants
      WHERE id = ${req.params.id}::uuid AND deleted_at IS NULL LIMIT 1
    `;
    if (!tenantRows.length) return sendError(res, ERROR_CODES.NOT_FOUND, 'Tenant not found', 404);

    const dbUrl = resolveTenantDbUrl(tenantRows[0].db_mode, tenantRows[0]);
    const toEmail  = req.body.toEmail || tenantRows[0].admin_email;

    if (!dbUrl) return sendError(res, ERROR_CODES.VALIDATION, 'Tenant DB not provisioned', 400);
    if (!toEmail) return sendError(res, ERROR_CODES.VALIDATION, 'No email address to test', 400);

    const tenantDb = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    let cfg;
    try {
      cfg = await tenantDb.notification_config.findFirst();
    } finally {
      await tenantDb.$disconnect();
    }

    if (!cfg || !cfg.email_host || !cfg.email_user) {
      return sendError(res, ERROR_CODES.VALIDATION, 'SMTP not configured for this tenant', 400);
    }

    const pass = cfg.email_pass_enc ? tryDecrypt(cfg.email_pass_enc) : '';
    const transporter = nodemailer.createTransport({
      host:   cfg.email_host,
      port:   cfg.email_port || 587,
      secure: cfg.email_ssl  || false,
      auth:   cfg.email_user ? { user: cfg.email_user, pass } : undefined,
      tls:    { rejectUnauthorized: false },
    });

    await transporter.verify();
    await transporter.sendMail({
      from:    cfg.email_from || cfg.email_user,
      to:      toEmail,
      subject: `✅ SMTP test from Syntern HRMS`,
      html: `<p>SMTP configuration is working correctly for your Syntern HRMS account.</p>
             <p>Sent at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>`,
    });

    const tenantDb2 = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    try {
      await tenantDb2.notification_config.update({
        where: { id: cfg.id },
        data:  { email_verified: true, updated_at: new Date() },
      });
    } finally {
      await tenantDb2.$disconnect();
    }

    return sendSuccess(res, { sentTo: toEmail }, 'Test email sent successfully');
  } catch (err) {
    logger.error('[Admin/test email] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, `SMTP test failed: ${err.message}`, 500);
  }
});

/**
 * GET /settings
 * Fetches all global platform settings from the central database.
 */
router.get('/settings', async (req, res) => {
  try {
    const c = getCentral();

    // Get year for analytics stats
    const year = new Date().getFullYear();

    // 1. Define "Source of Truth" structure matching Frontend exactly
    const settings = {
      'Email / SMTP': {
        smtpHost:   process.env.SMTP_HOST || '',
        smtpPort:   Number(process.env.SMTP_PORT || 587),
        smtpUser:   process.env.SMTP_USER || '',
        smtpFrom:   process.env.SMTP_FROM || process.env.SMTP_USER || '',
        smtpSecure: process.env.SMTP_SECURE === 'true',
        smtpPass:   process.env.SMTP_PASS ? '********' : '',
        hasSmtpPass: !!process.env.SMTP_PASS
      },
      'SMS gateway': {
        smsProvider: process.env.SMS_PROVIDER || 'none',
        smsApiKey:   process.env.SMS_API_KEY ? '********' : '',
        smsSenderId: process.env.SMS_SENDER_ID || '',
        hasSmsKey:   !!process.env.SMS_API_KEY
      },
      'GST settings': {
        gstScrapeMode: process.env.GST_SCRAPE_MODE || 'playwright',
        gstCacheDays:  process.env.GST_CACHE_DAYS || '30',
        automationEnabled: true
      },
      'Platform': {
        platformName: process.env.PRODUCT_NAME || 'Syntern HRMS',
        primaryDomain: process.env.PRODUCT_DOMAIN || 'syntern.in',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@syntern.in',
        trialDays:    process.env.DEFAULT_TRIAL_DAYS || '14',
        primaryColor: '#2563eb',
        backgroundColor: '#f8fafc',
        logoUrl:      null,
        sitemapUrl:   null
      },
      'Marketing': {
        heroHeading: "India's smartest HRMS",
        heroSubhead: "Payroll, Compliance, and KYC automation in one place.",
        ctaText: "Start free 14-day trial",
        ctaUrl: "/register",
        pricingStarter: "2999",
        pricingPro: "7999",
        showTestimonials: true
      },
      'Security': {
        jwtExpiry: process.env.JWT_ACCESS_EXPIRES || '15m',
        maxLoginAttempts: process.env.MAX_LOGIN_ATTEMPTS || '5',
        rateLimit: process.env.RATE_LIMIT || '100'
      }
    };

    // 2. Fetch from Database
    const rows = await c.$queryRaw`SELECT id, values FROM platform_settings`;
    logger.info(`${THEME.ICONS.INFO} [Admin/settings] Fetching from DB (Total: ${rows.length} records)`);

    // 3. Merge DB values on top of Environment defaults
    rows.forEach(r => { 
      let vals = r.values || {};
      // Safety: Handle case where DB might return JSON as string
      if (typeof vals === 'string') { try { vals = JSON.parse(vals); } catch (e) { vals = {}; } }

      const key = normalizeSectionId(r.id);

      // Mask sensitive fields in response for browser security
      if (key === 'Email / SMTP'     && vals.smtpPass)  { vals.smtpPass = '********';  vals.hasSmtpPass = true; }
      if (key === 'SMS gateway'      && vals.smsApiKey) { vals.smsApiKey = '********'; vals.hasSmsKey = true; }

      if (settings[key]) {
        settings[key] = { ...settings[key], ...vals }; 
      } else {
        settings[key] = vals; // Unknown section in DB
      }
    });

    logger.debug(`${THEME.ICONS.SUCCESS} [Admin/settings] Fetched sections: ${Object.keys(settings).join(', ')}`);
    
    return sendSuccess(res, settings);
  } catch (err) {
    logger.error(`${THEME.ICONS.ERROR} [Admin/settings fetch] Failure:`, err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to fetch settings', 500);
  }
});

/**
 * GET /analytics
 * Returns platform-wide usage metrics.
 */
router.get('/analytics', async (req, res) => {
  try {
    const c = getCentral();
    const [stats] = await c.$queryRaw`
      SELECT
        COUNT(*)                                                    AS total,
        COUNT(*) FILTER (WHERE is_active = true AND deleted_at IS NULL)  AS active,
        COUNT(*) FILTER (WHERE plan = 'free')                       AS plan_free,
        COUNT(*) FILTER (WHERE plan = 'trial')                      AS plan_trial,
        COUNT(*) FILTER (WHERE plan = 'starter')                    AS plan_starter,
        COUNT(*) FILTER (WHERE plan = 'pro')                        AS plan_pro,
        COUNT(*) FILTER (WHERE plan = 'enterprise')                 AS plan_enterprise,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days' AND deleted_at IS NULL) AS new_this_week
      FROM tenants
    `;

    return sendSuccess(res, {
      total: Number(stats.total || 0),
      active: Number(stats.active || 0),
      newThisWeek: Number(stats.new_this_week || 0),
      byPlan: {
        free: Number(stats.plan_free || 0),
        trial: Number(stats.plan_trial || 0),
        starter: Number(stats.plan_starter || 0),
        pro: Number(stats.plan_pro || 0),
        enterprise: Number(stats.plan_enterprise || 0),
      }
    });
  } catch (err) {
    logger.error(`${THEME.ICONS.ERROR} [Admin/analytics] Failure:`, err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to fetch analytics', 500);
  }
});

/**
 * GET /marketing
 * Returns landing page configuration.
 */
router.get('/marketing', async (req, res) => {
  try {
    const c = getCentral();
    const row = await c.$queryRaw`SELECT values FROM platform_settings WHERE id = 'Marketing' LIMIT 1`;
    return sendSuccess(res, row[0]?.values || {});
  } catch (err) {
    return sendError(res, ERROR_CODES.SERVER, 'Failed to fetch marketing data', 500);
  }
});


/**
 * GET /tenants/:id/pricing
 * Fetches client-specific pricing, caps, and configured discounts.
 */
router.get('/tenants/:id/pricing', async (req, res) => {
  try {
    const c = getCentral();
    const rows = await c.$queryRaw`
      SELECT * FROM tenant_pricing_configs WHERE tenant_id = ${req.params.id}::uuid LIMIT 1
    `;
    return sendSuccess(res, rows[0] || null);
  } catch (err) {
    return sendError(res, ERROR_CODES.SERVER, 'Failed to load pricing config', 500);
  }
});

/**
 * PUT /tenants/:id/pricing
 * Configures custom pricing rules for a specific client (Enterprise deals/Discounts).
 */
router.put('/tenants/:id/pricing', async (req, res) => {
  try {
    const c = getCentral();
    const d = req.body;
    
    await c.$executeRaw`
      INSERT INTO tenant_pricing_configs (
        tenant_id, base_price_paise, employee_cap, per_employee_excess_paise,
        discount_base_pct, discount_bundle_pct, discount_tenure_pct,
        billing_cycle, final_override_paise, updated_at
      ) VALUES (
        ${req.params.id}::uuid, ${d.basePricePaise}, ${d.employeeCap}, ${d.perEmployeeExcessPaise},
        ${d.discountBasePct || 0}, ${d.discountBundlePct || 0}, ${d.discountTenurePct || 0},
        ${d.billingCycle || 'monthly'}, ${d.finalOverridePaise || null}, NOW()
      )
      ON CONFLICT (tenant_id) DO UPDATE SET
        base_price_paise = EXCLUDED.base_price_paise,
        employee_cap = EXCLUDED.employee_cap,
        per_employee_excess_paise = EXCLUDED.per_employee_excess_paise,
        discount_base_pct = EXCLUDED.discount_base_pct,
        discount_bundle_pct = EXCLUDED.discount_bundle_pct,
        discount_tenure_pct = EXCLUDED.discount_tenure_pct,
        billing_cycle = EXCLUDED.billing_cycle,
        final_override_paise = EXCLUDED.final_override_paise,
        updated_at = NOW()
    `;
    return sendSuccess(res, null, 'Pricing configuration updated');
  } catch (err) {
    logger.error('[Admin/pricing update] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to update client pricing', 500);
  }
});

/**
 * PUT /settings
 * Saves global platform configuration (Platform, SMTP, SMS, etc.)
 */
router.put('/settings', async (req, res) => {
  try {
    const c = getCentral();
    let { section, values } = req.body;

    if (!section || !values) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Section and values are required', 400);
    }

    const targetId = normalizeSectionId(section);

    logger.info(`${THEME.ICONS.SAVE} [Admin/settings] Updating section: ${targetId}`);

    // Security: Encrypt sensitive data across different sections
    if (targetId === 'Email / SMTP' && values.smtpPass && values.smtpPass !== '********') {
      values.smtpPass = encrypt(values.smtpPass);
    } else if (targetId === 'Email / SMTP' && values.smtpPass === '********') {
      delete values.smtpPass; 
    }

    if (targetId === 'SMS gateway' && values.smsApiKey && values.smsApiKey !== '********') {
      values.smsApiKey = encrypt(values.smsApiKey);
    } else if (targetId === 'SMS gateway' && values.smsApiKey === '********') {
      delete values.smsApiKey;
    }

    if (targetId === 'GST settings' && values.gstApiKey && values.gstApiKey !== '********') {
      values.gstApiKey = encrypt(values.gstApiKey);
    } else if (targetId === 'GST settings' && values.gstApiKey === '********') {
      delete values.gstApiKey;
    }

    await c.$executeRaw`
      INSERT INTO platform_settings (id, values, updated_at)
      VALUES (${targetId}, ${JSON.stringify(values)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        values = platform_settings.values || ${JSON.stringify(values)}::jsonb,
        updated_at = NOW()
    `;

    return sendSuccess(res, null, 'Settings saved');
  } catch (err) {
    logger.error('[Admin/settings update] Failure:', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to save settings', 500);
  }
});

/**
 * POST /test-smtp
 * Sends a test email using the platform-level SMTP configuration defined in .env.
 */
router.post('/test-smtp', async (req, res) => {
  try {
    const c = getCentral();
    const { toEmail, host, port, user, pass, secure, from } = req.body;
    if (!toEmail) return sendError(res, ERROR_CODES.VALIDATION, `${THEME.ICONS.WARNING} Recipient email required`, 400);

    // 1. Try to get saved settings from DB to use as fallback if not in req.body
    const dbSettings = await c.$queryRaw`SELECT values FROM platform_settings WHERE id = 'Email / SMTP' LIMIT 1`;
    const saved = dbSettings[0]?.values || {};

    // 2. Order of priority: UI Input > Database Saved > .env File
    const smtpHost = host || saved.smtpHost || process.env.SMTP_HOST;
    const smtpPort = Number(port || saved.smtpPort || process.env.SMTP_PORT || 587);
    const smtpUser = user || saved.smtpUser || process.env.SMTP_USER || '';
    const smtpPass = pass || tryDecrypt(saved.smtpPass) || saved.smtpPass || process.env.SMTP_PASS;
    const smtpFrom = from || saved.smtpFrom || process.env.SMTP_FROM || smtpUser;
    
    let smtpSecureInput = secure !== undefined ? secure : saved.smtpSecure;
    
    // Auto-resolve security based on port to prevent "wrong version number" errors
    // Port 587 must use secure: false (STARTTLS)
    // Port 465 must use secure: true (Implicit SSL/TLS)
    let smtpSecure = smtpSecureInput !== undefined ? (smtpSecureInput === 'true' || smtpSecureInput === true) : process.env.SMTP_SECURE === 'true';
    if (smtpPort === 587) smtpSecure = false;
    if (smtpPort === 465) smtpSecure = true;

    const transporter = nodemailer.createTransport({
      host:   smtpHost,
      port:   smtpPort,
      secure: smtpSecure,
      auth:   { user: smtpUser, pass: smtpPass },
      tls:    { rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from:    smtpFrom,
      to:      toEmail,
      subject: `${THEME.ICONS.SUCCESS} Platform SMTP Test`,
      text:    `${THEME.ICONS.INFO} If you are reading this, your platform-level SMTP configuration is working correctly.`,
    });

    return sendSuccess(res, { sentTo: toEmail }, 'Test email sent');
  } catch (err) {
    logger.error(`${THEME.ICONS.ERROR} [Admin/test-smtp] Failure:`, err);
    return sendError(res, ERROR_CODES.SERVER, `${THEME.ICONS.ERROR} SMTP test failed: ${err.message}`, 500);
  }
});

module.exports = router;
