# Syntern HRMS — File-by-File Implementation Blueprint

**Status:** Implementation plan prepared from source inspection; no application code changed in this stage.
**Working branch:** `architecture/postgres-tenant-isolation`
**Decision baseline:** PostgreSQL only. Free and Trial use shared tenant storage. Every Paid plan receives a dedicated PostgreSQL schema. Dedicated PostgreSQL database/instance is an optional Enterprise isolation add-on. Client-hosted PostgreSQL must support offline operation. Hybrid synchronization is deferred until it is a genuine synchronization system.

## 1. Purpose and delivery rule

This document converts the source audit into a controlled implementation plan. It identifies the first files to change, the order of dependencies, and the validation gates.

**Safety rule:** do not run a destructive migration, move customer data, switch live tenant routing, or merge this branch into `main` until:
- current deployment and database topology are inventoried;
- backups and a tested restore path exist;
- shared-storage tenant isolation is proven with the production-equivalent database role;
- the paid-schema provisioning and rollback path pass integration tests;
- the upgrade and deletion workflows are idempotent and fail closed.

The GitHub connector can read and commit source files but cannot run `npm test`, Prisma validation, migrations, or a PostgreSQL server. Those execution checks remain a required validation step on a runner or developer machine.

## 2. Target storage model

### 2.1 Storage tiers

| Plan / deployment | PostgreSQL target | Routing and isolation |
|---|---|---|
| Free | One shared tenant schema (initially the agreed shared application schema) | Every tenant-owned row must be scoped by immutable tenant/company identity; database RLS plus application authorization |
| Trial | Same shared schema as Free | Same isolation boundary as Free |
| Any Paid plan | One schema reserved for that tenant | Schema routing is assigned only after provisioning and verification |
| Enterprise isolation add-on | Optional dedicated PostgreSQL database/instance | Separate infrastructure credentials and backup/restore boundary |
| Client-hosted offline | PostgreSQL on client-owned or Syntern-provided local infrastructure | Standalone installation; cloud connectivity is not required for the documented offline feature set |
| Hybrid synchronization | Deferred | Must not be enabled until replication, outbox, conflict resolution, retry, replay and recovery are implemented |

### 2.2 Critical data-model distinction

The central tenant ID and the business `companies.id` are separate identifiers in the current registration code: `registerTenant` generates `tenantId` and later a separate `companyId`. The implementation must not assume they are interchangeable.

Before adding RLS to the shared business schema, establish one immutable mapping:
- central `tenants.id` identifies the SaaS tenant;
- business `companies.id` identifies the company record inside that tenant;
- every request has a validated mapping from authenticated tenant identity to the permitted company identity/identities;
- every tenant-owned business row is protected either by a direct company key or a validated parent relationship.

The current tenant Prisma schema has many `company_id` columns, but child tables often carry only `employee_id`, `attendance_id`, or another parent foreign key. A complete RLS design must cover these child tables too; enabling RLS only on models with a direct `company_id` is insufficient.

### 2.3 Migration strategy

Do not convert the existing Free/Trial tenant schemas into one shared schema by simply changing `schema_name` to `public`. That would not merge data, resolve identifier collisions, establish RLS, or validate foreign-key relationships.

Use a staged approach:
1. Inventory every existing tenant's actual database, schema, plan, row counts, and backup status.
2. Build and test the shared-schema RLS policy set against the complete tenant Prisma schema.
3. Build an idempotent tenant data mover that copies one tenant at a time into shared storage, preserving IDs where safe and detecting collisions.
4. Validate counts, relationships, unique constraints, files/URLs, and application access.
5. Switch one canary tenant with a reversible routing record.
6. Expand in controlled batches after monitoring.
7. Keep original storage read-only and recoverable until the agreed retention window expires.

Paid tenants remain in dedicated schemas; upgrades from Free/Trial require a controlled promotion/copy into a new dedicated schema.

## 3. File-by-file implementation register

### Workstream A — Canonical tenant storage contract

| File | Planned action | Reason / dependency |
|---|---|---|
| `backend/prisma/central.prisma` | Add explicit storage tier and provisioning lifecycle metadata; define valid plan/storage combinations; add durable provisioning operation/event model | Central source of truth for tenant routing and provisioning |
| `backend/modules/platform/platform.service.js` | Refactor registration to create a pending tenant and enqueue provisioning; stop cloning schema inline; do not return active/setup-ready until checks pass | Current function inserts central rows then attempts schema clone and seed outside that transaction |
| `backend/modules/platform/subscription.controller.js` | Keep trial activation on shared storage; validate tenant identity and avoid treating trial activation as a storage promotion | Free/Trial share the same tier |
| `backend/shared/utils/encryption.js` | Review encryption/decryption contract for stored DB credentials; standardize authenticated encryption, key rotation and failure behavior | Resolver and lifecycle services currently use different decrypt heuristics |
| New: `backend/shared/services/tenantStorage.service.js` | Implement the single storage lifecycle API: validate config, resolve target, provision, migrate, verify, promote, demote/suspend, and retire | Prevents duplicated lifecycle logic across controllers and jobs |

### Workstream B — PostgreSQL-only connection and routing

| File | Planned action | Reason / dependency |
|---|---|---|
| `backend/shared/middleware/tenant.js` | Replace multiple-engine URL builders with PostgreSQL-only validated resolver; route Free/Trial to shared schema and Paid to verified dedicated schema; remove unsafe recognized-tenant dev fallback | Current middleware supports MySQL/MSSQL/SQLite and falls back in ways that can mask routing failures |
| `backend/modules/platform/platform.service.js` | Use the same resolver; remove duplicate `buildLocalUrl` and inconsistent decryption logic | Provisioning and request routing must resolve the same storage target |
| `backend/shared/utils/prisma.js` | Confirm default client semantics; ensure no route accidentally bypasses tenant-scoped client | Existing singleton selects DATABASE_URL/DEV_TENANT_DATABASE_URL |
| `backend/shared/utils/dbSchema.js` | Retire `cloneSchema` for production provisioning; retain only safe URL helper if needed; schema identifiers must be validated before SQL interpolation | Current LIKE/sequence clone is not a complete schema migration |
| `backend/prisma/schema.prisma` | Keep PostgreSQL provider; define migration-compatible model and index strategy for both shared schema and dedicated tenant schema | Prisma models currently include company-level relationships but no tenant schema lifecycle metadata |
| `backend/.env.example` | Document only PostgreSQL connection variables, shared schema/template settings, central DB and encryption key requirements | Remove stale engine alternatives after compatibility policy is settled |

### Workstream C — Shared business-data isolation

| File / area | Planned action | Reason / dependency |
|---|---|---|
| `backend/prisma/schema.prisma` | Generate a complete table inventory: direct company key, parent key, global/system table, or join-only table | Required before any business RLS migration |
| New SQL migration under `backend/db-migrations/` | Add tenant context and RLS policies for every tenant-owned table, including child tables through safe parent ownership checks or denormalized tenant key | Current RLS migration only covers central tables; tenant business schema has no demonstrated RLS coverage |
| `backend/shared/utils/rlsContext.js` | Add business-database transaction helper that sets tenant and company context within the same transaction as protected queries | Existing helper applies to central Prisma only |
| `backend/shared/middleware/tenantSession.js` | Replace no-op only after all request paths are transaction-aware; do not rely on bare `SET LOCAL` in middleware | Existing comments correctly identify the pooled-connection issue |
| `backend/shared/middleware/auth.js` and tenant resolver | Bind authenticated tenant/company membership to the DB context; never trust a caller-supplied company ID without membership validation | Identity mapping is the basis of shared schema security |
| Backend module services/controllers | Audit direct `req.db`, default `prisma`, and raw SQL access; enforce tenant/company scope and transaction helper | Shared schema isolation cannot be guaranteed by schema routing alone |
| New integration tests | Test cross-tenant SELECT/INSERT/UPDATE/DELETE and concurrent interleaving on every protected table family | Unit tests alone do not prove PostgreSQL RLS enforcement |

### Workstream D — Paid plan promotion and payment safety

| File | Planned action | Reason / dependency |
|---|---|---|
| `backend/modules/platform/payment.controller.js` | Normalize verified provider events; validate amount/currency/tenant/invoice/order reference; persist unique event IDs; make callbacks idempotent; do not activate plan directly | Existing gateway callbacks need stronger validation and atomicity |
| `backend/modules/platform/subscription.routes.js` | Preserve public webhook endpoints but apply raw-body/signature handling required by each provider; keep authenticated order/verify routes | Webhook correctness depends on Express middleware order and provider contract |
| `backend/modules/platform/subscription.controller.js` | Call a subscription orchestration service for upgrades; never change paid entitlements before storage promotion completes | Plan and storage transition must be one orchestrated state machine |
| New: `backend/modules/platform/subscriptionLifecycle.service.js` | Implement payment-confirmed upgrade workflow with operation lock, idempotency, promotion, verification, activation, and compensating rollback | Central point to coordinate payment and data movement |
| `backend/prisma/central.prisma` | Add unique gateway-event/idempotency records and upgrade operation status | Prevent duplicate webhook processing and allow resumability |
| `backend/modules/platform/billing.service.js` | Align recurring invoice/suspension flows with subscription lifecycle state; keep employee capacity separate from schema allocation | Employee count is not the paid-schema eligibility switch |

### Workstream E — Provisioning jobs, backup, deletion and offline installs

| File / area | Planned action | Reason / dependency |
|---|---|---|
| `backend/modules/automation/automation.queue.js` and worker setup | Use durable job/outbox processing for provisioning and promotion; define retry/backoff and dead-letter behavior | Cross-database provisioning is not a single atomic transaction |
| `backend/shared/utils/backupService.js` | Remove MySQL dump branches; ensure PostgreSQL backups are real, schema-aware, and fail if pg_dump is unavailable; add restore verification | Current fallback can create a JSON note rather than a restorable database backup |
| `backend/modules/platform/tenantDeletion.service.js` | For shared storage delete only tenant-scoped rows; never drop `public`; for dedicated schema verify exact ownership before DROP; require backup/restore evidence | Current null-schema path drops public schema |
| `backend/modules/platform/platform.service.js` | Add explicit client-hosted PostgreSQL install path with connectivity/migration validation | Existing local config fields are mixed with multiple DB engine support |
| `HRMS_Blueprint/docker-compose.yml` and deployment docs | Prepare PostgreSQL-first local/offline installation with health checks, persistent volumes, migrations, backup and restore instructions | Offline operation needs a repeatable supported install |
| `backend/server.js` | Review startup readiness, worker lifecycle, health checks and graceful shutdown for local PostgreSQL deployment | A valid offline install must report DB readiness accurately |

## 4. Suggested new module boundaries

### `tenantStorage.service.js`
Responsibilities:
- resolve a tenant's canonical storage descriptor;
- validate PostgreSQL URL, schema name and deployment mode;
- provision shared or dedicated storage;
- apply the exact migration version;
- seed required tenant baseline data;
- verify schema, ownership, constraints and access;
- expose idempotent operation status;
- switch routing only after verification.

It must not accept arbitrary schema names from public request bodies. Schema names must be derived server-side from tenant identity and checked against a strict identifier policy.

### `subscriptionLifecycle.service.js`
Responsibilities:
- accept only a verified payment/entitlement event;
- create or resume an upgrade operation;
- acquire an idempotency lock;
- request tenant data promotion;
- validate copied data and schema isolation;
- atomically activate the paid plan and route;
- preserve prior state and record a recoverable failure if promotion does not complete.

### Provisioning worker
Responsibilities:
- process durable operation records;
- safely retry each step;
- record step-level status and error class;
- never log credentials or employee data;
- alert operators on exhausted retries;
- support manual retry without duplicate side effects.

## 5. Execution order with gates

| Stage | Deliverable | Must pass before next stage |
|---|---|---|
| 0 | Complete schema/table inventory and deployment topology | All Prisma models classified; current tenant storage modes understood |
| 1 | Central storage metadata and state machine migration | Migration is additive, reversible, and tested on a restored copy |
| 2 | Unified PostgreSQL resolver | Unit tests cover URL parsing, encryption, shared/dedicated routing, failure closed |
| 3 | Provisioning worker and dedicated schema migration path | Idempotent create, retry, partial-failure recovery |
| 4 | Shared schema RLS | All tenant-owned tables covered; cross-tenant tests pass with least-privilege DB role |
| 5 | Trial registration on shared storage | New trial tenant setup and login pass end-to-end |
| 6 | Paid schema promotion | Data copy, integrity validation, rollback and routing switch pass |
| 7 | Payment idempotency and subscription integration | Duplicate, replay, invalid amount, mismatch and concurrency tests pass |
| 8 | Backup, restore and safe deletion | Restore drill passes; shared deletion cannot drop shared schema |
| 9 | Client-hosted offline package | Clean-machine install, upgrade, backup, restore and offline acceptance tests pass |
| 10 | Canary migration and rollout | Monitoring and rollback runbook approved; only then consider production rollout |

## 6. Test matrix required before implementation is considered complete

### Storage routing
- Free tenant A and Free tenant B resolve to the same shared schema but cannot see one another's rows.
- Trial tenant resolves to shared storage.
- Paid tenant A and Paid tenant B resolve to different schemas.
- Unknown schema, invalid schema name, missing DB URL, and failed connection all fail closed.
- A recognized tenant never falls back to a generic development database.

### Data isolation
- Test all direct-company tables and child tables.
- Verify employee, payroll, attendance, leave, document, bank, and audit records cannot be accessed across tenant boundaries.
- Verify platform admin access is explicit and audited.
- Verify concurrent requests cannot leak transaction-local context through pooled connections.

### Lifecycle and payment
- Repeated provisioning creates no duplicate records or schema objects.
- Failed schema migration leaves tenant non-active and can be retried.
- Duplicate webhook is a no-op after the first successful processing.
- Wrong amount, currency, tenant, invoice, payment ID or signature is rejected.
- Paid plan is not active until data copy and validation complete.
- Rollback returns routing to the previous valid storage target.

### Destructive operations and backup
- Shared tenant deletion never drops a shared schema or another tenant's rows.
- Dedicated tenant deletion cannot target another tenant schema.
- Backup command failure is a hard backup failure, not a fake success.
- A backup is considered valid only after a restore test to a separate target succeeds.

### Offline deployment
- Fresh install works with local PostgreSQL and no cloud dependency.
- App startup waits for database readiness.
- Upgrade migrations run predictably.
- Backup and restore work without external cloud services.
- Loss of internet does not cause the app to silently switch to a different database.

## 7. Immediate next coding unit

The first code implementation should **not** be a broad rewrite of `tenant.js` or a live data migration. The safest first coding unit is:

1. Add central storage lifecycle fields and a migration (additive only).
2. Add a pure PostgreSQL storage descriptor/validation module with unit tests.
3. Add a dry-run resolver that reports the planned storage target without changing tenant routing.
4. Verify existing tenant records can be classified into the new storage model.
5. Only then connect provisioning and route changes.

This order establishes the contract and makes it possible to test behavior before touching customer data.

## 8. Current status and validation boundary

- Completed: source audit and migration impact register (`22_SOURCE_AUDIT_AND_MIGRATION_IMPACT.md`).
- Completed: approved architecture baseline and tenancy migration plan (`21_POSTGRES_TENANCY_MIGRATION_PLAN.md`).
- Completed in this stage: file-by-file implementation blueprint (this document).
- Not started: application code changes, database migrations, customer-data movement, production routing changes.
- Not run: Node tests, Prisma validation, database migrations, live PostgreSQL/RLS tests.
- Local PC copies remain untouched by design.
