# Syntern HRMS — P0/P1 Execution Roadmap and P2 AI-Agent Handoff

**Repository:** `Krinki-dev/HRMS`  
**Working branch:** `architecture/postgres-tenant-isolation`  
**Protected branch:** `main` — never modify it.  
**Reference date:** 2026-11-26 (Asia/Kolkata)  
**Authority order:** current working-branch code and migrations → `HRMS_Blueprint/33_MASTER_CODEBASE_ARCHITECTURE_AUDIT.md` → `HRMS_Blueprint/34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md` → `HRMS_Blueprint/00_CHAT_HANDOFF_CONTINUATION.md` → this document. If documents conflict, inspect code and record the resolution; do not silently choose.

## A. Mandatory instructions to the next AI coding agent

You are continuing an existing production-oriented HRMS codebase. Do not rebuild, re-scaffold, redesign the architecture, or repeat completed research. Read the four authority documents above and inspect the current branch head before changing anything. Treat GitHub history as evidence, not proof that a feature works. Work only on `architecture/postgres-tenant-isolation`; never commit to or merge into `main`. Preserve user work. Do not force-push. Do not make production deployments, production database changes, destructive data operations, credential changes, or live payment transactions without explicit owner approval.

The owner is not a professional coder. Keep status updates concise and plain-language, but engineering artifacts must be technically precise. Do not ask “what next?” when a safe next task is already documented. Do not claim background work continues after a response ends. Make actual commits, tests and documentation updates. Never ask the owner to paste secrets. The owner may be away from the development machine: do not request local database setup or migration execution until the owner explicitly says they are available and ready.

Every coding unit must be end-to-end: frontend/UI if applicable, backend/API, authorization/middleware, database/Prisma/SQL migration, tests, route/API contract, and docs. Do not mark a module complete because a screen or endpoint merely exists. Use small, reviewable commits. Update this roadmap, implementation progress, master audit and chat handoff after every meaningful session. Report exact branch, SHA, files changed, test commands/results, CI run for that exact SHA, and what remains unverified.

## B. Product and architecture decisions — settled; do not reopen

1. PostgreSQL only for production. Remove MySQL/MSSQL/SQLite runtime paths after auditing all dependencies and tests; do not retain a silent fallback.
2. Free and Trial SaaS tenants use the shared tenant-operational PostgreSQL `public` schema with strict tenant/company ownership isolation.
3. Each Paid SaaS tenant gets its own dedicated schema named from immutable Central tenant UUID, canonical form `tenant_<uuid-without-hyphens>` (confirm exact helper convention in code).
4. Optional Enterprise dedicated PostgreSQL database/instance is an exception requiring separate commercial/owner approval; not the default architecture.
5. Central/platform DB and tenant-operational DB are distinct logical database roles and must never be confused. Central DB holds tenant registry, platform users/index, plans, subscriptions, billing/payment ledger, onboarding and document-review metadata. Operational DB holds companies, users, employees, attendance, leave, payroll, compliance, recruitment, performance, training, assets, expenses and other HR data.
6. `centralTenantId` means Central `tenants.id`; `companyId` means operational `companies.id`. They are distinct UUIDs. Never substitute one for the other.
7. Client-hosted/offline PostgreSQL is required as an independent installation. Do not describe local-to-cloud fallback as synchronization. Hybrid sync is deferred until a real outbox, idempotency, retry, conflict-resolution and monitoring subsystem is built.
8. Keep the existing Node.js/Express + React/Vite modular monolith. Do not introduce microservices, extra databases, or a second ORM without an evidence-based need.
9. Razorpay only for launch; manual renewal only. PhonePe/JioPay and automatic recurring charges stay disabled/Coming Soon until separately approved and verified. Never use live transactions in development tests.
10. GST data should use official GST portal assisted flow. If CAPTCHA appears, show it and let the user solve it; do not automate/bypass. PAN-only onboarding is supported.
11. CSV and relational XLSX import/export are required across HRMS modules. Imports require preview, validation, confirmation, field-level permissions, tenant scoping and audit logs.
12. Private object storage and malware scanning must fail closed. Backups are not restore tests. Destructive deletion remains blocked until tenant ownership and restore verification are independently proven.
13. New user theme default is light; saved dark preference remains supported. Centralized macOS-inspired design tokens; migrate legacy CSS incrementally.

## C. Current technical stack and critical file map

- Frontend: React 18 + Vite. Inspect `frontend/src/App.jsx`, `frontend/src/pages/onboarding/`, `frontend/src/pages/admin/`, `frontend/src/services/`, `frontend/src/context/ThemeContext.jsx`, `frontend/src/styles/theme.css`.
- Backend: Node.js + Express modular monolith. Prisma 6.19.x. Inspect `backend/package.json`, module routers/controllers/services and middleware.
- Tenant Prisma schema: `backend/prisma/schema.prisma`; Central Prisma schema: `backend/prisma/central.prisma`; generated clients are distinct.
- Tenant middleware: `backend/shared/middleware/tenant.js`; auth middleware: `backend/shared/middleware/auth.js`; request tenant session note: `backend/shared/middleware/tenantSession.js`.
- Identity helpers: `backend/shared/utils/tenantIdentity.js`, `backend/shared/utils/tenantResolver.js`; RLS transaction helper: `backend/shared/utils/rlsContext.js`; storage config/resolver: `backend/shared/utils/tenantStorageConfig.js`, `backend/shared/utils/tenantStorageResolver.js`.
- Auth: `backend/modules/auth/auth.routes.js`, `backend/modules/auth/auth.service.js`.
- Platform tenant registration/provisioning: inspect `backend/modules/platform/` including `platform.service.js`, tenant routes/controllers and `backend/dbSchema.js`/schema cloning callers.
- Payment/billing: `backend/modules/platform/payment.controller.js`, `billing.service.js`, `subscription.controller.js`, plans service/routes.
- Storage lifecycle: `backend/modules/platform/tenantMigrationInventory.js`, `tenantDeletion.service.js`, `tenantDeletionGuard.js`, `backend/shared/utils/tenantBackupTarget.js`.
- SQL migrations: `backend/db-migrations/`; read its README before any migration. Central migration and tenant-operational migration are different scopes.
- Tests: `backend/test/`; GitHub Actions workflows under `.github/workflows/`.

## D. P0 — tenancy and PostgreSQL foundation (must finish before P1/P2 claims)

### P0.1 Identity contract (first task)

Current known state from the 2026-11-26 resumed audit: `tenantIdentity.js`, `tenantResolver.js`, `auth.js`, auth token signing in `auth.routes.js` and `auth.service.js`, and `tenant-identity.test.js` already contain partial separation. Auth currently emits `companyId`, `centralTenantId`, and a compatibility `tenantId` alias set to Central tenant ID. Auth middleware exposes these fields. Older operational callers still use `req.user.tenantId` as operational company ID (observed examples include audit, leave, KYC, expenses, employees, attendance and notifications; enumerate current working branch comprehensively).

Required actions:
- Search the entire working-branch tree and all JS/TS files for `req.user.tenantId`, `req.user.companyId`, `req.user.centralTenantId`, `req.tenant.id`, `tenantId:`, `companyId:`, `resolveTenantId`, `resolveCompanyId`, `resolveCentralTenantId`, token claims, user payload construction and background-job payloads.
- For each call site, classify which database/table it touches: operational company scope vs Central tenant scope vs platform-admin selected tenant vs global/system operation. Record file, function/route, expected identifier, current source and change in an audit matrix.
- Replace ambiguous identifiers at query boundaries with explicit `resolveCompanyId(req)` or `resolveCentralTenantId(req)`; use explicit typed fields in services/jobs. Do not perform blind global text replacement.
- Preserve old JWT compatibility safely: old `tenantId` claims represented operational company ID in some versions. Resolve Central tenant only from the authenticated user's active `central_user_index` record, tied to authenticated user ID. Never infer/rebind from hostname, client header, query/body or arbitrary tenant request context. If authenticated mapping is missing or ambiguous, fail closed with a clear re-login/recovery response.
- Review multiple-company membership and platform-admin selected tenant semantics. A SaaS tenant may contain multiple operational companies; do not assume one company per tenant. Validate company membership against the authenticated Central tenant before accepting a company selection.
- Ensure public API user payloads and frontend auth store distinguish `companyId` and `centralTenantId`; avoid leaking secrets. Update WebSocket tickets, queues, cron jobs, exports, notifications, audit records and cache keys.
- Add regression tests for new tokens, old tokens, missing index, conflicting claims, cross-tenant hostname/header, multiple company membership, platform-admin explicit selection, and all critical operational/Central query resolvers.

Exit criteria: no ambiguous ID is passed to a database boundary; cross-tenant tests fail closed; legacy tokens safely resolve or require re-login; platform-admin selection remains explicit; all backend tests pass.

### P0.2 One PostgreSQL storage resolver and request routing

- Make `tenantStorageResolver` the only source of truth for storage target selection.
- Remove duplicate connection-resolution logic from tenant middleware, auth lookup, platform admin, jobs and signup; all consumers call a shared service.
- PostgreSQL only. Remove MySQL/MSSQL/SQLite URL construction and old `local_db_type` production behavior after call-site audit. Customer-managed PostgreSQL should use an explicit secret reference/secure URL, not plaintext credentials in logs or metadata.
- Remove production development-DB fallback. Development-only fallback must be explicit, isolated and impossible to activate in production.
- Fail closed for legacy/unclassified/pending/provisioning/failed storage metadata; never silently route to public or a default database.
- Use immutable Central tenant UUID for paid schema names; safely quote identifiers and parameterize values.
- Ensure Prisma client cache key accounts for canonical database target + schema + connection role and has bounded lifecycle/disconnect behavior; avoid leaking secrets in logs.
- Test tenant host, custom domain, explicit tenant header, root host auth, preview/dev host and background job contexts.

### P0.3 Shared public schema isolation and RLS

- Inventory every tenant-owned table and every unique index/FK/foreign key. Determine whether ownership is by Central tenant, operational company, employee, or parent record.
- Add missing ownership columns/constraints only via reviewed additive PostgreSQL migrations with safe backfill evidence. Do not guess ownership from email, phone, Aadhaar, subdomain or row ordering.
- Enforce explicit company/tenant filters in service queries plus RLS where appropriate. RLS is defense in depth, not a substitute for authorization.
- Use transaction-scoped RLS via `withTenantRLS`/approved context helper on the same transaction as the protected query. Bare `SET LOCAL` in middleware is not effective across later requests/transactions.
- Verify DB role privileges and whether Supabase service role/table owner bypasses RLS. Use least-privilege runtime role where feasible.
- Test tenant A cannot read/write/update/delete tenant B across CRUD, nested relations, raw SQL, exports, imports, reports, background jobs, websocket and files. Include concurrent requests to detect context leakage.

### P0.4 Canonical PostgreSQL migrations and provisioning

- Existing tenant Prisma migration history is legacy MSSQL/SQL Server syntax (`migration_lock.toml provider=mssql`, path contains spaces). Never run `prisma migrate dev`, `migrate reset`, blind `db push` or old migrations against PostgreSQL.
- Inspect live/representative operational schema and Prisma models; build reviewed PostgreSQL baseline and ordered additive migrations. Validate fresh empty DB install and upgrade from representative existing tenant schema.
- Replace `cloneSchema`/CREATE TABLE LIKE cloning as canonical provisioning. Correctly provision tables, indexes, sequences, FKs, triggers, functions, views, extensions, RLS policies, grants, seed/reference data and migration metadata.
- Keep Central/platform migration separate. The consolidated Central migration `20261125_central_platform_schema_upgrade.sql` was reported applied to the correct Central DB with 12/12 checks true; verify docs/current status, do not reapply blindly. Tenant operational migrations remain unapplied. The `20261124_tenant_storage_inventory.sql` file is read-only diagnostic SQL, not a migration.
- No further owner SQL execution during source audit. Wait for explicit readiness and a verified backup/restore checkpoint before tenant DB migration.

### P0.5 Free/Trial signup, paid provisioning and promotion

- Signup creates Central tenant + operational company/admin records with an idempotent provisioning state machine.
- Free and Trial must route to shared public schema, with explicit tenant/company IDs and strict ownership.
- Paid new tenants receive a UUID-derived dedicated schema provisioned from canonical migrations; only activate after successful schema migration, seeding, ownership and health checks.
- Paid upgrade from public to dedicated schema requires durable job, tenant-scoped lock, verified payment, maintenance/read-only final copy, dependency-order copy, row/relationship/financial reconciliation, atomic routing cutover, rollback window and retry-safe recovery. Keep source rows until explicit audited cleanup.
- Do not perform long migration inside payment HTTP request. Payment verification and storage migration are separate durable state transitions. Duplicate webhooks/retries must be idempotent.
- Legacy tenants require explicit inventory/classification; do not auto-classify or rename/drop schemas.

### P0.6 Storage-aware backup/restore and offline packaging

- Current backup target intentionally blocks individual backup of shared public schema. Do not remove this guard. Implement tenant-filtered relational export/restore or a secure platform-wide backup/recovery model.
- Dedicated schema backup must verify target ownership, artifact integrity and actual restore into isolated scratch DB/schema. Restore drill must compare tenant counts, key relationships and critical HR/payroll totals.
- Permanent deletion remains disabled until verified restore + ownership + retention + approval gates exist.
- Define supported self-hosted install: PostgreSQL version, OS/runtime prerequisites, environment/secrets, migration upgrade, backup/restore, offline licensing behavior, updates and online-only integrations. No cloud sync promise.

P0 exit: identity split, single resolver, public-schema isolation, canonical PostgreSQL migrations, safe signup/provisioning/promotion, restore strategy and offline baseline all pass documented acceptance tests. Do not start P2 before these are done.

## E. P1 — platform, onboarding and billing completion

1. Plans/pricing: inspect `plans.service.js`, routes, Prisma models, admin PricingManager, public plan selector and checkout calculator together. Validate catalog save → public display → employee/add-on/billing calculation → Razorpay order → payment verification → invoice snapshot. Employee cap/overage pricing is an unresolved owner choice in `34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md`; do not choose silently.
2. Free vs Trial: reconcile signup, trial activation, expiration and plan entitlement behavior. Owner recommendation is explicit Start Free vs Start Trial; treat as open business decision unless owner has since confirmed. No fake trial success.
3. Payment: Razorpay server-side order/payment/signature verification; bind tenant, plan, invoice, amount, currency, purpose; webhook idempotency, replay protection, reconciliation, atomic invoice/subscription activation; manual renewal only. Use sandbox/mock transport only in tests; no live transaction.
4. Onboarding: persist each step's actual underlying record before marking complete. Keep secrets out of generic progress JSON. Company profile, GST/PAN, admin, documents, verification, plan and setup states must have clear transitions and recovery.
5. Documents: private MinIO-compatible storage, MIME/magic-byte validation, size limits, SHA-256, ClamAV fail-closed scanning, short-lived signed download URLs, tenant-scoped metadata, admin review history and retention. Do not claim staging until infrastructure verified.
6. Platform Admin: audit Dashboard, Clients, Plans Analytics, Pricing & Plans, Domains, Analytics, Marketing, Document Review, Settings. Verify actual API contracts, permissions, loading/error/empty states and destructive-action confirmation.
7. Marketing: verify hero, feature panels, testimonials and bottom CTA are actually persisted and rendered; static panels must not falsely appear editable.
8. Theme: migrate admin/shared screens in coherent batches using central tokens; light default, saved dark retained; visual/browser verification.
9. Billing recovery: suspended tenants may reach only authorized invoice recovery endpoints; ensure all HR operational APIs remain blocked until verified paid status and storage ready.

P1 exit: platform admin and onboarding flows pass API/UI contract tests; plans/checkout/invoice math is consistent; Razorpay sandbox flow and webhook idempotency tests pass; document pipeline passes isolated infrastructure tests; no fake success; no critical permission gaps.

## F. P2 — HRMS module execution order (start only after P0/P1 gate)

Use this default dependency order, adjusting only with documented reasons:
1. Core organization/company/branch/department/designation/roles/permissions and employee master data.
2. Employee lifecycle: profile, documents, onboarding/offboarding, employment history, reporting structure.
3. Attendance: shifts, rosters, holidays, punches, corrections, overtime and attendance rules.
4. Leave: policies, balances/accruals, requests, approval chains, holiday calendar, carry-forward and encashment.
5. Payroll: salary structures, components, monthly processing, arrears, deductions, payslips, statutory calculations and reconciliation. Requires verified attendance/leave dependencies.
6. Statutory compliance: India-specific PF/ESI/PT/TDS/LWF/GST touchpoints as applicable, effective dates, challans/returns, audit trail; calculations require qualified validation.
7. Recruitment: requisitions, jobs, candidates, pipeline, interviews, offers and conversion to employee.
8. Performance: goals, reviews, cycles, competencies and approvals.
9. Training: courses, enrollment, completion, certificates and skills.
10. Assets: asset registry, assignment, maintenance, return and depreciation if supported.
11. Expenses: claims, policy, receipts, approvals, reimbursements and accounting export.
12. Reports/analytics: permission-aware reports, exports, scheduled delivery and tenant-scoped aggregates.
13. Automation/notifications/communication: durable jobs, retries, templates, delivery logs, preferences and tenant-safe realtime.

For every module: map current source first; do not duplicate existing implementation. Document module ERD/data ownership, API routes/payload schemas, RBAC/field permissions, validation, frontend states, CSV/XLSX import/export, audit events, tests and migration. Verify tenant isolation and company context on every query. Keep module-specific acceptance criteria and status in a module matrix.

## G. Definition of done / verification gates

- Backend: dependency install, generate both Prisma clients, lint if configured, full `npm test`, focused tests, PostgreSQL integration tests against disposable DB.
- Frontend: install, production build, route smoke tests, API contract tests and browser E2E where configured.
- DB: fresh PostgreSQL install, upgrade path, constraints/indexes/RLS/permissions and rollback/restore tests.
- CI: verify GitHub Actions run attached to the exact final commit SHA; older green runs do not verify new commits.
- Security: cross-tenant read/write tests, auth legacy-token tests, platform-admin boundary, no secrets in logs, no client-trusted payment success.
- Operational: backups and restore drill, queue retries, migration locks, idempotency, observability and recovery docs.
- Report unverified items explicitly: production DB, customer data, deployment, real payment, storage infrastructure and browser E2E.

## H. Progress reporting and documentation update protocol

After each meaningful session update:
- `HRMS_Blueprint/00_CHAT_HANDOFF_CONTINUATION.md` — current branch/head, decisions, exact next action, blockers and safety status.
- `HRMS_Blueprint/28_IMPLEMENTATION_PROGRESS.md` — completed/partial/pending items and exact test evidence.
- `HRMS_Blueprint/33_MASTER_CODEBASE_ARCHITECTURE_AUDIT.md` — source truth, architecture risks, migration impact and release gates.
- `HRMS_Blueprint/34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md` — only when a business decision is resolved/changed; never rewrite settled decisions without owner consent.
- This roadmap — phase checkboxes, dependencies, acceptance evidence and next model handoff.
- Add/update a module matrix and release checklist when P2 starts.

Every progress entry must distinguish: implemented in source, unit-tested, PostgreSQL integration-tested, CI-tested on exact SHA, staging-tested, production-verified. These are not interchangeable.

## I. Time estimates (planning, not guarantees)

At the resumed audit point, estimate P0 8–15 focused working days (12–20 substantial coding sessions); P1 10–18 days (15–25 sessions); final integration/handover 2–4 days (3–5 sessions). Total roughly 20–37 working days and 30–50 sessions for one capable AI coding agent, excluding owner waiting time, environment provisioning, production approvals and unknown legacy data remediation. Re-estimate after P0 identity caller inventory and migration baseline review. Parallel work can shorten elapsed time only where files and dependencies do not conflict.

## J. Exact instruction for the next model when owner says “start P2”

First inspect latest branch head and confirm P0/P1 exit criteria from code, docs, CI and tests. Do not accept a checkbox as proof. If any P0/P1 blocker remains, report it and ask whether to finish it; do not build P2 on an unsafe foundation. If all gates pass, begin with the first incomplete module in Section F, usually core organization and employee master data. Work one module end-to-end, with backend/frontend/database/middleware/permissions/import-export/tests/docs together. Do not start multiple unrelated modules in parallel if they share schema or API contracts. Commit to the working branch and update all progress documents after each module.


## 2026-11-26 P0 implementation increment — explicit Central tenant resolution

- Working branch remained `architecture/postgres-tenant-isolation`; code head after this increment: `1e32d1b2376c83a8a523af77ced2462711142a5e`. Re-fetch before the next change.
- Changed `backend/shared/utils/tenantResolver.js`: ordinary users now resolve Central tenant only from authenticated `req.user.centralTenantId`. The resolver no longer falls back to request-host `req.tenant.id` or ambiguous `req.user.tenantId`. Platform admins may use only the explicitly resolved selected tenant in `req.tenant.id`.
- Changed both KYC route implementations, `backend/modules/automation/automation.routes.js` and `backend/modules/automation/kyc/kyc.routes.js`, to call `resolveCentralTenantId(req)` for Central KYC lookups/writes rather than `req.user.centralTenantId || req.user.tenantId`.
- Changed `backend/modules/platform/payment.controller.js` to use the shared Central tenant resolver for ordinary users; only platform admins may resolve an alternate tenant via selected tenant context or admin-only subdomain selector. Removed the ordinary-user fallback to ambiguous `tenantId` and arbitrary `req.tenant.id`.
- Added identity regression tests asserting ordinary users cannot derive Central tenant identity from request-host context and platform admins require an explicit selected tenant.
- Source inventory spot-check: operational controllers in assets, attendance, audit, compliance, employees, expenses, leave, notifications, payroll, performance, recruitment, reports, roles, settings and training use `req.user.companyId` or `resolveCompanyId(req)` in the inspected routes/controllers. Subscription routes use `resolveCentralTenantId(req)`. KYC was an identified remaining ambiguous fallback and has now been corrected in both route implementations.
- This was a targeted source scan, not yet a mathematically exhaustive audit of every JS/TS call site, background job, WebSocket, frontend store, raw SQL query or dynamic service call. Continue the full repository-wide inventory before declaring identity P0 complete.
- CI evidence: Backend Tests run #667 succeeded for commit `b3fa08e04bc59ddb5b90433429702994ab26d891` (before the subsequent billing resolver change). Tenant Migration PostgreSQL Integration run #16 was in progress for exact head `1e32d1b2376c83a8a523af77ced2462711142a5e` at the time of this entry. No local full-suite run was performed in this environment; do not claim the latest code has passed tests until exact-head CI completes.
- No database migration, production data operation, deployment or live payment was performed.
- Next: inspect exact-head CI; run/re-run backend suite on exact head if not triggered; finish full identity call-site inventory (including jobs, WebSockets, exports, frontend auth state and Central DB access); then proceed to the single-resolver/live-routing audit.


## 2026-11-26 P0 follow-up — CI evidence and signup routing inspection

- Latest source-code commit in this increment: `1e32d1b2376c83a8a523af77ced2462711142a5e`. Backend Tests workflow run #668 completed successfully for this exact source commit: https://github.com/Krinki-dev/HRMS/actions/runs/45721817132.
- Tenant Migration PostgreSQL Integration run #16 for the same code commit was still in progress at the time of the check; no result is claimed.
- Documentation-only follow-up commits advanced the branch head to `4cd83eff7f8f215fa0c4aa01971ebb154953c1bb`. Rechecked compare against protected main: branch is 698 commits ahead and 0 behind; main remains untouched. These are Git history counts, not completion metrics.
- Inspected `backend/modules/platform/platform.service.js` registration path. Managed-cloud registrations currently build a storage descriptor using a hard-coded Trial plan; the Central tenant row is inserted with Free and then updated to Trial with a 90-day expiry for managed cloud (14 days for customer-managed modes). This is an unresolved product behavior already called out in owner decisions; do not change without owner confirmation.
- For managed-cloud Trial, the storage descriptor points to shared `public`; customer-managed `local`/`external_cloud` use dedicated database mode. Registration checks for existing `public.companies`, `public.roles`, and `public.users` before insertion, then seeds a new operational company/role/admin. It sets `schemaProvisioned = true` after that connectivity/schema check; this is not equivalent to a durable provisioning state machine or a full migration/seed verification workflow.
- Remaining P0 signup blockers: hard-coded Free→Trial behavior needs owner decision; provisioning is synchronous and lacks durable retry/compensation; schema initialization depends on preinstalled tables; paid upgrade promotion and public→UUID-schema data migration are not implemented; company/tenant membership and duplicate retry behavior need further review.
- Next engineering task: continue P0 storage lifecycle audit across signup, request routing, auth lookup, platform admin and background jobs; then design the durable idempotent provisioning state machine without altering production data. Do not mark a tenant ready merely because the database connection succeeds.


## 2026-11-26 verification update — P0 identity code increment

- Exact code commit `1e32d1b2376c83a8a523af77ced2462711142a5e` passed Backend Tests workflow #668: `success` (https://github.com/Krinki-dev/HRMS/actions/runs/45721817132).
- The same exact code commit passed Tenant Migration PostgreSQL Integration workflow #16: `success` (https://github.com/Krinki-dev/HRMS/actions/runs/45721817039).
- Both workflows ran against the source commit containing the Central tenant resolver hardening, KYC route changes, billing tenant resolver change and identity regression tests. Subsequent commits through `64837385466a550995c3e0af1ddc93623023aa1a` changed documentation only; no executable source changed after the tested code commit in this increment.
- The latest branch head at this documentation update is `64837385466a550995c3e0af1ddc93623023aa1a`. Recheck before future edits.
- These CI results verify the configured automated backend suite and disposable PostgreSQL integration workflow only. They do not prove production DB migration state, real customer data isolation, staging deployment, real Razorpay, MinIO/ClamAV production readiness, backup restore for live tenants, or browser E2E.
- Identity hardening increment is source-implemented and CI-verified; the overall P0 identity audit remains open pending exhaustive caller inventory and end-to-end multi-company/company membership tests.


## 2026-11-26 launch-focused P0 increment — tenant routing and identity defects

- Found and fixed a live request-path defect: `tenantMiddleware` invoked `extractTenantSubdomain(req)` but the function was not defined/imported. Added a guarded resolver for explicit tenant headers, `*.syntern.in` and `*.localhost`; platform roots, preview hosts and arbitrary custom domains are not misclassified. Custom domains remain matched through Central tenant records.
- Added `backend/test/tenant-domain-routing.test.js` covering managed subdomains, local development, validated headers and non-tenant hosts. The first test run exposed that `isPreviewHost` existed but was not exported; exported the shared helper. Backend Tests passed for the subsequent fix commit `abca0e628f9c34cef5d4245e7b8c5b5a4299e695` (run #45725656437). The PostgreSQL integration run for that commit was still running when recorded.
- Removed the remaining ambiguous `req.user.centralTenantId || req.user.tenantId` fallback from the employee Aadhaar/KYC endpoint. It now requires explicit `centralTenantId` and returns 401 when unavailable.
- Found a legacy KYC queue path that omitted `centralTenantId` even though the worker requires it. Added the explicit Central tenant ID to its queued payload.
- Latest source commit at this entry: `6c9e54c3636097de2d0c0267be0dba2307f34d2c`. Backend and PostgreSQL integration CI for this exact commit were still in progress; do not mark the full increment CI-verified until both complete.
- Identity call-site spot-check across audit, leave, assets, payroll, expenses, automation, employees, compliance, attendance, notifications and performance found operational scoping uses `req.user.companyId`; the one remaining ambiguous Central-tenant fallback in `employees.extended.controller.js` was corrected. This is still not a complete scan of every worker, raw SQL, WebSocket or frontend call site.
- No production DB migration, deployment, live payment or destructive operation was performed. Continue launch-focused P0 work: finish identity/storage routing verification, then close the highest-risk signup/provisioning retry path. Defer non-blocking polish and advanced features.


## 2026-11-26 additional identity cleanup — auth profile and setup guard

- A further search for optional-chaining variants found two additional ambiguous Central-tenant fallbacks: `auth.routes.js /me` and `requireSetupComplete.js`. Both now use only the explicit selected `req.tenant.id` or authenticated `req.user.centralTenantId`; the legacy `req.user.tenantId` alias is no longer used as a Central identity fallback in these paths.
- The routing/KYC code increment through `6c9e54c3636097de2d0c0267be0dba2307f34d2c` passed Backend Tests and Tenant Migration PostgreSQL Integration CI (both success). The two latest auth/setup-guard changes are later source commits and must be rechecked on their own exact CI head before marking this cleanup verified.
- Continue to distinguish the backend suite from production readiness: no live database migration, tenant-data isolation exercise against real customer data, deployment, backup restore drill or browser E2E has been performed.


## 2026-11-26 exact-head CI verification — identity and routing fixes

- Exact source commit `923a0f2dfa7cb8d134161fe05c500c2855c4e5ff` passed Backend Tests: https://github.com/Krinki-dev/HRMS/actions/runs/45725846263 (success).
- The same exact source commit passed Tenant Migration PostgreSQL Integration: https://github.com/Krinki-dev/HRMS/actions/runs/45725846261 (success).
- This exact source commit includes the missing tenant-subdomain resolver and its tests, preview-host utility export, explicit Central tenant identity in the legacy KYC queue payload, and removal of ambiguous `req.user.tenantId` fallbacks from Aadhaar/KYC, `/auth/me` and the setup-completion guard.
- Subsequent commits through `7818d26de74a670947241aa22e30d2f0d8f90450` are documentation-only. The latest branch head must still be rechecked before any future write.
- Scope of verification remains limited to configured automated backend tests and the disposable PostgreSQL integration workflow. Production DB state, live tenant isolation, browser E2E, deployment, backup restore and live integrations remain unverified.
