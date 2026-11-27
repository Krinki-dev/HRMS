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
Detailed evidence: HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-1.md and CYCLE-01-SOURCE-AUDIT-PHASE-2.md.\n- Additional focused review: WebSocket connection registration/broadcast scoping, notification dispatch, subscription route registration, payment-controller exports, customer-managed DB feature gate, provisioning lease transitions and deletion/backup fail-closed behavior.\n- GAP-0020: company broadcast currently ignores companyId and iterates all WebSocket connections.\n- GAP-0021: subscription.routes.js references paymentController.handleWebhook, but payment.controller.js does not export that handler; backend startup smoke test is required.\n- Positive controls: customer-managed PostgreSQL connection gate is present; provisioning activation checks the lease token and expiry; physical deletion currently fails closed until restore validation.

Partially inspected in Phase 1:
- HR tenant-domain frontend route components and sidebar.
- Backend server route mounts and attendance route/controller/service authorization path.
- Auth/tenant middleware, explicit tenant/company identity helper, Central RLS helper.
- Tenant storage resolver, legacy migration lock, backup dump path and selected tests/CI workflows.

No module dimension has been promoted to a verified completion status. The table below remains Not Assessed where a complete route → controller → service → data model → tests → browser workflow audit has not been completed. This avoids presenting partial source reading as module completion.

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
