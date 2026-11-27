# Cycle 01 — Fresh Source Audit (Phase 13: PostgreSQL Migration and Tenant Inventory Readiness)

- Audit ID: HRMS-C01-AUDIT-P13
- Repository: Krinki-dev/HRMS
- Branch: architecture/postgres-tenant-isolation
- Source reference: branch ref fetched during this audit; key source blob SHAs are listed below. The last independently fetched documentation commit before this pass was f83d26eb642adb4527122fdabd584f8c91dab174.
- Date: 2026-11-27
- Status: In Progress — source and documentation inspection only; no runtime/database verification.
- Application code changed: No.

## 1. Evidence inspected

| File | Blob SHA |
|---|---|
| backend/prisma/schema.prisma | 39fb35175b4daa6767d1575bc6f8eef8e3449066 |
| backend/prisma/central.prisma | 0591ffa909e4e432d0ae326f4f7888ffafcb3eeb |
| backend/db-migrations/README.md | 5098e3f7ab934ee43108b1e061ac42194d2de72f |
| backend/db-migrations/20261125_central_platform_schema_upgrade.sql | b4b580f89e9dd6fba9a56d4c0fac30f8f2c03bd1 |
| backend/modules/platform/tenantMigrationInventory.js | 05ae981d01e5892c6540da9455ee251967f2d165 |
| backend/shared/middleware/tenant.js | 21e49bd0e113768666d97fa1f78e9139a4cc61ea |
| backend/modules/platform/subscription.routes.js | 0e51eb72c46d23588198b603694edea298cf84f2 |
| backend/modules/platform/payment.controller.js | 7e48f4fbe142c39184da86e1ebc1b5c0427125a2 |
| backend/modules/notifications/notifications.service.js | 49c74634388bd2f95262011cd75208d6a4d344b5 |
| backend/shared/utils/wsTicket.js | b44d5bed3cc655d97ec7519ccadda7e678962f32 |
| backend/server.js | 8a412ffed98826379fc832ea90b99c8ff97a9097 |

## 2. GAP-0041 — tenant operational PostgreSQL migration baseline is not established

**Severity:** P1 — blocks safe tenant-schema migration and reliable deployment readiness.  
**Status:** Source/documentation-confirmed; exact live database state and migration history not inspected in this phase.

Evidence:
- `backend/prisma/schema.prisma` declares PostgreSQL and uses `DEV_TENANT_DATABASE_URL` / `DEV_TENANT_DIRECT_URL`.
- `backend/db-migrations/README.md` explicitly says the existing tenant migration directory has a `migration_lock.toml` with `provider = "mssql"` and initial SQL in SQL Server syntax.
- The same README explicitly says this is not a valid PostgreSQL migration history and must not be run against Supabase PostgreSQL.
- The README requires establishing the actual tenant schema and creating a PostgreSQL baseline from the current tenant Prisma schema before tenant PostgreSQL migration SQL is introduced.

Impact:
- Prisma schema provider and historical migration provider are inconsistent.
- Running the legacy history against PostgreSQL is unsafe and likely invalid.
- Without an independently reconciled PostgreSQL baseline, future schema changes cannot be reliably deployed, replayed or rolled back across tenant databases.

Required plan:
1. Inventory the actual tenant database(s) and schema state read-only; never assume the schema equals Prisma.
2. Compare all Prisma models, enums, indexes, unique constraints and foreign keys against the real PostgreSQL catalog.
3. Design a PostgreSQL baseline/migration strategy that preserves existing customer data and records the baseline state explicitly.
4. Verify the strategy on disposable PostgreSQL databases with empty, representative and legacy-shaped fixtures.
5. Add CI that creates a clean PostgreSQL database from baseline and applies all subsequent migrations.
6. Document backup, restore, lock/timeout, partial failure and rollback/recovery procedures.
7. Keep the MSSQL legacy directory archived and clearly excluded from PostgreSQL deployment automation unless a reviewed conversion is performed.

Acceptance criteria:
- No production/customer database is modified during baseline design.
- A clean disposable PostgreSQL database can be built to the expected schema from the approved baseline.
- Existing representative PostgreSQL schema can be reconciled without destructive reset.
- CI proves ordered migration replay and schema parity against Prisma.
- A tested restore/recovery procedure exists before production rollout.

## 3. Tenant migration inventory safety review

The inspected `tenantMigrationInventory.js` is intentionally inventory-only:
- Validates tenant UUID, schema names, PostgreSQL URL protocol and distinct source/destination schemas.
- Requires a uniquely resolved operational company record using registered GSTIN/PAN.
- Classifies tables by direct `company_id` or verified foreign-key ownership paths; ambiguous/unclassified tables remain explicit.
- Refuses row counting through unvalidated foreign keys.
- Detects cross-tenant references among direct company-scoped tables.
- Returns `inventoryOnly: true` and `copyAllowed: false`; it does not copy data or create the destination schema.

This is a positive safety boundary. It is not proof that the end-to-end tenant migration is implemented or verified. Open requirements include:
- Tests for composite foreign keys, nullable references, orphan rows, unvalidated constraints, cross-schema references, ambiguous ownership and duplicate GSTIN/PAN matches.
- Explicit coverage for tables without FKs, polymorphic references, JSON-held IDs, external object-storage references and queued/background jobs.
- Reconciliation of source row counts, checksums and relational integrity after any future copy implementation.
- A reviewed cutover/rollback protocol and prevention of writes during the migration window.
- Runtime verification on disposable PostgreSQL; no such execution occurred in this phase.

No separate defect is assigned solely because copying is disabled: the current function advertises inventory-only behavior and is safer than an unverified copy path.

## 4. Revalidation of two existing critical findings

### GAP-0020 — WebSocket company broadcast
Re-fetched notification service and ticket source. `register(userId, ws)` stores sockets by user; ticket records contain only userId and expiry; `pushToCompany(companyId, payload)` does not use companyId to filter sockets. This remains source-confirmed P0. Company A/B runtime negative test is still pending.

### GAP-0021 — Razorpay webhook handler
Re-fetched subscription route and payment controller. The route still registers `paymentController.handleWebhook`; the inspected controller exposes PhonePe, JioPay and payout handlers, but no `handleWebhook` export was found. The server directly imports/mounts the subscription router. This remains a P0 candidate pending a safe isolated route-registration/server-boot reproduction. Do not claim startup failure without that reproduction.

## 5. Branch and validation status

- Working branch remains `architecture/postgres-tenant-isolation`; comparison against `main` reports 865 commits ahead and 0 behind.
- Last explicitly fetched documentation commit: `f83d26eb642adb4527122fdabd584f8c91dab174`.
- GitHub Actions workflow lookup for that commit returned no runs.
- The branch compare endpoint did not expose a reliable head SHA in its response; do not infer one from the merge base or stale commit-search results. Re-fetch branch head before the next commit/CI report.
- No tests, server boot, browser, PostgreSQL connection, migration, production operation, payment, deployment or customer-data operation was performed.
- `main` was not changed; no application source was changed.

## 6. Next exact audit work

1. Continue the operational schema matrix: all Prisma models/tables, FK ownership, indexes, uniqueness, nullable references and RLS policy coverage.
2. Inspect tenant migration inventory tests and migration lifecycle/provisioning callers; establish what is implemented versus inventory-only.
3. Audit central schema upgrade ordering and schema parity, including provisioning lease fields and payment/webhook tables.
4. Continue frontend route/API and operational backup/restore coverage.
5. Only after all streams are audited, consolidate root causes, draft Cycle 01 plan and independently verify it. No application implementation before plan verification.
