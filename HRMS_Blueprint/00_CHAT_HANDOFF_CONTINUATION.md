# HRMS — Chat Continuation Handoff

**Purpose:** This is the durable handoff for continuing work in a new ChatGPT conversation without changing prior decisions, losing context, or repeating investigation. Read this file before making code changes.

**Repository:** `Krinki-dev/HRMS`  
**Working branch:** `architecture/postgres-tenant-isolation`  
**Protected branch:** `main` — do not modify it.  
**Current handoff date:** 2026-11-24 (Asia/Kolkata)

## 1. How to continue in a new chat

Paste this instruction in the new chat:

> Continue the HRMS project using `HRMS_Blueprint/00_CHAT_HANDOFF_CONTINUATION.md` from branch `architecture/postgres-tenant-isolation`. Read it first, preserve every existing decision and constraint, inspect the current branch head before editing, and resume from the “Immediate next actions” section. Do not restart the project, change architecture decisions, or ask me to repeat information already recorded. Make real code commits on the working branch and report only verified progress. Update this handoff file after each meaningful work session.

Always fetch the latest copy of this file from the working branch. The latest branch state and code are authoritative if this document becomes stale.

## 2. User's working preferences and communication

- User is not a developer and prefers concise, plain-language explanations.
- User expects implementation, not only advice or plans. Work across frontend, backend, API integration, schema/migrations and tests in parallel where dependencies allow.
- Do not ask “what next?” when a clear next action is already listed. Continue with the highest-priority safe task.
- Do not claim to be working in the background after a response. Tool-driven work happens during an active turn; after the response ends, no continuous coding is running unless an explicitly created automation is monitoring something. When work is resumed, make visible code changes and commits, and report the exact evidence.
- User is sometimes at the office and cannot access the project/database. **Do not ask them to perform local DB setup or run migrations until they say they are home and ready.** Continue source-code work meanwhile.
- Never ask the user to paste secrets into chat.
- Do not deploy, execute production migrations, run real payments, or alter credentials without explicit authorization and safe access.
- Do not address the user by name unless asked.
- Keep this file updated after each meaningful coding session so the user can move to a new chat without losing decisions.

## 3. Non-negotiable product and architecture decisions

### Customer onboarding order
1. Signup/registration and tenant provisioning.
2. Plan/trial/subscription and Razorpay payment.
3. First-time company setup.
4. Company document submission and review.
5. Operational HRMS modules.

Do not bypass the onboarding gates or mark steps complete when their data has not actually been saved.

### Payments
- Razorpay is the only enabled payment gateway for launch.
- PhonePe/JioPay/other gateways must remain disabled or explicitly “Coming soon” until separately verified.
- Subscription renewal is manual. Do not enable automatic recurring charges.
- Never trust client-supplied payment success/mock flags. Verify gateway-side order/payment/signature and bind payment to tenant, amount, currency, plan and purpose.
- Preserve payment ledger idempotency and atomic subscription activation/invoice creation.
- Do not run live transactions during development verification.

### GST/PAN
- Prefer official GST portal data.
- If CAPTCHA appears, display it and ask the user to solve it; never automate or bypass CAPTCHA.
- Support PAN-only registration for businesses without GST registration.

### Tenant isolation / database
- PostgreSQL is the target architecture.
- Tenant context and RLS boundaries must be explicit and fail closed.
- Migrations have been prepared but **not applied**. Wait until the user is home and ready; use a supervised staging-first sequence, backup, migration review and verification.
- Do not treat source commits or CI as proof of live DB correctness.

### UI/theme
- User wants a macOS-inspired, readable, polished interface.
- Centralize typography, colors, spacing, sizes, radii, surfaces and related tokens in the theme system so a global change can be made centrally.
- Light theme is the default for new users; saved dark preference should continue to work.
- Theme foundation exists, but legacy screen styles still need gradual migration and visual verification.

## 4. Current branch / verification state

- Working branch: `architecture/postgres-tenant-isolation`.
- `main` must remain untouched.
- Last recorded comparison before the latest handoff-file commit: branch was **247 commits ahead, 0 behind** main. Recheck the live compare endpoint before reporting current counts.
- Latest code commit whose backend CI was checked: `4498f48ec900ebd30f147fc3e17f40e6a065a8b0` — Backend Tests succeeded.
- Frontend Build succeeded for commit `30460a891103d531cab91900650c23610542cc88` and earlier frontend changes including the marketing CTA commit `b4687906d93b3c98ac0e2b8f18d6c2997c0284f0`.
- Backend Tests also succeeded for `0f9d28e3f2f5757ad6ba73b80b961f5911b6403a`, `1d21aa1beac8f44fc9a2af6f4c4b52cc239b8d88`, `d6dfee46145a7f4cee1694f0085bf2682cc5f2da`, and `30460a891103d531cab91900650c23610542cc88`.
- The latest code commit `4498f48...` is backend-only and its backend test run succeeded. Re-run/check CI against the latest actual branch head before making any fresh verification claim.
- CI does not verify live database migrations, real Razorpay, MinIO/ClamAV infrastructure, browser E2E or production readiness.
- Do not claim production readiness.

## 5. Work already implemented

### Platform admin navigation
Nine main areas are wired in navigation and routes:
- Dashboard
- Clients
- Plans (Analytics)
- Pricing & Plans
- Domains
- Analytics
- Marketing
- Document Review
- Settings

The navigation paths and nested routes were checked against `frontend/src/App.jsx`. Continue testing the actual functionality and API response shapes, not only route presence.

### Central theme
Earlier commits:
- `bf1336d7ef3b7ea7bfa22bb8822c1e4f2ed7822f` — `frontend/src/styles/theme.css`, centralized macOS-inspired design tokens and light/dark palette.
- `5baf975d6263ade24bd0683851e907525c56d622` — `frontend/src/context/ThemeContext.jsx`, light default for users without saved preference; saved dark preference retained.
- `27e34cfa842e26879b17ada5393820abf46f9b22` — `frontend/src/styles/global.css`, shared typography/focus/reduced-motion defaults.
- Legacy CSS still contains hardcoded values; migrate screen-by-screen and verify.

### Document Review
- `frontend/src/pages/admin/AdminDocuments.jsx`: review queue, secure download, history, approve/reject/request-resubmission and refresh/polling.
- `frontend/src/services/adminApi.js`: review API wrappers.
- `frontend/src/App.jsx`: `/admin/documents` route.
- `frontend/src/components/admin/AdminLayout.jsx`: Document Review navigation entry.
- Backend review APIs in `backend/modules/platform/brand.routes.js`: review queue, review download, review history and review status update.
- Check exact API payload fields and UI behavior; no live storage workflow has been tested.

### Platform marketing
- Public read-only `GET /marketing` endpoint in `backend/modules/platform/brand.routes.js`, returning allowlisted non-secret fields from `platform_settings`.
- Landing page fetches configured hero content; default copy remains as fallback.
- Marketing admin saves hero content through the existing settings endpoint.
- Marketing plan preview now uses the actual platform catalog fields (paise, employee cap, popularity/badge) and directs price changes to Pricing & Plans.
- Bottom CTA panel is now editable: headline, supporting text and three button labels/URLs. Public endpoint allowlists and length-limits these values and only accepts internal paths beginning with a single slash.
- Public landing page renders the saved bottom CTA content.

### Pricing & Plans
- The dedicated plans router is mounted and contains the CRUD/pricing/discount/promo endpoints used by PricingManager. Earlier suspicion that these endpoints did not exist was incorrect.
- Fixed `backend/modules/platform/plans.service.js` to persist via configured `centralPrisma` rather than an undefined `db` variable.
- Added strict read-for-write behavior so failed settings reads do not silently replace the catalog with defaults. Public reads retain their safe default fallback.
- Added server-side validation for plan name/slug uniqueness, base price in paise, employee cap, excess employee price, trial days, sort order and supported module assignments.
- Added promo validation for code format, flat/percentage values, expiry and description length.
- Plan removal now deactivates the plan instead of physically deleting it; the free baseline plan is protected. UI labels the action Deactivate/Inactive.
- Recheck pricing calculator, public plan selector, trial eligibility, add-on IDs and checkout calculations before changing catalog schema. Do not save a catalog shape that the checkout service does not consume.

### Domains
- Removed misleading claim that every mapped custom domain already has active Certbot SSL.
- UI now shows domain mapping as unverified until DNS/SSL is actually verified.

### Admin settings
- Corrected SMS sender key to `smsSenderId` / `SMS_SENDER_ID`.
- GST mode UI only describes official GST portal assisted browser flow; paid GSP option removed.
- Clarified that saved theme/security settings do not automatically reconfigure live runtime.
- Theme defaults aligned with the light palette.

### Payment / billing / trial backend (important existing work)
- `backend/modules/platform/payment.controller.js`: Razorpay-only subscription checkout, server-side price calculation, order/payment validation, tenant/amount/currency/purpose binding, ledger idempotency and transaction-scoped activation.
- Subscription activation creates a paid invoice and links it to the payment order in the same transaction. Verify actual Prisma schema fields and arithmetic before live use.
- `backend/modules/platform/billing.service.js`: manual renewal only; no automatic payment attempt; monthly invoice insertion uses duplicate protection; free/trial tenants excluded.
- `backend/modules/platform/subscription.controller.js`: removed development fake trial success; trial activation uses guarded transaction and conflict handling.
- These flows have not been validated against a live/staging database or real Razorpay.

### Company document upload/review
- Pending migration `backend/db-migrations/20261124_company_document_workflow.sql`.
- Upload route uses MIME/magic-byte validation, size bound, SHA-256, ClamAV scan, private MinIO storage and tenant-scoped metadata.
- Download uses short-lived signed URLs; review APIs are platform-admin-only with review history.
- Fail closed if scanner/storage is unavailable.
- Infrastructure and migration are not yet deployed or tested.

### ClamAV / MinIO
- `backend/shared/utils/clamavScanner.js`: bounded ClamAV INSTREAM scanner, fail closed.
- `backend/shared/utils/minio.js`: private bucket readiness handling; no public object URL exposed.
- Requires environment setup, not yet verified in staging.

### Storage lifecycle / deletion safety
- Tenant deletion guard blocks physical deletion until restore verification/approval and only accepts correctly owned ready dedicated schemas.
- Shared schema and dedicated database deletion are blocked.
- PostgreSQL backup now fails closed rather than writing fake success output; dump uses safe process spawning and gzip streaming.
- Backup artifact checks are not a restore drill.
- Tenant storage resolver is not yet wired into request routing; tenant classification/migration are pending.

### Onboarding
- Onboarding wizard includes company document submission step.
- Compliance credentials were removed from generic wizard storage; secrets must use dedicated encrypted configuration.
- Backend onboarding progress endpoints exist, but step-specific persistence still needs review. Do not mark a step complete unless the underlying information was actually persisted.

## 6. Pending migrations — do not execute until user is home and ready

Migration order documented in `backend/db-migrations/README.md`:
1. `20261124_payment_order_ledger.sql`
2. `20261124_tenant_onboarding_progress.sql`
3. `20261124_tenant_storage_inventory.sql`
4. `20261124_tenant_storage_lifecycle.sql`
5. `20261124_company_document_workflow.sql`

No migrations have been applied. Later: review current DB state, backup, run on staging first, generate Prisma clients, verify RLS/tenant access, test rollback/recovery, then obtain approval before production.

## 7. Immediate next actions (resume from here)

1. Fetch latest branch head, compare against `main`, check newest CI runs. Do not trust old counts or statuses.
2. Inspect `backend/modules/platform/plans.service.js`, `plans.routes.js`, plan calculator and onboarding plan selector together. Verify plan schema compatibility end-to-end (admin edit -> saved catalog -> public selector -> checkout calculation -> invoice snapshot). Add focused tests for pure validation/plan behavior where practical.
3. Inspect Marketing admin and public landing page for all editable panels. Hero and bottom CTA are connected; verify Features and Testimonials actually persist and render. Fix any static panels that falsely imply editability.
4. Inspect Document Review frontend/backend response shape, reviewer note naming, state transitions, empty/error/loading states, and secure download handling.
5. Audit remaining platform admin menus (Dashboard, Clients, Plans analytics, Pricing, Domains, Analytics, Marketing, Settings, Documents) for real API connections, correct loading/error states, actions and permission enforcement.
6. Continue theme migration in admin pages and shared components using central tokens. Avoid a risky full rewrite; change in coherent batches and use CI.
7. Verify Razorpay subscription/invoice schema field names and transaction behavior against Prisma schema/migrations. Add unit tests for deterministic helpers; no live payment.
8. Review onboarding step persistence and signup tenant provisioning. Do not store secrets in generic progress JSON.
9. Update roadmap/progress docs and this handoff after each meaningful work session.
10. Keep migrations, database access, deployment and live payment activity on hold until user confirms they are home and ready.

## 8. Important files to inspect first

- `backend/modules/platform/plans.service.js`
- `backend/modules/platform/plans.routes.js`
- `backend/modules/platform/payment.controller.js`
- `backend/modules/platform/billing.service.js`
- `backend/modules/platform/brand.routes.js`
- `backend/modules/platform/admin.routes.js`
- `frontend/src/pages/admin/PricingManager.jsx`
- `frontend/src/pages/admin/AdminMarketing.jsx`
- `frontend/src/pages/admin/AdminDocuments.jsx`
- `frontend/src/pages/admin/AdminSettings.jsx`
- `frontend/src/pages/admin/AdminPlans.jsx`
- `frontend/src/components/admin/AdminLayout.jsx`
- `frontend/src/App.jsx`
- `frontend/src/pages/landing/LandingPage.jsx`
- `frontend/src/pages/onboarding/OnboardingWizard.jsx`
- `frontend/src/pages/onboarding/PlanSelectionStep.jsx`
- `HRMS_Blueprint/28_IMPLEMENTATION_PROGRESS.md`
- `backend/db-migrations/README.md`

## 9. Definition of honest progress

For every work session, report:
- Exact branch and latest commit SHA.
- Files actually changed and what changed.
- CI status for the exact commit (backend and frontend separately).
- What is not verified (DB, staging, payment, storage, browser E2E).
- What remains and the next concrete task.

A response saying “I will continue in the background” is not a valid status update. Do not imply background work is running after a turn ends. The user should be able to check GitHub commits and Actions to see real work.


## 2026-11-24 continued work — plan pricing hardening

- Latest work resumed from the Immediate next actions section and addressed the plan catalog → checkout calculator validation gap.
- `backend/modules/platform/plans.service.js`: added deterministic `calculatePriceFromCatalog`; only active plans are eligible; add-ons must be offered by the selected plan and cannot duplicate included modules; duplicate selections, unsupported billing periods, invalid employee counts, malformed module pricing and invalid discount configuration are rejected. Flat promo deductions cannot exceed the post-discount amount. A zero-price Free plan is calculated as zero; only null/undefined base prices return custom-quote mode.
- `backend/modules/platform/plans.routes.js`: price-selection/configuration errors are returned as HTTP 400 validation errors instead of generic HTTP 500.
- `backend/test/plan-pricing.test.js`: added focused unit coverage for price math, discounts/promos, Free/Custom plans, inactive plans, add-on eligibility and invalid catalog/request data.
- `HRMS_Blueprint/28_IMPLEMENTATION_PROGRESS.md` records this work.
- Commits: `eb382e86d4bc7de4151d0d001c25030af26b017d`, `ddcadae59973d88c52e21b12346bbb18443d5ed7`, `9a95c61467c3cdaf4bf7d9193cef9cdbb7431115`, `c0e5e034363e06112d4300a5404192869a4b0c75`, and progress-doc commit `d247c3f0ab3856cda65e9ce5932c9c010c22feea`.
- CI: Backend Tests passed for the calculator and route commits. The workflow for the new pricing test commit was in progress at the last check; verify the latest branch head and its workflow before claiming the tests passed. Frontend Build has not been re-run because this session changed backend code only.
- Remaining verification: confirm onboarding selector and payment controller send the expected request types and enforce the same server-side plan rules; inspect whether tenant pricing configuration preserves the selected plan's employee cap and add-on snapshot; add a regression test for these contract points.
- Live database, migrations, staging, and payment execution remain on hold. `main` remains untouched.

### Next task after this handoff update
Continue the end-to-end plan contract audit: compare `PlanSelectionStep.jsx`, `OnboardingWizard.jsx`, `payment.controller.js`, invoice snapshot fields and `saveSelectionToTenantConfig`. Correct mismatched payloads and ensure the saved tenant pricing config does not silently discard the selected employee cap/add-ons. Add tests where practical. Then recheck current branch CI and update this file again.


## 2026-11-24 continued work — onboarding selector and pricing tests

- Fixed a frontend pricing bug: `PlanSelectionStep.jsx` previously treated a legitimate zero-price Free plan as Custom because it used a truthiness check. It now treats only null/undefined base prices as Custom and allows the Free plan to be selected.
- Switching plans now clears previously selected add-ons and promo status so modules from the previous plan cannot accidentally remain in the checkout payload.
- Added a pure catalog calculator and validation tests. Backend CI passed on `d9871bd973c3fb641bdb63349a47efbd4346cea5`: 59 tests total, 55 passed, 0 failed, 4 skipped (RLS tests requiring a dedicated test database were skipped).
- Frontend Build passed for `88d9dc8a24a42015e5502705870e9c3ab23d23fb`. The subsequent plan-switch add-on reset is commit `743fc8f877fb6362787c31eb34b3b21430c52d05`; check its Frontend Build run before claiming the latest frontend head is green.
- The first test attempt failed because importing the service instantiated the central Prisma client without a CI datasource URL. The test now sets a dummy syntactically valid URL before import; no database connection is made by the pure calculator tests.
- Files changed in this follow-up: `backend/modules/platform/plans.service.js`, `backend/modules/platform/plans.routes.js`, `backend/test/plan-pricing.test.js`, `frontend/src/pages/onboarding/PlanSelectionStep.jsx`, and this progress/handoff documentation.
- Latest implementation commits include `eb382e86d4bc7de4151d0d001c25030af26b017d`, `ddcadae59973d88c52e21b12346bbb18443d5ed7`, `9a95c61467c3cdaf4bf7d9193cef9cdbb7431115`, `c0e5e034363e06112d4300a5404192869a4b0c75`, `d9871bd973c3fb641bdb63349a47efbd4346cea5`, `88d9dc8a24a42015e5502705870e9c3ab23d23fb`, and `743fc8f877fb6362787c31eb34b3b21430c52d05`.
- The full checkout contract audit is not complete. `verifySubscription` already snapshots plan/add-ons, activates tenant modules, writes the plan employee cap and creates the paid invoice in one transaction. Still inspect the complete transaction tail, verify the client/server payload contract and identify any price/invoice arithmetic mismatch. The older `saveSelectionToTenantConfig` helper appears to be a separate legacy path; do not refactor it until all callers are checked.
- No DB migration, staging deployment, or live payment was performed. `main` remains untouched.

### Immediate next actions (updated)
1. Check Backend Tests and Frontend Build for latest branch head after commit `743fc8f...` and the following documentation commits.
2. Finish audit of `PlanSelectionStep.jsx` → `OnboardingWizard.jsx` → `createSubscriptionOrder` → `verifySubscription`; ensure the server uses its own employee count and exact stored snapshot, and review invoice totals/line items.
3. Add tests around subscription snapshot verification and invoice arithmetic if a pure helper can be extracted safely.
4. Continue Marketing persistence/rendering audit and Document Review API/UI contract audit.
5. Keep DB migrations, staging, live payments and production changes on hold until user confirms readiness.


### CI and branch status refresh — 2026-11-24
- Frontend Build and Backend Tests both passed for code commit `743fc8f877fb6362787c31eb34b3b21430c52d05`.
- Backend pricing test suite passed on `d9871bd973c3fb641bdb63349a47efbd4346cea5`: 59 total, 55 passed, 0 failed, 4 skipped.
- Current branch comparison after the latest implementation/doc updates: 259 ahead of `main`, 0 behind. `main` remains untouched.
- Documentation commits after the last code commit trigger Backend Tests too; those documentation-head runs were still in progress at the time of this refresh. No claim is made that the newest documentation commit's run has completed.


## 2026-11-24 continuation session — subscription contract audit

- Re-opened this handoff from the live working branch before resuming. Live compare against `main`: **261 commits ahead, 0 behind**. `main` was not modified.
- Confirmed the current frontend onboarding contract: `PlanSelectionStep.jsx` passes plan slug, selected add-ons, billing months, manual renewal mode, promo code and a display-only price result. `OnboardingWizard.jsx` sends the paid order request to the server and does not treat the client price as authoritative.
- Confirmed `createSubscriptionOrder` derives the active employee count from the tenant database and recalculates the price server-side. It restricts launch checkout to Razorpay/manual renewal and rejects Free/Custom plans from paid checkout.
- Confirmed `verifySubscription` checks the Razorpay signature, fetches the order and payment from Razorpay, checks captured status, order/tenant/purpose/amount/currency binding, validates the stored server-generated order snapshot, then activates tenant plan/modules, writes tenant pricing configuration, creates a paid invoice and links it to the payment order in one transaction.
- **Confirmed unresolved Free-plan onboarding path:** `OnboardingWizard.handlePlanNext` advances directly to the Organisation step whenever `priceResult.total_paise === 0`. This includes the legitimate zero-price Free plan, not just a Custom quote. The Free plan is not activated through the paid order endpoint (which intentionally rejects it), and the Custom quote path should remain non-activating. The next implementation must distinguish Free from Custom and ensure Free plan entitlement/modules are correctly provisioned without creating a payment or invoice. Inspect signup provisioning and existing free-plan activation semantics before changing code.
- **Recurring promo configuration needs a focused audit:** paid verification persists `breakdown.promo_deduction_paise` into `tenant_pricing_configs.offer_flat_paise`. The legacy `subscriptionCalculator.js` applies `offer_flat_paise` during each calculation, while its comment describes a first-month offer. Before changing this, inspect the billing cron/service and promo expiry semantics to determine whether the discount is accidentally repeated on renewals or already cleared by the billing workflow.
- The onboarding UI currently has a `renewalMode` state defaulting to `manual`, and the UI explicitly communicates manual renewal. Keep this invariant; do not introduce recurring auto-charge.
- No source-code files were modified in this audit session. No migrations, database access, staging deployment, live payment or production action was performed. CI was not re-run in this read-only audit session; do not claim new CI verification.
- Handoff file itself is being refreshed to preserve the verified findings and exact next work.

### Immediate next actions (updated after contract audit)
1. Inspect tenant signup/provisioning and free-plan/module initialization. Implement a distinct, idempotent Free-plan activation path that grants only the Free catalog plan's included modules, writes the matching plan/cap configuration, and never creates a payment or invoice. Keep Custom quote as a sales/contact path and do not silently activate it.
2. Inspect `billing.service.js`, billing cron, `subscriptionCalculator.js`, and promo validation/storage to establish whether `offer_flat_paise` is applied once or on every renewal. Fix the persisted subscription discount model only after tracing the complete billing lifecycle; add regression tests.
3. Add focused tests for Free-plan activation/idempotency and promo renewal behavior. Run Backend Tests and Frontend Build on the resulting code commits.
4. Continue Marketing persistence/rendering audit and Document Review API/UI contract audit.
5. Recheck the current branch head, CI and main comparison before reporting progress. Keep all migrations, staging, live payments and production changes on hold until user confirms readiness.
