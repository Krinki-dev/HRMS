# Cycle 01 Improvement Plan — PostgreSQL Tenant Isolation and Whole-Product Stabilisation

**Document ID:** HRMS-CYCLE-01-PLAN  
**Date:** 2026-11-28 (Asia/Kolkata)  
**Repository:** `Krinki-dev/HRMS`  
**Working branch:** `architecture/postgres-tenant-isolation`  
**Protected branch:** `main` — never modify directly  
**Status:** Draft — awaiting independent verification  
**Source audit coverage:** Phases 1–22 recorded in `HRMS_Blueprint/cycles/`  
**Authority:** `35_MASTER_PROJECT_EXECUTION_AND_CONTINUITY_PLAN.md`, `07_FROZEN_DECISIONS.md`, `34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md`, current source and `37_MASTER_GAP_AND_RISK_REGISTER.md`

---

## 1. Executive recommendation

Keep the existing modular monolith and PostgreSQL-only architecture. Do not rewrite the product, add microservices, or introduce another database engine.

The implementation order must protect customer data first, then make the core SaaS/HR journeys usable, then complete module functionality and polish:

1. Fix confirmed P0 cross-company WebSocket disclosure and subscription-router startup blocker.
2. Prove tenant identity, storage routing, shared-schema company scoping and Central RLS role/policy behavior.
3. Stabilise provisioning and PostgreSQL migration lifecycle before any Paid customer cutover.
4. Make backup/restore complete and verifiable before enabling destructive deletion or relying on backups for recovery.
5. Fix frontend/backend contracts and core onboarding/billing/employee/expense workflows.
6. Close permission/object-ownership, upload/storage and durable-job gaps.
7. Expand CI, PostgreSQL integration and browser E2E so required suites cannot silently skip.
8. Complete module import/export and remaining product gaps.

**No production database migrations, deployment, real payments, customer-data deletion or customer DB connection enablement are included in this plan without separate explicit approval.**

## 2. Architecture constraints to preserve

- PostgreSQL only; Prisma remains the ORM.
- Keep the modular monolith.
- Central tenant UUID and operational company UUID remain distinct first-class identities.
- Free/Trial operational data uses shared `public` storage with strict tenant/company scoping.
- Paid tenant storage uses a UUID-derived dedicated PostgreSQL schema.
- Enterprise dedicated database is not a launch prerequisite.
- Central DB tables use transaction-scoped RLS helpers. Operational business tables intentionally do not use RLS under the frozen architecture; they require correct tenant routing and explicit `company_id` filters.
- App database role must not bypass Central RLS. Verify owner/BYPASSRLS behavior before sign-off.
- No automatic cloud synchronisation is promised for offline/self-hosted installations. Treat self-hosted PostgreSQL as an independent installation until a separate sync design is approved.
- Access JWT remains memory-only; refresh JWT remains an httpOnly cookie.
- AES-256-GCM is the current encryption format for new writes. Do not run the incompatible legacy PII migration script.
- Razorpay only for paid launch, manual renewal. No client-side mock payment bypass.
- Permanent deletion remains disabled until restore, tenant ownership and approval gates are independently verified.
- Do not enable customer-provided DB connections until every connection path and outbound network policy is verified.
- Do not run the legacy MSSQL migration history or blind Prisma migrate/db push against PostgreSQL.

## 3. Priority and release gates

### P0 — must pass before shared/Paid production use

- P0-A: Cross-company WebSocket isolation.
- P0-B: Server startup and payment webhook route wiring.
- P0-C: Tenant identity selection and JWT tenant/company binding.
- P0-D: Shared public-schema data isolation and Central RLS.
- P0-E: PostgreSQL migration baseline and schema compatibility.
- P0-F: Storage lifecycle correctness and Paid promotion guard.
- P0-G: Backup/restore proof before destructive deletion or customer-data cleanup.

### P1 — required for dependable customer workflows

- P1-A: Provisioning retry/recovery.
- P1-B: Billing, onboarding, employee and expense API contract fixes.
- P1-C: Permission and object ownership across HR modules.
- P1-D: Private file storage, malware scanning and secret/config validation.
- P1-E: Durable background queue and scheduled backup.
- P1-F: Deployment/migration readiness, monitoring and rollback.
- P1-G: CI integration tests and browser E2E.

### P2 — product completeness after P0/P1

- Complete relational XLSX import/export pipeline and workbook round-trip.
- CSV formula-injection protection and export safety.
- Module gaps in recruitment, performance, training, assets, expenses, reports and documents.
- Query-plan/index optimisation based on real catalog and workload evidence.
- Accessibility, responsive UX, performance and visual consistency.

## 4. Task register

All tasks begin as **Not Started**. A source-code commit alone does not complete a task. Completion requires every acceptance criterion and test evidence.

### P0 — Critical

#### HRMS-D-001 — Company-scoped WebSocket registration and broadcast

- **Stream/module:** D/F — Tenant identity, notifications, server WebSocket.
- **Findings:** GAP-0020.
- **Dependencies:** HRMS-D-003 (tenant/company identity contract).
- **Scope:** Bind one-time WebSocket tickets and registered sockets to verified tenantId + companyId + userId; scope company broadcasts; keep user notifications scoped to user.
- **Implementation steps:**
  1. Define the immutable socket identity payload issued by the authenticated ticket endpoint.
  2. Validate tenant membership and company membership before consuming/accepting a ticket.
  3. Store socket membership metadata, not just userId.
  4. Make pushToCompany filter by companyId; define and test platform-admin behavior separately.
  5. Remove stale socket membership on close/error/revocation.
- **Acceptance criteria:**
  - Company A broadcast reaches only Company A members.
  - Company B broadcast reaches only Company B members.
  - User-specific message reaches only intended user sockets.
  - Forged companyId, expired/replayed ticket, tenant switch and stale connection are rejected or isolated.
  - Platform-admin cross-company broadcast requires an explicit audited path.
- **Tests:** Unit tests for membership registry; API ticket tests; WebSocket integration test with at least two companies in one process.
- **Safety/rollback:** Feature flag/disable company broadcast if tests fail; never fall back to global broadcast.

#### HRMS-C-002 — Fix missing Razorpay webhook handler and server boot smoke test

- **Stream/module:** C/F — Subscription, payments, server startup.
- **Findings:** GAP-0021, GAP-0008, GAP-0066.
- **Dependencies:** None.
- **Implementation steps:**
  1. Confirm the intended Razorpay webhook event contract and supported events.
  2. Implement a real signature-verified handler or remove the unused route until it exists.
  3. Persist webhook event IDs and enforce idempotent processing.
  4. Bind order, amount, currency, tenant, invoice and subscription state to server-created payment_orders.
  5. Add router-load/server-start smoke test.
- **Acceptance criteria:**
  - Every route mounted by server has a callable handler.
  - Invalid/missing signature is rejected.
  - Replayed event does not double-activate or double-invoice.
  - Cross-tenant order/event is rejected.
  - Amount/currency mismatch is rejected.
  - Server route bootstrap test passes and the payment controller parses/loads with all payment providers either verified or explicitly disabled.
- **Tests:** Unit signature tests, webhook replay/idempotency integration tests with mocked gateway payloads, server boot test.
- **Safety:** No real payment or production webhook secret change. Sandbox only after separate approval.

#### HRMS-D-003 — Explicit tenant selection and identity binding

- **Stream/module:** D/A/C — Auth, Central user index, tenant middleware.
- **Implementation note (Phase 24):** explicit workspace chooser, tenant UUID request binding, tenant/company access and refresh token claims, direct signed-tenant refresh resolution, and source regression tests are implemented. Keep this task open until real login/OTP/refresh E2E and legacy membership backfill checks pass.
- **Findings:** GAP-0001, GAP-0065.
- **Dependencies:** None.
- **Implementation steps:**
  1. Make email/phone/employee lookup return all eligible workspace choices without disclosing unnecessary tenant data.
  2. Require the user to select a workspace or provide a verified workspace identifier.
  3. Resolve Central tenant UUID from that selection; never use unordered LIMIT 1.
  4. Bind login, OTP, refresh, logout and WebSocket ticket to tenantId and operational companyId.
  5. Reject JWT/header/host/company context mismatch; define company switching as a separate audited flow.
- **Acceptance criteria:**
  - Same email in two tenants produces two explicit choices.
  - Login cannot silently pick an arbitrary tenant.
  - Refresh preserves the same tenant context and rejects cross-tenant reuse.
  - JWT tenantId and operational companyId are distinct and consistently validated.
  - Platform admin scope is explicit and audited.
- **Tests:** Multi-tenant duplicate-email tests; login/OTP/refresh/tenant-switch negative tests; middleware forged-header and custom-domain tests.
- **Safety:** Do not change existing user memberships or tokens in production without a reviewed migration plan.

#### HRMS-D-004 — Shared-schema isolation and Central RLS verification

- **Stream/module:** D — PostgreSQL schemas, RLS, all company-scoped services.
- **Implementation note (Phase 25/27):** all 17 Central tables now have explicit RLS policies in both the incremental migration and fresh-install bootstrap. Static parity tests and a real PostgreSQL non-owner `hrms_app` pooling test pass in CI. The identified legacy Settings direct-client path is now disabled with HTTP 410; other Central access paths must still be reviewed. Before production rollout, obtain a DBA report proving the deployed role is not owner/superuser/BYPASSRLS. Full operational query ownership matrix remains open.
- **Findings:** GAP-0002, GAP-0030 (reclassified under frozen architecture), GAP-0047, GAP-0048, GAP-0046.
- **Dependencies:** HRMS-D-003.
- **Implementation steps:**
  1. Build a table-by-table ownership matrix for all operational models and Central models.
  2. Audit every Prisma/raw SQL query for companyId/tenantId scoping, including background jobs, reports, exports, WebSockets and admin tools.
  3. Add composite same-company FK constraints where they are safe and supported by existing data.
  4. Complete Central RLS policy matrix for every tenant-owned Central table; explicitly classify global tables.
  5. Ensure fresh-install bootstrap applies the same RLS policies as incremental migration path.
  6. Verify Central app role is not table owner/superuser/BYPASSRLS, or force RLS where approved.
- **Acceptance criteria:**
  - Company A cannot read/update/delete Company B data in every shared operational table.
  - Tenant A cannot access tenant B Central records.
  - Cross-company parent/child relationships are rejected at DB/service boundary.
  - Fresh install and upgrade paths produce equivalent Central RLS policies.
  - Tests run as non-owner application role and prove RLS enforcement.
- **Tests:** Full PostgreSQL cross-tenant matrix, raw SQL tests, role/BYPASSRLS catalog test, FK integrity test.
- **Safety:** Read-only inventory first; no production RLS or FK migration until data-cleanliness and rollback plans are approved.

#### HRMS-D-005 — Canonical PostgreSQL tenant migration baseline

- **Stream/module:** D — Prisma and migrations.
- **Findings:** GAP-0003, GAP-0041, GAP-0048.
- **Dependencies:** HRMS-D-004.
- **Implementation steps:**
  1. Inventory every tenant schema/table/column/index/FK and existing customer DB version.
  2. Separate historical MSSQL migration files from executable PostgreSQL migration history.
  3. Design a versioned PostgreSQL baseline for clean installs and existing tenant adoption.
  4. Use explicit migration locks, version markers, idempotency and safe retry.
  5. Verify Central bootstrap and RLS policy ordering.
  6. Remove automatic schema migration from application startup; use a serialized release migration job.
- **Acceptance criteria:**
  - Clean PostgreSQL database can be provisioned from the documented baseline.
  - Existing tenant schema can be classified and migrated without data loss.
  - Re-running migration is safe and recorded.
  - Partial failure is detectable and recoverable.
  - App cannot become ready when a required migration failed.
  - No MSSQL SQL is executed against PostgreSQL.
- **Tests:** Disposable PostgreSQL 16 clean install, upgrade, partial failure, concurrent lock, rollback/forward-fix tests.
- **Safety:** No live tenant migration or production DDL without explicit approval and verified backups.

#### HRMS-C-006 — Storage lifecycle and paid promotion state machine

- **Stream/module:** C/D — Registration, tenant resolver, storage allocation.
- **Implementation note (Phase 27):** legacy Settings DB-config GET/PUT/test endpoints now return 410; direct Central Prisma access, plaintext credential writes and arbitrary outbound connection tests are removed; obsolete UI tab removed. Existing legacy credential rows remain untouched and require a separately approved inventory/remediation. Other provisioning/preflight DB connection paths still require feature-gate and egress-policy verification.
- **Findings:** GAP-0004, GAP-0005, GAP-0042, GAP-0043, GAP-0044, GAP-0045.
- **Dependencies:** HRMS-D-003, HRMS-D-005.
- **Implementation steps:**
  1. Define allowed storage modes and statuses from frozen PostgreSQL-only policy.
  2. Keep Free/Trial in public; Paid only after UUID-derived dedicated schema is created and verified.
  3. Add idempotent lease claim/retry/resume/compensation using existing lease fields.
  4. Disable/deprecate legacy Settings DB-config writes that do not update canonical routing; encrypt credentials at rest and redact all secrets from API responses.
  5. Gate every customer-supplied DB connection path, including test endpoints; validate PostgreSQL-only modes and block unsupported database types.
  6. Keep customer-managed DB modes disabled until SSRF/network egress policy is verified.
- **Acceptance criteria:**
  - New Free/Trial signup uses only approved shared public schema.
  - Paid checkout is blocked until dedicated storage is ready.
  - Repeated/retried provisioning cannot create duplicate schemas or users.
  - Expired leases can be safely reclaimed.
  - Failed provisioning is recoverable without unsafe duplicate email/subdomain records.
  - No unapproved DB URL/host path bypasses feature gate.
  - Legacy DB config GET responses never return raw URLs/passwords; stored credentials use the approved encryption codec; unsupported DB modes are rejected and legacy UI cannot imply active routing changed.
- **Tests:** State-machine unit tests, concurrent signup integration tests, crash-window/retry tests, mock network allow/deny tests.
- **Safety:** Never connect to customer-supplied network endpoints in production until outbound policy passes independent review.

#### HRMS-F-007 — Complete backup and restore architecture before deletion

- **Stream/module:** F — Backup, restore, object storage, tenant deletion.
- **Findings:** GAP-0006, GAP-0035, GAP-0050, GAP-0052, GAP-0053.
- **Dependencies:** HRMS-D-004, HRMS-D-005.
- **Implementation steps:**
  1. Define RPO/RTO and backup scope for Central DB, tenant DB/schema, MinIO objects and required configuration.
  2. Repair scheduler registration and schedule schema (frequency, time, timezone, multi-replica locking).
  3. Add application-layer authenticated encryption with managed key recovery.
  4. Add immutable manifest linking tenant, schema, DB dump and object versions.
  5. Implement tenant-safe restore for shared and dedicated storage.
  6. Perform isolated restore drills and verify tenant row/file integrity.
  7. Keep deletion and cleanup blocked until restore/approval criteria pass.
- **Acceptance criteria:**
  - Scheduled backups demonstrably execute once per due interval.
  - Backup includes all defined data classes or explicitly reports exclusions.
  - Encrypted artifacts cannot be read/tampered with without the managed key.
  - Restore recovers Central metadata, tenant data and referenced files consistently.
  - Shared-tenant restore does not overwrite or expose another tenant.
  - Restore drill evidence is retained and deletion gate consumes it.
- **Tests:** Backup scheduler fake-clock tests, encryption/tamper tests, disposable Postgres/object store restore tests, tenant-isolation restore tests.
- **Safety:** Do not run backups against customer data or enable permanent deletion without separate approval.

### P1 — Core product and operational reliability

<!-- HRMS-C-008 was merged into HRMS-C-006 during plan verification round 1; do not create a duplicate implementation task. -->

#### HRMS-E-009 — Frontend/backend API contract repair
- **Findings:** GAP-0015, GAP-0016, GAP-0017, GAP-0032 residual, GAP-0034, GAP-0055, GAP-0056, GAP-0057, GAP-0058, GAP-0059, GAP-0060.
- **Scope:** Legacy tenant HR `/hr` API paths and sidebar/App route mismatches; ESS nested route prefixes; employee address listing; photo upload method; expense receipt upload path/field; notification route; Billing order request shape; global response envelope; onboarding salary component route.
- **Acceptance:** Shared API contract tests cover path, method, request payload, multipart field, response envelope and status code. Dashboard, onboarding resume, Billing and employee/expense workflows pass browser E2E.
- **Important:** Do not patch individual double-unwrapping sites without choosing one canonical API response convention.

#### HRMS-A-010 — Permission and object-ownership hardening
- **Findings:** GAP-0009, GAP-0018, GAP-0022–0029, GAP-0036.
- **Scope:** Leave list/balances, attendance approvals, recruitment feedback/offers, performance mutations, training operations, asset lifecycle, expense claims, payroll payslips/bonuses, employee bank/document children.
- **Acceptance:** Every route checks permission; every service query/mutation scopes tenant/company and parent ownership; negative tests prove cross-company IDOR attempts fail.

#### HRMS-F-011 — Secure file storage and upload lifecycle
- **Findings:** GAP-0011, GAP-0028, GAP-0037, GAP-0062, GAP-0063.
- **Scope:** Private employee photos/documents/receipts, MinIO least privilege, ClamAV config, file size/type/content checks, signed downloads, no public static sensitive file paths.
- **Acceptance:** Uploads fail closed without scanner; default MinIO credentials rejected in production; cross-tenant downloads denied; signed URLs expire; cleanup and malware rollback work.

#### HRMS-F-012 — Durable KYC automation queue
- **Findings:** GAP-0061.
- **Scope:** Replace in-memory-only KYC queue with durable Redis/BullMQ or approved PostgreSQL lease queue; recover pending tasks after restart; ensure duplicate-safe workers. Backup scheduling remains exclusively in HRMS-F-007.
- **Acceptance:** Restart, retry, concurrent worker and dead-letter tests pass; no task silently disappears.

#### HRMS-F-013 — Deployment and environment readiness
- **Findings:** GAP-0013, GAP-0051, GAP-0062, GAP-0063.
- **Scope:** Canonical env registry; required secret validation; fail deploy on migration failure; separate migration job; readiness vs liveness; alerts/runbooks/rollback.
- **Acceptance:** Missing/placeholder secrets fail startup; no default storage credentials; health/readiness endpoints accurately report dependencies; failed migration prevents release; exact deploy commit and health evidence recorded.

#### HRMS-F-014 — CI and test reliability
- **Findings:** GAP-0019, GAP-0031; access-token persistence regression guard.
- **Scope:** Ensure PostgreSQL RLS/auth/payroll/compliance suites actually execute; add API contract and browser E2E; detect skipped required suites.
- **Acceptance:** CI fails when required integration env is missing or tests skip; backend tests, frontend build, PostgreSQL integration and core browser journeys pass at exact same commit SHA. AuthStore regression test proves accessToken is excluded from persisted state and legacy values are purged.

#### HRMS-A-015 — Core HR end-to-end workflows
- **Findings:** GAP-0007, GAP-0012, GAP-0040 and module tracker gaps.
- **Scope:** Login → company selection → employee create/update → attendance → leave → payroll → compliance → reports. Include attendance check-in metadata argument alignment and verify location/IP collection is limited to approved privacy requirements.
- **Acceptance:** Each journey passes with correct role, tenant/company isolation, validation, error recovery and audit trail.

#### HRMS-F-019 — Remove static encryption fallback and harden key lifecycle

- **Findings:** GAP-0064.
- **Dependencies:** HRMS-F-013 (environment registry/validation).
- **Scope:** Remove the literal fallback key from the shared encryption helper; fail closed in every process/script/worker; define versioned key rotation and legacy ciphertext handling.
- **Acceptance:** Importing the encryption helper without a valid ENCRYPTION_KEY fails; all process entrypoints validate key configuration; AES-256-GCM round-trip succeeds; modified ciphertext/tag fails authentication; legacy CBC reads remain compatibility-only and have a documented retirement plan.
- **Tests:** Missing/short key tests, tamper tests, helper-only script tests, process entrypoint tests, encrypted credential compatibility tests.
- **Safety:** Do not run the incompatible `migrate-pii-encryption.js`; no production key rotation or ciphertext rewrite without a separately reviewed recovery/rollback plan.

### P2 — Product completeness and optimisation

#### HRMS-F-016 — Reusable CSV/XLSX import/export pipeline
- **Findings:** GAP-0010, GAP-0038, GAP-0039.
- **Acceptance:** Preview, validation, duplicate detection, user confirmation, transaction, row-level errors, audit trail, formula-injection protection and relational XLSX round-trip for applicable modules.

#### HRMS-B-017 — Remaining product module completeness
- **Findings:** GAP-0014 plus module-specific tracker findings.
- **Scope:** Recruitment, performance, training, assets, expenses, documents, reports, notification delivery and ESS.
- **Acceptance:** Each module has documented requirements, FE/BE/DB/API/RBAC/import-export/tests/E2E/OPS evidence.

#### HRMS-D-018 — Query/index optimisation
- **Findings:** GAP-0049.
- **Acceptance:** Use live catalog and query plans; add only indexes supported by measured workload; validate migration impact and write overhead.




## 5. Gap-to-task traceability matrix

Every finding from the master register is accounted for below. “Merged” means its evidence remains retained but the implementation work is performed under the parent task. “Superseded” means current source/frozen architecture corrected the original claim; any independent runtime verification remains assigned to the listed task.

| Gap ID | Task / disposition | Status note |
|---|---|---|
| GAP-0001 | HRMS-D-003 | Fixed — Awaiting end-to-end login/OTP/refresh verification; token identity and explicit selection tests pass at Phase 24 SHAs |
| GAP-0002 | HRMS-D-004 | Open P0 — shared operational isolation proof |
| GAP-0003 | HRMS-D-005 | Open P0 — PostgreSQL migration baseline |
| GAP-0004 | HRMS-C-006 | Open P0 — storage lifecycle |
| GAP-0005 | HRMS-C-006 | Open P1 — lease/retry/recovery |
| GAP-0006 | HRMS-F-007 | Open P0 — backup/restore and shared tenant recovery |
| GAP-0007 | HRMS-A-015 | Open P1 — core HR workflow E2E |
| GAP-0008 | HRMS-C-002 | Open P1 — webhook idempotency/reconciliation |
| GAP-0009 | HRMS-A-010 | Open P1 — RBAC and ownership |
| GAP-0010 | HRMS-F-016 | Open P2 — CSV/XLSX pipeline |
| GAP-0011 | HRMS-F-011 | Open P1 — storage/scanner validation |
| GAP-0012 | HRMS-A-015 | Open P1 — browser E2E/responsive audit |
| GAP-0013 | HRMS-F-013 | Open P1 — staging/deployment/monitoring |
| GAP-0014 | HRMS-B-017 | Open P1 — module completeness |
| GAP-0015 | HRMS-E-009 | Open P1 — legacy /hr API paths |
| GAP-0016 | HRMS-E-009 | Open P1 — sidebar/App route alignment |
| GAP-0017 | HRMS-E-009 | Open — ESS nested route runtime verification |
| GAP-0018 | HRMS-A-010 | Open P1 — attendance approval permission/scope |
| GAP-0019 | HRMS-F-014 | Open P1 — CI/browser E2E |
| GAP-0020 | HRMS-D-001 | Fixed — Awaiting real WebSocket integration test; unit isolation tests pass at Phase 23 CI SHA |
| GAP-0021 | HRMS-C-002 | Verified Closed for missing export — route handler callable and router-load test passed; settlement tests remain |
| GAP-0022 | HRMS-A-010 | Open P1 — leave list permissions |
| GAP-0023 | HRMS-A-010 | Open P1 — leave balance controller/service/IDOR |
| GAP-0024 | HRMS-A-010 | Open P1 — recruitment ownership |
| GAP-0025 | HRMS-A-010 | Open P1 — performance ownership |
| GAP-0026 | HRMS-A-010 | Open P1 — training ownership |
| GAP-0027 | HRMS-A-010 | Open P1 — asset ownership |
| GAP-0028 | HRMS-F-011 | Open P1 — receipt upload security/ClamAV |
| GAP-0029 | HRMS-A-010 | Open P1 — payroll controller/service contract |
| GAP-0030 | Superseded under frozen design | Operational DB intentionally has no RLS; isolation remains tracked under GAP-0002/HRMS-D-004 |
| GAP-0031 | HRMS-F-014 | Fixed for backend integration execution — 5 DB suites run with zero skips at Phase 25 SHA; frontend E2E remains GAP-0019 |
| GAP-0032 | HRMS-E-009 | Partially superseded; missing salary-components endpoint remains GAP-0059 |
| GAP-0033 | Superseded at source level; HRMS-F-011 | Routes now exist; storage/scanner/reviewer runtime verification remains |
| GAP-0034 | HRMS-E-009 | Open P2 — notification route mismatch |
| GAP-0035 | HRMS-F-007 | Open P1 — backup artifact encryption |
| GAP-0036 | HRMS-A-010 | Open P1 — employee bank/document ownership |
| GAP-0037 | HRMS-F-011 | Open P1 — public employee photo storage |
| GAP-0038 | HRMS-F-016 | Open P2 — relational XLSX |
| GAP-0039 | HRMS-F-016 | Open P1 — CSV formula injection |
| GAP-0040 | HRMS-A-015 | Open P2 — attendance metadata argument mismatch |
| GAP-0041 | HRMS-D-005 | Open P1 — MSSQL/PG migration history |
| GAP-0042 | HRMS-C-006 | Open P1 — customer DB feature-gate coverage |
| GAP-0043 | HRMS-C-006 | Fixed for legacy Settings test endpoint — HTTP 410; other provisioning/preflight egress paths remain under GAP-0042 |
| GAP-0044 | HRMS-C-006 | Fixed for legacy Settings API — read/write path disabled; existing stored legacy credentials inventory/remediation pending |
| GAP-0045 | HRMS-C-006 | Fixed — legacy Database Settings UI removed and endpoints return HTTP 410; existing rows untouched |
| GAP-0046 | HRMS-D-004 | Open P1 — same-company composite FK integrity |
| GAP-0047 | HRMS-D-004 | Fixed in source — 17-table migration/bootstrap policies and RLS pooling test; live app-role/catalog verification pending |
| GAP-0048 | HRMS-D-004 / HRMS-D-005 | Fixed in source — 17-table bootstrap/migration parity test; clean-install execution and live catalog comparison pending |
| GAP-0049 | HRMS-D-018 | Open P2 — evidence-based index review |
| GAP-0050 | HRMS-F-007 | Open P1 — scheduler wiring and schedule field mismatch |
| GAP-0051 | HRMS-F-013 | Open P1 — fail deployment on migration errors |
| GAP-0052 | HRMS-F-007 | Merged into GAP-0006 — incomplete DR scope/restore |
| GAP-0053 | HRMS-F-007 | Merged into GAP-0035 — dump encryption |
| GAP-0054 | HRMS-E-009 | Merged into GAP-0034 — notification route mismatch |
| GAP-0055 | HRMS-E-009 | Open P2 — employee address list endpoint |
| GAP-0056 | HRMS-E-009 / HRMS-F-011 | Open P1 — receipt upload path/field and upload security |
| GAP-0057 | HRMS-E-009 / HRMS-F-011 | Open P1 — employee photo upload method/storage |
| GAP-0058 | HRMS-E-009 | Open P1 — Billing subscription order request contract |
| GAP-0059 | HRMS-E-009 | Open P1 — onboarding salary-components route |
| GAP-0060 | HRMS-E-009 | Open P1 — global response-envelope double unwrapping |
| GAP-0061 | HRMS-F-012 | Open P1 — durable KYC task queue/restart recovery |
| GAP-0062 | HRMS-F-013 / HRMS-F-011 | Open P1 — environment manifest and required runtime settings |
| GAP-0063 | HRMS-F-011 / HRMS-F-013 | Open P1 — MinIO default credentials |
| GAP-0064 | HRMS-F-019 | Open P1 — hard-coded encryption fallback |
| GAP-0065 | HRMS-D-003 | Fixed — Awaiting end-to-end login/refresh verification; explicit selector and signed tenant binding tests pass at Phase 24 SHAs |
| GAP-0066 | HRMS-C-002 | Verified Closed — payment controller parse blocker fixed; backend CI passed at SHA 97c60ad1 |

## 6. Cross-task dependencies and execution order

1. HRMS-D-003 → HRMS-D-004 → HRMS-D-005 → HRMS-C-006.
2. HRMS-D-001 can begin immediately after identity contract is agreed; coordinate with HRMS-D-003.
3. HRMS-C-002 is independent and should be fixed with a server boot test before broader integration.
4. HRMS-F-007 depends on the canonical migration/storage model and must remain a gate before deletion.
5. HRMS-E-009 can proceed after route/response contract decisions; it does not require production DB access.
6. HRMS-A-010 should be grouped by module and tested with shared cross-company fixtures.
7. HRMS-F-011 and HRMS-F-012 can proceed after configuration/identity contracts.
8. HRMS-F-013 and HRMS-F-014 should be built alongside each code batch, not postponed to the end.
9. HRMS-A-015 and P2 tasks follow after P0/P1 security and reliability exit criteria.

## 7. Owner decisions required before the affected product work

These are not technical defaults to silently infer. Use the recommendation in `34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md` unless the owner chooses otherwise.

- **OD-01 Pricing:** The frozen decision of no hard employee cap is settled and must not be reopened. Confirm only whether pricing is flat regardless of active employee count, or whether a customer may have unlimited employees while plan/add-on fees are still calculated per active employee. Current code contains employee caps/overage and per-employee module pricing, so the billing model must be reconciled before pricing implementation.
- **OD-02 Free vs Trial:** Confirm whether users explicitly choose Free or 90-day Trial; current signup starts Free and trial activation is separate.
- **OD-03 Self-hosted/offline:** Recommended launch scope is an independent local PostgreSQL installation, not cloud synchronization. Confirm before promising or implementing sync.
- **OD-04 Backup destinations:** Confirm whether both Google Drive and OneDrive remain launch options or one is sufficient. Regardless, server-managed encrypted backup and restore verification are required.
- **OD-05 Retention/deletion:** Record-class retention and legal hold need qualified Indian legal/compliance review before permanent erasure is enabled.

Tasks that do not depend on these choices may proceed after plan verification. Do not block P0 security fixes waiting for unrelated pricing decisions.

## 8. Explicitly excluded until separate approval

- Production or customer database migration/DDL.
- Customer schema/data cleanup or deletion.
- Permanent tenant erasure.
- Production deployment or infrastructure changes.
- Real payments, refunds, payouts or webhook secret rotation.
- Enabling customer-managed DB connectivity.
- Enabling paid tenants or changing live tenant storage allocations.
- Enabling permanent deletion or claiming backup/restore readiness without a successful drill.

## 9. Definition of Cycle 01 completion

Cycle 01 can be closed only when:
- All P0 tasks are verified with tests and recorded evidence.
- All P1 tasks are either verified or explicitly deferred/blocked with owner and reason.
- Core HR journeys pass E2E.
- Required PostgreSQL integration suites execute (not silently skip).
- The full module tracker has no unassessed core dimension hidden behind a summary percentage.
- Backup/restore and deletion safeguards are independently verified.
- Full re-analysis is complete and new findings are entered into the register.
- The exact commit and CI evidence are recorded.
- No production-ready claim is made until owner approvals and production operational gates pass.

## 10. Plan verification requirement

This plan is **not approved for implementation yet**. Create `CYCLE-01-PLAN-VERIFICATION.md` as a separate review. Verify:
- all P0/P1 findings map to tasks,
- no task violates frozen decisions,
- dependencies and sequencing are safe,
- acceptance criteria are objective and testable,
- tasks are small enough to implement and review,
- migrations/backup/deletion/payment/network safety gates are explicit,
- unresolved owner choices are isolated,
- no production action is implied.

Only after the verification report says **Verified** may implementation begin. If it says **Verified with required corrections**, revise this plan and verify again.
