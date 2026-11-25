# HRMS — Master Codebase & Architecture Audit

> Review date: 2026-11-25 (Asia/Kolkata)
> Repository: Krinki-dev/HRMS
> Reviewed branch: architecture/postgres-tenant-isolation
> Protected branch: main (untouched)
> Status: Architecture baseline established; P0 implementation and full module audit remain open.
> Authority: This document is the current source-of-truth map. User decisions are tracked separately in 34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md.

## 1. Executive assessment

The HRMS product is a substantial modular monolith with HR, payroll, compliance, SaaS administration, billing, automation and onboarding code. It is not yet one internally consistent production architecture. The biggest risk is that different parts of the application still assume different meanings for tenant, company, schema, database mode and entitlement.

The user-confirmed target is clear:
- PostgreSQL only.
- Free and Trial customers share the tenant operational database's public schema.
- Each Paid customer has an individually isolated PostgreSQL schema derived from the immutable Central tenant UUID.
- Optional Enterprise dedicated PostgreSQL database/instance is not the default; it requires explicit commercial approval.
- Client-hosted/offline PostgreSQL remains a product requirement.
- No fake hybrid cloud fallback. Hybrid synchronization remains deferred until a real synchronization system exists.
- CSV and relational XLSX import/export are both first-class requirements for every HRMS module.
- The separate Central platform database and Tenant operational database must never be confused.

The current source does not implement that target end-to-end yet. Storage policy helpers and tests have been aligned, but live signup, routing, promotion, authentication and backups still have incomplete or conflicting paths. Do not declare production readiness or migrate tenant operational databases until the P0 items below are resolved.

## 2. Repository and history scope

### Verified repository facts

- Working branch: architecture/postgres-tenant-isolation.
- Live branch head during this review: cce0117970b6d816e4a7880b4bad11edb21e05e2.
- Common base with main: cd400a602eb255029c1daeeae1d35f0c7b7ee948.
- Branch compare: 378 commits ahead, 0 behind main.
- Complete reachable commit list enumerated: 477 commits.
- Date distribution: 378 commits dated 2026-11-23 through 2026-11-25; 99 older commits dated 2026-06-16 through 2026-08-21.
- GitHub compare returned 106 changed paths for the 378-commit branch-specific range.

### How commit history was assessed

Commit titles are chronology/index metadata only, never proof that a change was implemented. High-risk historical patches were inspected at source-diff level, including the August 2026 RLS/encryption/WebSocket work, Payroll integration coverage, the real Compliance data-leak fix, the older deletion/backup implementation and deployment migration changes. The common-base source and current branch source were also compared for the main architectural paths.

Important limitation: this is a source-verified architecture baseline, not a claim that every one of the 99 older commits has already received an independent line-by-line semantic review. Some historical work is superseded by later commits; the continuing audit must follow the resulting current code and callers, not replay commit titles as requirements. The remaining module-by-module and older-history review is listed in Section 13.

## 3. Product and runtime structure

### Current technical shape

- Frontend: React 18 + Vite.
- Backend: Node.js + Express modular monolith.
- ORM: Prisma 6.19.x.
- Central/platform Prisma schema: backend/prisma/central.prisma.
- Tenant operational Prisma schema: backend/prisma/schema.prisma.
- Central client: shared/generated central client / centralPrisma.
- Tenant client: @prisma/client.
- Database target: PostgreSQL.
- Queue/schedulers: BullMQ/Redis and node-cron.
- Private file storage direction: MinIO-compatible private storage with signed access.
- Security foundations include JWT access tokens, httpOnly refresh cookie, CSRF controls, RBAC, field-sensitive permissions, authenticated encryption and audit events.

The architecture remains a modular monolith. Avoid splitting services or introducing extra databases/ORMs until tenancy, data ownership, schema lifecycle and recovery are made consistent.

### Database roles — canonical separation

1. Central/platform database: tenant registry, platform users/index, plans, modules, payment ledger, invoices, onboarding and company-document review workflow.
2. Tenant operational database: companies, users, employees, attendance, leave, payroll, compliance, recruitment, performance, training, assets, expenses and operational records.
3. The Central tenant UUID and operational companies.id UUID are different identifiers. They must be represented as different fields in application context and tokens.

Never pass a Central tenant ID to an operational companies.company_id predicate, or an operational company ID to a Central tenants.id lookup.

## 4. User-confirmed tenancy decision — authoritative

| Customer / deployment | Operational storage | Canonical routing |
|---|---|---|
| Free | Shared PostgreSQL public schema | public |
| Trial | Shared PostgreSQL public schema | public |
| Paid | One isolated PostgreSQL schema per SaaS tenant | tenant_<immutable Central tenant UUID> |
| Optional Enterprise | Dedicated PostgreSQL database/instance | Explicitly approved exception |
| Client-hosted/offline | PostgreSQL on the customer's supported host | Local PostgreSQL connection; no assumed cloud sync |

Additional rules:
- Schema identity is derived from the immutable Central tenant UUID, not a mutable subdomain, company name or email.
- All paid schemas must have the same canonical migration version before a tenant is marked ready.
- A SaaS tenant may contain one or more operational companies. A tenant schema is not automatically the same thing as one operational company.
- Existing tenant_* schemas are presumed to be customer storage candidates until reconciled against Central tenant records and routing code. Do not delete by naming convention or estimated row count.
- Supabase-managed auth, realtime, storage and vault schemas are never part of HRMS cleanup.
- No Free/Trial tenant may be routed to a dedicated schema simply because the schema exists or the old resolver selects it.

## 5. Source-verified implementation status

### 5.1 Storage allocation and live routing

Status: Partially implemented; not integrated into live provisioning/routing.

Verified:
- tenantStorageConfig.js now describes Free/Trial as public and Paid as UUID-derived dedicated schema.
- tenantStorageResolver.js validates the storage lifecycle and refuses unclassified/not-ready tenants.
- Tests cover public allocation, paid UUID schema ownership and deletion guard behavior.

Still unresolved:
- tenant.js still contains legacy MySQL/MSSQL/SQLite URL branches, hybrid local-to-cloud fallback and development database fallback paths.
- platform.service.js contains a second connection resolver with legacy engine/hybrid branches.
- Signup still derives tenant_<subdomain> and calls cloneSchema regardless of plan; Free/Trial is not yet guaranteed to use public.
- Registration does not set storage_tier/storage_status to a ready classified state.
- tenantStorageResolver.js is not wired into tenant.js.
- The resolver explicitly refuses local PostgreSQL URL construction.
- Existing legacy tenants require classification before request routing can change.

### 5.2 Schema provisioning and migrations

Status: Blocked.

Verified:
- dbSchema.js cloneSchema uses CREATE TABLE ... LIKE ... INCLUDING ALL and separately copies sequences.
- This is not a full canonical schema deployment. It does not reliably recreate all foreign keys, triggers, functions, views, policies, extensions, grants and migration history.
- backend/prisma/migrations     11223/migration_lock.toml declares provider = mssql.
- Its initial migration is 1,328 lines of SQL Server syntax including BEGIN TRY, [dbo], NVARCHAR, BIT, DATETIME2 and SQL Server constraints.
- backend/package.json exposes migrate as prisma migrate dev. It must not be run against PostgreSQL with the current SQL Server migration history.
- Tenant operational inventory found no _prisma_migrations table in the inspected database.

Required direction:
- Build a reviewed PostgreSQL baseline and ordered additive migrations from the Prisma tenant schema.
- Keep Central and Tenant migration streams distinct.
- Provision schemas by applying canonical migrations, not copying a live public schema.
- Add migration version, advisory lock, idempotency, validation and recoverable status.
- Never run migrate reset, the SQL Server initial migration or blind db push against a customer database.

### 5.3 Identity and authentication context

Status: P0 mapping inconsistency to fix and test.

Verified source relationship:
- platform.service.js creates Central tenants.id as tenantId.
- During operational seed it creates a separate companyId and saves that into tenant operational companies.id / users.company_id.
- central_user_index.company_id relates to Central tenants.id.
- auth.service.js signs the access token with tenantId: user.company_id.
- auth middleware reads decoded.tenantId into req.user.tenantId.
- Platform/payment code also uses req.user.tenantId as though it were Central tenants.id.
- HRMS service code uses req.user.tenantId as though it were operational companyId.

This is an overloaded identifier, not a safe contract. Its effect varies by route and must be tested end-to-end. The corrected contract should carry distinct values:
- tenantId: Central SaaS tenant UUID, sourced from the resolved Central tenant context.
- companyId: selected operational companies.id UUID.
- userId and employeeId: operational identity values.
- enabledModules and platform-admin status: server-derived, not client-trusted.

A user's allowed company membership must be verified when selecting or switching companies. Do not silently copy one UUID into both fields.

### 5.4 Shared public schema isolation

Status: P0; not proven safe for multi-tenant production.

Verified:
- Frozen RLS documentation and rlsContext.js correctly explain that SET LOCAL must be applied in the same transaction as the protected query.
- That RLS implementation currently applies to Central platform tables.
- Tenant business tables in schema.prisma do not have a complete tenant/business RLS policy set.
- Existing tenant business isolation relies primarily on application company_id predicates.
- Payroll and Compliance have real PostgreSQL integration tests covering company_id scoping.
- Historical Compliance bug was real: missing company_id on payroll_runs lookup exposed another company's statutory data. The current regression test guards that case.

Required direction:
- Before Free/Trial customers share public, add a complete inventory of tenant-owned tables and relationships.
- Enforce shared-schema row isolation with PostgreSQL RLS as defense in depth, using a least-privilege application DB role that is not a table owner or BYPASSRLS role. FORCE ROW LEVEL SECURITY where applicable; PostgreSQL superusers still bypass RLS.
- Use a transaction-scoped request context that includes the validated tenant/company identity.
- Keep explicit company_id filters in every service query even after RLS exists.
- Child tables without company_id must be protected through a correctly enforced parent relationship or have a safe denormalized scope key.
- Test cross-tenant and cross-company SELECT, INSERT, UPDATE and DELETE attempts for every entity family.
- Verify Supabase runtime role privileges; policies alone do not prove enforcement when the app connects as postgres/table owner.

### 5.5 Subscription, payment and invoices

Status: Strong Razorpay verification foundation; storage activation incomplete; webhook completion still open.

Verified:
- Launch checkout is Razorpay-only and manual renewal only.
- Server calculates price and persists an order snapshot in payment_orders.
- Verification checks HMAC signature and fetches Razorpay order/payment from the provider.
- Order, payment, amount, currency, tenant metadata, purpose and captured state are compared.
- Duplicate processing is guarded by a conditional ledger claim.
- Subscription plan/module/pricing activation and paid invoice creation happen in a Central transaction.
- Client-side mock payment activation was removed; verifyPayment rejects mock paths.
- PhonePe/JioPay checkout/callbacks and automated payout callbacks are disabled until their official verification contracts are implemented.

Remaining:
- Subscription activation does not provision/verify the paid dedicated schema or set the tenant storage lifecycle state before granting paid entitlements.
- Payment webhook event persistence/idempotency and reconciliation remain release gates; code includes webhook ledger structures but source-to-route-to-ledger behavior must be completed and tested end-to-end.
- Price calculation counts active employees without company_id. That is unsafe once public is shared and can include other customers' employees.
- createSubscriptionOrder/verifySubscription consume req.user.tenantId as a Central tenant key even though the token currently stores operational companies.id. Fix identity mapping before relying on this path.
- No real payment or provider sandbox has been run in this audit.

Recommended activation model:
1. Verify payment and store the captured ledger event.
2. Create a durable, idempotent provisioning/promotion job.
3. Provision the paid UUID schema with canonical PostgreSQL migrations.
4. Copy only the authenticated tenant's operational records from public.
5. Validate counts, constraints, references, totals and representative business invariants.
6. Switch routing and paid entitlement only after verification, with a rollback/compensation path.
7. Keep the source data available during a defined reconciliation window.

Do not keep an external payment call and a long data copy inside a single SQL transaction. Use a durable state machine and idempotent steps.

### 5.6 Backup, restore and deletion

Status: Safe fail-closed direction, but incomplete for production recovery.

Verified:
- Backup code uses PostgreSQL pg_dump with safe child-process spawning and streamed gzip output.
- It checks the gzip artifact and deletes failed temporary files.
- Backup target validation is limited to correctly owned, ready dedicated schemas.
- pg_dump receives the selected schema.
- Shared public, legacy-unclassified storage and dedicated database targets are refused.
- Permanent tenant deletion is explicitly fail-closed until a verified restore drill and approval workflow exist.
- Old baseline deletion code could drop/recreate public when schema_name was absent; current guards remove that dangerous path.

Remaining:
- Free/Trial shared-schema per-tenant backup and restore are not implemented by the current target guard.
- A gzip-valid dump is not proof of a restorable backup.
- No verified restore drill was found for the live customer topology.
- Code after the unconditional fail-closed deletion throw is unreachable and should be removed/refactored only when the safe deletion workflow is designed.
- Do not delete schemas or clean tenant operational data until Central records, backups and restore targets are reconciled.

### 5.7 Authorization and module entitlements

Status: First enforcement layer is present; full route/service audit remains open.

Verified:
- checkModuleEnabled now checks server-derived tenant enabledModules and is mounted at router level for Employees, Attendance, Leave, Payroll, Compliance, Recruitment, Performance, Training, Assets, Expenses and Reports.
- Standard checkPermission still grants built-in admin roles a broad bypass.
- Sensitive employee data uses the stricter checkSensitivePermission without tenant Admin/HR Admin bypass.
- Employees routes apply explicit sensitive gates to unmask/bank-account reads and sensitive import fields.

Remaining:
- Module catalog names must match tenant_modules values exactly.
- Per-user authorization and self-service ownership must be audited across every route/controller/service.
- Some self-service routes omit checkPermission intentionally; their controllers/services must enforce authenticated employee ownership and company scope.
- The expense receipt upload route has no explicit checkPermission at route level; verify whether service middleware and upload-size/type/security checks are complete.
- Attendance/leave/payroll self-service endpoints require integration tests for cross-employee and cross-company ID tampering.
- A module-wide gate does not replace action-level RBAC or object ownership.

### 5.8 Employees CSV/XLSX exchange

Status: Contract and validation foundation implemented; full workbook pipeline not implemented.

Verified:
- User requirement: every HRMS module must have both standard CSV and relational XLSX import/export.
- Employee workbook schema includes Employees, ContactDetails, Addresses, Family, Education and PreviousEmployment.
- Reusable validation primitives cover required/type/enum/date/range checks, duplicate keys, child-to-parent references, explicit create-only/update-only/upsert modes and formula/non-primitive rejection.
- Sensitive fields are excluded from standard exports and guarded in import paths.

Not yet implemented:
- Chosen and security-reviewed XLSX parser dependency plus lockfile.
- Formatted template generation from the same schema.
- Defensive server-side XLSX/CSV parse.
- Server-side preview/validation token and row/sheet error report.
- Explicit confirmation, revalidation and transactional/bounded parent-child writes.
- Error workbook, ID mapping, audit summary and round-trip tests.
- Module-specific workbook schemas and UI integration across all modules.

Do not call the employee workbook contract a completed Excel import/export feature.

### 5.9 Document storage and GST automation

- Company document workflow includes private MinIO metadata, ClamAV scanning, signed download and Central review records. Current infrastructure and migration are not proven deployed.
- GST module was consolidated in older code. Source still needs a regulatory/operational review; never treat CAPTCHA handling as automation bypass. The current accepted rule is human CAPTCHA completion and official portal use.
- The old blueprint says multiple gateways are integrated; the current launch policy is Razorpay-only. Treat disabled provider routes as disabled, not live integrations.

## 6. Database status and verified operational facts

- Central migration: backend/db-migrations/20261125_central_platform_schema_upgrade.sql was applied to the correct Central HRMS database.
- User-provided verification result: 12/12 expected checks true, including payment ledger, webhook event, company document/review, billing event tables and storage lifecycle columns.
- Tenant operational inventory: read-only PostgreSQL diagnostic succeeded against PostgreSQL 17.6.
- Observed tenant schemas included public, tenant_app, tenant_hrms, tenant_pcepl, tenant_rahultradeco and tenant_syntern. Supabase-managed auth/realtime/storage/vault schemas also exist.
- No tenant operational migration or tenant schema cleanup has been executed.
- Estimated row counts are estimates only; they are not deletion authorization.
- The earlier handoff statement that no migrations had been applied is now superseded: Central upgrade is applied; tenant operational migration remains unapplied.

## 7. Conflicts in older blueprint material

The June 2026 foundation documents are historical snapshots, not current truth. Known contradictions include:
- MySQL/MSSQL/SQLite listed as supported database choices versus the user's final PostgreSQL-only decision.
- hybrid listed as a DB mode versus the later decision to defer actual synchronization.
- every new tenant described as its own database/schema versus Free/Trial public and Paid schema-per-tenant.
- PhonePe/JioPay listed as enabled versus current Razorpay-only launch gate.
- "all plans unlimited employees" conflicts with pricing notes that cap at 25 and charge per-employee overage.
- "never hard delete" conflicts with permanent account erasure; define the legal retention/erasure exception.
- generic 7-year retention claims need record-class/legal verification, not blanket assumptions.
- 00_INDEX.md points to 08_STATUS_AND_CHANGELOG.md, which was not found in the repository at review time.
- Several June module status percentages and "Live" labels are not backed by current E2E/production evidence.

Use this master audit plus 34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md, then the updated handoff and frozen-decision override. Do not use an old June status table as a release sign-off.

## 8. Decisions already settled — do not ask again

1. PostgreSQL only.
2. Central database separate from tenant operational database.
3. Free and Trial share tenant operational public schema.
4. Each Paid customer gets a UUID-derived PostgreSQL schema.
5. Optional Enterprise dedicated PostgreSQL database is an approved possible exception, not the default.
6. Client-hosted/offline PostgreSQL remains a requirement.
7. No pretend hybrid sync or primary-database-wins sync rule; real sync is deferred.
8. main stays untouched; all work remains on architecture/postgres-tenant-isolation.
9. Do not run further SQL for this stage; continue source-code work first.
10. User's CSV + relational XLSX requirement for every HRMS module is frozen.
11. Do not delete existing schemas or customer operational data until tenant classification, backup and restore safety are demonstrated.

## 9. Recommended canonical application structure

Keep the existing modular monolith, but centralize cross-cutting ownership and lifecycle contracts:

- shared/tenant-context: resolves Central tenant UUID, selected operational company UUID, user and employee identity.
- shared/storage: the single PostgreSQL URL resolver and storage descriptor validator.
- shared/provisioning: durable tenant registration, schema creation, migration, validation, promotion and compensation jobs.
- shared/database-context: transaction-scoped RLS context and Prisma clients for Central and operational DBs.
- modules/platform/billing: plan catalogue, pricing snapshot, payment ledger, verified provider callback, invoices, entitlement events.
- shared/import-export: schema metadata, CSV/XLSX parser, validator, preview, confirm, export and audit.
- shared/backup: storage-aware backup/restore by tenant and data scope, with immutable artifacts and restore verification.
- modules/*: each module owns routes/controllers/services/repositories and is required to pass tenant/company scope, action authorization and object-ownership checks.

This is a logical responsibility map, not a request to create unnecessary packages or rewrite the monolith wholesale.

## 10. Priority implementation sequence

### P0 — Architecture correctness and security

1. Introduce explicit tenantId + companyId context and test login, refresh, lookup, payment, middleware and company switching.
2. Correct subscription employee counts and all plan/price queries to use an authorized company/tenant scope.
3. Complete tenant-owned table inventory and public-schema RLS design; use a least-privilege runtime DB role.
4. Replace live tenant URL/schema resolution with one validated PostgreSQL-only resolver; remove MySQL/MSSQL/SQLite/hybrid and unsafe production dev fallbacks.
5. Change registration so Free/Trial routes to public and Paid provisioning uses UUID-derived schema.
6. Create durable provisioning/paid-promotion state machine; only mark ready/paid after the schema is migrated and validated.
7. Establish clean PostgreSQL tenant migration baseline; disable the unsafe Prisma migrate script until the SQL Server migration history is replaced.

### P1 — Recovery, payment and module correctness

8. Complete storage-aware backups and restore drills for shared and dedicated schemas.
9. Keep deletion fail-closed until backup/restore, retention, approval, legal hold and safe data erasure are proven.
10. Finish webhook ledger/replay/reconciliation and test subscription/renewal activation without real money.
11. Audit every route/service for module entitlement, action permissions, employee ownership, tenant/company filters and sensitive data.
12. Deliver full Employee CSV/XLSX preview/confirm and reuse for each module.
13. Complete MinIO/ClamAV deployment and secure file access verification.
14. Review legal/statutory HRMS rules and version dates with qualified domain input.

### P2 — Consolidation and product polish

15. Remove dead/duplicated resolver paths and unreachable deletion code after proving callers are unused.
16. Reconcile old architecture/status docs and remove stale claims.
17. Continue UI/theme consolidation without large unrelated rewrites.
18. Evaluate desktop/mobile only after stable API/storage/identity contracts.

## 11. Verification gates

No release is green until the exact branch head has:
- Backend tests passed.
- Frontend production build passed.
- Prisma validate and generate passed for both schemas.
- Disposable PostgreSQL migration from an empty database passed.
- Existing-schema upgrade path passed.
- Shared public RLS tests for cross-tenant and cross-company CRUD.
- Paid promotion, failed promotion, retry, rollback and routing switch tests.
- Payment signature, amount, currency, tenant, replay, webhook and invoice reconciliation tests in sandbox.
- Tenant/company ownership tests across every module.
- Employee CSV and XLSX round-trip tests.
- Backup restored to an isolated environment and record counts/integrity verified.
- Document scanning/private storage/signed URL checks passed.
- Browser E2E: signup → trial/free → payment → onboarding → employee → attendance → leave → payroll → payslip.
- Runbook for migration, backup, restore, rollback and production approval.

CI passing does not prove database migration or provider sandbox correctness. Do not state production-ready until all gates are verified.

## 12. Safety boundaries

- Do not edit main.
- Do not run or ask the user to run SQL for this source-audit stage.
- Do not access/print secrets or ask the user to paste them.
- Do not run production migration, deploy or real payment.
- Do not drop schemas, reset a database, run prisma migrate reset, or use db push as a migration substitute.
- Do not clean operational data before classifying tenants and validating restore.
- Do not treat tenant_* or low estimated row counts as permission to delete.
- Never expose private company files, employee identity, payroll or statutory data in logs/exports by default.

## 13. Remaining audit work — explicitly not yet complete

- Independently inspect the source diffs of the remaining historical commits where their result is not sufficiently explained by current source or later fixes.
- Complete file-by-file query-scope audit for Employees, Attendance, Leave, Payroll, Compliance, Recruitment, Performance, Training, Assets, Expenses, Reports, GST/KYC automation, Documents and Platform Admin.
- Verify Central RLS policies on every direct Prisma/raw SQL call site; known unwrapped auth lookups remain to audit.
- Validate every self-service endpoint against object ownership and selected company context.
- Verify backup provider configuration, restore behavior, retention, encryption and private object access.
- Complete GST/EPFO/ESIC statutory rule and browser automation compliance review.
- Check current CI on the exact latest branch head after documentation commits.

The purpose of this register is to make the architecture coherent before further feature work. It does not imply these remaining audits are already passed.

## 14. Primary source paths

- backend/shared/middleware/tenant.js
- backend/shared/middleware/auth.js
- backend/shared/middleware/permission.js
- backend/shared/utils/rlsContext.js
- backend/shared/utils/tenantStorageConfig.js
- backend/shared/utils/tenantStorageResolver.js
- backend/shared/utils/dbSchema.js
- backend/shared/utils/tenantBackupTarget.js
- backend/shared/utils/backupService.js
- backend/modules/auth/auth.routes.js
- backend/modules/auth/auth.service.js
- backend/modules/platform/platform.service.js
- backend/modules/platform/payment.controller.js
- backend/modules/platform/subscription.controller.js
- backend/modules/platform/billing.service.js
- backend/modules/platform/tenantDeletion.service.js
- backend/modules/platform/tenantDeletionGuard.js
- backend/modules/compliance/compliance.service.js
- backend/modules/employees/employee-workbook.schema.js
- backend/shared/import-export/workbookSchema.js
- backend/prisma/central.prisma
- backend/prisma/schema.prisma
- backend/prisma/migrations     11223/migration_lock.toml
- backend/test/
- backend/db-migrations/

---

This document is an architecture audit and execution baseline. The source tree and the latest verified branch head remain authoritative when a future code change supersedes a written status.


## 15. Additional historical + current-source findings — 2026-11-25

This section adds findings from direct old-commit patch inspection and follow-through into current callers. It is not based on commit titles alone.

### 15.1 Actual old baseline shape

At common base cd400a602eb255029c1daeeae1d35f0c7b7ee948, the repository contained 336 tracked files and 19 backend module families: assets, attendance, audit, auth, automation, compliance, dashboard, employees, expenses, leave, notifications, payroll, performance, platform, recruitment, reports, roles, settings and training. The current tree contains 388 tracked files; tree comparison shows 52 additions and no paths deleted relative to that common base. This indicates the recent branch changes are largely additive; old implementation files and competing paths were not comprehensively removed.

The frontend also contains two route/layout generations:
- On tenant domains, App.jsx mounts HRAppLayout and the legacy HR page set.
- The richer module route set (employee import/edit/profile, attendance shifts/corrections, leave workflows, payroll setup/reports, recruitment sub-pages, assets, expenses and training) is gated under IS_PLATFORM_ROOT in the current App.jsx.
- frontend/src/router/clientRoutes.jsx defines another older limited route tree and is not imported by App.jsx in the checked source. GitHub search found only its own definition.
This split may be intentional for the platform-root deployment, but the actual tenant-host experience must be confirmed with route-level E2E tests before considering modules complete. Do not delete either layout without proving every route and user role has a replacement.

### 15.2 P0 security regression — access token persisted in localStorage

Current source:
- frontend/src/store/authStore.js persists accessToken in Zustand persist state, and explicitly writes it to localStorage.
- frontend/src/services/api.js reads localStorage.accessToken for every Authorization header, writes refreshed tokens back to localStorage, and removes them on refresh failure.
- The refresh token is also held in an httpOnly cookie, which is the intended half of the contract.

This contradicts the frozen security rule that tokens must not be stored in localStorage. A script running under the origin can read the access token. Required correction: keep the access token only in memory, refresh silently through the httpOnly cookie, do not persist it in Zustand/localStorage/sessionStorage, and add tests for reload/refresh/logout and concurrent 401 handling. Re-audit CSRF and cookie scope while doing this. Until fixed, the storage policy must not be described as fully compliant.

### 15.3 P0/P1 — central login lookup can select an ambiguous tenant

Current Central schema defines a composite uniqueness rule for central_user_index on (email, company_id), not a global unique email. Current auth.service.js lookupEmail() and resolveTenantDb(email) query central_user_index by email alone with LIMIT 1. Therefore the database allows the same email to be indexed under multiple tenants, while authentication lookup may select an arbitrary first row. The same global-resolution pattern exists in phone/employee-ID lookup paths.

Required correction:
- Resolve by explicit tenant/domain context where available.
- Where a user is genuinely a member of multiple tenants, return a tenant-choice result rather than choosing LIMIT 1.
- Enforce membership before resolving the operational database.
- Do not expose a user's email, company details or tenant membership to unauthenticated callers unnecessarily.
- Add tests for the same email in two tenants, the same phone in two tenants and the same employee ID in two companies.

### 15.4 Lookup enumeration and Central RLS call-site audit

Current auth routes return tenant subdomain, company name, logo and plan from unauthenticated email/phone/employee-ID lookup endpoints; employee-ID lookup also returns email. These routes have IP rate limiting (20 lookups/minute), but rate limiting alone does not eliminate account or tenant enumeration. Review data minimization, uniform responses and OTP proof before returning tenant-specific details.

Current shared/middleware/auth.js queries central_user_index directly with raw Central Prisma SQL to discover is_platform_admin and catches errors non-fatally. The query is not wrapped with withPlatformAdminRLS. A Central database error therefore falls back to is_platform_admin=false; more importantly, the Central RLS call-site audit is incomplete. Route all protected Central reads through the transaction-scoped RLS helper or a deliberately documented least-privilege access path, and test the production DB role.

### 15.5 Stale development checkout path remains in current frontend

frontend/src/pages/platform/BillingConfigTab.jsx still contains an orderData.mock branch that posts fabricated order/payment/signature values to /platform/subscribe/verify and then shows a dev-mode activation toast. Current server-side verification rejects mock payment paths, so this should not activate a real subscription, but it is stale and misleading code. Remove the branch after confirming no controlled automated test depends on it. Never restore server-side mock activation.

### 15.6 Historical secrets and local artifacts in Git history

Direct historical patch review found:
- An older tracked backend/.env snapshot containing database-URL-shaped credential values. The user previously reported this file used dummy values, so this audit does not assume they were live.
- An older tracked frontend/certs/server.key file, later removed from the repository tip.
- These files are absent from the current source tree and the current .gitignore excludes .env and private-key/certificate patterns. However, deleting a file from a later commit does not erase earlier public Git history.

Do not reproduce historical values in documentation or logs. Verify offline whether any historical value/key was ever valid. If so, rotate the associated database credential/certificate private key and review provider access logs. History rewriting is optional only after rotation and team coordination; it does not replace rotation.

### 15.7 Other source-level history conclusions

- July billing UI introduced a mock subscription verification path and automatic-renewal messaging; current Razorpay/manual-renewal policy and server rejection supersede it. One admin BillingConfigTab mock branch still remains as documented above.
- Historical 2026-07-10 payment handlers included PhonePe/JioPay invoice-paid behavior; current source disables those provider callback paths. Do not treat old gateway code or docs as launch-ready integrations.
- Historical HR UI and frontend source were gradually changed through separate HR and modular page trees. The current App.jsx still mounts both generations depending on hostname, which is why frontend E2E coverage must be host-specific.
- Historical one-off migrate_user_index.js scans Central tenant records and reads per-tenant connection properties to build an index. Treat as an operator-only migration utility; do not run automatically or against production without code review, explicit tenant allowlist, secret-handling review and dry-run.
- Prisma's generated Central client has been committed in Git history and is also regenerated by backend postinstall. Treat prisma/central.prisma and prisma/schema.prisma as source-of-truth; regenerate clients rather than hand-editing generated artifacts.
- Historical deployment code made one canonical migration failure non-fatal to server startup. A deployment must not be considered ready merely because the web process starts; migration/schema compatibility must be a hard readiness gate.

### 15.8 Review scope boundary

The baseline file tree and major security/data paths have now been inspected, and additional old commit patches were checked directly. The 99 historical baseline commits have not all been independently reviewed line by line. Remaining work is limited to the commit patches and module/service call paths whose behavior is not established by the present source or later tests; that work remains open in Section 13. This document must not be read as a claim that every legacy feature has passed a functional or legal compliance audit.

## 16. Encryption and schema-migration script safety — additional P0/P1 findings

### 16.1 Existing shared encryption helper has a static development fallback

- backend/shared/utils/encryption.js uses process.env.ENCRYPTION_KEY with a static fallback and derives its AES-GCM/CBC compatibility key via scrypt.
- The current server startServer() requires ENCRYPTION_KEY to exist before listening and checks a minimum of 16 characters in production. Therefore the static fallback should not be used in a normal server boot where the guard executes, but it can still be used by development/test scripts or any process that imports the utility without calling startServer().
- backend/shared/utils/piiEncryption.js has a separate requirement: exactly 32 decoded bytes (64-char hex or 44-char base64).
- There are now two inconsistent key contracts and two separate ciphertext formats.

Recommendation:
- Remove the static fallback and fail closed whenever encryption/decryption is invoked without a valid configured key.
- Define one explicit key format/length, key version, rotation procedure and backward-compatible re-encryption plan.
- Ensure every background worker, script and CLI process validates the key before accessing encrypted fields.
- Add boot and unit tests for missing/invalid keys, wrong key, legacy CBC decrypt and authenticated GCM tamper rejection.

### 16.2 P0 data migration incompatibility — do not run migrate-pii-encryption.js

Direct source inspection found:
- backend/scripts/migrate-pii-encryption.js imports encryptPII() from backend/shared/utils/piiEncryption.js. It rewrites employees.aadhaar_number, pan_number and bank_account_number with ENC:<base64> strings.
- The live Employee services currently import backend/shared/utils/encryption.js and call its decrypt(), which accepts only two-part legacy CBC or three-part GCM colon-separated values. It does not recognize the ENC: prefix.
- Repository search found no live production service using decryptPII(); the only other encryptPII() reference is its own module and the migration script.

Therefore running the existing script can make the app's normal employee read/decrypt path unable to read those migrated fields. This is a data integrity risk, not a cosmetic mismatch.

**Do not execute backend/scripts/migrate-pii-encryption.js.** Replace it only after choosing one canonical encryption codec, implementing dual-read/compatible conversion, preserving old ciphertext/plaintext until validation, adding a dry-run and backup/restore path, and proving round-trip tests against the actual Employee services.

### 16.3 Canonical schema migration may fail while server still starts

- backend/scripts/apply_canonical_schema_migration.js executes Central SQL migration statements and catches failures.
- On failure, it logs the error and continues; historical commit 98ae97b explicitly changed this behavior to non-fatal deployment startup.
- Railway startup chains this migration before node server.js, but a successful process start is therefore not proof that the canonical schema upgrade succeeded.

Recommendation:
- Migrations must be an explicit deployment/release step with durable success state.
- Production readiness must fail when required schema version is missing.
- Keep server liveness separate from schema readiness, but never advertise a tenant/feature as ready when its required migration is incomplete.
- Do not silently swallow migration errors for schema required by current application code.

### 16.4 Operator migration scripts — never automatic

- migrate_user_index.js scans active Central tenants and reads connection fields to enumerate operational users. Treat it as a one-off operator utility requiring allowlist, dry run, scoped access, audit and secret-handling review.
- migrate-pii-encryption.js loops all active tenants and rewrites employee fields; it is currently format-incompatible with the live Employee codec and must remain blocked.
- The tenant operational migration directory is SQL Server-based. The existing generic npm run migrate script is unsafe for the current PostgreSQL target until replaced by a reviewed PostgreSQL migration baseline.


## 2026-11-25 — Frontend access-token storage hardening

- Fixed the P0 frontend finding recorded in Master Audit §15.2: access tokens are now held only in the in-memory Zustand state. The persisted `hrms-auth` payload excludes `accessToken`; persistence version 2 migrates older persisted state with a null token, and hydration removes the legacy standalone `localStorage.accessToken` key.
- Added the missing `updateToken` store action. API requests now read the token from in-memory Zustand state; successful refresh updates in-memory state and the Axios default header, while refresh failure clears the default header and logs out. Duplicate refresh-store update was removed.
- Commits: `b97f0e3`, `4d469bf`, `03eacbd`, `9d4ccac`.
- Exact latest code commit `9d4ccac81a2bdf6b385a1f604f57afcd5a3a1ef8`: Frontend Build **success** (run 45642181274); Backend Tests **success** (run 45642180225). The earlier intermediate commits also had green CI, but use the exact latest commit result above.
- Scope boundary: this is a source change plus CI build/test verification, not browser E2E or live session/refresh-cookie verification. Confirm login, reload, parallel 401 refresh, logout and tenant-domain routing in browser E2E before release.
- Next P0: implement the identity contract in a staged compatibility migration. First enumerate and migrate every operational caller from `req.user.tenantId` to `req.user.companyId`, and Central-platform callers to an explicit Central tenant claim. Do not flip the meaning of `tenantId` until all callers and tests are migrated; old access tokens must expire or be rejected/rotated safely. Then continue fail-closed storage resolver and public-schema isolation.
- Branch comparison after these commits: 401 ahead, 0 behind `main`; `main` remains untouched.


## 2026-11-25 — Tenant identity separation implementation

- Added an explicit identity normalizer for the two distinct identifiers: `companyId` is the tenant-database `companies.id` used by HR operational modules; `centralTenantId` / canonical `tenantId` is the Central DB `tenants.id` used by SaaS, billing, setup and tenant resolution.
- New access tokens now carry `companyId`, `centralTenantId`, and canonical `tenantId` separately. Login, OTP login, refresh and OTT token issuance were updated to pass the resolved Central tenant id; refresh resolves it from the authenticated central-user index when the request starts at the platform root.
- Auth middleware maps legacy tokens safely: old `tenantId` claims are treated as operational `companyId`; the Central tenant id is recovered from `central_user_index`. An unresolved legacy company id is never promoted to a Central tenant id.
- Added a fail-closed tenant-host/session mismatch check so a token cannot be rebound to another tenant by changing the request host.
- Migrated operational scoping from `req.user.tenantId` to `req.user.companyId` across audit, employees, leave, attendance, payroll, compliance, assets, expenses, performance, notifications, automation/KYC and dashboard handlers. Central platform consumers continue to use the canonical Central tenant id.
- Added six tenant-identity regression tests covering legacy token mapping, explicit new claims, host-rebinding prevention and unresolved legacy claims. The isolated identity-normalization cases were executed locally: 6 passed, 0 failed. Full backend CI and live browser/session tests remain pending; no database migration or production change was run.
- Middleware now fails closed when a tenant host cannot be matched to the authenticated Central tenant. Next gate: run the complete backend test workflow, add route-level cross-tenant tests, then audit the PostgreSQL tenant storage resolver and schema isolation before touching any live database.


## 2026-11-25 — Storage-routing cutover blockers found (do not enable yet)

- The new pure `tenantStorageResolver` is not yet wired into `shared/middleware/tenant.js`; runtime traffic still uses the older `resolveTenantDB` path. Therefore the storage lifecycle's `storage_tier/storage_status` gates are not currently enforced at runtime.
- `registerTenant` still provisions a `tenant_<subdomain>` schema for Cloud/External Cloud registrations, including the initial Trial plan, and does not persist the new storage lifecycle classification. This conflicts with the intended Free/Trial `public` policy and paid UUID-derived schema policy.
- The new resolver currently rejects `local` mode even though registration accepts customer-hosted PostgreSQL. Local PostgreSQL URL construction and its storage-tier policy must be completed before claiming self-hosted/offline support is ready.
- Do not switch new Trial tenants to shared `public` yet. First audit every operational query/model for mandatory `company_id` scoping (including child records and background jobs), settle the local-database allocation rule, apply the additive Central metadata migration only after backup/approval, classify existing tenants from an inventory, and test registration/login/refresh end to end. No production routing or database change was performed in this pass.


## 2026-11-25 — First-pass operational company-scope audit

- Reviewed the service-layer query patterns for Employees, Attendance, Leave, Payroll, Compliance, Assets, Expenses, Performance and Notifications after the controller migration. Their primary read/write paths generally scope records by `company_id` directly or through the employee relation using the supplied `companyId`.
- This is a positive first pass, not a complete shared-`public` safety sign-off. Child-table access paths, raw SQL, exports/imports, scheduled jobs, websocket/event handlers, background queues and every route still require a full cross-module audit before Trial tenants can safely share one schema.


- Legacy access tokens that cannot be mapped to a Central tenant now receive an authentication refresh response rather than being rebound to the request host; tenant-host mismatches with a resolved identity are rejected.


## 2026-11-25 — PostgreSQL routing integration and onboarding alignment

- Replaced the live tenant middleware's legacy cloud/local/hybrid routing with `resolveTenantStorageTarget`. Known tenant requests no longer fall back to a generic development database when the tenant record is missing, unclassified or not ready. Production routing no longer falls back to `DEV_TENANT_DATABASE_URL`.
- Authentication tenant DB lookup, refresh lookup, platform-admin notification configuration access and password-reset tenant DB lookup now use the same classified storage resolver.
- Customer-managed `local` and `external_cloud` modes now resolve only PostgreSQL and use a dedicated customer-owned database without a schema override. Local connection URL construction validates host, database, user and port; credentials are decrypted through the existing encryption utility.
- New registration now allocates managed-cloud Free/Trial tenants to `public`; customer-managed local/external tenants to their own dedicated database. It verifies connectivity and the presence of the required PostgreSQL `companies`, `roles` and `users` tables before writing the tenant record. New records remain `provisioning` and inactive until initial company/role/admin seeding succeeds, then become `ready` and active.
- Removed the registration path's legacy subdomain-based schema cloning and removed the old hybrid/fallback resolver behavior from the platform compatibility wrapper.
- Split `resolveCompanyId` (tenant operational DB) from `resolveCentralTenantId` (Central platform DB). Updated roles, settings, recruitment, training, reports, dashboard and platform settings routes to use the correct identifier. Platform payment header-based tenant selection is restricted to authenticated platform admins.
- Added tests for identity separation, customer-managed PostgreSQL URL construction, dedicated customer database routing and Free/Trial vs paid managed-cloud storage allocation. Tests are committed but not yet confirmed by a full CI run.
- Added read-only tenant storage classification preview SQL and documented the rollout gate. Existing tenants default to `legacy_unclassified` and must not be routed until their actual data location and row ownership are verified.
- **Remaining P0:** paid managed-cloud upgrade still needs a tested migration from shared `public` to UUID-derived schema with row/foreign-key ownership validation. Existing legacy tenants need individual inventory and migration. A fresh-database PostgreSQL installer/bootstrap package for customer-managed local/external deployments is also still pending. Do not activate this router in production until Central schema upgrade, classification, restore verification and CI pass.
- No production database migration, tenant data movement, production deployment or destructive operation was performed.


## 2026-11-25 — RLS context SQL hardening

- Replaced string-built `SET LOCAL app.current_tenant = '${tenantId}'` with parameterized `set_config('app.current_tenant', $1, true)` inside the same Prisma transaction. Platform-admin RLS context now uses the same transaction-local `set_config` pattern.
- Added unit coverage for parameter binding (including a hostile tenant-id string), missing-tenant rejection and platform-admin transaction scope. The tests are committed but CI execution is not yet confirmed.
- No RLS policy or production database was changed. Existing database-role/RLS policy verification remains a separate release gate.


## 2026-11-25 — Central KYC tenant isolation

- Added `tenant_id` ownership to the Central KYC Prisma model and a separate migration `20261125_central_kyc_tenant_isolation.sql`. The migration removes the global Aadhaar-hash uniqueness constraint in favor of tenant-scoped uniqueness and changes RLS to allow only the owning tenant or a platform admin.
- Updated KYC read/write/link functions to require Central `tenantId`, filter every lookup/update by `tenant_id`, and execute inside `withTenantRLS`. KYC routes, duplicate checks, employee onboarding checks and the background worker now propagate the authenticated Central tenant ID.
- Old KYC records remain `tenant_id = NULL` and are intentionally inaccessible to tenant users until ownership is independently verified. No Aadhaar-hash or task-ID guessing/backfill is permitted.
- Added a test that all KYC store APIs reject missing tenant identity. Full DB migration, live RLS tests and CI remain pending; no Central DB changes were executed.


## 2026-11-25 — Central registry RLS coverage

- Central tenant registry reads used by tenant-host resolution, login/OTP lookup, refresh, setup gating, platform registration, public branding/pricing lookups and platform-admin routes now execute inside `withPlatformAdminRLS` transactions. Tenant-specific KYC operations use `withTenantRLS` instead.
- This keeps Central `tenants`, `central_user_index`, branding, pricing and KYC reads/writes within an explicit transaction-local RLS context rather than depending on database-owner/service-role RLS bypass behavior.
- Full integration verification against the actual Supabase/PostgreSQL roles and RLS policies is still pending. No production DB roles, policies or data were modified.


## 2026-11-25 — Paid-plan storage safety gate

- Paid subscription order creation now refuses to create a new Razorpay order unless the tenant storage status is `ready` and the tenant has `dedicated_schema` or an eligible `dedicated_database` allocation.
- Payment verification repeats the same storage guard after confirming the gateway capture but before changing the tenant plan or entitlements. If the gateway captured payment while storage is not ready, the order remains unactivated and the response explicitly says not to pay again; the order can be retried after verified storage migration.
- Customer-managed local/external PostgreSQL databases may use dedicated-database storage; platform-managed dedicated database remains Enterprise-only. Paid managed-cloud tenants require a dedicated schema.
- This deliberately pauses paid upgrades from shared `public` until the data migration/provisioning workflow is built and verified. No payment or database action was executed.


## 2026-11-25 — Shared-tenant backup release gate

- The backup target resolver intentionally rejects shared `public` storage for tenant-specific backups. A whole-public-schema dump would include multiple tenants and must never be delivered as an individual customer's backup.
- Therefore managed-cloud Free/Trial tenant-level backup/restore is not production-ready yet. It requires a company_id-filtered relational export/restore or a separately controlled platform-wide encrypted backup with tenant-scoped restore. Do not weaken `getSafeBackupTarget` to permit a whole-public-schema tenant backup.
- This is a P0 release blocker alongside the paid shared-to-dedicated data migration and the fresh customer-managed PostgreSQL installer.
