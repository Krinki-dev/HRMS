# Cycle 01 Phase 32 — Central tenant-company membership mapping design

**Date:** 2026-11-28 (Asia/Kolkata)  
**Task:** HRMS-D-005 — canonical PostgreSQL migration baseline  
**Related:** HRMS-D-003 / GAP-0068  
**Scope:** design and verification only; no schema implementation

## Objective

Design a safe Central mapping that binds a SaaS tenant to one or more operational company/user identities, so the same email can be represented across multiple operational companies without querying the shared public operational schema by email alone.

## Deliverables

1. Proposed table, columns, keys, indexes and RLS policy in `CYCLE-01-CENTRAL-TENANT-COMPANY-MEMBERSHIP-DESIGN-PHASE-32.md`.
2. Verified login/OTP/password-reset lookup contract.
3. Deterministic legacy backfill rules and explicit handling of ambiguous/null user_id rows.
4. Disposable PostgreSQL test matrix for uniqueness, RLS, cross-tenant isolation and idempotent backfill.
5. Owner decisions required before DDL: whether one operational user can belong to multiple companies; whether a company can link to multiple Central tenants; membership lifecycle and legacy reconciliation authority.

## Acceptance criteria

- Central tenantId and operational companyId remain separate first-class IDs.
- One email can map to multiple operational companies inside one tenant.
- No Central tenant can read or write another tenant's membership rows under the application role.
- No cross-database foreign key is assumed for operational company/user IDs.
- Legacy rows with null/ambiguous user_id are not guessed; they remain pending until verified.
- Backfill is idempotent and auditable.
- Existing auth flows do not fall back to email-only lookup in shared public storage.
- No DDL, migration or production action occurs in Phase 32.

## Tests to design

- Same email in two tenants.
- Same email in two companies in one tenant.
- Wrong tenant/company/user tuple.
- Revoked/suspended membership.
- RLS non-owner isolation.
- Legacy null user_id and duplicate rows.
- Backfill retry/idempotency and partial failure.

## Safety

Documentation/design only on the working branch. No production/customer DB, SQL, DDL, migration, deployment, payment, deletion, credential change or customer-data operation. `main` untouched.
