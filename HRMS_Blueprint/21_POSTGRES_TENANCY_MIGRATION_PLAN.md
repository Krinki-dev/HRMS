# 21 — POSTGRESQL TENANCY & DEPLOYMENT ARCHITECTURE
> Architecture decision record and implementation plan
> Status: Approved product direction; implementation pending audit and tests
> Branch: architecture/postgres-tenant-isolation

## 1. Approved product decisions

1. PostgreSQL is the only supported database engine for production and supported deployments.
2. Free and trial tenants use a shared tenant-data schema.
3. Every paid subscription plan uses a dedicated PostgreSQL schema. Promotion is automatic after payment is authoritatively confirmed.
4. Platform metadata (tenant registry, plans, subscriptions, invoices, payment events and schema assignment) lives in a platform schema.
5. The default cloud deployment uses one PostgreSQL database containing platform, shared and tenant-specific schemas.
6. Client-hosted/offline deployments use PostgreSQL on the client's own server or local network.
7. A dedicated database or PostgreSQL instance remains an optional enterprise deployment, not the default.
8. Employee count and resource consumption may influence pricing, limits and capacity alerts, but do not override the rule that every paid plan receives a dedicated schema.
9. No tenant migration or schema switch may be performed solely from a browser redirect or unverified payment request. Only a verified payment event/state transition may enqueue promotion.

## 2. Target topology

```
PostgreSQL database (default cloud deployment)
|
+-- platform
|   +-- tenants / subscription state / plan catalog
|   +-- invoices / payment events / schema assignments
|   +-- migration jobs / migration audit records
|
+-- public
|   +-- shared tenant business tables for Free and Trial customers
|       (every tenant-owned row must be scoped by tenant_id)
|
+-- tenant_<stable_id>
    +-- tenant business tables for each paid tenant
```

Confirmed by the user: the shared Free/Trial tenant-data schema is PostgreSQL public in the tenant operational database. Keep Central/platform data on its configured connection/schema; do not rename or move central tables as part of this tenant-schema decision. Do not blindly rename or move existing tables.

## 3. Deployment modes

### Cloud-hosted SaaS
- Syntern operates PostgreSQL.
- Platform, shared and tenant schemas coexist in the same database by default.
- Tenant routing selects either the shared schema or the tenant's dedicated schema.
- Central/platform services and tenant business-data access must have explicit, documented connection boundaries.

### Client-hosted / offline
- The application and PostgreSQL run on client-managed infrastructure.
- The local PostgreSQL database is authoritative for that installation while offline.
- The product must document backup, restore, update, licensing and support procedures for disconnected installations.
- Do not claim cloud/local failover is synchronization.

### Hybrid
- Hybrid mode is a separate capability requiring an explicit sync service, durable change/outbox tracking, idempotency, retry policy, conflict resolution and recovery procedures.
- The existing local-to-cloud fallback in tenant middleware is connection fallback only; it is not data replication.
- Do not enable hybrid production mode until synchronization tests and operational monitoring exist.

### Optional enterprise isolation
- A separate PostgreSQL database or instance can be offered where security, performance, residency or contractual requirements justify it.
- Keep the application database engine and schema migration model PostgreSQL-only.

## 4. Existing-code audit findings (GitHub main, read-only inspection)

Files inspected include:
- `backend/shared/middleware/tenant.js`
- `backend/shared/middleware/tenantSession.js`
- `backend/shared/prisma.js`
- `backend/shared/utils/centralPrisma.js`
- `backend/shared/utils/dbSchema.js`
- `backend/shared/utils/tenantResolver.js`
- `backend/prisma/schema.prisma`
- `backend/prisma/central.prisma`
- `backend/modules/platform/billing.service.js`
- `backend/modules/platform/payment.controller.js`
- `backend/modules/platform/subscription.controller.js`
- `backend/modules/platform/tenantDeletion.service.js`
- `backend/db-migrations/20260606_rls_and_function_fix.sql`
- `backend/test/rls-tenant-isolation.test.js`

Observed facts:
- Tenant middleware already appends Prisma's `schema` URL parameter when `tenant.schema_name` exists.
- The middleware still constructs MySQL, MSSQL and SQLite connection strings from `local_db_type`; this conflicts with the approved PostgreSQL-only policy.
- Tenant data Prisma schema uses PostgreSQL, while central Prisma uses a separate generated client and `CENTRAL_DATABASE_URL`. The current setup therefore has separate central and tenant connection configuration; a same-database deployment has not yet been established as a single coherent configuration.
- `dbSchema.js` clones table structures using `CREATE TABLE ... LIKE` and separately creates sequences. It does not copy tenant rows and is not a complete schema provisioning or tenant-promotion implementation.
- `tenantSession.js` explicitly documents that tenant-table isolation is currently achieved by database/schema routing, while central-table RLS is applied through transaction-scoped helpers.
- Billing code contains subscription verification and paid-invoice handling, but the complete payment verification/webhook idempotency and state-transition flow must be audited before connecting it to an automated migration job.
- Tenant deletion currently resolves external/local database modes and can drop schemas or reset public schema. This must be redesigned/guarded before consolidating deployment modes.
- Existing middleware's hybrid branch tries local DB first and falls back to cloud on connection failure. This is not a synchronization mechanism.
- The existing blueprint's frozen decisions still describe PostgreSQL/MySQL/MSSQL/SQLite options and per-tenant DB/schema modes. Those legacy statements must be superseded consistently after implementation is validated.

These are source observations, not claims that the feature is already production-ready.

## 5. Required tenant registry model

The platform registry must record at minimum:
- tenant ID and subscription status/plan
- storage mode: `shared_schema`, `dedicated_schema`, or approved enterprise database mode
- database/deployment identifier (secret-safe reference, not plaintext credentials)
- schema name
- schema migration version
- provisioning/promotion status
- migration job ID, started/completed timestamps and failure reason
- last successful validation timestamp
- rollback/retention state

Connection credentials must remain encrypted or in a secret manager. Never log connection URLs or credentials.

## 6. Paid-plan promotion workflow

1. Verify payment using the server-side gateway verification/webhook path.
2. Persist the payment event with an idempotency key and mark the subscription as paid in a central transaction.
3. Enqueue a durable promotion job. Do not perform a long-running schema migration inside the payment HTTP request.
4. Acquire a tenant-scoped migration lock; reject duplicate concurrent promotion jobs.
5. Create the dedicated schema using a stable, generated identifier (never a customer-supplied schema name).
6. Apply the complete, versioned Prisma/SQL migration set to that schema. Do not use `LIKE` cloning as the canonical provisioning path.
7. Copy only the selected tenant's rows from shared tables in dependency order, preserving IDs, timestamps, constraints and relationships.
8. Account for writes during migration. Initial safe implementation should put the tenant into a clearly communicated maintenance/read-only state for final copy and cutover; a later online migration may use change capture.
9. Validate row counts, foreign keys, uniqueness, critical payroll/leave/attendance totals, file references and tenant ownership.
10. Atomically update schema assignment and migration status only after validation passes.
11. Reconnect/invalidate tenant Prisma clients and route subsequent requests to the dedicated schema.
12. Retain the shared source data for a defined rollback window; do not immediately delete it.
13. On failure, keep the tenant on the shared schema, record diagnostics without secrets, and allow a safe retry.
14. After the rollback window and explicit cleanup checks, delete the source tenant rows through a separately auditable cleanup job.

Payment retries, webhook retries and repeated user requests must never create duplicate schemas or duplicate migrations.

## 7. Security and data-integrity requirements

- All shared-schema queries must enforce tenant ownership; tenant_id must be present on every tenant-owned row and included in relevant unique constraints/indexes.
- Validate tenant context server-side. Never trust a tenant ID or schema name supplied by the client.
- Schema identifiers must be generated and safely quoted; parameterized SQL values cannot parameterize identifiers.
- Use least-privilege PostgreSQL roles. Application roles must not have unrestricted cross-schema access.
- Apply and test RLS where appropriate, but do not treat RLS as a substitute for correct tenant routing and authorization.
- Background jobs must carry immutable tenant ID and storage routing context and re-resolve it before execution.
- Cache keys, Redis jobs, file paths/object keys, exports and signed URLs must be tenant-scoped.
- Migration logs must include actor/system identity, source/target, schema version, counts and outcome, but no secrets or sensitive HR payloads.
- Backups and restores must cover platform metadata and tenant schemas consistently.

## 8. PostgreSQL-only cleanup

After inventorying all call sites and tests:
- Remove MySQL, MSSQL and SQLite connection-string branches and local_db_type production behavior.
- Replace ambiguous `cloud`, `external_cloud`, `local`, `hybrid` semantics with explicit deployment/storage fields.
- Keep SQLite only if a deliberately isolated test harness is proven necessary; it is not a supported production engine.
- Review every environment variable and deployment manifest; converge cloud single-database settings without breaking client-hosted PostgreSQL.
- Update blueprint, onboarding, admin UI, validation, tests and documentation together.
- Do not blindly remove the central Prisma client until its platform-table ownership and same-database migration strategy are resolved.

## 9. Implementation phases and exit criteria

### Phase 0 — Complete source inventory
- Trace all database clients, raw SQL, tenant routing, billing transitions, background jobs, backup/restore and tenant deletion.
- Inventory every model/table and determine whether it is platform-owned or tenant-owned.
- Identify assumptions about separate databases and schema names.
- Exit: reviewed dependency map and migration impact register.

### Phase 1 — PostgreSQL deployment foundation
- Define one canonical PostgreSQL connection configuration for default cloud deployment.
- Establish platform/shared/tenant schema ownership and roles.
- Align Prisma schema generation/migration workflows.
- Exit: clean install, migration from empty DB, health checks and integration tests pass.

### Phase 2 — Shared free/trial tenancy
- Provision new free/trial tenants in shared schema.
- Enforce tenant_id across all tenant-owned models and queries.
- Test cross-tenant reads/writes, background jobs, exports and file access.
- Exit: automated isolation tests pass under concurrent load.

### Phase 3 — Dedicated-schema provisioning
- Create tenant schema from versioned migrations.
- Provision paid new tenants directly into dedicated schemas.
- Exit: repeatable provisioning, schema upgrade and restore tests pass.

### Phase 4 — Paid upgrade promotion
- Integrate verified paid subscription transition with durable promotion queue.
- Implement maintenance/copy/validation/cutover/rollback lifecycle.
- Exit: retries, interrupted jobs, failed validation and rollback tests pass without data loss.

### Phase 5 — Client-hosted/offline packaging
- Package application + supported PostgreSQL setup for client infrastructure.
- Define licensing, updates, local backups, restore and support.
- Exit: installation and full HR workflows succeed without internet access, subject to explicitly documented online-only integrations.

### Phase 6 — Hybrid synchronization (separate release)
- Design and implement outbox/change tracking, idempotent sync, conflict resolution and monitoring.
- Exit: offline edits, reconnect, retries, duplicate delivery and conflict test suites pass.

## 10. Non-goals for the first release

- No automatic bidirectional cloud/local sync until the dedicated sync subsystem exists.
- No database-engine abstraction across MySQL/MSSQL/SQLite.
- No zero-downtime tenant migration promise until change capture and cutover are proven.
- No immediate destructive cleanup of legacy databases, schemas or duplicate files.
- No enterprise separate-instance automation until default schema-per-tenant operation is stable.

## 11. Acceptance test checklist

- Free/trial tenant A cannot read or mutate tenant B's records in shared schema.
- Paid tenant A routes only to its own dedicated schema.
- A paid tenant cannot be cut over before payment verification and migration validation.
- Duplicate payment webhooks and job retries produce exactly one effective promotion.
- Failed provisioning leaves tenant data accessible in its original location.
- Interrupted promotion can resume or roll back safely.
- Schema migration upgrades all active tenant schemas deterministically.
- Backup/restore of one tenant does not expose or overwrite another tenant.
- Client-hosted PostgreSQL works without a cloud database connection.
- Offline mode clearly blocks or queues features that inherently require external services.
- No production path constructs MySQL, MSSQL or SQLite connection URLs.

## 12. Open engineering questions (must be answered by code audit)

- Can platform and tenant Prisma clients safely share one physical database with distinct schemas, and how will generated clients target dynamic schemas?
- Which tenant-owned tables currently lack tenant_id and are safe only because of database-per-tenant assumptions?
- Which tables contain global/shared reference data versus tenant-private data?
- How are file storage, Redis queues, scheduled jobs, WebSockets and report exports routed by tenant?
- Which payment webhook path is authoritative, idempotent and safe to enqueue promotion from?
- How will local installations receive software/schema updates and license validation while disconnected?
