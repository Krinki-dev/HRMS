# Cycle 01 Implementation and Verification — Phase 24: Explicit Tenant Selection and Session Binding

**Date:** 2026-11-28 (Asia/Kolkata)  
**Repository:** `Krinki-dev/HRMS`  
**Branch:** `architecture/postgres-tenant-isolation`  
**Task:** HRMS-D-003 — explicit tenant selection and identity binding  
**Protected branch:** `main` — untouched

## 1. Executive summary

Phase 24 advances HRMS-D-003 from source audit into implementation and automated regression coverage.

- Email lookup returns all active workspace memberships in stable order instead of selecting an arbitrary first row.
- A pure selector chooses a workspace automatically only when there is exactly one eligible row, or when the user explicitly selects one matching tenant UUID. Multiple memberships without a selection return no tenant.
- The login page presents a workspace chooser when an email belongs to multiple tenants.
- The selected Central tenant UUID is now sent in the login request body alongside the tenant subdomain header.
- When tenant middleware has already resolved a database, the backend rejects a body tenant UUID that does not match the resolved request tenant.
- New access and refresh tokens carry both Central `tenantId` and operational `companyId` identity.
- Refresh resolves a signed tenant claim directly rather than requiring a possibly incomplete `central_user_index.user_id` backfill. Legacy refresh tokens without a tenant claim are accepted only when an explicit request tenant exists or exactly one active membership can be resolved; otherwise the refresh cookie is cleared and workspace selection is required.
- Refresh also checks tenant and company identity mismatches before issuing rotated tokens.

## 2. Source evidence

| File | Current blob SHA | Evidence |
|---|---|---|
| `backend/modules/auth/auth.routes.js` | `83e2ec62697a667d466f75f11067bb5aafe45ccf` | Selected tenant body/header consistency, tenant-bound access/refresh tokens, refresh resolution and mismatch rejection |
| `backend/modules/auth/auth.service.js` | `65137120fc50b0504cd65c26e3dad14cafd2020f` | Email membership lookup, ready/active/deleted filters, stable ordering and explicit `chooseTenantRow` |
| `backend/shared/utils/tenantSelection.js` | `f3ae7a0652ab7ccd70603b65422f45ddf953e26b` | Deterministic single/explicit workspace selector; ambiguous membership returns null |
| `frontend/src/pages/auth/SmartLoginPage.jsx` | `b1a830ebb7adabb1e6429d31715711846468c323` | Workspace chooser and selected tenant UUID in password-login request |
| `backend/test/tenant-selection.test.js` | `b9a750003d20c1916ef8260b59155ab29d96d3d3` | Single membership, multiple membership, explicit selection, invalid and duplicate choice tests |
| `backend/test/auth-refresh-tenant-binding.test.js` | `593e7c202c54bf98e4f11525d136f05f7e1703a7` | Login selected UUID, mismatch rejection and refresh tenant/company binding regression checks |
| `backend/test/auth-provisioning-readiness.test.js` | `99502ff9e2eddc08396baf50f69c7c80e149ccc7` | Current lookup and tenant-resolution source invariants |

## 3. Behavior and acceptance review

### Workspace selection

- Lookup filters to active Central user-index rows and active, ready, non-deleted tenants.
- Results are ordered by company name and immutable tenant UUID.
- `chooseTenantRow` returns a tenant only if the result is unambiguous or the selected UUID matches exactly one result.
- Duplicate matching rows and unknown selections return null; there is no “first row” fallback.
- The frontend displays a workspace selection control for multiple memberships.

### Login request binding

- The frontend sends the selected tenant UUID and, where available, the tenant subdomain header.
- If tenant middleware resolves a request database, `getActiveContext` compares body tenantId with `req.tenant.id` and refuses mismatch.
- If the request is on a platform/root domain without an already resolved tenant DB, the backend uses the selected tenant UUID in `resolveTenantDb`, which validates UUID format and membership.

### Access and refresh session binding

- Access JWT includes Central tenant ID and operational company ID as separate claims.
- Refresh JWT includes the same identity pair and remains delivered as an httpOnly cookie.
- When the refresh request has a tenant context, a signed token tenant mismatch is rejected.
- When the refresh request has no DB context but the signed token contains a tenant claim, the backend resolves that exact tenant by UUID and verifies the active operational user/company.
- Legacy refresh tokens without a tenant claim require exactly one active Central user-index membership if no request tenant is already selected.
- The code no longer switches a platform-admin membership to the Central Prisma client and then queries a non-existent Central `users` model; tenant user lookup stays against the resolved operational database.

## 4. Automated verification

**Backend Tests passed**

- Workflow: Backend Tests
- Run: [46103861483](https://github.com/Krinki-dev/HRMS/actions/runs/46103861483)
- Tested commit: `3f495f016e8e56ecb6fc63770c836fc6e292ac7c`
- Result: success
- Tests discovered: 177
- Passed: 172
- Failed: 0
- Skipped: 5

**Frontend Build passed**

- Workflow: Frontend Build
- Run: [46103852916](https://github.com/Krinki-dev/HRMS/actions/runs/46103852916)
- Tested commit: `2b27b3c8a319f02a16b01f2fb9fd092d0cff380b`
- Result: success

**Tenant migration inventory integration passed**

- Workflow: Tenant Migration PostgreSQL Integration
- Run: [46103861464](https://github.com/Krinki-dev/HRMS/actions/runs/46103861464)
- Tested commit: `3f495f016e8e56ecb6fc63770c836fc6e292ac7c`
- Result: success
- This workflow ran the tenant migration inventory integration test. It is not evidence that Central RLS policy integration or the full operational schema migration is complete.

The tested commit is not the latest branch HEAD. Subsequent Central RLS test/documentation changes were still running CI at report time. Do not describe the entire current branch as green until the latest SHA's workflows complete.

## 5. Remaining risks and verification

- No live browser login with two real tenant accounts was performed.
- No live OTP flow was exercised; SmartLoginPage currently uses the password-login path in this flow.
- No real refresh-cookie HTTP flow was run against a database.
- Five backend tests remain skipped in CI; required PostgreSQL/RLS integration must not be assumed complete.
- Alternative phone and employee-ID lookup endpoints return workspace choices at source level, but their full UI journeys require separate E2E confirmation.
- The Central user-index backfill for older employee memberships should be assessed before legacy refresh tokens are retired. New signed tenant-bound refresh tokens do not depend on that backfill.

**Status:** HRMS-D-003 source implementation and regression tests are in place; automated backend and frontend checks passed at their recorded SHAs. Keep the task **Fixed — Awaiting end-to-end auth/refresh verification**, not Verified Closed.

## 6. Safety boundary

- No production database access, migration, deployment, real payment or customer-data operation.
- No production token revocation or user-index backfill.
- `main` untouched.
- All changes are on `architecture/postgres-tenant-isolation`.

**Next:** finish the latest Central RLS policy/bootstrap parity CI review, then proceed with D-004 table ownership and query-scoping audit. Do not run the new Central RLS completion migration against production; it requires DBA verification of app role ownership/BYPASSRLS and a verified backup first.
