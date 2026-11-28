# Cycle 01 Source Audit — Phase 17: Backup/Restore, API Mapping and Deployment

**Date:** 2026-11-28 (Asia/Kolkata)  
**Repository:** `Krinki-dev/HRMS`  
**Branch:** `architecture/postgres-tenant-isolation`  
**Scope:** Source-only review of backup lifecycle, restore/deletion gates, frontend/backend API mounting, and Railway/GitHub Actions deployment configuration.

## 1. Executive summary

Phase 17 reviewed backup generation and storage, the backup scheduler, deletion workflow, frontend-to-backend route composition, notification settings endpoints, and deployment startup behavior.

The most important conclusions are:

- The PostgreSQL dump helper has useful fail-closed basics (argument-safe `pg_dump`, gzip validation, and a storage-target guard), but the complete backup lifecycle is not operationally wired or recoverable.
- The backup scheduler is exported but not started by the inspected server bootstrap. In addition, its schedule-time field does not match the Prisma/SQL schema field. The current source therefore does not demonstrate that configured automatic backups run.
- The backup artifact is gzip-compressed but not application-layer encrypted; the imported encryption function is not applied to the dump before upload. This revalidates GAP-0035.
- Backups cover only a ready, dedicated tenant PostgreSQL database/schema. Shared Free/Trial storage, Central platform database, MinIO uploaded files, and a tested restore path are not covered by this service. The schema's `include_files` setting is not consumed by the backup implementation.
- Permanent tenant deletion is deliberately blocked before backup/deletion operations until independently verified restore and approval controls exist. Preserve this safety gate.
- Railway's configured start command runs a Central SQL migration on every deployment. The migration script catches failures and exits normally, so a failed migration can be followed by server startup without the deployment command failing. This is a deployment correctness risk.
- A frontend notification settings path does not match either mounted backend notification route. The route mismatch is source-confirmed and remains consistent with GAP-0034.
- No application code was changed. No tests, server boot, database, migration, backup, restore, deployment, payment, or customer-data operation was performed.

## 2. Evidence inventory

All files were fetched from the working branch. Blob SHAs are recorded for reproducibility.

| File | Blob SHA | Relevant evidence |
|---|---|---|
| `backend/shared/utils/backupService.js` | `3f53798810aa5b38056027316009ceb0139beab2` | PostgreSQL dump, compression, Google Drive/OneDrive upload, retention, scheduled task, exports |
| `backend/shared/utils/tenantBackupTarget.js` | `8c0c0c14f0dffb3392e9438e1c04ff9515fa5f63` | Backup only for ready dedicated schema/database; shared and legacy blocked |
| `backend/shared/utils/encryption.js` | `1fd621755053f93c7d70d8de941d792822d3cb0f` | AES-256-GCM writes; legacy CBC read compatibility; default fallback key present |
| `backend/prisma/central.prisma` | `0591ffa909e4e432d0ae326f4f7888ffafcb3eeb` | backup_config fields: schedule, schedule_time, include_files, provider, retention |
| `backend/db-migrations/20260813_gst_canonical_columns_and_backup_config.sql` | `fa7e1da48a09ff1d8ee487bb0adadc6e611c7908` | SQL backup_config schema matches Prisma fields |
| `backend/modules/platform/tenantDeletion.service.js` | `a86e89dda530d8447325ebddaaa457b8e943eb45` | Backup setup, mandatory backup helper, deletion fail-closed gate |
| `backend/server.js` | `8a412ffed98826379fc832ea90b99c8ff97a9097` | Mounted API routers and server startup; no backup scheduler start call in inspected bootstrap |
| `railway.json` | `db0d1378661a5dca9176966a8c9d9b1d7c945686` | Build/start commands; migration script chained before server |
| `backend/scripts/apply_canonical_schema_migration.js` | `054082af3f8f013c2ad8d1ae8abf677b4165d220` | SQL statements executed; migration errors caught and logged without non-zero exit |
| `.github/workflows/backend-tests.yml` | `f4785c0323c17dbc9150879a53c0d5765b66bbc7` | Node 20, install, Prisma generation, backend test suite |
| `.github/workflows/frontend-build.yml` | `54900bc18a2718144c43946e0787b846cca1d3d9` | Node 22, frontend install/build only |
| `.github/workflows/tenant-migration-integration.yml` | `5b8f38e22ae7e88eba1f0e0f0c11718082c799d4` | Ephemeral PostgreSQL 16; one tenant migration inventory integration test |
| `frontend/src/services/adminApi.js` | `ed16209b53254a1f01f67a5dfbec4dce3bca1209` | Notification settings API path |
| `backend/modules/notifications/notification.routes.js` | `67c42ce109d88ac8286a73808ce7d1a186dddd37` | Notification config router's relative paths |
| `backend/modules/notifications/notifications.routes.js` | `ef0555fd5e9f7702777276e04411d5858a6ab9d0` | Second notification router's relative paths |

## 3. Findings

### GAP-0050 — Backup scheduler is not demonstrably active and uses a mismatched time field

**Severity:** P1  
**Status:** Open — source-confirmed wiring/configuration defect

Evidence:
- `backupService.js` exports `scheduleAll()`, which creates an hourly cron task.
- The scheduler compares `config.backup_time` to the current time.
- Both `central.prisma` and the canonical SQL migration define `schedule_time`, not `backup_time`; they also define `schedule`, which the scheduler does not evaluate.
- The inspected `server.js` starts the automation worker and billing cron but does not import or call `scheduleAll()`.
- The backup scheduler's hourly task therefore has no demonstrated startup registration, and even if called, the field comparison does not match the persisted schema.

Impact:
- Configured automatic backups may never start.
- A configured schedule may be silently ignored.
- Customers may believe backups are scheduled when source does not establish that they run.

Required remediation:
1. Define a single canonical schedule model (frequency + timezone + local execution time).
2. Align Prisma, SQL, API/UI and scheduler field names.
3. Start the scheduler from a controlled bootstrap or dedicated worker and prevent duplicate scheduling across replicas.
4. Add tests proving due/not-due behavior, timezone handling, missed-run policy, locking/idempotency and failure reporting.
5. Add an operational heartbeat/last-attempt metric and alert on overdue backups.

### GAP-0051 — Deployment migration failures can be swallowed before server startup

**Severity:** P1  
**Status:** Open — source-confirmed deployment behavior; live deployment impact not tested

Evidence:
- `railway.json` configures `startCommand` as `node scripts/apply_canonical_schema_migration.js && node server.js`.
- The migration script reads `20260813_gst_canonical_columns_and_backup_config.sql` and executes statements sequentially.
- Its catch handler logs migration failure but does not set a failing exit code or rethrow. The Node process therefore normally exits successfully after a caught migration error, allowing the chained `node server.js` to start.
- The script comment explicitly describes migration failure as non-fatal.
- It selects `CENTRAL_DIRECT_URL` over `CENTRAL_DATABASE_URL` when present and not in CI.
- The SQL file contains schema creation and data reconciliation statements. Its idempotency claim has not been independently proven for every statement or partial-failure state.

Impact:
- A deployment can serve traffic after its expected schema migration failed.
- Application code and Central schema may be out of sync.
- Running schema mutation in every service start couples deploy/restart behavior to database DDL and complicates rollback and multi-replica startup.

Required remediation:
1. Move schema changes into an explicit, serialized release/migration job with a non-zero failure exit.
2. Require a migration success marker before app instances become healthy.
3. Verify idempotency and recovery from partial application in an isolated PostgreSQL environment.
4. Separate read-only health checks from migration execution.
5. Document rollback/forward-fix procedure and never silently continue after a required migration failure.

### GAP-0052 — Backup coverage is incomplete for disaster recovery

**Severity:** P1  
**Status:** Open — source-confirmed scope limitation

Evidence:
- `getSafeBackupTarget()` rejects shared/legacy storage and permits only ready dedicated schema/database targets.
- `runBackup()` dumps only the resolved tenant operational PostgreSQL target.
- The Central platform database is not dumped by this tenant backup function.
- `backup_config.include_files` exists in Prisma/SQL but is not read by `runBackup()`.
- Uploaded files are stored separately through MinIO object storage; the tenant database dump does not include those objects.
- No restore function or restore drill is present in `backupService.js`.
- The tenant deletion service explicitly throws `RESTORE_VERIFICATION_REQUIRED` / `RESTORE_VERIFICATION_REQUIRED`-style errors before physical deletion and states that a verified restore and approval workflow is required. This fail-closed behavior is correct and must remain.
- No backup or restore was executed.

Impact:
- A successful tenant SQL dump is not a complete tenant recovery point.
- Platform-wide recovery cannot be inferred from a tenant database dump.
- A database restore without matching object storage and Central metadata could leave the application inconsistent.

Required remediation:
1. Define backup tiers and recovery objectives (RPO/RTO) for Central DB, tenant operational DB/schema, MinIO objects and essential configuration.
2. Define consistency coordination and immutable manifest linking each database dump to object-storage snapshot/version and tenant identity.
3. Include key/secret recovery procedures without storing encryption keys inside the backup.
4. Implement isolated restore automation and periodic restore drills; verify row counts, tenant boundaries, file hashes and application smoke tests.
5. Keep permanent deletion blocked until independent restore evidence and approvals pass.

### GAP-0053 — Backup dump is not application-layer encrypted before cloud upload (revalidation of GAP-0035)

**Severity:** P1  
**Status:** Open — source-confirmed

Evidence:
- `backupService.js` imports `encrypt` but `createDump()` only pipes `pg_dump` through gzip into a temporary `.sql.gz` file.
- The upload functions stream/read that gzip artifact directly to Google Drive or OneDrive.
- No authenticated encryption step is applied to the backup artifact before upload.
- `encryption.js` implements AES-256-GCM, but that primitive is used for stored provider credentials in the deletion setup path, not the dump file itself.

Impact:
- Backup confidentiality relies on provider account permissions and transport/storage controls rather than application-managed encryption.
- A compromised cloud account or exposed backup object can disclose HR/payroll data.

Required remediation:
- Encrypt the completed artifact with authenticated encryption before upload; use a unique nonce and authenticated metadata.
- Store key material in a managed secret/KMS service, not in the backup or database.
- Define key rotation, recovery, access logging and decryption authorization.
- Add tamper detection and restore tests that decrypt and verify the artifact.
- Ensure temporary plaintext/gzip artifacts have restrictive permissions and are securely removed on success/failure.

### GAP-0054 — Notification settings frontend URL does not match mounted backend paths (revalidation of GAP-0034)

**Severity:** P2  
**Status:** Open — source-confirmed route composition mismatch

Evidence:
- `frontend/src/services/adminApi.js` calls `/settings/notifications` and `/settings/notifications/test-email`.
- `server.js` mounts `notification.routes.js` at `/api/v1/config/notifications`; that router defines relative `/notifications` paths.
- `server.js` separately mounts `notifications.routes.js` at `/api/v1/notifications`; that router also defines relative `/notifications` paths.
- Neither inspected mount produces `/api/v1/settings/notifications`.

Impact:
- Notification settings calls can return 404 even though similarly named backend handlers exist.

Required remediation:
- Choose one canonical mount/path, align frontend and backend, remove duplicate legacy route surface, and add route contract tests for GET/PUT/test email/test SMS.

## 4. Deployment and CI observations

- Backend CI installs dependencies with `npm ci --ignore-scripts`, generates both Prisma clients, and runs `npm test`.
- Frontend CI builds the production frontend but does not run browser E2E.
- Tenant migration integration CI provisions PostgreSQL 16 and runs only `tenant-migration-inventory.integration.test.js`; it does not prove full operational migration replay or restore.
- The workflow definitions were inspected, but no workflow run result was fetched for the current branch HEAD during this phase. Do not claim CI passed.
- Railway uses Nixpacks and the backend start command described in GAP-0051.
- No separate Dockerfile or Vercel configuration was established in this phase; absence from the inspected files is not a claim that no external configuration exists.
- `/health` is a simple process-level response; this source review did not establish database/object-store readiness checks or external uptime alerting.

## 5. API mapping scope and limits

The server's route mounts were compared with the frontend notification settings API. GAP-0054 is confirmed. The wider frontend-to-backend mapping across all modules is not yet complete; do not infer that all other API paths are correct or incorrect from this focused sample. Continue the mapping for auth, platform admin, employee, attendance, leave, payroll, documents, billing and onboarding in the next audit phase.

## 6. Phase 17 completion boundary

Completed:
- Source review of backup target policy, dump creation, compression, provider upload, retention and scheduler.
- Source review of restore/deletion guard and backup config schema.
- Source review of server router mounts and notification settings path.
- Source review of Railway startup migration and three GitHub Actions workflow definitions.
- Added/revalidated GAP-0050 through GAP-0054 in the master register.

Not performed:
- No source/application code changes.
- No backup or restore execution.
- No PostgreSQL connection, catalog query, migration, data export or deletion.
- No server boot, browser test, API request, network/SSRF test or external provider connection.
- No deployment or payment operation.
- No latest-HEAD CI pass claim.

**Next:** complete the broader frontend-to-backend route and payload/permission matrix, then reconcile all Cycle 01 findings and produce the P0/P1 improvement plan. The plan must receive independent verification before implementation begins. Keep `main` untouched.
