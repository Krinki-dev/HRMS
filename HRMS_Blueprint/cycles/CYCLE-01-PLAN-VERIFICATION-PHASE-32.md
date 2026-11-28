# Cycle 01 Phase 32 Plan Verification — Central tenant-company membership mapping

**Date:** 2026-11-28 (Asia/Kolkata)  
**Plan:** `CYCLE-01-PLAN-PHASE-32.md`  
**Outcome:** **Verified for design-only work**

## Independent review

- [x] The design addresses the proven gap between Central tenant identity and operational company identity.
- [x] It does not assume Central tenantId exists on shared operational public-schema rows.
- [x] It does not use email-only enumeration to infer tenant ownership.
- [x] It uses immutable tenant_id + operational_company_id + operational_user_id mapping.
- [x] It explicitly states that operational IDs cross a DB boundary and cannot use cross-database foreign keys.
- [x] Tenant RLS is defined around transaction-local app.current_tenant, with platform-admin access separated.
- [x] It requires non-owner/non-superuser/non-BYPASSRLS tests and a deployed-role DBA report.
- [x] Legacy null user_id and ambiguous rows fail closed; no automatic guess/backfill is authorized.
- [x] Conditional uniqueness constraints are identified as owner/product-contract dependent, not frozen without evidence.
- [x] No DDL, migration, live database, deployment or customer-data operation is included.

## Open decisions before DDL

- Whether one operational user can belong to multiple companies.
- Whether one operational company can be associated with multiple Central tenants.
- Membership approval, suspension, transfer and revocation lifecycle.
- Trusted source and authority for ambiguous legacy backfill.
- Whether existing central_user_index.user_id remains as a compatibility pointer.

**Verified:** The design document may be used as the input to D-005 migration-baseline design. It does not authorize schema changes or production rollout.
