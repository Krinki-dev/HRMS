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
