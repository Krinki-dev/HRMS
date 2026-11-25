-- READ-ONLY preview of tenant storage classification.
-- Target: CENTRAL_DATABASE_URL only. Never run this against a tenant database.
-- This script does not update storage_tier/status or move any tenant data.
BEGIN TRANSACTION READ ONLY;

WITH tenant_candidates AS (
  SELECT
    id,
    subdomain,
    plan,
    db_mode,
    schema_name,
    storage_tier,
    storage_status,
    CASE
      WHEN db_mode = 'cloud' AND LOWER(COALESCE(plan, '')) IN ('free', 'trial') THEN 'shared'
      WHEN db_mode = 'cloud' THEN 'dedicated_schema'
      WHEN db_mode IN ('external_cloud', 'local') THEN 'dedicated_database'
      ELSE 'manual_review'
    END AS suggested_tier,
    CASE
      WHEN db_mode = 'cloud' AND LOWER(COALESCE(plan, '')) IN ('free', 'trial') THEN 'public'
      WHEN db_mode = 'cloud' THEN 'tenant_' || REPLACE(LOWER(id::text), '-', '')
      ELSE NULL
    END AS expected_schema,
    CASE
      WHEN db_mode = 'external_cloud' THEN (db_url IS NOT NULL AND BTRIM(db_url) <> '')
      WHEN db_mode = 'local' THEN (
        local_db_host IS NOT NULL AND local_db_name IS NOT NULL AND local_db_user IS NOT NULL
      )
      WHEN db_mode = 'cloud' THEN true
      ELSE false
    END AS connection_config_present
  FROM public.tenants
  WHERE deleted_at IS NULL
)
SELECT
  id AS tenant_id,
  subdomain,
  plan,
  db_mode,
  schema_name AS current_schema,
  storage_tier,
  storage_status,
  suggested_tier,
  expected_schema,
  connection_config_present,
  CASE
    WHEN suggested_tier = 'manual_review' THEN 'UNSUPPORTED_DATABASE_MODE_REVIEW_REQUIRED'
    WHEN NOT connection_config_present THEN 'CONNECTION_CONFIGURATION_INCOMPLETE'
    WHEN db_mode = 'cloud' AND schema_name = expected_schema THEN 'VERIFY_SCHEMA_CONTENT_AND_COMPANY_OWNERSHIP'
    WHEN db_mode = 'cloud' AND LOWER(COALESCE(plan, '')) IN ('free', 'trial') THEN 'MOVE_EXISTING_TENANT_ROWS_TO_PUBLIC_BEFORE_CLASSIFYING'
    WHEN db_mode = 'cloud' THEN 'PROVISION_UUID_SCHEMA_AND_MOVE_EXISTING_TENANT_ROWS'
    WHEN db_mode IN ('external_cloud', 'local') AND schema_name IS NULL THEN 'VERIFY_DATABASE_IS_TENANT_DEDICATED_AND_SCHEMA_IS_READY'
    ELSE 'MOVE_OR_RECONCILE_EXISTING_SCHEMA_CONTENT_BEFORE_CLASSIFYING'
  END AS required_review_action
FROM tenant_candidates
ORDER BY subdomain, tenant_id;

ROLLBACK;
