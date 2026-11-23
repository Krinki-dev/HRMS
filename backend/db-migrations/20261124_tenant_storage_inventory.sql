-- Syntern HRMS: read-only tenant storage inventory (legacy-schema compatible)
-- Run against the CENTRAL PostgreSQL database only.
-- SELECT-only: does not update, provision, migrate, or connect to tenant databases.
-- Credentials and connection strings are never selected.
BEGIN TRANSACTION READ ONLY;

SELECT '0) Storage lifecycle schema readiness' AS inventory_section;
SELECT
  COUNT(*) FILTER (WHERE column_name = 'storage_tier') > 0 AS has_storage_tier,
  COUNT(*) FILTER (WHERE column_name = 'storage_status') > 0 AS has_storage_status,
  COUNT(*) FILTER (WHERE column_name = 'storage_provisioned_at') > 0 AS has_storage_provisioned_at,
  COUNT(*) FILTER (WHERE column_name = 'storage_error_code') > 0 AS has_storage_error_code
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tenants';

SELECT '1) Aggregate tenant inventory (legacy rows are explicitly unclassified)' AS inventory_section;
SELECT
  COALESCE(plan, '<null>') AS plan,
  COALESCE(db_mode, '<null>') AS db_mode,
  'legacy_unclassified'::text AS storage_tier,
  'legacy_unclassified'::text AS storage_status,
  COUNT(*) AS tenant_count,
  COUNT(*) FILTER (WHERE db_url IS NOT NULL AND btrim(db_url) <> '') AS rows_with_db_url,
  COUNT(*) FILTER (WHERE schema_name IS NOT NULL AND btrim(schema_name) <> '') AS rows_with_schema_name,
  COUNT(*) FILTER (WHERE local_db_host IS NOT NULL AND btrim(local_db_host) <> '') AS rows_with_local_host
FROM public.tenants
WHERE deleted_at IS NULL
GROUP BY plan, db_mode
ORDER BY plan, db_mode;

SELECT '2) Per-tenant routing metadata (no connection strings or credentials)' AS inventory_section;
SELECT
  id AS tenant_id,
  subdomain,
  plan,
  db_mode,
  'legacy_unclassified'::text AS storage_tier,
  'legacy_unclassified'::text AS storage_status,
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

SELECT '3) Duplicate non-empty schema assignments (review; duplicates are not automatically errors)' AS inventory_section;
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

SELECT '4) Potentially unsafe or incomplete legacy routing records' AS inventory_section;
SELECT
  id AS tenant_id,
  subdomain,
  plan,
  db_mode,
  CASE
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
      THEN 'HYBRID_IS_CONNECTION_FALLBACK_NOT_VERIFIED_DATA_SYNC'
    WHEN db_mode NOT IN ('cloud', 'external_cloud', 'local', 'hybrid')
      THEN 'UNKNOWN_DB_MODE'
    ELSE 'REVIEW_LEGACY_ROUTING_AND_TENANT_DATA'
  END AS review_reason
FROM public.tenants
WHERE deleted_at IS NULL
  AND (
    (db_mode = 'external_cloud' AND (db_url IS NULL OR btrim(db_url) = ''))
    OR (db_mode IN ('local', 'hybrid') AND (
      local_db_host IS NULL OR local_db_name IS NULL OR local_db_user IS NULL
    ))
    OR db_mode = 'hybrid'
    OR db_mode NOT IN ('cloud', 'external_cloud', 'local', 'hybrid')
    OR (db_mode = 'cloud' AND (db_url IS NULL OR btrim(db_url) = ''))
  )
ORDER BY created_at, subdomain;

ROLLBACK;
