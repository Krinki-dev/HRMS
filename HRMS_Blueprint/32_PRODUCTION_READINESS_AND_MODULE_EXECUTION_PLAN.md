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
