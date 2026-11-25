# PostgreSQL Tenant Isolation — Implementation Progress

**Branch:** `architecture/postgres-tenant-isolation`  
**Updated:** 2026-11-24

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
