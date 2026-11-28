# Cycle 01 Source Audit — Phase 22: P0 Tenant Isolation and Startup Blocker Revalidation

**Date:** 2026-11-28 (Asia/Kolkata)  
**Repository:** `Krinki-dev/HRMS`  
**Branch:** `architecture/postgres-tenant-isolation`  
**Scope:** Revalidate the highest-severity P0 findings against current branch source and reconcile the operational-RLS finding with frozen architecture.

## 1. Executive summary

The two most critical inherited P0 findings remain present in the current source:

1. Company-wide WebSocket broadcasts still send to every registered socket without company membership filtering.
2. The subscription router still passes `paymentController.handleWebhook`, but the payment controller does not export that handler. The router is mounted directly by `server.js`, so requiring it can throw during server startup.

The operational-database RLS finding needs correction:
- Frozen architecture explicitly states that operational tenant tables do not use RLS; shared Free/Trial operational data isolation relies on tenant routing plus mandatory `company_id` filters.
- Therefore, the absence of operational-table RLS is not itself a defect under the frozen design. The P0 shared-schema isolation requirement remains, but must be assessed through complete query ownership/scoping, database routing, identity and negative integration tests. Do not add operational RLS without an approved architecture change.

## 2. Current source evidence

| File | Blob SHA | Evidence |
|---|---|---|
| `backend/modules/notifications/notifications.service.js` | `49c74634388bd2f95262011cd75208d6a4d344b5` | Socket registry keyed only by userId; `pushToCompany` iterates all clients and sends to all sockets |
| `backend/server.js` | `8a412ffed98826379fc832ea90b99c8ff97a9097` | WS connection calls `notifSvc.register(userId, ws)`; subscription router is directly mounted |
| `backend/modules/platform/subscription.routes.js` | `0e51eb72c46d23588198b603694edea298cf84f2` | `POST /razorpay-webhook` passes `paymentController.handleWebhook` |
| `backend/modules/platform/payment.controller.js` | `7e48f4fbe142c39184da86e1ebc1b5c0427125a2` | Exports PhonePe/JioPay/payout handlers and subscription handlers, but no `exports.handleWebhook` |
| `backend/shared/middleware/tenant.js` | `21e49bd0e113768666d97fa1f78e9139a4cc61ea` | Tenant resolution and storage metadata passed into request context |
| `backend/shared/utils/tenantStorageResolver.js` | `4e75dc5cf4bb651a716d8e2b5002189fb11ad238` | Fail-closed storage-tier/status/schema checks |
| `backend/shared/utils/rlsContext.js` | `57c339c66ee9e448d948ac2eefd2c9d2e8ee4070` | Transaction-scoped Central RLS helper |
| `HRMS_Blueprint/07_FROZEN_DECISIONS.md` | `974a3ca25133c41129f703fb34c39186434fc147` | Operational DB uses company_id filters, Central DB uses RLS |

## 3. Revalidated P0 findings

### GAP-0020 — WebSocket company broadcast is not company-scoped

**Severity:** P0  
**Status:** Open — source-confirmed

- `notifications.service.js` stores sockets by userId only.
- `register(userId, ws)` does not store companyId/tenantId.
- `pushToCompany(companyId, payload)` does not use its companyId parameter to select recipients; it loops over every user socket and sends the message to every connected client.
- `server.js` creates the socket registration from the one-time ticket's userId only.
- No cross-company runtime reproduction was run.

**Required fix:** Bind each ticket/socket to immutable tenantId and companyId; resolve and validate membership before registration; broadcast only to matching company members; keep user-specific notifications separately scoped. Add a negative integration test with Company A and Company B sockets, including reconnect, stale ticket, company switch and platform-admin cases.

### GAP-0021 — Subscription router references a missing Razorpay webhook handler

**Severity:** P0  
**Status:** Open — source-confirmed route/export mismatch; startup failure not reproduced

- `subscription.routes.js` passes `paymentController.handleWebhook` as the Razorpay webhook handler.
- The current `payment.controller.js` export list contains `handlePhonePeWebhook`, `handleJioPayWebhook`, `handlePayoutWebhook`, `createSubscriptionOrder` and `verifySubscription`, but no `handleWebhook`.
- `server.js` directly mounts `subscription.routes.js` rather than wrapping this mount in the `safeUse` helper.
- Express route registration with an undefined callback is expected to throw at module load; a server boot test was not run.

**Required fix:** Implement the correct Razorpay webhook handler using signature verification, durable event idempotency and payment-order/tenant/amount binding, or remove the unused route until implemented. Add a backend boot smoke test that requires every mounted router, plus webhook signature/replay tests. Do not create a no-op handler merely to make startup pass.

## 4. Architecture reconciliation — GAP-0030

**Original wording:** Shared operational public schema has no demonstrated company/tenant RLS coverage.

**Correction:** Under the frozen architecture, RLS is for Central platform tables. Tenant operational business tables intentionally have no RLS; isolation is achieved by:
- fail-closed tenant DB/schema resolution,
- a separate dedicated schema for Paid tenants,
- Free/Trial shared public storage with mandatory `company_id` filters,
- correct tenantId/companyId identity binding,
- explicit negative integration tests.

The absence of operational RLS alone is therefore not a defect under the approved design. GAP-0030 should be marked **Superseded / Not a defect under frozen design**, while GAP-0002 remains P0 until shared-schema isolation is proven across every query and runtime test. The separate Central RLS gaps GAP-0047 and GAP-0048 remain open.

## 5. Cross-finding reconciliation rules

- GAP-0053 is supporting evidence for GAP-0035 (backup artifact encryption), not a separate implementation task.
- GAP-0054 is a revalidation of GAP-0034 (notification route mismatch), not a separate implementation task.
- GAP-0052 is an expanded evidence set for GAP-0006 (backup/restore completeness).
- GAP-0059 is the remaining endpoint gap within GAP-0032; progress/save/complete onboarding routes are present.
- GAP-0033 is superseded at source level because the company-document endpoints now exist and are mounted. Keep file-storage, malware scan, reviewer authorization and runtime verification tasks open independently.
- GAP-0058 should track the Billing page request payload mismatch only; GAP-0060 tracks global API response double-unwrapping.
- GAP-0030 is not a reason to introduce operational RLS; preserve frozen architecture.

## 6. Phase 22 completion boundary

Completed:
- Revalidated both P0 source findings.
- Reconciled operational RLS wording with frozen architecture.
- Identified duplicate/parent relationships among the gap IDs.

Not performed:
- No server boot, browser, WebSocket, webhook, database, test, payment, migration or deployment was run.
- No application code changed.
- No production/customer data action performed.

**Next:** prepare the consolidated Cycle 01 improvement plan. Group duplicate findings into one task each, prioritize P0 tenant isolation and startup blockers first, and preserve all frozen architecture/safety constraints. Independently verify the plan before any application code changes. Keep `main` untouched.
