# HRMS database migrations

The project has **two database roles**. Never point a migration at the wrong one:

- **Platform / Central database** — `CENTRAL_DATABASE_URL`; contains tenant registry, platform onboarding, subscription/billing ledgers, platform settings and company-document metadata.
- **Tenant operational database** — `DEV_TENANT_DATABASE_URL` in development, or the tenant-specific connection resolved by the tenant middleware; contains employees, attendance, leave, payroll and other HRMS operational tables.

## Current central platform upgrade

Preferred single-file upgrade for the platform database:

`20261125_central_platform_schema_upgrade.sql`

It additively ensures:
- tenant storage lifecycle fields and onboarding progress;
- Razorpay payment-order and webhook idempotency tables;
- company document metadata and review history;
- billing event log;
- relevant indexes and tenant/document row-level security policies.

It does **not** create or alter employee, attendance, leave or payroll tables. It does not move tenant data or provision databases.

### Before running

1. Confirm the selected Supabase project is the **central/platform** project (the one whose database contains `public.tenants`).
2. Take a Supabase backup / point-in-time recovery checkpoint and confirm it is available.
3. Open Supabase SQL Editor in that project and run the complete file once.
4. Check that the final verification query returns all six table flags and all six column flags as `true`.
5. Regenerate the central Prisma client from `backend/`: `npx prisma generate --schema=prisma/central.prisma`.

For PowerShell / psql from the repository root, with the central URL already configured securely in the environment:
`psql "$env:CENTRAL_DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db-migrations/20261125_central_platform_schema_upgrade.sql`

Do not paste database URLs or passwords into chat, source control, or screenshots.

## Important: diagnostic file is not a migration

`20261124_tenant_storage_inventory.sql` is **read-only diagnostic SQL**. It starts a read-only transaction and rolls it back. It only reports existing tenant storage metadata and routing. It does not add columns or change data. Do not treat it as a schema upgrade.

## Historical / component migrations

The earlier files `20261124_payment_order_ledger.sql`, `20261124_tenant_onboarding_progress.sql`, `20261124_tenant_storage_lifecycle.sql`, and `20261124_company_document_workflow.sql` are retained as component-level history. If you run the consolidated upgrade above, **do not separately rerun those component migrations** unless you are deliberately repairing a partial deployment after reviewing the database state. The consolidated file is designed to be safely re-run.

`20260606_rls_and_function_fix.sql` and `20260813_gst_canonical_columns_and_backup_config.sql` are separate earlier central-database hardening/compatibility migrations. Do not rerun the RLS file blindly: its original policy creation statements are not fully idempotent. Review current policy state first.

## Tenant operational schema

The tenant Prisma schema is `backend/prisma/schema.prisma` and targets PostgreSQL via `DEV_TENANT_DATABASE_URL`. The repository currently contains a legacy migration directory whose name includes spaces and whose `migration_lock.toml` says `provider = "mssql"`; its initial SQL is SQL Server syntax. It is **not a valid PostgreSQL migration history** and must not be run against Supabase PostgreSQL.

Before creating tenant PostgreSQL migration SQL, establish the current tenant database schema and generate a PostgreSQL migration/baseline from the current tenant Prisma schema. Never use `migrate reset` on a database that may contain data. This tenant-schema work is separate from the central platform upgrade above.

## Security notes

- The application must set `app.current_tenant` inside the same transaction as tenant-scoped central queries; platform-admin operations must use the platform-admin RLS context.
- PostgreSQL table owners and Supabase service-role connections can bypass RLS. Keep database credentials server-side and use least-privilege roles where practical.
- Company document bytes belong in private object storage, not in PostgreSQL. Uploads should remain disabled until private storage and malware scanning are configured.


## Tenant storage router rollout gate (2026-11-25)

The backend tenant middleware, authentication DB lookup, platform-admin tenant DB access and new tenant registration now use the audited PostgreSQL storage resolver. It fails closed for rows whose `storage_tier` / `storage_status` are missing, legacy, pending, provisioning or failed.

**Do not deploy this router against an unclassified Central database.** The consolidated upgrade adds the lifecycle columns with `legacy_unclassified` defaults; it deliberately does not guess where existing tenant data lives.

After the Central upgrade and backup verification:

1. Run `20261125_tenant_storage_classification_preview.sql` as a read-only review. It reports candidate tiers and the current-vs-expected schema without showing connection strings or changing data.
2. Verify each tenant's actual database, schema, tables, row ownership and backup/restore status. Existing registrations may still use `tenant_<subdomain>`; do not mark those tenants ready as UUID-derived schemas or `public` until data has been safely reconciled.
3. Managed-cloud Free/Trial registrations now target the shared `public` schema. Customer-managed `local` and `external_cloud` PostgreSQL registrations target a dedicated database with no schema override and require the HRMS PostgreSQL tables to exist before registration.
4. The paid managed-cloud transition from shared `public` to a UUID-derived dedicated schema still requires a separately tested data-migration/provisioning workflow. Do not mark a paid tenant's storage ready in a dedicated schema until all tenant-owned rows and foreign-key relationships have been migrated and verified.
5. Existing legacy tenants remain blocked by the resolver until explicitly classified and verified. No automatic legacy classification, schema cloning, data movement, production migration or deployment has been performed from this code work.

The registration path records new tenant storage as `provisioning`, seeds the operational company/role/admin records, and only then marks storage `ready` and the tenant active. If seeding fails, the tenant remains inactive and its storage remains non-ready for manual recovery.


## Central KYC tenant-isolation migration

Apply `20261125_central_kyc_tenant_isolation.sql` only after a verified Central DB backup and a reviewed migration window. It adds `tenant_id`, replaces global Aadhaar-hash uniqueness with `(tenant_id, aadhaar_hash)` uniqueness, and allows Central RLS access only to the owning tenant or platform admins.

Existing rows are intentionally left with `tenant_id IS NULL`. They are not visible to tenant-scoped KYC routes after this migration. Do not backfill by guessing from Aadhaar hashes, email, phone or task IDs. A separate evidence-based ownership reconciliation is required before any legacy KYC row is assigned to a tenant.


Shared `public` schema tenant backups are also a release blocker: the current backup target resolver intentionally refuses to dump a shared schema as an individual tenant backup. Never remove that guard or deliver a whole-public-schema dump to one customer. A tenant-filtered relational backup/restore or platform-wide protected backup design must be implemented first.
