# Cycle 01 — Fresh Source Audit (Phase 2: WebSocket and Payment Route Wiring)

- Audit ID: HRMS-C01-AUDIT-P2
- Repository: Krinki-dev/HRMS
- Branch: architecture/postgres-tenant-isolation
- Source SHA inspected: 341704d3192d6d8ddd4391bad9b8a2967b75672e
- Date: 2026-11-27
- Status: In Progress — focused source trace of notifications/WebSocket and subscription webhook wiring.
- Application code changed: No.

## 1. Critical finding C01-SEC-002 — Company WebSocket broadcasts are not company-scoped

**Severity:** P0 candidate — cross-tenant data disclosure.

**Evidence:**
- backend/server.js accepts a one-time WebSocket ticket, stores only request.userId, and calls notifSvc.register(userId, ws).
- backend/modules/notifications/notifications.service.js stores connections in a Map keyed only by userId.
- pushToCompany(companyId, payload) does not use companyId. It iterates every connected user's sockets and sends the payload to all of them.
- notifications.service.js create() calls pushToCompany(companyId, wsPayload) for company-wide announcements.

**Impact:** In a multi-tenant application process, a company-wide announcement created for one company can be pushed to WebSocket connections belonging to other companies. The payload includes announcement title/body and may contain internal company information. The current socket registry has no company membership to filter against.

**Required direction:** Bind each WebSocket connection to an authenticated tenant/company identity (derived server-side, not client-supplied), and broadcast only to connections with the exact same authorized company scope. Consider disconnect/re-auth on tenant/company switch. Do not trust a companyId query parameter.

**Acceptance tests:**
1. Company A announcement reaches only Company A sockets.
2. Company B announcement reaches only Company B sockets.
3. One user connected under multiple company contexts receives only the intended context's messages.
4. Invalid/expired ticket or missing server-resolved company context cannot register a socket.
5. User-specific notifications remain user-scoped.

## 2. Critical finding C01-BOOT-001 — Razorpay webhook route references an undefined handler

**Severity:** P0 candidate — backend startup blocker; verify by boot smoke test.

**Evidence:**
- backend/server.js mounts /api/v1/platform/subscribe by requiring backend/modules/platform/subscription.routes.js without safeUse.
- subscription.routes.js registers router.post('/razorpay-webhook', paymentController.handleWebhook).
- backend/modules/platform/payment.controller.js exports createOrder, verifyPayment, createPhonePeOrder, handlePhonePeWebhook, createJioPayOrder, handleJioPayWebhook, validateBankDetails, initiatePayout, getBankTransferFile, distributeSalaries, handlePayoutWebhook, createSubscriptionOrder and verifySubscription. It does not export handleWebhook.
- No assignment of handleWebhook is present in the inspected payment controller source.

**Impact:** Express route registration is expected to reject an undefined callback while subscription.routes.js is loaded. Because server.js requires this route module directly during startup, this can prevent the backend process from starting. The current Backend Tests workflow runs node --test and does not start server.js, so it may not catch this.

**Required direction:** Determine the intended launch behavior. Frozen decisions say Razorpay is the only enabled launch gateway and manual renewal is required. If Razorpay webhooks are not ready, register a real, explicit disabled/acknowledgement handler that cannot mutate payment state; otherwise implement the verified raw-body signature + idempotent event ledger flow. Never wire a no-op handler that falsely claims payment processing.

**Acceptance tests:**
1. A boot smoke test requires server.js with deterministic test environment and proves all mounted route modules register.
2. A Razorpay webhook test proves valid raw-body signature and event idempotency if processing is implemented.
3. Invalid signature, duplicate event, wrong order/tenant/amount and replay cannot activate entitlements.
4. If webhook remains disabled, the endpoint returns an explicit non-processing status and no state mutation.

## 3. Additional verified positive controls

- Customer-managed local/external PostgreSQL registration is gated by customerDatabaseConnectionsEnabled() and returns a 503 while disabled. This aligns with the frozen outbound-network/SSRF safety decision.
- New tenant registration creates a bounded provisioning lease and activates the tenant/admin index only when the same lease token remains valid and unexpired.
- Provisioning lease metadata does not itself implement retry/recovery; the current source audit still needs to trace every failure/compensation path and admin recovery.
- Permanent physical deletion currently fails closed with RESTORE_VALIDATION_REQUIRED until restore and schema ownership verification exist.
- Tenant backup path refuses shared/legacy storage targets rather than dumping a multi-tenant database as if it were one customer's backup.

## 4. Test/CI implication

These findings demonstrate why exact-head backend unit tests are insufficient as a release gate:
- Add backend startup/route-registration smoke tests.
- Add WebSocket multi-company isolation tests.
- Ensure the actual route module is loaded in CI.
- Do not mark these issues fixed based on static code changes alone; require tests on the exact commit.

## 5. Safety and remaining work

No database, payment provider, production service, tenant data or deployment was modified. Continue the module-by-module audit and consolidate these findings into the master gap register. No application implementation starts until Cycle 01 plan verification passes.
