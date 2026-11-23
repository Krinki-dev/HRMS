# Tenant storage inventory — safe read-only audit

## Purpose

This audit establishes how existing central tenant records are currently routed before the new storage resolver is connected to request middleware. It is deliberately read-only. It does not provision schemas, rewrite tenant rows, migrate data, or test tenant database connectivity.

## Findings from source-code inspection

The current registration path in `backend/modules/platform/platform.service.js`:

- Accepts `cloud`, `external_cloud`, `local`, and `hybrid` registration modes.
- Derives a schema name as `tenant_<cleanSubdomain>` for cloud and external-cloud registrations, initially inserts the tenant with `schema_name = NULL`, then attempts to clone a template schema.
- Logs schema-cloning failure but continues registration; it subsequently writes the derived schema name regardless of whether cloning succeeded.
- Attempts tenant seeding after the central tenant row is committed; seed failure is logged and registration continues.
- Does not set the new `storage_tier` or `storage_status` lifecycle fields in the inspected INSERT. The schema defaults therefore leave newly registered rows as `legacy_unclassified` until registration is revised.

The current request middleware in `backend/shared/middleware/tenant.js`:

- Routes `cloud` tenants through `db_url`, or the environment fallback `CLOUD_TENANT_DATABASE_URL` / `DEV_TENANT_DATABASE_URL`.
- Routes `external_cloud` through `db_url`.
- Still supports `local` and `hybrid`; hybrid is a connection fallback (local first, cloud if unreachable), not a verified data synchronization process.
- Appends `schema_name` to the PostgreSQL URL when present.
- In development, can fall back to `DEV_TENANT_DATABASE_URL` after tenant resolution fails, which can hide a real routing/provisioning error.

The trial activation path changes `plan` to `trial`, and the subscription verification path changes `plan` and employee limits. Neither path currently changes storage lifecycle fields or performs a storage-tier transition. The plan transition therefore cannot yet be treated as proof that paid-plan isolation has been provisioned.

## Run the inventory

Run the SQL file against the central PostgreSQL database only:

```bash
psql "$CENTRAL_DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db-migrations/20261124_tenant_storage_inventory.sql
```

The output contains tenant UUIDs and subdomains for reconciliation, but deliberately excludes connection URLs, database hosts, usernames, and passwords. Keep the output private and do not paste secrets into an issue or chat.

## How to interpret it

1. **Aggregate inventory** shows counts by plan, db mode, storage tier, and storage status.
2. **Per-tenant routing metadata** shows each active (not soft-deleted) tenant's routing fields and only boolean indicators for credential/config presence.
3. **Duplicate schema assignments** lists repeated schema names. Repeated `shared_tenants` may be intentional after the new policy; other duplicates require careful review. No row is automatically changed.
4. **Potentially unsafe/incomplete records** flags legacy lifecycle values, missing connection metadata, hybrid routing, and unknown modes. A flag is a review prompt, not an automatic diagnosis.

## Important limits

- This is a source-code audit plus a query for the operator to run. No live central database was accessed by this implementation.
- The SQL does not prove that a schema exists, that it contains the correct tables/data, that credentials work, or that the tenant's data is isolated.
- Do not classify or update legacy rows solely from plan names. Confirm actual routing, schema contents, ownership, backups, and tenant data before any change.
- Do not run migrations or enable the new resolver until the inventory is reviewed and provisioning, promotion, rollback, and tenant-isolation checks are implemented.
