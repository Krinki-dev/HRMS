# HRMS Production Readiness and Module Execution Plan

**Repository:** `Krinki-dev/HRMS`  
**Working branch:** `architecture/postgres-tenant-isolation`  
**Updated:** 2026-11-25  
**Purpose:** Keep the remaining production blockers visible and move into HRMS modules as soon as the billing and tenant foundations are safe.

## Executive status

The project has substantial source implementation, but it is not yet production-ready. A route existing, a screen rendering, or a GitHub commit does not prove a customer workflow is complete. Production readiness requires tests against a real disposable PostgreSQL environment, a staging deployment, provider sandbox verification, security review, backup/restore proof and an approved release procedure.

## Planning estimate

These are focused engineering-day estimates based on the current source audit. They are not calendar guarantees and may change when module gaps are measured.

| Workstream | Estimated focused effort | Exit condition |
|---|---:|---|
| Billing, subscription and renewal | 1–3 days remaining | Correct prepaid periods, renewal, webhooks, ledger idempotency, reconciliation, overdue/grace behavior and sandbox verification |
| Tenant provisioning, PostgreSQL isolation, onboarding and access control | 2–4 days | Correct storage assignment, resolver, RLS, registration retry/failure handling, persisted onboarding, route permissions and isolation tests |
| Core HRMS modules | 5–10+ days | Employees, attendance, leave, payroll and compliance connected end-to-end with validation and regression tests |
| Security, integration, staging and release verification | 3–5 days | Security checks, browser E2E, backup/restore drill, monitoring, readiness checks and documented deployment/rollback |

**Indicative total remaining: 11–22+ focused engineering days**, assuming no major architectural rework and timely access to staging/database/provider sandbox. This estimate excludes waiting time for credentials, legal policy decisions, infrastructure provisioning and user-run production approvals.

## Release 0 — Platform and billing foundation

### P0 billing tasks
- [x] Server-calculated Razorpay subscription checkout order persisted in the central payment ledger.
- [x] Verify captured payment against server-created order, amount, currency, tenant and immutable selection snapshot.
- [x] Paid initial subscription invoice and plan activation committed in one transaction.
- [x] Prevent one-time promo deduction from leaking into recurring pricing.
- [x] Generate manual renewal invoices only once prepaid expiry has arrived.
- [x] Use tenant + expiry date deterministic invoice identity to make daily cron retries idempotent.
- [x] Extend paid-through date only after verified payment of a renewal invoice.
- [x] Preserve initial subscription invoice behavior; do not extend expiry from unrelated invoices.
- [x] Permit narrowly scoped invoice recovery for suspended tenants.
- [ ] Validate raw-body Razorpay webhook signature and route webhook transitions through the same payment ledger.
- [ ] Test concurrent payment verification, duplicate callbacks, replay, amount mismatch, wrong tenant, timeout and partial failure.
- [ ] Reconcile stale gateway orders and ambiguous payment states.
- [ ] Verify renewal tax/discount calculations against approved pricing policy and staging invoice examples.
- [ ] Verify suspended recovery and automatic-suspension reactivation with integration tests.
- [ ] Run CI and backend tests on the exact release head; current status is unverified.

### P0 tenant and onboarding tasks
- [ ] Reconcile existing tenant storage inventory; classify legacy records before routing changes.
- [ ] Finish PostgreSQL-only shared/dedicated tenant allocation and make provisioning retryable/compensating.
- [ ] Wire validated storage resolver into production tenant middleware; remove unsafe fallback behavior from production paths.
- [ ] Verify RLS for every central tenant-scoped query and platform-admin operation.
- [ ] Review signup, email/contact verification, admin seeding, first login and onboarding persistence.
- [ ] Apply migrations only after backup, staging validation and explicit approval.
- [ ] Complete a restore drill before enabling destructive tenant operations.

## Release 1 — Core HRMS modules (start immediately after Release 0 source/CI gate)

Do not wait for optional visual polish or secondary modules. Audit each module and work in dependency order.

### 1. Employees (foundation)
- Employee create/edit/view/deactivate, unique employee code and duplicate detection.
- Department, designation, branch, reporting manager and employment status.
- Employment lifecycle: onboarding, probation, confirmation, transfer, promotion, resignation/termination and exit.
- Employee documents and access-controlled downloads.
- ESS profile access and approval-controlled updates.
- Bulk import/export validation and rollback.
- Tenant isolation, role/permission checks, audit trail and tests.

### 2. Attendance and shifts
- Attendance capture and manual correction with approvals.
- Shift assignment, weekly offs, holidays, late/early rules and overnight shifts.
- Regularization and manager/HR approval.
- Overtime and compensatory-off policy.
- Device/import integrations only where actually configured.
- Reconcile attendance summaries with payroll input.

### 3. Leave
- Configurable leave types, accrual, carry-forward and balance ledger.
- Apply, cancel, half-day and attachment workflows.
- Manager/HR approval chain and delegation.
- Holiday/week-off-aware working-day calculation.
- Leave-to-attendance/payroll integration and audit history.

### 4. Payroll
- Salary components, employee salary history and effective dates.
- Monthly payroll calculation, proration, LOP, arrears and full/final settlement.
- Attendance and leave integration.
- Approval, lock, reversal/correction and audit trail.
- Payslip generation, secure access and bank transfer export.
- Validate statutory calculations and state-specific configuration before claiming compliance.

### 5. Compliance
- PF/ESI/PT/TDS/LWF configuration by jurisdiction and effective date.
- Employee eligibility, thresholds, wage ceilings and rounding rules.
- Challan/ECR/return exports and reconciliation.
- Versioned statutory rules and test cases for representative states and edge cases.
- Treat exports as preparation unless official filing integration is independently authorised and tested.

## Release 2 — Secondary modules
1. Recruitment and candidate-to-employee conversion.
2. Performance and appraisal.
3. Training and development.
4. Assets and inventory.
5. Expenses and reimbursements.
6. Reports and analytics.
7. Notifications, integrations and automation.

## Production release gates

A release must not be marked production-ready until all applicable items are verified:

- Backend tests and frontend build pass on the exact release commit.
- Prisma schema validation and client generation succeed for both tenant and central schemas.
- Migrations run on a disposable PostgreSQL database and staging with reviewed backup/rollback steps.
- Tenant isolation and RLS tests prove cross-tenant reads/writes are blocked.
- Authentication, password/session handling, RBAC, admin separation, CSRF/CORS, rate limits and secrets handling are reviewed.
- Signup → tenant provisioning → plan selection → payment → onboarding → employee creation → attendance → leave → payroll → payslip workflow passes browser E2E.
- Razorpay sandbox order, captured payment, webhook, duplicate/replay and reconciliation flows pass. No real payment is used for testing.
- MinIO/private document storage and ClamAV fail-closed behavior are verified in staging.
- Backup artifact is restored into an isolated environment and data integrity is checked.
- Health/readiness, logs, monitoring, alerts, deployment and rollback runbooks are verified.
- User approves the production migration/deployment window.

## Owner involvement — only when necessary

The user should not need to make routine technical choices. Their attention is required only for:
- Staging/database access and running approved migrations after the supervised checklist.
- Provider sandbox credentials configured locally/server-side (never pasted into chat).
- Confirmation of statutory/business policies where the code cannot infer the legal rule.
- Final approval before production data migration or deployment.

## Current safety boundary

No production database migration, real payment, live customer-data change or production deployment is authorized by this plan. Keep implementation on `architecture/postgres-tenant-isolation`; never modify `main` directly.


## 2026-11-25 — Additional production blocker discovered

A source audit found the shared `checkModuleEnabled()` middleware was a no-op and the primary module routers did not mount it. This allowed API endpoints to be reachable without checking the server-persisted tenant module entitlement set. The first enforcement slice is now implemented for Employees, Attendance, Leave, Payroll, Compliance, Recruitment, Performance, Training, Assets, Expenses and Reports, with unit tests added (not yet run). Remaining module routers and per-user authorization still need review. Treat this as a P0 security/entitlement gate until CI and PostgreSQL-backed tests verify it.

## Revised immediate module execution

1. Verify the new module entitlement middleware tests and exact catalog-to-`tenant_modules` name alignment.
2. Audit Employees end-to-end (admin CRUD, employee self-service, identity/document data, import/export, access control, frontend states and persistence).
3. Audit Attendance + Leave together (self-service ownership, manager/HR approvals, shift/calendar rules, payroll handoff).
4. Audit Payroll + Compliance together (calculations, lock/publish, statutory thresholds, exports, state configuration and audit).
5. Fix the highest-severity correctness/security gaps found, then continue secondary modules.


## 2026-11-25 — User requirement: dual-format, relational Excel + CSV import/export for every HRMS module

This is a frozen product requirement for module implementation. Do not ask the user to repeat it or treat it as optional polish.

### Required two export/import options
Every HRMS module must support both:
1. **Standard CSV** import/export for simple, flat, interoperability-oriented data exchange.
2. **Advanced Excel workbook (.xlsx)** import/export as a second first-class option. Each workbook may contain multiple related worksheets/tabs representing the module's logical data entities and relationships, all packaged into one file.

### Relational Employee workbook example
One workbook for employee master data with sheets such as:
- Instructions / Read Me (version, tenant-independent template metadata, import rules, accepted values, generated timestamp)
- Employees / Basic Details
- Contact Details
- Family Members / Dependants
- Education
- Employment History / Lifecycle Events
- Bank Details (restricted access; include only with explicit authorised export)
- Documents Index (metadata and secure references only; do not embed private documents by default)
- Reference Data / Lookup Lists (departments, designations, branches, employment types, etc.)
- Import Errors / Validation Results (for generated error workbook, not source input)

### Relationship and identity rules
- Every parent record has a stable business key (e.g. Employee Code) and/or immutable record ID; child tabs refer to that parent key. Do not rely on worksheet row numbers or display names as foreign keys.
- For existing records, support stable record IDs for update/upsert where authorised; for new records, generate IDs server-side and return a downloadable result workbook mapping import keys to created IDs.
- Support one-to-many child sheets (family, education, employment history, contact methods) and optional reference sheets for controlled values.
- Validate all references, duplicates, required fields, data types, dates, enumerations and tenant ownership before committing.
- Import is preview-first: parse → validate → show row/sheet-level errors and warnings → user confirms → commit in a transaction/batched safe workflow. Provide a downloadable error workbook retaining original row references.
- Never trust IDs to cross tenant boundaries. Resolve references within the authenticated tenant and reject cross-tenant IDs.
- Define explicit conflict modes: create-only, update-only, upsert; require explicit selection where ambiguous. Avoid silent destructive replacement/deletion.
- Provide import summary and audit log: created, updated, skipped, rejected; actor, time, template version, checksum/job ID.
- Exports must respect permissions, module entitlements, field-level sensitive-data permissions and tenant scoping. Sensitive bank, identity and salary data must be separately permission-gated and excluded by default unless explicitly authorised.
- Formula cells are for usability only; formulas must not be trusted as source values during import. Import reads validated raw cell values, not formula results alone. Avoid volatile/external-link formulas and macros.
- Preserve dates, numeric formats, dropdown validations, frozen headers, filters, column widths and readable instructions in generated templates. Do not use macros or external workbook links.
- CSV remains available and must document its flat-data limitations; related records can be exported as separate CSV files or via a documented ZIP bundle if the module has multiple related entities.

### Apply consistently across all modules
Use a shared import/export framework and module-specific workbook schemas, not one generic flat sheet. At minimum audit and implement:
- Employees: basic, contact, family, education, employment/lifecycle, work assignments, permitted bank/document metadata.
- Attendance: attendance records, shifts, rosters/assignments, holidays, regularization, overtime (as applicable).
- Leave: leave types, balances/ledger, applications, approvals and policy references (with safeguards around opening balances).
- Payroll: employee salary structures, components, payroll runs, payslips/earnings/deductions, reimbursements/adjustments, statutory outputs; sensitive permissions and locked-period safeguards.
- Compliance: period summaries, employee statutory identifiers/eligibility and filing/export data with jurisdiction and effective-date metadata.
- Recruitment, Performance, Training, Assets, Expenses, Reports and other modules: each gets a workbook schema reflecting its parent-child relationships and controlled reference values.

### Delivery / UX
- Provide clearly labelled CSV and Excel options side-by-side in each module's import/export area.
- Provide downloadable sample/template workbook links from the application, with template version and a short instructions sheet.
- Support upload of completed workbook, validation preview, error workbook download, confirmation and import summary.
- Exports should support filters/date ranges and optionally include related sheets, respecting role and field permissions.
- Templates must be generated from the same schema metadata used by import validators to prevent template/parser drift.
- Add representative round-trip tests: export → import unchanged workbook → no unintended data change; edit workbook → preview → import → verify parent/child relationships.
- For each module, test CSV compatibility alongside workbook import/export.

### Execution rule
Build a reusable, secure workbook engine and template/schema contract during the Employees module. Then reuse it module-by-module. Do not postpone the workbook option until after all modules are completed; design module work around both CSV and relational XLSX from the start. Keep the standard CSV path intact.
