# Tenant storage resolver — implementation note

## What this stage adds

A side-effect-free resolver converts an already-classified central tenant record into a PostgreSQL connection target. Free and Trial customers resolve to the tenant operational database's `public` schema; each Paid customer resolves to its UUID-derived dedicated schema. It is deliberately separate from Express middleware and does not create schemas or connect to PostgreSQL.

## Fail-closed behavior

- A legacy/unclassified tenant is rejected with `TENANT_STORAGE_UNCLASSIFIED`.
- Pending, provisioning, and failed storage states are not routable.
- Cloud mode requires a tenant URL or the configured platform cloud PostgreSQL URL.
- External-cloud mode requires a configured URL and an injected decryption function.
- Local mode is deliberately blocked in this stage; local PostgreSQL credential construction needs its own validated implementation.
- Hybrid mode and all non-PostgreSQL URLs are rejected for classified new storage.
- Schema-tier mismatches are rejected; the resolver never silently changes the tenant's schema.

## Files

- `backend/shared/utils/tenantStorageResolver.js`: pure resolver for ready storage targets.
- `backend/test/tenant-storage-resolver.test.js`: tests for ready, unclassified, pending, invalid, and unsupported targets.

## Why it is not wired into tenant middleware yet

Existing tenant records have not been audited and classified. Connecting this resolver now would block those tenants. The current middleware also contains development fallbacks that can route requests to a shared dev database after resolution errors. Those fallbacks must be removed only after we have a verified inventory and a safe migration/rollback plan.

## Next gates

1. Build a read-only legacy tenant inventory report (plan, db_mode, db_url presence, schema_name, and lifecycle metadata; never print secrets).
2. Design a reviewed classification map without writing tenant rows.
3. Implement PostgreSQL schema provisioning with advisory locking, ownership/grants, migration execution, and verification.
4. Only then integrate the resolver into middleware behind a controlled rollout switch.
5. Add an integration test proving tenant A cannot resolve tenant B's schema or data.

## Validation

The tests are committed but have not been run in this GitHub-only environment. No customer data, tenant records, or live routing have been changed.
