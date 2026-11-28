# HRMS — Master Gap and Risk Register

> Governed by `35_MASTER_PROJECT_EXECUTION_AND_CONTINUITY_PLAN.md`.  
> Initial register created 2026-11-27. This is a controlled findings ledger; entries require fresh evidence before being marked current or closed.

## Status and severity
- Severity: P0 Critical, P1 Core product, P2 Product completeness, P3 Optimization.
- Status: Open, In Analysis, Planned, Plan Verification, In Progress, Fixed — Awaiting Verification, Verified Closed, Blocked, Accepted Risk, Superseded.
- A commit or code change alone does not close a finding. Closure requires the acceptance test and evidence.

## Finding template
| Field | Required content |
|---|---|
| Finding ID | Stable ID, e.g. GAP-0001 |
| Date / cycle | Discovery date and cycle number |
| Stream / module | A–F and exact module |
| Severity / status | Controlled values above |
| Finding | Clear, reproducible problem |
| Evidence | Current source path, test, schema, CI run and commit SHA |
| Impact | Customer, data, security, compliance or operational impact |
| Root cause | Confirmed cause or explicitly Unknown |
| Recommendation | Proposed fix |
| Dependencies | Task IDs, decisions, infrastructure or owner approval |
| Acceptance criteria | Objective verification conditions |
| Verification evidence | Tests, environment, CI IDs and resulting SHA |
| Disposition | Closed/blocked/deferred reason and date |

## Initial known items — revalidate during Cycle 01

These are inherited from prior source-audit notes and must be rechecked against current branch source. They are **not** a claim that every item remains unchanged at the time of the next audit.

| ID | Stream | Known area to revalidate | Initial severity | Initial status | Required audit focus |
|---|---|---|---|---|---|
| GAP-0001 | D | Central tenant UUID vs operational company UUID separation | P0 | Open — Revalidate | JWT/context contract, company switching, all consumers |
| GAP-0002 | D | Shared public-schema tenant/company isolation | P0 | Open — Revalidate | Full table inventory, RLS policies, DB role, CRUD cross-tenant tests |
| GAP-0003 | D | Canonical PostgreSQL tenant migration baseline | P0 | Open — Revalidate | Existing MSSQL migration history, clean baseline and safe provisioning |
| GAP-0004 | C/D | Free/Trial shared vs Paid UUID-schema lifecycle routing | P0 | Open — Revalidate | Signup, resolver, provisioning, auth and upgrade/promotion paths |
| GAP-0005 | C | Provisioning retry/recovery and idempotency | P1 | Open — Revalidate | Lease ownership, retry, compensation and admin recovery |
| GAP-0006 | F | Backup restore verification and shared-tenant backup | P0 | Open — Revalidate | Actual restore drill, ownership, retention and deletion gate |
| GAP-0007 | A | Core HR workflow integration/E2E | P1 | Open — Revalidate | Employee → Attendance → Leave → Payroll → Compliance |
| GAP-0008 | C | Payment webhook idempotency/reconciliation | P1 | Open — Revalidate | Razorpay event ledger, replay, amount/tenant binding and activation |
| GAP-0009 | B | Full RBAC and self-service ownership audit | P1 | Open — Revalidate | Every route/service, object-level access and sensitive fields |
| GAP-0010 | F | Complete CSV and relational XLSX pipeline | P2 | Open — Revalidate | Preview, validation, transaction, audit and roundtrip tests |
| GAP-0011 | F | MinIO/ClamAV staging validation | P1 | Open — Revalidate | Fail-closed storage/scanner integration and download authorization |
| GAP-0012 | E | Full frontend/browser E2E and responsive audit | P1 | Open — Revalidate | All routes, forms, permissions, errors, accessibility and mobile widths |
| GAP-0013 | C/F | Staging/deployment/monitoring readiness | P1 | Open — Revalidate | Env validation, health, alerts, rollback and runbooks |
| GAP-0014 | B | Module-level functionality gaps outside core HR | P1 | Open — Revalidate | Recruitment, performance, training, assets, expenses, reports, docs |
| GAP-0015 | E | Tenant-domain HR frontend uses legacy /hr API endpoints not mounted by current backend | P1 | Open | HRDashboard, HREmployees, HRAttendance, HRLeaves, HRPayroll versus server.js route mounts |
| GAP-0016 | E | Tenant HR sidebar links and active App route paths are inconsistent | P1 | Open | /leave vs /leaves and visible links without tenant route declarations |
| GAP-0017 | E | ESS nested absolute child routes do not begin with /ess | P1 | Open — Runtime Verify | App.jsx ESS route tree; reproduce with React Router v6 build/runtime test |
| GAP-0018 | A | Attendance approval endpoints lack explicit permission checks; reject mutation omits company scope | P1 | Open | attendance.routes.js, attendance.controller.js and attendance.service.js approval/rejection paths |
| GAP-0019 | F | CI has frontend build but lacks browser E2E and does not execute optional DB integration tests | P1 | Open | frontend-build.yml exists; add browser E2E and DB jobs that prove tests ran rather than skipped |
| GAP-0020 | B/F | Company WebSocket broadcast ignores companyId and sends to every connected socket | P0 | Open | notifications.service.js pushToCompany and server.js socket registration; cross-company disclosure risk |
| GAP-0021 | C/F | Subscription route registers paymentController.handleWebhook, which is not exported | P0 | Open — Boot Verify | subscription.routes.js + payment.controller.js exports; backend startup smoke test required |
| GAP-0022 | A | Leave application list returns company-wide records without leave.view permission | P1 | Open | leave.routes.js GET /, controller list and service query; employee privacy negative test |
| GAP-0023 | A | Leave balances controller omits req.db and accepts arbitrary employeeId query | P1 | Open | Controller/service signature mismatch plus self-service IDOR risk; repair contract and test |
| GAP-0024 | B | Recruitment feedback/offer mutations do not validate company ownership or interviewer assignment | P1 | Open | Interview feedback and accept/decline service methods; cross-company object-authorization tests |
| GAP-0025 | B | Performance cycle/goal/appraisal mutations omit company ownership checks | P1 | Open | closeCycle, approveGoal and finalizeAppraisal service methods; cross-company mutation tests |
| GAP-0026 | B | Training operations ignore companyId for nominations, attendance, feedback and deletion | P1 | Open | Training service methods accept but omit company scoping; cross-company tests |
| GAP-0027 | B | Asset allocation/return/by-employee operations omit employee or asset company checks | P1 | Open | Asset service methods and controller call contract; cross-company lifecycle tests |
| GAP-0028 | F | Expense receipt upload has no Multer limits/content filter and bypasses ClamAV | P1 | Open | expenses.routes.js, expenses.service.js and minio upload path; fail-closed upload tests |
| GAP-0029 | A | Payroll payslip GET/update and bonus delete controller calls omit req.db and misalign service args | P1 | Open | payroll.controller.js vs payroll.service.js signatures; API contract and ownership tests |
| GAP-0030 | D | Shared operational public schema has no demonstrated company/tenant RLS coverage | P0 | Open | Operational Prisma table inventory + SQL RLS policy scan + non-owner runtime role tests |
| GAP-0031 | F | RLS/auth/payroll/compliance PostgreSQL integration suites are not configured in standard backend CI | P1 | Open | Test README env requirements vs backend workflow; configure disposable DB roles/services and fail on required skips |
| GAP-0032 | E | Onboarding wizard calls missing progress/save/complete endpoints and mismatched payroll salary-components endpoint | P1 | Open | OnboardingWizard API calls vs platform/subscription/payroll mounted routes |
| GAP-0033 | E | Company document upload/review UI endpoints are absent despite Central metadata tables | P1 | Open | CompanyDocumentsStep/AdminDocuments/adminApi vs platform/admin mounted routes; secure file workflow absent |
| GAP-0034 | E | Notification settings frontend URL differs from mounted notification config route | P2 | Open | settingsApi/adminApi /settings/notifications vs server mount /config/notifications |
| GAP-0035 | F | PostgreSQL backup dumps are gzip-compressed but not application-layer encrypted before cloud upload | P1 | Open | backupService.js pg_dump/gzip → Google Drive/OneDrive upload; design key management and restore/decrypt tests |
| GAP-0036 | A | Employee bank/document update/delete service methods omit company ownership checks | P1 | Open | employees.service.js child-record lookups use only child ID + employee ID; cross-company tests |
| GAP-0037 | E/F | Employee photos are stored under a public static /uploads directory with no read authorization | P1 | Open — Product Visibility Verify | employees.routes.js upload path + server.js express.static; private access or explicit public-avatar consent |
| GAP-0038 | F | Relational XLSX schema/validator is not wired to actual workbook import/export; current employee pipeline is JSON bulk import + CSV | P2 | Open | No XLSX parser/writer or transactional reusable import/export route; add end-to-end roundtrip tests |
| GAP-0039 | F | Employee CSV export quotes fields but does not neutralize spreadsheet formula injection | P1 | Open | downloadExportCsv escapeCsv helper; formula-leading/control-character export tests |

| GAP-0040 | A | Attendance check-in controller passes companyId in the service's data argument position, so request geolocation/IP metadata is silently ignored | P2 | Open | Align controller/service signature and test request metadata propagation plus self-service ownership |

## Cycle 01 disposition
- Phase 1–11 source audit evidence is recorded in HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-1.md through CYCLE-01-SOURCE-AUDIT-PHASE-11.md.
- New source findings currently recorded: GAP-0015 through GAP-0040. All remain Open; GAP-0017 and GAP-0021 require runtime/boot reproduction. GAP-0020 is a source-confirmed unscoped WebSocket broadcast. GAP-0030 is a confirmed absence of operational HR-table RLS coverage in the inspected SQL migrations and test documentation.
- Existing inherited findings GAP-0001 through GAP-0014 remain open until each is revalidated and consolidated against current source.
- Full audit: In Progress. Remaining work includes finishing route → controller → service → model → tests tracing for every module, full operational table/FK and RLS matrix, runtime reproduction/boot verification of provisional findings, frontend route/browser/E2E tests, deployment and operations runbooks, and final evidence reconciliation.
- Duplicate/root-cause consolidation: Pending.
- Cycle 01 improvement plan: Not drafted.
- Independent plan verification: Pending.
- No application implementation may begin until the audit is complete and the plan passes independent verification.
- Do not close inherited findings until revalidated with current evidence.


## Cycle 01 Phase 12 exact-head revalidation — 2026-11-27

- Evidence: HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-12.md; inspected source SHA cd400a602eb255029c1daeeae1d35f0c7b7ee948.
- GAP-0020: revalidated source-confirmed P0 — WebSocket company broadcast ignores companyId and sends to every registered socket; server tickets carry userId only. Runtime Company A/B negative test pending.
- GAP-0021: revalidated source-confirmed P0 candidate — subscription router references paymentController.handleWebhook, which is not defined/exported; server directly requires this router. Isolated boot reproduction pending.
- GAP-0031: revalidated source-confirmed P1 — backend CI omits environment variables for RLS/auth/payroll/compliance PostgreSQL suites that auto-skip; migration CI runs only migration-inventory integration.
- GAP-0022, GAP-0029 and GAP-0040 were also rechecked against current route/controller/service source and remain open.
- Do not close any item based on source inspection alone where runtime/integration acceptance tests are required. Do not start implementation before full audit and independent plan verification.
- Exact-head GitHub Actions runs were not returned; two external Railway statuses were successful but are not test evidence.

## Cycle 01 Phase 13 — PostgreSQL migration baseline

- Evidence: HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-13.md.
- **GAP-0041 (P1):** operational Prisma schema targets PostgreSQL, while the documented legacy tenant migration directory has an MSSQL migration provider and SQL Server syntax. The repository migration README explicitly prohibits running that history against PostgreSQL and requires a reconciled PostgreSQL baseline. No live DB state was inspected in this phase.
- Tenant migration inventory remains intentionally inventory-only (`copyAllowed: false`); this is a safety gate, not a verified data-copy/cutover capability.
- GAP-0020 and GAP-0021 were re-fetched and remain open; runtime reproductions are still pending.
- No app code, test, DB, migration, deployment, payment or customer-data operation was performed. Do not start implementation before full audit and independent plan verification.


## Cycle 01 Phase 14 — tenant routing / customer DB security review

- Evidence: HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-14.md.
- **GAP-0042 (P1 security review):** `customerDatabaseConnectionsEnabled` is defined/exported, but the inspected tenant storage resolver does not enforce it directly before accepting `external_cloud` / `local` routing. The helper's own comment identifies customer-supplied hosts as an SSRF boundary requiring verified outbound network policy.
- Exploitability is NOT established: DB configuration write permissions, flag state, provisioning paths and deployment egress policy still require inspection. Do not describe this as a confirmed exploitable SSRF vulnerability.
- Source confirms auth tenant-context matching and transaction-scoped central RLS helper patterns; runtime tests remain unexecuted. GAP-0031 CI skip concern remains.
- Keep customer-managed DB modes disabled until application gate and outbound network controls are verified.


## Cycle 01 Phase 15 — customer database configuration paths (2026-11-28)

- Evidence: [CYCLE-01-SOURCE-AUDIT-PHASE-15.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-15.md).
- **Correction to GAP-0042:** `platform.service.js` does enforce `customerDatabaseConnectionsEnabled()` during new tenant registration before customer-supplied PostgreSQL preflight. The storage resolver itself remains policy-agnostic, so every caller still needs an explicit gate.
- **GAP-0043 (P1):** active `POST /settings/db-config/test` accepts request-supplied DB connection details and connects with Prisma without the customer DB feature-flag check or visible destination allow/deny policy. Route is protected by auth + `settings.edit`, with built-in admin-role bypass. Potential SSRF/network reachability is not runtime-proven.
- **GAP-0044 (P1):** legacy `tenant_db_config` writes cloud URLs and local DB passwords without encryption; GET removes local password but returns `cloud_db_url` unredacted to callers with `settings.view` or built-in admin role.
- **GAP-0045 (P1/P2):** legacy Settings UI/API writes `tenant_db_config`, while active tenant routing reads the canonical `tenants` storage fields. The UI also advertises SQL Server/MySQL while current Prisma and storage policy are PostgreSQL-only. Treat as conflicting/stale configuration until retired or reconciled.
- Registration lifecycle has a 30-minute lease, atomic tenant seed, failed state/lease cleanup, and token/expiry-checked activation. A separate recovery worker was not verified.
- Deployment flag value and provider-level egress controls remain unknown; `backend/.env.example` does not document the flag and `railway.json` contains no egress policy evidence.
- No runtime tests, server boot, browser, DB, network, migration, payment or deployment action was performed. No app code changed; main untouched.
- Keep customer-managed DB connections disabled until every connection path and deployment egress controls are verified. Cycle 01 plan and independent verification remain pending.


## Cycle 01 Phase 16 — PostgreSQL integrity and RLS coverage (2026-11-28)

- Evidence: [CYCLE-01-SOURCE-AUDIT-PHASE-16.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-16.md).
- **GAP-0046 (P1):** operational schema has multiple company-owned parent/child relations where FKs reference only parent id, not parent id + company_id. Examples: employees→branches/departments/designations, job_postings→job_requisitions, candidates→job_postings. Database does not enforce same-company ownership on these relations. Actual cross-company rows not inspected.
- **GAP-0047 (P1):** central RLS coverage is incomplete in reviewed migrations for tenant-specific legacy `backup_config` and `tenant_db_config`; `payment_webhook_events` and `billing_events` also lack policies in reviewed SQL and need explicit access classification. Live DB catalog not inspected.
- **GAP-0048 (P1):** `backend/prisma/central_schema.sql` bootstrap contains no RLS enable/force/policy statements. Fresh install applying only this bootstrap would not receive the separate RLS policy set.
- **GAP-0049 (P2):** static scan found 30 of 55 declared operational Prisma relations with FK columns lacking a declared index/unique index. Verify actual catalog and query plans; do not blindly add all.
- Operational Prisma schema: 82 models, 33 with direct company_id, 55 declared relations. Central schema: 17 models.
- Frozen decisions explicitly state tenant operational tables have no RLS and rely on company_id filtering; central RLS owner/superuser bypass remains a release validation requirement. Production connection role not verified.
- No database, tests, server, browser or production operation performed; no application code changed; main untouched.


## Cycle 01 Phase 17 — backup/restore, API mapping and deployment (2026-11-28)

- Evidence: [CYCLE-01-SOURCE-AUDIT-PHASE-17.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-17.md).
- **GAP-0050 (P1):** backup scheduler is not started by the inspected server bootstrap; when invoked, it compares `backup_time` although Prisma/SQL define `schedule_time`. The `schedule` frequency field is also not evaluated. Automatic backups are not demonstrated to run.
- **GAP-0051 (P1):** Railway start command runs a Central SQL migration on each deploy; the script catches migration errors and does not exit non-zero, so server startup can continue after a failed migration.
- **GAP-0052 (P1):** tenant backup only supports ready dedicated storage. It does not cover Central DB or MinIO files; `include_files` is unused; no restore implementation/drill exists. Permanent deletion correctly remains blocked pending verified restore and approval.
- **GAP-0053 (P1, revalidates GAP-0035):** PostgreSQL dump is gzip-compressed but not application-layer encrypted before Google Drive/OneDrive upload. Encryption primitive is used for provider credentials, not the dump artifact.
- **GAP-0054 (P2, revalidates GAP-0034):** frontend calls `/settings/notifications`, while inspected backend mounts notification handlers under different prefixes; no matching mounted route was found.
- Backend CI, frontend build CI, and tenant migration integration workflow definitions were inspected. Current-HEAD workflow success was not verified.
- Wider all-module API route/payload/permission mapping remains incomplete. No app code, tests, server, DB, migration, backup, restore, deployment or payment operation was performed; main untouched.


## Cycle 01 Phase 18 — frontend/backend API contract mapping (2026-11-28)

- Evidence: [CYCLE-01-SOURCE-AUDIT-PHASE-18.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-18.md).
- **GAP-0055 (P2):** frontend requests `GET /employees/:id/addresses`; backend only declares `GET /:id/addresses/:type`.
- **GAP-0056 (P1):** expense receipt frontend calls `/expenses/claims/upload-receipt` with multipart field `receipt`; backend declares `POST /expenses/upload` and accepts field `file`.
- **GAP-0057 (P1):** employee photo frontend uses POST; backend declares PUT for `/:id/photo`.
- Core route prefixes and reviewed endpoint paths for auth, attendance, leave, payroll, compliance, dashboard, recruitment, performance, training, assets, settings and reports were compared. This is static path matching only; payload/response, permissions, object ownership and browser behavior remain unverified.
- GAP-0034/GAP-0054 notification settings mismatch revalidated. No app code, tests, browser, DB or deployment action performed; main untouched.


## Cycle 01 Phase 19 — onboarding, billing and platform API contracts (2026-11-28)

- Evidence: [CYCLE-01-SOURCE-AUDIT-PHASE-19.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-19.md).
- **GAP-0058 (P1):** tenant Billing page sends `planId/period` while backend subscription order requires `planSlug/selectedAddons/billingMonths`; Billing and onboarding also double-read `response.data.data` after the global Axios interceptor has already unwrapped the response.
- **GAP-0059 (P1):** onboarding payroll step calls `POST /payroll/salary-components`, but the mounted payroll router has no such route. GAP-0032 is narrowed to this remaining gap.
- **GAP-0060 (P1):** global API interceptor unwraps `response.data.data`, while dashboard, onboarding and Billing consumers still double-unwrap. Expected impact includes undefined payloads, failed resume and checkout; runtime reproduction pending.
- **GAP-0032 correction:** onboarding progress/save-step/complete routes now exist in mounted `brand.routes.js`; only salary-components remains missing. Mark prior broad “all onboarding endpoints missing” description as partially superseded.
- **GAP-0033 correction:** tenant company-document upload/list/download and platform review routes exist in mounted `brand.routes.js`, and the frontend upload field matches. Mark prior “no matching backend endpoints” description as superseded at source level; runtime storage/review verification remains pending.
- Registration, plan list/calculate/promo, subscription trial/order/verify and platform admin settings paths were also checked at route-presence level.
- No app code, test, browser, payment, DB, migration or deployment operation was performed; main untouched.


## Cycle 01 Phase 20 — background jobs and runtime configuration (2026-11-28)

- Evidence: [CYCLE-01-SOURCE-AUDIT-PHASE-20.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-20.md).
- **GAP-0061 (P1):** KYC automation uses a module-local in-memory task queue; persisted task rows are not recovered on worker startup. Installed BullMQ/Redis packages are not used by the inspected queue.
- **GAP-0062 (P1):** `.env.example` omits active runtime variables including ClamAV, customer DB gating, cloud tenant DB URL and Central direct URL; Razorpay keys remain commented under an outdated note. Actual deployment values unknown.
- **GAP-0063 (P1):** MinIO silently falls back to `minioadmin/minioadmin`; production startup does not reject missing/default MinIO credentials. Deployment reachability/exploitability not tested.
- `/health` is process liveness only; it does not establish DB/object-store/scanner/worker readiness. ClamAV intentionally fails uploads closed when unavailable.
- No service, queue, DB, browser, test, backup, restore, migration or deployment was executed; main untouched.


## Cycle 01 Phase 21 — authentication identity and encryption reconciliation (2026-11-28)

- Evidence: [CYCLE-01-SOURCE-AUDIT-PHASE-21.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-21.md).
- **GAP-0064 (P1):** shared encryption helper silently falls back to a hard-coded source-code key when ENCRYPTION_KEY is absent. Main server startup validates production configuration, but direct scripts/workers can bypass that bootstrap. Production use of fallback is unknown.
- **GAP-0065 (P1):** email lookup and tenant DB resolution select an unordered `LIMIT 1` row from central_user_index although schema permits same email in multiple tenants. Lookup returns one subdomain without explicit tenant choice.
- Positive control: current authStore persistence excludes accessToken; token is held in memory and legacy stored values are cleared. Correct the stale statement in frozen decisions; retain memory-only requirement and add regression tests.
- No code, credentials, DB, browser, test, migration or deployment operation performed; main untouched.


## Cycle 01 Phase 22 — P0 revalidation and gap deduplication (2026-11-28)

- Evidence: [CYCLE-01-SOURCE-AUDIT-PHASE-22.md](cycles/CYCLE-01-SOURCE-AUDIT-PHASE-22.md).
- GAP-0020 remains P0: WebSocket company broadcast still ignores companyId and sends to all connected sockets.
- GAP-0021 remains P0: subscription.routes.js passes undefined paymentController.handleWebhook; server mounts this router directly. Boot failure is expected but not runtime reproduced.
- **GAP-0030 disposition correction:** operational DB RLS is not required by frozen architecture. Tenant business tables intentionally rely on tenant DB/schema routing plus mandatory company_id filters. Mark the original “missing operational RLS” finding Superseded / Not a defect under frozen design. GAP-0002 remains P0 until shared-schema scoping and negative integration tests pass. Central RLS gaps GAP-0047/0048 remain open.
- Deduplication: GAP-0053 rolls into GAP-0035; GAP-0054 rolls into GAP-0034; GAP-0052 expands GAP-0006; GAP-0059 is residual GAP-0032; GAP-0058 is billing request payload only and GAP-0060 is response unwrapping; GAP-0033 is superseded at source level.
- No boot, test, DB, WebSocket, webhook, payment, migration, deployment or application code operation performed; main untouched.


## Cycle 01 Phase 23 — implementation and CI evidence (2026-11-28)

- Detailed report: [CYCLE-01-IMPLEMENTATION-PHASE-23.md](cycles/CYCLE-01-IMPLEMENTATION-PHASE-23.md).
- **GAP-0020 (P0):** WebSocket ticket/socket identity and user/company delivery now use the verified Central tenant ID + operational company ID pair. Focused unit tests passed at backend CI SHA `97c60ad1ed3549d4c780c8506f871ada8e7cd1bb`. Status: Fixed — Awaiting real WebSocket integration verification.
- **GAP-0021 (P0):** current payment controller exports `handleWebhook`; subscription router registers a callable handler; router-load test passed. The missing-export defect is Verified Closed. Full successful settlement/replay tests remain in HRMS-C-002.
- **GAP-0066 (P0, new):** `payment.controller.js` had an unterminated `createPhonePeOrder` function because the closing brace was inside a block comment. CI reported `SyntaxError: Unexpected end of input`. Dead commented code was removed and the disabled handler properly closed. Status: Verified Closed by backend CI at SHA `97c60ad1ed3549d4c780c8506f871ada8e7cd1bb`.
- Backend Tests workflow run [46103433237](https://github.com/Krinki-dev/HRMS/actions/runs/46103433237): success; 171 discovered, 166 passed, 0 failed, 5 skipped.
- This CI result is for the exact SHA above, not the latest branch HEAD. Later auth/session and documentation commits were still running CI at report time. Five skipped tests mean PostgreSQL/RLS integration is not fully proven.
- No live WebSocket network test, production server boot, database migration, production payment or deployment was performed; main untouched.


## Cycle 01 Phase 24 — explicit tenant selection and refresh binding (2026-11-28)

- Evidence: [CYCLE-01-IMPLEMENTATION-PHASE-24.md](cycles/CYCLE-01-IMPLEMENTATION-PHASE-24.md).
- **GAP-0001 (P0):** access and refresh tokens now carry Central tenant UUID and operational company UUID separately; login request includes selected tenant UUID; backend rejects body/request tenant mismatch. Refresh resolves the signed tenant UUID directly and checks company identity. Status: Fixed — Awaiting real login/OTP/refresh E2E verification.
- **GAP-0065 (P1):** email lookup returns sorted eligible workspace choices; ambiguous memberships require explicit selection; no arbitrary LIMIT 1 selection. Status: Fixed — Awaiting E2E and legacy membership backfill verification.
- Backend Tests run [46103861483](https://github.com/Krinki-dev/HRMS/actions/runs/46103861483) passed at SHA `3f495f016e8e56ecb6fc63770c836fc6e292ac7c`: 177 tests, 172 pass, 0 fail, 5 skipped.
- Frontend Build run [46103852916](https://github.com/Krinki-dev/HRMS/actions/runs/46103852916) passed at SHA `2b27b3c8a319f02a16b01f2fb9fd092d0cff380b`.
- Tenant migration inventory integration run [46103861464](https://github.com/Krinki-dev/HRMS/actions/runs/46103861464) passed at SHA `3f495f016e8e56ecb6fc63770c836fc6e292ac7c`; this is not Central RLS integration.
- No live auth browser test, DB migration, production token change or customer-data operation performed; main untouched.


## Cycle 01 Phase 25 — Central RLS policy completion status (2026-11-28)

- Evidence: [CYCLE-01-IMPLEMENTATION-PHASE-25.md](cycles/CYCLE-01-IMPLEMENTATION-PHASE-25.md).
- **GAP-0047:** Central RLS policy source coverage is now prepared for all 17 Central Prisma models, including backup_config, tenant_db_config, payment_webhook_events and billing_events. Backend static policy-parity tests passed at SHA `865d5f5d567f49b70967dbd82923047e7a870311`. Live DB catalog/role verification and migration execution remain pending.
- **GAP-0048:** `central_schema.sql` now contains the same policy set as the incremental migration. Clean-install execution remains untested.
- Rollout blockers: deployed Central application role ownership/BYPASSRLS is unknown; legacy Settings DB-config endpoints still use a direct Prisma client without transaction-scoped tenant RLS. Migrate or disable those paths before rollout.
- No production DB, customer DB, migration, role/grant, deployment or customer-data operation performed; main untouched.


## Cycle 01 Phase 25 — Central RLS parity and PostgreSQL CI (2026-11-28)

- Evidence: [CYCLE-01-IMPLEMENTATION-PHASE-25.md](cycles/CYCLE-01-IMPLEMENTATION-PHASE-25.md).
- **GAP-0031:** backend CI now provisions disposable PostgreSQL 16 Central/tenant databases and executes the five formerly skipped DB suites. Backend run [46104242869](https://github.com/Krinki-dev/HRMS/actions/runs/46104242869) passed 210/210 with zero skips at SHA `c3790b43c30b5895fd2eb9b156ef939a54db2055`. Frontend E2E remains GAP-0019.
- **GAP-0047:** source migration and bootstrap now contain explicit policies for all 17 Central models; static parity and real non-owner `hrms_app` RLS pooling tests pass. Live deployed role/catalog verification remains pending.
- **GAP-0048:** migration/bootstrap source parity is tested across all 17 Central tables. Clean-install/upgrade catalog comparison remains pending.
- Central RLS migration `20261128_central_rls_policy_completion.sql` was applied only to the disposable CI database. No production DB was accessed.
- **Important rollout blocker:** legacy Settings DB-config endpoints still create a direct Prisma client and query `tenant_db_config` without RLS context. Resolve/disable that path and verify app role is not owner/superuser/BYPASSRLS before applying Central RLS to production.
- No production migration, deployment, customer-data operation or payment; main untouched.
