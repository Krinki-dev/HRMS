# Cycle 01 — Fresh Source Audit (Phase 1)

- Audit ID: HRMS-C01-AUDIT-P1
- Repository: Krinki-dev/HRMS
- Branch: architecture/postgres-tenant-isolation
- Exact source SHA inspected: 6625b93733e726140c44ff633cef351abd3d4d9d
- Audit date: 2026-11-27
- Status: In Progress — architecture, routing, CI and selected security paths inspected; not a complete module audit.
- Implementation status: No application code changed in this phase.

## 1. Verified repository and CI baseline

The exact inspected branch head is 6625b93733e726140c44ff633cef351abd3d4d9d. On that SHA:

| Workflow | Run ID | Result |
|---|---:|---|
| Backend Tests | 46023203389 | Success |
| Tenant Migration PostgreSQL Integration | 46023203475 | Success |

Repository tree inventory at that SHA:
- 498 tracked tree entries in the recursive Git tree.
- Backend has 19 module directories, including Auth, Employees, Attendance, Leave, Payroll, Compliance, Recruitment, Performance, Training, Assets, Expenses, Reports, Notifications, Roles, Settings, Platform and Automation.
- Frontend has 178 paths, including 106 JS/JSX files and 24 CSS files.
- Backend test directory contains 29 test files.
- Central/tenant database SQL history includes 14 operational/central SQL migration or diagnostic files, plus a legacy Prisma migration directory whose name contains spaces.

These counts describe repository inventory only. They do not represent completed feature counts.

## 2. Confirmed architecture facts

1. Runtime is a React 18 + Vite frontend and Node/Express modular-monolith backend, with Prisma 6 and PostgreSQL schemas for Central and operational data.
2. Backend server mounts explicit APIs for employees, attendance, leave, payroll, compliance, recruitment, performance, training, assets, expenses, reports, notifications, roles, settings and platform administration.
3. Tenant identity helper explicitly separates operational companyId from Central centralTenantId. This is a positive implementation; all consumers still need an end-to-end audit.
4. Tenant storage resolver rejects unclassified or non-ready storage and validates the PostgreSQL target/schema policy. It is a resolver, not a provisioning or data-migration engine.
5. Central RLS helper sets transaction-local context and executes the protected query inside the same transaction. This does not prove every Central query uses the helper or that the production database role is subject to RLS.
6. The operational Prisma migration lock declares provider = mssql; the retained initial migration is legacy SQL Server history. Do not run the existing npm run migrate, Prisma migrate reset, or blind db push against PostgreSQL.
7. Backup code can create a PostgreSQL dump and upload it to configured cloud storage, but the inspected source/tests do not establish a successful restore drill.

## 3. Current source findings (new, require plan-level treatment)

### C01-FE-001 — Tenant-domain HR pages call an API namespace not mounted by the server
- Severity: P1 — core workflow integration
- Evidence: frontend/src/pages/hr/HRDashboard.jsx, HREmployees.jsx, HRAttendance.jsx, HRLeaves.jsx and HRPayroll.jsx call /hr/* endpoints. frontend/src/services/api.js prefixes requests with /api/v1. backend/server.js mounts module APIs under /api/v1/employees, /attendance, /leave, /payroll, etc.; it does not mount an /api/v1/hr router.
- Impact: The tenant-domain route set in frontend/src/App.jsx uses these legacy HR components. Their dashboard, employee, attendance, leave and payroll requests therefore do not match the currently mounted backend API contract.
- Proposed direction: Choose one canonical frontend route/component set for tenant domains and connect it to the current APIs. Do not add a duplicate legacy /hr backend just to mask stale clients unless the audit proves a compatibility layer is intentionally required.
- Acceptance evidence needed: Frontend build plus tenant-domain browser tests for dashboard, employee CRUD, attendance, leave and payroll using actual mounted API routes.

### C01-FE-002 — HR sidebar destinations do not match the active tenant-domain route table
- Severity: P1 — user navigation
- Evidence: frontend/src/components/hr/HRLayout.jsx links to /leave, /training, /documents and /announcements. The tenant-domain route block in frontend/src/App.jsx declares /leaves (plural), but does not declare tenant routes for /training, /documents or /announcements.
- Impact: Sidebar navigation can land on the catch-all redirect instead of the expected screen. This is separate from the legacy API mismatch above.
- Proposed direction: Define a single tenant-domain route manifest and derive sidebar links from it; remove dead/duplicate route definitions after usage is verified.
- Acceptance evidence needed: Route-manifest test and browser navigation test for every visible sidebar item.

### C01-FE-003 — ESS child routes use absolute paths outside their parent path
- Severity: P1 candidate — route-tree correctness; runtime reproduction pending
- Evidence: In frontend/src/App.jsx, nested under Route path="/ess", child routes are declared as path="/leave-apply" and path="/payslips" rather than paths nested under /ess.
- Impact: React Router v6 requires an absolute nested child path to begin with its combined parent path. These declarations are structurally inconsistent and may cause route-tree matching to throw.
- Proposed direction: Verify with the installed React Router version, then use relative child paths (leave-apply, payslips) or otherwise correct the hierarchy.
- Acceptance evidence needed: Run the frontend build and a browser/router smoke test that loads a non-ESS route and both ESS destinations. Keep severity provisional until reproduced.

### C01-SEC-001 — Attendance approval actions lack route-level permission gates; rejection update is not company-scoped
- Severity: P1 — authorization / cross-company integrity
- Evidence: backend/modules/attendance/attendance.routes.js applies checkPermission to list, bulk mark, record edit and shift/holiday management, but not to PUT /regularize/:id/approve, PUT /regularize/:id/reject or PUT /overtime/:id/approve. attendance.controller.js forwards the authenticated user ID but does not independently enforce an approver role. In attendance.service.js, rejectRegularization updates by request ID only and does not include company_id; approval does first find by company_id, while overtime approval does filter by employee company.
- Impact: Any authenticated user who can reach these endpoints may be able to approve/reject records without the intended attendance permission. The rejection path can update a request outside the caller's company if its ID is known and the DB connection contains multiple companies.
- Proposed direction: Add explicit permission/role checks to approval endpoints; scope every mutation by company ownership; make the read/check/update atomic and race-safe; add negative cross-company tests.
- Acceptance evidence needed: Tests proving an ordinary employee cannot approve/reject/approve overtime, company A cannot affect company B, and authorized approvers can complete valid actions.

### C01-CI-001 — Frontend build is covered; browser E2E is not
- Severity: P1 — release confidence
- Evidence: The current .github/workflows files inspected are backend-tests.yml and tenant-migration-integration.yml. Backend Tests runs npm ci --ignore-scripts and npm test from backend; no frontend install/build step is present. No frontend/browser E2E workflow was found in the current workflow inventory.
- Impact: A broken React build or route runtime regression can pass the currently observed required workflows.
- Proposed direction: Add a separate frontend CI job for clean install and production build; add browser E2E after deterministic test fixtures and safe test database contracts are defined.
- Acceptance evidence needed: CI passes on exact SHA with frontend build, route smoke tests and selected core workflow E2E.

### C01-CI-002 — PostgreSQL integration coverage is narrower than the workflow name implies
- Severity: P1 — verification accuracy
- Evidence: tenant-migration-integration.yml runs only node --test test/tenant-migration-inventory.integration.test.js. That test creates synthetic PostgreSQL schemas/tables and tests foreign-key ownership classification/orphan detection through inspectTenantMigration; it does not apply product tenant migrations or provision a real customer schema. The test README also documents that RLS, auth and payroll integration tests skip unless their respective database environment variables are configured. The Backend Tests workflow does not configure those variables.
- Impact: A green check is valid for the tested inventory logic and normal backend suite, but is not evidence that all PostgreSQL RLS/auth/payroll integration tests ran or that product migrations apply cleanly.
- Proposed direction: Rename the workflow to accurately describe inventory integration, and add isolated PostgreSQL jobs for RLS/auth/payroll and migration-baseline tests with explicit disposable DB roles and fixtures.
- Acceptance evidence needed: CI job summaries prove each intended integration test executed (not skipped), and a clean PostgreSQL baseline can be applied to an empty disposable DB.

## 4. Important existing risks reconfirmed at source level

- Legacy migration history: backend/prisma/migrations     11223/migration_lock.toml says provider = mssql. This is a confirmed blocker for using the existing migration history as the PostgreSQL migration source of truth.
- Shared-schema RLS: backend/test/README.md explicitly warns that table owners/superusers bypass RLS by default. The current CI does not configure the non-owning app-role test environment described in that README.
- Provisioning: 20261126_tenant_provisioning_leases.sql adds lease metadata only; its own comments say it does not claim or retry tenants by itself.
- Backups: A gzip-valid dump is not a restore test. No verified restore evidence was located in this phase.
- Tenant data operations: No production DB migration, deployment, customer-data deletion or live payment was performed.

## 5. Coverage still pending — do not mark modules complete

This phase has not completed the required line-by-line review of:
- Signup, tenant provisioning, upgrade/promotion, storage resolver callers and all Central tenant queries.
- Every operational table's tenant/company ownership, RLS policy coverage and production DB role.
- Leave, payroll, compliance, recruitment, performance, training, assets, expenses, reports, notifications and settings service-level authorization and workflows.
- Full import/export pipeline (CSV + relational XLSX), private file storage and malware scanning.
- Billing webhook processing, event replay/reconciliation and subscription lifecycle.
- Backup scheduling, restore, retention and deletion gates.
- Responsive/accessibility review, full frontend build and end-to-end browser workflows.
- Deployment, environment validation, observability, rollback and disaster recovery.

The master module tracker must remain Not Assessed for any dimension not actually verified. This report is Phase 1 evidence, not a completion percentage.

## 6. Next audit actions (before Cycle 01 plan is written)

1. Complete module-by-module route → controller → service → Prisma model → test trace for every module.
2. Complete Central/tenant identity, provisioning and storage lifecycle caller audit.
3. Build a table-level ownership/RLS matrix and verify the effective DB role assumptions.
4. Inventory actual frontend tenant-domain route components against API contracts; determine whether legacy HR screens are still intended.
5. Audit billing webhook, document/file storage, CSV/XLSX, backup/restore and operational failure recovery.
6. Consolidate findings and dependencies; only then draft CYCLE-01-PLAN.md.
7. Independently verify the plan and acceptance criteria before changing application code.

## 7. Safety gates

No changes to main; no production migration, deployment, live payment, destructive customer-data operation or credential change without explicit owner approval. Use disposable test databases for integration verification. Never request secrets in chat.
