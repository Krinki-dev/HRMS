# PostgreSQL Tenant/Company Ownership Inventory — Phase 30

**Source of truth:** `backend/prisma/schema.prisma` and `backend/prisma/central.prisma` on `architecture/postgres-tenant-isolation`.  
**Audit type:** static Prisma schema inventory; not runtime query certification.  
**Date:** 2026-11-28 (Asia/Kolkata).

## 1. Operational database model inventory

The operational schema contains **82 models**. Operational tenant isolation is achieved by storage routing plus explicit `company_id` ownership filters in the shared public schema; operational tables do not have the Central RLS policy layer.

### 1.1 Direct company ownership (33 models)

Each record is directly keyed by `company_id`. Every read/write must bind this field to authenticated `req.user.companyId` (not a request body/header company ID).

| Model | Ownership field | Required query rule |
|---|---|---|
| `accounting_integrations` | company_id       String    @unique | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `announcements` | company_id      String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `appraisal_cycles` | company_id           String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `assets` | company_id      String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `audit_logs` | company_id  String?; user_id     String? | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `automation_credentials` | company_id         String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `automation_schedules` | company_id String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `automation_tasks` | company_id    String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `backup_config` | company_id               String    @unique | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `branches` | company_id String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `candidates` | company_id       String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `compliance_files` | company_id   String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `compliance_filings` | company_id     String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `departments` | company_id   String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `designations` | company_id String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `employee_onboarding_draft` | company_id      String; employee_id     String? | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `employees` | company_id              String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `expense_policies` | company_id             String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `holidays` | company_id          String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `job_postings` | company_id       String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `job_requisitions` | company_id      String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `leave_types` | company_id            String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `notification_config` | company_id      String    @unique | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `payroll_runs` | company_id       String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `roles` | company_id  String? | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `salary_structures` | company_id String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `shifts` | company_id       String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `surveys` | company_id    String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `temp_exports` | company_id String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `tenant_branding` | company_id        String    @unique | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `tenant_db_config` | company_id        String    @unique | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `trainings` | company_id          String | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |
| `users` | company_id     String; employee_id    String?   @unique | `company_id = authenticatedCompanyId` on reads, updates, deletes and parent lookups |

**Special cases:** `roles.company_id` and `audit_logs.company_id` are nullable in the schema. Global/default roles and system-level audit rows require explicit read-only/global classification; tenant writes must not create or mutate null-company rows. `companies` is the company root model (listed separately below), not a row with a company_id column.

### 1.2 Employee-owned models (29 models)

These models contain `employee_id`. Every query must prove the employee belongs to the authenticated company, preferably through a company-filtered parent relation or a join to `employees(id, company_id)`. Filtering only by child ID or employee ID is insufficient for service authorization.

| Model | Ownership field | Relation evidence |
|---|---|---|
| `appraisals` | employee_id           String | cycle → appraisal_cycles (cycle_id) |
| `asset_allocations` | employee_id           String | asset → assets (asset_id) |
| `attendance` | employee_id     String | employee → employees (employee_id) |
| `compoff_records` | employee_id String | — |
| `employee_addresses` | employee_id  String | employee → employees (employee_id) |
| `employee_bank_accounts` | employee_id    String | employee → employees (employee_id) |
| `employee_documents` | employee_id    String | employee → employees (employee_id) |
| `employee_education` | employee_id      String | employee → employees (employee_id) |
| `employee_exits` | employee_id         String | employee → employees (employee_id) |
| `employee_family` | employee_id        String | employee → employees (employee_id) |
| `employee_prev_employment` | employee_id           String | employee → employees (employee_id) |
| `employee_salaries` | employee_id         String | employee → employees (employee_id); salary_structure → salary_structures (salary_structure_id) |
| `employee_shifts` | employee_id    String | shift → shifts (shift_id) |
| `employee_transfers` | employee_id      String | employee → employees (employee_id) |
| `expense_claims` | employee_id          String | — |
| `fnf_settlements` | employee_id      String | — |
| `leave_applications` | employee_id      String | employee → employees (employee_id); leave_type → leave_types (leave_type_id) |
| `leave_balances` | employee_id   String | employee → employees (employee_id); leave_type → leave_types (leave_type_id) |
| `leave_encashments` | employee_id   String | — |
| `payroll_bonuses` | employee_id    String | — |
| `payslips` | employee_id       String | payroll_run → payroll_runs (payroll_run_id); employee → employees (employee_id) |
| `performance_goals` | employee_id String | cycle → appraisal_cycles (cycle_id) |
| `regularization_requests` | employee_id        String | — |
| `survey_responses` | employee_id  String? | survey → surveys (survey_id) |
| `tds_declarations` | employee_id       String | — |
| `training_attendance` | employee_id    String | training → trainings (training_id) |
| `training_certificates` | employee_id     String | training → trainings (training_id) |
| `training_feedback` | employee_id    String | training → trainings (training_id) |
| `training_nominations` | employee_id  String | training → trainings (training_id) |

### 1.3 Parent-owned child models (13 models)

These models inherit ownership through the listed parent. Query the parent through the authenticated company's ownership predicate before reading or mutating the child.

| Model | Ownership field | Prisma relation |
|---|---|---|
| `announcement_reads` | user_id         String | announcement → announcements (announcement_id) |
| `automation_logs` | — | task → automation_tasks (task_id) |
| `automation_screenshots` | — | task → automation_tasks (task_id) |
| `candidate_stage_history` | — | candidate → candidates (candidate_id) |
| `exit_checklist_items` | — | exit → employee_exits (exit_id) |
| `expense_items` | — | claim → expense_claims (claim_id) |
| `interview_feedback` | — | interview → interviews (interview_id) |
| `interviews` | — | candidate → candidates (candidate_id) |
| `offers` | — | candidate → candidates (candidate_id) |
| `password_resets` | user_id    String | user → users (user_id) |
| `survey_questions` | — | survey → surveys (survey_id) |
| `temp_auth_tokens` | user_id    String | — |
| `token_blacklist` | user_id    String | user → users (user_id) |

### 1.4 Root, auth, reference and unresolved models (7 models)

| Model | Current schema fields | Phase 30 classification / required follow-up |
|---|---|---|
| `companies` | — | Tenant-local company root. Every route must bind `id` to authenticated `companyId`; do not assume tenant DB routing alone isolates companies. |
| `lwf_rules` | — | Global reference/catalog data candidate. Confirm admin-only mutation and read-only tenant access; do not allow tenant-controlled global writes. |
| `otp_store` | — | OTP records are now namespaced by immutable Central tenant UUID inside `identifier` (Phase 30 source fix). No structural tenant FK; a future versioned migration should add explicit tenant/company columns if baseline/adoption permits. |
| `portal_urls` | — | Global reference/catalog data candidate. Confirm admin-only mutation and read-only tenant access; do not allow tenant-controlled global writes. |
| `pt_slabs` | — | Global reference/catalog data candidate. Confirm admin-only mutation and read-only tenant access; do not allow tenant-controlled global writes. |
| `sync_conflict_logs` | — | Unclassified. No tenant/company/user key or relation. Identify whether feature is live; if tenant data is stored, add explicit tenant/company identity before enabling in shared public storage. |
| `system_logs` | — | System log candidate. No structured tenant/company key. Confirm sensitive metadata is redacted and tenant-originated events carry immutable tenant/company identity in structured fields. |

### 1.5 Company root

| Model | Root key | Required rule |
|---|---|---|
| `companies` | `id` | Must equal authenticated operational `companyId`; tenant DB routing is not a substitute where multiple companies share one operational schema. |

## 2. Central database inventory

The Central Prisma schema contains **17 models**. All 17 tables have explicit RLS enabled and policies represented in both `backend/db-migrations/20261128_central_rls_policy_completion.sql` and `backend/prisma/central_schema.sql`; static parity is tested by `backend/test/central-rls-policy-parity.test.js`.

### 2.1 Tenant-context tables

| Model | Tenant ownership key | Policy intent |
|---|---|---|
| `backup_config` | `company_id` | Tenant context or platform-admin context |
| `tenant_db_config` | `company_id` | Tenant context or platform-admin context |
| `tenant_modules` | `tenant_id` | Tenant context or platform-admin context |
| `central_user_index` | `company_id` | Tenant context or platform-admin context |
| `tenant_branch_links` | `tenant_id` | Tenant context or platform-admin context |
| `tenant_pricing_configs` | `tenant_id` | Tenant context or platform-admin context |
| `invoices` | `tenant_id` | Tenant context or platform-admin context |
| `payment_orders` | `tenant_id` | Tenant context or platform-admin context |
| `billing_events` | nullable `tenant_id` | Tenant context for non-null tenant rows; platform-admin for global/system rows |
| `company_documents` | `tenant_id` | Tenant context or platform-admin context |

### 2.2 Platform/global-control tables

| Model | Classification | Policy intent |
|---|---|---|
| `tenants` | Tenant registry/control plane | Platform-admin only |
| `central_kyc_records` | Cross-tenant deduplication/security records | Platform-admin only |
| `central_gst_records` | Shared GST lookup cache | Platform-admin only |
| `platform_settings` | Global platform configuration | Platform-admin only |
| `payment_webhook_events` | Global webhook idempotency ledger | Platform-admin only |
| `company_document_reviews` | Central review workflow | Platform-admin only |
| `tenant_migration_jobs` | Central migration control plane | Platform-admin only |

## 3. RLS implementation findings

- `withTenantRLS` and `withPlatformAdminRLS` set transaction-local PostgreSQL context and execute the callback within the same Prisma transaction.
- Source search found the principal Central call-sites in auth, tenant routing, setup middleware, platform registration/admin, subscription/payment, brand/document review, backup and billing logging. Current reviewed runtime call-sites predominantly use the helpers; script/seed/migration tools remain separately classified as operator-only.
- The `tenants` policy is platform-admin-only. Tenant self-service Free/Trial activation currently uses `withPlatformAdminRLS` but derives the tenant UUID from authenticated token identity and constrains operations by that UUID. This is an intentionally privileged path, not a tenant-context RLS path; it remains a review item because any future missing predicate would have broad impact.
- A static policy test is not proof of the deployed Central role. Production role owner/superuser/BYPASSRLS state and catalog policy state require a DBA-generated report. No live DB access was performed.

## 4. Composite same-company FK feasibility

Many child models carry only a parent UUID (e.g. `employee_id`) and reference a parent's `id`; they do not carry `company_id`. A same-company composite FK generally requires either:
1. adding and backfilling a child `company_id` then creating a unique parent key on `(id, company_id)` and a child FK on the same pair; or
2. a suitable direct parent chain with a composite key at each ownership boundary.

This cannot be safely generated from the Prisma schema alone. Before DDL, inventory duplicate/orphan/mismatched parent-child rows in a disposable copy, design nullable/global-row treatment, estimate lock/validation cost, and prepare rollback/forward-fix. This Phase 30 inventory authorizes no migration.

## 5. Remaining audit work

- Query-by-query review of every service/controller/raw SQL/background worker/report/export/WebSocket/admin path.
- Runtime tests with two companies in one shared operational database and two tenants in shared public storage.
- Confirm `sync_conflict_logs`, `system_logs`, `temp_auth_tokens`, `portal_urls`, nullable global `roles` and nullable `audit_logs` semantics.
- Review all employee-owned child models for company-bound parent lookups and composite FK candidates.
- Build disposable PostgreSQL catalog tests for table ownership, grants, RLS enable/force state and role attributes.
- Keep HRMS-D-004 In Progress until these checks pass.
