﻿﻿﻿/**
 * @file platform.service.js
 * @description Handles tenant lifecycle operations, database resolution, and multi-tenancy setup.
 */
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 }   = require('uuid');
const bcrypt           = require('bcryptjs');
const { encrypt, decrypt, mask } = require('../../shared/utils/encryption');
const { cloneSchema, appendSchemaToUrl } = require('../../shared/utils/dbSchema');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const { centralPrisma } = require('../../shared/utils/centralPrisma');
const logger = require('../../shared/utils/logger');

/**
 * Constructs a database connection string for on-premise/local databases.
 * @param {Object} localDb - Database connection parameters
 * @returns {string} The constructed URL.
 */
function buildLocalUrl(localDb) {
  const type = localDb.type || 'postgres';
  const host = localDb.host || 'localhost';
  const port = localDb.port || 5432;
  const name = localDb.name || 'hrms';
  const user = localDb.user || 'postgres';
  // Only encode if it hasn't been encoded yet (heuristic: doesn't contain %)
  const pass = (localDb.pass && !localDb.pass.includes('%')) ? encodeURIComponent(localDb.pass) : (localDb.pass || '');
  
  switch (type) {
    case 'mysql':  return `mysql://${user}:${pass}@${host}:${port}/${name}`;
    case 'mssql':  return `sqlserver://${host}:${port};database=${name};user=${user};password=${localDb.pass || ''};trustServerCertificate=true`;
    default:       return `postgresql://${user}:${pass}@${host}:${port}/${name}`;
  }
}

/**
 * @description Centralized resolver for tenant database *base* connection strings.
 * Handles environment-specific fallbacks and AES decryption.
 * This function returns the raw connection string without any `?schema=` parameter.
 * The caller is responsible for appending the schema if needed (e.g., for Prisma client instantiation).
 * @param {string} dbMode - Deployment mode ('cloud', 'local', etc.)
 * @param {Object} tenantData - Tenant metadata from central database or request body
 * @param {string} [optionalUrl] - Explicit override URL
 * @returns {string|null} Base connection string
 */
function resolveTenantDbUrl(dbMode, tenantData, optionalUrl) {
  const isDev = process.env.NODE_ENV === 'development';
  
  /**
   * Safe decryption helper.
   */
  const d = (val) => {
    if (!val || typeof val !== 'string' || !val.includes(':') || val.length < 32) return val;
    try { return decrypt(val); } catch { return val; }
  };

  let resolvedUrl = null;
  const schema = tenantData?.schema_name || null;

  switch (dbMode) {
    case 'cloud':
      // For 'cloud' mode, if a specific db_url is provided (e.g., for legacy tenants), use it.
      // Otherwise, fall back to the platform's shared cloud database URL from environment variables.
      if (tenantData?.db_url) {
        resolvedUrl = d(tenantData.db_url);
      } else {
        const fallbackUrl = process.env.CLOUD_TENANT_DATABASE_URL || process.env.DEV_TENANT_DATABASE_URL;
        if (!fallbackUrl) {
          // Log a warning but don't throw here, let the global fallback handle it if in dev.
          logger.warn(`[resolveTenantDbUrl] CLOUD_TENANT_DATABASE_URL or DEV_TENANT_DATABASE_URL not set for cloud mode.`);
        }
        resolvedUrl = fallbackUrl;
      }
      break;
    case 'external_cloud':
      // For 'external_cloud' mode, a db_url is expected.
      // Log a warning if it's missing but don't throw, allowing for potential dev fallbacks.
      resolvedUrl = d(tenantData?.db_url || optionalUrl);
      if (!resolvedUrl) logger.warn(`[resolveTenantDbUrl] External DB URL missing or invalid for external_cloud mode.`);
      break;
    case 'local':
    case 'hybrid':
      // Merge nested localDb (from reg) and flat row (from login)
      const raw = tenantData?.localDb || tenantData; 
      if (!raw) { logger.warn(`[resolveTenantDbUrl] Local DB config missing for ${dbMode} mode.`); break; }
      
      // Map DB column names or Request property names to standard internal keys
      const decryptedConfig = {
        type: raw.local_db_type || raw.type || 'postgres',
        host: d(raw.local_db_host || raw.host || 'localhost'),
        port: raw.local_db_port || raw.port || 5432,
        name: raw.local_db_name || raw.name || 'hrms',
        user: d(raw.local_db_user || raw.user || 'postgres'),
        pass: d(raw.local_db_pass || raw.pass || ''),
      };
      resolvedUrl = buildLocalUrl(decryptedConfig);
      break;
  }

  // Global fallback for development: if resolution failed and we are in dev mode, use the DEV_TENANT_DATABASE_URL.
  if (!resolvedUrl && isDev && process.env.DEV_TENANT_DATABASE_URL) {
    resolvedUrl = process.env.DEV_TENANT_DATABASE_URL;
    if (resolvedUrl) logger.info(`[DB-Resolver] Resolution failed for ${dbMode}, falling back to DEV_TENANT_DATABASE_URL`);
  }
  if (!resolvedUrl) return null; // Final check: if no URL could be resolved, return null.
  // If a specific schema is defined (Standard for Multi-tenancy), append it
  if (schema && (dbMode === 'cloud' || dbMode === 'external_cloud')) {
    resolvedUrl = appendSchemaToUrl(resolvedUrl, schema);
  }

  logger.debug(`[DB-Resolver] Resolved URL: ${mask(resolvedUrl)}`);

  return resolvedUrl;
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
    const { company, subdomain, customDomain, dbMode, localDb, externalDbUrl, cloudBackupUrl, admin, consent } = req.body;
    
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

    if (cleanCustomDomain && !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(cleanCustomDomain)) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Custom domain must be a valid hostname', 400);
    }

    if (cleanGstin) {
      const existingGstin = await centralPrisma.$queryRaw`
        SELECT id, name, legal_name, subdomain FROM tenants
        WHERE gstin = ${cleanGstin} AND deleted_at IS NULL
        LIMIT 1
      `;
      if (existingGstin.length > 0) {
        return sendError(res, ERROR_CODES.CONFLICT, `This GSTIN is already registered with ${existingGstin[0].name} (${existingGstin[0].subdomain}).`, 409, { field: 'gstin' });
      }
    }

    if ((dbMode === 'local' || dbMode === 'hybrid') && !localDb?.host)
      return sendError(res, ERROR_CODES.VALIDATION, 'Local database host is required', 400);
    if (dbMode === 'external_cloud' && !externalDbUrl)
      return sendError(res, ERROR_CODES.VALIDATION, 'Database connection URL is required', 400);
    if (dbMode === 'hybrid' && !cloudBackupUrl)
      return sendError(res, ERROR_CODES.VALIDATION, 'Cloud backup URL is required for hybrid mode', 400);

    const existingSubdomain = await centralPrisma.$queryRaw`
      SELECT id FROM tenants WHERE subdomain = ${cleanSubdomain} AND deleted_at IS NULL LIMIT 1
    `;
    if (existingSubdomain.length > 0)
      return sendError(res, ERROR_CODES.CONFLICT, `Subdomain "${cleanSubdomain}" is already taken.`, 409, { field: 'subdomain' });

    if (cleanCustomDomain) {
      const existingCustomDomain = await centralPrisma.$queryRaw`
        SELECT id FROM tenants WHERE LOWER(custom_domain) = LOWER(${cleanCustomDomain}) AND deleted_at IS NULL LIMIT 1
      `;
      if (existingCustomDomain.length > 0) {
        return sendError(res, ERROR_CODES.CONFLICT, `The custom domain "${cleanCustomDomain}" is already registered.`, 409, { field: 'customDomain' });
      }
    }

    const existingEmail = await centralPrisma.$queryRaw`
      SELECT id FROM tenants WHERE admin_email = ${cleanEmail} AND deleted_at IS NULL LIMIT 1
    `;
    if (existingEmail.length > 0)
      return sendError(res, ERROR_CODES.CONFLICT, 'An account is already registered with this email.', 409, { field: 'email' });

    const existingIndex = await centralPrisma.$queryRaw`
      SELECT id FROM central_user_index WHERE email = ${cleanEmail} AND is_active = true LIMIT 1
    `;
    if (existingIndex.length > 0)
      return sendError(res, ERROR_CODES.CONFLICT, 'This email is already linked to an account.', 409, { field: 'email' });

    if (cleanPhone) {
      const existingPhone = await centralPrisma.$queryRaw`
        SELECT id FROM tenants WHERE admin_phone = ${cleanPhone} AND deleted_at IS NULL LIMIT 1
      `;
      if (existingPhone.length > 0)
        return sendError(res, ERROR_CODES.CONFLICT, 'Mobile number already registered.', 409, { field: 'phone' });
    }

    const tenantId = uuidv4();
    const adminUserId = uuidv4();
    let dbUrl = null;
    let localDbHost = null, localDbPort = null, localDbName = null;
    let localDbUser = null, localDbPass = null, localDbType = null;

    switch (dbMode) {
      case 'cloud': break;
      case 'external_cloud': dbUrl = externalDbUrl; break;
      case 'local':
        localDbHost = encrypt(localDb.host || 'localhost'); localDbPort = localDb.port ? parseInt(localDb.port) : 5432;
        localDbName = localDb.name || 'hrms'; localDbUser = encrypt(localDb.user || 'postgres');
        localDbPass = localDb.pass || null;   localDbType = localDb.type || 'postgres';
        break;
      case 'hybrid':
        localDbHost = encrypt(localDb.host || 'localhost'); localDbPort = localDb.port ? parseInt(localDb.port) : 5432;
        localDbName = localDb.name || 'hrms'; localDbUser = encrypt(localDb.user || 'postgres');
        localDbPass = localDb.pass || null;   localDbType = localDb.type || 'postgres';
        dbUrl = cloudBackupUrl;
        break;
    }

    const tenantDbUrl = resolveTenantDbUrl(dbMode, localDb, externalDbUrl);
    const schemaName = tenantDbUrl && (dbMode === 'cloud' || dbMode === 'external_cloud')
      ? `tenant_${cleanSubdomain}`
      : null;

    if (tenantDbUrl) {
      const testClient = new PrismaClient({ datasources: { db: { url: tenantDbUrl } } });
      try {
        await testClient.$connect();
      } catch (e) {
        return sendError(res, ERROR_CODES.VALIDATION, `DB connection failed: ${e.message}`, 400);
      } finally {
        await testClient.$disconnect();
      }
    }

    await centralPrisma.$transaction(async (tx) => {
      
      await tx.$executeRaw`
        INSERT INTO tenants (
          id, name, legal_name, subdomain, custom_domain, plan, db_mode,
          db_url, schema_name, local_db_host, local_db_port, local_db_name,
          local_db_user, local_db_pass, local_db_type, 
          admin_name, admin_email, admin_phone, 
          gstin, pan, city, state, primary_color, background_color, background_url, sitemap_url,
          is_active, is_setup_complete, created_at, updated_at
        ) VALUES (
          ${tenantId}::uuid, ${company.name.trim()}, ${company.legalName || null},
          ${cleanSubdomain}, ${cleanCustomDomain}, 'free', ${dbMode || 'cloud'},
          ${dbUrl ? encrypt(dbUrl) : null}, NULL, ${localDbHost}, ${localDbPort}, ${localDbName},
          ${localDbUser}, ${localDbPass ? encrypt(localDbPass) : null}, ${localDbType}, 
          ${admin.name.trim()}, ${cleanEmail}, ${cleanPhone},
          ${company.gstin || null}, ${company.pan || null},
          ${company.city || null}, ${company.state || null}, '#2563eb', '#f8fafc', NULL, NULL,
          true, false, NOW(), NOW()
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

      if (dbMode === 'local' || dbMode === 'hybrid' || dbMode === 'external_cloud') {
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

    // After central DB entry, handle schema creation for managed databases.
    // If we have a managed database (cloud mode), we create a schema
    const baseTenantDbUrl = resolveTenantDbUrl(dbMode, localDb, externalDbUrl); // Get base URL
    const actualSchemaName = `tenant_${cleanSubdomain}`; // Always derive schema name consistently

    if (dbMode === 'cloud' || dbMode === 'external_cloud') {
      if (baseTenantDbUrl) {
        try {
          const sourceSchema = process.env.TENANT_TEMPLATE_SCHEMA || 'public';
          await cloneSchema(baseTenantDbUrl, sourceSchema, actualSchemaName); // Pass base URL
        } catch (cloneErr) {
          logger.error(`[registerTenant] Schema cloning failed for ${cleanSubdomain}:`, cloneErr);
        }
      }
    }

    // Update the tenant record with the actual schema name.
    await centralPrisma.$executeRaw`
      UPDATE tenants SET schema_name = ${actualSchemaName} WHERE id = ${tenantId}::uuid
    `;

    // Seed the tenant's database with initial company, roles, and admin user data.
    const targetDbUrl = tenantDbUrl;
    let seedSucceeded = false;

    if (targetDbUrl) {
      const tenantPrisma = new PrismaClient({ datasources: { db: { url: appendSchemaToUrl(baseTenantDbUrl, actualSchemaName) } } }); // Use base URL + schema
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

    return sendSuccess(res, 
      {
        id:         tenantId,
        name:       company.name.trim(),
        subdomain:  cleanSubdomain,
        customDomain: cleanCustomDomain,
        portalUrl:  cleanCustomDomain ? `https://${cleanCustomDomain}` : `https://${cleanSubdomain}.syntern.in`,
        loginUrl:   cleanCustomDomain ? `https://${cleanCustomDomain}/login` : `https://${cleanSubdomain}.syntern.in/login`,
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
  const targetRows = await centralPrisma.$queryRaw`
    SELECT id, name, legal_name, gstin, pan
    FROM tenants
    WHERE id = ${targetTenantId}::uuid AND deleted_at IS NULL
    LIMIT 1
  `;
  const target = targetRows[0];
  if (!target) {
    throw new Error('Target tenant not found');
  }
  if (!target.pan || target.pan.toUpperCase() !== pan.toUpperCase()) {
    throw new Error('Target tenant PAN does not match the GSTIN PAN');
  }

  const existingGstin = await centralPrisma.$queryRaw`
    SELECT id FROM tenants WHERE gstin = ${gstinUpper} AND deleted_at IS NULL LIMIT 1
  `;
  if (existingGstin.length > 0) {
    throw new Error('This GSTIN is already registered as a tenant.');
  }

  const existingLink = await centralPrisma.$queryRaw`
    SELECT id FROM tenant_branch_links WHERE gstin = ${gstinUpper} LIMIT 1
  `;
  if (existingLink.length > 0) {
    throw new Error('A branch link request already exists for this GSTIN.');
  }

  await centralPrisma.$executeRaw`
    INSERT INTO tenant_branch_links (
      tenant_id, gstin, pan, branch_name, branch_no,
      city, state, pincode, address, status, requested_at
    ) VALUES (
      ${targetTenantId}::uuid, ${gstinUpper}, ${pan}, ${metadata.branchName || null}, ${metadata.branchNo || null},
      ${metadata.city || null}, ${metadata.state || null}, ${metadata.pincode || null}, ${metadata.address || null},
      'pending', NOW()
    )
  `;

  return { success: true, message: 'Branch link request created successfully.' };
}

module.exports = { registerTenant, requestBranchLink, resolveTenantDbUrl };
