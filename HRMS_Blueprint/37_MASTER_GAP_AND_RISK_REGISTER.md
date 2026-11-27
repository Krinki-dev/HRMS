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

## Cycle 01 disposition
- Full fresh source audit: Pending.
- Confirmed current findings: Pending.
- Duplicate/root-cause consolidation: Pending.
- Verified improvement plan: Pending.
- Do not close inherited findings until revalidated with current evidence.
