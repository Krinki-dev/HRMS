# Syntern HRMS — Source Audit and Migration Impact Register

**Status:** Working audit; findings are based on source files inspected on branch `architecture/postgres-tenant-isolation`.
**Purpose:** Record concrete implementation risks before changing production application code.
**Architecture baseline:** PostgreSQL only; Free/Trial tenants share tenant operational tables in public; every Paid plan receives its own PostgreSQL schema; dedicated database/instance is an optional Enterprise isolation tier. Client-hosted PostgreSQL is supported as an offline deployment mode. Hybrid synchronization is a separate feature and must not be represented as connection fallback.

## 1. Executive assessment

The repository already contains substantial PostgreSQL and schema-per-tenant groundwork, but the current implementation does **not yet enforce the approved plan-to-storage lifecycle**. Registration, billing, schema provisioning, connection resolution, and deletion are implemented as separate paths with inconsistent assumptions. The safest next step is to centralize tenant storage provisioning and transitions, then migrate callers to that service behind explicit lifecycle states.

No application code or database migrations were changed as part of this audit. This document is a source-grounded impact register, not a claim that the identified defects have been fixed.

## 2. Confirmed findings

### F-01 — Tenant database resolver still supports multiple database engines

**Evidence:** `backend/shared/middleware/tenant.js` (`buildLocalConnectionString`); `backend/modules/platform/platform.service.js` (`buildLocalUrl`, `resolveTenantDbUrl`).

Both resolvers branch for MySQL, SQL Server, and SQLite as well as PostgreSQL. The tenant registry schema also retains `local_db_type`. This conflicts with the approved PostgreSQL-only direction and leaves multiple URL formats and provider behaviors in runtime code.

**Impact:** A PostgreSQL-only product can still attempt unsupported provider paths; configuration and validation can disagree between the middleware and lifecycle service.

**Required change:** Define one PostgreSQL connection contract, validate URLs/host/port/database/schema centrally, and remove legacy provider branches only after a compatibility/migration path is documented for any existing non-PostgreSQL tenant.

### F-02 — Hybrid mode is failover, not synchronization

**Evidence:** `backend/shared/middleware/tenant.js`, `resolveTenantDB`, case `hybrid`.

The current code tests the local connection and, if unavailable, selects the tenant cloud URL. It does not reconcile records, resolve conflicts, queue offline writes, or guarantee bidirectional synchronization.

**Impact:** Calling this behavior “hybrid sync” would be misleading and risks divergent datasets when local and cloud databases have both accepted writes.

**Required change:** Until a real synchronization engine exists, label this behavior as connection failover (or disable the hybrid mode). A future sync feature needs an explicit replication model, durable outbox/change log, conflict policy, retry/idempotency rules, observability, and recovery procedures.

### F-03 — Tenant schema provisioning is incomplete and not atomic with registration

**Evidence:** `backend/modules/platform/platform.service.js`, `registerTenant`; `backend/shared/utils/dbSchema.js`, `cloneSchema`.

Registration inserts the tenant and central metadata first, then attempts schema cloning. Clone errors are logged and swallowed; the central tenant's schema name is subsequently updated regardless. Seeding is also caught and logged, and registration can return success with `setupReady: false`.

The clone helper copies table definitions using `LIKE ... INCLUDING ALL` and creates sequences separately. It does not demonstrate a complete migration-based provisioning of all database objects (including validated foreign-key/trigger/view/function/extension/default/sequence ownership requirements).

**Impact:** A tenant may exist in central metadata while its target schema is incomplete or unseeded. A later request may resolve to a schema that is not ready.

**Required change:** Introduce a durable tenant lifecycle state (for example: `pending_provisioning`, `provisioning`, `active`, `provisioning_failed`) and an idempotent provisioning job. Provision with versioned Prisma migrations rather than copying a live schema. Mark active only after schema migration, seed, connectivity, and isolation checks all pass. Registration must return a pending state if provisioning is asynchronous.

### F-04 — Paid-plan schema allocation is not wired to the payment/plan transition

**Evidence:** `backend/modules/platform/platform.service.js`, registration initializes new tenants with `plan = 'free'`, then updates to `trial'`; `backend/prisma/central.prisma` stores plan/db mode/schema metadata; `backend/modules/platform/payment.controller.js` contains payment verification and invoice update paths; `backend/modules/platform/subscription.controller.js` contains trial activation.

The inspected registration path provisions schemas based on `db_mode` (`cloud` or `external_cloud`), not based on the plan being Paid. The payment controller's invoice-payment paths update invoice payment status, but the reviewed code does not show a single transactional subscription-upgrade workflow that provisions and verifies the dedicated paid schema before granting the paid plan.

**Impact:** The approved policy (“every Paid plan gets its own schema”) is not yet represented as a single enforceable state transition.

**Required change:** Add an idempotent upgrade orchestrator: verify authoritative payment event → lock/validate subscription transition → provision a dedicated PostgreSQL schema → migrate and copy tenant data → verify row counts/integrity/access → atomically activate paid plan and schema routing. Keep the tenant on its prior valid state if any stage fails. Do not activate paid entitlements merely because an invoice status changed.

### F-05 — Payment verification and gateway callbacks need hardening before they trigger provisioning

**Evidence:** `backend/modules/platform/payment.controller.js`.

The inspected Razorpay invoice verification path validates a signature and updates the invoice status in a separate operation. It rejects an already-paid invoice, but the read/check/update sequence is not shown as one conditional atomic transition. The PhonePe callback updates an invoice by ID after signature validation; the inspected handler does not verify that the invoice's expected amount, currency, tenant, and pending status match the callback before marking it paid. The JioPay handler itself describes its endpoint/checksum flow as a scaffold/placeholder and derives an invoice number by splitting the transaction ID.

**Impact:** Duplicate or replayed callbacks, amount/reference mismatches, and race conditions need to be addressed before a webhook can trigger tenant migration or entitlement changes.

**Required change:** Persist gateway event identifiers with unique constraints; validate signature using the provider's current documented scheme; verify invoice ID, tenant, amount, currency, gateway order/transaction reference, and allowed status; use an atomic conditional update/transaction; make callback processing idempotent; record rejected and accepted events. Treat JioPay as non-production until its actual provider contract is implemented and verified.

### F-06 — RLS helpers use transaction-scoped context correctly, but raw tenant lookups bypass those helpers in some paths

**Evidence:** `backend/shared/utils/rlsContext.js`; `backend/db-migrations/20260606_rls_and_function_fix.sql`; `backend/test/rls-tenant-isolation.test.js`; `backend/modules/platform/platform.service.js`.

The RLS helper correctly executes `SET LOCAL` and the protected query inside the same Prisma transaction. The test documents the failure of a bare `SET LOCAL` outside a transaction. However, the tenant lifecycle service performs several direct `centralPrisma.$queryRaw` / `$executeRaw` operations against RLS-protected central tables without visibly wrapping them in `withTenantRLS` or `withPlatformAdminRLS`. Whether those operations succeed depends on the database role/policy configuration and must be tested against the deployed role.

**Impact:** Registration and lifecycle operations may fail closed under RLS, or may rely on a privileged database role that weakens the intended boundary.

**Required change:** Inventory every central table access and classify it as tenant-scoped or platform-admin-only. Route all access through explicit transaction helpers or a narrowly scoped platform service. Add integration tests using the actual least-privilege runtime DB role, not a table-owner/superuser connection.

### F-07 — Tenant resolver has development fallbacks that can mask tenant-routing failures

**Evidence:** `backend/shared/middleware/tenant.js`, development branch.

When a requested tenant is absent from central metadata or database resolution fails, development middleware falls back to `DEV_TENANT_DATABASE_URL`. This is convenient for local development but can make a bad tenant configuration appear to work against a different dataset.

**Impact:** Tests may pass while the selected tenant schema is missing or incorrectly configured; accidental cross-tenant test data use is possible.

**Required change:** Make fallback explicit and opt-in (for example, only for a reserved local `dev` host/subdomain). For a recognized tenant whose lookup or connection fails, return a clear error rather than silently routing to the development database.

### F-08 — Tenant deletion can drop the entire public schema

**Evidence:** `backend/modules/platform/tenantDeletion.service.js`, `wipeTenantDatabase`.

If `schemaName` is null, the deletion helper drops and recreates the `public` schema. This is unsafe when multiple tenants share one PostgreSQL database and the target tenant has no schema name, or when metadata is incomplete.

**Impact:** A tenant deletion can destroy shared application tables and other tenants' data.

**Required change:** Make destructive deletion fail closed unless the target storage identity is positively verified. For shared mode, delete only rows scoped to the tenant and never drop `public`. For dedicated-schema mode, validate schema name against a strict identifier allowlist and verify it is owned by the target tenant. Require backup verification and a separate deletion approval; use a maintenance job with audit trail.

### F-09 — Database URL resolution is duplicated and inconsistent

**Evidence:** `backend/shared/middleware/tenant.js` and `backend/modules/platform/platform.service.js`.

There are separate local URL builders, separate decryption heuristics, and separate cloud fallback logic. The middleware supports modes and fallback behavior that differ from the lifecycle service.

**Impact:** The same tenant can be provisioned with one URL but routed to another; encryption/decoding behavior can diverge.

**Required change:** Create one tested PostgreSQL tenant connection resolver used by registration, request routing, background jobs, backup, upgrade, and deletion. Never log full connection strings; mask host/database and redact credentials.

### F-10 — Tenant setup spans central and tenant databases without a recoverable workflow

**Evidence:** `backend/modules/platform/platform.service.js`, `registerTenant`.

Central tenant row, modules, user index, and pricing config are inserted in a transaction, but schema cloning and tenant seeding happen afterwards. Failures do not roll back the central registration and no durable retry/job state is visible in the inspected function.

**Impact:** Partial onboarding is possible, and operators need manual intervention to identify and repair incomplete tenants.

**Required change:** Use a durable provisioning state machine and job/outbox record in central PostgreSQL. Every step must be idempotent and resumable; expose safe admin status/retry operations and retain an audit record.

## 3. Approved target storage policy

| Tenant lifecycle / plan | Storage target | Isolation |
|---|---|---|
| Free | Shared PostgreSQL public schema | Tenant/company key + authorization; RLS where applicable |
| Trial | Same public schema as Free | Same as Free |
| Any Paid plan | Dedicated PostgreSQL schema | Schema-level isolation; enforce company scope and authorization inside schema |
| Enterprise add-on (optional) | Dedicated PostgreSQL database/instance | Infrastructure-level isolation |
| Client-hosted/offline | PostgreSQL on client/Syntern-managed local infrastructure | Dedicated deployment boundary; offline operation |
| Hybrid sync | Not enabled until actual synchronization is implemented | Explicit replication and conflict model required |

**Important design clarification:** “Free/Trial shared tenant tables” and “Paid dedicated schema” must be expressed consistently in the Prisma model and connection resolver. The current tenant Prisma client is generated from one schema with a schema parameter; Prisma model migrations and schema routing must be tested against this arrangement before rollout.

## 4. Implementation sequence and release gates

### Phase A — Storage contract and lifecycle model
- Define canonical deployment/storage fields and allowed combinations.
- Decide how the existing `db_mode`, `schema_name`, `db_url`, and local DB columns map to the new contract.
- Add lifecycle state, schema version, provisioning operation ID, and last error/status fields.
- Add constraints and indexes; prepare a compatibility migration.
- Gate: schema design reviewed; no production data touched.

### Phase B — One PostgreSQL resolver and provisioning service
- Centralize PostgreSQL URL construction, encryption/decryption, schema selection, pool caching, and validation.
- Replace clone-based provisioning with versioned migrations.
- Implement idempotent create/upgrade/retry/verify operations.
- Gate: repeated provisioning is safe; invalid/partial states fail closed.

### Phase C — Subscription upgrade orchestration
- Normalize payment gateway events and persist idempotency keys.
- Verify provider event and invoice details before processing.
- Provision paid schema and copy tenant data with validation.
- Switch routing and paid entitlements only after verification.
- Gate: duplicate callbacks and interrupted upgrades do not duplicate or lose data.

### Phase D — Request isolation and central RLS
- Inventory all Prisma and raw SQL accesses to central tables.
- Require explicit RLS context for tenant/admin operations.
- Tighten dev fallback behavior.
- Gate: cross-tenant integration tests pass with least-privilege PostgreSQL roles.

### Phase E — Safe deletion, backup, and offline deployment
- Remove any possibility of dropping `public` in shared mode.
- Verify tenant storage identity before destructive actions.
- Define offline PostgreSQL install, backup, restore, upgrade, and support procedures.
- Keep hybrid sync out of scope until a true sync engine is designed and tested.
- Gate: restore drill and destructive-operation safety tests pass.

## 5. Minimum acceptance tests

1. Free and Trial tenants route only to shared storage and cannot select another tenant's records.
2. Every Paid plan gets a dedicated schema; two paid tenants cannot resolve to the same schema.
3. A paid upgrade interrupted at each provisioning step can be safely retried.
4. A duplicate payment webhook cannot double-activate, double-invoice, or re-run migration destructively.
5. A payment callback with wrong amount, currency, invoice, tenant, or provider reference is rejected.
6. Tenant schema provisioning creates all objects required by the current Prisma migration set and seeds the tenant exactly once.
7. A recognized tenant with a missing schema fails closed; it never falls back to the dev database.
8. Tenant deletion in shared mode never drops `public` or shared tables.
9. Tenant deletion in dedicated-schema mode cannot drop another tenant's schema.
10. RLS tests pass using the actual application database role, including concurrent requests for different tenants.
11. Client-hosted PostgreSQL works without a cloud connection for the documented offline feature set.
12. Hybrid mode is not advertised as synchronized until offline writes, reconnect, conflict resolution, retries, and recovery are all tested.

## 6. Source files in the first audit pass

- `backend/modules/platform/platform.service.js`
- `backend/shared/middleware/tenant.js`
- `backend/shared/utils/dbSchema.js`
- `backend/shared/utils/rlsContext.js`
- `backend/db-migrations/20260606_rls_and_function_fix.sql`
- `backend/test/rls-tenant-isolation.test.js`
- `backend/modules/platform/payment.controller.js`
- `backend/modules/platform/subscription.controller.js`
- `backend/modules/platform/tenantDeletion.service.js`
- `backend/prisma/schema.prisma`
- `backend/prisma/central.prisma`

## 7. Validation boundary

This pass inspected repository source through GitHub. It did not execute Node tests, Prisma validation, migrations, or a live PostgreSQL integration test. Those are required before any production implementation is treated as verified. No local PC files were accessed or changed.
