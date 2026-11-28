# PostgreSQL Tenant Isolation — Implementation Progress

**Branch:** `architecture/postgres-tenant-isolation`  
**Updated:** 2026-11-27

## Implemented in source (runtime validation pending)

### 1. Fail-closed permanent deletion guard
- Physical deletion is now disabled entirely until a verified restore drill and tenant-ownership audit are enforced. A successful upload/backup alone cannot authorize data destruction.
- Permanent deletion now requires storage status `ready` and tier `dedicated_schema`.
- Shared schemas are explicitly blocked from schema-drop deletion.
- Legacy/unclassified, pending, provisioning, failed, and malformed storage metadata are blocked.
- Dedicated schema name must match `tenant_<tenant UUID without hyphens>`.
- Dedicated-database deletion is blocked until a separate database-level deletion workflow exists.
- The old `public` schema drop/recreate fallback is no longer reachable through the permanent-deletion path.
- Added pure unit tests for the guard.

### 2. PostgreSQL backup fail-closed behavior
- Removed the JSON note masquerading as a successful SQL backup.
- PostgreSQL dump runs with argument-safe process spawning rather than an interpolated shell pipeline.
- Dump output is gzip-compressed in Node streams.
- Nonzero `pg_dump` exit, missing executable, empty output, or invalid gzip header fails the backup.
- Optional URL `schema` parameter scopes the dump to that schema.
- Non-PostgreSQL backup types are rejected under the approved PostgreSQL-only architecture.

**Validation limitation:** gzip header and nonempty size are basic artifact checks, not a restore test. Permanent deletion still needs a restore-validation gate before production use.

### 3. Payment mock bypass
- A request-supplied `mock` value now receives an authorization error.
- Payment verification no longer skips gateway verification based on client input.
- Invoice payment references no longer synthesize a mock payment ID.
- Razorpay verification now requires order/payment/signature values and a configured server secret.
- PhonePe and JioPay require transaction IDs and their server-side verification credentials.
- Unsupported payment methods are rejected.

**Remaining payment work:** server-created order/payment records, amount/currency/tenant/plan binding, webhook idempotency, and atomic activation remain to be implemented.

### 4. CI
- Added a GitHub Actions workflow to install backend dependencies, explicitly generate both Prisma clients, and run `npm test` on the working branch and relevant pull requests.
- GitHub Actions backend test runs #19 and #20 completed successfully, including dependency installation, generation of both Prisma clients, and `npm test`.

### 5. Registration activation gate (partial)
- New tenant rows are inserted inactive.
- Cloud/external-cloud registration must complete schema cloning and admin seeding before the tenant is activated and marked setup-complete.
- Missing database target, clone failure, or seed failure leaves the tenant inactive and returns a provisioning error.
- Legacy schema naming remains temporarily in this path until the central lifecycle migration and tenant classification are ready; this is not yet the final shared-versus-dedicated allocator.

### 6. Stage 2: storage isolation and migration alignment
- Fixed the central schema's PostgreSQL `DO $ ... END $;` block.
- Aligned read-only inventory checks with `storage_error_code`, the lifecycle column in both Prisma and SQL.
- Classified dedicated-schema routing now requires a UUID-derived schema name, not just a syntactically valid name.
- Tenant-specific backup is restricted to ready, UUID-owned dedicated schemas; shared and legacy tenants fail closed until a separate audited backup implementation exists.
- Permanent deletion now fails with `RESTORE_VERIFICATION_REQUIRED` before attempting a backup or schema drop. This intentional stop remains until an independently verified restore-and-approval workflow is implemented.
- Added tests for backup targeting and schema ownership.
- GitHub Actions has reported successful runs on earlier branch commits; newest commits require their own completed run.

## Not yet implemented / not approved for production
- Full registration provisioning state machine, retry/compensation, and UUID-based schema allocation.
- Storage lifecycle migration alignment and application.
- Tenant resolver integration into request middleware.
- Existing-tenant classification and schema collision remediation.
- Restore-validation workflow and deletion approval gate (permanent deletion currently intentionally disabled).
- Payment idempotency and server-side order validation.
- Full PostgreSQL integration and tenant-isolation end-to-end tests.

## Safety
No database migration, live schema change, customer-data deletion, backup execution, or payment transaction was performed as part of these commits. GitHub source writes do not constitute runtime validation.


## 2026-11-24 follow-on corrections
- Corrected the read-only inventory to check the exact lifecycle columns defined by the migration: `storage_verified_at` and `storage_error_code`.
- Removed the now-unused Prisma client import from the deletion service after disabling physical deletion.
- Added explicit Prisma client generation to CI because dependency installation uses `--ignore-scripts`.
- Confirmed the storage resolver remains intentionally unwired to tenant request routing. Existing tenant rows are still unclassified in the live central database, and the live lifecycle migration has not been applied.
- Confirmed the current schema-cloning helper is incomplete for production-grade cloning: it does not fully reproduce foreign keys, triggers, views, functions, policies, and other schema objects. It must be replaced or formally constrained before it can be trusted to mark a tenant provisioned.


## Verified CI result
- Workflow: **Backend Tests**
- Runs: **#19 and #20**
- Result: **success**
- Successful steps: checkout, Node.js setup, `npm ci --ignore-scripts`, generation of tenant and central Prisma clients, and `npm test`.
- This validates the source state at commits `32cd598` and `669e939`. Documentation-only follow-up is newer; it does not change executable code.


## Razorpay verification hardening — 2026-11-24
- Removed the development mock-order response from invoice order creation; a real gateway order is required.
- Rejects client-supplied mock verification requests.
- Requires a configured Razorpay secret and non-empty order/payment/signature values.
- Verifies the HMAC signature using constant-time comparison.
- Fetches the order and payment directly from Razorpay and checks invoice receipt, amount, currency, order linkage, and captured payment status before marking an invoice paid.
- Added unit tests for signature validation and invoice/payment matching.
- This does not yet complete the billing workflow: server-side order persistence, webhook idempotency, atomic invoice state transitions, and equivalent verified flows for PhonePe/JioPay remain outstanding.
- GitHub Actions validation for these newest commits is pending; no live payment was attempted.


## Razorpay order ledger and retry/idempotency hardening — 2026-11-24
- Added a central `payment_orders` model and a pending SQL migration to persist the tenant, invoice, gateway order ID, amount, currency, payment ID, and lifecycle status.
- Razorpay order creation now validates the gateway response against the invoice before recording it.
- Retries reuse an existing pending Razorpay order for the same invoice instead of creating another order.
- Added a database partial unique index to enforce at most one open Razorpay order per invoice.
- Verification now requires a matching persisted order belonging to the same tenant and invoice.
- Invoice payment and order capture are recorded in one RLS-scoped database transaction; invoice update is conditional so concurrent verification cannot mark the same invoice paid twice.
- Migration is committed but **not applied**. Central Prisma client generation and backend CI must pass before runtime rollout.
- Remaining: webhook idempotency and reconciliation, explicit order expiry/failure handling, provider-neutral ledger use for PhonePe/JioPay, subscription activation tied to verified invoice state, and integration tests against PostgreSQL.


## Platform admin and onboarding follow-through — 2026-11-24
- Fixed the plan catalog persistence helper to write through the configured central Prisma client; plan, module-pricing, discount, and promo writes previously referenced an undefined database variable.
- Made plan and promo read-modify-write operations fail closed when the central settings read fails, preventing a transient database error from silently replacing saved catalog data with defaults.
- Kept public plan reads resilient with the documented default catalog fallback.
- Connected the landing-page hero subheading to the saved Marketing setting.
- Corrected the Marketing pricing preview to read the actual platform catalog fields (paise, employee cap, active popularity and badge) instead of obsolete display-only fields; directed price changes to Pricing & Plans.
- Reconfirmed that the dedicated plans router is mounted before the platform admin router and provides the plan CRUD, module pricing, discounts and promo endpoints used by PricingManager.
- GitHub Actions **Backend Tests** and **Frontend Build** both completed successfully for branch head `ed90236b58b1d43b4fa5cff6410e336f859a3b57`.
- These CI checks do not validate database migrations, live Razorpay transactions, document storage/ClamAV infrastructure, or browser-level end-to-end flows. Migrations and deployment remain pending a supervised staging run.

- Completed the Marketing menu's previously static CTA panel: platform admins can now edit the bottom landing-page headline, supporting copy and three internal navigation actions; public output is allowlisted, length-limited and rejects protocol-relative/external destinations.
- The public landing page now renders the configured bottom CTA content rather than hardcoded button labels and destinations.
- CI for the CTA changes is running on the current branch head; final result will be recorded after completion.

- Added server-side plan-catalog validation for names/slugs, duplicate slugs, paise amounts, employee caps, trial length, sort order and supported module assignments; invalid configurations are rejected before they can affect checkout.
- Promo creation now validates code format, promo type, positive flat values, percentage range, expiry date and description length.
- Plan removal is now a safe deactivation rather than a destructive catalog delete; the free baseline plan is protected and inactive plans remain available for historical references.
- Pricing Manager now labels the action as Deactivate/Inactive and explains the effect to the administrator.


## Plan pricing hardening — 2026-11-24 (continued session)

- Refactored price calculation into a deterministic catalog-based helper so pricing rules can be tested without a live database.
- Checkout calculation now rejects inactive plans, unsupported billing terms, invalid employee counts, duplicate add-ons, add-ons already included in the selected plan, and modules not offered by that plan.
- Added defensive validation for configured module prices and discount percentages; flat promo deductions are capped at the remaining discounted amount so totals cannot become negative.
- Corrected custom-quote handling: only a null/undefined base price is a custom quote; the zero-price Free plan calculates to zero instead of being misclassified as a custom quote.
- Public calculate endpoint now returns invalid selection/configuration errors as HTTP 400 validation responses instead of generic HTTP 500 responses.
- Added `backend/test/plan-pricing.test.js` covering normal price calculation, discounts/promos, free/custom plans, inactive plans, add-on eligibility, invalid input and malformed catalog data.
- Commits: `eb382e8` (calculator hardening), `ddcadae` (API validation responses), `9a95c61` (pricing tests), `c0e5e03` (duplicate validation cleanup).
- Backend CI was green for the calculator and route commits; the new test commit's workflow was still running at the time this note was written. Recheck CI against the latest branch head before treating this work as verified.
- No database, migration, live payment, or staging operation was performed.


- Follow-up UI audit found the onboarding selector treated a zero-price Free plan as Custom because it used a truthiness check. Updated `PlanSelectionStep.jsx` to distinguish null custom pricing from a legitimate zero price, so Free is selectable and its price calculator can return zero.
- Switching between plans now clears add-ons and promo state from the previous plan, preventing stale add-ons from being submitted against a different plan.
- Frontend Build passed for the first Free-plan UI correction commit `88d9dc8`; the latest add-on-reset UI commit is `743fc8f` and its own workflow was queued at the time of this update.
- Fixed the new pricing test's CI import setup by supplying a syntactically valid dummy `CENTRAL_DATABASE_URL` before importing the service; the pure catalog helper does not connect to the database.
- Backend Tests passed on commit `d9871bd973c3fb641bdb63349a47efbd4346cea5`: 59 tests, 56 passed, 0 failed, 4 skipped (database-dependent RLS checks skipped because no test database URL is configured).


### Latest CI confirmation — 2026-11-24
- Commit `743fc8f877fb6362787c31eb34b3b21430c52d05`: Backend Tests **success**, Frontend Build **success**.
- Backend test summary on `d9871bd973c3fb641bdb63349a47efbd4346cea5`: 59 total, 55 passed, 0 failed, 4 skipped.
- The current branch head includes subsequent documentation commits; their Backend Tests workflow runs were still in progress at the latest check. The most recent code commit's frontend and backend checks are green.
- Branch comparison: 259 commits ahead of `main`, 0 behind. `main` has not been modified.


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


## 2026-11-25 — Prepaid manual renewal lifecycle implementation

- Added pure renewal helpers in `backend/modules/platform/billingRenewal.js`: month-end-safe calendar-month extension, renewal eligibility, stable invoice number and safe max-expiry selection.
- Replaced the previous-calendar-month invoice generator with a daily-eligible prepaid renewal generator. It selects only active paid tenants whose non-null `plan_expires_at` is at or before the current time; it skips legacy null-expiry tenants rather than guessing. Renewal invoice periods start at the paid-through timestamp and end one month later (inclusive date range). Invoice numbers are deterministic per tenant + renewal start date, and duplicate daily cron runs are protected by `skipDuplicates`.
- Changed the billing cron from first-of-month to daily renewal generation; overdue checks remain daily. Renewal is manual only; no recurring gateway charge is attempted.
- Invoice verification now extends the tenant paid-through date only for an invoice with `breakdown.billingType = manual_subscription_renewal`, using the later of the current expiry and the immutable invoice expiry snapshot. Initial subscription activation invoices are not affected.
- A paid renewal can clear an automatic unpaid-invoice suspension, but does not clear a manual/admin suspension.
- Suspended tenants can reach only authenticated subscription invoice recovery endpoints; HRMS data endpoints remain blocked.
- Added six pure tests for before-expiry suppression, null legacy expiry, mid-month boundaries, month-end/leap-year handling, deterministic invoice identity and extension from the later expiry.
- Commits: `d291fceccdb091e88df4ee26a430a64fadc9a7be`, `17bedcb7f1533604318144ed5d343c786b21bcb7`, `8982a36450b882ff2c48b683e8ee377e8c7ac402`, `ebb548706bd4168a2c2cd5cce634e62e7eb6b3b6`, `6fc1dd6cd78ba7067622b80d40f46e197b20a3a6`, `e12e05bf899700f48927f098fa47b0cd5ef4aa6e`.

### Verification status
- Not run: local `node --test`, Prisma validation/generation, PostgreSQL integration tests, Razorpay sandbox, browser E2E, migrations, staging, or production deployment.
- Latest queried combined CI status had no entries; workflow-run lookup exposed only PR-triggered runs and returned none. CI is therefore unverified, not passed.
- Current branch comparison: 291 commits ahead / 0 behind `main`; `main` remains untouched.
- Remaining billing checks: webhook raw-body signature and common ledger transition, subscription order/renewal replay, stale order reconciliation, tax invoice arithmetic, and suspended recovery integration tests.
- Legacy paid tenants with null `plan_expires_at` need manual inventory/reconciliation; no automatic expiry is inferred.

### Next priority — move to core HRMS modules after billing verification
1. Finish source + CI verification of renewal, webhook, payment ledger and subscription expiry behavior.
2. Verify tenant storage lifecycle/resolver, registration provisioning, RLS, onboarding persistence and role/permission boundaries.
3. Audit Employees first, then Attendance/Shift, Leave, Payroll and Compliance as one connected operational workflow. Do not assume route presence means module completeness; verify frontend actions, backend validation, DB schema, tenant isolation, approval states and tests.
4. Then proceed through Recruitment, Performance, Training, Assets, Expenses, Reports and Notifications/Automation.
5. Staging DB migrations, backup/restore drill, provider sandbox and production release remain gated on user access/approval.


## 2026-11-25 — HRMS module entitlement enforcement

- Source audit found `checkModuleEnabled()` in `backend/shared/middleware/permission.js` was a no-op and was not mounted on the main module routers. This meant a tenant's server-side `tenant_modules` entitlement list was not consistently enforced at the API boundary, even though plan selection persisted module entitlements.
- Implemented exact, case-insensitive server-resolved module entitlement checking. Missing entitlement metadata fails closed with 403. Only a platform-level operator (`req.user.is_platform_admin === true`) bypasses the tenant plan check; company Admin/HR roles do not.
- Mounted module entitlement checks on Employees, Attendance, Leave, Payroll, Compliance, Recruitment, Performance, Training, Assets, Expenses and Reports routers.
- Added `backend/test/module-entitlements.test.js` for exact matching, case normalization, denied tenant access, missing metadata and platform-admin bypass.
- Commits: permission middleware `12880a58ec59f8158851566de2a47b3adeb811d9`; Employees `2a00217e75f148efc8d7ea5e2d1e7885aa513d2d`; Attendance `3e90f6fed52a35bfa68996f7c66f6f2d042dbbd4`; Leave `fe26e14c73c5a42bb3e7838656a7833136b846a0`; Payroll `7f6e9a784673a0f727ef7d6fbaa37fcf6c0608c0`; Compliance `b4522fc0c47bd7741888e38562a25d558295c4fc`; Recruitment `a0e308dda57bb6aed85ebe3b756e27a79854900b`; Performance `0ba2f2d1f906ffc0d13e23b3a7b78752e82c010e`; Training `9a0e467daa324dc3a6a98b79dad5216b66524771`; Assets `aa2a11a2419ef1257fd8b70261cc294612c9b4f4`; Expenses `a208e506248850c83e14f4c905c5341aa8dcb2e8`; Reports `0310b94e23dd2b11294afb789004112fd7eea747`; tests `6f27e355834e3ebd6af2deb0e6369d08ef58e127`.
- This is a first API-boundary enforcement slice, not a complete module security audit. Check all remaining module routers (automation, notifications, settings, roles, documents and future endpoints), confirm platform-admin behavior, and run regression tests to ensure every registered module's name matches the catalog and persisted entitlement values.
- Attendance self-service and Leave self-service routes still require a dedicated route-by-route authorization audit; module gating alone does not replace user/manager ownership checks or action permissions.

### Module source-audit observations
- Employees, Attendance, Leave, Payroll and Compliance already have backend routes/controllers/services; they are not greenfield modules.
- Payroll has an integration test for payroll calculations, lifecycle guards and company scoping. Compliance has a PostgreSQL integration test for cross-company data-leak regression. Both require configured test PostgreSQL and may skip in ordinary CI.
- Frontend module completeness and browser workflows have not yet been verified. The old module blueprint's June 2026 "Live" labels are historical, not current production certification.
- Next module work should audit Employees first, then Attendance/Shift, Leave, Payroll and Compliance as one connected flow. Prioritize security and persistence gaps over new feature breadth.


## 2026-11-25 — Product requirement captured: dual CSV + relational Excel import/export

- User confirmed all HRMS modules must offer standard CSV import/export plus advanced multi-sheet relational Excel (.xlsx) import/export as a second option.
- Workbook example for Employees includes separate related tabs for basic details, contact, family, education, employment/lifecycle and permission-gated sensitive data/reference sheets. Stable keys link parent and child sheets.
- Require sample template downloads, schema-driven validation, preview-before-commit, sheet/row error reporting, downloadable error workbook, explicit create/update/upsert semantics, transaction-safe import, tenant-scoped references, audit summary, permission-gated exports and round-trip tests.
- Preserve standard CSV; use separate files or ZIP bundle for relational CSV datasets. XLSX must preserve formats/dropdowns/frozen panes/filters/instructions, avoid macros/external links, and never trust formulas as imported data.
- This is a frozen cross-module requirement. Build reusable engine during Employees, then apply to Attendance, Leave, Payroll, Compliance and all other applicable modules. Detailed acceptance criteria: `HRMS_Blueprint/32_PRODUCTION_READINESS_AND_MODULE_EXECUTION_PLAN.md`.


## 2026-11-25 — Employees relational workbook foundation (source implementation started)

- Audited the existing Employees import/export surface. It currently has a flat CSV template/export and a browser-side CSV parser; its bulk-import endpoint commits directly rather than exposing a server-side preview/confirm job. This is not yet compliant with the frozen preview-first workflow.
- Confirmed the database has relational employee tables for addresses, family, education, previous employment, bank accounts and documents. Employee Code is unique per company; child records use immutable UUIDs and employee foreign keys.
- Added `backend/modules/employees/employee-workbook.schema.js` as the initial module schema contract: Employees, Addresses, Family, Education and PreviousEmployment sheets, joined by Employee Code; child records can carry immutable record UUIDs for updates.
- Sensitive bank details, Aadhaar/PAN and document binaries/references are excluded from the default workbook schema. They require separately authorised workflows.
- Added reusable `backend/shared/import-export/workbookSchema.js` validation primitives for module sheet metadata, explicit create-only/update-only/upsert modes, typed fields, duplicate keys, parent-child references and formula/non-primitive rejection. Native Excel date values are accepted.
- Added `backend/test/employee-workbook-schema.test.js` for relationship contracts, required stable keys, missing parent references, duplicates, enums, date/formula handling and conflict modes.
- Commits: schema `2aab011e6f74fce7298e2e50906256321b275021`; generic validator `73f767d6d5589db940612a3831d670567b1009c0` (subsequently hardened in `a98814e164a2640a47712014eb2b3ce48f4ad934`, `f0b77a9bb3598ea962896bfad016f424210edf98`, `02989f8dd57b66c069bc73adba344b6a461989e5`); tests `466b7a8a41c45078d48ad4cff7b92fabb65a7333` and `def7e4880b3fe4fca6fd0f84abcb28e3c4855c01`.
- Not yet implemented: XLSX file generation/parsing, CSV relational bundle, template downloads, import preview/job persistence, DB conflict detection, transaction-safe commit, error workbook, audit mapping, UI integration, export permission checks and round-trip tests. No tests have been executed yet.


## 2026-11-25 — Employees workbook and sensitive-access implementation

- Added relational Employees workbook schema metadata and reusable validator. Current sheets: Employees, ContactDetails, Addresses, Family, Education and PreviousEmployment. Parent/child relationships use Employee Code; child record UUIDs may be supplied for authorised update/upsert flows.
- Default schema excludes bank details, Aadhaar/PAN and private document content. A strict sensitive permission middleware was added because ordinary built-in Admin/HR Admin role bypasses are unsuitable for field-level sensitive access. Identity unmask and bank account read endpoints now require explicit `employees.view_sensitive` or platform-level access.
- Backend CI passed at `20ef9b709291eab9a80e33c785b8211e9fb8b06b`: 87 tests, 83 passed, 0 failed, 4 skipped. Four tests are skipped by the current test suite; PostgreSQL integration, browser E2E and staging remain unverified.
- Current CSV import is still unsafe relative to the frozen requirement: client-side preview is not authoritative, the import button commits immediately, server validation is minimal, each row is written separately, and unknown lookup names silently map to null. Do not call the import/export feature complete.
- Next: implement server-side preview and commit with persisted import jobs and transactional parent/child writes; choose an XLSX dependency only after checking current advisories and regenerating package-lock; preserve CSV compatibility; add workbook templates, error workbook and UI actions.


## 2026-11-25 — Employees workbook validation and import security follow-up

- Expanded the Employees workbook contract with a separate ContactDetails worksheet and removed duplicated contact/address columns from the Employees sheet so each value has one authoritative location.
- Generic workbook validation now resolves schema-declared references (including Manager Employee Code) against referenced worksheets, validates child-to-parent links, enforces create-only/update-only child-record ID rules, rejects unknown sheets, duplicate keys and formula/non-primitive cells, and checks strict YYYY-MM-DD calendar dates.
- Added conditional sensitive-field import authorization. Ordinary employee CSV imports remain available under the normal employee-create permission; populated Aadhaar/PAN/UAN/ESI and disability fields require explicit employees.edit_sensitive. The default CSV template no longer advertises identity or disability fields. Existing CSV export does not include those fields.
- CI revealed a pre-existing billing renewal period-end expectation/implementation mismatch. Corrected invoice period_end to the inclusive prior calendar day and aligned its regression test. A backend Actions run for commit 3388326dc14305f58487e26b578f2e613896bddb passed (including install, Prisma generation and backend tests); later commits added more workbook validation/security changes and their latest CI run is still pending at this checkpoint.
- Several intermediate CI runs failed because of test/validator changes during this session; the formula-cell and strict-date validator fixes are now committed in 9d93d7394e397c4f0b142d86a7daef0cd99267ba. Do not treat the latest code as fully green until its Actions run completes.
- Still outstanding: XLSX read/write and formatted template generation, server-side CSV/XLSX preview and confirmation APIs, database conflict checks, transaction-safe parent/child persistence, error workbook, UI integration, relational CSV ZIP export and end-to-end round-trip tests. No XLSX package has yet been added to the backend dependency lockfile.


## Session update — 2026-11-25

- Revalidated exact prior HEAD `a00e885a7b35a531a1df788821ba5b0518e71f9c` Backend Tests: 89 passed, 1 failed, 4 skipped out of 94.
- The single failure was stale test-only expectation `shared_tenants`; the approved shared schema is `public`. Updated test title and both schema assertions.
- Test-only commit: `62d56b43dec7d51f38863d10661fa1ca4428577d`. CI for this new commit remains unverified at the time of this update.
- No runtime behavior, migrations, live DB, payment, deployment, or tenant data was changed.
- P0 audit still open: distinct `tenantId` / `companyId` token context, fail-closed resolver integration, Free/Trial signup to `public`, Paid provisioning, public RLS, PostgreSQL tenant migration baseline, and legacy routing removal after classification.


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

## 2026-11-25 — Paid tenant migration inventory hardening

- The super-admin read-only migration preview now captures schema-qualified PostgreSQL FK metadata, ordered child/parent column mappings (including composite keys), constraint validation state, deferrability and match type.
- Ownership classification now rejects missing FK column mappings, multiple ownership paths and unresolved cycles instead of choosing a table-name-only path.
- The inventory captures inbound and outbound cross-schema FK dependencies and blocks migration when any are present.
- Direct tables report tenant-owned row counts and NULL company_id rows. Dependent tables with a unique, validated ownership path report tenant row counts, orphan rows and nullable FK-reference rows.
- Direct tenant-owned child tables are checked for FK references to another tenant's direct parent rows. Cross-tenant references are reported as explicit blockers.
- Platform Admin Storage migration UI now shows ambiguous paths, cross-schema and cross-tenant FK counts, schema-qualified FK mappings, validation state, tenant rows, unowned rows, orphan rows and nullable references.
- Added unit/inventory coverage for composite FK mappings, ambiguous paths, cycles, unvalidated constraints, cross-schema dependencies, cross-tenant references, dependent row counts, orphan rows and unowned direct rows.
- GitHub Actions backend tests passed at commit 4e002466dde3ec9345d3900f73917f9e88db5c0a: 124 tests, 120 passed, 0 failed, 4 skipped. Frontend build passed at commit 8ca3c5a81e3a269355e34ea764f61c26ea26e881.
- The inventory remains strictly read-only against tenant data. Copy execution, schema creation, storage metadata changes and paid activation remain disabled. Disposable-PostgreSQL integration tests, reviewed table ownership manifest, backup/restore plan and migration cutover design are still required before any copy engine can be enabled.

## 2026-11-25 — Disposable PostgreSQL integration verification

- Added a dedicated GitHub Actions workflow using an ephemeral PostgreSQL 16 service; it creates isolated test schemas and drops them after the test.
- The real-database integration test passed at commit 26d1530fa7cc78cd3c9bc90db5d162342f606da3: 1 test, 1 passed, 0 failed. It verified catalog FK column-array parsing, direct and dependent row counts, nullable/orphan references, an unvalidated FK, cross-schema FK discovery and a cross-tenant direct-table reference.
- Backend CI also passed on the same commit: 125 tests, 120 passed, 0 failed, 5 skipped (including the opt-in PostgreSQL integration test). The normal backend suite keeps the PostgreSQL integration test skipped unless its dedicated test URL is configured; the dedicated workflow supplies an ephemeral database.
- This is disposable-database verification only. No live customer database, production migration, destination schema creation, tenant data copy or storage cutover was performed.


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

## 2026-11-26 P0 follow-up — domain-validation CI and retry constraint inspection

- Rechecked the exact domain-validation test commit `1d270ee54a9e6601814d06f9aae42ed0a1b21e40`: Backend Tests run `45727682757` and Tenant Migration PostgreSQL Integration run `45727682807` both completed successfully.
- Rechecked the later documentation-head runs: Backend Tests run `45727732196` and Tenant Migration PostgreSQL Integration run `45727732075` also completed successfully. This confirms the branch's latest documented state passed those two workflows; it is not a substitute for full end-to-end signup/login/employee CRUD verification.
- Inspected `backend/prisma/central.prisma`: `tenants.subdomain` and `tenants.custom_domain` are unique; `central_user_index` has a tenant-scoped unique constraint on `(email, company_id)` but no globally unique email constraint; `tenant_modules` is unique on `(tenant_id, module_name)`; `tenant_pricing_configs.tenant_id` is unique.
- The Central tenant model currently has storage lifecycle status/error/timestamp fields, but no explicit retry lease/claim token or lease-expiry field. Therefore a safe retry cannot be implemented by merely allowing an existing email/subdomain through validation: it needs a concurrency-safe claim mechanism and verified ownership of the existing inactive tenant/index rows, plus idempotent module/pricing initialization. Process-crash recovery remains unresolved; no retry behavior was changed in this increment.
- No production database changes, deployment, or changes to `main` were performed.

## 2026-11-26 P0 follow-up — durable provisioning lease schema foundation

- Added Central-only additive migration `backend/db-migrations/20261126_tenant_provisioning_leases.sql` with `storage_lease_token`, `storage_lease_expires_at`, and non-negative `provisioning_attempts`. It is transaction-wrapped, re-runnable, checks that `public.tenants` exists, and does not change tenant status, activate, retry, or delete records.
- Mirrored the fields and attempts constraint in `backend/prisma/central.prisma` and the fresh-install baseline `backend/prisma/central_schema.sql`. Documented Central DB targeting and backup requirements in `backend/db-migrations/README.md`.
- Added `backend/test/tenant-provisioning-lease-schema.test.js` to check migration idempotence markers, schema alignment, the non-negative constraint, and absence of lifecycle side effects.
- Code commits: migration `2647a1707c07707630eafbe56b44e783a4cc05b2`; Prisma model `b6d884f5aee70aaf4352e70b45e186a29c926e75`; baseline SQL `f3d5baa9136780bd29f5f3521418514cee33b661`; migration guide `c2e4cc36453e61f11904d3c133835cedcbd61af6`; schema test `4133d6c6f5e83b7e831a3e5f5202884bf8e49c43` (follow-up assertion correction `14867ea8bc01d6771d788bf1d98702a972f47efc`).
- Verification status: GitHub combined status and PR-associated workflow lookup returned no checks for the exact test commit, so this increment is **not yet CI-verified**. No local runtime database migration was run. The new fields are groundwork only: registration does not yet acquire, renew, or release leases, and no retry endpoint/behavior is enabled. Do not apply the migration to production until backup, review, and the application implementation are ready.
- Next: implement an atomic claim/reclaim operation using the lease token and expiry, reuse the existing Central tenant and admin index IDs only after strict identity/configuration matching, detect whether the operational seed transaction already committed, and activate only when the current lease token still owns the claim. Add concurrency and crash-window integration tests before enabling retry.
- No production DB changes, deployments, or changes to `main` were performed.


## 2026-11-27 P0 follow-up — initial signup lease ownership

- Initial tenant registration now creates an opaque storage_lease_token, a 30-minute storage_lease_expires_at, and provisioning_attempts = 1 in the same Central insert that creates the inactive tenant and inactive admin index.
- A seed failure may mark the tenant failed and clear lease metadata only when the failing request still owns the exact lease token.
- Final activation now requires the same lease token, a still-live lease, storage_status = provisioning, and an inactive tenant. Tenant activation and admin-index activation remain in one Central transaction; unexpected affected-row counts abort the transaction.
- Added regression assertions in backend/test/auth-provisioning-readiness.test.js for lease creation, token-guarded failure, and token/expiry-guarded activation.
- Code commits: initial lease-guard implementation 8aebab5bc4e8eb6b6e466064fea058adf5380d66; regression tests 43ca254d928d2e75aabb5473a0d57d29a7695735.
- CI status before this increment: exact previous branch head 0d8c0e3966002fe555af9648d718a526b28bf580 passed Backend Tests (run 45753835869) and Tenant Migration PostgreSQL Integration (run 45753835839). The new source/test commits require fresh CI verification.
- Important limitation: this is initial-registration lease ownership, not self-service retry/recovery. No public retry endpoint is enabled. Expired/failed records still need an ownership-proof design and idempotent seed detection before retry can be safe. The Central migration 20261126_tenant_provisioning_leases.sql must be applied to the Central DB before deploying this code; it has not been run.
- No production DB changes, deployments, or changes to main were performed.


## 2026-11-27 P0 security increment — customer-managed DB egress gate

- Public tenant registration now rejects customer-supplied local/external PostgreSQL targets by default with HTTP 503 and code CUSTOMER_DATABASE_CONNECTIONS_DISABLED. Managed-cloud registration remains available.
- Added a strict opt-in helper: CUSTOMER_DATABASE_CONNECTIONS_ENABLED must equal the literal string true. Deployment documentation states this flag may be enabled only after an outbound network policy is verified to block loopback, link-local, cloud metadata and unauthorized private infrastructure destinations.
- This is a fail-closed application gate, not an SSRF network defense by itself. Do not enable the flag merely because the database URL is PostgreSQL or DNS resolves; DNS rebinding/TOCTOU still requires network-level egress enforcement.
- Added unit coverage for default-disabled/strict-opt-in behavior and a source regression test for the signup gate.
- Commits: helper/config 6fd45c2b6cc1428aa1acf33aaa46ed951dbbd2f0; registration enforcement 7db722cbe54b888dff4f24e5c21a9823fef59eb8; config test 83a51e37d53d9a2cd2d2858cd5b745bae46410a2; signup regression test a78f656211ce71ed654e9a315d78344c4c928745; frozen decision d06e3f24878992f9c171e33cac6dcc4164df7f91.
- Prior exact branch head e6f727440f7e2d81c9808472b7993bc38efc3d12 passed Backend Tests and Tenant Migration PostgreSQL Integration (runs 46019432334 and 46019432286). New commits require fresh CI verification.
- No production database changes, migrations, deployments, or changes to main were performed.


## 2026-11-27 P0 verification — Razorpay mock bypass audit correction

- Re-inspected the current Razorpay `verifyPayment` handler. It rejects client-supplied truthy `mock` with HTTP 403 before checking the signature or mutating invoice/payment-order state. The old audit note claiming this bypass remained open was stale.
- Normal verification checks the server-created payment-order ledger, verifies the Razorpay HMAC signature, fetches the gateway order/payment, and requires captured payment matching invoice amount/currency/order.
- Added a regression assertion in `backend/test/razorpay-payment-verification.test.js` that the mock rejection precedes signature verification and invoice mutation.
- Test commit: 2cf1b45cd2a3a5e6d7f59c5da2e2a321002b2471; audit correction commit: da41e250c1cfbc20e01c4075f0b1998a51171a1a.
- This closes only the client-controlled mock flag issue; webhook, refund, replay and live-gateway end-to-end verification remain separate checks.
- New test/docs commits require fresh CI verification. No production payment or database actions were performed.


## 2026-11-27 — Auth tenant metadata readiness guard

- **Why:** The central authentication lookup already rejects inactive, non-ready and deleted tenants, but authService.getTenantInfo() independently fetched tenant metadata using only the tenant UUID and deleted_at IS NULL. That weaker predicate could expose stale plan/setup metadata if the helper is called from another flow or lifecycle state changes between lookups.
- **What changed:** backend/modules/auth/auth.service.js now requires is_active = true and storage_status = 'ready' in the metadata query, in addition to the existing UUID and non-deleted checks.
- **Regression coverage:** backend/test/auth-provisioning-readiness.test.js asserts the metadata query enforces all three lifecycle conditions.
- **Implementation commits:** code 1eddcec53390bd14ed92f2d6fc749f4bafc89403; regression test 6d5b7ca9e473ca0045d4fa8bc75755c83e9b2c9e.
- **Verification:** source-level regression test added; GitHub Actions for the exact resulting head must complete before this is considered CI-verified. No live database or login flow was exercised.
- **Safety:** no migration, production DB change, deployment, payment, or change to main.


## 2026-11-27 — Cycle 01 Phase 12 exact-head revalidation

- Added HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-12.md.
- Inspected branch source at cd400a602eb255029c1daeeae1d35f0c7b7ee948; exact file blob SHAs and findings are recorded in the phase report.
- Reconfirmed GAP-0020 (company WebSocket broadcasts reach every socket), GAP-0021 (Razorpay route references a missing handler), GAP-0031 (PostgreSQL integration suites can auto-skip in CI), GAP-0022 (company-wide leave list lacks leave.view gate), GAP-0029 (payroll controller omits req.db for three service calls), and GAP-0040 (attendance check-in argument mismatch).
- No application source changed. No test, boot, browser, database or live payment operation was run.
- Combined status at inspected SHA contained two successful external Railway contexts; GitHub Actions workflow lookup returned no runs for that SHA. Do not report these external statuses as test passes.
- Audit remains incomplete; root-cause consolidation, full module/data/RLS matrix, runtime harnesses, Cycle 01 plan and independent verification remain pending.

## 2026-11-27 — Cycle 01 Phase 13 PostgreSQL migration audit

- Added HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-13.md.
- Reconciled tenant Prisma PostgreSQL datasource with migration README: legacy tenant migration history is explicitly MSSQL/SQL Server and is not a valid PostgreSQL migration history. Added GAP-0041 (P1) for a safe, reconciled PostgreSQL baseline and migration replay strategy.
- Reviewed tenantMigrationInventory.js: inventory-only, validates identity/schema/FK ownership and returns copyAllowed=false. Recorded missing test/operational proof without misclassifying this safety control as a defect.
- Re-fetched GAP-0020 and GAP-0021 source evidence; both remain open pending runtime verification.
- No tests, boot, browser, DB, migration or application source changes were performed. No main-branch, production, payment, deployment or customer-data operation.


## 2026-11-27 — Cycle 01 Phase 14 tenant routing review

- Added HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-14.md.
- Recorded GAP-0042 (P1 security review): customer DB enablement helper is defined/exported but not directly enforced in the inspected storage resolver; resolver accepts local/external PostgreSQL modes. SSRF exploitability is not established pending config-write authorization, feature flag, provisioning and outbound network policy review.
- Revalidated positive source controls: authenticated tenant-context match, fail-closed storage resolver, UUID-bound schema naming and transaction-scoped central RLS helpers.
- Inspected storage resolver and RLS test source; tests were not executed and DB env variables may cause auto-skip under current CI (GAP-0031).
- No application code, runtime, DB, customer network, payment or deployment operations performed; main untouched.


## 2026-11-28 — Cycle 01 Phase 15 customer DB configuration audit

- Added `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-15.md`.
- Corrected Phase 14 interpretation: new tenant registration checks `customerDatabaseConnectionsEnabled()` before customer-managed DB preflight.
- Identified GAP-0043: active legacy Settings DB connection-test endpoint bypasses that flag and attempts a Prisma connection using request-supplied details; outbound reachability is a potential SSRF boundary, not runtime-proven.
- Identified GAP-0044: legacy DB config stores cloud URL/local password without encryption and returns cloud URL unredacted.
- Identified GAP-0045: legacy Settings UI/API persists to `tenant_db_config`, whereas current tenant routing consumes canonical `tenants` storage fields; UI includes non-PostgreSQL options despite PostgreSQL-only current architecture.
- Registration lifecycle source shows 30-minute lease, preflight, atomic tenant seed, failure state cleanup and token/expiry-checked activation. No separate recovery worker was verified.
- No tests/boot/browser/DB/network/deployment operations were performed; no app code changed. main untouched.


## 2026-11-28 — Cycle 01 Phase 16 PostgreSQL integrity and RLS audit

- Added `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-16.md`.
- Recorded GAP-0046: company-owned operational relations generally use single-column parent ID FKs, not composite company-aware constraints; cross-company reference rows not inspected.
- Recorded GAP-0047: central RLS policy coverage gaps for legacy tenant config models and unclassified global/webhook tables.
- Recorded GAP-0048: central SQL bootstrap defines no RLS policies; fresh-install policy application must be guaranteed.
- Recorded GAP-0049: static Prisma scan identified 30 FK columns without declared indexes among 55 relations; catalog/query-plan validation required before changes.
- Confirmed frozen architecture relies on company_id filters for operational DB isolation and warns of PostgreSQL table-owner RLS bypass. Production DB role not verified.
- Static source review only; no tests, DB connection, catalog query, migration, runtime or app code change. main untouched.


## 2026-11-28 — Cycle 01 Phase 17 backup/restore, API and deployment audit

- Added `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-17.md`.
- GAP-0050: backup scheduler is not started in inspected server bootstrap and compares a non-existent schema field (`backup_time` vs `schedule_time`).
- GAP-0051: Railway deploy runs a Central SQL migration on every start; migration errors are caught without a non-zero exit, allowing server startup to continue.
- GAP-0052: tenant backup only covers ready dedicated DB/schema; Central DB and MinIO files are excluded, include_files is unused, and restore drill is absent. Permanent deletion remains fail-closed.
- GAP-0053: dump artifacts are gzip-compressed but not application-layer encrypted before cloud upload (revalidates GAP-0035).
- GAP-0054: notification settings frontend route does not match the backend router mounts (revalidates GAP-0034).
- CI workflow definitions were inspected, but no current-HEAD workflow pass was verified. No app code, runtime, DB, backup, restore, migration, deployment, payment or customer-data operation was performed; main untouched.


## 2026-11-28 — Cycle 01 Phase 18 frontend/backend API contract mapping

- Added `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-18.md`.
- GAP-0055: employee address list endpoint requested by frontend is not declared by backend.
- GAP-0056: expense receipt upload path and multipart field differ between frontend and backend.
- GAP-0057: employee photo upload HTTP method differs (frontend POST, backend PUT).
- Reviewed core service/router prefixes for auth, employee, attendance, leave, payroll, compliance, dashboard, recruitment, performance, training, assets, expenses, settings, notifications and reports. This remains static route mapping; request/response and runtime verification pending.
- No application code, test, browser, DB, migration, deployment, backup, restore or payment operation performed; main untouched.


## 2026-11-28 — Cycle 01 Phase 19 onboarding/billing/platform API audit

- Added `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-19.md`.
- GAP-0058: Billing page order request fields differ from backend contract; Billing and onboarding also expect nested response data after the Axios interceptor already unwraps it.
- GAP-0059: onboarding payroll step calls missing `/payroll/salary-components` route.
- GAP-0060: dashboard/onboarding/Billing consumers double-unwrap API responses.
- Corrected GAP-0032: onboarding progress/save-step/complete routes now exist; missing salary-components endpoint remains.
- Corrected GAP-0033: company document upload/list/review endpoints now exist in mounted platform brand router; runtime verification remains pending.
- No app code, tests, browser, payment, DB, migration or deployment operation performed; main untouched.


## 2026-11-28 — Cycle 01 Phase 20 background jobs and runtime configuration

- Added `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-20.md`.
- GAP-0061: automation task queue is in-memory and has no startup recovery for persisted pending/running task rows.
- GAP-0062: environment template omits active ClamAV, customer DB, cloud tenant DB and Central direct URL variables; Razorpay settings documentation is stale.
- GAP-0063: MinIO credentials fall back to minioadmin/minioadmin and are not rejected by production startup validation.
- Health endpoint is process-only liveness, not dependency readiness. ClamAV upload scanning fails closed when unavailable.
- Source-only review; no app code, tests, services, DB, queue, backup, restore, migration, payment or deployment operation performed; main untouched.


## 2026-11-28 — Cycle 01 Phase 21 authentication and encryption audit

- Added `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-21.md`.
- GAP-0064: encryption helper retains a hard-coded fallback key; main server validates production env, but direct scripts/workers can bypass startup validation.
- GAP-0065: email-to-tenant resolution uses unordered LIMIT 1 despite multi-tenant email membership being allowed.
- Corrected stale security note: current authStore persist partialize excludes accessToken; it is memory-only and legacy values are purged.
- No app code, secret, DB, test, browser, migration or deployment operation performed; main untouched.


## 2026-11-28 — Cycle 01 Phase 22 P0 revalidation and gap reconciliation

- Added `HRMS_Blueprint/cycles/CYCLE-01-SOURCE-AUDIT-PHASE-22.md`.
- Reconfirmed GAP-0020 unscoped company WebSocket broadcast and GAP-0021 missing Razorpay webhook handler export.
- Corrected GAP-0030: operational RLS absence is intentional under frozen architecture; shared schema still requires company_id filters and negative tests.
- Recorded duplicate relationships across GAP-0034/0054, GAP-0035/0053, GAP-0006/0052, GAP-0032/0059 and GAP-0058/0060; GAP-0033 source-level endpoint absence superseded.
- No app code, runtime, test, DB, payment, migration or deployment operation performed; main untouched.


## 2026-11-28 — Cycle 01 plan drafted and independently verified

- Created `HRMS_Blueprint/cycles/CYCLE-01-PLAN.md` with P0/P1/P2 workstreams, dependencies, acceptance criteria, safety gates and a complete GAP-0001–GAP-0065 traceability matrix.
- Independent review Round 1 rejected the initial draft and required corrections R1–R8.
- Revised the plan; merged duplicate tasks, added missing HR route/navigation, legacy DB credential, encryption fallback and attendance metadata work, clarified pricing decision, and added access-token persistence regression test.
- Independent review Round 2 verified revised plan blob `7c3895a58e6553edaa4fdc346ed41be6e0ce4f4b`. Report: `HRMS_Blueprint/cycles/CYCLE-01-PLAN-VERIFICATION.md`.
- **Plan status: VERIFIED FOR IMPLEMENTATION PLANNING.** This does not authorize production migrations, deployments, real payments, destructive operations, customer DB connectivity or production key rotation.
- No application code changed in the plan/review work.


## 2026-11-28 — Cycle 01 Phase 23 P0 implementation

- Added `HRMS_Blueprint/cycles/CYCLE-01-IMPLEMENTATION-PHASE-23.md`.
- HRMS-D-001: WebSocket tickets now carry verified user/tenant/company identity; server socket registry and company/user delivery filter by exact tenantId + companyId. Event-notifier call sites propagate tenantId. Focused unit tests added. Live WebSocket integration remains pending.
- HRMS-C-002: current Razorpay webhook export and route wiring verified by router-load test. CI exposed an unterminated disabled PhonePe handler; removed dead commented implementation and closed handler.
- GAP-0021 missing-export defect marked Verified Closed; GAP-0066 added for the payment controller syntax blocker and verified closed.
- Backend Tests passed on exact SHA `97c60ad1ed3549d4c780c8506f871ada8e7cd1bb`: 171 tests, 166 pass, 0 fail, 5 skipped. This is not the latest branch HEAD; later auth/session commits require a fresh CI result.
- No production DB, real payment, live WS, migration, deployment or customer-data operation performed; main untouched.


## 2026-11-28 — Cycle 01 Phase 24 explicit tenant selection and session binding

- Added `HRMS_Blueprint/cycles/CYCLE-01-IMPLEMENTATION-PHASE-24.md`.
- HRMS-D-003: workspace choices are deterministic; no arbitrary tenant selection; frontend sends selected tenant UUID; backend checks request tenant; access/refresh tokens bind Central tenant and operational company IDs; refresh resolves signed tenant claims and rejects mismatch.
- GAP-0001 and GAP-0065 source fixes plus regression tests are implemented; remain Fixed — Awaiting end-to-end login/OTP/refresh verification.
- Backend Tests passed at SHA `3f495f016e8e56ecb6fc63770c836fc6e292ac7c`: 177 discovered, 172 passed, 0 failed, 5 skipped.
- Frontend Build passed at SHA `2b27b3c8a319f02a16b01f2fb9fd092d0cff380b`.
- Tenant migration inventory integration passed at SHA `3f495f016e8e56ecb6fc63770c836fc6e292ac7c`; it does not certify Central RLS.
- No production DB, real login, production token or customer-data operation performed; main untouched.


## 2026-11-28 — Cycle 01 Phase 25 Central RLS policy completion

- Added `HRMS_Blueprint/cycles/CYCLE-01-IMPLEMENTATION-PHASE-25.md`.
- Added `backend/db-migrations/20261128_central_rls_policy_completion.sql` with policies for all 17 Central Prisma models.
- Aligned `backend/prisma/central_schema.sql` with the same fresh-install policy set.
- Updated `rlsContext.js` and migration README with policy matrix and deployment safety gate.
- Added `central-rls-policy-parity.test.js`; backend CI passed at SHA `865d5f5d567f49b70967dbd82923047e7a870311` (183 discovered, 178 passed, 0 failed, 5 skipped).
- This is static source/CI evidence only. No live Central DB catalog, role ownership/BYPASSRLS, fresh install or migration execution was performed.
- Legacy Settings DB-config direct Prisma access is a precondition to resolve before rollout.


## 2026-11-28 — Cycle 01 Phase 25 Central RLS and CI

- Added Phase 25 RLS policy parity and zero-skip CI evidence in `HRMS_Blueprint/cycles/CYCLE-01-IMPLEMENTATION-PHASE-25.md`.
- All 17 Central Prisma models have RLS enabled and explicit policies in both incremental migration and fresh-install bootstrap.
- Added disposable PostgreSQL 16 Central/tenant DBs to backend CI; applies Central RLS migration only to test DB; creates non-owner app role; seeds auth/RLS fixtures.
- Backend Tests passed at SHA `c3790b43c30b5895fd2eb9b156ef939a54db2055`: 210 tests, 210 pass, 0 fail, 0 skipped. Auth middleware, RLS pooling, payroll, compliance and tenant migration integration tests executed.
- Tenant Migration PostgreSQL Integration also passed at the same SHA.
- GAP-0047/0048 are fixed in source with live role/catalog and clean-install comparison pending. GAP-0031 backend CI skip issue fixed; frontend E2E remains.
- Production Central RLS migration was not run. Legacy Settings direct Prisma access and actual deployed DB role ownership/BYPASSRLS remain rollout blockers.


## 2026-11-28 — Cycle 01 Phase 26 PostgreSQL migration baseline audit

- Added `HRMS_Blueprint/cycles/CYCLE-01-IMPLEMENTATION-PHASE-26.md`.
- Confirmed no canonical PostgreSQL Prisma migration history at `backend/prisma/migrations`.
- Legacy directory is misnamed `migrations     11223`; migration lock says MSSQL and initial migration is SQL Server DDL.
- Central and tenant schemas require separate migration histories because they target separate PostgreSQL databases.
- Railway invokes a Central SQL migration at app start; the script catches errors and continues, so a failed migration does not block startup.
- No DB connection, baseline generation, migration, deploy or customer-data operation performed.

---

## 2026-11-28 — Cycle 01 Phase 28 ownership regression increment

- Code commit: `2254f855b884deb51f7f7783d6acae17fd6523c3`.
- Attendance holiday deletion now scopes the holiday to company; controller maps non-owned/missing holiday to 404.
- Employee bank-account update/delete and document deletion now validate the employee's company and active state before child lookup/write.
- Payroll controller now passes `req.db` to getPayslip/updatePayslip/removeBonus; service binds payslips to company-owned runs/employees and bonuses to the requested run and company employee.
- Training detail employee join now filters by company and excludes foreign-company child records.
- Added `backend/test/ownership-regression.test.js`.
- Backend Tests run 46105770148: 258 tests, 258 pass, 0 fail, 0 skipped. Tenant Migration PostgreSQL Integration run 46105770068: 1 pass, 0 fail, 0 skipped.
- Frontend Build run 46104588048 passed at `cb3ebff3cc1fabd0c189ece8df09a01efcf82bd5`; compare confirms no frontend source changes since that SHA.
- Re-analysis: HRMS-A-010 and HRMS-D-004 remain open. HRMS-D-003 has a forgot-password arbitrary workspace selection residual (GAP-0065). No production operation performed.


## 2026-11-28 — Cycle 01 Phase 29 password-reset workspace binding

- Resumed the exact Phase 28 handoff task: `HRMS-D-003`, residual `GAP-0065`.
- Confirmed the forgot-password route used an unordered Central `LIMIT 1` membership fallback and could select the wrong workspace. The prior implementation also risked writing the reset token in `req.db` while delivering email through a different tenant client.
- Added `backend/shared/utils/passwordResetWorkspace.js` and `backend/test/password-reset-workspace.test.js`.
- Updated `backend/modules/auth/auth.routes.js` to require an eligible explicit workspace when membership is ambiguous, reject request-host/body mismatch, and use one selected tenant DB for reset-token storage and email delivery.
- Updated `frontend/src/pages/auth/ForgotPasswordPage.jsx` to display workspace choices for multi-membership emails and clear stale selections when the email changes.
- Code commits: helper `3a6a8f8d388c28346fb139a5f307afa1c7102328`; tests `ffca840d666112c3bcf63bdb08f86b0e24ce3be7`; backend route `1b3bc154b44b9bb796aaa7d6ce810ea5c01eea34`; frontend `2891a1107b66a754d7319dda0d43604465416272`; stale-selection fix `e644c3b5e233257c1359ed53b2daef4a1aa9dd5d`.
- Documentation report: `cycles/CYCLE-01-IMPLEMENTATION-PHASE-29.md`.
- Test execution and exact-head CI: **Pending / Not Verified**. Do not close GAP-0065 or HRMS-D-003 until these checks and authenticated password-reset E2E pass.
- No production DB connection, SQL, migration, deployment, real payment, credential change, destructive action or customer-data modification. `main` untouched.
- Next exact task after verification: resume `HRMS-D-004` operational ownership/query matrix and composite same-company FK review.


## 2026-11-28 — Cycle 01 Phase 30 PostgreSQL ownership inventory and OTP isolation

- Resumed HRMS-D-004 from the Phase 29 handoff.
- Created `cycles/CYCLE-01-POSTGRES-OWNERSHIP-INVENTORY-PHASE-30.md`: all 82 operational Prisma models and 17 Central models are classified by ownership/policy intent.
- New finding GAP-0067 (P1): OTP records were stored by raw email + purpose in the shared public operational schema. Phase 30 added `backend/shared/utils/otpIdentity.js`, used by both OTP creation and verification; route now passes the immutable Central tenant UUID into verification.
- Added `backend/test/otp-tenant-isolation.test.js` (six focused tests). Tests and exact-head CI have not yet been executed/observed; GAP-0067 is Fixed — Awaiting Verification.
- Central RLS helper and policy source review completed at static level. Production/deployed role ownership, superuser/BYPASSRLS, grants and live catalog evidence remain pending.
- HRMS-D-003 and HRMS-D-004 remain In Progress. Full query-by-query service/worker/report/export/WebSocket review and composite FK feasibility remain open.
- Phase 30 plan and independent plan verification: `cycles/CYCLE-01-PLAN-PHASE-30.md` and `cycles/CYCLE-01-PLAN-VERIFICATION-PHASE-30.md`.
- Code commits: `e884c37ad792c9f7c6c96797f5ba26761d83251e`, `9c73d007630c3447c7b7b7cb56ecad421233ba50`, `5d51ff1ff06c4616f64974f57d5c88565b9b0c5a`, `9e0432b1520622a5661874b492076f7186ec16c5`.
- No production DB connection, SQL, migration, deployment, payment, deletion, credential rotation or customer-data mutation. `main` untouched.
