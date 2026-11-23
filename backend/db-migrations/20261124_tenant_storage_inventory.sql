-- Syntern HRMS: read-only tenant storage inventory
-- Run against the CENTRAL PostgreSQL database only.
-- This script performs SELECTs only; it does not update, provision, migrate, or connect to tenant databases.
-- Example:
--   psql "$CENTRAL_DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db-migrations/20261124_tenant_storage_inventory.sql
--
-- Output intentionally excludes db_url, local_db_user, local_db_pass, hostnames, and credentials.
BEGIN TRANSACTION READ ONLY;

\echo '1) Aggregate inventory by plan, routing mode, and storage lifecycle'
SELECT
  COALESCE(plan, '<null>') AS plan,
  COALESCE(db_mode, '<null>') AS db_mode,
  COALESCE(storage_tier, '<null>') AS storage_tier,
  COALESCE(storage_status, '<null>') AS storage_status,
  COUNT(*) AS tenant_count,
  COUNT(*) FILTER (WHERE db_url IS NOT NULL AND btrim(db_url) <> '') AS rows_with_db_url,
  COUNT(*) FILTER (WHERE schema_name IS NOT NULL AND btrim(schema_name) <> '') AS rows_with_schema_name,
  COUNT(*) FILTER (WHERE local_db_host IS NOT NULL AND btrim(local_db_host) <> '') AS rows_with_local_host
FROM public.tenants
WHERE deleted_at IS NULL
GROUP BY plan, db_mode, storage_tier, storage_status
ORDER BY plan, db_mode, storage_tier, storage_status;

\echo '2) Per-tenant routing metadata (no connection strings or credentials)'
SELECT
  id AS tenant_id,
  subdomain,
  plan,
  db_mode,
  storage_tier,
  storage_status,
  CASE WHEN db_url IS NULL OR btrim(db_url) = '' THEN false ELSE true END AS has_db_url,
  NULLIF(btrim(schema_name), '') AS schema_name,
  CASE WHEN local_db_host IS NULL OR btrim(local_db_host) = '' THEN false ELSE true END AS has_local_host,
  CASE WHEN local_db_name IS NULL OR btrim(local_db_name) = '' THEN false ELSE true END AS has_local_database_name,
  CASE WHEN local_db_user IS NULL OR btrim(local_db_user) = '' THEN false ELSE true END AS has_local_user,
  CASE WHEN local_db_pass IS NULL OR btrim(local_db_pass) = '' THEN false ELSE true END AS has_local_password,
  is_active,
  is_setup_complete,
  created_at,
  deleted_at
FROM public.tenants
WHERE deleted_at IS NULL
ORDER BY created_at, subdomain;

\echo '3) Duplicate non-empty schema assignments (review; duplicates are not automatically errors)'
SELECT
  db_mode,
  schema_name,
  COUNT(*) AS tenant_count,
  array_agg(subdomain ORDER BY subdomain) AS tenant_subdomains
FROM public.tenants
WHERE deleted_at IS NULL
  AND schema_name IS NOT NULL
  AND btrim(schema_name) <> ''
GROUP BY db_mode, schema_name
HAVING COUNT(*) > 1
ORDER BY tenant_count DESC, db_mode, schema_name;

\echo '4) Potentially unsafe or incomplete routing records'
SELECT
  id AS tenant_id,
  subdomain,
  plan,
  db_mode,
  storage_tier,
  storage_status,
  CASE
    WHEN storage_tier = 'legacy_unclassified' OR storage_status = 'legacy_unclassified'
      THEN 'LEGACY_UNCLASSIFIED'
    WHEN db_mode = 'cloud' AND (db_url IS NULL OR btrim(db_url) = '') AND schema_name IS NULL
      THEN 'CLOUD_USES_ENV_FALLBACK_AND_DEFAULT_SCHEMA'
    WHEN db_mode = 'cloud' AND (db_url IS NULL OR btrim(db_url) = '') AND schema_name IS NOT NULL
      THEN 'CLOUD_USES_ENV_FALLBACK_WITH_SCHEMA'
    WHEN db_mode = 'external_cloud' AND (db_url IS NULL OR btrim(db_url) = '')
      THEN 'EXTERNAL_CLOUD_MISSING_DB_URL'
    WHEN db_mode IN ('local', 'hybrid') AND (
      local_db_host IS NULL OR local_db_name IS NULL OR local_db_user IS NULL
    )
      THEN 'LOCAL_CONFIGURATION_INCOMPLETE'
    WHEN db_mode = 'hybrid'
      THEN 'HYBRID_REQUIRES_MANUAL_SYNC_AND_ROUTING_REVIEW'
    WHEN db_mode NOT IN ('cloud', 'external_cloud', 'local', 'hybrid')
      THEN 'UNKNOWN_DB_MODE'
    ELSE 'REVIEW_STORAGE_TIER_AND_ROUTING_CONSISTENCY'
  END AS review_reason
FROM public.tenants
WHERE deleted_at IS NULL
  AND (
    storage_tier = 'legacy_unclassified'
    OR storage_status = 'legacy_unclassified'
    OR (db_mode = 'external_cloud' AND (db_url IS NULL OR btrim(db_url) = ''))
    OR (db_mode IN ('local', 'hybrid') AND (
      local_db_host IS NULL OR local_db_name IS NULL OR local_db_user IS NULL
    ))
    OR db_mode = 'hybrid'
    OR db_mode NOT IN ('cloud', 'external_cloud', 'local', 'hybrid')
    OR (db_mode = 'cloud' AND (db_url IS NULL OR btrim(db_url) = ''))
  )
ORDER BY created_at, subdomain;

ROLLBACK;
