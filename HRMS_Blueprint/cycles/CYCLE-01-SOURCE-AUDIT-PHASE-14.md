# Cycle 01 — Source Audit Phase 14: Tenant Storage Routing and RLS Controls

- Audit ID: HRMS-C01-AUDIT-P14
- Date: 2026-11-27
- Branch: architecture/postgres-tenant-isolation
- Status: Source inspection only; runtime tests not executed.
- Application source changed: No.

## Evidence inspected

| File | Blob SHA |
|---|---|
| backend/shared/middleware/tenant.js | 21e49bd0e113768666d97fa1f78e9139a4cc61ea |
| backend/shared/middleware/auth.js | 76a056c0e1e46e34a1e95beb9ac8e617cfb52420 |
| backend/shared/utils/tenantStorageResolver.js | 4e75dc5cf4bb651a716d8e2b5002189fb11ad238 |
| backend/shared/utils/tenantStorageConfig.js | 442c8f7bb349429cbf38e94e35d982ef132a85db |
| backend/shared/utils/rlsContext.js | 57c339c66ee9e448d948ac2eefd2c9d2e8ee4070 |
| backend/test/tenant-storage-resolver.test.js | 1c9a323c94cbe6b19f986bde904731b524c4ddc8 |
| backend/test/rls-tenant-isolation.test.js | 6bcee49d4cee896e438925d42282463d2fc0fe0b |

## 1. Positive controls confirmed by source

- Production tenant lookup uses central tenant records and routes only after resolving the selected tenant storage record.
- Auth middleware compares the authenticated session tenant identity against the resolved request tenant; a mismatch is rejected for non-platform administrators.
- Tenant storage resolver rejects legacy/unclassified and non-ready allocations, unsupported database modes, invalid PostgreSQL URLs, and mismatched schema ownership.
- Free/Trial shared storage is constrained to public; dedicated schema names are derived from immutable tenant UUIDs; managed dedicated databases are restricted to Enterprise in the resolver.
- Customer-managed DB modes are PostgreSQL-only in the resolver.
- Central RLS helpers correctly set the transaction-local tenant/platform-admin context and execute protected work in the same Prisma transaction.
- Existing test source covers a number of storage tier, schema mismatch, status, PostgreSQL URL, and RLS pooling cases. These test files were inspected, not executed in this phase.

## 2. GAP-0042 — customer-managed DB connection enablement / SSRF gate needs enforcement proof

**Severity:** P1 security review item; exploitability not established.  
**Status:** Source-confirmed control mismatch; route-level control and network policy not verified.

Evidence:
- `backend/shared/utils/tenantStorageConfig.js` defines and exports `customerDatabaseConnectionsEnabled(env)`, which returns true only when `CUSTOMER_DATABASE_CONNECTIONS_ENABLED === 'true'`.
- The same file comments that customer-supplied database hosts are an SSRF boundary and that local/external modes should remain disabled unless outbound network policy blocks loopback, link-local, metadata and unauthorized private destinations.
- `backend/shared/utils/tenantStorageResolver.js` accepts `external_cloud` and `local` modes and constructs/validates PostgreSQL URLs, but the inspected resolver does not call `customerDatabaseConnectionsEnabled`.
- `backend/shared/middleware/tenant.js` calls the resolver to route tenant requests.
- The route/controller permissions for creating or changing customer DB connection settings, deployment environment flag state, and outbound network policy were not inspected/verified in this phase.

Risk:
If an untrusted tenant administrator can influence these connection fields and the application can make unrestricted outbound connections, a connection attempt could become an SSRF path into internal services or cloud metadata endpoints. The presence of a helper function alone does not enforce the control.

Required next verification:
1. Trace every write path for db_mode, db_url, local_db_host, local_db_port, local_db_name and credentials; establish which roles can change them.
2. Determine whether the connection feature flag is checked at every provisioning and runtime connection boundary.
3. Verify deployment egress policy blocks loopback, link-local, cloud metadata IPs, private infrastructure not explicitly allowlisted, DNS rebinding and redirect-based bypasses.
4. Add unit tests proving local/external modes fail closed when the flag is false, and pass only when true plus the required policy precondition is satisfied.
5. Add isolated network tests using controlled mock endpoints; do not probe production or customer networks.
6. Keep customer-managed DB connections disabled until all checks pass.

Do not claim a confirmed exploitable SSRF vulnerability until route authorization, user control of connection fields and network reachability are demonstrated. Do not mark the security control verified until both application and deployment controls are evidenced.

## 3. RLS control status

The source-level helper pattern is correct: `withTenantRLS` and `withPlatformAdminRLS` set transaction-local context and execute the callback within the same Prisma transaction. The test source describes real PostgreSQL pooling checks, but it requires `RLS_TEST_APP_DATABASE_URL` and is skipped if absent. The actual DB test has not been run here. Existing CI environment omissions remain tracked in GAP-0031.

## 4. Tenant routing/auth interaction

The production middleware resolves the tenant from the tenant header or host/custom-domain mapping. The auth middleware later checks that the JWT/index-derived tenant identity matches the resolved tenant for non-platform admins. This is a useful defense-in-depth control; it does not replace tests for forged tenant headers, custom-domain collisions, platform-admin scope and tenant switching.

## 5. Validation and safety

- No application code modified.
- No tests executed; no server boot or browser tests.
- No PostgreSQL connection, DB migration, customer-network probe, payment or deployment.
- `main` untouched.
- Runtime/route/network verification remains pending.

## 6. Next session handoff

1. Trace all write paths for customer database configuration and check flag enforcement.
2. Audit provisioning lease/worker lifecycle and failure cleanup.
3. Continue PostgreSQL schema/FK/index/RLS inventory.
4. Continue frontend route/API and backup/restore audit.
5. Complete Cycle 01 audit, consolidate risks, draft improvement plan and independently verify it before any implementation.
