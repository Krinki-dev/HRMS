# Cycle 01 Phase 31 Plan Verification — HRMS-D-003 / GAP-0068

**Date:** 2026-11-28 (Asia/Kolkata)  
**Plan:** `CYCLE-01-PLAN-PHASE-31.md`  
**Outcome:** **Verified for source-only implementation**

## Independent review

- [x] Finding is directly supported by current Prisma schema: `users` uniqueness is `(company_id, email)`, not global email uniqueness.
- [x] Central `central_user_index.company_id` represents Central tenant identity; it is not the operational `companies.id` key.
- [x] Current password login, OTP login and forgot-password query paths were inspected and use email without operational company binding.
- [x] Explicit company selection is consistent with frozen tenantId/companyId separation and the owner's multi-company tenant model.
- [x] Ambiguous memberships fail closed; no unordered `findFirst` fallback is allowed.
- [x] The plan keeps Central tenant selection separate from operational company selection.
- [x] OTP namespace includes both tenant and company identity, preventing cross-company as well as cross-tenant collisions.
- [x] Password-reset token user and email-delivery database are bound to the selected company/tenant.
- [x] Minimal lookup data and rate limiting are retained; no credential or sensitive employee fields are exposed.
- [x] No production DB, migration, deployment, payment, destructive operation or customer-data mutation is included.

## Verification constraints

- This is a source-only contract verification. It does not claim that company selection is implemented.
- Existing Phase 30 OTP tenant-only namespace remains a partial correction until Phase 31 extends it to include companyId.
- Exact-head CI and authenticated E2E remain mandatory before HRMS-D-003 or GAP-0068 can close.
- HRMS-D-004 ownership matrix work resumes after identity binding is made unambiguous.

**Verified:** Phase 31 source implementation may proceed on `architecture/postgres-tenant-isolation`. No owner business decision is changed or inferred beyond the already frozen multi-company model and distinct tenant/company identifiers.


---

## Re-verification correction — shared-schema membership safety (2026-11-28)

The initial verification assumed operational company choices could be enumerated from the selected tenant database. Source review showed that Free/Trial tenants share the same public operational schema and the operational user/company tables do not carry Central tenantId. An email-only query there could return another SaaS tenant's company IDs. That approach is rejected.

Revised verified source contract:
- Resolve the exact operational user through Central `central_user_index.user_id` filtered by selected Central tenant UUID + normalized email.
- Bind companyId to the resolved user's operational `company_id`.
- Use that identity for password login, OTP send/verify and forgot-password.
- Never enumerate shared public operational users by email alone.

**Scope status:** Safe source-only identity binding is authorized. Full same-email multi-company selection is **Blocked** until a Central tenant-user-company membership schema and migration/backfill plan are designed under HRMS-D-005. This is not a pass for GAP-0068 or full HRMS-D-003.
