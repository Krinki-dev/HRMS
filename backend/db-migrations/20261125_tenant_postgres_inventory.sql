-- Syntern HRMS: read-only PostgreSQL tenant database inventory
-- TARGET: the tenant operational database referenced by DEV_TENANT_DATABASE_URL.
-- DO NOT run against CENTRAL_DATABASE_URL.
-- This script reads catalog metadata only. It does not read employee rows,
-- expose credentials, create objects, or modify data.
BEGIN TRANSACTION READ ONLY;

SELECT
  '1) Connection identity' AS section,
  current_database() AS database_name,
  current_schema() AS current_schema,
  current_user AS connected_user,
  current_setting('search_path') AS search_path,
  version() AS postgres_version;

SELECT
  '2) User tables and estimated row counts' AS section,
  s.schemaname AS schema_name,
  s.relname AS table_name,
  GREATEST(s.n_live_tup, 0)::bigint AS estimated_rows
FROM pg_stat_user_tables AS s
ORDER BY s.schemaname, s.relname;

SELECT
  '3) Table column inventory' AS section,
  table_schema AS schema_name,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  AND table_schema NOT LIKE 'pg_toast%'
ORDER BY table_schema, table_name, ordinal_position;

SELECT
  '4) Prisma migration history table presence' AS section,
  n.nspname AS schema_name,
  c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND c.relname = '_prisma_migrations'
ORDER BY n.nspname;

-- If section 4 shows a _prisma_migrations table, run this separate read-only
-- query in that schema, replacing public only if the table is elsewhere:
-- SELECT migration_name, checksum, started_at, finished_at, rolled_back_at,
--        applied_steps_count
-- FROM public."_prisma_migrations"
-- ORDER BY started_at;

SELECT
  '6) Extensions' AS section,
  extname AS extension_name,
  extversion AS extension_version
FROM pg_extension
ORDER BY extname;

ROLLBACK;
