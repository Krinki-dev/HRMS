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
