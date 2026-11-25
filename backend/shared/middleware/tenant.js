﻿// ================================================================
// SYNTERN HRMS — TENANT MIDDLEWARE  (v5 — schema‑per‑tenant support)
//
// v5 CHANGES:
//   • resolveTenantDB appends ?schema=<name> when tenant.schema_name
//     is set, isolating that tenant inside a PostgreSQL schema.
//   • DEV fallback supports DEV_TENANT_SCHEMA env var for schema tests.
//   • req.tenant now always contains schema_name (null for dedicated DBs).
// ================================================================

const { PrismaClient } = require('@prisma/client');
const { sendError, ERROR_CODES } = require('../utils/response');
const { decrypt } = require('../utils/encryption');
const { resolveTenantStorageTarget } = require('../utils/tenantStorageResolver');
const { normalizeHostname, isPlatformRootHost, buildHostnameCandidates } = require('../utils/domainRouting');

// ── DB connection pool — one PrismaClient per unique DB URL ──────
const dbPool = {};

const getTenantDB = (databaseUrl) => {
  if (!databaseUrl) throw new Error('getTenantDB: databaseUrl is required');
  if (dbPool[databaseUrl]) return dbPool[databaseUrl];

  const client = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
  dbPool[databaseUrl] = client;
  return client;
};

// ── Central DB singleton ────────────────────────────────────────
let _centralDB = null;

function getCentralDB() {
  if (!_centralDB) {
    const url = process.env.CENTRAL_DATABASE_URL;
    if (!url) throw new Error('CENTRAL_DATABASE_URL is not set in .env');
    _centralDB = new PrismaClient({
      datasources: { db: { url } },
      log: ['error'],
    });
  }
  return _centralDB;
}

// ── Helpers ─────────────────────────────────────────────────────
// Resolve only tenants with an audited, ready PostgreSQL storage allocation.
// Legacy/unclassified records fail closed; they must be inventoried and classified
// before this router is enabled for production traffic.
async function resolveTenantDB(tenant) {
  const target = resolveTenantStorageTarget(tenant, {
    cloudDatabaseUrl: process.env.CLOUD_TENANT_DATABASE_URL || process.env.DEV_TENANT_DATABASE_URL,
    // Supports both previously encrypted values and explicitly configured
    // plaintext URLs during a controlled migration; invalid ciphertext fails
    // URL validation rather than being used as a connection string.
    decryptValue: (value) => decrypt(value) || value,
  });
  return getTenantDB(target.databaseUrl);
}

// ── Platform roots ─────────────────────────────────────────────
const PLATFORM_ROOTS = new Set([
  'syntern.in',
  'www.syntern.in',
  'localhost',
  '127.0.0.1',
  'app.syntern.in',
  'app.localhost',
]);

// ================================================================
// TENANT MIDDLEWARE
// ================================================================
const tenantMiddleware = async (req, res, next) => {
  try {
    const host = normalizeHostname(req.hostname || req.headers.host || '');
    const subdomain = extractTenantSubdomain(req);
    const isAuthRoute = req.path?.startsWith('/auth') || req.originalUrl?.startsWith('/api/v1/auth');
    const isRailwayHost = host?.endsWith('.up.railway.app') || host?.endsWith('.railway.app');
    const isPlatformRootRequestHost = isPlatformRootHost(host) || isRailwayHost;

    if (isPlatformRootRequestHost && isAuthRoute) {
      // Allow auth routes on platform root hosts to resolve tenant by email
      // instead of forcing the tenant or development fallback database.
      req.db = null;
      req.tenant = null;
      return next();
    }

    // ── DEVELOPMENT MODE ────────────────────────────────────────
    if (process.env.NODE_ENV === 'development') {
      const subdomain = extractTenantSubdomain(req);
      const isAuthRoute = req.path?.startsWith('/auth');
      const isPlatformRootRequestHost = isPlatformRootHost(host);

      if (isPlatformRootRequestHost && isAuthRoute) {
        // Allow auth routes on platform root hosts to resolve tenant by email
        // instead of forcing the development fallback tenant database.
        req.db = null;
        req.tenant = null;
        return next();
      }

      const isPreviewHost = host.endsWith('.github.dev') || host.endsWith('.githubpreview.dev') || host.endsWith('.railway.app') || host.endsWith('.vercel.app');
      if (!subdomain || subdomain === 'dev' || isPreviewHost) {
        const devUrl = process.env.DEV_TENANT_DATABASE_URL;
        if (!devUrl) {
          console.error('[Tenant] DEV_TENANT_DATABASE_URL is not set in .env!');
          return sendError(res, ERROR_CODES.DB_CONNECTION,
            'DEV_TENANT_DATABASE_URL is not configured.', 503);
        }

        // ── NEW: optionally isolate dev into a schema ──────────
        let finalUrl = devUrl;
        const devSchema = process.env.DEV_TENANT_SCHEMA;
        if (devSchema) {
          const urlObj = new URL(devUrl);
          urlObj.searchParams.set('schema', devSchema);
          finalUrl = urlObj.toString();
        }

        req.db = getTenantDB(finalUrl);
        req.tenant = {
          id: process.env.DEV_TENANT_ID || '00000000-0000-0000-0000-000000000000',
          name: 'Dev Company',
          subdomain: 'dev',
          dbMode: 'cloud',
          schema_name: devSchema || null,   // ← NEW
          enabledModules: [
            'employees','attendance','leave','payroll','compliance',
            'recruitment','performance','training','assets','expenses',
            'reports','automation','communication','settings',
          ],
        };
        console.log(`[Tenant] DEV — using ${devSchema ? 'schema ' + devSchema : 'default'} for ${req.method} ${req.path} (preview host fallback: ${isPreviewHost})`);
        return next();
      }

      // Known dev host/subdomain — look up central DB by subdomain or custom domain
      const centralDB = getCentralDB();
      const rows = await centralDB.$queryRaw`
        SELECT
          t.*,
          COALESCE(
            json_agg(tm.module_name) FILTER (WHERE tm.is_active = true),
            '[]'
          ) AS enabled_modules
        FROM tenants t
        LEFT JOIN tenant_modules tm ON tm.tenant_id = t.id
        WHERE (
          LOWER(t.subdomain) = LOWER(${subdomain})
          OR LOWER(t.custom_domain) = LOWER(${host})
          OR LOWER(t.custom_domain) = LOWER(${host?.replace(/^www\./, '')})
        )
          AND t.deleted_at IS NULL
        GROUP BY t.id
        LIMIT 1
      `;
      const tenant = rows[0];

      if (!tenant) {
        return sendError(res, ERROR_CODES.NOT_FOUND,
          'Company not found. Check the tenant URL or contact your HR admin.', 404);
      }

      // A known tenant must never be routed to the generic development DB
      // when its own storage record is missing, unclassified or unavailable.
      req.db = await resolveTenantDB(tenant);

      req.tenant = {
        id:             tenant.id,
        name:           tenant.name,
        subdomain:      tenant.subdomain,
        dbMode:         tenant.db_mode,
        schema_name:    tenant.schema_name || null,   // ← NEW
        enabledModules: Array.isArray(tenant.enabled_modules)
          ? tenant.enabled_modules
          : JSON.parse(tenant.enabled_modules || '[]'),
      };
      console.log(`[Tenant] DEV — resolved tenant: ${tenant.subdomain} (${tenant.db_mode})`);
      return next();
    }

    // ── PRODUCTION MODE ─────────────────────────────────────────
    let lookupSubdomain = null;
    const headerSubdomain = req.headers['x-tenant-subdomain']?.toLowerCase().trim();

    if (headerSubdomain) {
      lookupSubdomain = headerSubdomain;
    } else if (isPlatformRootRequestHost) {
      req.tenant = null;
      req.db = null;
      return next();
    }

    const centralDB = getCentralDB();
    const normalizedHost = normalizeHostname(host);
    const rows = await centralDB.$queryRaw`
      SELECT
        t.id, t.name, t.subdomain, t.custom_domain,
        t.db_mode, t.db_url, t.is_active, t.is_setup_complete,
        t.schema_name,
        t.local_db_type, t.local_db_host, t.local_db_port,
        t.local_db_name, t.local_db_user, t.local_db_pass,
        COALESCE(
          json_agg(tm.module_name) FILTER (WHERE tm.is_active = true),
          '[]'
        ) AS enabled_modules
      FROM tenants t
      LEFT JOIN tenant_modules tm ON tm.tenant_id = t.id
      WHERE (
        (${lookupSubdomain ? centralDB.$queryRaw`LOWER(t.subdomain) = LOWER(${lookupSubdomain})` : centralDB.$queryRaw`FALSE`})
        OR LOWER(t.custom_domain) = LOWER(${normalizedHost})
        OR LOWER(t.custom_domain) = LOWER(${normalizedHost.replace(/^www\./, '')})
        OR LOWER(t.custom_domain) = LOWER(${normalizedHost.startsWith('hrms.') ? normalizedHost.slice('hrms.'.length) : `hrms.${normalizedHost}`})
      )
        AND t.deleted_at IS NULL
      GROUP BY t.id
      LIMIT 1
    `;

    const tenant = rows[0];

    if (!tenant) {
      // Tenant not found in the central database.
      console.log(`[Tenant] ✗ Not found — subdomain="${lookupSubdomain}" host="${host}"`);
      return sendError(res, ERROR_CODES.NOT_FOUND,
        'Company not found. Check your URL or contact your HR admin.', 404);
    }

    // Suspended tenants may reach only authenticated invoice recovery endpoints.
    // Every HRMS data route remains blocked until an overdue renewal is verified.
    const requestPath = String(req.originalUrl || req.url || '').split('?')[0];
    const isBillingRecoveryRoute = /^\/api\/v1\/platform\/subscribe\/(?:invoices\/[^/]+\/(?:pay|verify)|my-invoices|my-subscription)$/.test(requestPath);
    if (!tenant.is_active && !isBillingRecoveryRoute) {
      console.log(`[Tenant] ✗ Suspended — subdomain="${lookupSubdomain}"`);
      return sendError(res, ERROR_CODES.LICENCE,
        'Your account is suspended. Pay the outstanding subscription invoice or contact support.', 403);
    }

    console.log(`[Tenant] ✓ Resolved — subdomain="${tenant.subdomain}" dbMode="${tenant.db_mode}"`);

    // Resolve the tenant's database connection string and create a Prisma client.
    req.db = await resolveTenantDB(tenant);
    req.tenant = {
      id:             tenant.id,
      name:           tenant.name,
      subdomain:      tenant.subdomain,
      dbMode:         tenant.db_mode,
      schema_name:    tenant.schema_name || null,   // ← NEW
      enabledModules: Array.isArray(tenant.enabled_modules)
        ? tenant.enabled_modules
        : JSON.parse(tenant.enabled_modules || '[]'),
    };

    next();

  } catch (err) {
    // Catch any unexpected errors during tenant resolution and return a 503.
    console.error('[TenantMiddleware] Unexpected error:', err.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Full Error Stack:', err.stack);
    }
    return sendError(res, ERROR_CODES.DB_CONNECTION,
      'Could not connect to your database. Please try again.', 503);
  }
};

module.exports = { tenantMiddleware, getTenantDB, resolveTenantDB };
