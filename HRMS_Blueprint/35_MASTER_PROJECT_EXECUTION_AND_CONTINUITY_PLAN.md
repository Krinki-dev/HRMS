# HRMS — Master Project Execution & Continuity Plan

> **Document ID:** HRMS-MASTER-PLAN-001  
> **Purpose:** Single durable operating manual for full-project analysis, planning, plan verification, implementation, re-analysis and continuous improvement.  
> **Repository:** `Krinki-dev/HRMS`  
> **Working branch:** `architecture/postgres-tenant-isolation`  
> **Protected branch:** `main` (never edit directly)  
> **Created:** 2026-11-27  
> **Status:** Process adopted; first complete fresh audit and verified plan are pending.  
> **Authority:** This document governs the project-wide development cycle. It does not silently override frozen product decisions or safety restrictions.

---

## 1. Mission and working principle

Develop the **whole Syntern HRMS product**, not only one infrastructure concern. All product modules must be assessed during every full audit. Development effort is distributed according to actual gaps, dependencies, customer impact and risk—not equal amounts of code or equal calendar time.

The project is a modular monolith. Keep the agreed PostgreSQL architecture and avoid unnecessary rewrites, microservices or additional database engines.

**Core cycle:**

`Full audit → Gap register → Improvement plan → Plan verification → Implementation → Tests → Full re-analysis → Next cycle`

No implementation batch starts until its plan and acceptance criteria have been checked. Plan verification is not a substitute for post-implementation verification.

## 2. New-chat / new-model / device-change recovery protocol

Any future assistant, model, device or human contributor must follow this sequence. Do not rely on chat history as the project record.

1. Open the GitHub repository and checkout/read the latest `architecture/postgres-tenant-isolation` branch head.
2. Read this file: `HRMS_Blueprint/35_MASTER_PROJECT_EXECUTION_AND_CONTINUITY_PLAN.md`.
3. Read `HRMS_Blueprint/00_CHAT_HANDOFF_CONTINUATION.md`.
4. Read `HRMS_Blueprint/00_INDEX.md` for document navigation.
5. Read `HRMS_Blueprint/07_FROZEN_DECISIONS.md` and `HRMS_Blueprint/34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md`.
6. Read the latest `HRMS_Blueprint/33_MASTER_CODEBASE_ARCHITECTURE_AUDIT.md`, `HRMS_Blueprint/28_IMPLEMENTATION_PROGRESS.md`, the current cycle plan, tracker and latest cycle report.
7. Verify the live branch SHA, working tree/branch state where available, latest CI runs and changed files. Never assume a SHA or CI result from an old chat is current.
8. Identify the latest **open cycle**, its verified plan, completed task IDs, failed/pending checks and next safe task. Resume there; do not restart or repeat completed work.
9. If documents conflict, use this authority order:
   - Explicit owner-approved decision recorded in the decision log / frozen decisions.
   - This master process for workflow and governance.
   - Latest source-verified audit and current code for implementation facts.
   - Latest cycle plan/report and progress log.
   - Older blueprint documents and old chat messages are historical context only.
10. If a fact cannot be verified, label it **Unknown / Not Verified**. Never fill gaps with assumptions.

**New-chat starter instruction:**

> Continue Syntern HRMS from the latest `architecture/postgres-tenant-isolation` branch. First read `HRMS_Blueprint/35_MASTER_PROJECT_EXECUTION_AND_CONTINUITY_PLAN.md`, then the handoff, frozen decisions, owner decisions, latest architecture audit, implementation progress, and active cycle documents. Verify the actual branch head and CI before making claims. Resume from the next open task ID. Do not restart analysis already completed, do not ask me to repeat documented decisions, do not modify `main`, and do not perform production migrations, deployment, real payments, destructive data actions or credential changes without my explicit approval. Keep every meaningful step documented and commit work to the working branch.

## 3. Project-wide audit scope — nothing silently omitted

Every full audit must cover all six streams and all modules. A module is not considered complete merely because its backend route or frontend screen exists.

### Stream A — Core HR workflows
- Authentication, session, OTP, password reset and company selection.
- Company, branches, departments, designations and employee lifecycle.
- Employee profile, KYC, documents, onboarding, transfer, exit and full-and-final settlement.
- Attendance, shifts, rosters, holidays, check-in/out, regularization and overtime.
- Leave types, policies, accrual, balances, applications, approval and encashment.
- Payroll setup, salary structures, components, calculation, validation, approval, payslips, bank files, disbursement integration and reversals.
- Statutory compliance: PF, ESI, PT, TDS, LWF and applicable filings/reports.
- Expenses, claims, receipts, approvals and accounting/reporting linkage.

### Stream B — Product and employee-experience modules
- Recruitment: requisitions, jobs, candidates, stages, interviews, offers and hiring conversion.
- Performance: goals, review cycles, feedback, ratings and appraisal outcomes.
- Training/Learning: catalog, assignments, attendance, completion and outcomes.
- Assets: inventory, assignment, return, maintenance and employee linkage.
- Documents, employee files, KYC, retention and access controls.
- Notifications, email/SMS/in-app delivery, preferences and retries.
- Dashboards, analytics, reports, scheduled reports and exports.
- Settings, workflows, audit logs, role/permission administration and self-service portals.

### Stream C — SaaS/platform administration
- Public website, pricing, plans, modules, add-ons and discounts/promos.
- Signup, email/phone verification, tenant creation and provisioning lifecycle.
- First-company setup, onboarding checklist and document review.
- Platform Admin: tenant/client management, plans, domains, analytics, marketing, settings and support operations.
- Subscription, invoice, Razorpay checkout/verification, webhook processing, manual renewal, reconciliation and entitlement changes.
- Tenant suspension, reactivation, upgrade/downgrade and governed erasure.

### Stream D — Architecture and data
- Central platform DB vs tenant operational DB boundary.
- Central tenant UUID vs operational company UUID contract.
- PostgreSQL-only target and Prisma schema/client correctness.
- Shared public schema, paid UUID-derived schema and approved dedicated DB paths.
- Tenant/company scoping, RLS, database roles, raw SQL, queues, WebSockets and file ownership.
- Canonical PostgreSQL migration baseline, migration ordering, locks, idempotency and rollback/recovery.
- Provisioning, retry, lease, compensation, paid upgrade/data migration and legacy tenant classification.
- Client-hosted/offline PostgreSQL support; do not promise cloud synchronization until a real sync design exists.

### Stream E — Frontend and experience
- Every route, screen, component, form, table, modal, dashboard and navigation state.
- API contract alignment, loading/empty/error/success states and form validation.
- Responsive layouts, accessibility, keyboard use, performance and browser compatibility.
- Light theme default, saved dark preference, centralized tokens and visual consistency.
- Authentication/session expiry, permission-aware navigation and safe user feedback.

### Stream F — Quality, integrations and operations
- Unit, service, API, PostgreSQL integration, security and browser E2E tests.
- CSV and relational XLSX import/export for every applicable module.
- Import preview, validation, duplicate detection, confirmation, transactions, audit trail and error workbook.
- PDF/report generation and file lifecycle.
- Private object storage, malware scanning and signed downloads.
- Backup, restore drills, retention, disaster recovery and deletion safeguards.
- Email/SMS, Razorpay, Redis/BullMQ, scheduled jobs and external integrations.
- Logging, metrics, alerts, health checks, rate limits, secrets, deployment, staging and production runbooks.
- Performance, concurrency, load, accessibility and reliability.

For every audit, reconcile this list against actual route/module inventories and the product blueprint. Add discovered modules rather than dropping them.

## 4. Required per-module audit dimensions

For every module record these dimensions separately:

1. Product requirements and acceptance criteria.
2. Frontend routes/screens and real user interactions.
3. Backend routes/controllers/services/jobs.
4. Database tables, relations, indexes, constraints and migrations.
5. Validation, business rules and edge cases.
6. Authentication, RBAC, tenant/company ownership and sensitive-data permissions.
7. API contract and cross-module dependencies.
8. CSV/XLSX/PDF import-export where applicable.
9. Unit and service tests.
10. PostgreSQL integration tests.
11. Browser E2E / real workflow verification.
12. Observability, failure handling and recovery.
13. Performance, accessibility and responsive behavior.
14. Deployment/configuration/operational readiness.
15. Evidence links, known gaps, risks and next actions.

Use evidence references: exact source paths, test paths/names, migration files, CI run IDs, commit SHA and manual test record. A feature's presence is not evidence that its behavior works.

## 5. Status vocabulary — do not inflate completion

Use these statuses consistently at feature/dimension level:

- **Not Assessed:** not yet audited.
- **Not Started:** confirmed requirement; no implementation found.
- **In Progress:** partial implementation exists.
- **Implemented — Unverified:** code exists; required checks not yet passed.
- **Automated Tests Passed:** named automated tests passed at a recorded commit.
- **Integration Verified:** relevant integrated dependencies/database behavior passed.
- **E2E Verified:** complete user journey passed in a recorded environment.
- **Production Ready:** all applicable security, data, migration, recovery, observability, operational and owner-approval gates passed.
- **Blocked:** dependency, missing access, owner decision or safety gate prevents progress.
- **Not Applicable:** reason documented.

Never use a single guessed percentage as the source of truth. If a summary percentage is requested, calculate it from explicitly weighted, audited criteria and label it as an estimate. Keep UI, API, DB, security, import/export and tests independent.

## 6. Audit and improvement planning procedure

### Phase 1 — Baseline capture
- Record branch, full SHA, date/time and clean/dirty status.
- Record recent commits and changed paths.
- Record CI workflow names, run IDs, head SHAs and conclusions.
- Inventory all backend modules, routes, controllers, services, middleware, jobs and tests.
- Inventory all frontend routes, pages, components, services and API clients.
- Inventory both Prisma schemas, SQL migrations, migration history and DB assumptions.
- Inventory docs, environment templates, deployment manifests and external dependencies.
- Identify stale/contradictory documentation.

### Phase 2 — Functional trace
For each important user journey, trace **UI → API → auth/permissions → service → DB → side effects → response/UI**. Include failure/rollback paths, not only happy paths.

### Phase 3 — Gap and risk register
Each finding receives a stable ID, module, stream, severity, evidence, impact, reproduction/test, dependencies, proposed fix and acceptance criteria. Deduplicate repeated symptoms that share one root cause.

### Phase 4 — Full-project improvement plan
The plan must include:
- All six streams and all modules, including areas with no immediate work (explicitly mark verified/no gap or not assessed).
- Work item IDs, priority, owner/agent role, dependencies and sequencing.
- Exact files/areas expected to change (or discovery task if not yet known).
- Acceptance criteria and automated/manual tests.
- Data migration and rollback/recovery implications.
- Security/privacy and tenant isolation impact.
- Estimate as a range with confidence and assumptions.
- User access/approval needed and what can proceed without the user.
- Explicit out-of-scope items and why.

### Phase 5 — Plan verification (before implementation)
Review the proposed plan against:
- All product modules and the audit scope in Section 3.
- Frozen decisions and owner decisions.
- Dependency order and cross-module data contracts.
- PostgreSQL/Prisma feasibility and migration safety.
- Tenant isolation, permissions and privacy.
- Cost, maintainability and operational burden.
- Testability and measurable acceptance criteria.
- No duplicate, contradictory or premature tasks.
- No hidden production/customer-data actions.

Record reviewer checklist, findings and corrections in the plan verification report. If the plan fails, revise and verify again. Only a **Verified** plan may enter implementation. This is internal technical verification; unresolved owner decisions must still be presented to the user.

### Phase 6 — Implementation
- Work on the approved working branch only.
- Deliver small coherent batches; each batch maps to plan task IDs.
- Read callers, schemas and tests before editing.
- Make the smallest safe change that satisfies acceptance criteria.
- Add/update tests in the same batch.
- Run relevant tests, then broader suites/builds.
- Inspect diffs for accidental scope, secrets, generated artifacts and unrelated changes.
- Commit with task IDs in commit message where practical.
- Update tracker, progress log, audit evidence and handoff after each meaningful session.
- Do not claim background work after a response ends.

### Phase 7 — Post-implementation verification and full re-analysis
- Verify each acceptance criterion against the resulting commit.
- Run targeted tests, full backend tests, frontend build and available PostgreSQL integration/E2E suites.
- Check latest CI run head SHA exactly matches the code being reported.
- Re-audit affected modules and dependent modules.
- Re-run full inventory/gap scan at the end of each major cycle.
- Record regressions, deferred tasks and new gaps.
- Never mark production ready solely because CI passed.

### Phase 8 — Next cycle
Close a cycle only when its planned tasks are completed, explicitly deferred with reasons, or blocked with a named dependency. Create the next plan from the latest full re-analysis. Do not erase old cycles; preserve history.

## 7. Priority model and balanced development

Priority:
- **P0 — Critical:** tenant data exposure, data loss/corruption, auth bypass, payroll/payment integrity, unsafe migration/deletion or severe legal/privacy risk.
- **P1 — Core product:** signup/onboarding and essential HR workflows that prevent real customer use.
- **P2 — Product completeness:** remaining module functionality, reports, imports/exports, integrations and UX gaps.
- **P3 — Optimization:** performance, polish, convenience and advanced optional features.

Balance rules:
- Audit every module in every full cycle.
- Keep a visible module coverage matrix; no module may disappear from the tracker.
- Allocate implementation by dependency and severity, not by repeatedly polishing one subsystem.
- Reserve planned capacity for core HR workflows and product-module gaps while addressing P0 safety issues.
- Where possible, run independent workstreams in parallel, but do not parallelize conflicting edits to shared files/schema.
- A security foundation is necessary but is not the finished product.

## 8. Mandatory safety and approval gates

No assistant or contributor may do the following without explicit owner approval and appropriate evidence:
- Apply production or customer operational DB migrations.
- Run destructive SQL, drop schemas/tables, delete customer data or perform permanent tenant erasure.
- Deploy to production or alter live infrastructure.
- Execute real payment/refund/payout transactions or enable an unverified payment gateway.
- Change credentials, secrets, DNS, domain ownership or production access policy.
- Enable customer-provided DB connections before independent SSRF/network controls are verified.
- Enable Free/Trial shared public-schema tenancy before complete isolation/RLS and runtime DB role tests pass.
- Mark paid tenant active before verified dedicated schema migration/data validation.
- Declare backups safe for deletion authorization without a successful restore drill.
- Bypass CAPTCHA, identity verification, legal hold or owner approval.

Never ask the user to paste secrets into chat. Continue safe source-code and test work without production access where possible. Clearly state when a task is blocked by owner access or approval.

## 9. Required project records and file responsibilities

| Record | File | Must contain |
|---|---|---|
| Master process | `35_MASTER_PROJECT_EXECUTION_AND_CONTINUITY_PLAN.md` | This governance, audit, verification and handoff protocol |
| New-chat handoff | `00_CHAT_HANDOFF_CONTINUATION.md` | Current branch/head, latest status, decisions, next exact task |
| Master index | `00_INDEX.md` | Current document map and authority order |
| Frozen decisions | `07_FROZEN_DECISIONS.md` | Stable owner-approved architecture/product decisions |
| Owner decisions | `34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md` | Questions requiring owner choice and recommendations |
| Architecture audit | `33_MASTER_CODEBASE_ARCHITECTURE_AUDIT.md` | Source-verified current architecture, evidence and blockers |
| Module tracker | `36_MASTER_MODULE_COMPLETION_TRACKER.md` | Module × dimension status, evidence and gaps |
| Cycle plans | `cycles/CYCLE-XX-PLAN.md` | Detailed tasks, acceptance criteria and dependencies |
| Plan verification | `cycles/CYCLE-XX-PLAN-VERIFICATION.md` | Checklist, issues, corrections and verified/rejected outcome |
| Cycle report | `cycles/CYCLE-XX-REPORT.md` | Work done, commits, tests, CI, failures and carry-forward |
| Gap register | `37_MASTER_GAP_AND_RISK_REGISTER.md` | Stable finding IDs, severity, evidence and disposition |
| Implementation progress | `28_IMPLEMENTATION_PROGRESS.md` | Chronological implementation and validation notes |

If a referenced tracker or cycle file does not exist yet, create it during the first audit; do not pretend it already exists. Preserve previous reports.

## 10. Mandatory task record template

Every implementation task must have:

- **Task ID:** stable, e.g. `HRMS-A-001`.
- **Stream / module:** exact owner area.
- **Priority / status:** from the controlled vocabulary.
- **Problem statement:** user-visible or technical defect.
- **Evidence:** paths, line/function/test, commit or CI references.
- **Expected behavior:** observable outcome.
- **Scope:** included and excluded work.
- **Dependencies:** task IDs, decisions, migration or access.
- **Implementation steps:** numbered, small and actionable.
- **Acceptance criteria:** objective pass/fail statements.
- **Tests:** unit, API, DB integration, E2E and manual as applicable.
- **Safety/rollback:** data, security, migration and recovery plan.
- **Approvals needed:** exact owner action, if any.
- **Result:** commit SHA, test commands/results, CI run IDs, remaining gaps.

A task without acceptance criteria is not ready for implementation. A task without evidence cannot be marked complete.

## 11. Communication and progress reporting

At the end of each meaningful work session, report:
1. What was inspected or changed.
2. Task IDs completed/in progress/blocked.
3. Exact files and commit SHA.
4. Tests run and exact outcomes.
5. Latest CI run IDs and whether they match the reported SHA.
6. What remains unverified.
7. The next exact safe task.
8. Any user input/access/approval needed.

Use plain language in user-facing summaries. Keep technical detail and reproducibility in repository documents. Do not give false progress percentages or imply background execution.

## 12. Current adoption state (initial record)

- User explicitly requested that the complete process and every minor step be documented inside the project so a phone/device/account/model/chat change does not lose continuity.
- This document establishes the process and continuity rules.
- Working branch observed during setup: `architecture/postgres-tenant-isolation`.
- Branch head observed before this documentation change: `005d34d3d060e66d73ab12163866a0111d9e277b`.
- Exact-head CI observed before this documentation change: Backend Tests run `46020780777` success; Tenant Migration PostgreSQL Integration run `46020780783` success.
- These CI results apply to that pre-documentation SHA only. Re-check CI for the documentation commit and every later code head before reporting.
- The first complete fresh audit, module tracker, gap register, cycle plan and plan verification report are **not yet completed**.
- No production migration, deployment, real payment, customer-data modification or destructive operation was authorized or performed by this documentation task.

## 13. First execution sequence

1. Create the master module tracker and master gap/risk register.
2. Perform a fresh full repository inventory at the then-current branch head.
3. Reconcile stale blueprint claims against source and tests; retain historical notes but mark superseded claims.
4. Audit every module using Section 4 dimensions.
5. Trace cross-module end-to-end journeys.
6. Publish Cycle 01 plan with task IDs, dependencies and acceptance criteria.
7. Verify Cycle 01 plan using Section 6 Phase 5; fix gaps before implementation.
8. Present owner decisions/approvals only where genuinely required.
9. Implement verified Cycle 01 tasks in small batches.
10. Run tests and exact-head CI; update all records.
11. Re-analyze the whole repository and start Cycle 02 from evidence.

**Do not jump directly to implementation merely because this process document exists.**

---

## CURRENT EXECUTION OVERRIDE — Cycle 01 Phase 28 (2026-11-28)

This section supersedes the initial adoption snapshot in Section 12 where it conflicts with later cycle evidence.

- Cycle 01 plan is **VERIFIED for implementation planning** (verification Round 2 and Round 3 addendum); this does not authorize production operations.
- Latest source report: `cycles/CYCLE-01-IMPLEMENTATION-PHASE-28.md`.
- Latest code commit at the Phase 28 implementation checkpoint: `2254f855b884deb51f7f7783d6acae17fd6523c3` on `architecture/postgres-tenant-isolation`.
- Exact code-head CI: Backend Tests 46105770148 passed 258/258 with 0 skipped; Tenant Migration PostgreSQL Integration 46105770068 passed 1/1 with 0 skipped.
- Frontend Build 46104588048 passed at `cb3ebff3cc1fabd0c189ece8df09a01efcf82bd5`; no frontend source changes occurred after that SHA through Phase 28.
- HRMS-A-010 remains In Progress; Phase 28 closes only the documented subpaths. HRMS-D-004 remains In Progress pending exhaustive operational ownership matrix, composite FK review and live Central role/catalog evidence.
- Next source-only task: HRMS-D-003 forgot-password explicit workspace selection and multi-membership tests; then resume D-004. No owner decision required for this next task.
- `main` untouched. No production DB, migration, deployment, payment, destructive operation or customer-data change performed.


---

## CURRENT EXECUTION OVERRIDE — Cycle 01 Phase 29 (2026-11-28)

This section supersedes the Phase 28 next-task line above where it conflicts.

- Latest source implementation report: `cycles/CYCLE-01-IMPLEMENTATION-PHASE-29.md`.
- Latest source-code commit for this increment: `e644c3b5e233257c1359ed53b2daef4a1aa9dd5d` (forgot-password workspace chooser and stale-selection reset).
- The branch's prior documentation-only Phase 28 sync was `d5f19306bb3fc9d87a7e52a428b2dbec24dc0d5a`; the Phase 29 source increment consists of five commits recorded in the handoff and report.
- HRMS-D-003 / GAP-0065: unordered forgot-password workspace fallback removed in source; ambiguous memberships require explicit eligible workspace; request tenant/body mismatch is rejected; reset token and email delivery use the same selected tenant DB.
- Regression tests were added but exact-head execution is **Pending / Not Verified**. Backend CI, frontend build and authenticated auth E2E must be checked against the final branch head. Do not infer a pass from absent status entries.
- The D-003 task remains In Progress until test/CI/E2E gates pass.
- **Next exact task after verification:** resume HRMS-D-004 operational ownership/query matrix and composite same-company FK review.
- `main` remains untouched. No production/customer DB connection, migration, deployment, real payment, destructive action or customer-data modification was performed.


---

## CURRENT EXECUTION OVERRIDE — Cycle 01 Phase 30 (2026-11-28)

This section supersedes Phase 29 as the current continuation point.

- Latest report: `cycles/CYCLE-01-IMPLEMENTATION-PHASE-30.md`.
- Phase 30 plan: `cycles/CYCLE-01-PLAN-PHASE-30.md`; independently verified in `cycles/CYCLE-01-PLAN-VERIFICATION-PHASE-30.md`.
- HRMS-D-004 resumed. Schema ownership inventory covers 82 operational Prisma models and 17 Central Prisma models. It is a schema-level map only; exhaustive query-by-query ownership verification remains open.
- GAP-0067: shared public `otp_store` previously keyed records by raw email + purpose. Source now namespaces identifier by immutable Central tenant UUID + normalized email in both OTP creation and verification. Six regression tests committed; execution and exact-head CI remain pending. Status Fixed — Awaiting Verification.
- Phase 29 GAP-0065 and HRMS-D-003 remain In Progress pending exact-head CI and authenticated login/OTP/refresh/password-reset E2E.
- **Next exact task:** continue HRMS-D-004 operational query ownership tracing, then cross-company negative tests and composite same-company FK feasibility/data checks. Prepare a non-production Central catalog/role evidence path.
- `main` untouched. No production/customer DB connection, SQL, migration, deployment, real payment, destructive operation or customer-data modification.


---

## CURRENT EXECUTION OVERRIDE — Cycle 01 Phase 31 (2026-11-28)

This supersedes the Phase 30 next-task line.

- Latest report: `cycles/CYCLE-01-IMPLEMENTATION-PHASE-31.md`.
- Phase 31 plan/verification: `cycles/CYCLE-01-PLAN-PHASE-31.md` and `cycles/CYCLE-01-PLAN-VERIFICATION-PHASE-31.md`.
- Source hardening: password login, OTP and forgot-password resolve the operational user through Central `central_user_index.user_id` for the selected tenant and validate the operational companyId. OTP identity includes tenant + company + email.
- Do not query shared public operational users by email alone; no Central tenantId exists on those rows.
- GAP-0067 remains Fixed — Awaiting Verification. GAP-0068 remains Open / Blocked because the current Central index cannot map multiple operational company accounts for the same email within one tenant. Design an explicit Central tenant-user-company membership mapping and backfill under HRMS-D-005; no DDL or production change is authorized.
- HRMS-D-003 and D-004 remain In Progress. D-005 migration baseline remains blocked.
- Full backend tests, frontend build, exact-head CI and authenticated auth E2E remain pending. Isolated OTP helper smoke test: 4/4 passed only.
- Next exact task: design the Central membership mapping/backfill and adoption plan as a source/documentation-only D-005 subtask; then complete auth E2E plan and resume D-004 query audit.
- `main` untouched. No production DB, SQL, migration, deployment, payment, deletion or customer-data change.


---

## CURRENT EXECUTION OVERRIDE — Cycle 01 Phase 32 design checkpoint (2026-11-28)

This supersedes the Phase 31 next-task line.

- Phase 31 report: `cycles/CYCLE-01-IMPLEMENTATION-PHASE-31.md`.
- Phase 32 design: `cycles/CYCLE-01-CENTRAL-TENANT-COMPANY-MEMBERSHIP-DESIGN-PHASE-32.md`, plan `CYCLE-01-PLAN-PHASE-32.md`, verification `CYCLE-01-PLAN-VERIFICATION-PHASE-32.md`.
- D-005 now includes the required Central tenant-user-company membership mapping and verified legacy backfill as a migration-baseline requirement.
- The proposed design is not a frozen owner decision and does not authorize DDL. Before schema implementation, resolve membership cardinality/lifecycle and trusted backfill authority.
- GAP-0068 remains Open / Blocked on this schema mapping. GAP-0067 and GAP-0065 remain Fixed — Awaiting Verification; HRMS-D-003 remains In Progress.
- Full repo tests, frontend build, exact-head CI and authenticated auth E2E remain unverified; isolated OTP helper smoke test passed 4/4 only.
- **Next exact task:** obtain/record the owner decisions needed for membership semantics and legacy backfill, then revise/verify the D-005 migration baseline. No schema migration or production activity without explicit approval.
- HRMS-D-004 query-by-query operational ownership audit resumes after the identity mapping design is settled.
- `main` untouched; no production DB, SQL, DDL, deployment, payment or customer-data operation.
