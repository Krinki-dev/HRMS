# Paid Tenant Data Migration — Inventory Phase

## Purpose

The Platform Admin tenant detail page includes a read-only **Storage migration** preflight for managed-cloud tenants currently using the shared `public` schema. It inspects the source schema and derives the tenant's destination schema from the immutable Central tenant UUID.

## Current safety boundary

This phase is intentionally inventory-only:

- It does not create a destination schema.
- It does not copy, update, or delete tenant records.
- It does not change a subscription plan or storage metadata.
- It does not activate paid entitlements.
- It is restricted to super-admin routes and managed-cloud tenants on shared storage.
- It resolves the operational `companies.id` from the tenant's registered GSTIN/PAN (Central tenant UUID and operational company UUID are distinct), then counts the `companies` root row and tables with an explicit `company_id` ownership column.
- It reads PostgreSQL foreign-key constraint metadata at column level, preserving ordered child/parent column mappings (including composite keys), constraint names, validation state, deferrability, and match type.
- It traces dependent tables through foreign keys only when ordered child/parent column mappings are available; composite key order is preserved.
- Tables with multiple possible paths to tenant-owned roots are classified as `ambiguous` and block readiness. Cycles without a provable root remain unclassified.
- The inventory includes both inbound and outbound cross-schema FK dependencies; any such relationship blocks migration until reviewed.
- The Platform Admin preview displays FK constraints, schema-qualified table names, column mappings, and validation status.
- For each uniquely resolved, validated FK ownership path, it reports tenant-owned dependent row counts, orphan counts, and rows with nullable ownership references.
- It checks direct tenant-owned child rows against direct tenant-owned FK parents and blocks when a child points to another tenant's parent record.
- Orphaned or nullable ownership references are explicit migration blockers; ambiguous paths and unvalidated FK paths are never used for dependent-row counts.
- It does not copy dependent rows.
- Any `NOT VALID` foreign-key constraint is an explicit blocker; the preview does not validate or alter constraints.
- Tables without a proven `company_id` root are marked unclassified and block migration readiness.
- An already-existing destination schema is a blocker; the preview never overwrites it.

## Inventory classifications

| Classification | Meaning |
| --- | --- |
| `direct` | Table contains `company_id`; row count is filtered to the tenant UUID |
| `dependent` | Table has a foreign-key path to a directly scoped table |
| `ambiguous` | More than one FK path reaches tenant-owned roots; a reviewed rule is required |
| `unclassified` | No provable ownership path was found; manual classification is required |

The ownership path is displayed from the dependent table toward its tenant-owned parent.

## Required next phases before enabling copy

1. Add an explicit, reviewed manifest for every operational, global/reference, and tenant-owned table.
2. Use the captured ordered FK column mappings to resolve indirect ownership against tenant-specific parent row sets; composite keys, nullable references, cycles, and ambiguous paths need explicit handling.
3. Extend dependent-row verification to every FK path, including indirect cross-tenant references, and resolve inbound/outbound cross-schema dependencies.
4. Compare source and destination schema versions, extensions, indexes, constraints, and unique-key collisions.
5. Add durable migration-job state, resumable checkpoints, and idempotency keys in Central DB.
6. Copy in dependency order into an isolated staging schema/target.
7. Verify per-table source/destination row counts and checksums; validate all FK constraints.
8. Define recovery/rollback and cutover locking to prevent writes being lost during final synchronization.
9. Switch storage metadata only after successful verification, then enable paid entitlement.
10. Add integration tests against disposable PostgreSQL databases before production rollout.

## Operational policy

Do not run this preview as a substitute for a backup. Do not execute data migration, schema DDL, production migrations, payment capture, or deployment without explicit approval and a verified recovery plan.


## Audit history

Each inventory request is written to Central DB as a `tenant_migration_jobs` record with status `blocked` or `inventory_only`, the source and destination schema names, the complete inventory snapshot, blockers, requester email, and timestamp. Platform Admin can review the latest 20 records from the tenant's Storage migration tab. This history is an audit trail, not a resumable copy-job engine.
