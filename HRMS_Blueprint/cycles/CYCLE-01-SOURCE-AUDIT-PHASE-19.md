# Cycle 01 Source Audit — Phase 19: Onboarding, Billing and Platform API Contracts

**Date:** 2026-11-28 (Asia/Kolkata)  
**Repository:** `Krinki-dev/HRMS`  
**Branch:** `architecture/postgres-tenant-isolation`  
**Scope:** Platform registration, onboarding persistence, company-document upload/review, plan selection, billing checkout, platform admin settings, and global API response normalization.

## 1. Executive summary

Phase 19 reconciled platform and onboarding findings against the current branch rather than relying on older notes.

Important corrections:
- Onboarding progress, save-step and completion endpoints are now present in `brand.routes.js` and mounted under `/api/v1/platform`. The older GAP-0032 statement that these endpoints are missing is no longer accurate for the current branch.
- Company document upload/list/download/review endpoints are also present in `brand.routes.js` and mounted under `/api/v1/platform`. The older GAP-0033 statement that no matching backend endpoints exist is superseded at source level. Runtime and storage integration remain unverified.
- The onboarding payroll step still calls `POST /payroll/salary-components`, but the current payroll router has no such route. GAP-0032 therefore remains partially open.
- The tenant Billing page's checkout request does not use the request contract expected by the backend order endpoint.
- More seriously, the global Axios response interceptor unwraps the backend `data` envelope, while multiple direct frontend consumers still attempt to read `response.data.data`. This affects onboarding resume/payment order handling and dashboard service wrappers.

## 2. Evidence inventory

| File | Blob SHA | Evidence |
|---|---|---|
| `frontend/src/services/api.js` | `b732d492ff4754d82b599f7181b7a76f60cf0052` | Global Axios response interceptor unwraps `response.data.data` into `response.data` |
| `frontend/src/services/dashboardApi.js` | `60176ad72d936afe2202a012165e895beea2fc18` | Dashboard methods access `r.data.data` after global unwrapping |
| `frontend/src/pages/onboarding/OnboardingWizard.jsx` | `c33c1d037095bb393ecff6caa36a590f541df6ac` | Onboarding progress and order response double-unwrapping; salary-components call |
| `frontend/src/pages/billing/BillingPage.jsx` | `984d3109c81017f96cb276b74048cfa0ef56c78c` | Billing order request uses planId/period; response expects nested data; mock verify branch |
| `frontend/src/pages/onboarding/CompanyDocumentsStep.jsx` | `223e0f9f2e6b57a3fe433b9e36feac7bf0760102` | Document upload uses `/platform/company-documents` and multipart field `file` |
| `backend/modules/platform/brand.routes.js` | `f40c1b6b4e71e38c4d680f4c01c0d5fc4a249345` | Onboarding progress/save/complete and company-document upload/list/review routes |
| `backend/modules/platform/payment.controller.js` | `7e48f4fbe142c39184da86e1ebc1b5c0427125a2` | Subscription order expects planSlug/selectedAddons/billingMonths; returns payload without mock mode |
| `backend/modules/platform/subscription.routes.js` | `0e51eb72c46d23588198b603694edea298cf84f2` | Subscription order/trial/verify routes |
| `backend/modules/platform/plans.routes.js` | `0caf512b143bbd23fcd501e56bcd6dc9c634aa5f` | Plan list/calculate/promo validation routes |
| `backend/modules/payroll/payroll.routes.js` | `5426fe5692d9df9a767504b140b27d83dd11ac2c` | Salary structures and employee salaries exist; salary-components route absent |
| `frontend/src/pages/auth/CompanyRegisterPage.jsx` | `83a43ea9ad065c572906b3d211f9c0cd30833c2b` | Registration and GST lookup paths |
| `frontend/src/pages/onboarding/PlanSelectionStep.jsx` | `a87e75adc0d1b33fb2f3e12f89ae5b32e7838482` | Plan list/calculate/promo calls |
| `frontend/src/pages/admin/AdminSettings.jsx` | `d1fe2ba632bb41de68f6f0d732ad365cb49db918` | Platform admin settings API calls |
| `backend/modules/platform/admin.routes.js` | `68baa5476a1e7590e9c5e825edb12144b11143b9` | Matching platform admin settings/test-SMTP routes |

## 3. Findings and reconciliations

### GAP-0058 — Billing checkout request and response contracts are inconsistent

**Severity:** P1  
**Status:** Open — source-confirmed

Evidence:
- `BillingPage.jsx` posts `{ planId, period }` to `/platform/subscribe/order`.
- `payment.controller.js:createSubscriptionOrder` requires `planSlug`, `selectedAddons`, and `billingMonths` (one of 1, 6, 12 or 24); it validates `method` and `renewalMode` too.
- The backend returns the order payload directly as the `data` value, with `orderId`, `amount`, `currency`, `keyId`, company name, description and prefill. It does not return a `mock` order.
- `BillingPage.jsx` reads `r.data?.data`, but the global Axios response interceptor in `api.js` already replaces the response envelope with its `data` value. The expected order object is therefore at `r.data`, not `r.data.data`.
- `OnboardingWizard.jsx` uses the backend's correct order request fields, but also reads `orderResp.data?.data` after the interceptor has already unwrapped the envelope.

Impact:
- The tenant Billing page sends an invalid order request and is expected to be rejected because `planSlug` is missing.
- Even where the request shape is correct (onboarding), the frontend can fail to read the returned Razorpay order details because it double-unwraps the response.
- The Billing page's mock branch is not a valid fallback: the current backend requires a real Razorpay configuration and explicitly rejects client-side mock payment verification.

Required remediation:
1. Establish one typed request contract for subscription order creation and use it in both onboarding and Billing.
2. Establish one response-envelope convention. Either keep the interceptor unwrapped and update consumers, or stop unwrapping globally and update all services consistently.
3. Remove client-side mock payment flows; keep Razorpay server verification as the only enabled paid path.
4. Add contract tests for request validation, response shape, order creation, signature verification and subscription activation. Never run real payments in these tests.

### GAP-0059 — Onboarding payroll step calls a missing salary-components endpoint

**Severity:** P1  
**Status:** Open — source-confirmed; residual of GAP-0032

Evidence:
- `OnboardingWizard.jsx:savePayroll` posts each selected component to `POST /payroll/salary-components`.
- The server mounts `payroll.routes.js` at `/api/v1/payroll`.
- The current payroll router declares `/salary-structures` and `/employee-salaries`, but no `/salary-components` route.
- The onboarding step catches the failure and shows a generic “Failed to save payroll settings” message.

Impact:
- The payroll setup step cannot complete as currently implemented; the wizard may have already saved the step marker before the missing route fails, creating inconsistent progress state.

Required remediation:
- Decide whether onboarding should create salary structures using the existing salary-structures API or whether a dedicated salary-components resource is required.
- Make saving configuration and marking the onboarding step complete atomic or safely retryable.
- Add a full onboarding payroll integration test and ensure a failed save cannot leave a completed marker.

### GAP-0060 — API response envelope is unwrapped globally but double-unwrapped by consumers

**Severity:** P1  
**Status:** Open — source-confirmed cross-cutting contract inconsistency

Evidence:
- `frontend/src/services/api.js` response interceptor checks for `response.data.data` and assigns that inner value back to `response.data`.
- `dashboardApi.js` then accesses `r.data.data` for both dashboard stats and activity.
- `OnboardingWizard.jsx` accesses `response.data?.data?.progress` for onboarding resume and `orderResp.data?.data` for payment order details.
- `BillingPage.jsx` similarly reads `r.data?.data` for the order result.
- Other service modules use `r.data`, showing inconsistent consumer expectations.

Impact:
- API calls may succeed at HTTP level but frontend state receives `undefined`, causing blank dashboards, failed resume behavior or payment flow errors.
- Silent catches can hide response-shape errors and leave onboarding at its initial step.

Required remediation:
1. Select one canonical API response contract and document it.
2. Remove duplicate unwrapping from all service/page consumers or remove the interceptor normalization.
3. Add shared unit tests for raw success envelopes, unwrapped payloads, empty payloads and error responses.
4. Add page-level tests for dashboard loading, onboarding resume and payment-order handling.

### GAP-0032 — Onboarding API finding narrowed; progress endpoints now present

**Status correction:** Partially superseded, not fully closed.

Current evidence:
- `brand.routes.js` now defines GET `/onboarding/progress`, POST `/onboarding/save-step`, and POST `/onboarding/complete`.
- `server.js` mounts `brand.routes.js` under `/api/v1/platform`, matching the frontend URLs.
- The payroll `/salary-components` endpoint is still absent; record this residual as GAP-0059.
- Runtime, transactionality and resume tests remain pending.

### GAP-0033 — Company-document route absence is superseded at source level

**Status correction:** Superseded by current source; runtime verification pending.

Current evidence:
- `brand.routes.js` defines tenant upload/list/download routes and platform review queue/download/history/review routes.
- `server.js` mounts `brand.routes.js` under `/api/v1/platform`.
- `CompanyDocumentsStep.jsx` posts to `/platform/company-documents` and sends the expected multipart field `file`.
- `adminApi.js` uses matching platform review routes.

This does not certify production storage, ClamAV, RLS, review authorization or browser behavior. Those require separate integration tests.

## 4. Other platform API mapping

- Registration `POST /platform/register` is declared by `platform.routes.js`.
- GST lookup and branch-link calls have matching route declarations in the mounted platform/GST routers.
- Plan list, calculate and promo validation paths have matching declarations in `plans.routes.js`.
- Trial, free plan, subscription order and verify paths have matching declarations in `subscription.routes.js`.
- Admin tenant, modules, notification, settings and SMTP test calls have matching declarations in `admin.routes.js`.
- Company-document tenant and reviewer paths are present in `brand.routes.js`.
- Static route presence does not validate payloads, permissions, ownership, idempotency or live service dependencies.

## 5. Phase 19 completion boundary

Completed:
- Reconciled onboarding, company document and platform admin route presence against current source.
- Identified subscription order request mismatch and global response-envelope mismatch.
- Confirmed the remaining onboarding salary-components route gap.
- Corrected stale GAP-0032 and GAP-0033 interpretations.

Not performed:
- No app code changed.
- No browser/API execution, test run, payment, database connection, migration or deployment.
- No CI pass claim.

**Next:** complete final audit of route payloads, permissions, object ownership, background jobs, files and deployment dependencies; reconcile the full gap register and classify P0/P1 blockers. Then draft Cycle 01 improvement plan and independently verify it before implementation. Keep `main` untouched.
