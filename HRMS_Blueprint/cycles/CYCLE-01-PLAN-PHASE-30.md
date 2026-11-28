# Cycle 01 Phase 30 — Central/operational ownership audit and OTP tenant binding

**Date:** 2026-11-28 (Asia/Kolkata)  
**Task:** HRMS-D-004 — shared-schema isolation and Central RLS verification  
**Related task:** HRMS-D-003 — explicit tenant identity and OTP/password-reset context  
**Working branch:** `architecture/postgres-tenant-isolation`

## 1. Exact continuation

Phase 29's handoff names HRMS-D-004 operational ownership/query matrix as the next workstream. Exact-head CI for Phase 29 is still unverified; it remains a separate verification gate and is not treated as passed.

## 2. Audit scope

1. Inventory all 82 operational Prisma models and classify their ownership key.
2. Inventory all 17 Central Prisma models and classify RLS ownership/policy intent.
3. Trace Central RLS helper call-sites in auth, tenant routing, platform, billing, backup, settings and KYC.
4. Review shared operational schema tables that lack a direct tenant/company key.
5. Review the OTP send/verify path in shared public storage.

## 3. Findings

### D4-F30-01 — OTP records are not tenant-namespaced (P1)

- `otp_store` has only `identifier`, `otp_hash`, `purpose`, attempts and expiry; no tenant/company key.
- The schema is shared by Free/Trial tenants in the public operational database.
- `sendOtp` stores the raw email as identifier; `verifyOtp` finds the latest OTP by raw email + purpose.
- Two tenants using the same email/purpose therefore share one OTP lookup namespace in shared public storage. The latest OTP can overwrite/interfere with the other tenant's login/reset OTP verification.
- Fix scope: namespace the existing identifier by immutable Central tenant UUID + normalized email in both creation and verification. This is source-only and requires no schema migration.
- Add tests proving the same email in different tenants maps to distinct OTP records and missing tenant context fails closed.

### D4-F30-02 — 82 operational model ownership inventory

The operational Prisma schema has 82 models:
- 33 carry `company_id` directly;
- 28 carry `employee_id` and must resolve ownership through the employee;
- 12 are child models with a parent relation and inherit ownership through that parent;
- 8 have no direct company/employee ownership key and require explicit classification;
- `companies` is the tenant-local root entity and must be selected by authenticated company ID.

This is a source-schema inventory, not proof that every service query is correctly scoped. Query-by-query audit and composite same-company FK feasibility remain open.

### D4-F30-03 — Central RLS call-site and role proof

- Current Central RLS helper uses transaction-local `set_config(..., true)` and runs the protected query in the same Prisma transaction.
- Current source inventory shows 17 Central models and matching RLS coverage in migration and fresh-install bootstrap; existing static parity test checks this.
- Tenant-owned Central rows use tenant context; global/control-plane tables are platform-admin-only.
- Runtime route call-sites, worker/scheduler contexts and application role ownership/BYPASSRLS need deeper verification. No live DB catalog or production DBA evidence is available.
- Some tenant self-service plan activation paths deliberately use platform-admin RLS because `tenants` policy is platform-admin-only. They derive the tenant UUID from the authenticated token and apply explicit tenant predicates. Record as a privileged path for continued review; do not silently change the frozen policy.

## 4. Proposed implementation

- Add `backend/shared/utils/otpIdentity.js` to construct a tenant-scoped OTP identifier.
- Use the helper consistently in OTP creation and verification.
- Pass the already resolved immutable Central tenant UUID into OTP verification.
- Add focused unit/source regression tests.
- Do not alter database schema, migrations, RLS policies, customer data, production configuration or deployment.

## 5. Acceptance criteria

- Same email + purpose in tenant A and tenant B yields different OTP identifiers.
- OTP send and verify use the same tenant-scoped identifier.
- Missing tenant context fails closed.
- Request body tenant mismatch remains rejected by the existing context resolver.
- Existing OTP attempt/expiry behavior remains unchanged.
- All 82 operational models and 17 Central models appear in the ownership inventory.
- Every unclassified/no-key operational model has an explicit owner follow-up.
- Central RLS is not described as production-verified; role/catalog DBA evidence remains pending.

## 6. Tests

- Unit tests for OTP identifier normalization, tenant isolation and missing tenant rejection.
- Static route/service regression test proving tenant ID is passed to verify and the same helper is used for send/verify.
- Run focused backend tests and full backend CI; exact-head GitHub Actions status must be captured before closure.
- No authenticated OTP E2E or live DB test is claimed unless executed.

## 7. Safety

- Working branch only.
- No migration or DDL.
- No production/customer DB connection.
- No deployment, payment, deletion, credential rotation or customer-data operation.
- `main` remains untouched.
