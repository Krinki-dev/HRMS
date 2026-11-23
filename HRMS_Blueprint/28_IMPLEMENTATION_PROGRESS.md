# PostgreSQL Tenant Isolation — Implementation Progress

**Branch:** `architecture/postgres-tenant-isolation`  
**Updated:** 2026-11-24

## Implemented in source (runtime validation pending)

### 1. Fail-closed permanent deletion guard
- Physical deletion is now disabled entirely until a verified restore drill and tenant-ownership audit are enforced. A successful upload/backup alone cannot authorize data destruction.
- Permanent deletion now requires storage status `ready` and tier `dedicated_schema`.
- Shared schemas are explicitly blocked from schema-drop deletion.
- Legacy/unclassified, pending, provisioning, failed, and malformed storage metadata are blocked.
- Dedicated schema name must match `tenant_<tenant UUID without hyphens>`.
- Dedicated-database deletion is blocked until a separate database-level deletion workflow exists.
- The old `public` schema drop/recreate fallback is no longer reachable through the permanent-deletion path.
- Added pure unit tests for the guard.

### 2. PostgreSQL backup fail-closed behavior
- Removed the JSON note masquerading as a successful SQL backup.
- PostgreSQL dump runs with argument-safe process spawning rather than an interpolated shell pipeline.
- Dump output is gzip-compressed in Node streams.
- Nonzero `pg_dump` exit, missing executable, empty output, or invalid gzip header fails the backup.
- Optional URL `schema` parameter scopes the dump to that schema.
- Non-PostgreSQL backup types are rejected under the approved PostgreSQL-only architecture.

**Validation limitation:** gzip header and nonempty size are basic artifact checks, not a restore test. Permanent deletion still needs a restore-validation gate before production use.

### 3. Payment mock bypass
- A request-supplied `mock` value now receives an authorization error.
- Payment verification no longer skips gateway verification based on client input.
- Invoice payment references no longer synthesize a mock payment ID.
- Razorpay verification now requires order/payment/signature values and a configured server secret.
- PhonePe and JioPay require transaction IDs and their server-side verification credentials.
- Unsupported payment methods are rejected.

**Remaining payment work:** server-created order/payment records, amount/currency/tenant/plan binding, webhook idempotency, and atomic activation remain to be implemented.

### 4. CI
- Added a GitHub Actions workflow to install backend dependencies, explicitly generate both Prisma clients, and run `npm test` on the working branch and relevant pull requests.
- GitHub Actions backend test runs #19 and #20 completed successfully, including dependency installation, generation of both Prisma clients, and `npm test`.

### 5. Registration activation gate (partial)
- New tenant rows are inserted inactive.
- Cloud/external-cloud registration must complete schema cloning and admin seeding before the tenant is activated and marked setup-complete.
- Missing database target, clone failure, or seed failure leaves the tenant inactive and returns a provisioning error.
- Legacy schema naming remains temporarily in this path until the central lifecycle migration and tenant classification are ready; this is not yet the final shared-versus-dedicated allocator.

### 6. Stage 2: storage isolation and migration alignment
- Fixed the central schema's PostgreSQL `DO $ ... END $;` block.
- Aligned read-only inventory checks with `storage_error_code`, the lifecycle column in both Prisma and SQL.
- Classified dedicated-schema routing now requires a UUID-derived schema name, not just a syntactically valid name.
- Tenant-specific backup is restricted to ready, UUID-owned dedicated schemas; shared and legacy tenants fail closed until a separate audited backup implementation exists.
- Permanent deletion now fails with `RESTORE_VERIFICATION_REQUIRED` before attempting a backup or schema drop. This intentional stop remains until an independently verified restore-and-approval workflow is implemented.
- Added tests for backup targeting and schema ownership.
- GitHub Actions has reported successful runs on earlier branch commits; newest commits require their own completed run.

## Not yet implemented / not approved for production
- Full registration provisioning state machine, retry/compensation, and UUID-based schema allocation.
- Storage lifecycle migration alignment and application.
- Tenant resolver integration into request middleware.
- Existing-tenant classification and schema collision remediation.
- Restore-validation workflow and deletion approval gate (permanent deletion currently intentionally disabled).
- Payment idempotency and server-side order validation.
- Full PostgreSQL integration and tenant-isolation end-to-end tests.

## Safety
No database migration, live schema change, customer-data deletion, backup execution, or payment transaction was performed as part of these commits. GitHub source writes do not constitute runtime validation.


## 2026-11-24 follow-on corrections
- Corrected the read-only inventory to check the exact lifecycle columns defined by the migration: `storage_verified_at` and `storage_error_code`.
- Removed the now-unused Prisma client import from the deletion service after disabling physical deletion.
- Added explicit Prisma client generation to CI because dependency installation uses `--ignore-scripts`.
- Confirmed the storage resolver remains intentionally unwired to tenant request routing. Existing tenant rows are still unclassified in the live central database, and the live lifecycle migration has not been applied.
- Confirmed the current schema-cloning helper is incomplete for production-grade cloning: it does not fully reproduce foreign keys, triggers, views, functions, policies, and other schema objects. It must be replaced or formally constrained before it can be trusted to mark a tenant provisioned.


## Verified CI result
- Workflow: **Backend Tests**
- Runs: **#19 and #20**
- Result: **success**
- Successful steps: checkout, Node.js setup, `npm ci --ignore-scripts`, generation of tenant and central Prisma clients, and `npm test`.
- This validates the source state at commits `32cd598` and `669e939`. Documentation-only follow-up is newer; it does not change executable code.
