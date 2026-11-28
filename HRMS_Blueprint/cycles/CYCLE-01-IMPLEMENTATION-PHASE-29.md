# Cycle 01 Implementation Phase 29 — password-reset workspace binding

**Date:** 2026-11-28 (Asia/Kolkata)  
**Working branch:** `architecture/postgres-tenant-isolation`  
**Task:** `HRMS-D-003` — explicit tenant selection and identity binding  
**Finding:** `GAP-0065` — ambiguous multi-tenant password-reset workspace selection  
**Prior code checkpoint:** `2254f855b884deb51f7f7783d6acae17fd6523c3`

## 1. Recovery and source audit

Resumed exactly from the Phase 28 handoff. The active task was the remaining forgot-password path, not a restart of the completed login/refresh work.

Inspected:
- `backend/modules/auth/auth.routes.js`
- `backend/modules/auth/auth.service.js`
- `backend/shared/utils/tenantSelection.js`
- `backend/test/tenant-selection.test.js`
- `frontend/src/pages/auth/ForgotPasswordPage.jsx`
- `frontend/src/pages/auth/SmartLoginPage.jsx`

Confirmed defect:
- Forgot-password used an unordered `LIMIT 1` lookup against `central_user_index` when no request tenant was present.
- The fallback could choose an arbitrary workspace for an email with multiple memberships.
- It also looked up the user/reset record through `req.db` while the email delivery client could be switched to a different tenant database. That could place the reset token and email in different workspace contexts.

## 2. Plan verification / scope

The verified Cycle 01 plan already assigns explicit workspace selection and identity binding to `HRMS-D-003`. This Phase 29 increment clarified the acceptance criteria to include forgot-password selection and token/email database consistency.

**Process note:** The scope clarification should have been written and re-verified before implementation. It was reviewed retrospectively in the Phase 29 verification addendum. No architecture decision, production safety gate or owner decision was changed.

## 3. Implementation

Files changed:
- `backend/modules/auth/auth.routes.js`
- `backend/shared/utils/passwordResetWorkspace.js` (new)
- `backend/test/password-reset-workspace.test.js` (new)
- `frontend/src/pages/auth/ForgotPasswordPage.jsx`

Behavior now intended by the source:
1. Resolve the eligible Central workspace choices for the normalized email.
2. Use the verified request tenant on a tenant subdomain, or require an explicit workspace selection when multiple memberships exist.
3. Reject body-selected tenant IDs that conflict with the request tenant.
4. Never select the first Central membership as a fallback.
5. Resolve the selected tenant's operational database.
6. Create the password-reset record and send the reset email using the same selected tenant database.
7. Keep the generic confirmation response for unknown/invalid membership to avoid exposing account existence.
8. On the public forgot-password page, show a workspace selector when the email has multiple eligible memberships; clear a previous selection if the email is edited.

The implementation remains source-only. No production DB, customer DB, migration, deployment, payment, credential or destructive operation was performed.

## 4. Regression tests added

`backend/test/password-reset-workspace.test.js` covers:
- one eligible workspace auto-selection;
- ambiguous multi-workspace membership requiring selection;
- explicit membership selection;
- tenant-subdomain request context;
- body/request tenant mismatch rejection;
- invalid workspace rejection;
- route guard against unordered `LIMIT 1`;
- reset token creation and email delivery using the same active tenant DB.

**Execution status:** Tests were added and committed, but execution against the repository's installed dependencies and GitHub Actions is **Pending / Not Verified** in this report. Do not mark GAP-0065 verified closed until exact-head CI and the applicable auth tests pass.

## 5. Commits

- Helper: `3a6a8f8d388c28346fb139a5f307afa1c7102328`
- Regression tests: `ffca840d666112c3bcf63bdb08f86b0e24ce3be7`
- Backend route fix: `1b3bc154b44b9bb796aaa7d6ce810ea5c01eea34`
- Frontend workspace chooser: `2891a1107b66a754d7319dda0d43604465416272`
- Clear stale selection when email changes: `e644c3b5e233257c1359ed53b2daef4a1aa9dd5d`

## 6. Verification status

- Static source review: **Implemented — Unverified**.
- New unit/regression test execution: **Pending**.
- Backend CI exact-head result: **Pending / Not Verified**.
- Frontend build exact-head result: **Pending / Not Verified**.
- Real email delivery and authenticated password-reset E2E: **Not Run**.
- Live database verification: **Not Run**.
- Production readiness: **Not claimed**.

The available GitHub Actions connector does not expose push-triggered run listing in this session; the commit-specific workflow-run method only returns PR-triggered runs. The combined commit status query returned no status entries, which is not evidence of a pass. Re-check Actions directly for the final branch SHA.

## 7. Full re-analysis and carry-forward

- `HRMS-D-003` remains **In Progress** until exact-head CI and login/OTP/refresh/password-reset E2E evidence are complete.
- `GAP-0065` moves from the known source defect to **Fixed — Awaiting Verification** only after confirming the committed source; closure remains blocked on test execution and E2E.
- The reset token and email now share one selected tenant DB in the route implementation; verify with mocked route-level tests and authenticated browser E2E.
- Resume `HRMS-D-004`: complete the remaining operational model/query ownership matrix, composite same-company FK feasibility review, and prepare a non-production evidence path for Central role/catalog checks.
- Do not connect to production, run migrations, deploy or mutate customer data without explicit owner approval.

## 8. Safety record

- `main` was not modified.
- No production/customer DB connection or SQL was executed.
- No migration, deployment, real payment, deletion, credential change or customer-data mutation was performed.
