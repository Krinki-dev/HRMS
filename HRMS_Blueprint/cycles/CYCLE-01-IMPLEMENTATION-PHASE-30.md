# Cycle 01 Implementation Phase 30 — PostgreSQL ownership inventory and tenant-scoped OTP

**Date:** 2026-11-28 (Asia/Kolkata)  
**Tasks:** HRMS-D-004 (primary), HRMS-D-003 (related identity correction)  
**Finding:** GAP-0067 — OTP records share an unscoped identifier in shared public storage  
**Branch:** `architecture/postgres-tenant-isolation`

## 1. Recovery and audit

Resumed from Phase 29's explicit next task: HRMS-D-004 operational ownership/query matrix. The Phase 29 exact-head CI state remains unverified and is not promoted to passed.

Reviewed current source:
- Operational Prisma schema: `backend/prisma/schema.prisma`
- Central Prisma schema: `backend/prisma/central.prisma`
- Central RLS context helper and policy migration/bootstrap
- Auth OTP request context, OTP service, tenant middleware and identity resolution
- Main Central access paths in auth, tenant routing, setup middleware, platform registration/admin, billing/payment/subscription, brand/documents, backup, settings and KYC.

## 2. New finding — GAP-0067 (P1)

The operational `otp_store` model had only a raw email identifier and purpose, with no tenant/company key. Free/Trial tenants share the operational public schema. OTP send stored the raw email and OTP verify selected the latest record by raw email + purpose. Requests for the same email/purpose in different tenant contexts could therefore overwrite or interfere with each other's OTP lookup.

## 3. Implementation

Files changed:
- `backend/shared/utils/otpIdentity.js` — deterministic namespace `tenant:<CentralTenantUUID>:email:<normalizedEmail>`; missing tenant/email fails closed.
- `backend/modules/auth/auth.service.js` — OTP creation and verification both use the helper; verification now requires tenantId.
- `backend/modules/auth/auth.routes.js` — passes the already resolved tenant UUID into OTP verification.
- `backend/test/otp-tenant-isolation.test.js` — six focused unit/source regression tests.

The change is source-only. No schema migration is needed for this correction because the existing identifier column can store the namespaced key. Existing unscoped outstanding OTPs will not match the new key and therefore cannot be used by the new verification path.

## 4. Ownership inventory

Created `cycles/CYCLE-01-POSTGRES-OWNERSHIP-INVENTORY-PHASE-30.md`.

Static schema count:
- 82 operational models.
- 33 models with direct `company_id`.
- 29 models with `employee_id` requiring ownership resolution through employees.
- 13 user/parent-owned child models.
- 7 root/auth/reference/unresolved models needing explicit classification.
- 17 Central models: 10 tenant-context policy tables and 7 platform/global-control tables.

This is a schema ownership map, not a claim that every query path has passed. The matrix records nullable company ownership, missing structural keys, reference data and unknown logs for further review.

## 5. Central RLS audit observations

- `withTenantRLS` and `withPlatformAdminRLS` set transaction-local context and execute protected work inside the same Prisma transaction.
- Central migration and fresh-install bootstrap both show explicit RLS enablement/policies for all 17 current Central models; the existing static parity test checks coverage.
- The `tenants` table is platform-admin-only. Authenticated Free/Trial self-service plan activation uses platform-admin context but derives tenant UUID from signed identity and filters by that ID. This privileged code path is retained as an explicit review item; no RLS policy was changed.
- Script/seed/migration tools remain operator-only paths and must not be run against production without separate authorization.
- No live Central catalog, grants, role-owner, superuser or BYPASSRLS check was performed. A disposable CI `hrms_app` test does not prove deployed role state.

## 6. Plan verification and tests

- Phase 30 source-only plan: `CYCLE-01-PLAN-PHASE-30.md`.
- Independent scope/safety verification: `CYCLE-01-PLAN-VERIFICATION-PHASE-30.md`.
- Added six regression tests for normalization, cross-tenant namespace separation, missing context, shared helper use, route tenant binding and request-tenant mismatch.
- **Execution status:** tests are committed but have not been run in this session. Backend CI and exact-head combined status are not available through the connected GitHub workflow interface; blank status/run lists are not passes.
- Authenticated OTP browser E2E remains unrun.

## 7. Commits

### Source
- OTP identity helper: `e884c37ad792c9f7c6c96797f5ba26761d83251e`
- Auth service: `9c73d007630c3447c7b7b7cb56ecad421233ba50`
- Auth route: `5d51ff1ff06c4616f64974f57d5c88565b9b0c5a`
- OTP tests: `9e0432b1520622a5661874b492076f7186ec16c5`

### Plan, audit and tracking
- Phase 30 plan: `e21d232c889e807272172834687aefc7e0760ec6`
- Plan verification: `bf3ea52f758624d4515f5c10498861511d5a4d4e`
- Ownership inventory: `a6a834ef480a1b69f8f47a2a48a2ae04dd07d99f`
- Corrected model counts: `b64ea2db7687a7671400ae7be6702fcfb55ec251`
- Inventory user-owned note: `2a9c552c4d76fb17a09875ee43a47a7642ea9af5`
- GAP-0067: `996cca21c05959cd0c7e8ee00a5f3e11f312163f`
- D-003 plan OTP acceptance: `44a37a7b0a033a3a8dc43159388d1c36cd43fdd9`

## 8. Full re-analysis and carry-forward

1. HRMS-D-003 remains In Progress pending exact-head CI, OTP/login/refresh/password-reset authenticated E2E and legacy membership backfill review.
2. GAP-0067 is Fixed — Awaiting Verification; do not close until focused tests and exact-head CI pass.
3. HRMS-D-004 remains In Progress. The 82-model inventory is complete as a schema classification, but query-by-query controller/service/worker/report/export/WebSocket audit is not complete.
4. Composite same-company FK feasibility requires disposable-copy orphan/mismatch/duplicate analysis and a migration design. No DDL was run.
5. Central app role ownership, superuser/BYPASSRLS, grants and live catalog policies require DBA evidence in a non-production/approved environment.
6. Continue by tracing each direct-company, employee-owned and parent-owned model to all CRUD/service call sites; prioritize authentication, payroll/compliance, file access, background jobs and exports.

## 9. Safety record

- `main` untouched.
- No production/customer DB connection or SQL execution.
- No migration/DDL, deployment, real payment, deletion, credential rotation or customer-data operation.


## Phase 31 follow-up — OTP namespace extension

Phase 31 extended the Phase 30 OTP key from tenant + email to tenant + operational company + email. This prevents collisions between company accounts within the same tenant as well as across tenants. See `CYCLE-01-IMPLEMENTATION-PHASE-31.md`. The Phase 30 report's original tenant-only key is superseded by this final Phase 31 behavior.
