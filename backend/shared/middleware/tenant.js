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
function tryDecrypt(val) {
  if (!val) return val;
  try { return decrypt(val); } catch { return val; }
}

function extractTenantSubdomain(req) {
  const headerSubdomain = req.headers['x-tenant-subdomain']?.toLowerCase().trim();
  if (headerSubdomain) return headerSubdomain;

  const host = req.hostname?.toLowerCase().trim();
  if (!host || PLATFORM_ROOTS.has(host)) return null;

  return host.replace(/^www\./, '').split('.')[0];
}

function buildLocalConnectionString(cfg) {
  const host = cfg.local_db_host ? tryDecrypt(cfg.local_db_host) : 'localhost';
  const user = cfg.local_db_user ? tryDecrypt(cfg.local_db_user) : 'postgres';
  const pass = cfg.local_db_pass ? tryDecrypt(cfg.local_db_pass) : '';
  const port = cfg.local_db_port || 5432;
  const name = cfg.local_db_name || 'hrms';
  const type = cfg.local_db_type || 'postgres';
  const encodedPass = encodeURIComponent(pass);

  switch (type) {
    case 'mysql':  return `mysql://${user}:${encodedPass}@${host}:${port}/${name}`;
    case 'mssql':  return `sqlserver://${host}:${port};database=${name};user=${user};password=${pass};trustServerCertificate=true`;
    case 'sqlite': return `file:${name}`;
    default:       return `postgresql://${user}:${encodedPass}@${host}:${port}/${name}`;
  }
}

// ── NEW: schema‑aware DB resolver ──────────────────────────────
async function resolveTenantDB(tenant) {
  let dbUrl;

  switch (tenant.db_mode) {
    case 'cloud':
      // For 'cloud' mode, if a specific db_url is provided (e.g., for legacy tenants), use it.
      // Otherwise, fall back to the platform's shared cloud database URL from environment variables.
      if (tenant.db_url) {
        dbUrl = tryDecrypt(tenant.db_url);
      } else {
        const fallbackUrl = process.env.CLOUD_TENANT_DATABASE_URL || process.env.DEV_TENANT_DATABASE_URL;
        if (!fallbackUrl) {
          throw new Error(`Tenant ${tenant.subdomain} has no db_url and no fallback env (CLOUD_TENANT_DATABASE_URL/DEV_TENANT_DATABASE_URL)`);
        }
        dbUrl = fallbackUrl;
      }
      break;
    case 'external_cloud':
      dbUrl = tenant.db_url ? tryDecrypt(tenant.db_url) : null;
      break;

    case 'local':
      dbUrl = buildLocalConnectionString(tenant);
      break;

    case 'hybrid': {
      const localUrl = buildLocalConnectionString(tenant);
      try {
        const localClient = getTenantDB(localUrl);
        await localClient.$queryRaw`SELECT 1`;
        dbUrl = localUrl;
      } catch (e) {
        // If local DB is unreachable, fall back to cloud URL if configured.
        // This ensures resilience for hybrid setups.
        console.warn(`[Tenant] Local DB unreachable for "${tenant.subdomain}", falling back to cloud`);
        if (!tenant.db_url) throw new Error(`Tenant ${tenant.subdomain} has no cloud fallback url`);
        dbUrl = tryDecrypt(tenant.db_url);
      }
      break;
    }

    default:
      // Default case assumes db_url is mandatory if no specific mode is matched.
      if (!tenant.db_url) throw new Error(`Tenant ${tenant.subdomain} has no db_url`);
      dbUrl = tryDecrypt(tenant.db_url);
  }

  // ── NEW: Append schema parameter if tenant uses a shared database ──
  if (tenant.schema_name && dbUrl) {
    const urlObj = new URL(dbUrl);
    // Ensure the schema parameter is correctly appended to the connection string.
    urlObj.searchParams.set('schema', tenant.schema_name);
    dbUrl = urlObj.toString();
  }

  return getTenantDB(dbUrl);
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
    const host = req.hostname?.toLowerCase().trim();
    const subdomain = extractTenantSubdomain(req);
    const isAuthRoute = req.path?.startsWith('/auth') || req.originalUrl?.startsWith('/api/v1/auth');
    const isRailwayHost = host?.endsWith('.up.railway.app') || host?.endsWith('.railway.app');
const isPlatformRootHost = PLATFORM_ROOTS.has(host) || isRailwayHost;

    if (isPlatformRootHost && isAuthRoute) {
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
      const isPlatformRootHost = PLATFORM_ROOTS.has(host);

      if (isPlatformRootHost && isAuthRoute) {
        // Allow auth routes on platform root hosts to resolve tenant by email
        // instead of forcing the development fallback tenant database.
        req.db = null;
        req.tenant = null;
        return next();
      }

      if (!subdomain || subdomain === 'dev') {
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
        console.log(`[Tenant] DEV — using ${devSchema ? 'schema ' + devSchema : 'default'} for ${req.method} ${req.path}`);
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
        console.log(`[Tenant] DEV — tenant "${subdomain}" not in central DB, falling back to DEV_TENANT_DATABASE_URL`);
        // fallback to default dev behaviour
        req.db = getTenantDB(process.env.DEV_TENANT_DATABASE_URL);
        req.tenant = {
          id: process.env.DEV_TENANT_ID || '00000000-0000-0000-0000-000000000000',
          name: 'Dev Company',
          subdomain: 'dev',
          dbMode: 'cloud',
          schema_name: null,
          enabledModules: ['employees','attendance','leave','payroll','compliance',
            'recruitment','performance','training','assets','expenses',
            'reports','automation','communication','settings'],
        };
        return next();
      }

      // Found in central DB — attempt to resolve their DB.
      // If resolution fails (e.g. unprovisioned db_url), fall back to dev database.
      try {
        req.db = await resolveTenantDB(tenant);
      } catch (resolveErr) {
        let finalUrl = process.env.DEV_TENANT_DATABASE_URL;
        if (!finalUrl) throw resolveErr;
        
        console.warn(`[Tenant] DEV — resolution failed for "${tenant.subdomain}", falling back to DEV_TENANT_DATABASE_URL`);

        // FIX: Even in fallback, we must respect the tenant's schema if it exists
        if (tenant.schema_name) {
          const urlObj = new URL(finalUrl);
          urlObj.searchParams.set('schema', tenant.schema_name);
          finalUrl = urlObj.toString();
        }

        req.db = getTenantDB(finalUrl);
      }

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
    // Determine the subdomain or custom domain from the request.
    let lookupSubdomain;
    const headerSubdomain = req.headers['x-tenant-subdomain']?.toLowerCase().trim();

    if (headerSubdomain) {
      lookupSubdomain = headerSubdomain;
    } else if (isPlatformRootHost) {  // FIX: was PLATFORM_ROOTS.has(host), now includes isRailwayHost
      // If the host is a platform root, it means no tenant context is provided.
      return sendError(res, ERROR_CODES.NOT_FOUND,
        'No company context. Please log in via your company URL.', 400);
    } else {
      lookupSubdomain = host.split('.')[0];
      // Extract subdomain from the hostname (e.g., 'pcepl' from 'pcepl.syntern.in').
    }

    const centralDB = getCentralDB();
    const normalizedHost = host?.toLowerCase()?.replace(/^www\./, '') || host;
    const rows = await centralDB.$queryRaw`
      SELECT
        t.id, t.name, t.subdomain, t.custom_domain,
        t.db_mode, t.db_url, t.is_active, t.is_setup_complete,
        t.schema_name,           -- ← NEW: select schema_name
        t.local_db_type, t.local_db_host, t.local_db_port,
        t.local_db_name, t.local_db_user, t.local_db_pass,
        COALESCE(
          json_agg(tm.module_name) FILTER (WHERE tm.is_active = true),
          '[]'
        ) AS enabled_modules
      FROM tenants t
      LEFT JOIN tenant_modules tm ON tm.tenant_id = t.id
      WHERE (
        LOWER(t.subdomain)    = LOWER(${lookupSubdomain})
        OR LOWER(t.custom_domain) = LOWER(${host})
        OR LOWER(t.custom_domain) = LOWER(${normalizedHost})
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

    // Check if the tenant is active.
    if (!tenant.is_active) {
      console.log(`[Tenant] ✗ Suspended — subdomain="${lookupSubdomain}"`);
      return sendError(res, ERROR_CODES.LICENCE,
        'Your account is suspended. Contact support@syntern.in', 403);
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
