# Payment Flow Completion Plan and Next Module Priorities

**Branch:** `architecture/postgres-tenant-isolation`  
**Review date:** 2026-11-24  
**Status:** Payment flow is **not production complete**. This document records verified repository gaps and the recommended implementation order. No live payment, database migration, or production configuration was changed during this review.

## 1. Payment flow: current verified state

### Implemented in source
- Razorpay invoice order creation validates the gateway order amount and currency against the invoice.
- Razorpay invoice orders are persisted in `public.payment_orders` through the Prisma model and pending SQL migration.
- A retry can reuse an existing open Razorpay order for the same invoice.
- A partial unique index prevents more than one open Razorpay order per invoice.
- Razorpay invoice verification checks the HMAC, fetches the order and payment from Razorpay, checks invoice receipt/amount/currency/order linkage/captured status, and updates invoice + ledger in one RLS-scoped transaction.
- Unit tests cover the Razorpay signature and order/payment matching helper.

### Not production complete / must be addressed
1. **Razorpay webhook:** current handler signs `JSON.stringify(req.body)`, not the exact raw request bytes. Express JSON middleware currently does not capture a raw body. The webhook also updates invoices directly rather than requiring the matching persisted order ledger and performing the same atomic invoice/order transition as the verification endpoint.
2. **Razorpay order creation race:** the unique partial index is a good final guard, but concurrent requests can create two gateway orders before one ledger insert loses the race. The losing request needs to recover the winning ledger order and avoid returning a generic 500; orphaned gateway orders need a reconciliation path.
3. **PhonePe invoice flow:** current initiation does not persist a server-side order mapping. Its webhook trusts decoded metadata to choose an invoice and marks it paid without verifying a persisted order, invoice amount, currency, or transaction status through the provider's status API.
4. **JioPay:** current endpoint URL, payload, signature construction, and callback contract are explicitly scaffold/placeholder logic in source comments. The repository does not contain an authoritative JioPay merchant integration specification. Do not enable this flow until the merchant's actual API contract and credentials are supplied and independently verified.
5. **Subscription order ledger:** subscription Razorpay order creation does not persist a server-side pending order/selection record. Subscription verification currently accepts client-supplied plan-selection fields and can activate a plan after a signature/status check without binding the selection to a persisted server-created order.
6. **Webhook idempotency:** no durable provider event/inbox table currently protects all payment callbacks from duplicate delivery and replay.
7. **Reconciliation:** no scheduled job compares pending ledger orders against provider status and resolves uncertain outcomes.
8. **Failure lifecycle:** explicit gateway order expiry/failure, late success, refund, chargeback, and manual reconciliation states need a documented transition policy.
9. **Payouts are a separate unfinished scope:** the payout initiation endpoint currently returns a synthetic success result rather than executing a real provider transfer. Do not represent salary payout as production-ready payment functionality.
10. **Validation:** the ledger migration has not been applied; Prisma generation and CI for the newest payment commits must be confirmed before rollout. PostgreSQL integration tests and provider sandbox tests are still required.

## 2. Required payment architecture

Use one provider-neutral lifecycle with provider-specific adapters:

- **Payment attempt:** immutable tenant, invoice/subscription reference, provider, provider order/transaction ID, amount in minor units, currency, purpose, and a server-generated idempotency key.
- **Provider event inbox:** unique provider event ID (or stable provider event fingerprint), signature verification result, received timestamp, processing status, and sanitized payload metadata. Never store secrets or full card/payment credentials.
- **Verification:** a callback or browser redirect is only a notification. Fetch payment status server-to-server and validate tenant/order mapping, amount, currency, captured/success state, and expected purpose.
- **Atomic transition:** in one database transaction, claim the event, conditionally transition the payment attempt, and conditionally transition the invoice/subscription. A duplicate event must become a no-op.
- **Reconciliation:** periodically query provider status for stale pending attempts; do not infer success from a redirect, timeout, or client state.
- **Audit:** log state transitions and invalid signatures without logging secrets or sensitive payment data.

## 3. Implementation sequence to finish payments

### P0 — Critical correctness and security
1. Add raw-body capture only for the Razorpay webhook route and verify `X-Razorpay-Signature` against the exact raw bytes using constant-time comparison.
2. Route Razorpay invoice webhook events through the same payment-order ledger and atomic invoice/payment transition as synchronous verification.
3. Make order creation race-safe: on unique conflict, read and return the existing valid pending order; add stale-order expiry/reconciliation.
4. Add a subscription order ledger storing server-calculated plan, add-ons, billing term, tenant, amount, currency, provider order ID, and status before returning checkout details.
5. Make subscription activation consume only a verified, persisted subscription order; never trust plan/price/add-on values from the verification request.
6. Add unique/idempotent webhook event processing and replay tests.
7. Add PostgreSQL integration tests for concurrent verify/webhook delivery and tenant isolation.

### P1 — Provider adapters
8. Complete PhonePe with the currently contracted API version: persist merchant transaction mapping, validate its authenticated callback, fetch server-side status, compare amount/currency/merchant transaction ID, and use the common atomic transition.
9. Complete JioPay only after the actual merchant integration manual/API contract is provided. Verify endpoint, auth/checksum algorithm, amount units, status query, callback format, retry semantics, and sandbox environment.
10. Add provider sandbox contract tests and operational configuration validation.

### P2 — Operations and lifecycle
11. Add reconciliation worker and admin exception queue for stuck/ambiguous transactions.
12. Add explicit failed, expired, refunded, reversed, and chargeback transitions with audit history.
13. Add payment receipts, tax invoice consistency, renewal retry/dunning, and subscription expiry/suspension policy.
14. Add dashboards/alerts for webhook failures, unmatched provider transactions, and payment reconciliation drift.

## 4. Next HRMS modules — priority order after payment P0

This is a recommended dependency-first sequence, not a claim that every listed module is absent. Before implementation, each module needs a source audit and a test baseline.

| Priority | Module/workstream | Required tasks / exit criteria |
|---|---|---|
| P0 | Tenant provisioning and PostgreSQL isolation | Finish lifecycle migration, classify existing tenants, resolve duplicate schema ownership, replace incomplete schema clone, provision/retry/compensate safely, wire resolver into middleware, and run PostgreSQL isolation tests. |
| P1 | Billing, subscription and entitlements | Complete payment P0, bind subscription activation to verified orders, centralize plan entitlements, renewal/expiry/suspension, invoice reconciliation, and audit history. |
| P2 | Identity, access control and tenant security | Audit authentication/session refresh, RBAC/permission enforcement on every route, tenant-boundary tests, platform-admin separation, CSRF/CORS/rate-limit policies, and secrets handling. |
| P3 | Payroll and statutory compliance | Validate attendance-to-payroll calculations, salary components, deductions, PF/ESI/PT/TDS rules, payslip generation, approval locks, payroll audit trail, and statutory export tests. |
| P4 | Attendance, leave and shift management | Validate device/import integrations, shift/holiday/weekly-off rules, geo/location controls where applicable, leave accrual and approval, corrections, and payroll reconciliation. |
| P5 | Employee lifecycle and core HR | Complete onboarding, document collection, employee changes, transfers, probation, confirmation, exit/full-and-final, employee self-service, and data retention controls. |
| P6 | Recruitment and onboarding | Requisition approvals, job publishing, candidate pipeline, interview feedback, offer approvals, joining conversion, duplicate detection, and access controls. |
| P7 | Performance and training | Goal/KRA cycles, review workflows, calibration, training plans, attendance, assessments, certificates, and manager dashboards. |
| P8 | Expenses, assets and reimbursements | Policy validation, multi-level approvals, receipt/audit storage, asset assignment/return, depreciation/inventory, and reimbursement-to-payroll/accounting links. |
| P9 | Reports, analytics and exports | Tenant-scoped reporting, reconciled KPIs, scheduled exports, access-controlled dashboards, and large-report performance tests. |
| P10 | Notifications, automation and integrations | Reliable queues/retries, idempotent jobs, email/SMS/WhatsApp provider contracts, integration secrets, webhook monitoring, and dead-letter handling. |
| P11 | Backup, restore and deployment operations | Verified restore drills, tenant-scoped backups, migration/rollback runbooks, health/readiness checks, monitoring, disaster recovery, and safe deletion approval. |

## 5. Release gates

Do not mark payments or the overall platform production-ready until all of these are true:

- Central DB migration reviewed and applied to the intended environment with backup/rollback plan.
- Both Prisma clients generated from the committed schemas.
- CI passes on the exact release commit.
- PostgreSQL integration tests pass against a disposable test database.
- Razorpay and PhonePe sandbox end-to-end flows pass; JioPay remains disabled until its authoritative contract and sandbox are verified.
- Duplicate callback, replay, timeout, partial failure, amount mismatch, wrong tenant, and concurrent verification tests pass.
- Subscription activation, renewal, expiry, and suspension are proven against persisted payment records.
- No production secrets are committed; provider webhooks use exact documented signature validation and HTTPS endpoints.
- Operational reconciliation and exception handling are available.

**Safety note:** Keep all work on the working branch. Do not apply migrations, activate subscriptions, process real payments, or alter customer data until the relevant release gates are explicitly approved.
