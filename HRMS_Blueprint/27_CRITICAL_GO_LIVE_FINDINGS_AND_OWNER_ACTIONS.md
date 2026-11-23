# Critical Go-Live Findings and Owner Actions

**Review branch:** `architecture/postgres-tenant-isolation`  
**Review date:** 2026-11-24  
**Scope:** Read-only source inspection of tenant registration, payment activation, backup, deletion, tenant routing, and server startup.  
**Safety:** This review did not connect to a database, run migrations, change tenant records, execute application code, or modify customer data. It does not certify production readiness.

## Executive assessment

The PostgreSQL tenant-storage foundation is documented and has initial pure configuration/resolution helpers, but the existing application lifecycle is not yet safe to switch to the new shared-free/trial and paid-dedicated-schema policy. The highest-priority blockers are:

1. **Permanent deletion can erase data belonging to other tenants.** The deletion path drops the configured schema, or drops/recreates `public` when no schema is present. A shared schema such as `shared_tenants` must never be dropped for one tenant.
2. **The backup fallback can report a tiny JSON note as a successful backup.** That is not a restorable PostgreSQL backup and must never authorize permanent deletion.
3. **Subscription verification trusts a request-supplied `mock` flag.** The shown handler skips gateway verification whenever this flag is truthy; no environment-only restriction is visible in this handler.
4. **Registration can report success despite schema-clone or tenant-seed failure.** It writes a schema name after a failed clone and continues after seed errors.
5. **Subscription activation updates the plan but does not provision or transition tenant storage lifecycle metadata.** Payment success is therefore not proof that the paid tenant's dedicated schema is ready.

These findings require remediation and tests before production migration, paid-plan activation, or destructive tenant operations are enabled.

## Findings

### P0 — Tenant deletion is unsafe for shared-schema tenancy

**Source:** `backend/modules/platform/tenantDeletion.service.js`, especially `wipeTenantDatabase` and `permanentlyDeleteTenant`.

Observed behavior:
- If `schemaName` is present, the code executes `DROP SCHEMA IF EXISTS "<schema>" CASCADE`.
- If it is absent, it drops and recreates `public`.
- Permanent deletion resolves a tenant URL, runs the mandatory-backup wrapper, calls the wipe function, then deletes central registry rows.
- The readiness query reads `db_mode` and `schema_name`, but does not classify shared versus dedicated storage tier before deletion.

Impact:
- If multiple free/trial tenants share `shared_tenants`, deleting one tenant could drop the shared schema and destroy every tenant's data in it.
- If a shared database tenant has no schema assignment, dropping `public` could erase unrelated application data.
- The current confirmation check for external/local modes does not protect shared-schema tenants.

Required remediation:
- Add an explicit deletion guard based on validated storage tier and lifecycle metadata.
- For shared-schema tenancy, delete only rows belonging to the target tenant inside a transaction, using a reviewed tenant-data deletion plan; never drop the shared schema.
- Permit schema drop only for a positively verified dedicated schema, after verifying schema ownership/assignment and a completed restorable backup.
- Prohibit the `public` fallback for tenant deletion.
- Add tests proving that deleting one shared tenant cannot issue any schema/database DROP statement and cannot affect another tenant.

**Owner attention:** Do not run permanent tenant deletion until this is fixed and independently tested.

### P0 — Backup fallback is not a real backup

**Source:** `backend/shared/utils/backupService.js`, `createDump` (lines 29–80 in the reviewed file).

Observed behavior:
- PostgreSQL backup invokes `pg_dump ... | gzip > file`.
- On command failure, the catch block creates a compressed JSON document containing a note that `pg_dump` was unavailable.
- The fallback returns a normal-looking file path, filename, and nonzero size.
- The mandatory deletion backup wrapper checks `result.success` and `result.skipped`; it does not independently validate that the artifact is a complete, restorable database dump.

Impact:
- A JSON note can be mistaken for a completed backup and may allow deletion to proceed without a restorable copy.
- A shell pipeline can also obscure the dump command's exit status unless pipe failure is explicitly propagated and validated.

Required remediation:
- Remove the JSON-as-backup fallback. If PostgreSQL dump tooling is missing or fails, backup must fail closed.
- Use argument-safe process spawning (no interpolated shell command), capture exit status, and validate nonzero artifact size and expected dump format.
- Record checksum, database/schema scope, timestamp, and backup tool version.
- Before destructive deletion, require a successful restore-validation result, not merely an uploaded file URL.
- Add tests for missing `pg_dump`, failed dump, truncated dump, upload failure, and restore-validation failure.

**Owner attention:** Confirm which backup destination and restore-validation environment should be supported (Google Drive, OneDrive, or both). No provider credential is needed in chat.

### P0 — Subscription verification can skip payment verification using request input

**Source:** `backend/modules/platform/payment.controller.js`, `verifySubscription` (approximately lines 860–1097).

Observed behavior:
- The handler reads `mock` from `req.body`.
- Gateway signature/status verification runs only inside `if (!mock)`.
- The visible handler does not enforce that mock mode is enabled only in a local/test environment.
- After that branch, the handler updates the tenant plan and creates a paid invoice snapshot.
- Plan activation updates `plan`, expiry, and employee cap, but does not provision or validate the target storage schema or set the new storage lifecycle fields.
- No payment-event idempotency key or atomic transaction spanning payment reference, plan activation, and invoice creation is visible in this handler.

Impact:
- If the route is reachable with ordinary tenant permissions, a client may be able to submit a truthy `mock` value and bypass gateway verification. Route-level authorization and environment configuration must be reviewed as part of the fix.
- Repeated verification requests may create duplicate subscription invoices or inconsistent activation state unless guarded elsewhere.
- A paid plan can be activated while the storage lifecycle remains unclassified or unready.

Required remediation:
- Remove client-controlled mock bypass. Mock payments must be enabled only by a server-side, non-production configuration and a dedicated test-only path.
- Verify the provider transaction against a server-created order/payment record; validate amount, currency, tenant, plan, and transaction ownership.
- Add unique idempotency constraints and process payment, subscription state, and invoice creation atomically.
- Transition storage lifecycle only through a provisioning workflow: pending → provisioning → ready (or failed), and activate the paid tenant only when required isolation is verified.
- Add negative tests for forged mock flags, wrong tenant/order/amount, invalid signatures, replayed callbacks, and partial failures.

**Owner attention:** Confirm whether any production or staging route currently exposes mock payment mode. Do not send payment secrets.

### P0 — Tenant registration continues after provisioning failures

**Source:** `backend/modules/platform/platform.service.js`, tenant registration flow (approximately lines 230–420).

Observed behavior:
- The central tenant record is inserted before tenant schema provisioning.
- Schema cloning errors are logged and swallowed.
- The code then updates `schema_name` to the intended schema name regardless of clone success.
- Tenant seed failures are logged and swallowed; the flow continues to construct the portal/login URL.
- The registration insert does not set the new `storage_tier` and `storage_status` fields, so database defaults may leave the row in a legacy/unclassified state.
- The code derives `tenant_<subdomain>` rather than using the UUID-based schema naming policy in the new configuration helper.

Impact:
- A tenant can appear registered even though its schema or initial admin data was not created.
- Metadata can claim a schema exists when it does not.
- Registration and the new lifecycle resolver can disagree about schema naming and storage classification.

Required remediation:
- Make registration a stateful provisioning workflow with explicit pending/provisioning/ready/failed outcomes.
- Do not publish a usable tenant portal or mark setup complete until schema creation, schema verification, seed, and connectivity checks all pass.
- Use the approved UUID-based schema naming helper for paid dedicated schemas and the approved shared schema for free/trial.
- Set storage tier/status explicitly in the central tenant insert.
- Add compensation/retry behavior for partially-created central records and tenant schemas; never silently swallow provisioning failure.

### P1 — Existing tenant routing still supports legacy engines and hybrid fallback

**Source:** `backend/shared/middleware/tenant.js`.

Observed behavior from source inspection:
- Runtime routing still contains MySQL/MSSQL/SQLite branches and legacy `local`/`hybrid` modes.
- Hybrid is implemented as connection fallback between local and cloud URLs; it is not bidirectional data synchronization.
- Development resolution can fall back to the development tenant database after a tenant lookup/resolution failure.
- Production resolution currently routes based on `db_mode`, `db_url`, and `schema_name`, not the new validated storage descriptor.

Required remediation:
- Keep legacy routing behind a controlled compatibility boundary while inventory and migration are incomplete.
- Do not silently map a failed tenant connection to another tenant or development database.
- Wire the new resolver only after legacy tenant records are classified and integration tests cover every supported mode.
- Reject hybrid as a new allocation until a genuine synchronization design exists.

### P1 — Server startup does not yet prove the new storage architecture is operational

**Source:** `backend/server.js`.

Observed behavior:
- Startup validates selected JWT/encryption environment variables and initializes MinIO.
- The server mounts tenant middleware for all `/api/v1` routes before platform and subscription routes.
- There is no visible startup validation that checks tenant storage metadata schema compatibility, resolver readiness, or PostgreSQL-only deployment constraints.

Required remediation:
- Add explicit startup checks for PostgreSQL configuration and central schema compatibility.
- Keep health/liveness separate from readiness; readiness should fail if required storage services or schema versions are not usable.
- Ensure graceful shutdown disconnects all cached tenant and central Prisma clients.

## Owner / user attention required

The following items require your access, decision, or execution. They are intentionally separated from work that can be done safely in GitHub.

| Priority | Your action | Why it is needed |
|---|---|---|
| P0 | Run the read-only tenant inventory SQL on the intended central PostgreSQL environment and share only its sanitized output | Needed to classify real tenant records; source code alone cannot establish current live storage assignments |
| P0 | Confirm which environment is being assessed: local test, staging, or production | Determines whether mock payment paths and destructive operations are exposed |
| P0 | Confirm the supported backup destination(s): Google Drive, OneDrive, or both | Needed to finalize backup and restore-validation implementation |
| P0 | Confirm that no one will use permanent tenant deletion until the shared-schema deletion guard and backup validation are fixed | Prevents irreversible cross-tenant data loss |
| P1 | Provide a safe test environment or run the guided commands locally for PostgreSQL/Prisma validation | GitHub file access cannot execute the app, migrations, or database tests |
| P1 | After inventory, approve the tenant-by-tenant classification and any migration window | Classification must be based on observed schema/data and backup evidence, not plan labels alone |
| P1 | Keep `.env` local and rotate any values that were real, reused, or granted external access | Prevents accidental credential exposure; no secrets should be sent back in chat |

## Work that can proceed without your access

1. Prepare isolated fixes and regression tests for the deletion guard, backup fail-closed behavior, and payment mock bypass.
2. Build a registration provisioning state machine and tests without connecting it to a live database.
3. Add static checks and CI workflows for JavaScript syntax, Prisma schema validation, and unit tests where the repository's existing CI environment permits.
4. Continue the source audit for raw SQL, database-specific assumptions, tenant context propagation, and unsafe fallback behavior.
5. Update architecture documents so legacy multi-engine and hybrid claims are clearly marked as deprecated, without changing production behavior prematurely.

## Validation limitations

This was a source-code review through GitHub. No Node test suite, Prisma generate/validate, migration, PostgreSQL query, backup, restore, payment gateway, or end-to-end test was executed. The findings are code-level risks to verify and remediate; they are not a statement that an exploit or data-loss event has occurred.

## Recommended next implementation order

1. Block unsafe tenant deletion and require real restore-validated backups.
2. Remove request-controlled payment mock bypass and add idempotent payment activation.
3. Make tenant registration fail closed on schema/seed errors and set storage lifecycle metadata.
4. Reconcile existing tenant records using the read-only inventory output.
5. Integrate the new resolver and run end-to-end isolation tests.
6. Only then plan production migration and enable paid dedicated-schema provisioning.
