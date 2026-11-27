# Cycle 01 — Fresh Source Audit (Phase 6: PostgreSQL RLS and Database Isolation)

- Audit ID: HRMS-C01-AUDIT-P6
- Repository: Krinki-dev/HRMS
- Branch: architecture/postgres-tenant-isolation
- Source SHA inspected: 8b99f8a40311d81f5e200700562effb06ced0255
- Date: 2026-11-27
- Status: In Progress — SQL policy inventory and test-role contract reviewed.
- Application code changed: No.

## 1. C01-DB-001 — Shared operational PostgreSQL schema has no demonstrated company/tenant RLS policy coverage

**Severity:** P0 — core SaaS data-isolation gate.

**Evidence:**
- backend/db-migrations/20260606_rls_and_function_fix.sql enables RLS for Central/platform tables such as tenant_modules, tenant_pricing_configs, invoices, tenant_branch_links, tenants, central_user_index, central_kyc_records, central_gst_records and platform_settings. It does not enable RLS on operational HR tables such as employees, attendance, leave_applications, payroll_runs, payslips, expense_claims, training records or assets.
- The newer Central SQL migrations enable policies for Central company_documents, company_document_reviews, payment_orders, central_kyc_records and tenant_migration_jobs. They are also Central/platform tables, not operational HR table policies.
- A repository-wide scan of the SQL migration files listed in the current tree found no operational HR-table RLS policy migration.
- backend/test/README.md explicitly states the payroll integration test relies on company_id as the only isolation boundary and that there is no per-company RLS at that level.
- backend/test/README.md describes an RLS integration test only for Central public.tenant_modules and warns that table owners/superusers bypass RLS by default.
- The current Backend Tests workflow does not set RLS_TEST_APP_DATABASE_URL, AUTH_TEST_CENTRAL_DATABASE_URL, PAYROLL_TEST_TENANT_DATABASE_URL or COMPLIANCE_TEST_TENANT_DATABASE_URL. Those tests therefore skip in that workflow unless configured elsewhere.

**Impact:** Free/Trial tenants are intended to share the operational public schema. Without a complete operational RLS policy set and a verified least-privilege runtime DB role, one missing company_id predicate in any service query can expose or mutate another company's HR data. Existing company filters are useful defense-in-depth but do not meet the frozen shared-schema RLS gate.

**Required direction:**
1. Build a complete table inventory from the operational Prisma schema and classify each table as direct company-owned, dependent through validated foreign keys, global reference, or ambiguous.
2. Design and review tenant/company RLS policies for every tenant-owned operational table, including child tables and composite/nullable foreign keys.
3. Decide the exact PostgreSQL session context contract. Do not assume Central tenantId and operational companyId are interchangeable.
4. Create a dedicated non-owner application DB role with only required grants; verify it cannot bypass RLS. Never test RLS as postgres/table owner and treat that as passing.
5. Add real disposable-PostgreSQL cross-company and cross-tenant CRUD tests for reads, inserts, updates, deletes, joins, bulk operations and background jobs.
6. Verify the production connection role before enabling Free/Trial shared-schema customer traffic.

**Acceptance tests:** The same operational database contains fixtures for at least Company A and Company B. Under the actual application role, every table/operation denies cross-company reads and writes with missing or mismatched context; platform/admin flows are explicit and separately tested; test logs prove the role is not table owner/BYPASSRLS.

## 2. C01-DB-002 — Existing RLS integration tests are not part of the standard backend CI run

**Severity:** P1 — release verification gap.

**Evidence:**
- backend/test/README.md documents the RLS test requires RLS_TEST_APP_DATABASE_URL and a non-owning role.
- The same README documents separate database URL requirements for auth, payroll and compliance integration tests.
- backend/.github/workflows/backend-tests.yml runs npm test without those environment variables.
- backend/.github/workflows/tenant-migration-integration.yml provisions PostgreSQL but runs only tenant-migration-inventory.integration.test.js, not the operational RLS/auth/payroll/compliance suites.
- frontend-build.yml does exist and runs the frontend production build on frontend changes; there is no browser E2E workflow in the current workflow inventory.

**Required direction:** Add isolated PostgreSQL services/roles and configure each DB integration suite in CI. Report test counts and skipped tests; CI must fail if a required suite is unintentionally skipped. Keep the tenant migration inventory job accurately described as inventory integration, not proof of applying tenant migrations.

## 3. Positive Central RLS implementation observations

- shared/utils/rlsContext.js provides transaction-scoped Central RLS helpers. The protected query runs in the same transaction in which the session context is set.
- The current Central migrations use explicit tenant_id or platform-admin predicates for several Central tables.
- These controls are not substitutes for operational HR table RLS and do not prove that every Central query uses the helper.
- The effective Central and operational database connection roles still need verification against the actual deployment configuration.

## 4. Audit status

This phase adds GAP-0030 and GAP-0031 to the master register. The shared-schema operational RLS gate remains open. No database migration was applied and no live DB role was changed.
