# Cycle 01 Phase 33 — Forgot-password resolver argument correction

**Date:** 2026-11-28 (Asia/Kolkata)  
**Task:** HRMS-D-003 / GAP-0068 adjacent auth hardening  
**Status:** Source correction committed; runtime verification pending

## 1. Finding

The helper in `backend/modules/auth/auth.routes.js` is declared:

```js
async function resolveCompanyForEmail(activeDb, tenantId, email, requestedCompanyId = null)
```

The forgot-password handler passed only three arguments in the wrong positions:

```js
resolveCompanyForEmail(activeDb, normalizedEmail, requestedCompanyId)
```

This passed the email as the Central tenant ID, the optional company ID as the email, and omitted the normalized email. The identity resolver therefore could not correctly normalize and resolve the intended user identity. The existing source test checked that the helper name was present but not the complete ordered argument list.

## 2. Implementation

- Corrected the call to `resolveCompanyForEmail(activeDb, tenantId, normalizedEmail, requestedCompanyId)`.
- Added a focused regression assertion to `backend/test/auth-company-selection.test.js` that checks the exact ordered argument list inside the forgot-password handler.
- Preserved the Central-indexed `user_id` anchor and operational `company_id` verification.
- Preserved same-selected-tenant database use for reset-token creation and reset-email delivery.
- Did not add any shared-public operational `users` lookup by email.

## 3. Commits

| Change | Commit |
|---|---|
| Phase 33 plan | `b544101883c09a92b9c51def7dedc7747d10d219` |
| Plan verification | `28ef6aa14826eb114ba6b2f73f964f1777494348` |
| Route argument correction | `3ea6243b82d7233cace326d55e4525263af720aa` |
| Regression assertion | `5fcb3f7d36bcc392cb5f14837ac6aee2dbb82d45` |

## 4. Verification evidence and limitations

Post-commit source re-fetch confirmed:
- Corrected four-argument call is present.
- Old three-argument call is absent from the forgot-password handler.
- Regression assertion is present.
- Exact-user/company lookup and same-tenant reset-token path remain present.

This was source-level inspection only. The Node test runner, full backend test suite, frontend build, exact-head GitHub CI and authenticated forgot-password E2E were not run/verified in this session. Do not mark the test as passed or close the gap until execution evidence is recorded.

## 5. Disposition

- **GAP-0069 (P1):** Fixed in source — Awaiting Verification.
- **HRMS-D-003:** remains In Progress.
- **GAP-0068:** remains Open / Blocked on Central tenant-user-company mapping and trusted legacy backfill. This Phase 33 fix does not implement multi-company membership.
- **HRMS-D-004:** remains In Progress; query-by-query ownership audit still pending.
- **HRMS-D-005:** remains Blocked on the canonical PostgreSQL migration baseline and owner decisions.

## 6. Safety

Only source and documentation files were changed on `architecture/postgres-tenant-isolation`. No DB connection, SQL, DDL, migration, deployment, payment, credential change, destructive operation or customer-data mutation occurred. `main` was not modified.
