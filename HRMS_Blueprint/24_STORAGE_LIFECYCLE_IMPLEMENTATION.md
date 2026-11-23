# Tenant storage lifecycle metadata — implementation note

## Scope

This change adds explicit central storage lifecycle metadata and a pure PostgreSQL storage-policy validator. It does **not** change live routing, provision schemas, migrate customer data, or apply SQL.

## Policy encoded

- Free and trial plans use the common `shared_tenants` schema.
- Paid plans use a schema derived from the central tenant UUID. Employee count does not determine storage tier.
- Dedicated database/instance isolation is allowed only for an explicitly approved Enterprise allocation.
- New allocations accept PostgreSQL only, using `cloud`, `external_cloud`, or `local` modes.
- Legacy `hybrid` is rejected for new allocations because current code provides connection fallback, not data synchronization.
- Existing rows remain `legacy_unclassified` until a separate audited classification. No existing customer is automatically moved or relabeled.

## Files added or updated

- `backend/prisma/central.prisma`: five storage lifecycle fields on `tenants`.
- `backend/prisma/central_schema.sql`: matching fields for fresh central database creation.
- `backend/db-migrations/20261124_tenant_storage_lifecycle.sql`: additive, manually applied central database migration.
- `backend/shared/utils/tenantStorageConfig.js`: pure URL, mode, tier, and schema-name validation.
- `backend/test/tenant-storage-config.test.js`: Node built-in unit tests.

## Controlled migration procedure

1. Take and verify a restorable backup of the central PostgreSQL database.
2. Confirm the target database contains `public.tenants`.
3. Review the SQL and apply it manually to the central database during a controlled maintenance window.
4. Regenerate the central Prisma client: `npx prisma generate --schema=prisma/central.prisma`.
5. Run `node --test test/tenant-storage-config.test.js` from `backend/`.
6. Inspect the new columns and index before any later rollout.

The migration is not wired into application startup or deployment. Do not apply it to production until a human operator has verified the backup and target database.

## Integration boundary

The existing tenant middleware still uses legacy `db_mode`, `db_url`, and `schema_name`. This commit does not call the new helper from middleware or payment/subscription flows. Routing integration comes later, after tenant rows are classified and shared-schema/RLS behavior is tested. This helper is a policy gate, not a provisioning mechanism.

## Validation status

Tests are committed but have not been executed in this GitHub-only environment. Prisma schema validation, SQL execution, and live PostgreSQL checks remain pending on a Node.js/PostgreSQL runner.
