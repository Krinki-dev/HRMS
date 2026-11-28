# HRMS — Chat Continuation Handoff

**Purpose:** This is the durable handoff for continuing work in a new ChatGPT conversation without changing prior decisions, losing context, or repeating investigation. Read this file before making code changes.

**Repository:** `Krinki-dev/HRMS`  
**Working branch:** `architecture/postgres-tenant-isolation`  
**Protected branch:** `main` — do not modify it.  
**Current handoff date:** 2026-11-25 (Asia/Kolkata)


## LATEST AUTHORITATIVE OVERRIDE — 2026-11-25

This block supersedes older statements elsewhere in this handoff if they conflict.

- Master code/architecture audit: HRMS_Blueprint/33_MASTER_CODEBASE_ARCHITECTURE_AUDIT.md.
- Open product decisions: HRMS_Blueprint/34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md.
- Git history verified: 477 reachable commits total; 378 commits from 2026-11-23 through 2026-11-25 are ahead of the common base with main; 99 older baseline commits are dated 2026-06-16 through 2026-08-21.
- Common base with main: cd400a602eb255029c1daeeae1d35f0c7b7ee948. Current head at the start of this audit: cce0117970b6d816e4a7880b4bad11edb21e05e2. Do not modify main.
- User-confirmed storage policy: PostgreSQL only; Free/Trial use tenant operational public schema; Paid tenants use their own UUID-derived schema; optional Enterprise dedicated PostgreSQL DB/instance only by separate approval; client-hosted/offline PostgreSQL remains required; hybrid synchronization is deferred.
- Central tenants.id and operational companies.id are distinct. Current token/context code overloads tenantId; fix this as P0 by carrying tenantId and companyId separately.
- The tenant storage config/resolver helpers and their tests reflect the public/Paid policy, but live tenant registration/routing still has old subdomain schema allocation, cloneSchema, hybrid/legacy engine paths and development fallbacks. Do not assume the policy is live.
- The tenant Prisma migration history still declares MSSQL and contains SQL Server syntax. Do not run backend npm migrate, migrate reset, blind db push or the legacy migration against PostgreSQL.
- Central migration backend/db-migrations/20261125_central_platform_schema_upgrade.sql has been applied on the correct Central HRMS DB; user supplied 12/12 verification checks as true. Tenant operational migrations have NOT been applied. Tenant inventory was read-only.
- Do not ask the user to run further SQL at this stage. Continue source audit and documentation first.
- No tenant schema deletion or operational data cleanup has been done. Even though the user permits eventual cleanup of dummy operational data, classify and restore-test first.
- The exact latest branch CI has not been verified by this audit. Prior CI results apply only to their recorded commits.
- Current priority is P0 identity mapping, public-schema isolation/RLS, single PostgreSQL resolver, Free/Trial signup routing, paid provisioning/promotion and a clean PostgreSQL migration baseline.

## 1. How to continue in a new chat

Paste this instruction in the new chat:

> Continue the HRMS project using `HRMS_Blueprint/00_CHAT_HANDOFF_CONTINUATION.md` from branch `architecture/postgres-tenant-isolation`. Read it first, preserve every existing decision and constraint, inspect the current branch head before editing, and resume from the “Immediate next actions” section. Do not restart the project, change architecture decisions, or ask me to repeat information already recorded. Make real code commits on the working branch and report only verified progress. Update this handoff file after each meaningful work session.

Always fetch the latest copy of this file from the working branch. The latest branch state and code are authoritative if this document becomes stale. Before code work, also read HRMS_Blueprint/33_MASTER_CODEBASE_ARCHITECTURE_AUDIT.md and HRMS_Blueprint/34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md.

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
- Central platform migration has been applied and verified 12/12 on the correct Central HRMS DB. Tenant operational migrations remain unapplied. Do not ask for another SQL run during source audit; wait for explicit user readiness before any tenant/staging migration.
- Do not treat source commits or CI as proof of live DB correctness.

### UI/theme
- User wants a macOS-inspired, readable, polished interface.
- Centralize typography, colors, spacing, sizes, radii, surfaces and related tokens in the theme system so a global change can be made centrally.
- Light theme is the default for new users; saved dark preference should continue to work.
- Theme foundation exists, but legacy screen styles still need gradual migration and visual verification.

## 4. Current branch / verification state

- Working branch: `architecture/postgres-tenant-isolation`.
- `main` must remain untouched.
- At the 2026-11-25 audit start, branch was **378 commits ahead, 0 behind** main; common base cd400a602eb255029c1daeeae1d35f0c7b7ee948. The branch has 477 reachable commits total, including 99 earlier baseline commits. Recheck the branch ref before future status reports.
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

Central migration backend/db-migrations/20261125_central_platform_schema_upgrade.sql HAS been applied to the correct Central HRMS database and its 12 expected checks were verified true by the user. Tenant operational migrations have NOT been applied. The inventory SQL was read-only. Later: review tenant state, classify schemas, backup and restore-test, build a PostgreSQL migration baseline, stage and verify, then obtain explicit approval before production.

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
- Added a pure catalog calculator and validation tests. Backend CI passed on `d9871bd973c3fb641bdb63349a47efbd4346cea5`: 59 tests total, 56 passed, 0 failed, 4 skipped (RLS tests requiring a dedicated test database were skipped).
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

## 2026-11-25 — User-confirmed storage policy and source-audit continuation

This section supersedes older handoff statements wherever they conflict with the user's latest explicit clarification.

### User-confirmed architecture decisions

- PostgreSQL is the only supported database engine. Remove obsolete MySQL, SQL Server/MSSQL and SQLite compatibility code after tracing callers and documenting any required legacy-data conversion.
- Free and Trial customers share the tenant operational database's `public` schema.
- Every Paid customer receives an individually isolated PostgreSQL schema. The schema name must be generated from a stable tenant identifier, not customer-controlled input or a mutable subdomain.
- The user confirms that current tenant operational records are dummy/test data and may be cleaned or removed if required for the upgrade. This is permission to plan cleanup, not evidence that any deletion has occurred. Back up first and keep Central/platform records distinct from tenant operational test data.
- The user confirms that repeated HRMS table sets across schemas are intentional in principle: paid customers have their own schemas; Free/Trial share `public`. Do not treat every repeated schema as accidental duplication. Classify each schema before cleanup.
- During every module upgrade, perform a bounded code-cleanup pass: remove dead branches, obsolete database-engine compatibility, duplicate implementations, unused imports/helpers and stale comments only after reference checks and tests. Do not perform unrelated mass rewrites.
- Keep this file current after meaningful work. The user is non-technical; avoid asking them to run code or SQL while source-code work can proceed. Never ask for passwords or full connection strings.

### Tenant database inventory supplied by the user

Read-only inspection of the tenant operational database reported PostgreSQL 17.6 and schemas including `public`, `tenant_app`, `tenant_hrms`, `tenant_pcepl`, `tenant_rahultradeco`, and `tenant_syntern`, in addition to Supabase-managed `auth`, `realtime`, `storage`, and `vault` schemas. HRMS table names repeat across the tenant schemas. Estimated row counts showed a small number of announcement rows in `tenant_hrms` and `tenant_pcepl`; most listed HRMS tables showed zero estimated rows. These are PostgreSQL statistics estimates, not exact counts. The diagnostic found no `_prisma_migrations` table in the inspected database. Installed extensions included pgcrypto, pg_stat_statements, plpgsql, supabase_vault and uuid-ossp.

Do not drop Supabase-managed schemas. Do not infer that `tenant_app` or any customer schema is safe to delete solely from its name or estimated row count. Reconcile schema names against Central tenant records and the actual provisioning/routing code first. Central DB and tenant operational DB remain separate configuration roles (`CENTRAL_DATABASE_URL` and `DEV_TENANT_DATABASE_URL`); never run tenant SQL against Central or vice versa.

### Confirmed source findings on the working branch

Comparison from baseline commit `cd400a602eb255029c1daeeae1d35f0c7b7ee948` to reviewed commit `89a22e5e1c52dd001275c808be0caff54a53d959` reported 364 commits ahead and 0 behind. The reviewed head commit is dated 2026-11-25. This confirms the scale of the branch history; it does not mean all 364 commits have been individually diff-reviewed.

1. `backend/shared/middleware/tenant.js` still contains MySQL, MSSQL and SQLite URL branches, and a `hybrid` local-to-cloud connection fallback. That fallback is not synchronization.
2. `backend/modules/platform/platform.service.js` has a second URL resolver and duplicate MySQL/MSSQL branches. Its registration path still derives `tenant_<subdomain>` for cloud/external-cloud customers and clones a template schema regardless of Free/Trial/Paid plan.
3. Registration does not write `storage_tier` or `storage_status`; Central Prisma defaults those fields to `legacy_unclassified`. The registration path later writes a schema name, but the new storage lifecycle model is not yet integrated.
4. Paid subscription verification updates the plan, modules, pricing configuration, invoice and payment ledger transactionally, but does not provision/verify a dedicated schema or update storage lifecycle metadata. Free-plan and Trial activation paths also do not update storage assignment.
5. `tenantStorageConfig.js` and `tenantStorageResolver.js` currently require the shared schema name `shared_tenants`, which conflicts with the user's explicit requirement that Free/Trial use `public`. The resolver is not yet wired into `tenant.js`.
6. `tenantStorageResolver.js` deliberately blocks local mode at this stage even though client-hosted/offline PostgreSQL remains a documented product requirement. Implement and test PostgreSQL local URL construction before enabling that path.
7. `dbSchema.js` uses template cloning via `CREATE TABLE ... LIKE` plus separate sequence creation. This is not a complete versioned schema-provisioning process and must not be the canonical paid-schema provisioning mechanism.
8. The tenant Prisma schema has a distinct `companies.id` from Central `tenants.id`. Shared-`public` isolation must define the authenticated mapping and consistently scope company-owned records and child records. A prior real compliance cross-company data leak was fixed with `company_id` filters; treat this as a security-critical regression class and audit all modules.
9. `tenantDeletionGuard.js` blocks shared storage deletion, and `tenantDeletion.service.js` currently fails closed before physical deletion pending restore verification. Keep this protection; never drop/recreate `public` for one tenant.
10. The legacy tenant Prisma migration directory has a SQL Server migration lock and SQL Server-specific initial SQL. It is not a valid PostgreSQL migration history. Do not run it against PostgreSQL or use `migrate reset`.

### Documentation alignment required

- `HRMS_Blueprint/21_POSTGRES_TENANCY_MIGRATION_PLAN.md`, `22_SOURCE_AUDIT_AND_MIGRATION_IMPACT.md`, `23_FILE_BY_FILE_IMPLEMENTATION_BLUEPRINT.md`, `25_TENANT_STORAGE_RESOLVER.md`, `26_TENANT_STORAGE_INVENTORY_AUDIT.md`, `28_IMPLEMENTATION_PROGRESS.md`, `04_DATABASE.md`, `05_DATA_FLOW.md`, and `07_FROZEN_DECISIONS.md` need reconciliation with the explicit `public` shared-schema rule and the latest code.
- `tenantStorageConfig.js`, `tenantStorageResolver.js`, and their tests currently use `shared_tenants`; update the contract and tests to `public` as part of the controlled storage-resolver integration.
- The Blueprint index and this handoff refer to `08_STATUS_AND_CHANGELOG.md`, but fetching that path on the working branch returned 404. Confirm the intended status source and update the index/handoff references rather than asking a new chat to locate a missing file.
- The existing source-audit document contains useful findings but must be refreshed where current code has changed. In particular, registration now returns a provisioning error and leaves the tenant inactive when schema cloning or seeding fails; it still lacks a durable retry/state-machine workflow.

### Required implementation order

1. Finish a history/source audit of the 364-commit branch range, prioritizing database architecture, tenant middleware, registration, payment/subscription, storage lifecycle, deletion/backup, auth/company mapping, and security-sensitive module changes. Compare commit messages/diffs with current files; treat current branch source as authoritative.
2. Define the canonical storage contract: Free/Trial = `public`; Paid = UUID-derived dedicated schema; PostgreSQL only; client-hosted/offline PostgreSQL remains a separately validated deployment mode. Keep Central platform metadata and tenant operational data correctly separated.
3. Update pure storage configuration/resolver/tests from `shared_tenants` to `public`; define the mapping between Central tenant ID, business company ID and all tenant-owned child records.
4. Build one idempotent PostgreSQL provisioning/promotion service. Trial signup must route to `public`; verified paid activation must provision/migrate/copy/validate a dedicated schema before switching routing or paid entitlements. Preserve rollback source data until validation and retention checks pass.
5. Integrate the resolver into request middleware, background jobs, backups and deletion. Remove recognized-tenant development fallbacks that can silently route to another dataset. Ensure pool cache identity and lifecycle are safe.
6. Replace template cloning with versioned PostgreSQL migrations and a valid baseline. Do not run the old MSSQL migration history.
7. Audit every tenant module for company/tenant scoping, sensitive-field permissions, duplicate/dead code and obsolete database-engine branches. Add regression tests as each module is upgraded.
8. Update all architecture, database, data-flow, frozen-decision, progress and handoff documents to match implemented behavior.
9. Validate Prisma generation, backend tests, frontend build, disposable PostgreSQL integration, tenant isolation, paid promotion rollback, backup/restore and provider sandbox flows on exact commits. No production readiness claim until these gates pass.

### Current verification boundary

- The Central/platform additive schema upgrade was previously executed by the user on the correct Central database and all 12 verification checks returned true.
- The tenant database inspection was read-only. No tenant migration, schema deletion, data cleanup, routing change, payment or deployment has been performed as part of this update.
- The latest reviewed tenant inventory diagnostic fix is commit `89a22e5e1c52dd001275c808be0caff54a53d959`.
- CI for the latest reviewed branch commit must be checked again; earlier successful CI runs do not verify the current branch state.
- Do not ask the user to repeat the architecture decisions or rerun SQL at this stage. Continue source/history analysis and implementation on `architecture/postgres-tenant-isolation`; never modify `main`.

## 2026-11-25 — Public-schema policy alignment committed

### Changes committed on the working branch

- Updated `backend/shared/utils/tenantStorageConfig.js`: Free/Trial shared storage now resolves to `public`, not the obsolete `shared_tenants` name. Paid plans continue to derive their dedicated schema from the immutable tenant UUID.
- Updated `backend/shared/utils/tenantStorageResolver.js`: a ready shared tenant is accepted only when its schema is exactly `public`; paid dedicated schemas must still match the tenant UUID.
- Updated `backend/test/tenant-storage-resolver.test.js`: coverage now checks both Free and Trial routing to `public`, plan-to-storage descriptor allocation, and rejection of mismatched shared schemas.
- Updated `backend/test/tenant-deletion-guard.test.js`: shared-schema deletion guard test now uses `public`.
- Updated architecture documents `07_FROZEN_DECISIONS.md`, `21_POSTGRES_TENANCY_MIGRATION_PLAN.md`, `22_SOURCE_AUDIT_AND_MIGRATION_IMPACT.md`, `23_FILE_BY_FILE_IMPLEMENTATION_BLUEPRINT.md`, `25_TENANT_STORAGE_RESOLVER.md`, and `26_TENANT_STORAGE_INVENTORY_AUDIT.md` to record the confirmed public-schema rule.
- Updated this handoff with the user's architecture clarifications, tenant DB inventory summary, code findings and continuation order.

### Commit references

- Handoff clarification: `aab7ca848bde992e43d0d943ae55b6b8b73c99f9`
- Storage config: `7ca87aa923312982cd935ba466365760025390ed`, follow-up wording: `72843291d64f321a008f5bcd3ea11eb36af1f28d`
- Storage resolver: `26a8c1425558af7bb5a73ea576da1107e24d69b5`
- Resolver tests: `9427bc44d7cd2426aca3ed2676a6d2c83463a91e`, follow-up allocation coverage: `f9c2c417e1488e8cd1f762cd7221a55069e71d1d`
- Deletion guard test: `82db13ccc7c53044f12e346f2148099c7ad891e8`
- Frozen decisions: `193852fd4189fdca7888e8d35500415ae24e2df4`
- Tenancy plan: `98b34037f11306fd20d57a1e0b461907557023bc`
- Source audit: `db7e2735f69c915767b47a83a770babe11461401`
- File-by-file blueprint: `9bef951eecbab879c5ca415945033ddf8c31fce2`
- Inventory audit: `8a4f7af4047a701b10d565682a5e5c57e2bf991c`
- Resolver note: `a5a8a9aba01ee10753adf9e0aa27244677030001`

### Verification boundary

- These commits align the pure storage contract and tests with the user's public-schema decision. They do **not** yet route live requests through the new resolver.
- GitHub Actions workflow-run lookup returned no run for these direct commits. Node tests, Prisma validation/generation, frontend build and PostgreSQL integration tests have not been executed for these changes.
- Registration still needs to write storage tier/status correctly and keep Free/Trial in `public`; verified paid subscription activation still needs an idempotent dedicated-schema promotion workflow.
- The legacy engine branches, duplicate connection resolvers, old clone-based provisioning, local PostgreSQL resolver, tenant/company mapping and module-wide company scoping remain open work.
- No database migration, schema drop, dummy-data cleanup, live routing change, payment or deployment was performed.



## 2026-11-25 — Master codebase audit baseline and owner decision register

Created and committed:
- HRMS_Blueprint/33_MASTER_CODEBASE_ARCHITECTURE_AUDIT.md — source-verified architecture, database/storage lifecycle, P0/P1 findings, verification gates and remaining audit register.
- HRMS_Blueprint/34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md — only business/product choices requiring owner direction, with recommended defaults.

Also updated:
- 00_INDEX.md to make the new audit and decision register the starting authority and remove the unavailable 08_STATUS_AND_CHANGELOG.md as the working status reference.
- 07_FROZEN_DECISIONS.md with an override section for PostgreSQL-only, Free/Trial public, Paid UUID schema, Razorpay-only and identity mapping.
- 32_PRODUCTION_READINESS_AND_MODULE_EXECUTION_PLAN.md with current blockers.
- This handoff with the verified Central migration result and current audit priorities.

Verified facts:
- 477 reachable commits in branch history; 378 dated 2026-11-23 to 2026-11-25; 99 earlier baseline commits dated 2026-06-16 to 2026-08-21.
- Branch compare at audit start: 378 ahead / 0 behind main, common base cd400a602eb255029c1daeeae1d35f0c7b7ee948.
- New documentation commits changed no application source code. Current-head CI status query returned no status records or workflow runs; do not claim a fresh CI pass.
- Central schema migration is applied and verified 12/12 by the user. Tenant operational migrations remain unapplied.
- No SQL, tenant data cleanup, schema deletion, production deployment or live payment was performed.

Important source findings to retain:
1. Current tenant routing/registration still bypasses the new pure storage allocation/resolver helpers; Free/Trial public and Paid UUID-schema are not yet live end-to-end.
2. Tenant/company IDs are overloaded: auth token tenantId currently comes from operational user.company_id, while platform billing code treats it as Central tenants.id.
3. Subscription employee pricing count does not filter company_id.
4. Tenant operational business tables lack a complete shared-public RLS protection set.
5. Tenant Prisma migration history declares MSSQL and includes SQL Server DDL; do not use current migrate script.
6. Local PostgreSQL URL construction is not supported by the new resolver yet.
7. Shared public per-tenant backup/restore is not implemented; deletion remains safely fail-closed.
8. Employee relational workbook contract exists, but full XLSX import/export pipeline is pending.

Resume from Section 10 of 33_MASTER_CODEBASE_ARCHITECTURE_AUDIT.md. Do not ask the user to repeat confirmed tenancy or CSV/XLSX decisions. Do not ask for another SQL run before source-code audit is complete. First resolve or get owner input on the items in 34_OWNER_DECISIONS_AND_RECOMMENDATIONS.md; then continue with P0 identity and shared-schema isolation.


### Additional findings from extended historical/source review — 2026-11-25

- Frontend access tokens are currently persisted to localStorage by authStore.js and api.js. This conflicts with the frozen security rule. Move access tokens to memory-only state; keep refresh token only in the httpOnly cookie.
- Central user index uniqueness is (email, company_id), but email/phone/employee-ID login lookup can query across tenants with LIMIT 1. Require explicit tenant context or tenant choice and add cross-tenant duplicate identity tests.
- Unauthenticated lookup endpoints return tenant metadata; employee-ID lookup also returns email. IP rate limiting exists, but data minimization and enumeration defenses need review.
- Current auth middleware directly queries central_user_index without withPlatformAdminRLS; complete the Central RLS call-site audit.
- Current BillingConfigTab.jsx retains a fabricated mock subscription checkout branch; backend rejects mock activation. Remove stale front-end path once automated test dependencies are checked.
- Historical Git commits included an old backend/.env snapshot with database-URL-shaped values and an old frontend/certs/server.key file. Current tree/.gitignore no longer includes these, but old public commit history can retain them. User previously described .env values as dummy; live validity of those values/key was not verified. Rotate anything that was ever real. Do not expose values in chat/docs.
- App.jsx routes tenant hosts through the legacy HRAppLayout while the wider module UI route tree is under IS_PLATFORM_ROOT; verify intended tenant host routes with E2E before calling every module available.
- frontend/src/router/clientRoutes.jsx is not imported by current App.jsx and is a dead-code candidate, but delete only after reference/build audit.
- migrate_user_index.js is an operator-only one-off script that reads tenant connection fields; never add it to automatic startup or run it without allowlist/dry-run/secret-handling review.
- Historical deployment code made canonical migration failure non-fatal to server start; require migration-compatible readiness rather than treating process startup as deployment success.

Extended historical commit review continues. The 99 old commits are not all claimed as individually line-by-line reviewed; continue source patch review for remaining unresolved areas before declaring the legacy audit complete.

### Encryption and deployment migration blockers — verified 2026-11-25

- backend/shared/utils/encryption.js still includes a static fallback key if ENCRYPTION_KEY is absent. Current server startServer() does require ENCRYPTION_KEY and production length >=16, but helper scripts/dev processes that import encryption without server startup could still use the fallback. Remove fallback; use one canonical key format and validate everywhere.
- backend/shared/utils/piiEncryption.js uses a different ENC:<base64> ciphertext format and strict 32-byte key requirement. Search found no live Employee service using decryptPII(); current Employee services use shared/utils/encryption.js colon-separated GCM/CBC format.
- backend/scripts/migrate-pii-encryption.js rewrites employee Aadhaar/PAN/bank fields into ENC:. This is incompatible with the live Employee decrypt() function and may make the fields unreadable in the app. **Do not run this script** until a compatibility migration is redesigned and round-trip tested.
- backend/scripts/apply_canonical_schema_migration.js catches migration errors and continues server startup. This was intentionally introduced historically. Treat migration success as a separate hard readiness gate; process startup is not schema readiness.
- migrate_user_index.js and other full-tenant sweeps are operator-only; require a tenant allowlist, dry-run, backup, audit and secret-safe handling. Never add them to startup.

## Session update — 2026-11-25 (new chat continuation)

- Re-read this handoff, the master audit (33), owner decisions (34), implementation progress, and the relevant source files from the working branch.
- Confirmed current branch head before this session's change was `a00e885a7b35a531a1df788821ba5b0518e71f9c` (docs-only encryption/migration safety update). `main` remains untouched.
- Rechecked exact-head Backend Tests run `45607022296`: 94 tests, 89 passed, 1 failed, 4 skipped. The only reported failure was a stale assertion in `backend/test/tenant-storage-config.test.js` expecting `shared_tenants`, while the approved policy and implementation both require `public`.
- Corrected that test expectation and test title to `public` and committed as `62d56b43dec7d51f38863d10661fa1ca4428577d` (`test: align shared tenant schema expectations with public`). This is a test alignment only; it does not change runtime behavior.
- CI for the new commit has not yet been observed; do not claim the test suite is green until a workflow run for the exact new HEAD completes.
- Reconfirmed high-priority source gaps: auth token currently assigns `tenantId: user.company_id`; auth lookup uses `LIMIT 1` for email-to-tenant resolution; storage resolver is not integrated into legacy tenant middleware and explicitly blocks local PostgreSQL mode; signup path still contains legacy dbMode/schema-clone logic; tenant operational Prisma migration history still declares MSSQL.
- No tenant operational migration, live database operation, real payment, deployment, or production data cleanup was performed.
- Resume next: verify CI for commit `62d56b43...`; complete the plans catalog -> public selector -> checkout -> invoice compatibility audit; then implement P0 identity mapping and storage lifecycle integration in isolated, tested changes. Preserve all safety gates and do not modify `main`.


## Chat preservation audit — 2026-11-25

- Re-reviewed the durable handoff, master architecture audit (33), owner decision register (34), implementation progress (28), and critical go-live findings (27) against the available prior-chat context.
- No additional explicit user decision or project instruction was found in the available prior-chat context that is absent from the repository handoff. Confirmed constraints retained: PostgreSQL only; Free/Trial in operational public; Paid tenants in UUID-derived schemas; client-hosted/offline PostgreSQL required; no hybrid sync; CSV plus relational multi-sheet XLSX for every module; never modify main; inspect older commits by actual diffs/callers; no production migration/payment/deployment or destructive cleanup without explicit approval; do not ask for more SQL before source work is complete.
- Owner decision register (34) remains the correct record for unresolved business choices: employee pricing/caps, explicit Free versus Trial transition, multiple legal companies per SaaS tenant, exact self-hosted/offline scope, backup destinations, and retention/erasure policy. No answer to these was found in the available prior-chat context; keep recommended defaults as recommendations, not as user-confirmed decisions.
- Repository comparison at this review: working branch is 395 commits ahead and 0 behind main (common base cd400a602eb255029c1daeeae1d35f0c7b7ee948). This supersedes the older 378-ahead count in the original audit snapshot. Main remains untouched.
- Test correction commit 62d56b43dec7d51f38863d10661fa1ca4428577d completed Backend Tests successfully in run 45639393408 (install, both Prisma client generations, backend tests all succeeded). Documentation handoff/progress commits followed; do not infer frontend build, database, staging, payment, storage restore, or browser E2E verification from this backend result.
- Old-chat deletion does not delete repository code, commits, GitHub issues, or these handoff documents. This repository handoff is the durable project record. The currently available prior-chat context has been incorporated; no additional project data is presently required from the old chat to continue source work.
- Continue from P0 identity mapping (distinct Central tenantId and operational companyId), authentication tenant selection/token storage, storage resolver integration and PostgreSQL provisioning/RLS/migration baseline. Preserve all production safety gates. Do not claim the whole project is complete or production-ready.


## 2026-11-25 — Frontend access-token storage hardening

- Fixed the P0 frontend finding recorded in Master Audit §15.2: access tokens are now held only in the in-memory Zustand state. The persisted `hrms-auth` payload excludes `accessToken`; persistence version 2 migrates older persisted state with a null token, and hydration removes the legacy standalone `localStorage.accessToken` key.
- Added the missing `updateToken` store action. API requests now read the token from in-memory Zustand state; successful refresh updates in-memory state and the Axios default header, while refresh failure clears the default header and logs out. Duplicate refresh-store update was removed.
- Commits: `b97f0e3`, `4d469bf`, `03eacbd`, `9d4ccac`.
- Exact latest code commit `9d4ccac81a2bdf6b385a1f604f57afcd5a3a1ef8`: Frontend Build **success** (run 45642181274); Backend Tests **success** (run 45642180225). The earlier intermediate commits also had green CI, but use the exact latest commit result above.
- Scope boundary: this is a source change plus CI build/test verification, not browser E2E or live session/refresh-cookie verification. Confirm login, reload, parallel 401 refresh, logout and tenant-domain routing in browser E2E before release.
- Next P0: implement the identity contract in a staged compatibility migration. First enumerate and migrate every operational caller from `req.user.tenantId` to `req.user.companyId`, and Central-platform callers to an explicit Central tenant claim. Do not flip the meaning of `tenantId` until all callers and tests are migrated; old access tokens must expire or be rejected/rotated safely. Then continue fail-closed storage resolver and public-schema isolation.
- Branch comparison after these commits: 401 ahead, 0 behind `main`; `main` remains untouched.


## 2026-11-25 — Tenant identity separation implementation

- Added an explicit identity normalizer for the two distinct identifiers: `companyId` is the tenant-database `companies.id` used by HR operational modules; `centralTenantId` / canonical `tenantId` is the Central DB `tenants.id` used by SaaS, billing, setup and tenant resolution.
- New access tokens now carry `companyId`, `centralTenantId`, and canonical `tenantId` separately. Login, OTP login, refresh and OTT token issuance were updated to pass the resolved Central tenant id; refresh resolves it from the authenticated central-user index when the request starts at the platform root.
- Auth middleware maps legacy tokens safely: old `tenantId` claims are treated as operational `companyId`; the Central tenant id is recovered from `central_user_index`. An unresolved legacy company id is never promoted to a Central tenant id.
- Added a fail-closed tenant-host/session mismatch check so a token cannot be rebound to another tenant by changing the request host.
- Migrated operational scoping from `req.user.tenantId` to `req.user.companyId` across audit, employees, leave, attendance, payroll, compliance, assets, expenses, performance, notifications, automation/KYC and dashboard handlers. Central platform consumers continue to use the canonical Central tenant id.
- Added six tenant-identity regression tests covering legacy token mapping, explicit new claims, host-rebinding prevention and unresolved legacy claims. The isolated identity-normalization cases were executed locally: 5 passed, 0 failed. Full backend CI and live browser/session tests remain pending; no database migration or production change was run.
- Middleware now fails closed when a tenant host cannot be matched to the authenticated Central tenant. Next gate: run the complete backend test workflow, add route-level cross-tenant tests, then audit the PostgreSQL tenant storage resolver and schema isolation before touching any live database.


## 2026-11-25 — Storage-routing cutover blockers found (do not enable yet)

- The new pure `tenantStorageResolver` is not yet wired into `shared/middleware/tenant.js`; runtime traffic still uses the older `resolveTenantDB` path. Therefore the storage lifecycle's `storage_tier/storage_status` gates are not currently enforced at runtime.
- `registerTenant` still provisions a `tenant_<subdomain>` schema for Cloud/External Cloud registrations, including the initial Trial plan, and does not persist the new storage lifecycle classification. This conflicts with the intended Free/Trial `public` policy and paid UUID-derived schema policy.
- The new resolver currently rejects `local` mode even though registration accepts customer-hosted PostgreSQL. Local PostgreSQL URL construction and its storage-tier policy must be completed before claiming self-hosted/offline support is ready.
- Do not switch new Trial tenants to shared `public` yet. First audit every operational query/model for mandatory `company_id` scoping (including child records and background jobs), settle the local-database allocation rule, apply the additive Central metadata migration only after backup/approval, classify existing tenants from an inventory, and test registration/login/refresh end to end. No production routing or database change was performed in this pass.


## 2026-11-25 — First-pass operational company-scope audit

- Reviewed the service-layer query patterns for Employees, Attendance, Leave, Payroll, Compliance, Assets, Expenses, Performance and Notifications after the controller migration. Their primary read/write paths generally scope records by `company_id` directly or through the employee relation using the supplied `companyId`.
- This is a positive first pass, not a complete shared-`public` safety sign-off. Child-table access paths, raw SQL, exports/imports, scheduled jobs, websocket/event handlers, background queues and every route still require a full cross-module audit before Trial tenants can safely share one schema.


- Legacy access tokens that cannot be mapped to a Central tenant now receive an authentication refresh response rather than being rebound to the request host; tenant-host mismatches with a resolved identity are rejected.


## 2026-11-25 — PostgreSQL routing integration and onboarding alignment

- Replaced the live tenant middleware's legacy cloud/local/hybrid routing with `resolveTenantStorageTarget`. Known tenant requests no longer fall back to a generic development database when the tenant record is missing, unclassified or not ready. Production routing no longer falls back to `DEV_TENANT_DATABASE_URL`.
- Authentication tenant DB lookup, refresh lookup, platform-admin notification configuration access and password-reset tenant DB lookup now use the same classified storage resolver.
- Customer-managed `local` and `external_cloud` modes now resolve only PostgreSQL and use a dedicated customer-owned database without a schema override. Local connection URL construction validates host, database, user and port; credentials are decrypted through the existing encryption utility.
- New registration now allocates managed-cloud Free/Trial tenants to `public`; customer-managed local/external tenants to their own dedicated database. It verifies connectivity and the presence of the required PostgreSQL `companies`, `roles` and `users` tables before writing the tenant record. New records remain `provisioning` and inactive until initial company/role/admin seeding succeeds, then become `ready` and active.
- Removed the registration path's legacy subdomain-based schema cloning and removed the old hybrid/fallback resolver behavior from the platform compatibility wrapper.
- Split `resolveCompanyId` (tenant operational DB) from `resolveCentralTenantId` (Central platform DB). Updated roles, settings, recruitment, training, reports, dashboard and platform settings routes to use the correct identifier. Platform payment header-based tenant selection is restricted to authenticated platform admins.
- Added tests for identity separation, customer-managed PostgreSQL URL construction, dedicated customer database routing and Free/Trial vs paid managed-cloud storage allocation. Tests are committed but not yet confirmed by a full CI run.
- Added read-only tenant storage classification preview SQL and documented the rollout gate. Existing tenants default to `legacy_unclassified` and must not be routed until their actual data location and row ownership are verified.
- **Remaining P0:** paid managed-cloud upgrade still needs a tested migration from shared `public` to UUID-derived schema with row/foreign-key ownership validation. Existing legacy tenants need individual inventory and migration. A fresh-database PostgreSQL installer/bootstrap package for customer-managed local/external deployments is also still pending. Do not activate this router in production until Central schema upgrade, classification, restore verification and CI pass.
- No production database migration, tenant data movement, production deployment or destructive operation was performed.


## 2026-11-25 — RLS context SQL hardening

- Replaced string-built `SET LOCAL app.current_tenant = '${tenantId}'` with parameterized `set_config('app.current_tenant', $1, true)` inside the same Prisma transaction. Platform-admin RLS context now uses the same transaction-local `set_config` pattern.
- Added unit coverage for parameter binding (including a hostile tenant-id string), missing-tenant rejection and platform-admin transaction scope. The tests are committed but CI execution is not yet confirmed.
- No RLS policy or production database was changed. Existing database-role/RLS policy verification remains a separate release gate.


## 2026-11-25 — Central KYC tenant isolation

- Added `tenant_id` ownership to the Central KYC Prisma model and a separate migration `20261125_central_kyc_tenant_isolation.sql`. The migration removes the global Aadhaar-hash uniqueness constraint in favor of tenant-scoped uniqueness and changes RLS to allow only the owning tenant or a platform admin.
- Updated KYC read/write/link functions to require Central `tenantId`, filter every lookup/update by `tenant_id`, and execute inside `withTenantRLS`. KYC routes, duplicate checks, employee onboarding checks and the background worker now propagate the authenticated Central tenant ID.
- Old KYC records remain `tenant_id = NULL` and are intentionally inaccessible to tenant users until ownership is independently verified. No Aadhaar-hash or task-ID guessing/backfill is permitted.
- Added a test that all KYC store APIs reject missing tenant identity. Full DB migration, live RLS tests and CI remain pending; no Central DB changes were executed.


## 2026-11-25 — Central registry RLS coverage

- Central tenant registry reads used by tenant-host resolution, login/OTP lookup, refresh, setup gating, platform registration, public branding/pricing lookups and platform-admin routes now execute inside `withPlatformAdminRLS` transactions. Tenant-specific KYC operations use `withTenantRLS` instead.
- This keeps Central `tenants`, `central_user_index`, branding, pricing and KYC reads/writes within an explicit transaction-local RLS context rather than depending on database-owner/service-role RLS bypass behavior.
- Full integration verification against the actual Supabase/PostgreSQL roles and RLS policies is still pending. No production DB roles, policies or data were modified.


## 2026-11-25 — Paid-plan storage safety gate

- Paid subscription order creation now refuses to create a new Razorpay order unless the tenant storage status is `ready` and the tenant has `dedicated_schema` or an eligible `dedicated_database` allocation.
- Payment verification repeats the same storage guard after confirming the gateway capture but before changing the tenant plan or entitlements. If the gateway captured payment while storage is not ready, the order remains unactivated and the response explicitly says not to pay again; the order can be retried after verified storage migration.
- Customer-managed local/external PostgreSQL databases may use dedicated-database storage; platform-managed dedicated database remains Enterprise-only. Paid managed-cloud tenants require a dedicated schema.
- This deliberately pauses paid upgrades from shared `public` until the data migration/provisioning workflow is built and verified. No payment or database action was executed.


## 2026-11-25 — Shared-tenant backup release gate

- Dedicated customer-managed PostgreSQL databases (and Enterprise managed-cloud dedicated databases) are now eligible for whole-database backups with no schema override. Managed-cloud shared `public` backups remain blocked until tenant-filtered backup/restore exists.

- The backup target resolver intentionally rejects shared `public` storage for tenant-specific backups. A whole-public-schema dump would include multiple tenants and must never be delivered as an individual customer's backup.
- Therefore managed-cloud Free/Trial tenant-level backup/restore is not production-ready yet. It requires a company_id-filtered relational export/restore or a separately controlled platform-wide encrypted backup with tenant-scoped restore. Do not weaken `getSafeBackupTarget` to permit a whole-public-schema tenant backup.
- This is a P0 release blocker alongside the paid shared-to-dedicated data migration and the fresh customer-managed PostgreSQL installer.

- Targeted isolated local logic harnesses passed 19 checks across storage configuration/resolution, RLS parameter binding, paid-storage activation guard and safe backup-target policy. These harnesses do not replace the repository's full `npm test`, Prisma generation, integration tests or GitHub Actions; those remain unverified.


## CI verification update — 2026-11-25

GitHub Actions `Backend Tests` completed successfully on branch `architecture/postgres-tenant-isolation` at commit `4d9c0b1f37ab056324dece124950ba1d4ac01926`. Prisma client generation passed. `npm test` reported 118 tests: 114 passed, 0 failed, 4 skipped (the skipped integration tests require external tenant-database configuration). This verifies the backend unit/test suite in GitHub Actions; it does not verify live PostgreSQL RLS behavior, production migrations, browser E2E, or deployment.

The CI failures were corrected: the KYC validation test now supplies a placeholder Central URL without connecting, storage-policy assertions match current error contracts, and the local-PostgreSQL resolver test uses the decryption dependency correctly. Central KYC employee linking now has an explicit nullable UUID column (no cross-database FK) and a dedicated migration; the route no longer silently reports a successful link when no row was updated.


## 2026-11-26 resumed P0 audit — identity contract and next execution gate

- Resumed from the current branch head after reading this handoff, the master architecture audit, owner decisions, identity helper, authentication middleware, auth token issuance, tenant resolver and identity tests.
- Verified branch at session start: `architecture/postgres-tenant-isolation`, head `fa14574e1e6329dfd29ad87dd0b070882c010c04`. Do not assume this remains latest after subsequent commits; re-fetch before each write/session.
- The current source contains `backend/shared/utils/tenantIdentity.js`, `backend/shared/utils/tenantResolver.js`, `backend/shared/middleware/auth.js`, `backend/modules/auth/auth.routes.js`, `backend/modules/auth/auth.service.js` and `backend/test/tenant-identity.test.js` implementing part of the identity split.
- Confirmed auth token issuance currently includes `companyId: user.company_id`, `centralTenantId`, and a compatibility `tenantId: centralTenantId`. Auth middleware maps these into `req.user.companyId`, `req.user.centralTenantId`, and `req.user.tenantId` (Central ID).
- Confirmed the repository still contains legacy operational callers that use `req.user.tenantId` as `companyId` (examples found on the common-base/default-branch code search include audit, leave, KYC, expenses, employees, attendance and notifications). This is an integration blocker: do not globally alias or swap `tenantId` until all Central-vs-operational callers have been enumerated on the working branch.
- The current helper's legacy-token fallback maps legacy `tenantId` to `companyId` and uses the authenticated `central_user_index.company_id` as the Central tenant ID. Preserve this compatibility only when the index row is tied to the authenticated user; do not use hostname/header values to rebind a token.
- Next P0 action: produce a working-branch caller inventory for every `req.user.tenantId`, `req.user.companyId`, `req.user.centralTenantId`, `req.tenant.id`, `resolveTenantId`, `resolveCompanyId`, and `resolveCentralTenantId` reference. Classify each by target database/table, change it to the explicit resolver, and add regression tests for cross-tenant and legacy-token behavior.
- Do not claim P0 identity is complete based only on helper unit tests. Required exit: no ambiguous tenant identifier at operational or Central query boundaries; old tokens either resolve safely through authenticated central index or fail closed with a re-login path; platform-admin selected-tenant behavior remains explicit.
- No executable code, database, deployment, production migration or payment was changed/performed in this documentation-only resumed audit.
- Estimates for planning only: P0 8–15 focused working days (about 12–20 substantial coding sessions); P1 10–18 working days (about 15–25 sessions); integrated regression and handoff 2–4 days (3–5 sessions). Re-estimate after the caller inventory and PostgreSQL migration-baseline audit. Estimates assume one capable AI coding agent and prompt repository access; schema/legacy data surprises can extend them.
- New execution map and next-model prompt: `HRMS_Blueprint/35_P0_P1_EXECUTION_ROADMAP_AND_P2_HANDOFF_PROMPT.md`.


## 2026-11-26 P0 implementation increment — explicit Central tenant resolution

- Working branch remained `architecture/postgres-tenant-isolation`; code head after this increment: `1e32d1b2376c83a8a523af77ced2462711142a5e`. Re-fetch before the next change.
- Changed `backend/shared/utils/tenantResolver.js`: ordinary users now resolve Central tenant only from authenticated `req.user.centralTenantId`. The resolver no longer falls back to request-host `req.tenant.id` or ambiguous `req.user.tenantId`. Platform admins may use only the explicitly resolved selected tenant in `req.tenant.id`.
- Changed both KYC route implementations, `backend/modules/automation/automation.routes.js` and `backend/modules/automation/kyc/kyc.routes.js`, to call `resolveCentralTenantId(req)` for Central KYC lookups/writes rather than `req.user.centralTenantId || req.user.tenantId`.
- Changed `backend/modules/platform/payment.controller.js` to use the shared Central tenant resolver for ordinary users; only platform admins may resolve an alternate tenant via selected tenant context or admin-only subdomain selector. Removed the ordinary-user fallback to ambiguous `tenantId` and arbitrary `req.tenant.id`.
- Added identity regression tests asserting ordinary users cannot derive Central tenant identity from request-host context and platform admins require an explicit selected tenant.
- Source inventory spot-check: operational controllers in assets, attendance, audit, compliance, employees, expenses, leave, notifications, payroll, performance, recruitment, reports, roles, settings and training use `req.user.companyId` or `resolveCompanyId(req)` in the inspected routes/controllers. Subscription routes use `resolveCentralTenantId(req)`. KYC was an identified remaining ambiguous fallback and has now been corrected in both route implementations.
- This was a targeted source scan, not yet a mathematically exhaustive audit of every JS/TS call site, background job, WebSocket, frontend store, raw SQL query or dynamic service call. Continue the full repository-wide inventory before declaring identity P0 complete.
- CI evidence: Backend Tests run #667 succeeded for commit `b3fa08e04bc59ddb5b90433429702994ab26d891` (before the subsequent billing resolver change). Tenant Migration PostgreSQL Integration run #16 was in progress for exact head `1e32d1b2376c83a8a523af77ced2462711142a5e` at the time of this entry. No local full-suite run was performed in this environment; do not claim the latest code has passed tests until exact-head CI completes.
- No database migration, production data operation, deployment or live payment was performed.
- Next: inspect exact-head CI; run/re-run backend suite on exact head if not triggered; finish full identity call-site inventory (including jobs, WebSockets, exports, frontend auth state and Central DB access); then proceed to the single-resolver/live-routing audit.


## 2026-11-26 P0 follow-up — CI evidence and signup routing inspection

- Latest source-code commit in this increment: `1e32d1b2376c83a8a523af77ced2462711142a5e`. Backend Tests workflow run #668 completed successfully for this exact source commit: https://github.com/Krinki-dev/HRMS/actions/runs/45721817132.
- Tenant Migration PostgreSQL Integration run #16 for the same code commit was still in progress at the time of the check; no result is claimed.
- Documentation-only follow-up commits advanced the branch head to `4cd83eff7f8f215fa0c4aa01971ebb154953c1bb`. Rechecked compare against protected main: branch is 698 commits ahead and 0 behind; main remains untouched. These are Git history counts, not completion metrics.
- Inspected `backend/modules/platform/platform.service.js` registration path. Managed-cloud registrations currently build a storage descriptor using a hard-coded Trial plan; the Central tenant row is inserted with Free and then updated to Trial with a 90-day expiry for managed cloud (14 days for customer-managed modes). This is an unresolved product behavior already called out in owner decisions; do not change without owner confirmation.
- For managed-cloud Trial, the storage descriptor points to shared `public`; customer-managed `local`/`external_cloud` use dedicated database mode. Registration checks for existing `public.companies`, `public.roles`, and `public.users` before insertion, then seeds a new operational company/role/admin. It sets `schemaProvisioned = true` after that connectivity/schema check; this is not equivalent to a durable provisioning state machine or a full migration/seed verification workflow.
- Remaining P0 signup blockers: hard-coded Free→Trial behavior needs owner decision; provisioning is synchronous and lacks durable retry/compensation; schema initialization depends on preinstalled tables; paid upgrade promotion and public→UUID-schema data migration are not implemented; company/tenant membership and duplicate retry behavior need further review.
- Next engineering task: continue P0 storage lifecycle audit across signup, request routing, auth lookup, platform admin and background jobs; then design the durable idempotent provisioning state machine without altering production data. Do not mark a tenant ready merely because the database connection succeeds.


## 2026-11-26 verification update — P0 identity code increment

- Exact code commit `1e32d1b2376c83a8a523af77ced2462711142a5e` passed Backend Tests workflow #668: `success` (https://github.com/Krinki-dev/HRMS/actions/runs/45721817132).
- The same exact code commit passed Tenant Migration PostgreSQL Integration workflow #16: `success` (https://github.com/Krinki-dev/HRMS/actions/runs/45721817039).
- Both workflows ran against the source commit containing the Central tenant resolver hardening, KYC route changes, billing tenant resolver change and identity regression tests. Subsequent commits through `64837385466a550995c3e0af1ddc93623023aa1a` changed documentation only; no executable source changed after the tested code commit in this increment.
- The latest branch head at this documentation update is `64837385466a550995c3e0af1ddc93623023aa1a`. Recheck before future edits.
- These CI results verify the configured automated backend suite and disposable PostgreSQL integration workflow only. They do not prove production DB migration state, real customer data isolation, staging deployment, real Razorpay, MinIO/ClamAV production readiness, backup restore for live tenants, or browser E2E.
- Identity hardening increment is source-implemented and CI-verified; the overall P0 identity audit remains open pending exhaustive caller inventory and end-to-end multi-company/company membership tests.


## 2026-11-26 launch-focused P0 increment — tenant routing and identity defects

- Found and fixed a live request-path defect: `tenantMiddleware` invoked `extractTenantSubdomain(req)` but the function was not defined/imported. Added a guarded resolver for explicit tenant headers, `*.syntern.in` and `*.localhost`; platform roots, preview hosts and arbitrary custom domains are not misclassified. Custom domains remain matched through Central tenant records.
- Added `backend/test/tenant-domain-routing.test.js` covering managed subdomains, local development, validated headers and non-tenant hosts. The first test run exposed that `isPreviewHost` existed but was not exported; exported the shared helper. Backend Tests passed for the subsequent fix commit `abca0e628f9c34cef5d4245e7b8c5b5a4299e695` (run #45725656437). The PostgreSQL integration run for that commit was still running when recorded.
- Removed the remaining ambiguous `req.user.centralTenantId || req.user.tenantId` fallback from the employee Aadhaar/KYC endpoint. It now requires explicit `centralTenantId` and returns 401 when unavailable.
- Found a legacy KYC queue path that omitted `centralTenantId` even though the worker requires it. Added the explicit Central tenant ID to its queued payload.
- Latest source commit at this entry: `6c9e54c3636097de2d0c0267be0dba2307f34d2c`. Backend and PostgreSQL integration CI for this exact commit were still in progress; do not mark the full increment CI-verified until both complete.
- Identity call-site spot-check across audit, leave, assets, payroll, expenses, automation, employees, compliance, attendance, notifications and performance found operational scoping uses `req.user.companyId`; the one remaining ambiguous Central-tenant fallback in `employees.extended.controller.js` was corrected. This is still not a complete scan of every worker, raw SQL, WebSocket or frontend call site.
- No production DB migration, deployment, live payment or destructive operation was performed. Continue launch-focused P0 work: finish identity/storage routing verification, then close the highest-risk signup/provisioning retry path. Defer non-blocking polish and advanced features.


## 2026-11-26 additional identity cleanup — auth profile and setup guard

- A further search for optional-chaining variants found two additional ambiguous Central-tenant fallbacks: `auth.routes.js /me` and `requireSetupComplete.js`. Both now use only the explicit selected `req.tenant.id` or authenticated `req.user.centralTenantId`; the legacy `req.user.tenantId` alias is no longer used as a Central identity fallback in these paths.
- The routing/KYC code increment through `6c9e54c3636097de2d0c0267be0dba2307f34d2c` passed Backend Tests and Tenant Migration PostgreSQL Integration CI (both success). The two latest auth/setup-guard changes are later source commits and must be rechecked on their own exact CI head before marking this cleanup verified.
- Continue to distinguish the backend suite from production readiness: no live database migration, tenant-data isolation exercise against real customer data, deployment, backup restore drill or browser E2E has been performed.


## 2026-11-26 exact-head CI verification — identity and routing fixes

- Exact source commit `923a0f2dfa7cb8d134161fe05c500c2855c4e5ff` passed Backend Tests: https://github.com/Krinki-dev/HRMS/actions/runs/45725846263 (success).
- The same exact source commit passed Tenant Migration PostgreSQL Integration: https://github.com/Krinki-dev/HRMS/actions/runs/45725846261 (success).
- This exact source commit includes the missing tenant-subdomain resolver and its tests, preview-host utility export, explicit Central tenant identity in the legacy KYC queue payload, and removal of ambiguous `req.user.tenantId` fallbacks from Aadhaar/KYC, `/auth/me` and the setup-completion guard.
- Subsequent commits through `7818d26de74a670947241aa22e30d2f0d8f90450` are documentation-only. The latest branch head must still be rechecked before any future write.
- Scope of verification remains limited to configured automated backend tests and the disposable PostgreSQL integration workflow. Production DB state, live tenant isolation, browser E2E, deployment, backup restore and live integrations remain unverified.


## 2026-11-26 P0 follow-up — signup readiness, OTP entropy and error disclosure

- Working branch: `architecture/postgres-tenant-isolation`. Latest code commit in this increment: `46bd6f4c2f6b3d5d270c68426f302c1aec59b771`; regression-test commit: `0f21d24ddf9f9555e8e6711146174ebdef05c311`. Re-fetch branch head before any further write.
- Signup now creates the Central `central_user_index` row inactive. Only after operational company/role/admin seeding succeeds does one Central transaction mark the tenant active/ready and activate its matching login-index row. This closes the window where an incomplete workspace is indexed as login-eligible.
- Email, phone, employee-ID, admin-email fallback and direct email-to-tenant resolution now require the tenant itself to be active, storage-ready and not deleted. This prevents stale/incomplete Central index rows from being treated as valid login destinations.
- OTP generation in `auth.service.js` now uses Node's cryptographic `crypto.randomInt` rather than `Math.random`.
- Signup database preflight errors are logged server-side with the underlying error and return a stable generic error code/message to the browser; raw connection details are no longer interpolated into the API response.
- Added `backend/test/auth-provisioning-readiness.test.js` covering active/ready lookup filters, delayed index activation, cryptographic OTP generation and non-disclosure of raw DB errors.
- Important limitation still open: a failed provisioning attempt can leave an inactive Central tenant row that blocks a fresh registration using the same email/subdomain. This increment prevents login/index activation of that incomplete tenant but does NOT yet implement a safe resumable provisioning state machine or automatic compensation. Do not delete orphan records blindly; inspect FK/unique constraints and add explicit resume/retry semantics in a separate increment.
- CI: Backend Tests succeeded for commit `3f43f512c4337c48b64668a8c083bff3e1553226` (run #702), which included the login gating, delayed index activation and secure OTP changes. The later generic DB-error response/test commits are newer; exact-head Backend Tests and Tenant Migration PostgreSQL Integration for the latest code are not yet confirmed. Do not claim exact-head CI pass until both workflows complete.
- No production database change, deployment, real payment or destructive cleanup was performed.
- Next P0 tasks: (1) inspect safe retry/resume design for incomplete signups; (2) verify signup preflight against the full minimum launch schema, not only three table names; (3) continue identity/storage resolver inventory across jobs, raw SQL and WebSockets; (4) close core login → company creation → employee CRUD smoke path. Do not start P2 before P0/P1 exit criteria pass.


## 2026-11-26 P0 addendum — minimum launch schema preflight

- Extended signup's PostgreSQL preflight beyond the original three-table check. Registration now verifies the presence of 12 launch-critical tables: companies, roles, users, employees, departments, designations, attendance, leave_types, leave_balances, leave_applications, otp_store and audit_logs. An incomplete schema is rejected before any Central tenant/index rows are created.
- Missing table names are logged server-side for diagnosis; the API returns a stable `TENANT_SCHEMA_NOT_INSTALLED` error without exposing database internals.
- Added regression assertions for the required launch table set and rejection path in `backend/test/auth-provisioning-readiness.test.js`.
- Latest source commit: `461b58b05741a6aa1e9ad22c5f270d98af094aa2`; latest test commit: `08180f99e0cfca6a5f83cf3b272d8d894b7b79c5`. Latest branch head will move as progress docs are updated.
- Backend Tests and Tenant Migration PostgreSQL Integration were triggered for source commit `461b58b05741a6aa1e9ad22c5f270d98af094aa2` and were still running at the time of this note. A previous backend run on head `2437cfaa45f61719748a8ef8bb4c1274756e8c3c` passed; that does not verify this newer schema-preflight change. Recheck exact-head workflow results.
- The preflight is a minimum table-presence check, not a full migration-version/column/index/constraint compatibility proof. A proper schema version marker and migration gate remain a follow-up; do not call this complete migration validation.


## 2026-11-26 P0 follow-up — atomic tenant seed and registration data integrity

- Tenant operational bootstrap now creates the initial company, Super Admin role and admin user inside one PostgreSQL transaction. If any one insert fails, PostgreSQL rolls back all three; retry/support recovery will not inherit a half-seeded company/role/user set from this attempt.
- Corrected the role permission insert to match the operational Prisma schema: `roles.permissions` is a Prisma `String` (PostgreSQL text), so registration now writes the serialized permission string directly rather than casting it to JSONB. The prior cast could make signup fail against the declared schema type.
- If operational seeding fails, the Central tenant is kept inactive, `storage_status` is changed from `provisioning` to `failed`, and `storage_error_code` is set to `TENANT_SEED_FAILED`. The API returns `TENANT_PROVISIONING_FAILED`; detailed errors remain in server logs. If recording the failed state itself fails, that secondary failure is logged.
- GSTIN and PAN are now persisted using the same trimmed uppercase values used for validation and duplicate checks, in both Central tenant metadata and the operational company row. This prevents casing/whitespace variants from bypassing consistent duplicate detection.
- Regression tests cover atomic seed transaction, the permissions text type, failed lifecycle state, and normalized GSTIN/PAN persistence.
- Source commits: atomic seed/type fix `8c4f43832ab090253bf0d9ae2495240e20b57778`; failed lifecycle state `e0e576a0e3d943a7055a82a5677ed35e444d7d70`; GSTIN/PAN normalization `38f70a39233ae3934827799cdb342738560919ba`. Latest test commit: `14820999cafb719c9ab3bd0d02d586f731b7884d`.
- CI verified: Backend Tests and Tenant Migration PostgreSQL Integration both passed at `045bfa37842d086b6e12a2f6f6f081b2c88c9a28); both passed again at `0ff9c2987d6cc39c0a6e4e53bc1a4a98637cb214` (includes failed-state handling). The latest GSTIN/PAN normalization test commit `14820999cafb719c9ab3bd0d02d586f731b7884d` had Backend Tests and Tenant Migration PostgreSQL Integration running when this note was written. Recheck those exact-head runs before marking the increment fully verified.
- Safe self-service retry/resume is still NOT implemented. Failed/incomplete registrations remain blocked from login and can still block reuse of their email/subdomain until a safe recovery flow is implemented. No automatic deletion or unsafe compensation was introduced.
- No production DB changes, deployments, or live payments were performed.
- Next P0: design a concurrency-safe resume/retry path for `failed` provisioning records using the existing inactive Central tenant/index IDs and the stored database target, with explicit credential/configuration matching and an atomic claim/lease. Do not simply bypass the existing email/subdomain uniqueness checks. Also continue the launch login → company → employee smoke path and verify the external-database network-egress security boundary.


## 2026-11-26 P0/P1 follow-up — DNS-safe tenant domain validation

- Added `backend/shared/utils/domainValidation.js` and wired registration to normalize/validate tenant subdomains and optional custom domains before Central DB writes.
- Tenant subdomains now enforce the DNS label length limit (1–63), lowercase normalization, alphanumeric first/last characters, and internal hyphens only.
- Custom hostnames now enforce 1–63 characters per label, at least two labels, lowercase normalization, and the DNS hostname total-length ceiling of 253 characters.
- Added focused tests in `backend/test/domain-validation.test.js` for valid, normalized, overlength, leading/trailing-hyphen and malformed values.
- Latest code commits: GSTIN/PAN normalization `38f70a39233ae3934827799cdb342738560919ba`; domain validation helper `2eebe93cb872c5d5faa436004da2b1df80884d96`; registration integration `47497c791719dea6c9d2b261b97e1ec9a8bb16f0`. Latest domain-validation test commit: `1d270ee54a9e6601814d06f9aae42ed0a1b21e40`.
- Verified CI before this latest domain-validation increment: Backend Tests and Tenant Migration PostgreSQL Integration passed for `14820999cafb719c9ab3bd0d02d586f731b7884d`. Exact-head Backend Tests and PostgreSQL integration for `1d270ee54a9e6601814d06f9aae42ed0a1b21e40` were running when this note was written.
- Security follow-up still required before accepting customer-supplied PostgreSQL endpoints in production: the application currently accepts customer-provided host/connection details and connects from the server. URL scheme validation alone is not a complete SSRF/network-boundary control. Production deployment must enforce outbound network policy blocking loopback, link-local, cloud metadata and private infrastructure ranges (with an explicit approved customer-connectivity mechanism); implement/verify DNS/IP controls without relying on a vulnerable one-time hostname check. Do not claim customer-managed DB mode production-safe until this is verified.
- No production database changes or deployments were performed.

## Latest continuation handoff — 2026-11-26

- Added Central tenant provisioning lease schema foundation: migration `backend/db-migrations/20261126_tenant_provisioning_leases.sql`; Prisma and fresh-install schema fields: `storage_lease_token`, `storage_lease_expires_at`, `provisioning_attempts`; static test: `backend/test/tenant-provisioning-lease-schema.test.js`.
- Latest test-source commit: `14867ea8bc01d6771d788bf1d98702a972f47efc` (initial test commit `4133d6c6f5e83b7e831a3e5f5202884bf8e49c43`). No CI checks were visible for this commit at handoff; do not mark verified. No DB migration was run.
- Critical: lease fields are groundwork only. Registration does not yet use them. Next implement token-guarded atomic lease claim/reclaim, strict matching of existing tenant/admin identity and DB configuration, detection of already-committed operational seed, token-guarded final activation, and concurrency/crash-window tests. Keep production migration blocked until implementation and verification are complete.
- Continue only on `architecture/postgres-tenant-isolation`; do not modify `main`.


## Latest continuation handoff — 2026-11-27

- Branch head before this increment was 0d8c0e3966002fe555af9648d718a526b28bf580; Backend Tests and Tenant Migration PostgreSQL Integration both passed at that exact head (runs 45753835869 and 45753835839).
- Initial registration now owns a 30-minute provisioning lease; seed failure and final activation are guarded by the exact lease token. Admin-index activation is checked in the same Central transaction as tenant activation.
- Implementation commit: 8aebab5bc4e8eb6b6e466064fea058adf5380d66; regression tests commit: 43ca254d928d2e75aabb5473a0d57d29a7695735.
- CI must be rechecked for the latest test/docs commit before claiming this increment passes. The migration is still unapplied. No production database or main changes.
- Remaining: design a safe ownership-proof flow for retry; claim expired/failed tenant atomically; reuse exact Central IDs only after matching tenant/admin identity and DB configuration; detect already committed operational seed and reuse it without changing passwords; add crash/concurrency integration tests. Do not expose retry to unauthenticated public callers until email ownership is proven.


## Latest continuation handoff — 2026-11-27 (security gate + payment regression)

- Latest branch head at start of this increment was e6f727440f7e2d81c9808472b7993bc38efc3d12; both Backend Tests and Tenant Migration PostgreSQL Integration passed at that exact head.
- Customer-managed PostgreSQL registration (local/external_cloud) is now disabled by default. It returns CUSTOMER_DATABASE_CONNECTIONS_DISABLED unless CUSTOMER_DATABASE_CONNECTIONS_ENABLED=true. Do not enable until outbound network policy is independently verified; application flag alone does not prevent SSRF/DNS rebinding. Managed-cloud signup remains enabled.
- Added tests for strict opt-in and public signup gate. Commits: 6fd45c2b6cc1428aa1acf33aaa46ed951dbbd2f0, 7db722cbe54b888dff4f24e5c21a9823fef59eb8, 83a51e37d53d9a2cd2d2858cd5b745bae46410a2, a78f656211ce71ed654e9a315d78344c4c928745.
- Re-verified current Razorpay verifyPayment rejects client mock mode before signature verification or ledger mutation; added a regression test and corrected the stale P0 audit note. Commits: 2cf1b45cd2a3a5e6d7f59c5da2e2a321002b2471, da41e250c1cfbc20e01c4075f0b1998a51171a1a.
- Progress docs commit 013dbaf25277056dccdf74ae99bfd2c91fe33a10; backup guide commit 5844f08a5f4edf1319550ef0d4a9105ae05713df; final audit/progress docs commit 284617476dac0c3482d7de8f149ebeab41e61781.
- CI was green through commit 013dbaf25277056dccdf74ae99bfd2c91fe33a10 (Backend Tests run 46019981940; PostgreSQL integration run 46019981623). Latest payment test/docs commits have runs pending; recheck before claiming final green.
- No production DB migrations, deployment, live payment actions or changes to main.


## 2026-11-27 continuation — auth metadata lifecycle guard

- Verified branch head before editing: 0567761db8e194af81c932d05cbe5d12c9bf1a7d; latest Backend Tests and Tenant Migration PostgreSQL Integration were both successful on that exact SHA. main remained cd400a602eb255029c1daeeae1d35f0c7b7ee948 and was not modified.
- Found a defensive lifecycle gap in authService.getTenantInfo(): unlike the main auth lookup, it did not require the tenant to be active and storage-ready. Added both predicates and retained the non-deleted condition.
- Added a source regression test covering active + ready + non-deleted metadata lookup.
- Code commit: 1eddcec53390bd14ed92f2d6fc749f4bafc89403; test commit: 6d5b7ca9e473ca0045d4fa8bc75755c83e9b2c9e; progress-document commit: 145a3e959dbbf3a129a7911f918965fdbbde8954.
- CI for these new commits is pending verification. No DB, migration, deployment or payment action was taken. main remains untouched.
- Next: verify exact-head CI; then prioritize registration recovery design only after email ownership proof and retry idempotency are established. In parallel, review RLS database-role bypass and auth-to-company/employee smoke path. Do not expose a public retry endpoint or enable customer-managed DB connections without verified egress policy.


---

## LATEST CONTINUITY OVERRIDE — 2026-11-27

**Mandatory first read:** `HRMS_Blueprint/35_MASTER_PROJECT_EXECUTION_AND_CONTINUITY_PLAN.md`.

The user has explicitly adopted a full-product, document-driven continuous improvement cycle:
`Full audit → Gap register → Improvement plan → Plan verification → Implementation → Tests → Full re-analysis → Next cycle`.

- Audit all product modules and six streams; do not focus indefinitely on one subsystem.
- Balance implementation by dependencies, customer impact and risk. P0 safety work remains mandatory, but core HR and product modules must not be neglected.
- No implementation batch starts until its plan, dependencies and acceptance criteria are verified.
- After implementation, re-analyze the whole codebase and update the tracker/gap register.
- Every task needs a stable ID, evidence, scope, numbered steps, acceptance criteria, tests, safety/rollback notes and commit/test results.
- New chat/device/model recovery: read master plan first, then this handoff, index, frozen decisions, owner decisions, latest architecture audit, progress log, active cycle plan/verification/report and module tracker. Verify current branch SHA and CI before claiming status.
- Do not rely on chat history; repository documents are the continuity source of truth.
- First full fresh audit and verified Cycle 01 plan are still pending. Do not claim they are complete.
- Master plan commit: `93ca847d95e3f74e681795ceb22d69f123c9f413`.
- Pre-documentation code head: `005d34d3d060e66d73ab12163866a0111d9e277b`. Pre-documentation CI runs #46020780777 and #46020780783 passed on that SHA only. Re-check after documentation commit/current head.
- `main` remains untouched. Production migrations/deployment, live payments and destructive/customer-data actions remain approval-gated.


## DOCUMENT-DRIVEN CONTINUITY SETUP — 2026-11-27

The project now has these governance records on the working branch:
- `HRMS_Blueprint/35_MASTER_PROJECT_EXECUTION_AND_CONTINUITY_PLAN.md` — mandatory full-product cycle and new-chat recovery protocol.
- `HRMS_Blueprint/36_MASTER_MODULE_COMPLETION_TRACKER.md` — complete module/dimension tracker; all dimensions intentionally start Not Assessed pending fresh audit.
- `HRMS_Blueprint/37_MASTER_GAP_AND_RISK_REGISTER.md` — initial inherited risks to revalidate; not automatically confirmed current.
- `HRMS_Blueprint/00_INDEX.md` — updated navigation.

Documentation commits created in this session:
- Master plan: `93ca847d95e3f74e681795ceb22d69f123c9f413`
- Handoff update: `2fbccd2d77ae2cca7222a5047d82eb4216ca535e`
- Initial module tracker: `bd988fbdfe446d6cd64f5d2e69c0e06af7352d8d`
- Initial gap register: `81c367894b5c1f1716d01d3cd15ef484afb0acf9`
- Index update: `c9b8b2cfd967a984c523cc9b93c38744834f3110`

Latest CI runs were triggered for these documentation commits and were still in progress at handoff time:
- Backend Tests run `46023109646` for tracker commit `bd988f...`
- Backend Tests run `46023115991` for gap register commit `81c367...`
- Tenant Migration Integration run `46023109809` for tracker commit `bd988f...`
- Tenant Migration Integration run `46023116077` for gap register commit `81c367...`
Do not report these as passed until their final conclusions are fetched. Also check CI for latest index/handoff head.

**Next exact action:** start Cycle 01 fresh full source inventory and module audit under Section 13 of the master plan. Do not implement feature changes until Cycle 01 plan is complete and plan verification passes. No production operations are authorized.


---

## LATEST AUTHORITATIVE OVERRIDE — 2026-11-27 (Cycle 01 audit started)

This block supersedes older branch/CI statements above where they conflict.

- Latest verified source baseline at audit start: 6625b93733e726140c44ff633cef351abd3d4d9d on architecture/postgres-tenant-isolation.
- Exact-head GitHub checks on that SHA: Backend Tests run 46023203389 = success; Tenant Migration PostgreSQL Integration run 46023203475 = success.
- Do not overstate these checks: current workflows do not run a frontend build/browser E2E. The PostgreSQL integration workflow runs only the tenant migration inventory classifier test against synthetic schemas. Several RLS/auth/payroll DB integration tests skip unless explicit DB URLs are configured.
- Cycle 01 Phase 1 source audit is recorded at HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-1.md. It is partial; no module completion is claimed.
- New findings GAP-0015 through GAP-0019 are recorded in 37_MASTER_GAP_AND_RISK_REGISTER.md:
  - Tenant-domain HR pages call legacy /hr APIs not mounted by backend/server.js.
  - Tenant HR sidebar paths do not match active App.jsx routes.
  - ESS nested absolute route paths require React Router runtime verification.
  - Attendance approval/rejection endpoints lack explicit permission checks; rejectRegularization update omits company_id.
  - CI lacks frontend build/browser E2E and does not execute all optional DB integration tests.
- GAP-0003 (legacy Prisma migration history) is confirmed: backend/prisma/migrations     11223/migration_lock.toml declares provider = mssql. Never run this migration history against PostgreSQL.
- Explicit positive source facts: tenantResolver.js separates companyId from centralTenantId; tenantStorageResolver.js rejects unclassified/not-ready storage; Central RLS helper uses one transaction for context + protected query. All callers/table coverage and DB role assumptions still need audit.
- Latest docs commits after audit report: d327c6b (audit report), 228091f (gap register), 1341006 (tracker activity), 5c3b006 (index). Re-fetch actual branch head and CI before next work; these are documentation commits only.
- Immediate next task: continue the full Cycle 01 route → controller → service → Prisma → tests audit for every module, plus Central provisioning/billing, RLS/table ownership, imports/files, backup/restore and operations. Only after that draft and independently verify CYCLE-01-PLAN.md. Do not start application implementation before plan verification.
- No production migrations, deployment, real payments, destructive customer-data changes or credential changes were performed.


## CYCLE 01 PHASE 2 UPDATE — 2026-11-27

- Focused source audit Phase 2 is recorded in HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-2.md at source SHA 341704d3192d6d8ddd4391bad9b8a2967b75672e.
- GAP-0020 (P0 candidate): notifications.service.js pushToCompany(companyId, payload) ignores companyId and broadcasts to every registered WebSocket connection. server.js registers sockets with userId only. This creates a cross-company notification disclosure risk. Require company-bound socket identity and cross-company broadcast tests.
- GAP-0021 (P0 candidate): subscription.routes.js registers paymentController.handleWebhook, but payment.controller.js does not export handleWebhook. server.js requires this route module directly. Run a deterministic backend boot/route-registration smoke test before assuming the server starts.
- Positive controls confirmed in platform.service.js / tenantDeletion.service.js / backupService.js: customer-managed PostgreSQL registration is gated while outbound-network controls are unverified; new tenant activation checks the original provisioning lease token and expiry; physical deletion fails closed pending restore validation; shared/legacy tenant backup targets are refused.
- Gap register now contains GAP-0015 through GAP-0021. Tracker and index link Phase 1 and Phase 2 audit evidence.
- Latest docs commits include d357df7 (Phase 2 report), f3a3164 (gap register), db4cbdd (index), eda010f (tracker). Verify current branch head and CI again before future status claims.
- Next: continue module-by-module source tracing and validate the two P0 candidates with safe test harnesses. Do not start application implementation until the full audit, Cycle 01 plan and independent plan verification are complete.


## CYCLE 01 PHASE 3 UPDATE — 2026-11-27

- Focused Leave + Recruitment source audit is recorded in HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-3.md at source SHA 181a4ee3fee3cc581d5cd59b6c52bfe16b026fe0.
- GAP-0022: Leave GET / lists company-wide leave applications without leave.view permission; the service filters by company but not caller employee.
- GAP-0023: Leave balances controller calls the service without req.db (signature mismatch) and accepts req.query.employeeId without a permission gate. Fix must separate self-service from HR cross-employee lookup.
- GAP-0024: Recruitment interview feedback and accept/decline offer paths lack full company ownership checks; feedback also does not verify interviewer assignment.
- Static route scan across Leave, Compliance, Recruitment, Performance, Training, Assets, Expenses, Reports, Roles, Settings and Notifications shows a mixture of explicit module permission routes and auth-only self-service routes. These modules are not security-cleared until each service method is traced for company/actor ownership.
- Latest phase 3 docs commits: 5df85f2 (audit), 3c202a6 (gap register), 27f4074 (index), c8ce486 (tracker). Re-fetch actual branch head and CI before status claims.
- Next: continue service-level and data-model audit for Performance, Training, Assets, Expenses, Compliance, Payroll, Reports, Settings and Notifications; then complete tenant/RLS, billing, file/import/export and operations audits. Cycle 01 plan remains not yet written or verified.


## CYCLE 01 PHASE 4 UPDATE — 2026-11-27

- Focused Performance/Training/Assets/Expense upload audit is recorded in HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-4.md at source SHA 8caa1cfaf153563a22269f6a3bca11fb60e5ef3b.
- GAP-0025: Performance close-cycle, approve-goal and finalize-appraisal mutations do not consistently enforce company ownership.
- GAP-0026: Training service operations accept companyId but several methods ignore it for deletion, nominations, attendance and feedback.
- GAP-0027: Asset allocation does not validate employee company; return and by-employee lookup omit company scoping.
- GAP-0028: Expense receipt upload uses unbounded Multer memory storage, has no content filter, and bypasses the available ClamAV scanner.
- The above are source-level findings; no application fixes or live uploads were performed.
- Latest phase 4 docs commits: d730105 (audit), dcc9ca1 (gap register), 54ab40e (index), de65788 (tracker). Re-fetch branch head/CI before making status claims.
- Next audit targets: Payroll, Compliance, Notifications, Settings, Central tenancy/RLS, billing, company documents, CSV/XLSX, backup/restore and operations. Cycle 01 plan remains pending.


## CYCLE 01 PHASE 5 UPDATE — 2026-11-27

- Payroll/Compliance source audit is recorded in HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-5.md at source SHA e008b95f718a17458152428535bde74ae5cd2d84.
- GAP-0029: Payroll controller calls for getPayslip, updatePayslip and removeBonus omit req.db and do not match the service signatures; those endpoints are expected to fail. Correcting signatures must also enforce company/run/bonus ownership.
- Positive observations: payroll run processing/locking/publishing/deletion generally verify companyId; self-service payslips bind to req.user.employeeId and published state; Compliance administrative routes are permission-gated and TDS declarations bind to the authenticated employee.
- Latest Phase 5 docs commits: bce71fa (audit), e624b73 (gap register), 07c9173 (index), 75fb869 (tracker). Verify actual branch head/CI before status claims.
- Next: complete Settings/Notifications/Reports service checks; inspect full Central tenant lifecycle, billing webhook, RLS policies and table ownership, file/document storage, import/export, backup/restore and deployment operations. No Cycle 01 implementation plan yet.


## AUDIT CORRECTION — FRONTEND BUILD WORKFLOW

- Correction to the earlier Phase 1 statement: .github/workflows/frontend-build.yml exists. It runs npm ci and npm run build in frontend on frontend/** changes to main or architecture/postgres-tenant-isolation. The earlier audit scan missed this workflow.
- Correct current CI finding: frontend production build is covered by its own path-triggered workflow; browser-based E2E is not present. The Backend Tests workflow still does not configure the optional RLS/auth/payroll/compliance PostgreSQL test URLs, so those tests skip there.
- Phase 1 report, GAP-0019 and tracker wording were corrected in commits 014e9d7, 3a52be1 and 53a054a. The correction supersedes earlier wording.


## CYCLE 01 PHASE 6 UPDATE — 2026-11-27

- PostgreSQL RLS/table-isolation audit is recorded in HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-6.md at source SHA 8b99f8a40311d81f5e200700562effb06ced0255.
- GAP-0030 (P0): inspected SQL RLS migrations cover Central/platform tables, not operational HR tables. backend/test/README.md explicitly says payroll integration uses company_id as the only isolation boundary and has no per-company RLS. Shared public operational schema remains a hard release gate until table coverage and a non-owner runtime DB role are verified.
- GAP-0031 (P1): standard backend CI does not set the RLS/auth/payroll/compliance integration DB URLs; those tests skip. The separate PostgreSQL workflow runs only the synthetic tenant migration inventory classifier.
- Positive correction retained: frontend-build.yml exists and runs npm ci + npm run build on frontend changes; browser E2E remains absent.
- Latest Phase 6 docs commits: e01fd66 (audit), 5153cd4 (gap register), d13cf81 (index), 25909a5 (tracker). Re-fetch exact branch head and CI before status claims.
- No production DB migration, DB-role change or deployment was performed. Continue audit of Central tenant lifecycle/billing, document workflow, import/export, backups and deployment before writing Cycle 01 plan.


## CYCLE 01 PHASE 7 UPDATE — 2026-11-27

- Onboarding/document/settings API contract audit is recorded in HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-7.md at source SHA 8b99f8a40311d81f5e200700562effb06ced0255.
- GAP-0032: OnboardingWizard calls /platform/onboarding/progress, /save-step and /complete, plus /payroll/salary-components; the mounted backend route inventory has no corresponding endpoints (payroll has /salary-structures instead).
- GAP-0033: CompanyDocumentsStep/AdminDocuments call /platform/company-documents endpoints, but the mounted platform/admin route inventories do not expose them. Central document metadata tables exist; upload/review/scanning/storage API workflow is not implemented in the inspected backend.
- GAP-0034: Frontend settingsApi calls /settings/notifications; server mounts notification config routes at /config/notifications with /notifications path, not the frontend URL.
- Latest Phase 7 docs commits: e04e0e4 (audit), 4548638 (gap register), 1be18e0 (index), 2556fd0 (tracker). Verify exact branch head/CI before status claims.
- Next: audit billing/payment verification, Central RLS coverage and lifecycle, remaining Settings/Notifications/Reports service paths, import/export, backup/restore and deployment. No Cycle 01 plan yet.


## CYCLE 01 PHASE 8 UPDATE — 2026-11-27

- Billing/backup/deletion audit is recorded in HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-8.md at source SHA a9c5f094e145afb95d93fcf136643058c4fb95db.
- Paid checkout uses a server-side Razorpay order snapshot, HMAC verification, gateway-side order/payment fetch, conditional order claim and transactional entitlement/invoice activation. Manual renewal is enforced.
- The paidStorageGuard blocks checkout until dedicated storage is already verified. No complete public shared-schema → UUID-derived dedicated-schema data migration/provisioning workflow was found; paid upgrade remains blocked pending this prerequisite (inherited GAP-0004).
- Backup uses pg_dump + gzip and uploads directly to Google Drive/OneDrive; no application-layer encryption of backup bytes was found (GAP-0035).
- Backup target guard blocks shared/legacy/unready and unsupported dedicated-database storage. No restore function/drill was found. Permanent physical deletion remains fail-closed (inherited GAP-0006).
- Latest Phase 8 docs commits: 6e0afac (audit), 2c20a57 (gap register), 3866ee6 (index), 43f53ce (tracker). Re-fetch current branch head and CI before claims.
- Gap register Cycle 01 disposition now records Phase 1–8, new findings GAP-0015 through GAP-0035, and confirms the improvement plan is not drafted/verified. Continue remaining audit and consolidate root causes before planning.


## CYCLE 01 PHASE 9 UPDATE — 2026-11-27

- Employee sensitive-data/photo audit is recorded in HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-9.md at source SHA 3fe4bf85d9539e4568882495efeab376d7358a3a.
- GAP-0036: Employee bank-account update/delete and document-delete service queries accept companyId but do not use it to verify employee ownership. Other sibling methods do verify companyId, so the inconsistency is concrete.
- GAP-0037: Employee photos are written under backend/uploads/employees and saved as /uploads/...; server.js serves the entire uploads directory through unauthenticated express.static before tenant/auth middleware. The upload is size/MIME restricted, but reads are public. Product owner must confirm whether this is intentional; default recommendation is private access.
- Latest Phase 9 docs commits: aee3d2c (audit), fa1d7cc (gap register), 9150241 (index), 61aadb9 (tracker). Verify current head/CI before future status claims.
- Continue audit with remaining core route/service contracts, import/export, and final deployment/operations. The module tracker remains Not Assessed until full evidence is available.


## CYCLE 01 PHASE 10 UPDATE — 2026-11-27

- Import/export audit is recorded in HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-10.md at source SHA 60c8c37f5603220897a94ae40b1a1b9ba3d1289b.
- GAP-0038: Employee route currently accepts JSON rows and provides CSV template/export. Relational employee XLSX schema and validation contract exist, but shared/import-export/workbookSchema.js only validates in-memory sheet data; no actual XLSX parser/writer, preview, transactional import or round-trip export is wired.
- GAP-0039: Employee CSV export quotes values but does not neutralize formula-leading/control characters. Apply spreadsheet-safe serialization to untrusted fields and test it.
- Positive controls: employee bulk import is capped at 1,000 JSON rows and protects sensitive fields; CSV export query is company-scoped.
- Latest Phase 10 docs commits: 8d94b2e (audit), 483331c (gap register), f4cd817 (index), 0780f9a (tracker). Re-fetch current branch head and CI before status claims.
- Cycle 01 audit now has 10 phase documents and findings through GAP-0039. Remaining coverage includes final whole-repo inventory/reconciliation, full auth/employee/attendance route-service tracing, frontend browser/runtime verification, operational runbooks/deployment and consolidation of common root causes. Do not draft implementation tasks until the audit is complete.


## CURRENT EXECUTION SNAPSHOT — 2026-11-27

- Branch head at this snapshot: 15b178e1ab524dd6c7ca217c405b8ced56fa9060 on architecture/postgres-tenant-isolation.
- Cycle 01 source audit has 10 phase reports (PHASE-1 through PHASE-10); master gap register currently lists GAP-0015 through GAP-0039 in addition to inherited GAP-0001 through GAP-0014.
- The audit remains IN PROGRESS. Findings have not been implemented or closed. Some candidates (ESS route-tree invariant and undefined Razorpay webhook handler) still require runtime/boot reproduction; root-cause deduplication and independent prioritization are pending.
- Latest exact-head checks at snapshot: Backend Tests run 46027335412 = in_progress; Tenant Migration PostgreSQL Integration run 46027335592 = in_progress. Do not claim latest-head checks passed until these complete.
- Most recent preceding Backend Tests on 674483fd0e9bdc0eaf0ca093eaa9117d36c1fb40 passed (run 46027270700). Its Tenant Migration PostgreSQL Integration run 46027270452 was still in_progress at snapshot.
- No application code was changed in this audit; commits are documentation-only. No production DB migration, deployment, real payment, destructive customer-data operation or credential change was performed.
- Immediate next step: complete remaining source/test coverage and verify provisional P0/P1 findings with safe boot/browser/database harnesses; then consolidate duplicates/root causes, draft Cycle 01 plan and independently verify it before any code implementation.


## 2026-11-27 continued work — Cycle 01 Phase 11

- Added `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-11.md` (auth identity and attendance controller/service contract reconciliation).
- Re-fetched current branch files before inspection. Key source blob SHAs and detailed evidence are recorded in Phase 11.
- Auth trace confirmed current token signers emit separate `companyId` and `centralTenantId`; `tenantIdentity.js`, auth middleware and existing identity tests include legacy-token and host-mismatch safeguards. Full login/refresh/company-selection runtime coverage remains outstanding.
- New GAP-0040 (P2): attendance controller passes `companyId` as the third argument to `checkIn`, but service's third argument is `data`. Request body becomes an unused fourth argument, so latitude/longitude/IP metadata is not persisted. Fix only after plan verification; add controller/service contract and self-service ownership tests.
- Reconfirmed GAP-0037 public uploads mount in `server.js`; no duplicate finding created.
- No application code changed; no tests, boot, browser, DB, staging, migration, payment or deployment operation was performed.
- Audit remains In Progress. Root-cause consolidation, remaining whole-repo coverage, runtime verification, Cycle 01 plan drafting and independent plan verification are still pending.
- Communication preference: keep chat updates short and user-relevant; state active phase/task and verified completion/blockers. Do not imply background execution after a turn ends.


## CURRENT HANDOFF — Cycle 01 Phase 12 (2026-11-27)

- Working branch: architecture/postgres-tenant-isolation. Never modify main.
- Latest documented application source inspected: cd400a602eb255029c1daeeae1d35f0c7b7ee948. Documentation continuation commits follow this source inspection; re-fetch branch head before any next source audit or CI claim.
- New audit record: HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-12.md.
- Phase 12 revalidated GAP-0020, GAP-0021, GAP-0031, GAP-0022, GAP-0029 and GAP-0040 against exact-head source. All remain open; boot/runtime/integration verification is still required.
- Latest inspected SHA had two successful external Railway status contexts but no GitHub Actions runs returned. This is not proof that tests passed.
- No application implementation, production migration, deployment, live payment or customer-data operation was performed.
- Exact next work: continue full route/controller/service/model/test audit and operational table/FK/RLS matrix; safely reproduce boot/browser/DB candidates where isolated execution is available; reconcile duplicate/root causes; only then draft and independently verify Cycle 01 plan. No implementation before plan verification.
- User expects concise plain-language progress updates and explicit statements of completed work, blockers and next task.

## CURRENT HANDOFF — Cycle 01 Phase 13 (2026-11-27)

- Working branch: architecture/postgres-tenant-isolation. Never modify main.
- New audit record: HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-13.md (commit d2fa4d9e4f1f55283f2937f5344f987eb14ae1ee).
- Phase 13 recorded GAP-0041: tenant Prisma schema targets PostgreSQL, but documented legacy tenant migration history is MSSQL/SQL Server and must not be run against PostgreSQL. A safe PostgreSQL baseline/replay strategy is still required.
- Tenant migration inventory is intentionally read-only/inventory-only with copyAllowed=false; do not claim data copy or cutover is implemented.
- GAP-0020 WebSocket broadcast and GAP-0021 missing Razorpay handler remain source-confirmed/open; runtime verification not performed.
- No tests, server boot, browser, database, migrations, payments, deployments or customer-data operations were performed. main untouched; application source unchanged.
- Next: continue full operational schema/FK/index/RLS matrix; inspect migration inventory tests and lifecycle callers; then frontend/API and backup/restore audit. Cycle 01 plan only after complete audit; independently verify before implementation.


## CURRENT HANDOFF — Cycle 01 Phase 14 (2026-11-27)

- Working branch: architecture/postgres-tenant-isolation. Never modify main.
- New audit record: HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-14.md (creation commit 154594e60f3fdc1bdbd94eb6c16676d7a0f8651c).
- Phase 14 recorded GAP-0042 (P1 security review): customer DB connection enablement helper exists but is not directly enforced in inspected tenant storage resolver; SSRF exploitability remains unproven until DB-config write permissions, provisioning paths, flag state and outbound network policy are checked.
- Positive controls noted: auth tenant-context match, fail-closed storage resolver, UUID-derived schema names and transaction-scoped central RLS helpers. Runtime DB tests were not executed; CI skip concern GAP-0031 remains.
- No application source, tests, server, browser, DB, customer network, payment or deployment was changed/exercised. main untouched.
- Next session: trace DB-config write routes and provisioning lifecycle; verify feature flag + egress policy; continue schema/FK/index/RLS and frontend/ops audits. Only after audit complete draft and independently verify Cycle 01 plan.



## CURRENT HANDOFF — Cycle 01 Phase 15 (2026-11-28)

- Working branch: `architecture/postgres-tenant-isolation`. Never modify `main`.
- New audit record: `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-15.md`.
- Phase 15 corrects GAP-0042: new tenant registration does gate customer-managed DB modes using `CUSTOMER_DATABASE_CONNECTIONS_ENABLED`.
- New open findings: GAP-0043 (legacy Settings DB connection-test endpoint bypasses feature flag and accepts request-supplied destinations), GAP-0044 (legacy DB credentials stored/read without adequate protection), GAP-0045 (legacy Settings DB config writes a separate table not used by canonical tenant routing and exposes non-PostgreSQL options).
- Do not call SSRF exploitability confirmed. Deployment flag value and provider-level egress controls are not known. Keep customer-managed DB connections disabled until verified.
- Registration source shows lease-based lifecycle, but separate recovery worker and full retry lifecycle are not verified.
- No application source changed; no tests, boot, browser, DB, network, migration, payment or deployment operation was performed. main untouched.
- Next: complete PostgreSQL schema/FK/index/RLS matrix, then frontend/API and backup/restore/deployment audit; reconcile duplicates/root causes; draft Cycle 01 plan only after audit completion and independently verify it before implementation.



## CURRENT HANDOFF — Cycle 01 Phase 16 (2026-11-28)

- Working branch: `architecture/postgres-tenant-isolation`. Never modify `main`.
- New audit report: `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-16.md`.
- GAP-0046: single-column operational FKs do not enforce same-company parent/child relationships for multiple company-owned relations.
- GAP-0047: reviewed central RLS migrations do not cover legacy tenant-specific backup_config/tenant_db_config; payment_webhook_events and billing_events need explicit access classification.
- GAP-0048: central_schema.sql fresh-install bootstrap contains no RLS policies; separate policy migrations must be guaranteed and verified.
- GAP-0049: static scan found 30 FK columns without declared indexes among 55 operational relations; actual catalog/query plan review required.
- Operational DB intentionally has no RLS; isolation depends on database/schema routing plus explicit company_id filters. Production central DB role must be checked for owner/BYPASSRLS.
- No DB connection, test, runtime, migration, deployment, customer-data operation or app-code change performed. main untouched.
- Next: finish ownership/FK and central RLS matrix; inspect backup/restore, frontend/API and deployment runbooks; reconcile all findings before drafting Cycle 01 plan. Independent plan verification is mandatory before implementation.


## CURRENT HANDOFF — Cycle 01 Phase 17 (2026-11-28)

- Working branch: `architecture/postgres-tenant-isolation`. Never modify `main`.
- Latest completed audit: `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-17.md`.
- **GAP-0050:** backup scheduler is not started in inspected server bootstrap; scheduler checks `backup_time` while Prisma/SQL define `schedule_time`.
- **GAP-0051:** Railway start command runs a Central schema SQL script every deployment; the script catches errors and exits successfully, so the app can start after migration failure.
- **GAP-0052:** tenant backup only handles ready dedicated DB/schema. Central DB and MinIO files are not included; `include_files` is unused; no restore implementation/drill exists. Permanent deletion correctly fails closed pending independently verified restore and approval.
- **GAP-0053:** gzip dump artifact is not application-layer encrypted before cloud upload (revalidates GAP-0035).
- **GAP-0054:** frontend notification settings endpoint does not match backend router mounts (revalidates GAP-0034).
- Phase 17 was source-only. No app code, test, server, database, backup, restore, migration, deployment, payment or customer-data operation was performed. Current-HEAD CI success was not verified.
- Next: complete the wider frontend-to-backend route/payload/permission matrix for auth, platform admin, employees, attendance, leave, payroll, documents, billing and onboarding. Then reconcile all findings into a prioritized Cycle 01 improvement plan and subject it to independent verification before any implementation. Do not ask the user to repeat documented decisions or run DB tasks during the source audit.


## CURRENT HANDOFF — Cycle 01 Phase 18 (2026-11-28)

- Latest completed audit: `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-18.md`.
- GAP-0055: frontend employee address-list call has no matching backend route.
- GAP-0056: expense receipt upload frontend path and multipart field mismatch backend path/field.
- GAP-0057: employee photo upload method mismatch (frontend POST vs backend PUT).
- Core API service prefixes were compared against route mounts for major HR modules. Static path matching is not runtime verification; full payload/response, permission, object ownership and browser mapping remains incomplete.
- Phases 17 and 18 were source-only; no app code, tests, browser, DB, backup, restore, migration, deployment, payment or customer-data operation performed. Keep main untouched.
- Next: complete platform-admin, onboarding, billing, documents and remaining frontend page API mapping; reconcile duplicate and superseded findings; then draft and independently verify the Cycle 01 P0/P1 implementation plan before changing application code.


## CURRENT HANDOFF — Cycle 01 Phase 19 (2026-11-28)

- Latest completed audit: `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-19.md`.
- GAP-0058: Billing page sends the wrong subscription-order request fields; Billing and onboarding double-read the response after Axios unwrapping.
- GAP-0059: onboarding payroll setup calls missing `POST /payroll/salary-components`.
- GAP-0060: global API interceptor unwrapping conflicts with dashboard/onboarding/Billing consumers.
- Correction: GAP-0032 onboarding progress/save-step/complete routes are present; only salary-components remains missing.
- Correction: GAP-0033 company document upload/list/review endpoints are present and mounted; source-level route absence is superseded, runtime storage/review checks pending.
- No app code, tests, browser, payment, DB, migration or deployment operation performed. Keep main untouched.
- Next: final cross-cutting source audit of request/response contracts, permissions/object ownership, jobs, file storage and deployment; reconcile duplicate/stale findings; draft and independently verify Cycle 01 improvement plan before any app-code implementation.


## CURRENT HANDOFF — Cycle 01 Phase 20 (2026-11-28)

- Latest completed audit: `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-20.md`.
- GAP-0061: KYC automation queue is in-process memory only; pending persisted task rows are not recovered on restart.
- GAP-0062: environment template omits active runtime settings for ClamAV, customer DB gate, cloud tenant DB URL and Central direct URL; Razorpay documentation is stale.
- GAP-0063: MinIO credentials fall back to well-known minioadmin defaults and are not rejected by production startup validation.
- `/health` only confirms process response, not DB/object-store/scanner/worker readiness.
- No application code, tests, services, DB, queue, backup, restore, migration, payment or deployment operation performed; main untouched.
- Next: reconcile all findings and finish any remaining high-risk source audit. Then build a prioritized Cycle 01 improvement plan with task IDs, dependencies, rollback/safety controls and measurable acceptance tests. Have the plan independently verified before changing app code.


## CURRENT HANDOFF — Cycle 01 Phase 21 (2026-11-28)

- Latest completed audit: `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-21.md`.
- GAP-0064: encryption helper contains a hard-coded fallback key; server startup validation does not protect direct helper scripts/workers.
- GAP-0065: multi-tenant email resolution uses unordered `LIMIT 1` and returns one arbitrary workspace instead of explicit selection.
- Positive correction: current authStore excludes accessToken from persistence and clears legacy localStorage tokens; preserve this behavior and test it.
- No application code, credentials, DB, test, browser, migration or deployment operation performed; main untouched.
- Next: reconcile full findings register, create Cycle 01 prioritized P0/P1 plan, then independently verify plan before application changes.


## CURRENT HANDOFF — Cycle 01 Phase 22 (2026-11-28)

- Latest completed audit: `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-22.md`.
- GAP-0020 P0 is still source-confirmed: company WebSocket broadcasts are not scoped by companyId.
- GAP-0021 P0 is still source-confirmed: subscription router references missing paymentController.handleWebhook export; boot failure expected but not run.
- GAP-0030 corrected: operational tables intentionally have no RLS under frozen design; shared public isolation relies on tenant routing + company_id filters. GAP-0002 remains P0 until proved.
- Duplicate findings consolidated in the Phase22 report and master register.
- No app code, tests, server boot, DB, webhook, payment, migration or deployment operation performed; main untouched.
- Next: prepare Cycle 01 improvement plan from consolidated findings, then independently verify it before any code implementation.


## CURRENT HANDOFF — Cycle 01 plan verified (2026-11-28)

- Plan: `HRMS_Blueprint/cycles/CYCLE-01-PLAN.md`.
- Verification: `HRMS_Blueprint/cycles/CYCLE-01-PLAN-VERIFICATION.md` — Round 1 corrections applied; Round 2 **VERIFIED**.
- Reviewed plan blob SHA: `7c3895a58e6553edaa4fdc346ed41be6e0ce4f4b`.
- Full traceability matrix maps all GAP-0001 through GAP-0065. Duplicates and superseded findings are explicitly marked.
- Next safe implementation tasks: HRMS-C-002 (missing webhook handler/server boot) and HRMS-D-001 (company-scoped WebSocket) with isolated tests; HRMS-D-003 identity contract must be coordinated with WebSocket ticket identity. No production database, deployment, real payment, deletion, customer DB connection or key rotation without explicit approval.
- No application code has been changed by the plan/review process. Keep main untouched.


## CURRENT HANDOFF — Cycle 01 Phase 23 (2026-11-28)

- Latest implementation report: `HRMS_Blueprint/cycles/CYCLE-01-IMPLEMENTATION-PHASE-23.md`.
- HRMS-D-001: tenant/company-scoped WebSocket tickets and notification delivery implemented; focused unit tests pass. Still requires real WebSocket integration test.
- HRMS-C-002: Razorpay webhook handler export and subscription router callable test now pass. CI discovered and fixed a separate unterminated disabled PhonePe handler; GAP-0066 verified closed.
- Plan: `HRMS_Blueprint/cycles/CYCLE-01-PLAN.md`; verification Round 2 plus Round 3 addendum in `CYCLE-01-PLAN-VERIFICATION.md`. Traceability now includes GAP-0001–GAP-0066.
- Backend CI run 46103433237 passed on SHA `97c60ad1ed3549d4c780c8506f871ada8e7cd1bb` (171 discovered, 166 pass, 0 fail, 5 skipped). This is not latest HEAD; later auth/session commits and docs updates require fresh CI.
- Next: finish live WebSocket integration test; verify current multi-tenant login/OTP/refresh implementation and tests (D-003); then continue D-004 table ownership/Central RLS and D-005 migration baseline. Do not use production DB or real payments.
- `main` untouched.


## CURRENT HANDOFF — Cycle 01 Phase 24 (2026-11-28)

- Latest implementation report: `HRMS_Blueprint/cycles/CYCLE-01-IMPLEMENTATION-PHASE-24.md`.
- HRMS-D-003 explicit tenant selection and signed tenant/company refresh binding are implemented with regression tests. GAP-0001 and GAP-0065 are Fixed — Awaiting real login/OTP/refresh E2E verification.
- Backend Tests passed at SHA `3f495f016e8e56ecb6fc63770c836fc6e292ac7c` (177 tests, 172 pass, 0 fail, 5 skipped); Frontend Build passed at SHA `2b27b3c8a319f02a16b01f2fb9fd092d0cff380b`.
- Central RLS policy/bootstrap parity is the current next gate; latest test run had one assertion failure, corrected with an explicit application-role ownership/BYPASSRLS migration comment. Latest rerun is pending.
- Next: review Central RLS migration/bootstrap parity and test results; do not apply migration to production. Then continue D-004 operational ownership/query-scope and D-005 PostgreSQL migration baseline audit.
- `main` untouched.


## CURRENT HANDOFF — Cycle 01 Phase 25 (2026-11-28)

- Latest implementation report: `HRMS_Blueprint/cycles/CYCLE-01-IMPLEMENTATION-PHASE-25.md`.
- Central RLS migration: `backend/db-migrations/20261128_central_rls_policy_completion.sql`.
- Fresh-install parity: `backend/prisma/central_schema.sql` includes the same policies for all 17 Central Prisma models.
- Static backend CI passed at SHA `865d5f5d567f49b70967dbd82923047e7a870311`: 183 discovered, 178 pass, 0 fail, 5 skipped.
- Do not execute the migration yet. Deployed Central DB role ownership/BYPASSRLS and live policy catalog are unknown. Legacy Settings DB-config endpoints use a direct Prisma client without tenant RLS context and must be migrated/disabled first.
- No live DB, production migration, deployment or customer-data operation performed; main untouched.
- Next: complete operational query ownership/scoping audit, then prepare PostgreSQL tenant migration baseline. Continue D-005 only after D-004 live verification preconditions are satisfied.


## CURRENT HANDOFF — Cycle 01 Phase 25 (2026-11-28)

- Latest report: `HRMS_Blueprint/cycles/CYCLE-01-IMPLEMENTATION-PHASE-25.md`.
- Central RLS policies now cover all 17 Central models in migration and bootstrap. Real RLS pooling test uses non-owner `hrms_app` in disposable PostgreSQL CI.
- Backend CI now runs all five previously skipped DB suites. Run 46104242869 passed 210/210, zero skipped at SHA `c3790b43c30b5895fd2eb9b156ef939a54db2055`; tenant migration integration run 46104242863 passed.
- GAP-0031 backend CI skip issue fixed; GAP-0047/0048 source parity fixed, live role/catalog and clean-install verification pending.
- **Do not apply Central RLS migration to production yet:** legacy Settings direct Prisma access to `tenant_db_config` lacks RLS context; deployed DB role owner/superuser/BYPASSRLS status is unknown.
- Next: complete HRMS-D-004 operational model/query ownership audit and remediate legacy Settings path; then D-005 PostgreSQL migration baseline. Keep main untouched.


## CURRENT HANDOFF — Cycle 01 Phase 26 (2026-11-28)

- Latest migration audit: `HRMS_Blueprint/cycles/CYCLE-01-IMPLEMENTATION-PHASE-26.md`.
- No valid PostgreSQL Prisma migration history exists at the expected path. The legacy directory is literally `migrations     11223`, with `provider = "mssql"` and SQL Server DDL.
- Tenant and Central schemas target separate PostgreSQL databases; plan independent migration histories and baseline paths.
- Railway app start invokes `apply_canonical_schema_migration.js`; that script catches migration errors and allows server startup to continue. No deploy config changed.
- No DB connection, baseline generation, migration, deployment or customer data operation performed.
- Next: complete the remaining operational ownership review and harden source-level RBAC/IDOR findings. Then implement the Central/tenant migration directory split with disposable PostgreSQL CI. Do not execute production migration/deploy without explicit approval.

---

## CURRENT AUTHORITATIVE HANDOFF — Cycle 01 Phase 28 (2026-11-28)

- Latest source implementation report: `HRMS_Blueprint/cycles/CYCLE-01-IMPLEMENTATION-PHASE-28.md`.
- Working branch: `architecture/postgres-tenant-isolation`; `main` untouched.
- Phase 28 code commit: `2254f855b884deb51f7f7783d6acae17fd6523c3`.
- Changes: attendance holiday deletion now checks company ownership; employee bank/document child mutations validate parent employee ownership; payroll controller passes the tenant DB correctly and payslip/bonus operations bind run + employee ownership; training detail filters foreign-company employee joins.
- Backend CI run 46105770148 passed 258/258, 0 skipped. Tenant PostgreSQL migration integration run 46105770068 passed 1/1, 0 skipped.
- Frontend Build run 46104588048 passed at `cb3ebff3cc1fabd0c189ece8df09a01efcf82bd5`; no frontend source changed since.
- HRMS-A-010 remains In Progress; only the Phase 28 subpaths are fixed in source and CI-tested. HRMS-D-004 remains In Progress: full operational query ownership matrix, composite same-company FK review, live Central catalog and deployed app-role ownership/BYPASSRLS remain open.
- New residual from full re-analysis: forgot-password fallback in `backend/modules/auth/auth.routes.js` still chooses an unordered `LIMIT 1` Central membership when request tenant context is absent. Extend GAP-0065. Login selection/refresh binding have Phase 24 source fixes; real auth E2E remains pending.
- **Next exact task:** HRMS-D-003 forgot-password explicit workspace selection and multi-membership tests; then resume D-004 operational ownership matrix.
- No production DB connection, migration, deployment, real payment, destructive tenant operation or customer-data modification occurred. No owner decision is needed for the next source-only task.


---

## CURRENT AUTHORITATIVE HANDOFF — Cycle 01 Phase 29 (2026-11-28)

- Working branch: `architecture/postgres-tenant-isolation`; protected `main` untouched.
- Source implementation report: `HRMS_Blueprint/cycles/CYCLE-01-IMPLEMENTATION-PHASE-29.md`.
- Resumed the exact Phase 28 next task: `HRMS-D-003` forgot-password explicit workspace selection; finding `GAP-0065`.
- Source commits:
  - Helper: `3a6a8f8d388c28346fb139a5f307afa1c7102328`.
  - Regression tests: `ffca840d666112c3bcf63bdb08f86b0e24ce3be7`.
  - Backend route: `1b3bc154b44b9bb796aaa7d6ce810ea5c01eea34`.
  - Frontend workspace chooser: `2891a1107b66a754d7319dda0d43604465416272`.
  - Clear stale workspace selection on email edit: `e644c3b5e233257c1359ed53b2daef4a1aa9dd5d`.
- Forgot-password no longer uses an unordered Central membership `LIMIT 1`; ambiguous memberships require an eligible explicit workspace. Request-host/body mismatch is rejected. Reset token creation and email delivery use the same selected tenant database.
- New tests cover one/multiple workspaces, explicit selection, request tenant binding, mismatch and invalid selection, plus source guards for the route.
- Frontend now shows workspace choices for multi-membership email and clears selection if the email changes.
- **Verification:** tests have been committed but have NOT yet been run in this environment. Exact-head backend CI, frontend build and authenticated password-reset E2E are **Pending / Not Verified**. A blank combined-status response and a PR-only workflow-run query are not CI pass evidence.
- **Next exact task:** resume `HRMS-D-004` operational model/query ownership matrix, then composite same-company FK feasibility/data review. HRMS-D-003 remains In Progress until exact-head CI and login/OTP/refresh/password-reset E2E evidence pass.
- No production/customer DB connection, SQL, migration, deployment, real payment, credential change, destructive operation or customer-data modification occurred.


---

## CURRENT AUTHORITATIVE HANDOFF — Cycle 01 Phase 30 (2026-11-28)

This Phase 30 handoff supersedes the Phase 29 next-task line.

- Working branch: `architecture/postgres-tenant-isolation`; `main` untouched.
- Latest Phase 30 report: `HRMS_Blueprint/cycles/CYCLE-01-IMPLEMENTATION-PHASE-30.md`.
- Ownership inventory: `HRMS_Blueprint/cycles/CYCLE-01-POSTGRES-OWNERSHIP-INVENTORY-PHASE-30.md`.
- Plan and verification: `CYCLE-01-PLAN-PHASE-30.md`, `CYCLE-01-PLAN-VERIFICATION-PHASE-30.md`.
- Phase 30 resumes HRMS-D-004 and discovers GAP-0067: OTP records used raw email + purpose in shared public operational storage. Source fix namespaces OTP identifiers by immutable Central tenant UUID + normalized email for both create and verify.
- Code commits: helper `e884c37ad792c9f7c6c96797f5ba26761d83251e`; service `9c73d007630c3447c7b7b7cb56ecad421233ba50`; route `5d51ff1ff06c4616f64974f57d5c88565b9b0c5a`; tests `9e0432b1520622a5661874b492076f7186ec16c5`.
- Static ownership inventory: 82 operational models (33 direct company_id, 29 employee_id, 13 parent/user-owned, 7 root/auth/reference/unresolved) and 17 Central models.
- GAP-0067 is **Fixed — Awaiting Verification**. Six tests are committed but have not been executed in this session; exact-head backend CI and authenticated OTP E2E remain pending.
- Phase 29 GAP-0065 forgot-password fix also remains awaiting exact-head CI/auth E2E. Do not close HRMS-D-003.
- **Next exact work:** continue HRMS-D-004 query-by-query operational ownership audit across controllers/services, background workers, reports/exports and WebSockets; prepare disposable PostgreSQL cross-company tests and composite same-company FK feasibility checks.
- Central production role owner/superuser/BYPASSRLS and live catalog evidence remain pending. Static RLS parity is not deployed-role proof.
- No production/customer DB connection, SQL, migration/DDL, deployment, real payment, deletion, credential rotation or customer-data operation was performed.


---

## CURRENT AUTHORITATIVE HANDOFF — Cycle 01 Phase 31 (2026-11-28)

This supersedes the Phase 30 next-task line.

- Working branch: `architecture/postgres-tenant-isolation`; `main` untouched.
- Phase 31 report: `HRMS_Blueprint/cycles/CYCLE-01-IMPLEMENTATION-PHASE-31.md`.
- Phase 31 plan and verification: `CYCLE-01-PLAN-PHASE-31.md`, `CYCLE-01-PLAN-VERIFICATION-PHASE-31.md`.
- Source now resolves password login, OTP and forgot-password through the selected Central tenant's `central_user_index.user_id`, then validates operational `company_id`. OTP identifier includes tenant UUID + company UUID + normalized email.
- Important correction: do NOT enumerate operational users by email from shared public storage. Those rows do not contain Central tenantId and can belong to multiple SaaS tenants. Final source does not use this unsafe approach.
- GAP-0067: tenant+company OTP namespace committed; Fixed — Awaiting Verification.
- GAP-0068: same email across multiple operational companies is not fully selectable because Central index has one user_id per email/tenant. Open / Blocked on explicit Central membership mapping and legacy backfill under HRMS-D-005.
- HRMS-D-003 remains In Progress. HRMS-D-004 remains In Progress with the 82-model inventory complete but query-by-query audit pending. HRMS-D-005 remains blocked on canonical PostgreSQL migration baseline.
- Isolated Node helper smoke: 4/4 passed. Full repository tests, exact-head CI and authenticated E2E have not been run/verified.
- Next exact task: design the Central tenant-user-company membership mapping and backfill/adoption requirements as part of HRMS-D-005 without applying a migration; then complete Phase 31 auth E2E plan. After identity mapping is resolved, resume D-004 query-by-query ownership audit.
- No production/customer DB connection, SQL, migration/DDL, deployment, real payment, deletion, credential rotation or customer-data operation.


---

## CURRENT AUTHORITATIVE HANDOFF — Cycle 01 Phase 32 design checkpoint (2026-11-28)

This supersedes the Phase 31 next-task line.

- Working branch: `architecture/postgres-tenant-isolation`; `main` untouched.
- Phase 31 implementation report: `cycles/CYCLE-01-IMPLEMENTATION-PHASE-31.md`.
- Phase 32 Central membership mapping design: `cycles/CYCLE-01-CENTRAL-TENANT-COMPANY-MEMBERSHIP-DESIGN-PHASE-32.md`.
- Phase 32 plan/verification: `CYCLE-01-PLAN-PHASE-32.md`, `CYCLE-01-PLAN-VERIFICATION-PHASE-32.md`.
- Final auth source binds login, OTP and forgot-password to Central `central_user_index.user_id` for the selected tenant, then validates operational companyId. OTP identity includes tenant + company + normalized email.
- GAP-0067 Fixed — Awaiting Verification. GAP-0068 Open / Blocked: the current Central index supports only one operational user per email/tenant. The proposed new Central tenant-user-company mapping is design-only; no DDL or migration exists.
- The proposed mapping requires decisions on whether one user can belong to multiple companies, whether one company can belong to multiple Central tenants, membership lifecycle and trusted legacy backfill authority. These are not silently frozen by the design.
- Full backend tests, frontend build, exact-head GitHub CI and authenticated login/OTP/refresh/password-reset E2E remain unverified. Only isolated OTP helper smoke passed 4/4.
- **Next exact task:** resolve/document the membership semantics and legacy backfill owner decisions; then incorporate the approved mapping into the D-005 canonical PostgreSQL migration baseline plan. No DDL until explicit approval and baseline verification.
- HRMS-D-003 remains In Progress; HRMS-D-004 remains In Progress; HRMS-D-005 remains Blocked on migration baseline.
- No production/customer DB connection, SQL, migration/DDL, deployment, real payment, deletion, credential rotation or customer-data operation.
