# Payment Implementation Progress — Follow-up

**Branch:** `architecture/postgres-tenant-isolation`  
**Updated:** 2026-11-24  
**Status:** In progress. Do not deploy as production-ready yet.

## Changes committed in this follow-up

1. **Razorpay raw webhook verification**
   - Express captures the exact raw request bytes for the Razorpay webhook endpoint.
   - HMAC verification uses the raw bytes and constant-time comparison.
   - Unit tests cover valid signatures, altered body bytes, missing secret, and malformed signatures.

2. **Razorpay invoice webhook ledger enforcement**
   - Only `payment.captured` is eligible to transition an invoice.
   - The callback must match a pending Razorpay invoice ledger order.
   - The backend fetches the order and payment from Razorpay and checks captured status, amount, currency, receipt, and order linkage.
   - Invoice and payment-order state are updated in one RLS-scoped transaction.
   - A callback arriving after synchronous verification is treated as an idempotent no-op.

3. **Concurrent Razorpay invoice checkout recovery**
   - If concurrent checkout requests collide with the one-open-order database constraint, the losing request attempts to return the existing valid pending order rather than failing with a generic error.
   - A gateway order created by the losing request may remain orphaned; reconciliation is still required.

4. **Subscription order ledger**
   - The central Prisma model and pending SQL migration now support invoice and subscription purposes.
   - Invoice ID is nullable for subscription checkout records.
   - Subscription checkout persists a server-side snapshot of plan, add-ons, billing term, employee count, promo code, renewal mode, amount, currency, tenant, and provider order ID.
   - Subscription verification requires a matching pending ledger order and compares the request selection to the stored snapshot.
   - Razorpay subscription verification fetches the order and payment server-to-server and checks amount, currency, tenant notes, order linkage, and captured state.
   - PhonePe subscription verification checks the provider status response against the stored merchant transaction ID and amount.
   - The subscription payment ledger transition is conditional on status still being `created`, preventing two concurrent requests from claiming the same order.

5. **Unsafe provider paths fail closed**
   - Legacy PhonePe callback no longer changes invoice/subscription state; authenticated server-side verification remains responsible for confirming a pending ledger order.
   - JioPay checkout, verification, and callback handlers are disabled. The repository's JioPay implementation was placeholder logic, not a verified merchant integration.

## Remaining work before payment flow can be called complete

### P0 — Required
- Move subscription invoice snapshot creation into the same database transaction as subscription activation and payment-order capture. Current invoice creation and some pricing-config writes still occur after the activation transaction and need failure-safe atomicity.
- Add durable webhook-event idempotency records and replay protection, not just idempotent invoice status updates.
- Add stale-order expiry and reconciliation for orphaned or pending provider orders.
- Add subscription callback/reconciliation handling so a captured Razorpay subscription payment can be recovered even if the customer browser never returns.
- Review legacy zero-price/free-plan behavior and ensure it cannot create a paid ledger attempt.
- Verify all provider response fields against the merchant's enabled PhonePe API version and credentials. The current PhonePe v1-style integration is not a substitute for a fully verified current merchant configuration.
- Add tests for ledger persistence, mismatched subscription selections, wrong tenant, amount/currency mismatch, duplicate verification, webhook replay, and transaction rollback.
- Generate both Prisma clients and confirm CI on the exact latest commit.

### Provider-specific
- **Razorpay:** invoice checkout and webhook path are hardened in source; subscription order binding is added. Still requires DB-backed integration tests, webhook event inbox/reconciliation, and full sandbox validation.
- **PhonePe:** subscription order ledger and server-side status check are added. Legacy webhook is intentionally non-mutating. Confirm current PhonePe merchant API version and callback authentication configuration before enabling production callbacks. Official PhonePe developer portal: https://developer.phonepe.com
- **JioPay:** disabled pending official merchant API specification, merchant credentials, callback authentication details, and sandbox. Do not re-enable placeholder code.
- **Payouts:** still a separate unfinished workstream; current payout initiation is not a real bank-transfer integration.

## Deployment boundary

The SQL migration has **not** been applied to the live central database. No real payment was initiated and no subscription/customer data was changed. The latest changes have not yet been confirmed by CI; the available workflow-run lookup did not return a run for the latest commit. Do not claim test or deployment success until CI and PostgreSQL integration tests are confirmed.
