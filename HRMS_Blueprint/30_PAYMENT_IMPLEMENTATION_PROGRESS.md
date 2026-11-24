# Payment Implementation Progress — Follow-up

**Branch:** `architecture/postgres-tenant-isolation`  
**Updated:** 2026-11-24  
**Status:** In progress. Do not deploy as production-ready yet. Latest focused hardening: 2026-11-24.

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
- Add automated failure-injection tests proving the subscription activation, pricing config, invoice snapshot, and ledger capture all roll back together when any write fails.
- Add durable webhook-event idempotency records and replay protection, not just idempotent invoice status updates.
- Add stale-order expiry and reconciliation for orphaned or pending provider orders.
- Add subscription callback/reconciliation handling so a captured Razorpay subscription payment can be recovered even if the customer browser never returns.
- Review legacy zero-price/free-plan behavior and ensure it cannot create a paid ledger attempt.
- Migrate PhonePe to the current Standard Checkout API version only after the merchant supplies the required Client ID, Client Secret, Client Version, and confirms sandbox/production environment. The current code uses the legacy v1 merchant-ID/salt-key contract; current official documentation describes OAuth client-credentials authentication, `/checkout/v2/pay`, and `/checkout/v2/order/{merchantOrderId}/status`.
- Add tests for ledger persistence, mismatched subscription selections, wrong tenant, amount/currency mismatch, duplicate verification, webhook replay, and transaction rollback.
- Generate both Prisma clients and confirm CI on the exact latest commit.

### Provider-specific
- **Razorpay:** invoice checkout and webhook path are hardened in source; subscription order binding is added. Still requires DB-backed integration tests, webhook event inbox/reconciliation, and full sandbox validation.
- **PhonePe:** subscription order ledger and legacy v1-style server-side status check are added. Legacy webhook is intentionally non-mutating. Current official Standard Checkout documentation describes v2 OAuth (`client_id`, `client_version`, `client_secret`) and v2 pay/status endpoints; merchant credentials and environment confirmation are required before migrating and enabling production. See https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/authorization and https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/create-payment.
- **JioPay:** disabled pending official merchant API specification, merchant credentials, callback authentication details, and sandbox. Do not re-enable placeholder code.
- **Payouts:** still a separate unfinished workstream; current payout initiation is not a real bank-transfer integration.

## Deployment boundary

The SQL migration has **not** been applied to the live central database. No real payment was initiated and no subscription/customer data was changed. The latest changes have not yet been confirmed by CI; the available workflow-run lookup did not return a run for the latest commit. Do not claim test or deployment success until CI and PostgreSQL integration tests are confirmed.

## Focused payment-flow hardening — 2026-11-24

- Subscription checkout now defaults to Razorpay rather than legacy PhonePe.
- PhonePe v1 invoice checkout, subscription checkout, and subscription verification are blocked until Standard Checkout v2 is implemented and merchant credentials/environment are configured. The old v1 code is retained only as disabled reference and must not be re-enabled.
- Subscription signature verification now uses the shared constant-time Razorpay signature helper.
- Development mock subscription orders have been removed. A paid plan cannot be activated using a client-side mock response; the backend requires a positive amount and configured Razorpay credentials.
- Onboarding no longer treats a mock payment response as a successful plan activation.
- The frontend onboarding plan selection already submits `method: 'razorpay'` and uses the Razorpay checkout handler.
- Environment example now documents Razorpay credentials and the PhonePe v2 credential names. Real secrets must be configured in the deployment secret store and must never be committed.
- Current PhonePe v2 docs confirm Standard Checkout uses OAuth client credentials and the v2 checkout/status API family. See official PhonePe documentation: https://developer.phonepe.com/phonepe-payment-gateway/pg-v2-standard-checkout-integration and https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/order-status.

## Verification status after focused hardening

- GitHub combined status lookup for commit `bf78bd026b21e2a34d338b9ef4e378cf0535b7fc` returned no status checks; workflow-run lookup returned no runs. CI is therefore **unverified**, not passed.
- No sandbox payment was initiated. No live database migration was applied.
- PhonePe remains unavailable until its v2 implementation and merchant setup are completed.
- Razorpay still needs automated transaction rollback/duplicate/concurrency tests, subscription webhook recovery, stale-order reconciliation, Prisma generation, and a verified sandbox run.
- Do not label the overall payment module complete until these gates pass.

## Additional atomicity work

- Subscription activation now claims the payment order conditionally, updates the tenant plan and entitlements, writes the subscription pricing configuration using the same Prisma transaction client, and creates the paid subscription invoice snapshot in that same transaction. A failure in these writes rolls back the transaction.
- A durable Razorpay webhook inbox now records provider event ID (or raw-payload hash fallback), event type, payload hash, processing status, and retryable failure state. Duplicate deliveries are acknowledged without reapplying business effects; failed inbox events can be retried.
