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

## Subscription-order integrity tests — continued work

- Extracted the server-side subscription-order snapshot comparison into `backend/shared/utils/subscriptionPaymentVerification.js`. It compares plan, add-ons, billing term, employee count, promo code, renewal mode, and a positive safe-integer amount.
- The subscription verification controller now uses this shared helper instead of inline comparison logic.
- Added `backend/test/subscription-payment-verification.test.js` covering matching selections, add-on order normalization, tampering across each selection field, missing snapshots, invalid amounts, and default renewal mode.
- Ran the helper's five corresponding Node.js tests in an isolated local test harness: **5 passed, 0 failed**. This is a focused helper test only; it is not a full backend test-suite or CI result.

## PhonePe Standard Checkout v2 subscription integration — continued work

- Added a server-side PhonePe v2 client with OAuth client-credentials token acquisition, expiry-aware token caching, checkout creation, and order-status lookup.
- The client selects the documented sandbox or production token and checkout API endpoints from `PHONEPE_ENV`; optional `PHONEPE_BASE_URL` supports an explicitly configured gateway base URL.
- Subscription checkout now creates a v2 `PG_CHECKOUT` order and persists its merchant order ID and server-side subscription snapshot in the payment ledger.
- Subscription verification now fetches v2 order status from PhonePe and requires order state `COMPLETED`, exact merchant order ID, exact amount, and a completed payment attempt before activating the plan.
- The onboarding return URL carries the selection snapshot as an encoded value; the backend still compares it against its persisted order snapshot, so browser-provided values cannot change the paid selection.
- Added PhonePe client tests for environment URLs, required credentials, token caching, v2 checkout request headers/body, order-status URL, and strict completed-payment matching.
- PhonePe invoice checkout remains disabled; this v2 integration currently covers subscription checkout only. JioPay remains disabled.
- Merchant credentials and a successful PhonePe UAT run are still required. Do not enable production traffic until UAT, webhook configuration, and failure/reconciliation behavior have been validated.

## Verification status after focused hardening

- GitHub combined status lookup for commit `bf78bd026b21e2a34d338b9ef4e378cf0535b7fc` returned no status checks; workflow-run lookup returned no runs. CI is therefore **unverified**, not passed.
- No sandbox payment was initiated. No live database migration was applied.
- PhonePe remains unavailable until its v2 implementation and merchant setup are completed.
- Razorpay still needs automated transaction rollback/duplicate/concurrency tests, subscription webhook recovery, stale-order reconciliation, Prisma generation, and a verified sandbox run.
- Do not label the overall payment module complete until these gates pass.

## Additional atomicity work

- Subscription activation now claims the payment order conditionally, updates the tenant plan and entitlements, writes the subscription pricing configuration using the same Prisma transaction client, and creates the paid subscription invoice snapshot in that same transaction. A failure in these writes rolls back the transaction.
- A durable Razorpay webhook inbox now records provider event ID (or raw-payload hash fallback), event type, payload hash, processing status, and retryable failure state. Duplicate deliveries are acknowledged without reapplying business effects; failed inbox events can be retried.

## Release decision — single payment gateway for initial production

**Product decision:** Razorpay is the only payment gateway enabled for the initial production release. The application must not offer or accept PhonePe, JioPay, or another gateway as an active checkout option. Those providers are deferred and should be presented in the product as **Coming soon** only where a payment-method list is shown.

- Backend subscription order creation and verification now reject every provider except Razorpay. This is enforced server-side; hiding a provider in the UI alone is not sufficient.
- Razorpay remains the sole supported gateway for invoice checkout and subscription checkout.
- PhonePe Standard Checkout v2 code is retained for a later phase but is not part of the launch payment path. Do not configure or enable it for production yet.
- JioPay remains disabled. No unverified provider flow may create orders, verify payments, or change invoice/subscription state.
- Payout initiation is not a customer payment gateway and is not production-ready; it remains out of this launch scope.

**Important production-readiness distinction:** selecting Razorpay as the sole launch gateway does not, by itself, certify the payment module as production-ready. Before enabling live payments, complete and verify the Razorpay release gates below:

1. Run the full backend test suite and Prisma client generation against the exact release commit.
2. Run PostgreSQL-backed integration tests for invoice/subscription ledger writes, duplicate verification, concurrency, and transaction rollback.
3. Complete Razorpay sandbox end-to-end tests for both invoice and subscription checkout, including webhook delivery, retries, duplicate events, and customer browser-return failure.
4. Verify deployment secrets, webhook URL/secret, TLS, allowed origins, monitoring, and operational reconciliation procedures.
5. Obtain an explicit production deployment approval before switching to live Razorpay credentials.

Until those gates pass, describe Razorpay as the **only enabled/launch payment method**, not as independently certified production-ready. Other payment providers are deferred so engineering can focus on the remaining HRMS modules after the Razorpay launch path is validated.

## Additional safety boundary — automated payroll payouts

- Automated payout initiation endpoints now fail closed with HTTP 503 and explicitly state that no transfer was initiated.
- The previous payout handlers returned synthetic success/batch IDs without calling a real provider. Those success responses have been removed.
- The payout webhook is also disabled until a verified payout provider, authenticated callback contract, durable payout ledger, and reconciliation flow exist.
- Manual bank-transfer CSV export remains a separate workflow; it prepares a file and does not initiate a bank transfer.
- This does not change the launch gateway decision: Razorpay is the only enabled customer billing gateway. Payroll payouts are a separate deferred capability and must not be described as supported by Razorpay checkout.

## Latest branch hardening — 2026-11-24

- Server-side subscription order creation and verification enforce Razorpay-only launch scope; non-Razorpay providers return HTTP 503 with a clear coming-soon message.
- Synthetic automated payroll payout success responses and payout callback mutations have been disabled. No automated bank transfer can be reported as successful by these placeholder handlers.
- Confirmed the Razorpay webhook endpoint captures raw request bytes before JSON parsing and verifies the webhook signature against those exact bytes.
- Confirmed Razorpay invoice webhook processing uses a durable event inbox with duplicate-event handling and retryable failed status, then verifies the order/payment with Razorpay before applying the invoice update.
- The branch currently has no reported combined CI status checks. Full automated test execution, PostgreSQL integration tests, Prisma generation, sandbox verification, and production approval remain outstanding. No live payment or live migration was performed.
