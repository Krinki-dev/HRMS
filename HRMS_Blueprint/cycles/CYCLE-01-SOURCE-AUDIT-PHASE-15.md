# Cycle 01 Source Audit — Phase 15
Date: 2026-11-28
Branch: `architecture/postgres-tenant-isolation`
Scope: Customer-managed database configuration write paths, legacy Settings DB configuration API/UI, connection-test network boundary, feature-flag enforcement and registration provisioning lifecycle.

## 1. Executive result

Phase 15 materially narrows the Phase 14 GAP-0042 finding and identifies three additional risks.

- **Correction to GAP-0042:** the customer-database feature flag is enforced in the new tenant registration service before it performs customer-supplied PostgreSQL preflight connections. It is not directly enforced inside the pure storage resolver, so every caller still needs a policy check. The Phase 14 concern should not be described as if registration lacked a gate.
- **GAP-0043 (P1, security review):** the legacy `POST /settings/db-config/test` endpoint accepts connection details from the request and attempts a Prisma connection without checking `customerDatabaseConnectionsEnabled()`. It is mounted and reachable through the Settings routes for authenticated users with `settings.edit` (built-in admin roles bypass the ordinary permission check). This creates a potential outbound-network/SSRF boundary that bypasses the new registration gate. Exploitability is not established; deployment egress and runtime reachability still require controlled verification.
- **GAP-0044 (P1, credential protection):** the legacy DB settings controller writes cloud URLs and local DB passwords into `tenant_db_config` without encryption. Its GET endpoint removes `local_db_pass` but returns `cloud_db_url` unchanged. Any caller passing `settings.view` (or a built-in admin role) can receive the cloud connection URL, which may contain credentials.
- **GAP-0045 (P1/P2 architecture and correctness):** the visible Settings UI saves to the legacy `tenant_db_config` table, while the production tenant storage resolver reads `tenants.db_mode/db_url/local_db_*`. The old UI therefore does not update the active tenant-routing record. It also offers SQL Server/MySQL options although the current Prisma datasource and new storage policy are PostgreSQL-only. Treat this as a stale, conflicting configuration surface until runtime use is proven otherwise.

No SSRF exploit, credential extraction from a live database, or production egress test was attempted. No app code was changed.

## 2. Source evidence

All files below were fetched from `architecture/postgres-tenant-isolation`.

| File | Blob SHA | Relevant evidence |
|---|---|---|
| `backend/modules/platform/platform.service.js` | `664b4f0ebe8a9d8610e2d7d319df682889fc75a6` | Lines 52–100: registration reads requested DB mode and rejects `local` / `external_cloud` when `customerDatabaseConnectionsEnabled()` is false. Lines 180–230: constructs the storage descriptor and tenant connection target. |
| `backend/shared/utils/tenantStorageConfig.js` | `442c8f7bb349429cbf38e94e35d982ef132a85db` | Lines 17–22: helper returns true only for exact string `CUSTOMER_DATABASE_CONNECTIONS_ENABLED === 'true'`; comment explicitly identifies customer-supplied hosts as an SSRF boundary and requires egress controls. |
| `backend/shared/utils/tenantStorageResolver.js` | `4e75dc5cf4bb651a716d8e2b5002189fb11ad238` | Lines 53–95: resolver accepts classified `external_cloud` and `local` targets and validates PostgreSQL URL syntax, but does not itself enforce the feature flag or filter destination IP ranges. |
| `backend/modules/settings/settings.routes.js` | `69f580c1b85e0f20dba2b0361a3a93202aa0e1d1` | Lines 20–35: router applies auth; `GET /db-config` uses `settings.view`; `PUT /db-config` and `POST /db-config/test` use `settings.edit`. |
| `backend/modules/settings/settings.controller.js` | `4adb5d7396cb9fd4772511f448f15308ab01947a` | Lines 58–105: reads/writes `tenant_db_config`; `getDbConfig` deletes local password only; `updateDbConfig` stores cloud URL and local password without encryption. Lines 107–132: connection test uses request-supplied `cloudDbUrl` or constructs a local SQL Server URL and connects via Prisma, with no feature-flag check or explicit destination policy. |
| `backend/shared/middleware/permission.js` | `abd655f6c82bcf9728639cefe0b993712e654130` | Lines 6–8: built-in admin roles bypass ordinary module permission checks; other users are checked for the requested permission. |
| `frontend/src/pages/settings/SettingsPage.jsx` | `2ebc511c24e0e31f27afac9e61d8171e5de69543` | Lines 557–596 and 604–705: Settings UI loads, saves and tests the legacy DB configuration; exposes cloud URL and local host/database/user fields; includes SQL Server, PostgreSQL and MySQL choices. |
| `backend/prisma/schema.prisma` | `39fb35175b4daa6767d1575bc6f8eef8e3449066` | Lines 6–9: generated application datasource provider is PostgreSQL. Model `tenant_db_config` is present separately from the `tenants` model. |
| `backend/.env.example` | `b3dac4ad91184dcd7b023a5ceaf28ad285a86f13` | Example environment file does not document `CUSTOMER_DATABASE_CONNECTIONS_ENABLED`; actual deployment value is unknown. |
| `railway.json` | `db0d1378661a5dca9176966a8c9d9b1d7c945686` | Defines Nixpacks build and start command only; it does not establish an outbound network policy. |

## 3. Detailed analysis

### 3.1 Feature flag: registration is gated

`platform.service.js` calls `customerDatabaseConnectionsEnabled()` for requested `local` and `external_cloud` modes and returns HTTP 503 with `CUSTOMER_DATABASE_CONNECTIONS_DISABLED` unless the deployment variable is exactly `true`. This check happens before the user-provided database URL is used for PostgreSQL preflight.

This is a positive control and corrects the incomplete Phase 14 summary. The helper is intentionally not a network security boundary by itself: the resolver remains a pure mapping/validation function, and other callers must not bypass the registration policy.

### 3.2 Legacy settings endpoint bypasses the gate

The server mounts Settings routes under `/api/v1/settings`. The DB test route is therefore an active route, not merely an unmounted controller function. Route middleware is `auth` plus `settings.edit`; the permission middleware allows built-in admin roles through automatically.

The controller uses request data to create a new `PrismaClient` and execute `SELECT 1`. For cloud mode, `cloudDbUrl` is passed directly as the datasource URL. There is no call to the customer DB feature flag and no visible IP/DNS destination allow/deny check in this controller.

The helper's comment requires blocking loopback, link-local, cloud metadata and unauthorized private destinations before customer-supplied hosts are enabled. No repository evidence reviewed in this phase establishes that such egress filtering is installed in the production hosting environment. This is a potential SSRF/network-reachability risk, not a proven exploit.

### 3.3 Legacy credential handling

The legacy controller writes `cloud_db_url` and `local_db_pass` directly to `tenant_db_config`; it does not call the encryption helper. The GET endpoint deletes `local_db_pass` from the returned object but does not redact `cloud_db_url`. PostgreSQL connection URLs commonly include usernames and passwords. Therefore, callers authorized to view this settings record can receive a credential-bearing URL.

This is distinct from the newer tenant registration flow, which encrypts the external URL and local host/user/password before persisting them to the `tenants` record.

### 3.4 Two competing database configuration models

The legacy UI/API reads and writes `tenant_db_config`. The current tenant storage resolver consumes fields from the central `tenants` row (`db_mode`, `db_url`, `local_db_*`, `storage_tier`, `storage_status`). The settings UI's save operation does not update those active routing fields. The UI also advertises SQL Server and MySQL even though the current application Prisma datasource and tenant storage policy are PostgreSQL-only.

This split creates a misleading operator experience and risks a future developer wiring the old table back into runtime routing without applying current storage safeguards. The legacy UI/API should be retired or deliberately redesigned around the single canonical storage model after the audit and plan are independently verified.

## 4. Provisioning lifecycle observed

The new registration path performs a PostgreSQL preflight, then inserts a central tenant row in `provisioning` state with a 30-minute lease token. It seeds the tenant database in a transaction, records failure with `storage_status='failed'` and clears the lease on seed failure, and activates only when the original token still matches and has not expired. This is a useful bounded registration lifecycle control.

The inspected registration service owns this lifecycle; no separate recovery worker or general-purpose customer DB reconfiguration route was verified in this phase. Do not infer that a background worker exists or that all lifecycle recovery paths are complete. The lease and failure/retry path still need dedicated tests.

## 5. Required follow-up / plan inputs

1. Keep `CUSTOMER_DATABASE_CONNECTIONS_ENABLED` false in deployments until egress policy is independently evidenced.
2. Disable or remove the legacy `/settings/db-config/test` endpoint and stale DB Settings UI as part of the later verified implementation plan; do not make a code change during this audit.
3. Redesign any required database-connection test as a privileged, allowlisted, time-bounded operation using a single canonical storage configuration model and explicit destination policy.
4. Encrypt credentials at rest, redact all connection strings in API responses/logs, and add permission tests for view/edit roles.
5. Reconcile or retire `tenant_db_config`; do not treat it as the active tenant routing source without an explicit architecture decision.
6. Obtain deployment-owner evidence for actual flag value, hosting-provider egress rules, DNS resolution/rebinding handling, and allowed private network ranges.
7. Add unit and route tests proving the flag blocks every customer-managed connection path; add mocked network tests for loopback, link-local, metadata, private IP, IPv6, DNS rebinding and redirect cases. Do not probe production or customer networks.
8. Test provisioning lease expiry, duplicate concurrent registration, seed failure, cleanup and safe retry in an isolated PostgreSQL test environment.

## 6. Validation and safety

- Source-only audit; source files fetched from the working branch and blob SHAs recorded above.
- No application source or frontend code changed.
- No test suite or server boot was executed; no browser test was run.
- No database connection, migration, customer network probe, payment, deployment or destructive operation was performed.
- `main` was not modified.
- Cycle 01 remains in audit. No implementation plan has been approved or independently verified; no application implementation is authorized yet.

## 7. Next session handoff

Continue the PostgreSQL schema/FK/index/RLS coverage matrix, then frontend/API and backup/restore/deployment operations audit. Reconcile root causes and verify remaining P0/P1 candidates safely. After complete audit, draft the Cycle 01 improvement plan and obtain an independent verification before any application code changes.
