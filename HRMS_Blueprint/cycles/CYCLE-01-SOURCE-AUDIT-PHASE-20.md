# Cycle 01 Source Audit — Phase 20: Background Jobs, Storage Configuration and Runtime Readiness

**Date:** 2026-11-28 (Asia/Kolkata)  
**Repository:** `Krinki-dev/HRMS`  
**Branch:** `architecture/postgres-tenant-isolation`  
**Scope:** Automation task queue durability, worker startup, MinIO/ClamAV configuration, environment template completeness, local dependency compose configuration, and health-check behavior.

## 1. Executive summary

Phase 20 reviewed the asynchronous Aadhaar KYC task path and infrastructure configuration.

Three source-level operational risks were identified:
- The automation queue is an in-process JavaScript array, not a durable BullMQ/Redis queue. Task rows are stored in PostgreSQL, but the inspected worker has no startup recovery scan to re-enqueue pending tasks. A process restart can leave queued tasks stranded.
- The environment template omits several variables that active code paths depend on, including ClamAV host/port, the customer database feature gate, the cloud tenant database URL and the Central direct URL. Razorpay keys are still commented as “add when billing is implemented” although paid subscription checkout code is present.
- MinIO client configuration silently falls back to `minioadmin/minioadmin` when access credentials are missing, and server startup validates JWT/encryption secrets but does not reject default MinIO credentials in production.

The server health endpoint is a process-only response, not a readiness check for Central PostgreSQL, tenant PostgreSQL, MinIO, ClamAV or background workers.

## 2. Evidence inventory

| File | Blob SHA | Evidence |
|---|---|---|
| `backend/modules/automation/automation.queue.js` | `9700bdc0027b995014f42166bcba923e47f2b5a1` | In-memory `taskQueue`, local concurrency counter, `startWorker()` only logs |
| `backend/modules/automation/automation.routes.js` | `8a1d3599a6149e26edbaa358cab4d5363d87689d` | Creates DB task row then calls `enqueue()` |
| `backend/modules/automation/kyc/kyc.routes.js` | `9597a8b15c50ad807fbb6534b036690f4d7f3202` | Second KYC route path also enqueues task in process |
| `backend/modules/automation/kyc/kyc.worker.js` | `26ae5280edba2de48cf520ff6c5832a842b8427b` | Executes KYC task and updates task state |
| `backend/server.js` | `8a412ffed98826379fc832ea90b99c8ff97a9097` | Calls automation `startWorker()`; validates JWT/encryption vars; simple /health endpoint |
| `backend/shared/utils/minio.js` | `32d6c3cdc73721226ab6f35829829398e8ab41d0` | MinIO credentials default to minioadmin; bucket initialization |
| `backend/shared/utils/clamavScanner.js` | `96f835ad52eb5a35a10aa88440f2419f25e37944` | ClamAV requires CLAMAV_HOST/PORT and fails closed when absent |
| `backend/.env.example` | `b3dac4ad91184dcd7b023a5ceaf28ad285a86f13` | Environment template lacks several runtime variables; Razorpay keys commented out |
| `HRMS_Blueprint/docker-compose.yml` | `997be3c4650e870ac3953695865b55608321c329` | Local PostgreSQL/Redis/MinIO services and development defaults |
| `backend/package.json` | `57063e701a437714076c565c58bc85e04d53aa57` | BullMQ and Redis packages installed, but not used by inspected automation queue |

## 3. Findings

### GAP-0061 — Automation tasks use a volatile in-process queue without restart recovery

**Severity:** P1  
**Status:** Open — source-confirmed

Evidence:
- `automation.routes.js` and `kyc.routes.js` create `automation_tasks` database records and call `enqueue()`.
- `automation.queue.js` stores pending work in module-local `const taskQueue = []`.
- The queue uses an in-memory `activeWorkers` counter and processes only entries pushed into that process.
- `startWorker()` only logs the in-process concurrency setting and returns; it does not connect to Redis/BullMQ or scan persisted task rows.
- `BullMQ` and Redis dependencies are listed in `backend/package.json`, but the inspected queue does not import or use them.
- No startup recovery logic for pending/running KYC task records was found in the inspected queue module.

Impact:
- If the server restarts after a task row is created/enqueued but before it completes, the in-memory queue entry is lost.
- Persisted task rows may remain pending/running without being resumed.
- An in-process queue is also local to one server instance and cannot provide coordinated work distribution across multiple replicas.

Required remediation:
1. Use a durable queue (BullMQ/Redis) or a PostgreSQL-backed claim/lease queue with atomic task acquisition.
2. Persist retry count, lease owner/expiry, attempt timestamps, and terminal state.
3. On worker startup, recover expired leases and requeue eligible pending tasks.
4. Make task execution idempotent and prevent duplicate KYC automation.
5. Add restart, concurrent-worker, retry and poison-task integration tests.
6. Document Redis availability and fail/queue behavior; do not silently claim durable background processing until verified.

### GAP-0062 — Environment template does not describe required runtime configuration

**Severity:** P1  
**Status:** Open — source-confirmed documentation/configuration gap; deployment values unknown

Evidence:
- `clamavScanner.js` requires `CLAMAV_HOST` and uses `CLAMAV_PORT`; absent configuration causes malware scanning to fail closed.
- Company-document upload checks for ClamAV configuration and refuses uploads if scanner/storage dependencies are unavailable.
- Source uses `CUSTOMER_DATABASE_CONNECTIONS_ENABLED`, `CLOUD_TENANT_DATABASE_URL`, and `CENTRAL_DIRECT_URL` for customer DB gating, tenant storage routing and deployment migration selection.
- These variables are absent from `backend/.env.example`.
- Razorpay key variables are commented out under a stale “add when billing is implemented” note, despite active subscription-order and verification handlers.
- The template's MinIO bucket example is `hrms`, while `minio.js` defaults to `hrms-files`.

Impact:
- Local/staging setup can omit required services or use mismatched bucket/config names.
- Operators may not know which variables are mandatory for document upload, tenant routing, migration execution or live billing.
- The actual Railway environment values are not visible in this source audit, so this is not evidence that production is misconfigured.

Required remediation:
1. Generate a canonical environment-variable registry from code usage.
2. Mark each variable required/optional, development/production, secret/non-secret, and owning subsystem.
3. Add ClamAV, Redis/queue, Central direct URL, cloud tenant DB URL, customer-DB feature flag, Razorpay, MinIO and monitoring settings to the template with safe placeholders.
4. Validate required production values at startup and fail with clear messages.
5. Add an automated test that checks the environment template covers all required runtime configuration keys without exposing secrets.

### GAP-0063 — MinIO silently accepts default administrator credentials

**Severity:** P1  
**Status:** Open — source-confirmed unsafe fallback; exploitability depends on deployment network/configuration

Evidence:
- `minio.js` uses `process.env.MINIO_ACCESS_KEY || 'minioadmin'` and `process.env.MINIO_SECRET_KEY || 'minioadmin'`.
- `server.js` startup validation checks JWT access, JWT refresh and encryption keys, but does not reject missing/default MinIO credentials in production.
- `startServer()` calls `minio.ensureBucket()`, which constructs the client using those fallback credentials.
- `docker-compose.yml` also has development defaults for MinIO and should not be used as a production credential source.

Impact:
- A production environment that omits MinIO credentials can attempt to authenticate with well-known default administrator credentials.
- If the configured MinIO endpoint accepts those defaults and is reachable, object storage could be exposed or modified.
- Actual endpoint reachability and deployed credential values were not inspected.

Required remediation:
1. Remove administrator credential fallbacks from production code.
2. Require explicit, non-default MINIO_ACCESS_KEY and MINIO_SECRET_KEY in production startup validation.
3. Use a least-privilege service identity scoped to the required bucket operations.
4. Keep MinIO private behind network controls and TLS.
5. Add startup tests that reject missing/default production credentials and verify private bucket policy.

## 4. Runtime and health observations

- `GET /health` returns a success response without checking PostgreSQL, MinIO, ClamAV or worker readiness. Treat it as liveness only.
- `startServer()` requires MinIO bucket initialization outside development; if MinIO is unavailable, startup throws. This is fail-closed for object storage but means storage availability is a hard startup dependency.
- ClamAV scanning itself fails closed when not configured or when scanner response is invalid. This is a positive security control; deployment configuration must therefore include and monitor ClamAV.
- The blueprint Docker Compose file supplies PostgreSQL 16, Redis 7 and MinIO for local development. It does not include ClamAV, so document upload cannot pass the scanner readiness check without an additional ClamAV service/configuration.
- No actual environment values, service reachability, container startup, queue execution, health probe or CI run was tested.

## 5. Phase 20 completion boundary

Completed:
- Inspected queue enqueue path, in-memory queue, worker startup and KYC worker.
- Inspected environment template, MinIO credential defaults, ClamAV requirements, server health and local compose configuration.
- Added GAP-0061 through GAP-0063.

Not performed:
- No application code changed.
- No Redis, PostgreSQL, MinIO or ClamAV service was connected.
- No KYC automation, backup, migration, payment, server boot or deployment was run.
- No current-HEAD CI pass claim.

**Next:** reconcile all Cycle 01 findings, verify which gaps are duplicates/superseded, complete any remaining high-risk source paths, and produce a prioritized improvement plan with acceptance tests. Independent plan verification remains mandatory before application changes. Keep `main` untouched.
