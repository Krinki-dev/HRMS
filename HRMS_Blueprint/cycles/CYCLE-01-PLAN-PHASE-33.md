# Cycle 01 Phase 33 — Forgot-password identity argument correction

**Date:** 2026-11-28 (Asia/Kolkata)  
**Task:** HRMS-D-003 / GAP-0068 — authentication identity binding  
**Status:** Plan only until verification is recorded

## 1. Source-verified finding

During a focused source trace of `backend/modules/auth/auth.routes.js`, the forgot-password handler calls:

```js
resolveCompanyForEmail(activeDb, normalizedEmail, requestedCompanyId)
```

The helper is declared as:

```js
resolveCompanyForEmail(activeDb, tenantId, email, requestedCompanyId = null)
```

The call therefore shifts the email into the `tenantId` parameter, the optional company ID into the `email` parameter, and omits the actual email. The resolver then attempts email normalization on the wrong value and cannot resolve the intended identity. This breaks the normal forgot-password path.

Evidence:
- `backend/modules/auth/auth.routes.js`: helper declaration and forgot-password handler.
- `backend/modules/auth/auth.service.js`: `resolveUserIdentity(db, tenantId, email, requestedCompanyId)`.
- `backend/test/auth-company-selection.test.js`: existing forgot-password source assertions do not verify the complete argument list, allowing this defect to escape.

## 2. Scope

1. Correct the call to pass `activeDb, tenantId, normalizedEmail, requestedCompanyId`.
2. Add a regression assertion that checks the exact ordered argument list inside the forgot-password handler.
3. Preserve fail-closed Central-index user identity resolution. Do not add any email-only lookup against the shared operational public schema.
4. Update the implementation report, progress log, audit evidence, gap register and handoff.

## 3. Acceptance criteria

- Forgot-password passes the selected Central tenant UUID, normalized email and optional operational company UUID in the helper's declared argument order.
- The regression test fails against the old call and passes against the corrected call.
- The existing exact user ID + company ID lookup and same-database reset-token/email flow remain unchanged.
- No schema, migration, database, production, customer-data, payment or deployment action is performed.
- Changes are committed only to `architecture/postgres-tenant-isolation`; `main` remains untouched.
- Test execution is reported accurately; source-level assertions are not represented as a full backend test run.

## 4. Verification plan

- Inspect the complete current handler and test before editing.
- Apply the minimal route correction and focused regression assertion.
- Run a local isolated test only if the exact repository files and dependencies are available; otherwise record source-level validation as not equivalent to executing Node's test runner.
- Re-fetch both committed files and confirm the exact call and assertion at the resulting commit.
- Check branch CI/status for the exact resulting HEAD; empty/unavailable results remain unverified.

## 5. Explicit exclusions

No DDL, migration, production/customer DB connection, deployment, payment transaction, destructive data operation, credential change, or change to `main`.
