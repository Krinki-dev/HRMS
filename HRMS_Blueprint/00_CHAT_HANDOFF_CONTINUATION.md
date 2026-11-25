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


## 2026-11-24 — Permanent Free-plan activation path

- Added authenticated `POST /api/v1/platform/subscribe/free` (subscription router mount confirmed in `backend/server.js`); the frontend calls the matching `/platform/subscribe/free` path through the configured API base URL.
- Added `subscriptionEntitlements.js` as a pure catalog-to-entitlements mapper. It accepts only an active, zero-price `free` catalog plan with valid included modules and employee pricing limits.
- Added `subscription.controller.js::activateFreePlan`. It resolves the tenant from the authenticated session, transactionally converts only `free` or `trial` onboarding accounts to permanent `free`, clears trial expiry, sets the catalog employee cap, synchronizes included modules, and resets tenant pricing configuration to zero-cost. It refuses to downgrade a tenant with a captured subscription payment. It creates no payment order and no invoice.
- Added the authenticated `/free` route in `subscription.routes.js`.
- Updated `OnboardingWizard.handlePlanNext`: Free selection now calls the server activation endpoint; Custom quote selection no longer silently skips payment and continues onboarding; invalid zero/unknown paid totals are rejected instead of being treated as a free pass.
- Added `backend/test/subscription-entitlements.test.js` covering valid Free-plan mapping, module de-duplication, rejection of paid/custom/inactive plans, missing modules and invalid caps/pricing.
- Commits: controller `9afee6558901eff1033ef57ef6719899976ae46e`; route `0e51eb72c46d23588198b603694edea298cf84f2`; onboarding `c33c1d037095bb393ecff6caa36a590f541df6ac`; pure mapper `82707b80d395176795e3402d3d30fa29ea3f2368`; tests `e34b55e5c524232308dfd8d0a1f0bdc6e05a720d`.
- Live branch compare after these changes: **267 commits ahead, 0 behind** `main`. `main` remains untouched.
- CI evidence is not yet available for these commits: the commit-status endpoint returned no status entries and the workflow-run lookup returned no runs. The branch has push-triggered Backend Tests and Frontend Build workflows; re-check Actions before claiming a pass. No local repository test run is claimed.
- No database migration, DB connection, staging deployment, real payment or production change was performed.

### Newly confirmed follow-up risks
1. Registration currently creates tenants as `trial` and provisions an initial hardcoded module list. The new Free activation path converts this registration trial to permanent Free and syncs the current Free catalog modules. However, the separate “Start free trial instead” button still calls the existing trial endpoint, which rejects a tenant already placed on trial during registration. Inspect and correct the trial-selection contract without changing the agreed registration trial duration.
2. Subscription checkout persists `breakdown.promo_deduction_paise` into `tenant_pricing_configs.offer_flat_paise`, and the monthly invoice calculator applies that field again. The promo's validity expiry is not copied into the pricing config. Trace the full billing schedule and fix the one-time-vs-recurring promo semantics; also verify prepaid 6/12/24-month subscriptions are not invoiced again before their paid-through date.
3. Custom quote now remains on the plan step with a clear message, but a proper quote-request/contact workflow still needs to be wired.

### Immediate next actions
1. Audit and repair the trial-selection path, considering that registration already starts a trial; preserve existing 90-day cloud / 14-day self-hosted registration trial policy unless a frozen decision explicitly supersedes it.
2. Correct promo discount persistence and monthly invoice eligibility so a checkout discount is not unintentionally repeated and prepaid terms are not billed again prematurely. Add deterministic regression tests.
3. Verify the new Free activation endpoint with focused tests/mocks or integration coverage; check Backend Tests and Frontend Build on the exact latest branch head.
4. Continue Marketing persistence/rendering and Document Review contract audits.
5. Keep migrations, DB access, staging, live payments and production changes on hold until the user confirms readiness.


## 2026-11-24 — Trial selection and promo renewal hardening

- Repaired the existing registration-trial selection path. Registration already creates a trial (90 days for managed cloud, 14 days for self-hosted); the old `activateTrial` handler then rejected the user's trial selection as a duplicate activation.
- `subscription.controller.js::activateTrial` now applies the selected catalog plan's trial-eligible included modules and selected allowed add-ons to the already-active registration trial. It preserves the original trial expiry (does not restart or extend the trial), updates the employee cap/pricing config, and refuses to alter an account with a captured subscription payment.
- `subscriptionEntitlements.js` now validates trial plan eligibility, custom-plan exclusion, add-on membership, duplicates, module names and pricing limits. Added tests for trial entitlement mapping and invalid/custom/duplicate selections.
- Fixed one-time checkout promo persistence: paid subscription verification now stores the promo deduction only in the paid invoice snapshot and writes `offer_flat_paise = 0` / `offer_expiry_date = null` to the recurring tenant pricing configuration. The legacy `saveSelectionToTenantConfig` helper also no longer copies checkout promo deductions into recurring configuration.
- `subscriptionCalculator.js` now stops applying a flat offer after its configured expiry; malformed expiry dates fail closed (no discount). A missing expiry still means an intentionally non-expiring admin-configured offer.
- Added `backend/test/subscription-calculator.test.js` for expired, future, missing and invalid offer-expiry behavior.
- Commits: trial handler `2f2634cf6f5d8ba12ad47c563d2b1a7a9f743877`; trial helper `08f37c1971354d6a137335eb23bf98b09e4f3a52`; trial tests `200d4cc683d91074fead53c3c0288f721dbf0616`; custom trial guard `cd45bada1e23f268dc38a28749922f709689ea5b`; duplicate/custom tests `e3eb6aef00b280aac6aa381ec5a2d58190a7a492`; checkout promo fix `8df47f61fce7b3c224f9589f6e3c827d8a2f28f8`; legacy helper fix `5d42dea50455d1f124d91f310e3be37a2bdc8cc4`; calculator expiry fix `6fe7df91e255db82f091cb8137642c3f8a7a2b18`; calculator tests `90503da0b85e57c8b926b3c21fb54d148a72aa35`; trial module normalization `d05d6e05604c30c415a5bd1bad534efbf7251235`.
- Live branch compare at this checkpoint: **281 commits ahead, 0 behind** `main`; `main` remains untouched.
- CI verification is still pending. The commit combined-status endpoint returned no status entries and the workflow-run lookup returned no runs for the relevant commits. Do not claim Backend Tests or Frontend Build passed until GitHub Actions shows completed successful runs for the relevant head.
- No local repository test run, database connection, migration, staging deployment, live payment or production change is claimed/performed.

### Remaining billing audit (do not assume fixed)
- The monthly billing job currently selects active paid tenants without checking whether `plan_expires_at` is still in the future. Because subscription checkout charges the selected 1/6/12/24-month term upfront, this may create a second invoice before the paid-through date. The invoice period/renewal schedule also needs review for mid-month expiries and manual renewal timing.
- `discount_bundle_pct` and `discount_tenure_pct` are persisted after checkout and consumed by the monthly calculator. Determine which discounts are intended to recur versus apply only to the prepaid term before changing their persistence.
- Verify the subscription expiry/access enforcement path, manual invoice payment flow and renewal state transition together; do not patch billing cron in isolation.

### Immediate next actions
1. Trace the full prepaid subscription lifecycle: order snapshot, paid invoice, `plan_expires_at`, monthly invoice generation, manual invoice payment, and renewal activation. Prevent invoices before the paid-through date and avoid over/under-billing partial periods.
2. Decide and implement whether bundle/tenure discounts recur on future manual renewals; preserve the paid invoice's exact snapshot.
3. Check GitHub Actions for the exact latest branch head (Backend Tests and Frontend Build); resolve failures before continuing.
4. Add focused tests for prepaid-term invoice eligibility and renewal-period boundaries.
5. Continue Marketing persistence/rendering and Document Review contract audits after billing correctness.
6. Keep DB migrations, staging, live payments and production changes on hold until the user confirms readiness.


## 2026-11-24 — Billing lifecycle review (renewal path still open)

- Traced the current invoice renewal path beyond the calculator. `billing.service.js` runs only on the first day of each month and creates a calendar-month invoice for every active paid tenant; it currently does not filter by `plan_expires_at`.
- Subscription checkout charges the selected 1/6/12/24-month term upfront and writes that term's expiry to `tenants.plan_expires_at`. The current monthly invoice query can therefore generate another invoice before a prepaid term ends.
- The authenticated invoice-payment verification path marks the invoice paid and the payment ledger captured, but the inspected handler does not extend `tenants.plan_expires_at`. The renewal lifecycle is therefore incomplete, not just an early-invoice filter issue.
- The invoice period is currently the previous calendar month, not a tenant-specific period anchored to the paid-through date. Mid-month expiry, renewal periods and proration are not correctly represented by the current monthly cron.
- **No partial billing-cron or renewal-expiry patch was made.** A simple `plan_expires_at` filter would avoid some duplicate invoices but would still leave mid-month renewal timing and paid-invoice expiry extension broken. Fix the lifecycle as one coherent change with tests.
- The current manual-renewal policy remains in force. No automatic recurring charges or live payments were enabled.

### Exact next implementation
1. Define a deterministic renewal-period rule anchored to the existing `plan_expires_at` paid-through timestamp. Confirm how legacy tenants with a null expiry should be treated.
2. Make invoice generation idempotent per tenant + renewal period (not merely one invoice per calendar month). Do not generate a renewal invoice before the paid-through timestamp.
3. On verified payment of a renewal invoice, atomically mark the invoice/payment order paid and extend `plan_expires_at` from the later of the existing expiry or the renewal period end. Do not alter the already-paid initial subscription invoice flow.
4. Define the access/grace behavior for expired subscriptions and overdue renewal invoices. Inspect the existing tenant/plan middleware before adding enforcement.
5. Add pure date-boundary tests and mocked/integration tests for early invoice suppression, mid-month expiry, duplicate cron execution, successful renewal extension and failed payment.
6. Re-check Backend Tests and Frontend Build for the exact latest branch head. Current connector status lookups returned no status entries/runs; no CI pass is claimed.

No DB connection, migration, staging, deployment, live payment or production change was performed. `main` remains untouched.


## 10. 2026-11-25 — Production priority and manual renewal implementation

User priority: finish the remaining production-critical platform work as quickly and safely as possible, then move directly to HRMS module implementation. Do not spend time on optional polish while core modules remain to be audited/completed. Communicate estimates plainly; do not claim production readiness from code commits alone.

### Manual prepaid renewal source changes (committed; runtime verification pending)

- Added `backend/modules/platform/billingRenewal.js` with deterministic month-end-safe calendar arithmetic, renewal-period calculation, stable invoice-number generation, and max-expiry selection.
- Reworked `billing.service.js` so new renewal invoices are generated only when a paid subscription's `plan_expires_at` has actually arrived. The invoice period is anchored to the prepaid expiry, not the previous calendar month. It creates a one-month manual renewal invoice and uses a deterministic tenant + expiry-date invoice number so daily cron retries are idempotent.
- Legacy paid tenants with a null expiry are deliberately skipped for manual reconciliation; the system does not invent a billing date.
- Changed billing cron to run renewal invoice generation daily because subscriptions can expire on any calendar day. Overdue checks remain daily. No automatic charge is attempted.
- Updated invoice payment verification so only invoices explicitly marked `manual_subscription_renewal` extend `tenants.plan_expires_at`; the extension is calculated from the later of the current paid-through date and the invoice's immutable `renewalExpiresAt` snapshot. Initial subscription checkout invoices are not altered.
- A verified renewal payment clears suspension only when the suspension reason is the system-generated unpaid-invoice suspension; manual/admin suspensions are not silently lifted.
- Tenant middleware now permits suspended tenants through only the authenticated subscription invoice recovery endpoints (`pay`, `verify`, `my-invoices`, `my-subscription`). Other HRMS routes remain blocked.
- Added `backend/test/billing-renewal.test.js` covering early-invoice suppression, legacy null expiry, mid-month periods, month-end/leap-year clamping, deterministic invoice numbers, and expiry extension.
- Commits: helper `d291fceccdb091e88df4ee26a430a64fadc9a7be`; tests `17bedcb7f1533604318144ed5d343c786b21bcb7`; billing service `8982a36450b882ff2c48b683e8ee377e8c7ac402`; daily cron `ebb548706bd4168a2c2cd5cce634e62e7eb6b3b6`; payment renewal activation `6fc1dd6cd78ba7067622b80d40f46e197b20a3a6`; suspended billing recovery `e12e05bf899700f48927f098fa47b0cd5ef4aa6e`.

### Important verification and release caveats

- These are source changes only. No local Node test suite, Prisma validation/generation, PostgreSQL integration test, staging test, Razorpay sandbox transaction, migration, or production deployment was executed.
- The combined commit status lookup for the latest code commit returned no status entries; the workflow-run connector only returned PR-triggered runs and returned none. Do not state that CI passed.
- The renewal policy implemented is one-month manual renewal after the prepaid expiry. The invoice is generated on/after expiry, with a seven-day due window; the overdue job suspends access after the due date. The user can still access only billing recovery endpoints after suspension.
- Confirm invoice calculations against the actual plan catalogue and GST invoice policy in staging before launch. The renewal invoice uses the current monthly pricing configuration; it does not attempt to replay the previous prepaid invoice's promotional deduction.
- The daily job can only create invoices for active paid tenants with a valid non-null expiry and pricing configuration. Legacy paid tenants with null expiry need a reviewed migration/reconciliation list.
- Review the narrow suspended-tenant route exception and all proxy/host variants in integration tests before release.

### Production readiness estimate and next execution order

Planning estimate from source review (not a guaranteed calendar promise):
- Billing/renewal hardening and tests: 1–3 focused engineering days remain, primarily validation, webhook/ledger review, and reconciliation.
- Tenant provisioning/isolation, onboarding, access control and platform-admin verification: 2–4 focused days.
- Core HRMS module completion/integration: 5–10+ focused days depending on actual gaps found in Employees, Attendance, Leave, Payroll and Compliance.
- Security/regression/staging/deployment readiness: 3–5 focused days after the above.

Priority after renewal:
1. Verify billing and subscription lifecycle end-to-end (including webhook raw-body/signature, payment ledger idempotency, reconciliation, suspended recovery and renewal).
2. Verify tenant provisioning, PostgreSQL storage classification/resolver, RLS and onboarding persistence. No production migration until supervised staging and backup/restore verification.
3. Audit and complete core modules in dependency order: Employees → Attendance/Shift → Leave → Payroll → Compliance.
4. Then Recruitment, Performance, Training, Assets, Expenses, Reports, Notifications/Automation.
5. Run security, tenant-isolation, browser E2E, backup/restore and deployment gates.

User should not be asked to repeat technical decisions. Ask for their involvement only when staging/DB access, secrets configuration, legal/business policy confirmation, or production approval is genuinely required.


## 11. 2026-11-25 — HRMS module execution resumed

- A critical entitlement gap was found: `checkModuleEnabled` was a no-op and was not used on the primary module routers. Server-side module plan gating has now been implemented and mounted on Employees, Attendance, Leave, Payroll, Compliance, Recruitment, Performance, Training, Assets, Expenses and Reports.
- The gate trusts only `req.tenant.enabledModules` populated by tenant middleware; it does not trust client-supplied module lists or ordinary tenant-admin roles. Missing entitlement metadata fails closed. Platform-level admin can bypass for support/administration.
- Regression tests were added but not executed in this environment.
- Current audit shows the main HRMS modules already have substantial backend routes/controllers/services. Payroll and Compliance have integration tests requiring PostgreSQL. Their existing "Live" blueprint labels are not proof of end-to-end readiness.
- Immediate module task: audit Employees frontend + backend service/controller + database schema + ESS permissions + document storage; then trace Attendance and Leave into Payroll and Compliance. Check each workflow end-to-end rather than adding broad features blindly.
- Review remaining module routers and permission coverage, especially self-service Attendance/Leave, Automation, Notifications, Settings and Roles. Plan gating and per-user authorization are separate requirements.


## 12. 2026-11-25 — Frozen user requirement: CSV + relational multi-sheet Excel for every module

- User requires two first-class import/export options across all HRMS modules: standard CSV and advanced Excel workbook (.xlsx).
- XLSX is one workbook per module dataset with multiple logically related worksheets, not a collection of unrelated flat CSVs. Employee example: Basic/Employees, Contact, Family, Education, Employment History/Lifecycle, plus permission-gated sensitive sheets and controlled reference lists.
- Parent/child links must use stable employee codes and/or immutable record IDs, never row numbers or names. New IDs are server-generated and returned in an import result mapping. All references are resolved within the current tenant.
- Import is preview-first: parse, validate all sheets/references/duplicates/required fields, show sheet/row-level errors, allow confirmation, commit safely, and provide a downloadable error workbook and summary. Explicit create/update/upsert modes; no silent deletion/replacement.
- Export/import respect tenant isolation, module entitlements, role permissions and field-level sensitive data rules. Bank/salary/identity data excluded by default and separately authorised. Documents are represented by secure metadata/reference unless explicitly handled through a protected document workflow.
- Excel templates preserve useful formats, date/number formats, dropdowns, frozen headers, filters and instructions. No macros/external links; formulas are usability only and never trusted as imported source values.
- CSV remains supported; for relational datasets use separate CSVs or a documented ZIP bundle while keeping a simple CSV option.
- Apply to Employees, Attendance, Leave, Payroll, Compliance, Recruitment, Performance, Training, Assets, Expenses and all other applicable modules.
- Build reusable import/export engine and schema-driven templates during Employees; reuse the framework for each subsequent module. Include sample/template download links in UI and round-trip tests for CSV and XLSX.
- Detailed rules are recorded in `HRMS_Blueprint/32_PRODUCTION_READINESS_AND_MODULE_EXECUTION_PLAN.md`. This requirement is frozen; do not ask the user to repeat it.


## 13. 2026-11-25 — Employees workbook implementation checkpoint

- Current work remains on `architecture/postgres-tenant-isolation`; do not touch `main`.
- Employees source audit: current import/export is flat CSV only. Frontend parses CSV locally and sends rows to the bulk-import endpoint; the endpoint validates only a small subset and commits immediately. It does not yet provide the required backend preview/confirm workflow.
- Existing employee-related DB models include employees, employee_addresses, employee_family, employee_education, employee_prev_employment, employee_bank_accounts and employee_documents. Employee Code is unique per company; child rows reference employee IDs.
- Initial code added: `backend/modules/employees/employee-workbook.schema.js` (Employees, Addresses, Family, Education, PreviousEmployment relational sheet definitions) and reusable `backend/shared/import-export/workbookSchema.js` validation primitives. Stable Employee Code joins child tabs; optional immutable child UUIDs support later update workflows.
- Default workbook intentionally excludes bank account details and Aadhaar/PAN. Document binaries and private file URLs are not exported by the default workbook.
- Tests added in `backend/test/employee-workbook-schema.test.js`; they have not yet been run. CI status for the newest head has not yet been checked.
- Important: this is schema/validation groundwork, not a completed Excel feature. XLSX reader/writer, template formatting, API preview/commit, transaction-safe persistence, error workbook, UI options, and end-to-end tests remain.
- Next actions: (1) check current branch head and CI; (2) run focused tests in CI; (3) map each workbook sheet to existing Prisma models and permissions; (4) add XLSX reader/writer dependency and lockfile correctly; (5) implement backend preview then explicit commit transaction; (6) preserve and improve the existing CSV path; (7) integrate CSV + Excel options into EmployeeImportPage and export UI.


## 14. 2026-11-25 — Employees import/export and sensitive-data checkpoint

- Expanded the Employee workbook schema to include a separate ContactDetails sheet, alongside Employees, Addresses, Family, Education and PreviousEmployment. Child sheets link by Employee Code; optional immutable child UUIDs are reserved for updates.
- Audited the current CSV path: the frontend parses and previews rows locally, but the import button immediately commits; the API checks only first/last name and the service creates each employee in a separate write. Invalid department/designation/branch names silently become null. This is not a safe server-side preview/transaction workflow and must be replaced without removing CSV compatibility.
- Found that built-in tenant Admin/HR Admin roles bypass ordinary `checkPermission` actions. The old Aadhaar/PAN unmask and bank-account read routes used ordinary employee view permission. Added a separate strict `checkSensitivePermission` middleware that does not grant sensitive access merely because the user is a built-in tenant admin; it requires explicit `employees.view_sensitive` or platform-level access. Applied it to identity unmask and bank-account read routes.
- Added regression tests for the explicit sensitive permission boundary. GitHub Actions Backend Tests succeeded at commit `20ef9b709291eab9a80e33c785b8211e9fb8b06b`: 87 tests, 83 passed, 0 failed, 4 skipped. This run includes schema/validator and permission tests; it is not PostgreSQL/browser/staging certification.
- Fixed a pre-existing renewal test expectation: the one-month period from Nov 25 to Dec 25 ends on Dec 25 as a date-only value. CI then passed at `6668732d42531b430b969d3e78792481e35e9e14` (85 tests, 81 passed, 0 failed, 4 skipped).
- Remaining import/export work: choose and lock a secure XLSX library, workbook writer/parser with bounded upload/decompression, server-side preview and persisted import jobs, conflict checks, transactional parent/child commit, error workbook, ID mapping, side-by-side UI, CSV robustness and round-trip tests.


## 14. 2026-11-25 — Employees workbook validation/security follow-up

- Latest implementation adds ContactDetails as a separate worksheet; Employees sheet no longer duplicates contact/address fields. Relational sheets link by Employee Code.
- Shared validator resolves schema-declared references such as Manager Employee Code, validates parent-child links, supports only create-only/update-only/upsert, and requires child record UUIDs for update-only while forbidding them for create-only. It rejects formulas/non-primitive cells, invalid dates, duplicate keys and unknown worksheets.
- Sensitive employee import fields (Aadhaar, PAN, UAN, ESI and disability status) now require explicit employees.edit_sensitive permission when populated. Normal CSV import remains possible without sensitive permission. Default CSV template excludes these fields; CSV export already excludes them.
- Billing renewal invoice period_end bug found by CI was fixed: inclusive period_end is the calendar day before the paid-through expiry date. Backend CI run at 3388326dc14305f58487e26b578f2e613896bddb passed. The newest workbook/security commits still need a final green CI run; intermediate runs exposed validator/test issues which have since been corrected in commits 1016ea36c5c16b7a6da405511866255f012eacc3 and 9d93d7394e397c4f0b142d86a7daef0cd99267ba.
- XLSX parser/writer, template, import preview/confirm persistence, database conflict checks, transaction-safe commit, error workbook and UI are not implemented yet. Do not present the workbook feature as complete.
