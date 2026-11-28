# Cycle 01 Source Audit — Phase 21: Authentication Identity and Encryption Decision Reconciliation

**Date:** 2026-11-28 (Asia/Kolkata)  
**Repository:** `Krinki-dev/HRMS`  
**Branch:** `architecture/postgres-tenant-isolation`  
**Scope:** Revalidation of frozen security decisions against current frontend auth persistence, encryption key handling, and multi-tenant email resolution.

## 1. Executive summary

Phase 21 rechecked security decisions recorded in the frozen-decision log against current source.

Two findings remain:
- The shared encryption helper still has a hard-coded fallback key. Server startup validates the production environment key, but scripts/workers or other direct helper consumers can still import the module without that startup gate and silently derive a key from the public fallback.
- Email lookup and tenant resolution both use unordered `LIMIT 1` queries on `central_user_index.email`, although the schema permits one email to be associated with multiple tenants through a unique `(email, company_id)` pair. The lookup API returns a single subdomain instead of asking the user to select among matching tenant accounts.

One older security concern is corrected:
- Current `authStore.js` excludes `accessToken` from Zustand persistence. It keeps the token in memory, removes a legacy standalone token during logout/rehydration, and clears a legacy persisted token on migration. The old frozen-decision note claiming the current auth store still persists accessToken is stale and must be corrected.

## 2. Evidence inventory

| File | Blob SHA | Evidence |
|---|---|---|
| `frontend/src/store/authStore.js` | `8f380553166bc2418917e856217ac7d624aacaa1` | Zustand `partialize` persists profile/UI fields but omits accessToken; migration and rehydration clear legacy token |
| `frontend/src/services/api.js` | `b732d492ff4754d82b599f7181b7a76f60cf0052` | Authorization header reads accessToken from in-memory auth store |
| `backend/shared/utils/encryption.js` | `1fd621755053f93c7d70d8de941d792822d3cb0f` | `RAW_KEY` falls back to a literal source-code key |
| `backend/server.js` | `8a412ffed98826379fc832ea90b99c8ff97a9097` | Production environment validation requires JWT/encryption configuration during server startup |
| `backend/modules/auth/auth.service.js` | `676e5b0fb0b7af43bcf6ce4efe62d0cb8d7cb33a` | `lookupEmail` and `resolveTenantDb` select one matching central_user_index row with unordered LIMIT 1 |
| `backend/modules/auth/auth.routes.js` | `78e014fa55480c79ca3eadde719fcd72098354d6` | Auth lookup returns one subdomain to the frontend |
| `backend/prisma/central.prisma` | `0591ffa909e4e432d0ae326f4f7888ffafcb3eeb` | central_user_index uniqueness is scoped to `(email, company_id)`, not email alone |
| `HRMS_Blueprint/07_FROZEN_DECISIONS.md` | `974a3ca25133c41129f703fb34c39186434fc147` | Explicit security decisions: memory-only access token, no static encryption key, explicit tenant choice for multi-tenant email |

## 3. Findings

### GAP-0064 — Encryption helper silently falls back to a hard-coded key

**Severity:** P1  
**Status:** Open — source-confirmed unsafe fallback; production use of fallback not established

Evidence:
- `encryption.js` sets `RAW_KEY = process.env.ENCRYPTION_KEY || 'hrms_32char_key_change_in_prod!!'`.
- The derived AES-256-GCM/CBC key is created at module import time from that value.
- The main server has a production environment validation path requiring an encryption key. That reduces the likelihood of the fallback being used by a correctly started production API server.
- Direct scripts, maintenance workers, test helpers or any process importing `encryption.js` outside the validated server bootstrap can still silently use the literal fallback.
- No production secret value or evidence of ciphertext encrypted under the fallback was inspected.

Impact:
- Any sensitive data encrypted by a process using the fallback key is decryptable by anyone with source access.
- Different environments may silently encrypt/decrypt with different keys, causing data loss or insecure compatibility behavior.

Required remediation:
1. Remove the literal fallback completely; throw during module initialization if ENCRYPTION_KEY is absent or invalid.
2. Validate key configuration in every process entrypoint, including scripts and workers.
3. Preserve existing ciphertext compatibility only through an explicitly versioned key/codec migration plan.
4. Add tests proving missing/invalid keys fail closed and GCM authentication rejects tampering.
5. Never run `backend/scripts/migrate-pii-encryption.js` until its incompatible ENC format is replaced with a migration using the current shared codec, as already frozen in the decision log.

### GAP-0065 — Multi-tenant email lookup resolves an arbitrary tenant

**Severity:** P1  
**Status:** Open — source-confirmed identity ambiguity; cross-tenant data exposure not demonstrated

Evidence:
- `central_user_index` allows multiple rows for one email because its uniqueness is `(email, company_id)`.
- `auth.service.js:lookupEmail` queries all active matching email rows and uses unordered `LIMIT 1`.
- `auth.service.js:resolveTenantDb` repeats the same pattern to select one tenant index row.
- `auth.routes.js:handleAuthLookup` returns one subdomain to the client; it does not return the set of matching tenant accounts or require an explicit company selection.
- The frozen decision log explicitly requires tenant selection for an email associated with multiple tenants.

Impact:
- A person who legitimately belongs to more than one customer workspace can be routed to an arbitrary workspace.
- Authentication may fail against the wrong tenant or bind the session to an unintended tenant context.
- This undermines the explicit tenant/company identity contract and can become a cross-tenant security issue if later checks trust the selected identity.

Required remediation:
1. Make lookup return a safe list of matching tenant choices (or require an explicit subdomain/workspace identifier).
2. Bind login, OTP, refresh and user-index lookup to the chosen immutable Central tenant UUID.
3. Never infer a tenant by arbitrary row order.
4. Add tests where the same email exists in two tenants, including login, OTP, refresh, company switch, inactive tenant and platform-admin cases.
5. Ensure JWT tenantId and operational companyId remain distinct and are validated together.

## 4. Positive control and stale-document correction

**Access token memory-only rule is currently implemented in source:**
- Zustand persist `partialize` includes `isLoggedIn`, user profile and branding only; it does not include `accessToken`.
- `updateToken` updates in-memory Zustand state.
- `api.js` reads the token from the in-memory store when attaching the Authorization header.
- Rehydration clears any legacy token and removes the old standalone `accessToken` localStorage key.

Therefore the old note in `07_FROZEN_DECISIONS.md` saying the current authStore still persists accessToken is stale. The requirement remains frozen; this implementation should be kept and protected by a regression test.

## 5. Phase 21 completion boundary

Completed:
- Revalidated access-token storage behavior.
- Revalidated encryption helper key fallback and server startup validation.
- Revalidated multi-tenant email lookup against Central schema uniqueness.
- Added GAP-0064 and GAP-0065.

Not performed:
- No app code changed.
- No credentials/secrets accessed or changed.
- No production database, auth flow, browser, test, migration or deployment was executed.
- No evidence was obtained that the production environment actually uses the fallback key or has duplicate email memberships.

**Next:** finish reconciling all open gaps and frozen decisions, then create the Cycle 01 P0/P1 plan and an independent plan-verification report. Keep `main` untouched.
