# Cycle 01 Implementation and Verification — Phase 27: Retire Legacy Direct Database Settings

**Date:** 2026-11-28 (Asia/Kolkata)  
**Repository:** `Krinki-dev/HRMS`  
**Branch:** `architecture/postgres-tenant-isolation`  
**Tasks:** HRMS-C-006, HRMS-D-004  
**Protected branch:** `main` — untouched

## 1. Executive summary

Phase 27 removed the legacy Settings path that could bypass Central RLS, store database credentials in plaintext and attempt arbitrary outbound database connections.

Changes:
- Legacy `GET /settings/db-config`, `PUT /settings/db-config` and `POST /settings/db-config/test` now return HTTP 410 with a stable `LEGACY_DB_CONFIG_DISABLED` code.
- The handlers no longer instantiate a direct Prisma client, read/write `tenant_db_config`, return database URLs or attempt SQL Server/MySQL/PostgreSQL connections.
- The obsolete Database tab and its SQL Server/MySQL/cloud URL form have been removed from the tenant Settings UI.
- Regression tests prove all three endpoints fail closed and the obsolete UI is absent.
- The remaining supported tenant storage path is the canonical Central tenant storage lifecycle; customer-supplied database connections remain disabled pending the approved network security gate.

This removes a specific D-004 rollout blocker: the legacy Settings controller no longer performs direct Central queries outside `withTenantRLS` or `withPlatformAdminRLS`.

## 2. Source evidence

| File | Current blob SHA | Change |
|---|---|---|
| `backend/modules/settings/settings.controller.js` | `0314241bdf8d7e15162ecf2f1db24ada9103f8e3` | Three legacy DB handlers return HTTP 410; direct Prisma client and config writes removed |
| `frontend/src/pages/settings/SettingsPage.jsx` | `7447f6f1927f284f90f8651037c03b3f93d2c9b8` | Database tab/component removed |
| `backend/test/legacy-db-config-disabled.test.js` | `bb2597d5c5e2aa55906651236025771774098569` | Endpoint 410, no direct DB query/connection and UI removal regression tests |
| `backend/modules/settings/settings.routes.js` | `69f580c1b85e0f20dba2b0361a3a93202aa0e1d1` | Legacy routes remain mapped to explicit 410 handlers for old clients |
| `backend/shared/utils/backupService.js` | `3f53798810aa5b38056027316009ceb0139beab2` | Remaining backup_config Central access uses `withPlatformAdminRLS` |
| `backend/modules/platform/tenantDeletion.service.js` | `a86e89dda530d8447325ebddaaa457b8e943eb45` | Central deletion operations receive an RLS-scoped transaction from the route |

## 3. Security and compatibility effects

### Direct Central RLS bypass removed
The former handlers created a direct Prisma client against `CENTRAL_DATABASE_URL` and accessed `tenant_db_config` directly. That access would fail once tenant RLS policies were enabled without a matching RLS context. The endpoint is now explicitly disabled rather than being reworked as a second, non-canonical storage configuration system.

### Credential exposure/write path disabled
- GET no longer returns `cloud_db_url` or any credential-bearing value.
- PUT no longer writes `local_db_pass` or `cloud_db_url`.
- Existing legacy rows, if any, have not been read, modified or deleted. Their stored credential values still require a separately approved inventory and remediation plan.

### Arbitrary DB connection test disabled
The former test endpoint accepted client-supplied URL/host details and attempted a connection. It is now HTTP 410 and performs no outbound network request. This closes that legacy SSRF boundary; the separate platform provisioning feature gate and egress policy remain under GAP-0042/0043 until verified for every active connection path.

### UI deprecation
The Database Settings tab was removed because it advertised SQL Server/MySQL and a cloud URL workflow that did not control canonical active tenant routing and conflicted with the PostgreSQL-only frozen architecture.

## 4. Regression tests

Added `backend/test/legacy-db-config-disabled.test.js`:
- GET, PUT and connection-test handlers all return HTTP 410 with `LEGACY_DB_CONFIG_DISABLED`.
- Controller contains no direct Prisma client construction or legacy `tenant_db_config` query/write call.
- Tenant Settings UI no longer renders a Database tab or DatabaseTab component.

Phase 27 backend and frontend CI results are pending at report creation; no test pass is claimed yet.

## 5. Gap status updates

- **GAP-0043:** legacy request-supplied database connection test endpoint disabled; no outbound connection attempted. Fixed for this legacy Settings path. Other provisioning/preflight connection paths remain governed by GAP-0042 and require independent egress-policy verification.
- **GAP-0044:** legacy Settings API no longer reads or writes plaintext DB credentials. Existing stored legacy values may remain in Central DB; no data inventory or migration was performed. Status: Fixed — API path disabled; stored-value remediation pending.
- **GAP-0045:** obsolete UI and non-canonical DB-config API disabled. Status: Fixed — source/UI deprecation verified; existing rows remain untouched.
- **GAP-0047:** one identified direct-client RLS bypass path is removed. Other Central access paths must still be checked before production policy rollout.

## 6. Safety boundary

- No production database was accessed.
- No existing `tenant_db_config` rows or credentials were read, migrated or deleted.
- No customer-supplied host or URL was contacted.
- No production migration, deployment, payment or customer-data action.
- `main` untouched.

**Next:** verify Phase 27 backend/frontend CI, then continue the full D-004 Central query-context and operational company ownership audit. Keep the Central RLS migration unexecuted in production until DBA role verification and backup/rollback approval.
