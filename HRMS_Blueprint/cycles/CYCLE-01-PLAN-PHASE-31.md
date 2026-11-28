# Cycle 01 Phase 31 — explicit operational-company identity selection

**Date:** 2026-11-28 (Asia/Kolkata)  
**Task:** HRMS-D-003 — explicit tenant selection and identity binding  
**Finding:** GAP-0068 — same email can exist in multiple operational companies inside one tenant  
**Branch:** `architecture/postgres-tenant-isolation`

## 1. Exact continuation and evidence

Phase 30 full re-analysis discovered a residual not represented by Central workspace selection:
- Operational `users` has `@@unique([company_id, email])`, allowing the same email in multiple operational companies.
- Central `central_user_index` is unique by `[email, company_id]`, where its `company_id` is the Central tenant UUID; it cannot distinguish multiple operational company memberships inside that tenant.
- Password login, OTP login and forgot-password currently query operational users by email without an operational company ID.

This is an identity correctness/security issue. The Phase 30 OTP tenant namespace fixes cross-Central-tenant OTP collisions but does not solve within-tenant company ambiguity.

## 2. Proposed contract

1. Resolve/select the Central tenant workspace first (existing Phase 24 behavior).
2. Within that selected tenant DB, resolve active operational user memberships for the normalized email.
3. If exactly one operational company matches, it may be selected automatically.
4. If more than one company matches, require explicit selection of the operational `companyId`; never use `findFirst` to choose.
5. Bind the selected `companyId` to password login, OTP send/verify, forgot-password/reset-token, access/refresh tokens and WebSocket ticket identity.
6. On tenant subdomains, the verified request tenant remains authoritative; a body tenant mismatch is rejected. Company selection remains separate.
7. Return only the minimum company identifier/name fields needed for selection, with existing IP rate limiting and generic responses for unknown users.

## 3. Implementation scope

- Add a rate-limited company-membership lookup for a selected tenant/email.
- Update SmartLogin UI to select an operational company when multiple active user rows exist.
- Update password login service to require and verify companyId; ambiguous requests fail closed.
- Update OTP identity namespace to include Central tenant UUID + operational company UUID + normalized email. Require same companyId on send and verify.
- Update forgot-password UI and route to select/validate companyId and use the matching user record in the selected tenant DB.
- Preserve separate tenantId/companyId claims and ensure refresh/WebSocket context continues to validate both.
- Add regression tests for same email in two companies, wrong-company selection, cross-tenant/company mismatch and no arbitrary first-row fallback.

No database schema migration is expected for the initial source correction; existing user rows already carry `company_id`. Any future Central index schema change requires a separate migration plan.

## 4. Acceptance criteria

- Same email in two Central tenants requires explicit tenant selection (existing).
- Same email in two operational companies within one tenant requires explicit company selection.
- Password login never selects an arbitrary user by email.
- OTP record identity is scoped to tenant + operational company + email.
- OTP cannot be verified in another tenant or company.
- Forgot-password token is stored for the explicitly selected company user and email delivery uses the same tenant DB.
- Access/refresh token tenantId and companyId remain distinct, signed and validated.
- Tenant host/body mismatch and company membership mismatch are rejected.
- Unknown user/company paths retain generic responses and do not expose credentials or account status.
- Tests prove A/B company isolation inside one shared public schema.

## 5. Tests

- Service unit tests for one-company auto-selection and multi-company ambiguity.
- Route tests for missing, forged and mismatched companyId.
- Password-login and OTP integration tests with two companies sharing one email.
- Forgot-password tests proving reset record user_id belongs to selected company.
- Existing tenant-selection, OTP tenant namespace, refresh binding and password-reset tests.
- Backend CI and frontend build at exact head; authenticated browser E2E for tenant + company selection.

## 6. Safety

- Source-only implementation on working branch.
- No production/customer DB, schema migration, DDL, deployment, real payment, deletion, credential change or customer-data operation.
- `main` untouched.


---

## Phase 31 design correction — Central membership mapping constraint (2026-11-28)

The initial proposal to enumerate all operational `users` rows by email was rejected during implementation review: the Free/Trial public schema is shared across tenants and operational `users` has no Central tenant_id. Querying all rows by email would disclose or accept company identities belonging to other SaaS tenants.

Safe source behavior now uses the selected tenant's `central_user_index.user_id` as the anchor, then loads that exact operational user and validates its `company_id`. Login, OTP and forgot-password do not select an arbitrary operational user by email. OTP identity includes Central tenant UUID + operational company UUID + normalized email.

**Architecture blocker:** `central_user_index` is unique on `(email, company_id)`, where `company_id` is the Central tenant UUID. It can currently map only one operational `user_id` for a given email/tenant. It cannot represent multiple operational company accounts with the same email inside one tenant. A new Central membership mapping (for example, tenant_id + operational company_id + user_id + normalized email) and a backfill/adoption plan are required. That work depends on HRMS-D-005 migration-baseline design and must not be improvised in this source-only phase.

Therefore:
- Existing indexed single-company membership is now resolved safely and explicitly.
- The new UI is prepared to display company choices, but the current Central mapping returns at most one company.
- Same-email multiple-company selection remains **Open / Blocked on schema mapping**, not complete.
- Do not query the shared operational users table by email to fabricate company choices.
