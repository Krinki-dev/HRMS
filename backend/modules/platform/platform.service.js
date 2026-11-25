﻿﻿﻿/**
 * @file platform.service.js
 * @description Handles tenant lifecycle operations, database resolution, and multi-tenancy setup.
 */
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 }   = require('uuid');
const bcrypt           = require('bcryptjs');
const { encrypt, decrypt } = require('../../shared/utils/encryption');
const { buildStorageDescriptor } = require('../../shared/utils/tenantStorageConfig');
const { buildLocalPostgresUrl, resolveTenantStorageTarget } = require('../../shared/utils/tenantStorageResolver');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const { centralPrisma } = require('../../shared/utils/centralPrisma');
const { withPlatformAdminRLS } = require('../../shared/utils/rlsContext');
const emailService = require('../../shared/utils/emailService');
const logger = require('../../shared/utils/logger');

/**
 * Compatibility wrapper for older callers. All tenant DB routing must use the
 * audited storage lifecycle; this deliberately rejects legacy/unclassified
 * records and unsupported database modes instead of silently falling back.
 */
function resolveTenantDbUrl(dbMode, tenantData, optionalUrl) {
  const tenant = {
    ...tenantData,
    db_mode: dbMode || tenantData?.db_mode,
    db_url: tenantData?.db_url || optionalUrl || null,
  };
  return resolveTenantStorageTarget(tenant, {
    cloudDatabaseUrl: process.env.CLOUD_TENANT_DATABASE_URL || (process.env.NODE_ENV === 'development' ? process.env.DEV_TENANT_DATABASE_URL : null),
    decryptValue: (value) => decrypt(value) || value,
  }).databaseUrl;
}

/**
 * Internal helper to provision default modules for a new tenant.
 */
async function provisionDefaultModules(tx, tenantId) {
  const modules = ['employees', 'attendance', 'leave', 'payroll', 'compliance', 'settings'];
  for (const m of modules) {
    await tx.$executeRaw`
      INSERT INTO tenant_modules (id, tenant_id, module_name, is_active, enabled_at)
      VALUES (${uuidv4()}::uuid, ${tenantId}::uuid, ${m}, true, NOW())
    `;
  }
}

/**
 * Registers a new tenant (company) on the platform.
 * This involves central DB entry, module provisioning, and optional schema cloning.
 */
const registerTenant = async (req, res) => {
  try {
    const { company, subdomain, customDomain, dbMode: requestedDbMode, localDb, externalDbUrl, admin, consent } = req.body;
    const dbMode = requestedDbMode || 'cloud';
    
    // 1. Validation
    const missing = [];
    if (!company?.name?.trim())  missing.push('Company name');
    if (!consent)                missing.push('Consent to Privacy Policy');
    if (!admin?.email?.trim())   missing.push('Admin email');
    if (!admin?.name?.trim())    missing.push('Admin full name');
    if (!subdomain?.trim())      missing.push('Subdomain');
    if (!admin?.password)        missing.push('Password');
    
    if (missing.length > 0)
      return sendError(res, ERROR_CODES.VALIDATION, `Required: ${missing.join(', ')}`, 400);

    if (admin.password.length < 8)
      return sendError(res, ERROR_CODES.VALIDATION, 'Password must be at least 8 characters', 400);

    if (!/^[a-z0-9-]+$/.test(subdomain.toLowerCase().trim()))
      return sendError(res, ERROR_CODES.VALIDATION, 'Subdomain: lowercase letters, numbers, hyphens only', 400);

    const reserved = ['api', 'admin', 'platform', 'app', 'www', 'mail', 'syntern'];
    const cleanSubdomain = subdomain.toLowerCase().trim();
    if (reserved.includes(cleanSubdomain)) {
      return sendError(res, ERROR_CODES.VALIDATION, `Subdomain "${cleanSubdomain}" is reserved.`, 400);
    }

    const cleanGstin       = company?.gstin?.trim().toUpperCase() || null;
    const cleanPan         = company?.pan?.trim().toUpperCase() || null;
    const cleanEmail       = admin.email.toLowerCase().trim();
    const cleanPhone       = admin.phone?.replace(/\s/g, '') || null;
    const cleanCustomDomain = customDomain?.trim().toLowerCase() || null;

    const selectedDbMode = dbMode;
    if (!['cloud', 'local', 'external_cloud'].includes(selectedDbMode)) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Choose a supported PostgreSQL deployment mode: managed cloud, own server, or own cloud database.', 400, { field: 'dbMode' });
    }
    if (selectedDbMode === 'local' && localDb?.type && localDb.type !== 'postgres') {
      return sendError(res, ERROR_CODES.VALIDATION, 'Only PostgreSQL is supported for new registrations.', 400, { field: 'localDb.type' });
    }
    if (selectedDbMode === 'external_cloud' && !/^postgres(?:ql)?:\\/\\//i.test(String(externalDbUrl || '').trim())) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Your cloud database URL must use PostgreSQL (postgres:// or postgresql://).', 400, { field: 'externalDbUrl' });
    }
    if (cleanGstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGstin)) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Enter a valid 15-character GSTIN.', 400, { field: 'gstin' });
    }
    if (cleanPan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Enter a valid 10-character PAN.', 400, { field: 'pan' });
    }
    if (cleanGstin && cleanPan && cleanGstin.substring(2, 12) !== cleanPan) {
      return sendError(res, ERROR_CODES.VALIDATION, 'The PAN must match the PAN contained in the GSTIN.', 400, { field: 'pan' });
    }
    if (!cleanGstin && !cleanPan) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Enter your GSTIN or PAN to identify your business.', 400, { field: 'gstin' });
    }

    if (cleanCustomDomain && !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(cleanCustomDomain)) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Custom domain must be a valid hostname', 400);
    }

    if (cleanGstin) {
      const existingGstin = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
        SELECT id, name, legal_name, subdomain FROM tenants
        WHERE gstin = ${cleanGstin} AND deleted_at IS NULL
        LIMIT 1
      `);
      if (existingGstin.length > 0) {
        return sendError(res, ERROR_CODES.CONFLICT, `This GSTIN is already registered with ${existingGstin[0].name} (${existingGstin[0].subdomain}).`, 409, { field: 'gstin' });
      }
    }

    if ((selectedDbMode === 'local') && !localDb?.host)
      return sendError(res, ERROR_CODES.VALIDATION, 'Local database host is required', 400);
    if (selectedDbMode === 'external_cloud' && !externalDbUrl)
      return sendError(res, ERROR_CODES.VALIDATION, 'Database connection URL is required', 400);

    const existingSubdomain = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
      SELECT id FROM tenants WHERE subdomain = ${cleanSubdomain} AND deleted_at IS NULL LIMIT 1
    `);
    if (existingSubdomain.length > 0)
      return sendError(res, ERROR_CODES.CONFLICT, `Subdomain "${cleanSubdomain}" is already taken.`, 409, { field: 'subdomain' });

    if (cleanCustomDomain) {
      const existingCustomDomain = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
        SELECT id FROM tenants WHERE LOWER(custom_domain) = LOWER(${cleanCustomDomain}) AND deleted_at IS NULL LIMIT 1
      `);
      if (existingCustomDomain.length > 0) {
        return sendError(res, ERROR_CODES.CONFLICT, `The custom domain "${cleanCustomDomain}" is already registered.`, 409, { field: 'customDomain' });
      }
    }

    const existingEmail = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
      SELECT id FROM tenants WHERE admin_email = ${cleanEmail} AND deleted_at IS NULL LIMIT 1
    `);
    if (existingEmail.length > 0)
      return sendError(res, ERROR_CODES.CONFLICT, 'An account is already registered with this email.', 409, { field: 'email' });

    const existingIndex = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
      SELECT id FROM central_user_index WHERE email = ${cleanEmail} AND is_active = true LIMIT 1
    `);
    if (existingIndex.length > 0)
      return sendError(res, ERROR_CODES.CONFLICT, 'This email is already linked to an account.', 409, { field: 'email' });

    if (cleanPhone) {
      const existingPhone = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
        SELECT id FROM tenants WHERE admin_phone = ${cleanPhone} AND deleted_at IS NULL LIMIT 1
      `);
      if (existingPhone.length > 0)
        return sendError(res, ERROR_CODES.CONFLICT, 'Mobile number already registered.', 409, { field: 'phone' });
    }

    const tenantId = uuidv4();
    const adminUserId = uuidv4();
    let dbUrl = selectedDbMode === 'external_cloud' ? String(externalDbUrl).trim() : null;
    let localDbHost = null, localDbPort = null, localDbName = null;
    let localDbUser = null, localDbPass = null, localDbType = null;

    let localDbUrl = null;
    if (selectedDbMode === 'local') {
      localDbType = String(localDb.type || 'postgres').toLowerCase();
      if (!['postgres', 'postgresql'].includes(localDbType)) {
        return sendError(res, ERROR_CODES.VALIDATION, 'Only PostgreSQL is supported for customer-hosted databases.', 400, { field: 'localDb.type' });
      }
      if (!localDb.host || !localDb.name || !localDb.user) {
        return sendError(res, ERROR_CODES.VALIDATION, 'Local PostgreSQL requires host, database name and username.', 400, { field: 'localDb' });
      }
      localDbHost = encrypt(String(localDb.host).trim());
      localDbPort = localDb.port ? Number(localDb.port) : 5432;
      localDbName = String(localDb.name).trim();
      localDbUser = encrypt(String(localDb.user).trim());
      localDbPass = localDb.pass ? encrypt(String(localDb.pass)) : null;
      localDbUrl = buildLocalPostgresUrl({
        local_db_type: localDbType,
        local_db_host: localDb.host,
        local_db_port: localDbPort,
        local_db_name: localDbName,
        local_db_user: localDb.user,
        local_db_pass: localDb.pass || '',
      }, (value) => value);
    }

    const storageDescriptor = buildStorageDescriptor({
      tenantId,
      plan: 'trial',
      dbMode: selectedDbMode,
      dbUrl: selectedDbMode === 'local' ? localDbUrl : dbUrl,
    });
    const storageTenant = {
      id: tenantId,
      plan: 'trial',
      db_mode: selectedDbMode,
      db_url: dbUrl,
      schema_name: storageDescriptor.schemaName,
      storage_tier: storageDescriptor.storageTier,
      storage_status: 'ready',
      local_db_type: localDbType,
      local_db_host: localDb?.host || null,
      local_db_port: localDbPort,
      local_db_name: localDbName,
      local_db_user: localDb?.user || null,
      local_db_pass: localDb?.pass || null,
    };
    const storageTarget = resolveTenantStorageTarget(storageTenant, {
      cloudDatabaseUrl: process.env.CLOUD_TENANT_DATABASE_URL || (process.env.NODE_ENV === 'development' ? process.env.DEV_TENANT_DATABASE_URL : null),
      decryptValue: (value) => decrypt(value) || value,
    });
    const tenantDbUrl = storageTarget.databaseUrl;
    const schemaName = storageDescriptor.schemaName;

    const testClient = new PrismaClient({ datasources: { db: { url: tenantDbUrl } } });
    try {
      await testClient.$connect();
      const requiredTables = await testClient.$queryRaw`
        SELECT
          to_regclass('public.companies')::text AS companies,
          to_regclass('public.roles')::text AS roles,
          to_regclass('public.users')::text AS users
      `;
      const ready = requiredTables[0] &&
        requiredTables[0].companies && requiredTables[0].roles && requiredTables[0].users;
      if (!ready) {
        return sendError(res, ERROR_CODES.VALIDATION,
          'The PostgreSQL database is reachable but the HRMS schema is not installed. This database cannot be registered until the supported PostgreSQL installation package has initialized it.',
          400, { code: 'TENANT_SCHEMA_NOT_INSTALLED' });
      }
    } catch (e) {
      return sendError(res, ERROR_CODES.VALIDATION, `DB connection or schema check failed: ${e.message}`, 400);
    } finally {
      await testClient.$disconnect();
    }

    await withPlatformAdminRLS(centralPrisma, async (tx) => {
      
      await tx.$executeRaw`
        INSERT INTO tenants (
          id, name, legal_name, subdomain, custom_domain, plan, db_mode,
          db_url, schema_name, storage_tier, storage_status, storage_provisioned_at,
          storage_verified_at, local_db_host, local_db_port, local_db_name,
          local_db_user, local_db_pass, local_db_type, 
          admin_name, admin_email, admin_phone, 
          gstin, pan, city, state, primary_color, background_color, background_url, sitemap_url,
          is_active, is_setup_complete, created_at, updated_at
        ) VALUES (
          ${tenantId}::uuid, ${company.name.trim()}, ${company.legalName || null},
          ${cleanSubdomain}, ${cleanCustomDomain}, 'free', ${dbMode || 'cloud'},
          ${dbUrl ? encrypt(dbUrl) : null}, ${schemaName}, ${storageDescriptor.storageTier}, 'provisioning',
          NULL, NULL, ${localDbHost}, ${localDbPort}, ${localDbName},
          ${localDbUser}, ${localDbPass}, ${localDbType}, 
          ${admin.name.trim()}, ${cleanEmail}, ${cleanPhone},
          ${company.gstin || null}, ${company.pan || null},
          ${company.city || null}, ${company.state || null}, '#2563eb', '#f8fafc', NULL, NULL,
          false, false, NOW(), NOW()
        )
      `;

      await provisionDefaultModules(tx, tenantId);

      await tx.$executeRaw`
        INSERT INTO central_user_index
          (id, email, subdomain, company_id, user_id, is_platform_admin, is_active, created_at)
        VALUES
          (${uuidv4()}::uuid, ${cleanEmail}, ${cleanSubdomain},
           ${tenantId}::uuid, ${adminUserId}::uuid, false, true, NOW())
      `;

      // NEW: Initialize Pricing Config based on Dynamic Settings
      const planSettings = await tx.$queryRaw`SELECT values FROM platform_settings WHERE id = 'Subscription Plans' LIMIT 1`;
      const plans = planSettings[0]?.values?.plans || [];
      // Fallback to starter plan defaults if not configured
      const defaultPlan = plans.find(p => p.id === 'starter') || { price: 1499, baseEmployees: 25 };

      let initialBasePaise = (defaultPlan.price || 1499) * 100;
      let initialEmpCap = defaultPlan.baseEmployees || 25;

      if (dbMode === 'local' || dbMode === 'external_cloud') {
        initialBasePaise = 250000; // Higher software fee for unlimited
        initialEmpCap = null;      // Unlimited employees
      }

      // Trial period logic: 90 days for Shared Cloud
      const trialDays = dbMode === 'cloud' ? 90 : 14;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + trialDays);

      await tx.$executeRaw`
        INSERT INTO tenant_pricing_configs (
          tenant_id, base_price_paise, employee_cap, billing_cycle, offer_expiry_date
        ) VALUES (
          ${tenantId}::uuid, ${initialBasePaise}, ${initialEmpCap}, 'monthly', ${expiryDate}
        )
      `;

      await tx.$executeRaw`
        UPDATE tenants SET plan = 'trial', plan_expires_at = ${expiryDate}, max_employees = ${initialEmpCap || 999999}
        WHERE id = ${tenantId}::uuid
      `;
    });

    // Storage was connection- and schema-checked before the Central tenant record
    // was created. Free/Trial managed-cloud tenants share public; customer-owned
    // PostgreSQL instances are dedicated databases and do not get schema overrides.
    const schemaProvisioned = true;

    // Seed the tenant's database with initial company, roles, and admin user data.
    const targetDbUrl = tenantDbUrl;
    let seedSucceeded = false;

    if (targetDbUrl) {
      const tenantPrisma = new PrismaClient({ datasources: { db: { url: targetDbUrl } } });
      try {
        const companyId = uuidv4();

        await tenantPrisma.$executeRaw`
          INSERT INTO companies (
            id, name, legal_name, gstin, pan, city, state, email, phone, is_active, created_at, updated_at
          ) VALUES (
            ${companyId}::uuid, ${company.name.trim()}, ${company.legalName || null},
            ${company.gstin || null}, ${company.pan || null},
            ${company.city || null}, ${company.state || null},
            ${company.email || cleanEmail}, ${company.phone || cleanPhone},
            true, NOW(), NOW()
          )
        `;

        // Create a default 'Super Admin' role for the new tenant.
        const roleId = uuidv4();
        const permissions = JSON.stringify({
          employees:   { view: true, create: true, edit: true, delete: true, export: true, unmask: true },
          attendance:  { view: true, create: true, edit: true, delete: true, export: true, approve: true },
          leave:       { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          payroll:     { view: true, create: true, edit: true, delete: true, export: true, run: true },
          compliance:  { view: true, create: true, edit: true, delete: true, export: true },
          recruitment: { view: true, create: true, edit: true, delete: true },
          performance: { view: true, create: true, edit: true, delete: true },
          training:    { view: true, create: true, edit: true, delete: true },
          assets:      { view: true, create: true, edit: true, delete: true },
          expenses:    { view: true, create: true, edit: true, delete: true, approve: true },
          reports:     { view: true, export: true },
          settings:    { view: true, create: true, edit: true, delete: true },
          audit:       { view: true },
        });

        await tenantPrisma.$executeRaw`
          INSERT INTO roles (id, company_id, name, description, permissions, is_system, created_at, updated_at)
          VALUES (${roleId}::uuid, ${companyId}::uuid, 'Super Admin', 'Full access', ${permissions}::jsonb, true, NOW(), NOW())
        `;

        // Create the initial admin user for the tenant.
        const passwordHash = await bcrypt.hash(admin.password, 12);
        await tenantPrisma.$executeRaw`
          INSERT INTO users (id, company_id, role_id, email, phone, password_hash, is_active, is_first_login, created_at, updated_at)
          VALUES (
            ${adminUserId}::uuid, ${companyId}::uuid, ${roleId}::uuid,
            ${cleanEmail}, ${cleanPhone}, ${passwordHash}, true, true, NOW(), NOW()
          )
        `;

        seedSucceeded = true;
        logger.info(`✅ Tenant DB seeded: ${cleanSubdomain} | admin: ${cleanEmail}`);
      } catch (seedErr) {
        logger.error(`[registerTenant] Tenant DB seed FAILED for ${cleanSubdomain}:`, seedErr);
      } finally {
        await tenantPrisma.$disconnect();
      }
    }

    if (!schemaProvisioned || !seedSucceeded) {
      logger.error(`[registerTenant] Provisioning incomplete for ${cleanSubdomain}; tenant remains inactive.`);
      return sendError(res, ERROR_CODES.SERVER, 'Tenant workspace provisioning failed. The account is not active; support must complete provisioning before login.', 503);
    }

    await withPlatformAdminRLS(centralPrisma, (tx) => tx.$executeRaw`
      UPDATE tenants
      SET storage_status = 'ready',
          storage_provisioned_at = NOW(),
          storage_verified_at = NOW(),
          is_active = true,
          is_setup_complete = true,
          updated_at = NOW()
      WHERE id = ${tenantId}::uuid
    `);

    const portalUrl = cleanCustomDomain ? `https://${cleanCustomDomain}` : `https://${cleanSubdomain}.syntern.in`;
    const loginUrl = `${portalUrl}/login`;

    try {
      await emailService.sendClientPortalWelcome(null, null, {
        companyName: company.name.trim(),
        adminName: admin.name.trim(),
        email: cleanEmail,
        portalUrl,
        loginUrl,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@syntern.in',
      });
    } catch (emailErr) {
      logger.error('[registerTenant] Client welcome email failed', { error: emailErr.message, email: cleanEmail, subdomain: cleanSubdomain });
    }

    const supportEmail = process.env.SUPPORT_EMAIL;
    if (supportEmail && supportEmail.toLowerCase() !== cleanEmail.toLowerCase()) {
      try {
        await emailService.sendCustom(null, null, {
          to: supportEmail,
          subject: `New tenant registered: ${company.name.trim()}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
            <h2>New tenant registration</h2>
            <p>A new client workspace has been created on Syntern HRMS.</p>
            <table style="border-collapse:collapse;width:100%;margin-top:16px">
              <tr><td style="padding:8px 0;color:#6B7280">Company</td><td>${company.name.trim()}</td></tr>
              <tr><td style="padding:8px 0;color:#6B7280">Admin</td><td>${admin.name.trim()} (${cleanEmail})</td></tr>
              <tr><td style="padding:8px 0;color:#6B7280">Portal</td><td><a href="${portalUrl}">${portalUrl}</a></td></tr>
              <tr><td style="padding:8px 0;color:#6B7280">DB mode</td><td>${dbMode || 'cloud'}</td></tr>
            </table>
          </div>`,
        });
      } catch (emailErr) {
        logger.error('[registerTenant] Support notification email failed', { error: emailErr.message, email: supportEmail, subdomain: cleanSubdomain });
      }
    }

    return sendSuccess(res, 
      {
        id:         tenantId,
        name:       company.name.trim(),
        subdomain:  cleanSubdomain,
        customDomain: cleanCustomDomain,
        portalUrl,
        loginUrl,
        dbMode:     dbMode || 'cloud',
        setupReady: seedSucceeded,
        credentials: {
          email:    cleanEmail,
          note:     'Use the password you set during registration',
        },
      },
      'Company registered! You can now log in.',
      201
    );

  } catch (error) {
    logger.error('[registerTenant] Registration fatal error:', { message: error.message, stack: error.stack });
    if (error.code === 'P2002' || error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return sendError(res, ERROR_CODES.CONFLICT, 'Duplicate value found. Check email or subdomain.', 409);
    }
    return sendError(res, ERROR_CODES.SERVER, 'Registration failed. Contact support.', 500, { error: error.message });
  }
};

// Function to request a branch link (e.g., for multi-GST accounts).
async function requestBranchLink(gstin, targetTenantId, metadata = {}) {
  const gstinUpper = (gstin || '').trim().toUpperCase();
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstinUpper)) {
    throw new Error('Invalid GSTIN format');
  }

  const pan = gstinUpper.substring(2, 12);
  const targetRows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
    SELECT id, name, legal_name, gstin, pan
    FROM tenants
    WHERE id = ${targetTenantId}::uuid AND deleted_at IS NULL
    LIMIT 1
  `);
  const target = targetRows[0];
  if (!target) {
    throw new Error('Target tenant not found');
  }
  if (!target.pan || target.pan.toUpperCase() !== pan.toUpperCase()) {
    throw new Error('Target tenant PAN does not match the GSTIN PAN');
  }

  const existingGstin = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
    SELECT id FROM tenants WHERE gstin = ${gstinUpper} AND deleted_at IS NULL LIMIT 1
  `);
  if (existingGstin.length > 0) {
    throw new Error('This GSTIN is already registered as a tenant.');
  }

  const existingLink = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
    SELECT id FROM tenant_branch_links WHERE gstin = ${gstinUpper} LIMIT 1
  `);
  if (existingLink.length > 0) {
    throw new Error('A branch link request already exists for this GSTIN.');
  }

  await withPlatformAdminRLS(centralPrisma, (tx) => tx.$executeRaw`
    INSERT INTO tenant_branch_links (
      tenant_id, gstin, pan, branch_name, branch_no,
      city, state, pincode, address, status, requested_at
    ) VALUES (
      ${targetTenantId}::uuid, ${gstinUpper}, ${pan}, ${metadata.branchName || null}, ${metadata.branchNo || null},
      ${metadata.city || null}, ${metadata.state || null}, ${metadata.pincode || null}, ${metadata.address || null},
      'pending', NOW()
    )
  `);

  return { success: true, message: 'Branch link request created successfully.' };
}

module.exports = { registerTenant, requestBranchLink, resolveTenantDbUrl };
