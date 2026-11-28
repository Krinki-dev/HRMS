# Cycle 01 Implementation and Architecture Audit — Phase 26: PostgreSQL Migration Baseline and Deployment Gate

**Date:** 2026-11-28 (Asia/Kolkata)  
**Repository:** `Krinki-dev/HRMS`  
**Branch:** `architecture/postgres-tenant-isolation`  
**Tasks:** HRMS-D-005 (tenant PostgreSQL migration baseline), HRMS-F-013 (deployment migration gate)  
**Protected branch:** `main` — untouched

## 1. Executive summary

The current repository does not contain a valid, discoverable PostgreSQL Prisma migration history for the operational tenant schema.

Evidence:
- The operational Prisma schema is PostgreSQL.
- The only directory resembling a Prisma migration history is literally named `backend/prisma/migrations     11223`, not `backend/prisma/migrations`.
- Its `migration_lock.toml` says `provider = "mssql"`.
- Its initial migration is SQL Server DDL (`BEGIN TRY`, `[dbo]`, `NVARCHAR`, `DATETIME2`, SQL Server constraints), not PostgreSQL SQL.
- The Central schema is a separate PostgreSQL Prisma schema and its manual SQL migrations live under `backend/db-migrations`.
- `backend/package.json` exposes `prisma migrate dev` as the generic `migrate` script.
- `railway.json` runs `node scripts/apply_canonical_schema_migration.js` before starting the server. That script executes one Central SQL file on every deploy and catches errors without failing the process, so the server can still start after migration failure.

**No baseline SQL was generated and no database was connected.** Generating an initial migration from the current Prisma schema and applying it to an existing database without a schema/data inventory could destroy or invalidate customer data. The correct next step is a separately versioned Central and tenant migration architecture, followed by clean-install and existing-database adoption tests.

## 2. Source evidence

| File | Blob SHA | Finding |
|---|---|---|
| `backend/prisma/schema.prisma` | `39fb35175b4daa6767d1575bc6f8eef8e3449066` | Tenant operational schema provider is PostgreSQL |
| `backend/prisma/central.prisma` | `0591ffa909e4e432d0ae326f4f7888ffafcb3eeb` | Central schema is a separate PostgreSQL Prisma schema |
| `backend/prisma/migrations     11223/migration_lock.toml` | `9209af83df21675bb3b79aa73d3d875bef1ad240` | Legacy provider is MSSQL |
| `backend/prisma/migrations     11223/20260310153658_init/migration.sql` | `5b6e6856144cfdecb5e7a7b8f84a379ce9c495f9` | SQL Server syntax; not executable on PostgreSQL |
| `backend/package.json` | `57063e701a437714076c565c58bc85e04d53aa57` | `migrate` script runs `prisma migrate dev`; postinstall generates two clients |
| `railway.json` | `db0d1378661a5dca9176966a8c9d9b1d7c945686` | Deploy start command runs migration script before server |
| `backend/scripts/apply_canonical_schema_migration.js` | `054082af3f8f013c2ad8d1ae8abf677b4165d220` | Applies one Central SQL file on each deploy; errors are caught and startup continues |
| `backend/db-migrations/README.md` | `079f6706e329f3482e89f7eecb1f12d4aae1657d` | Already warns that the legacy MSSQL history is invalid for PostgreSQL |

## 3. Required migration architecture

### 3.1 Separate Central and tenant migration histories

The Central and tenant schemas point at different PostgreSQL databases and must not share one Prisma migration history.

Recommended canonical layout:

```text
backend/prisma/
  central/
    schema.prisma
    migrations/
      migration_lock.toml
      0001_central_baseline/
        migration.sql
  tenant/
    schema.prisma
    migrations/
      migration_lock.toml
      0001_tenant_baseline/
        migration.sql
```

The current schema files should be moved or made canonical in those locations only after every generator, import, package script, test, worker and deployment reference is updated. Do not leave two independently editable copies that can drift.

### 3.2 Baseline generation

After the schema paths are established, generate baseline SQL from the Prisma data model using the Prisma CLI's schema-diff capability. Review the generated SQL manually for:
- PostgreSQL extensions and enum types;
- all model tables, defaults, nullability and unique constraints;
- relation ordering and foreign-key actions;
- composite same-company integrity constraints;
- indexes and partial indexes;
- triggers, functions and custom SQL not represented in Prisma;
- Central RLS policies and required transaction-local context.

The Central baseline must include the policy set from Phase 25. The tenant baseline must not introduce operational RLS contrary to frozen decisions.

### 3.3 Existing database adoption

An existing database must not receive a from-empty baseline migration blindly.

1. Take and verify a backup.
2. Read-only inventory of `information_schema` and `pg_catalog` for tables, columns, types, indexes, constraints, functions, triggers, extensions, policies, owners and grants.
3. Compare the actual schema with the generated baseline.
4. Reconcile differences and customer data before declaring the baseline applied.
5. Use Prisma migration resolution only after the database is proven to match the baseline exactly.
6. Test the same adoption process against representative legacy tenant schemas on disposable PostgreSQL.
7. Never use `migrate reset`, destructive `db push`, or the legacy MSSQL migration.

### 3.4 Tenant storage lifecycle

- Shared Free/Trial tenants use the shared `public` operational schema. One tenant migration history applies to that shared schema; migrations must be serialized.
- Paid dedicated-schema tenants need the same migration set applied independently to each UUID-derived schema, under a tenant/schema-specific lock.
- Dedicated customer databases need the same migration set applied to each verified PostgreSQL database.
- A background migration worker should use the canonical tenant storage resolver, record the schema version and lease/attempt state, and fail closed when the target is not verified.
- No Paid promotion is allowed until the target schema is migrated and validated.

### 3.5 Deployment gate

- Remove DDL/migration execution from the web-server start command.
- Run Central and tenant migration jobs as separate, serialized release steps.
- A migration error must fail the release and prevent the new app version from becoming ready.
- The server readiness check should compare required schema versions and dependencies; liveness alone is insufficient.
- Preserve rollback through backup/restore or forward-fix. Do not promise down migrations for data-changing DDL.
- Record migration version, exact code SHA, target Central/tenant schema, start/end, result and operator approval.

## 4. CI acceptance requirements

The migration pipeline must prove:
1. Clean Central PostgreSQL 16 install from the Central baseline.
2. Clean tenant PostgreSQL 16 install from the tenant baseline.
3. Upgrade from the previous supported schema version.
4. Re-run idempotency and concurrent migration lock behavior.
5. Shared public schema migration runs once and preserves multiple companies.
6. Dedicated schema migration runs independently per tenant.
7. Customer database migration does not connect to unapproved hosts.
8. Central RLS policies and non-owner role behavior pass negative tests.
9. Missing/failed migration blocks deploy/readiness.
10. Existing MSSQL SQL is never selected by the PostgreSQL migration runner.

## 5. Safety and scope boundary

- No database URL or credential was accessed.
- No Central or tenant PostgreSQL database was connected.
- No schema diff was generated from a live database.
- No migration, `db push`, `migrate resolve`, reset or DDL was executed.
- No Railway configuration or deployment behavior was changed.
- No customer data was moved or deleted.

## 6. Task status

- **HRMS-D-005:** Blocked on separate migration-history layout and read-only inventory of actual Central/tenant databases. The current MSSQL history is not a usable PostgreSQL baseline.
- **HRMS-F-013:** Deployment migration gate is not compliant: Railway invokes a migration script at app start and that script suppresses errors. Remediation is specified but not applied because deployment configuration changes require a separate approved release.
- **GAP-0003 / GAP-0041:** Confirmed open until the PostgreSQL baselines and adoption path are implemented and tested.
- **GAP-0051:** Expanded with source evidence that deploy-time migration errors do not fail server startup.

**Next:** complete the operational module ownership review and close the current source-level RBAC/IDOR fixes; then implement the separate Central/tenant migration layout on the working branch with disposable PostgreSQL CI. Do not run any production migration or deployment without explicit approval.
