# Cycle 01 Implementation Phase 28 — operational ownership regression increment

**Date:** 2026-11-28 (Asia/Kolkata)  
**Working branch:** `architecture/postgres-tenant-isolation`  
**Code commit:** `2254f855b884deb51f7f7783d6acae17fd6523c3`  
**Previous code head:** `d989ad3f02b2819ae6e3271654fab5656fe848c0`  
**Plan:** `CYCLE-01-PLAN.md` — Round 2 verified; Round 3 traceability addendum  
**Task:** `HRMS-A-010` (permission and object-ownership hardening), contributing evidence to `HRMS-D-004` (shared-schema isolation and Central RLS verification)

## 1. Recovery and baseline

The Phase 26 handoff instructed continuation of the operational ownership review and source-level RBAC/IDOR remediation. Phase 27 recorded Central RLS source parity and disabled the legacy Settings direct-client endpoints. The master handoff, implementation progress, module tracker and gap register had not yet been advanced past Phase 26/earlier entries, so this report and the accompanying documentation synchronization restore a single current record.

The working branch was verified before changes. It was 1,089 commits ahead of `main`, 0 behind, with common base `cd400a602eb255029c1daeeae1d35f0c7b7ee948`. The latest pre-change code head was `d989ad3f02b2819ae6e3271654fab5656fe848c0`.

## 2. Audit findings and source corrections

| Area | Source finding | Correction |
|---|---|---|
| Attendance | Holiday deletion accepted an ID and updated by ID alone, despite receiving `companyId`. | Read the holiday by `id + company_id + deleted_at IS NULL`; refuse non-owned/missing records; controller returns 404. |
| Employees | Bank-account update/delete and document deletion checked child ID + employee ID but did not independently prove that the employee belonged to the authenticated company. | Validate the parent employee using `id + company_id + deleted_at IS NULL` before querying or mutating child data; child lookups also exclude deleted records. |
| Payroll | Controller omitted `req.db` for payslip get/update and bonus delete, so arguments did not match service signatures. Payslip and bonus operations also lacked complete run/employee ownership binding. | Pass the tenant DB; scope payslips to a company-owned run and company-owned employee; require bonus ID to belong to the requested run and validate its employee before create/delete. |
| Training | Training detail loaded employee names by employee IDs only and could expose a foreign-company employee if a corrupt child relation existed. | Filter employees by company and active state; omit nomination/attendance children whose employee is not owned by that company. |

### Files changed

- `backend/modules/attendance/attendance.service.js`
- `backend/modules/attendance/attendance.controller.js`
- `backend/modules/employees/employees.service.js`
- `backend/modules/payroll/payroll.controller.js`
- `backend/modules/payroll/payroll.service.js`
- `backend/modules/training/training.service.js`
- Added `backend/test/ownership-regression.test.js`

## 3. Plan verification

The work maps to the existing verified `HRMS-A-010` acceptance criteria: route/service ownership checks and negative cross-company tests. It does not introduce a new architecture, schema migration or task ID. The implementation was limited to source-level checks and tests; no customer data, production DB, production migration, deployment, real payment or destructive action was involved.

The D-004 plan remains open: this increment does not claim that the complete operational ownership matrix, composite same-company foreign keys, live Central catalog or deployed app-role ownership/BYPASSRLS checks are complete.

## 4. Tests and CI evidence

### Exact code commit

- Backend Tests: [run 46105770148](https://github.com/Krinki-dev/HRMS/actions/runs/46105770148) — **success** on `2254f855b884deb51f7f7783d6acae17fd6523c3`; 258 tests, 258 passed, 0 failed, 0 skipped.
- Tenant Migration PostgreSQL Integration: [run 46105770068](https://github.com/Krinki-dev/HRMS/actions/runs/46105770068) — **success** on the same SHA; 1 test, 1 passed, 0 failed, 0 skipped.
- The backend workflow successfully created disposable PostgreSQL databases, generated Prisma clients, pushed Central and tenant test schemas, applied Central RLS policies, seeded fixtures and ran the backend suite.

### Frontend build

- Frontend Build: [run 46104588048](https://github.com/Krinki-dev/HRMS/actions/runs/46104588048) — success on `cb3ebff3cc1fabd0c189ece8df09a01efcf82bd5`.
- A compare from that SHA to the Phase 28 code commit showed no frontend source files changed. This is valid unchanged-frontend evidence, but it is not an exact-head frontend build.
- Build warning remains: the main JavaScript chunk is above 500 kB after minification. It is not a build failure; code splitting/performance work remains.

## 5. Central query-context audit — current evidence and limits

Reviewed high-risk source paths include:

- `backend/shared/utils/rlsContext.js`: `set_config(..., true)` and the protected query execute inside the same Prisma transaction.
- `backend/shared/utils/centralDb.js`: KYC operations require an explicit tenant ID, use `withTenantRLS`, and include tenant predicates in SQL.
- Auth services/routes and auth/setup middleware: reviewed Central access uses `withPlatformAdminRLS` around the separate Central client.
- Platform admin routes use a transaction-scoped platform-admin wrapper; billing, brand, payment, subscription and platform services use the same helper in reviewed call paths.
- The Settings legacy DB-config endpoints were disabled with HTTP 410 in Phase 27.
- Tenant deletion service receives a Central transaction client from the current platform-admin route. Permanent deletion fails closed before database connection or deletion until independent restore verification and approval controls exist.

**Not yet proven:** exhaustive call-site coverage across every worker, scheduled job, report/export, WebSocket and admin path; the deployed Central app role is not owner/superuser/BYPASSRLS; live Central catalog/policy state; composite same-company FK coverage; and production DB configuration. CI's disposable `hrms_app` non-owner RLS tests are not a substitute for the production DBA/catalog report.

## 6. Full re-analysis — residual findings

1. `HRMS-A-010` remains **In Progress**. Phase 28 fixes the identified attendance holiday, employee child, payroll payslip/bonus and training detail paths. The wider permission/ownership audit still covers leave, attendance approvals, recruitment, performance, training, assets, expenses, payroll and employee children.
2. `HRMS-D-004` remains **In Progress**. Operational ownership matrix, same-company FK feasibility/data checks, and deployed Central role/catalog verification remain open.
3. `HRMS-D-003` has a residual source issue: the public forgot-password fallback in `backend/modules/auth/auth.routes.js` uses an unordered `LIMIT 1` on `central_user_index` (and a fallback tenant lookup) when no request tenant context is present. Login/workspace selection was hardened in Phase 24, but password reset can still select an arbitrary workspace for an email belonging to multiple tenants. Extend GAP-0065 and require explicit tenant selection or a safe ambiguous-membership response before marking D-003 complete.
4. Frozen decisions had a stale broad statement that login/tenant resolution still used unordered `LIMIT 1`. This is narrowed in the updated decision note: the residual is specifically the forgot-password fallback; login selection/refresh binding have Phase 24 source fixes, with real E2E still pending.

## 7. Next exact safe task

**HRMS-D-003 residual:** audit and correct forgot-password workspace resolution, add multi-membership negative tests, and verify that no password-reset flow selects an arbitrary tenant. Then resume the remaining HRMS-D-004 operational query ownership matrix. No owner decision or production access is required for this source-only work.

## 8. Safety record

- `main` was not modified.
- No merge, deployment, production migration, live customer DB connection, real payment, tenant deletion, or customer-data mutation was performed.
- No production approval is requested for the next source-only task.
