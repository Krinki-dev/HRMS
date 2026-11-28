# HRMS — Master Module Completion Tracker

> Governed by `35_MASTER_PROJECT_EXECUTION_AND_CONTINUITY_PLAN.md`.  
> **Important:** This is an audit ledger, not a claim of completion. Rows begin as **Not Assessed** until checked against current source and evidence.  
> Last updated: 2026-11-27 | Cycle 01 Phase 1 audit: In Progress | Initial full audit: Pending.

## Status definitions
Use only: Not Assessed, Not Started, In Progress, Implemented — Unverified, Automated Tests Passed, Integration Verified, E2E Verified, Production Ready, Blocked, Not Applicable. Record evidence and exact commit SHA for every verified status.

## Dimension key
- **REQ:** Requirements/acceptance criteria
- **FE:** Frontend routes/screens/interactions
- **BE:** Backend routes/services/jobs
- **DB:** Prisma/schema/relations/migrations
- **SEC:** Auth/RBAC/tenant/company/data permissions
- **IO:** CSV/XLSX/PDF import/export
- **TEST:** Unit/service/API tests
- **INT:** PostgreSQL/integration tests
- **E2E:** Complete browser workflows
- **OPS:** Observability/failure/recovery/deployment

## Cycle 01 audit activity — partial, not completion evidence

Source SHA: 6625b93733e726140c44ff633cef351abd3d4d9d.
Detailed evidence: HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-1.md and CYCLE-01-SOURCE-AUDIT-PHASE-2.md.\n- Additional focused review: WebSocket connection registration/broadcast scoping, notification dispatch, subscription route registration, payment-controller exports, customer-managed DB feature gate, provisioning lease transitions, deletion/backup fail-closed behavior, Leave routes/services, Recruitment feedback/offer services, Performance mutations, Training operations, Asset allocation/return and Expense receipt upload path.\n- GAP-0025: Performance mutations do not consistently verify company ownership.\n- GAP-0026: Training service methods ignore companyId for several operations.\n- GAP-0027: Asset allocation/return/employee lookup omit ownership checks.\n- GAP-0028: Expense receipt upload lacks Multer limits/content filtering and does not invoke ClamAV.\n- GAP-0029: Payroll payslip GET/update and bonus-delete controller calls do not match service signatures; company/run checks also need tightening.\n- GAP-0030: Operational shared-schema HR tables have no demonstrated RLS policy coverage.\n- GAP-0031: Required PostgreSQL RLS/auth/payroll/compliance integration suites are not configured to run in standard CI.\n- GAP-0032: Onboarding wizard calls missing backend progress/save/complete and salary-components routes.\n- GAP-0033: Company document upload/review UI has no matching mounted backend endpoints.\n- GAP-0034: Notification settings frontend URL differs from the backend mount path.\n- GAP-0035: Backup dumps are compressed but not application-layer encrypted before cloud upload.\n- Existing paid-upgrade guard blocks checkout until dedicated storage is verified; no end-to-end shared-to-dedicated migration workflow was located.\n- Backup path deliberately blocks shared/legacy and unsupported dedicated-database storage; no restore implementation/drill was found.\n- GAP-0022: company-wide leave application listing has no leave.view permission gate.\n- GAP-0023: leave balance controller omits req.db and trusts caller-supplied employeeId.\n- GAP-0024: recruitment feedback/offer mutations lack full company ownership/interviewer assignment checks.\n- GAP-0020: company broadcast currently ignores companyId and iterates all WebSocket connections.\n- GAP-0021: subscription.routes.js references paymentController.handleWebhook, but payment.controller.js does not export that handler; backend startup smoke test is required.\n- Positive controls: customer-managed PostgreSQL connection gate is present; provisioning activation checks the lease token and expiry; physical deletion currently fails closed until restore validation.

Partially inspected in Phase 1:
- HR tenant-domain frontend route components and sidebar.
- Backend server route mounts and attendance route/controller/service authorization path.
- Auth/tenant middleware, explicit tenant/company identity helper, Central RLS helper.
- Tenant storage resolver, legacy migration lock, backup dump path and selected tests/CI workflows.

No module dimension has been promoted to a verified completion status. The table below remains Not Assessed where a complete route → controller → service → data model → tests → browser workflow audit has not been completed. This avoids presenting partial source reading as module completion.

## Cycle 01 Phase 11 audit activity — partial, not completion evidence

- Auth identity trace: token signers, tenant identity normalization, auth middleware, tenant middleware and existing identity tests inspected. Existing source controls separate operational companyId from Central tenantId; end-to-end login/refresh/company-selection runtime coverage remains pending.
- Attendance contract: controller calls checkIn(db, employeeId, companyId, body), while service declares checkIn(db, employeeId, data). Request geolocation/IP data therefore lands in the wrong argument and is not persisted. Recorded as GAP-0040 (P2).
- Source evidence and blob SHAs: HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-11.md.
- No application code changed; no tests/runtime/database/browser verification performed.

## Module register

| ID | Stream | Module / capability | REQ | FE | BE | DB | SEC | IO | TEST | INT | E2E | OPS | Evidence / gaps / next task |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| HRMS-AUTH | A | Authentication, sessions, OTP, password reset, company selection | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-ORG | A | Company, branches, departments, designations | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-EMP | A | Employee lifecycle, profile, KYC, onboarding, exit/FnF | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-ATT | A | Attendance, shifts, rosters, holidays, regularization, overtime | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-LEAVE | A | Leave policy, accrual, balances, applications, approvals | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-PAY | A | Payroll setup, salary, calculation, approval, payslips, bank files | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-COMP | A | PF, ESI, PT, TDS, LWF and filings | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-EXP | A | Expense claims, receipts, approvals and accounting linkage | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-REC | B | Recruitment and hiring lifecycle | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-PERF | B | Goals, reviews, feedback, appraisal | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-TRAIN | B | Training/Learning assignments and completion | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-ASSET | B | Asset inventory, allocation, return, maintenance | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-DOC | B | Documents, employee files, KYC, retention | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-NOTIFY | B | Email/SMS/in-app notifications and retries | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-REPORT | B | Dashboards, analytics, reports and scheduled exports | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-SET | B | Settings, workflows, audit logs, RBAC and self-service | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-WEB | C | Public website, plans, pricing, promos and marketing | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-ONBOARD | C | Signup, verification, tenant provisioning and company setup | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-ADMIN | C | Platform Admin, tenant/domain/document/support operations | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-BILL | C | Subscription, invoices, Razorpay, webhooks, renewals, reconciliation | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-TENANT | D | Central/operational identity, storage routing and lifecycle | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-RLS | D | Shared-schema RLS, company scope, DB roles and isolation | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-MIG | D | Canonical PostgreSQL migrations and schema provisioning | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-CLIENTDB | D | Customer-hosted/offline PostgreSQL and network safety | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-UX | E | Global navigation, design system, responsive UI and accessibility | Not Assessed | Not Assessed | N/A | N/A | Not Assessed | N/A | Not Assessed | N/A | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-IMPORT | F | Shared CSV/XLSX import/export framework across modules | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-BACKUP | F | Backup, restore, retention and governed deletion | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-FILES | F | Private object storage, malware scanning and signed access | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |
| HRMS-OPS | F | CI, deployment, monitoring, secrets and disaster recovery | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Not Assessed | N/A | Not Assessed | Not Assessed | Not Assessed | Not Assessed | Fresh audit pending |

## Update rules
1. Update only after inspecting current source and relevant tests.
2. Keep dimensions independent; backend success does not imply frontend or E2E success.
3. Cite exact paths, test names, CI run IDs and commit SHA in the final column or linked cycle report.
4. Use Not Assessed until checked; use Not Verified when evidence is missing or stale.
5. Update this tracker after every meaningful batch and every full re-analysis.
6. Do not delete rows when a module is deferred; record why and when it will be revisited.


## 2026-11-27 audit evidence note — Phase 12

Phase 12 source revalidation is recorded in HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-12.md. It reconfirmed critical findings in notifications/WebSocket, subscription webhook wiring, leave authorization, payroll controller/service contracts, attendance check-in contract and CI integration-test configuration. This does not justify marking any module dimension complete: module-wide route/service/data/E2E coverage remains incomplete, and runtime tests were not run. Keep existing Not Assessed/Not Verified statuses until the full audit supplies evidence.

## 2026-11-27 audit evidence note — Phase 13

Phase 13 is recorded in HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-13.md. It adds GAP-0041 (P1): the operational Prisma schema is PostgreSQL, while the documented legacy tenant migration history is MSSQL/SQL Server; a safe PostgreSQL baseline and replay strategy are required. Tenant migration inventory remains intentionally copy-disabled and is not evidence of a completed migration/cutover capability. No runtime/database verification was performed. Keep module dimensions Not Assessed/Not Verified until full evidence is available.


## 2026-11-27 audit evidence note — Phase 14

Phase 14 recorded in HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-14.md. GAP-0042 is a P1 security-review item: customer DB connection enablement helper is not directly enforced in the inspected resolver; potential SSRF exposure is not proven and requires route authorization, provisioning and network-egress verification. Source review also reconfirmed auth tenant matching, fail-closed storage resolution and transaction-scoped RLS helpers. Runtime tests remain unexecuted; do not mark dimensions verified.


## 2026-11-28 audit evidence note — Phase 15

Phase 15 recorded in `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-15.md`. New findings GAP-0043 through GAP-0045 cover the legacy DB connection-test path, credential handling and conflicting legacy configuration model. The Phase 14 feature-flag concern is corrected: registration does enforce the flag, but the legacy Settings connection-test route does not. No runtime tests or deployment/network checks were run; keep module dimensions Not Assessed/Not Verified.


## 2026-11-28 audit evidence note — Phase 16

Phase 16 recorded in `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-16.md`. GAP-0046 through GAP-0049 cover same-company FK enforcement, central RLS coverage, missing RLS in the fresh-install bootstrap, and candidate missing FK indexes. These are source-level findings only; live DB/catalog and runtime verification were not performed. Keep module dimensions Not Assessed/Not Verified.


## 2026-11-28 audit evidence note — Phase 17

Phase 17 recorded in `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-17.md`. GAP-0050 through GAP-0054 cover backup scheduler wiring/schema mismatch, non-fatal deploy migration errors, incomplete backup/restore coverage, unencrypted dump artifacts, and notification settings route mismatch. Backup/restore, API, and deployment modules remain **Not Assessed / Not Verified** for runtime readiness: no tests, database, server, backup, restore or deployment were executed. The wider module API mapping is still pending; do not promote module completion status based on source inspection alone.


## 2026-11-28 audit evidence note — Phase 18

Phase 18 recorded in `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-18.md`. GAP-0055 through GAP-0057 cover employee address listing, expense receipt upload, and employee photo upload contract mismatches. Core module prefixes were statically compared, but page-by-page API payload/response, permission, ownership and runtime coverage is not complete. Keep all relevant module dimensions Not Assessed / Not Verified until automated integration and browser evidence exists.


## 2026-11-28 audit evidence note — Phase 19

Phase 19 recorded in `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-19.md`. GAP-0058 through GAP-0060 cover subscription checkout request/response mismatch, missing onboarding salary-components route, and inconsistent API response unwrapping. Earlier GAP-0032 is narrowed because onboarding progress/save/complete routes are now present; GAP-0033 is superseded at source level because company-document endpoints are now mounted. Runtime and browser verification remains pending; do not mark onboarding, billing or document workflows complete.
