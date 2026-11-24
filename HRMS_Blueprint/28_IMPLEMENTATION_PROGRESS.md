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
- Backend Tests passed on commit `d9871bd973c3fb641bdb63349a47efbd4346cea5`: 59 tests, 55 passed, 0 failed, 4 skipped (database-dependent RLS checks skipped because no test database URL is configured).


### Latest CI confirmation — 2026-11-24
- Commit `743fc8f877fb6362787c31eb34b3b21430c52d05`: Backend Tests **success**, Frontend Build **success**.
- Backend test summary on `d9871bd973c3fb641bdb63349a47efbd4346cea5`: 59 total, 55 passed, 0 failed, 4 skipped.
- The current branch head includes subsequent documentation commits; their Backend Tests workflow runs were still in progress at the latest check. The most recent code commit's frontend and backend checks are green.
- Branch comparison: 259 commits ahead of `main`, 0 behind. `main` has not been modified.
