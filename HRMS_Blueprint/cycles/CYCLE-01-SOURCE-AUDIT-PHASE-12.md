# Cycle 01 — Fresh Source Audit (Phase 12: Critical Wiring and CI Revalidation)

- Audit ID: HRMS-C01-AUDIT-P12
- Repository: Krinki-dev/HRMS
- Branch: architecture/postgres-tenant-isolation
- Exact source SHA inspected: cd400a602eb255029c1daeeae1d35f0c7b7ee948
- Date: 2026-11-27
- Status: In Progress — current-source findings confirmed; runtime verification remains pending.
- Application code changed: No. No tests, server boot, browser, database, production, payment or deployment operation was performed.

## 1. Exact-head source evidence

| File | Blob SHA |
|---|---|
| backend/server.js | 8a412ffed98826379fc832ea90b99c8ff97a9097 |
| backend/modules/notifications/notifications.service.js | 49c74634388bd2f95262011cd75208d6a4d344b5 |
| backend/shared/utils/wsTicket.js | b44d5bed3cc655d97ec7519ccadda7e678962f32 |
| backend/modules/platform/subscription.routes.js | 0e51eb72c46d23588198b603694edea298cf84f2 |
| backend/modules/platform/payment.controller.js | 7e48f4fbe142c39184da86e1ebc1b5c0427125a2 |
| backend/modules/leave/leave.routes.js | 6eec514b9a01a6bd9bd6d2ddeff97cb1e1e084c9 |
| backend/modules/leave/leave.controller.js | c9af3e44a60e0ad5795133af6508873003bf4863 |
| backend/modules/leave/leave.service.js | 1e4411d7d80ac7f0f1bc1d77284b2b0c68419770 |
| backend/modules/payroll/payroll.controller.js | 8952b3325d2e58f7ee5597cc968a853ada6068ac |
| backend/modules/payroll/payroll.service.js | 2cf10c98a8976397aa56253e333aa9e62e386948 |
| backend/modules/attendance/attendance.controller.js | 65ca55fded7ef87537cccc1164361067eb8eb177 |
| backend/modules/attendance/attendance.service.js | 611ab04357a99f1cdc1c31c62cf5b1117ea567cd |
| backend/test/README.md | 0c0f73d3efa5c913239a3d6b601ccb1541da290a |
| .github/workflows/backend-tests.yml | f4785c0323c17dbc9150879a53c0d5765b66bbc7 |
| .github/workflows/tenant-migration-integration.yml | 5b8f38e22ae7e88eba1f0e0f0c11718082c799d4 |
| .github/workflows/frontend-build.yml | 54900bc18a2718144c43946e0787b846cca1d3d9 |

## 2. GAP-0020 — company WebSocket broadcast remains unscoped

**Status:** Source-confirmed at exact head; runtime negative test pending. **Severity: P0.**

- server.js consumes a WebSocket ticket and receives only a user ID, then registers the socket by user ID. No company context is bound to the connection.
- wsTicket.js stores only userId and expiry.
- notifications.service.js stores sockets by user ID. pushToCompany(companyId, payload) never uses companyId to select sockets; it iterates every connected socket and sends the company announcement to all.
- Company-wide announcement creation calls pushToCompany(companyId, wsPayload).

Impact: company A announcements can be delivered to users connected under other companies in the same backend process.

Required fix after plan verification: bind each socket to an immutable server-resolved tenant/company context; filter broadcasts by exact company; never trust client-supplied company IDs; handle company switching and replay/expiry; add Company A/B negative integration tests.

## 3. GAP-0021 — Razorpay webhook route references a non-exported handler

**Status:** Source-confirmed at exact head; isolated boot reproduction pending. **Severity: P0 candidate.**

- subscription.routes.js registers router.post('/razorpay-webhook', paymentController.handleWebhook).
- payment.controller.js defines/exports handlePhonePeWebhook, handleJioPayWebhook and handlePayoutWebhook, but contains no handleWebhook definition/export.
- server.js directly requires subscription.routes.js during route mounting, outside safeUse.

Impact: Express is expected to reject the undefined route callback while loading the router, potentially preventing backend startup. Confirm with a safe isolated boot smoke test and capture exact error before closure.

Required fix after plan verification: implement/export the intended Razorpay webhook using raw-body signature verification, tenant/order binding, idempotency and replay protection, or remove the route only if a reviewed replacement is intended. Add route registration and signed/invalid/replayed webhook tests; never send real payments.

## 4. GAP-0031 — critical PostgreSQL integration suites are not required by standard CI

**Status:** Workflow configuration source-confirmed; completed-run skip counts pending. **Severity: P1.**

- backend-tests.yml runs npm test but does not set RLS_TEST_APP_DATABASE_URL, AUTH_TEST_CENTRAL_DATABASE_URL, PAYROLL_TEST_TENANT_DATABASE_URL or COMPLIANCE_TEST_TENANT_DATABASE_URL.
- backend/test/README.md says these PostgreSQL integration suites skip automatically unless their variables are configured.
- tenant-migration-integration.yml provisions PostgreSQL but runs only tenant-migration-inventory.integration.test.js.
- Therefore green generic backend CI does not prove that RLS/auth/payroll/compliance database suites executed.
- frontend-build.yml builds the frontend only; it is not browser/E2E coverage.

Required direction: provision disposable Central and tenant PostgreSQL CI jobs, use a non-owner role for RLS, explicitly configure the test variables, fail on required skips, and publish executed/pass/skip counts against exact SHA.

## 5. Additional source confirmations

### GAP-0022 — leave list lacks a permission gate
leave.routes.js applies auth and module enablement, but GET / has no leave.view gate. leave.controller.js calls the company-wide service list; leave.service.js scopes by employee.company_id but returns all leave applications for that company. Keep open; add role/permission negative tests.

### GAP-0029 — payroll controller/service argument mismatch
Controller calls getPayslip, updatePayslip and removeBonus without req.db. Service signatures require db as the first argument. Fix must preserve company/run/employee ownership and verify a bonus belongs to the supplied run.

### GAP-0040 — attendance check-in argument mismatch
Controller calls checkIn(db, employeeId, companyId, req.body), while service signature is checkIn(db, employeeId, data). The service receives companyId as data and ignores the request body; latitude/longitude/IP are not read from the body. Keep open. Privacy/consent and coordinate validation must be addressed before choosing whether to persist location/IP.

## 6. CI and safety status

- Branch head inspected: cd400a602eb255029c1daeeae1d35f0c7b7ee948.
- Combined status API returned two external Railway contexts, both success.
- GitHub Actions workflow-run lookup for this exact SHA returned no runs.
- These external statuses are not test results. No exact-head GitHub Actions pass is claimed.
- No local test, boot, browser or database execution occurred in this phase.
- No production DB, customer data, payment, deployment, credential or main-branch change occurred.

## 7. Next work

Audit remains incomplete. GAP-0020, GAP-0021, GAP-0022, GAP-0029, GAP-0031 and GAP-0040 remain open. Continue remaining route/controller/service/model/test tracing, operational Prisma table/FK/RLS matrix, frontend route/API and operations/restore coverage, then root-cause consolidation. Draft and independently verify Cycle 01 plan only after full audit. Do not begin application implementation before plan verification.
