# Cycle 01 Source Audit — Phase 16
Date: 2026-11-28
Branch: `architecture/postgres-tenant-isolation`
Scope: PostgreSQL operational schema, tenant/company referential integrity, central RLS policy coverage, fresh-install schema baseline, and FK index inventory.

## 1. Executive result

Phase 16 reviewed the two Prisma schemas, central SQL bootstrap, RLS migrations, test instructions and frozen architecture rules. This was a source-only audit; no database was connected and no tests were executed.

Key results:

- Operational schema: 82 Prisma models, 33 with a direct `company_id` field, and 55 declared Prisma relations.
- **GAP-0046 (P1, database integrity):** multiple company-owned parent/child relations reference only the parent row ID, not the pair of parent ID + company ID. The database therefore does not itself guarantee that a child row belongs to the same company as its referenced parent. Examples include employees → branches/departments/designations, job postings → requisitions, and candidates → job postings. This is a structural integrity risk; actual cross-company rows were not inspected.
- Central schema: 17 Prisma models. **GAP-0047 (P1, central data isolation):** several central models that contain tenant/company-specific data do not have an RLS policy in the inspected migration set. Examples include `backup_config` and legacy `tenant_db_config`. Other global/operational tables such as `payment_webhook_events` and `billing_events` also have no row policy in the reviewed SQL; their required access model needs explicit classification rather than automatic tenant policy.
- **GAP-0048 (P1, fresh-install security baseline):** `backend/prisma/central_schema.sql` creates the central tables but contains zero `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`, or `CREATE POLICY` statements. RLS is in separate additive migrations. A fresh install that applies only the documented bootstrap file does not receive those RLS policies.
- **GAP-0049 (P2, performance):** 30 of the 55 declared operational Prisma relations use FK columns without a declared index or unique index in the schema. PostgreSQL does not automatically create indexes on referencing FK columns. This is a review candidate, not a blanket instruction to add 30 indexes; workload and query plans must determine which are needed.
- Existing architecture explicitly says tenant operational tables have no RLS and rely on per-tenant database/schema routing plus `company_id` filters inside shared operational databases. It also explicitly warns that PostgreSQL table owners/superusers bypass RLS unless FORCE RLS or a non-owner application role is used. The production central connection role has not been verified.

## 2. Source evidence

All sources were fetched from `architecture/postgres-tenant-isolation`.

| File | Blob SHA | Evidence |
|---|---|---|
| `backend/prisma/schema.prisma` | `39fb35175b4daa6767d1575bc6f8eef8e3449066` | 82 operational models; company_id fields, Prisma relations and declared indexes. |
| `backend/prisma/central.prisma` | `0591ffa909e4e432d0ae326f4f7888ffafcb3eeb` | 17 central models, including tenant_modules, central_user_index, central_kyc_records, invoices, payment_orders, payment_webhook_events, billing_events, backup_config, tenant_db_config and company documents. |
| `backend/prisma/central_schema.sql` | `2f00c1480181a17a9a3242ae13e45a431e699fe3` | 649-line central bootstrap; source scan found zero RLS enable/force/policy statements. |
| `backend/db-migrations/20260606_rls_and_function_fix.sql` | `9727dc40ff4a385cdba26ceef6a63087a4a81396` | Adds policies for tenant_modules, tenant_pricing_configs, invoices, tenant_branch_links, tenants, central_user_index, central_kyc_records, central_gst_records and platform_settings. |
| `backend/db-migrations/20261125_central_platform_schema_upgrade.sql` | `b4b580f89e9dd6fba9a56d4c0fac30f8f2c03bd1` | Adds RLS for payment_orders, company_documents and company_document_reviews. |
| `backend/db-migrations/20261125_tenant_migration_jobs.sql` | `13396c27acf7f43ec76aea7d4b7c011ed5058908` | Adds platform-admin-only RLS and immutable trigger to tenant_migration_jobs. |
| `backend/shared/utils/rlsContext.js` | `57c339c66ee9e448d948ac2eefd2c9d2e8ee4070` | Sets tenant/platform-admin context and executes protected callback inside the same Prisma transaction. |
| `backend/test/rls-tenant-isolation.test.js` | `6bcee49d4cee896e438925d42282463d2fc0fe0b` | Real-Postgres pooling test; skipped unless RLS_TEST_APP_DATABASE_URL is configured. |
| `backend/test/README.md` | `0c0f73d3efa5c913239a3d6b601ccb1541da290a` | Explicitly warns that table owners/superusers bypass RLS and documents the non-owner test role. |
| `HRMS_Blueprint/07_FROZEN_DECISIONS.md` | `974a3ca25133c41129f703fb34c39186434fc147` | Lines 248–281: central-only RLS scope and owner-bypass caveat. Lines 286–305: shared operational DB isolation relies on explicit company_id filters. |

## 3. Detailed analysis

### 3.1 Operational referential integrity (GAP-0046)

The operational schema has 33 models with a direct `company_id` field. Many child tables omit company_id and inherit company ownership through a parent relation. This is a reasonable normalization pattern only if every relation chain is constrained to the same company.

The current Prisma relations generally reference a parent primary key alone. Examples:
- `employees.branch_id → branches.id`, while both records have `company_id`.
- `employees.department_id → departments.id` and `employees.designation_id → designations.id`, while both sides have `company_id`.
- `job_postings.requisition_id → job_requisitions.id`, where both models have `company_id`.
- `candidates.job_id → job_postings.id`, where both models have `company_id`.

The FK proves that the referenced row exists, but not that its company matches the child row's company. A composite unique key on the parent (for example `(id, company_id)`) and matching composite FK on the child is one possible database-level control, but implementation requires a full dependency/data audit and Prisma compatibility review. Do not make schema changes until the Cycle 01 plan is independently verified.

### 3.2 Central RLS coverage (GAP-0047)

The original RLS migration guards nine tables. Later migrations add policies for payment_orders, company_documents, company_document_reviews and tenant_migration_jobs. The central Prisma schema contains 17 models.

At least the legacy `backup_config` and `tenant_db_config` models contain company_id and sensitive tenant configuration but no RLS policy was found in the reviewed migration sources. Their company_id fields are unique but are not declared as foreign keys to tenants in the Prisma model. `payment_webhook_events` and `billing_events` also have no policy in the reviewed SQL; their intended platform-only versus tenant-visible access should be explicitly documented and tested.

Absence of a policy in the reviewed repository source does not prove the live database has no separately applied policy. The actual Central database catalog was not queried.

### 3.3 Fresh-install baseline (GAP-0048)

`central_schema.sql` is described as the canonical bootstrap for fresh central installations, but it does not enable or force RLS on any table and defines no policies. The RLS policy migration is a separate file. Installation instructions and release automation must guarantee the RLS migration set is applied and verified for fresh as well as upgraded environments.

The frozen decisions document says central RLS is required. Therefore, a bootstrap-only install is inconsistent with the security baseline. The live installation state remains unknown.

### 3.4 RLS role bypass and test coverage

The frozen architecture and test README correctly warn that PostgreSQL table owners and superusers bypass RLS by default. The README's test setup creates a non-owner `hrms_app` role specifically to test policies. However, no evidence in the reviewed repository establishes which role is used by the actual production `CENTRAL_DATABASE_URL`. This must be verified before treating RLS as an effective production isolation boundary.

`withTenantRLS` and `withPlatformAdminRLS` use transaction-local `set_config(..., true)` and execute the protected callback on the same transaction client. The real PostgreSQL pooling test is designed to prove concurrent isolation, but it skips without `RLS_TEST_APP_DATABASE_URL`; it was not executed in this audit.

### 3.5 Index inventory (GAP-0049)

A static scan of the 82 operational Prisma models found 55 declared relations; 30 FK columns had no declared index or unique index. Examples include `employees.branch_id`, `employees.department_id`, `employees.designation_id`, `users.role_id`, `job_postings.requisition_id`, `candidates.job_id`, training child `training_id` fields, and several recruitment/performance/asset/expense child references.

This can increase join cost and make parent deletes/updates more expensive. Some indexes may already exist outside the Prisma schema or may not be justified by workload. Verify actual catalog indexes and query plans before adding any. Do not create one index per FK automatically.

## 4. Required follow-up

1. Build a table-by-table ownership map for all operational tables: direct company_id, dependent via validated FK path, global/reference data, or unclassified.
2. Identify every company-owned FK where child and parent have company_id; test for cross-company references using synthetic data in an isolated DB only.
3. Design safe composite FK candidates and migration/backfill validation; do not alter production data.
4. Inventory every central model and classify access as tenant-scoped, platform-only, global shared, or webhook-ingress; map each to RLS policy and service call pattern.
5. Ensure fresh-install bootstrap and upgrade path both apply and verify the complete RLS policy set.
6. Verify actual production central DB role, ownership, superuser/BYPASSRLS attributes and FORCE RLS state through an approved read-only operational check; no production DB access was performed.
7. Run RLS pooling tests against a disposable PostgreSQL instance using a non-owner application role; add tests for INSERT/UPDATE/DELETE, missing context, platform-admin access and concurrent tenant switching.
8. Compare the 30 candidate FK indexes against actual database indexes and representative query plans before prioritizing changes.

## 5. Validation and safety

- Static source review only; schema counts and index candidate counts are source-derived.
- No PostgreSQL database connection, catalog query, test, server boot or application runtime was used.
- No migration, production operation, customer-data access or code change was performed.
- `main` was not modified.
- No implementation is authorized until Cycle 01 audit completion and independent plan verification.

## 6. Next session handoff

Continue the full operational table ownership/FK matrix, central table-to-RLS map and backup/restore/frontend/API operational audit. Reconcile GAP-0046 through GAP-0049 with earlier findings, then complete Cycle 01 and prepare the improvement plan for independent verification before implementation.
