# Cycle 01 Implementation and Verification — Phase 23: WebSocket Tenant Isolation and Payment Router Stabilisation

**Date:** 2026-11-28 (Asia/Kolkata)  
**Repository:** `Krinki-dev/HRMS`  
**Branch:** `architecture/postgres-tenant-isolation`  
**Tasks:** HRMS-D-001 (partial implementation), HRMS-C-002 (source fix and smoke coverage)  
**Protected branch:** `main` — untouched

## 1. Executive summary

Phase 23 moved two P0 areas from audit into code and test work.

- Company WebSocket registration and delivery now carry a verified identity tuple (`userId`, Central `tenantId`, operational `companyId`). Company and user pushes filter against the same tenant/company pair. Missing tenant context fails closed.
- The WebSocket ticket endpoint checks that the authenticated request tenant matches the authenticated user tenant and confirms active user membership in the selected operational company before issuing a 15-second single-use ticket.
- Event-notifier call sites now pass the Central tenant ID to the notification service so targeted live notifications can be scoped rather than silently falling back to a global user ID.
- The subscription controller already exports a real Razorpay webhook handler in the current source. A router-load test verifies the route and handler are callable. The earlier Phase 22 “missing handler export” observation is corrected for current source.
- CI exposed a separate payment-controller syntax blocker: the disabled PhonePe order handler opened a function body and then commented out its closing brace. The dead commented implementation was removed and the disabled handler was properly closed.

A backend CI run passed after these fixes, with 171 tests discovered, 166 passing and 5 skipped. The exact passing commit is recorded below. A later branch commit is currently running CI, so this is not a pass claim for the latest branch HEAD.

## 2. Source changes

| File | Current blob SHA | Change |
|---|---|---|
| `backend/shared/utils/wsTicket.js` | `0dea9576e80b27ce7fa321d68641cfbe13a9515d` | One-time ticket carries userId, tenantId and companyId; all required |
| `backend/modules/auth/auth.routes.js` | `8211b14889909650b569f3880ec6da203792e2d2` | Ticket issuance verifies request tenant, authenticated tenant and active company membership |
| `backend/server.js` | `681496f2a86b4ca6ed7d17eb5c91ecae6a63b06c` | Upgrade handler consumes the full identity tuple and registers the socket with it |
| `backend/modules/notifications/notifications.service.js` | `4231cfd50440492e3af451d3759bbcb5bde20378` | Per-socket identity map; user/company push filtering by tenantId + companyId |
| `backend/modules/notifications/notifications.controller.js` | `fd28c8a15e28d6b35f256431e2f7cf7f56a175a9` | Manual notifications pass verified Central tenant ID |
| `backend/modules/notifications/event-notifier.service.js` | `08b1526e48672724f009b6d91e612ed217ab56e9` | Event dispatch propagates tenantId to live notification delivery |
| `backend/modules/platform/payment.controller.js` | `f54f35bfb8b973e8d3cadaa2d5470210613b2704` | Removes the unterminated disabled PhonePe implementation comment and closes handler |
| `backend/test/ws-ticket.test.js` | `3d18c9be09d880668a879fdfb9c2f95ea0d87e89` | Ticket identity, single-use and missing-scope tests |
| `backend/test/notifications-websocket-scope.test.js` | `f9efee253dd0a85193d98d3f2fd5f15ba3d4338f` | Company A/B and same-company-ID/different-tenant isolation tests |
| `backend/test/subscription-router-load.test.js` | `23062594bd2b8e6f5a7faf2d0f756e58dfeffe69` | Router handler callable check, webhook export check, missing-secret and invalid-signature fail-closed tests |
| `backend/test/auth-provisioning-readiness.test.js` | `b6bfedc6760ad1e6125670f21408e9ca8e397434` | Updates source assertions to current explicit workspace selection resolver |

## 3. HRMS-D-001 — WebSocket tenant isolation

### Implemented

1. Ticket issuance accepts only the authenticated server-side identity, not browser-supplied tenant identifiers.
2. The ticket endpoint requires:
   - a resolved request tenant,
   - equality between `req.tenant.id` and `req.user.centralTenantId`,
   - a non-empty operational company ID,
   - an active user membership row in that company.
3. Ticket consumption returns the verified identity tuple and remains single-use with a 15-second TTL.
4. Server WebSocket upgrade attaches that identity to the connection.
5. Notification registry stores identity per socket.
6. Company broadcasts match both Central tenant ID and operational company ID.
7. Targeted user notifications also match tenant/company; if caller context is missing, the service sends no WebSocket message rather than broadcasting without scope.
8. Manual and event-notifier flows now pass the tenant identity into the notification service.

### Tests added and passed

- Company A receives its company broadcast; Company B does not.
- A socket in another Central tenant with the same operational company ID does not receive the broadcast.
- Targeted user delivery matches the exact tenant/company pair.
- Missing tenant context fails closed.
- Ticket contains the expected identity and cannot be consumed twice.
- Missing user, tenant or company identity is rejected.

### Remaining verification

- These are unit tests using controlled fake socket objects. A real WebSocket server integration test with two authenticated tenants, reconnect and company-switch scenarios remains required.
- Review platform-admin realtime requirements separately. Current ticket issuance intentionally requires a tenant and company membership; platform administrators without operational company membership do not receive this tenant-scoped socket.
- Do not mark HRMS-D-001 Verified Closed until the integration test and full identity/session regression suite pass.

## 4. HRMS-C-002 — Payment router and server-load stabilisation

### Current source correction

- `payment.controller.js` exports `handleWebhook`.
- `subscription.routes.js` registers that function for `POST /razorpay-webhook`.
- `server.js` mounts the subscription router.
- `subscription-router-load.test.js` checks the route stack and callable webhook export.

Therefore the earlier Phase 22 finding “Razorpay webhook handler is not exported” is **superseded by current source**. The route-load regression test is now in the backend test suite.

### Additional blocker found by CI

The disabled `createPhonePeOrder` function opened an async arrow-function body, returned a 503, then opened a block comment that contained the old implementation and the function's closing `};`. The closing brace was inside the comment, so Node reported `SyntaxError: Unexpected end of input` at the end of `payment.controller.js`.

Correction:
- Removed the dead commented-out implementation.
- Closed the disabled handler immediately after its 503 response.
- Kept PhonePe checkout disabled; no provider/payment behavior was enabled.

This is recorded as **GAP-0066 (P0, fixed in source; verified by backend CI)** and mapped to HRMS-C-002.

### Remaining verification

- No real payment was created or captured.
- No production webhook secret was read or changed.
- Tests cover route wiring, handler export, missing-secret behavior and invalid-signature rejection. Full successful webhook-to-ledger settlement, event replay, amount/tenant binding and invoice/entitlement transaction tests remain required before payment readiness.

## 5. CI evidence

**Backend CI passed on tested commit**

- Workflow: Backend Tests
- Run: [46103433237](https://github.com/Krinki-dev/HRMS/actions/runs/46103433237)
- Tested commit: `97c60ad1ed3549d4c780c8506f871ada8e7cd1bb`
- Result: success
- Tests discovered: 171
- Passed: 166
- Failed: 0
- Skipped: 5

The run includes the WebSocket isolation tests, ticket tests, subscription router-load tests, payment controller import and the corrected auth provisioning assertions.

Important limitations:
- Five tests were skipped; this is not a full PostgreSQL/RLS integration pass.
- The test run did not establish a live WebSocket network test or a real server process boot with production configuration.
- The tested commit is not the latest branch HEAD. Subsequent branch commits include additional authentication/refresh-session work and removal of a temporary diagnostic test. A fresh run for the latest commit was in progress at the time of this report.
- The separate Tenant Migration PostgreSQL Integration workflow was not used as evidence of success for this task.

## 6. Gap-register corrections

- **GAP-0020:** source fix implemented; focused unit tests passed at the tested commit. Status: Fixed — Awaiting full WebSocket integration verification.
- **GAP-0021:** handler export and router registration now exist; router-load test passed. Status: Verified Closed for the missing-export defect. Broader payment/webhook readiness remains HRMS-C-002 work.
- **GAP-0066 (new):** payment controller parse/startup blocker caused by disabled PhonePe function's commented-out closing brace. Fixed and covered by backend CI.
- **GAP-0065:** current auth source now uses explicit tenant choice via `chooseTenantRow`; no arbitrary first-row selection. The auth test assertions were updated to current source. Full login/OTP/refresh/session browser tests remain pending.

## 7. Safety boundary

- No production database connection or migration.
- No real payment, refund, payout or provider callback.
- No deployment or production secret change.
- No customer data operation.
- `main` untouched.
- All application changes are on `architecture/postgres-tenant-isolation`.

**Next:** complete a real WebSocket integration test, then re-run backend CI at the latest branch HEAD. Continue with the next task in the verified plan: complete D-003 multi-tenant login/OTP/refresh identity binding and tests, then proceed to D-004 shared-schema/Central RLS coverage. Do not skip the P0 isolation and migration gates.
