# Cycle 01 Implementation and Verification — Phase 25: Central RLS Policy Completion

**Date:** 2026-11-28 (Asia/Kolkata)  
**Repository:** `Krinki-dev/HRMS`  
**Branch:** `architecture/postgres-tenant-isolation`  
**Task:** HRMS-D-004 — Central database RLS policy coverage and bootstrap parity  
**Protected branch:** `main` — untouched

## 1. Executive summary

Phase 25 prepared a complete Central RLS policy set and aligned the fresh-install bootstrap with the incremental migration.

- The Central Prisma schema contains 17 models.
- A new migration enables RLS and installs explicit policies for all 17 Central tables.
- Tenant-owned rows require the matching `app.current_tenant` context or the explicit platform-admin context.
- Global platform ledgers/settings and platform review tables are restricted to the platform-admin context.
- The same policy set is included in `backend/prisma/central_schema.sql`.
- A regression test checks all 17 models, policy coverage in both migration and bootstrap, tenant-vs-platform predicates and the explicit decision not to FORCE RLS before deployed database role ownership is verified.

**The migration was not executed against Supabase or any customer database.** Source parity and CI do not prove the live Central database has these policies or that the deployed application role is subject to RLS.

## 2. Source evidence

| File | Blob SHA | Change |
|---|---|---|
| `backend/db-migrations/20261128_central_rls_policy_completion.sql` | `6c68075f954e8e623835c6b62a89a0387dad6a02` | New idempotent Central RLS policy migration |
| `backend/prisma/central_schema.sql` | `37889392aef289b087d964d4ca7d40c9c694abe5` | Fresh-install bootstrap now contains matching RLS policy set |
| `backend/shared/utils/rlsContext.js` | `ef1e1ac216d2dfce0ac204e1d3d8dc1f069cd937` | Documents tenant/platform policy context matrix |
| `backend/test/central-rls-policy-parity.test.js` | `5f219f05deee2a2f272deddd9de7718740c21d5a` | Verifies all 17 Central models and migration/bootstrap policy parity |
| `backend/db-migrations/README.md` | `079f6706e329f3482e89f7eecb1f12d4aae1657d` | Adds rollout order, app-role and legacy Settings safety gate |

## 3. Policy matrix

| Central table | Access rule |
|---|---|
| `tenants` | Platform admin only |
| `central_user_index` | Matching tenant or platform admin |
| `central_kyc_records` | Platform admin only |
| `central_gst_records` | Platform admin only |
| `platform_settings` | Platform admin only |
| `tenant_modules` | Matching tenant or platform admin |
| `tenant_pricing_configs` | Matching tenant or platform admin |
| `invoices` | Matching tenant or platform admin |
| `tenant_branch_links` | Matching tenant or platform admin |
| `payment_orders` | Matching tenant or platform admin |
| `payment_webhook_events` | Platform admin only (global event ledger) |
| `billing_events` | Matching non-null tenant or platform admin; null-tenant rows platform-only |
| `company_documents` | Matching tenant or platform admin |
| `company_document_reviews` | Platform admin only |
| `tenant_migration_jobs` | Platform admin only |
| `backup_config` | Matching tenant or platform admin |
| `tenant_db_config` | Matching tenant or platform admin; legacy configuration remains separately restricted |

All policies include both `USING` and `WITH CHECK` predicates for writes. Tenant-owned Central tables are not treated as operational HR tables; the frozen architecture still keeps RLS in Central and uses routing plus `company_id` filters for tenant operational tables.

## 4. CI evidence

**Backend Tests passed**

- Workflow: Backend Tests
- Run: [46103928291](https://github.com/Krinki-dev/HRMS/actions/runs/46103928291)
- Tested commit: `865d5f5d567f49b70967dbd82923047e7a870311`
- Result: success
- Tests discovered: 183
- Passed: 178
- Failed: 0
- Skipped: 5

This run includes the new Central RLS policy parity test. The test is static source verification; it does not connect to a live Central database.

A later branch commit was still running backend CI at the time of this report. Do not claim the latest branch HEAD is green until its exact SHA's workflows finish.

## 5. Important deployment blockers and limitations

1. **Application DB role ownership is unknown.** Ordinary table owners and roles with `BYPASSRLS` can bypass RLS. The migration deliberately does not use `FORCE ROW LEVEL SECURITY`; verify the deployed Central role is not a table owner, superuser or BYPASSRLS before release.
2. **Legacy Settings DB-config endpoints are not RLS-context safe.** `settings.controller.js` creates a direct Prisma client and queries `tenant_db_config` without `withTenantRLS` or `withPlatformAdminRLS`. Migrate or disable these endpoints before applying the new policy set.
3. **Credential handling remains separate work.** The legacy Settings endpoint still has the GAP-0044/0045 concerns; this RLS policy does not encrypt secrets or make that UI authoritative for tenant routing.
4. **Live catalog state is unknown.** No Supabase catalog query was run; actual policies, table ownership, grants, roles and schema parity have not been inspected.
5. **No migration execution occurred.** The new SQL is a reviewed code artifact only. Apply only after verified backup, catalog preflight, role review, migration-window approval and explicit owner approval.

## 6. Task status

- HRMS-D-004 Central RLS source coverage and bootstrap parity: **Implemented in source; automated static checks passed; live DB/role verification pending.**
- GAP-0047: policy coverage code prepared for the missing Central tables; not applied to live DB.
- GAP-0048: fresh-install bootstrap now includes matching policies; clean-install execution not performed.
- GAP-0030 remains superseded under the frozen architecture: operational tables intentionally rely on tenant routing and company filters, not operational RLS.

## 7. Safety boundary

- No production or customer DB connection.
- No SQL migration execution.
- No production role/grant/secret changes.
- No tenant data movement or deletion.
- No deployment or real payment.
- `main` untouched.

**Next:** complete a code-level query/ownership audit for the shared operational schema, then establish the PostgreSQL migration baseline. Before any Central RLS rollout, resolve the legacy Settings direct-client path and obtain a DBA-confirmed application role/owner/BYPASSRLS report. Continue to HRMS-D-005 only after the D-004 policy matrix is reviewed and test coverage is adequate.
