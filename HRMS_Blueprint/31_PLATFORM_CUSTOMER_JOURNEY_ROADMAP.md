# Platform Customer Journey — Priority Roadmap

**Status:** Active priority after the single-gateway payment decision  
**Working branch:** `architecture/postgres-tenant-isolation`  
**Scope:** Public signup, tenant registration/provisioning, plan selection, subscription activation, first-time company setup, document submission/review, and handoff to the HRMS dashboard.

## Product decision

- Razorpay is the only enabled customer billing gateway for launch.
- PhonePe, JioPay, and other payment methods are deferred and must be displayed as **Coming soon** where payment methods are shown. They must remain blocked server-side.
- Payroll payouts are not customer subscription payments. Automated payouts remain disabled until a real provider integration and reconciliation flow exist.
- Company identity capture must support GSTIN for GST-registered businesses and PAN for businesses without GST registration. Prefer authorised, direct access to official GST-system data; do not make an unverified third-party lookup service the source of truth. GST portal CAPTCHA must never be bypassed. If an authorised machine-to-machine integration is unavailable or the official portal requires CAPTCHA, present a user-assisted official verification step in the signup flow and let the user complete the CAPTCHA. Store the source, verification timestamp, and result status; treat prefilled details as unverified until confirmed.
- PostgreSQL is the only database engine in the current product scope. Deployment mode is a separate choice: Syntern-managed cloud, customer-managed cloud/server, or offline/self-hosted. Do not imply every mode is self-serve today: expose only modes with a tested provisioning/install path, and label the rest as assisted setup. Keep credentials out of browser storage and logs.
- Trial signup must be deliberately short. Collect only the minimum needed to create and secure the workspace (company identity/name, one verified admin contact, login credential, required consent, and GSTIN or PAN only when applicable/needed). Defer optional profile fields, branches, departments, payroll configuration, document uploads, branding, SMTP, and backup setup until after the first successful login. Ask only for information necessary for the next action (progressive profiling).
- Do not expand secondary HRMS modules ahead of a reliable customer acquisition and onboarding journey.

## Current code observations (branch audit)

1. `POST /api/v1/platform/register` is public and handled by `registerTenant` in `backend/modules/platform/platform.service.js`.
2. Registration validates company name, consent, admin email/name/password, and subdomain; it checks duplicate GSTIN, subdomain, custom domain, admin email, and phone.
3. Registration creates the central tenant and central user index, provisions default modules and pricing configuration, sets an initial trial expiry, then provisions/seeds the tenant database. The tenant is activated only after schema and admin seeding report success.
4. The registration response returns tenant/portal information and says the customer should use the password chosen during registration. This code path does not itself return an authenticated access token. The frontend registration page has four steps: Company, Database, Admin, Done.
5. The current onboarding wizard starts at plan selection, then offers organisation, branding, work settings, payroll, email, compliance credentials, cloud backup, and launch steps.
6. The plan-selection component submits `method: 'razorpay'`. It now visibly identifies Razorpay as enabled and PhonePe/other providers as coming soon.
7. The public company-registration page currently exposes cloud, local, hybrid, and external database choices. For a self-serve SaaS launch, managed Syntern Cloud should be the default path; on-premise/BYOD database setup should be an assisted/advanced path until those provisioning modes are fully supported and tested.
8. The wizard calls `POST /platform/onboarding/save-step`. In `backend/modules/platform/brand.routes.js`, the handler persists the branding logo and backup configuration, but acknowledges other steps without persisting their supplied data itself.
9. The wizard calls `POST /platform/onboarding/complete`; that route was not found in the inspected platform route file or GitHub code search. Verify route registration and implement it before treating onboarding completion as reliable.
10. The inspected platform onboarding flow has a logo upload step, but no company-document submission/review flow or tenant document endpoint was found in the inspected route/code search. This is a gap to design and implement, not an assumed existing capability.
11. The trial activation controller contains development-only fallback success responses when central database reads/writes fail. These must not be mistaken for real persisted trial activation and should be removed or isolated from the customer production path.
12. The registration service sets up trial state during tenant registration. Trial activation is also a separate subscription controller operation. Define one authoritative lifecycle so trial start/expiry cannot be unintentionally reset or diverge.
13. Plan selection previously exposed an automatic-renewal choice and described automatic charge attempts, but the inspected billing cron only generates invoices and checks overdue invoices; it does not perform recurring gateway charges. The plan UI now offers manual renewal only until a real recurring-payment mandate/flow is implemented.

## Implementation progress — 24 November 2026

The following first-pass registration changes have been committed to the working branch:

- New registration UI offers only managed Syntern PostgreSQL, customer-owned PostgreSQL server (online/offline), and customer-owned cloud PostgreSQL. MySQL, SQL Server, SQLite and the unsupported hybrid choice are no longer offered in the new-registration UI. Legacy resolver branches remain for existing tenants; they are not new-registration options.
- Backend registration now defaults an omitted deployment mode to managed cloud and rejects unsupported new-registration modes, non-PostgreSQL local engine values, and non-PostgreSQL external connection URL schemes.
- Registration accepts either a syntactically valid GSTIN or PAN; if both are supplied, PAN must match the PAN segment in GSTIN. The frontend now exposes the PAN-only route and makes company email optional.
- The frontend now submits the actual consent checkbox state rather than hardcoding consent to true.
- GST lookup's provider chain now uses only the official-source function. The existing assisted official-portal CAPTCHA flow remains; automated CAPTCHA solving and third-party fallback are not part of the registration lookup chain. GST CAPTCHA documentation has been rewritten to remove previous automated-solving claims.

**Not yet complete:** official GST API/access authorisation has not been independently verified; live portal CAPTCHA behaviour has not been tested; PAN-only data enrichment is not yet implemented (PAN is currently accepted as a business identifier, not a promise of full profile lookup); customer-hosted/offline PostgreSQL provisioning is not yet certified end-to-end; trial signup still needs a broader UX reduction and backend registration/provisioning tests. No live migration or production action was performed.

## Implementation progress — onboarding persistence

The next onboarding slice has been implemented on the working branch:

- Added `tenants.onboarding_progress` JSONB metadata to the central Prisma model and canonical SQL schema, plus a separate additive migration file.
- The authenticated `POST /onboarding/save-step` route now validates step names and persists completion/skip markers against the authenticated tenant. It does not copy client-supplied credentials or arbitrary step data into the progress JSON.
- Backup credentials continue through the existing dedicated backup configuration helper; branding logo URLs are accepted only over HTTPS.
- Added authenticated `POST /onboarding/complete`. It checks the tenant is active and requires persisted markers for organisation, work settings, payroll, email, compliance, and backup before setting `is_setup_complete=true`. Missing steps return a 409 with their keys.
- Updated wizard step handlers to persist completion/skip markers, stopped silently swallowing department/designation and salary-component creation errors, and removed the obsolete PhonePe return-to-onboarding checkout handler.

**Important rollout requirement:** the new SQL migration has been committed but has NOT been applied to any database. Apply it only after backup and environment confirmation. Generate the central Prisma client after schema change before deploying. Full frontend/backend tests and PostgreSQL integration tests have not yet been run.

**Known onboarding follow-up:** compliance portal credentials are intentionally deferred from this progress endpoint because it is not a secure credential store; the UI should direct customers to the dedicated secure settings flow for PF/ESI credentials. The wizard currently records that step as deferred/skipped rather than falsely claiming those credentials were saved.

## Target customer journey

### Phase 1 — Signup and identity

**Fast-start principle:** keep trial registration to the minimum required fields and defer optional setup. Use progressive profiling after the customer reaches the workspace; do not make a trial user complete the full implementation checklist before seeing the product.

**Business identity lookup:**
- Ask whether the business is GST-registered. If yes, collect GSTIN; otherwise offer PAN as the alternative identifier.
- Prefer an authorised official GST portal/API integration for GSTIN lookup and prefill. Confirm current portal/API terms and permitted access before implementation; do not automate around or defeat CAPTCHA. The current GST automation code/documentation describes audio-CAPTCHA transcription, OCR, and fallback sites (including KnowYourGST/Tally); this is not the desired final behaviour and must be replaced or disabled for signup.
- If official lookup requires CAPTCHA or no permitted API is available, embed/redirect to an official user-assisted verification step where feasible, or show a clear CAPTCHA/manual verification step in the registration journey. The customer solves it; the system then validates and records the returned details/status. Do not use OCR, audio-to-text, CAPTCHA-solving services, or a third-party site as an automatic fallback.
- Use PAN-based lookup only through an authorised source and only for fields legally available. Do not promise a complete PAN profile where official access does not provide one.
- Let the user review and correct fetched details. Record verification source, time, and status, and distinguish `prefilled` from `verified` data.

- Short public trial signup: company name, one admin identity/contact, login credential, mandatory consent, and the applicable GSTIN or PAN identifier. Collect only fields proven necessary by backend provisioning and legal requirements.
- Keep optional fields out of the initial trial gate. Ask for legal address, branches, departments, designations, shifts, payroll details, documents, branding, SMTP, and backup configuration progressively after first login, when the customer reaches the relevant feature.
- Provide a GSTIN path for GST-registered businesses and a PAN path for businesses without GST registration, following the official-source/CAPTCHA rules above.
- Validate fields on both client and server; normalize email, phone, GSTIN, PAN, and subdomain consistently.
- Add email/phone verification and safe retry/resend behavior before granting normal workspace access.
- Prevent duplicate signup races with database uniqueness constraints and idempotent registration handling.
- Never expose password hashes, database credentials, or raw internal provisioning errors.
- Provide a recoverable pending-provisioning state if tenant creation succeeds centrally but schema clone/seed fails.
- Registration must not claim the tenant is ready until database/schema provisioning and admin-user creation are confirmed.

**Acceptance:** one customer signup creates one tenant, one initial admin identity, and one auditable provisioning lifecycle; duplicate/retried submissions cannot create duplicate workspaces.

### Phase 2 — Tenant provisioning and account activation

**Database engine and deployment model:** PostgreSQL only for this release. During signup, default to Syntern-managed cloud for the fastest trial. Offer customer-managed cloud/server and offline/self-hosted PostgreSQL as deployment choices only where installation, connectivity, backup, upgrade, and support procedures are documented and tested; otherwise route them to assisted setup rather than presenting an unimplemented self-service wizard. Cloud, customer-hosted, and offline are deployment modes—not separate database engines.

- Use one explicit provisioning state machine, e.g. `pending_verification`, `provisioning`, `active`, `provisioning_failed`, `suspended`.
- Persist each stage and error code safely; support idempotent retries for schema creation, template cloning, and seed operations.
- Keep `is_active` and `is_setup_complete` separate: an authenticated tenant can exist while setup is incomplete; dashboard access should be governed by the setup gate.
- Issue login/session credentials only after identity verification and successful provisioning.
- Add admin recovery/support workflow for incomplete provisioning; never leave an unusable tenant silently marked ready.

**Acceptance:** every tenant can be traced from signup through provisioning to activation, and failed stages can be safely retried without duplicate data.

### Phase 3 — Plan, trial, subscription, and billing

- Show plan comparison, employee caps, included modules, add-ons, billing term, taxes, discounts, and final payable amount from server-calculated pricing.
- Clearly distinguish free plan, eligible trial, and paid subscription.
- Razorpay only for paid checkout; show PhonePe/JioPay/others as Coming soon, non-interactive.
- Persist the server-side plan/add-on/employee-count/term/promo snapshot with the gateway order.
- Verify Razorpay signature and fetch order/payment from Razorpay server-to-server; require exact tenant, amount, currency, order linkage, and captured state.
- Activate entitlement, pricing configuration, paid invoice, and payment ledger atomically.
- Handle cancelled, pending, failed, duplicate, delayed-return, and webhook-retry cases without false activation.
- Do not claim automatic renewal until a supported mandate/recurring-payment agreement is implemented and tested. The launch plan UI therefore offers manual renewal only.

**Acceptance:** no plan or paid entitlement can be activated from a browser-only success signal or mismatched payment.

### Phase 4 — Company setup

- Persist each step instead of merely acknowledging it.
- Capture legal entity details, address, GSTIN/PAN where applicable, company contacts, branches/locations, departments, designations, work calendar, shifts, holidays, and branding.
- Make steps resumable across sessions/devices; show saved, pending, skipped, and action-required states.
- Allow non-blocking settings such as branding or SMTP to be completed later.
- Validate that selected plan entitlements and employee limits are enforced by the backend.

**Acceptance:** leaving and returning to the wizard restores saved data; every completed step corresponds to persisted tenant data.

### Phase 5 — Company document submission and review

- First define a configurable document checklist by entity type, jurisdiction, and business policy. Do not assume every customer must submit every document.
- Support appropriate company proof, tax registration proof, address proof, and authorized signatory evidence where required.
- Validate file type, size, malware scanning, storage permissions, and tenant ownership server-side.
- Store metadata (document type, object key, checksum, size, uploader, uploaded time, version, review status, reviewer, review notes, expiry where relevant); store files in private object storage, not public URLs.
- Use statuses such as `not_required`, `pending_upload`, `submitted`, `under_review`, `approved`, `rejected`, and `resubmission_required`.
- Provide a secure reviewer workflow, audit trail, rejection reason, and resubmission path.
- Never put passwords, OTPs, or sensitive credentials in document metadata or ordinary onboarding JSON.

**Acceptance:** a tenant can submit required files, see their review state, replace rejected files, and access only its own documents; reviewers can approve/reject with a complete audit trail.

### Phase 6 — Launch readiness and dashboard handoff

- Add a persistent onboarding checklist and percentage/status summary.
- Define required vs optional steps; do not block launch on optional SMTP, backup, or branding settings unless policy explicitly requires them.
- Implement a real backend completion endpoint that checks required persisted state and tenant provisioning before setting `is_setup_complete`.
- Ensure incomplete tenants are routed back to the correct step after login.
- Provide a clear completion screen and enter the dashboard only after the backend confirms completion.

**Acceptance:** frontend completion cannot bypass backend requirements; setup status remains correct after logout/login and on another device.

## Implementation order

| Priority | Workstream | Required result |
|---|---|---|
| P0 | Fast trial signup and business identity | Minimal required fields; GSTIN/PAN path; official-source lookup with user-assisted CAPTCHA where required |
| P0 | PostgreSQL deployment modes | Managed cloud default; customer cloud/server and offline/self-hosted modes accurately gated by tested install paths |
| P0 | Registration/provisioning audit and repair | Safe, idempotent signup and recoverable tenant creation |
| P0 | Onboarding persistence/completion | Real save-step persistence and a working completion endpoint |
| P0 | Plan/subscription correctness | One trial lifecycle; Razorpay-only paid activation; reliable entitlement |
| P1 | Company profile and locations | Persist legal details, branches, departments, designations and shifts |
| P1 | Company document workflow | Private uploads, checklist, review, rejection/resubmission, audit |
| P1 | Onboarding UX | Resume, progress, clear required/optional states, dashboard gating |
| P2 | Customer support/admin console | Provisioning repair, document review, subscription visibility |
| P2 | Main HRMS operational modules | Prioritize employee directory, attendance/leave, payroll/compliance after platform journey |

## Engineering safeguards

- Work only on `architecture/postgres-tenant-isolation`; do not modify `main`.
- No live database migrations, live payment transactions, or production credential changes without explicit approval.
- Do not use development fallbacks to report successful persisted registration, trial activation, or payment.
- Keep payment-provider credentials in deployment secret storage; never commit secrets.
- Add tests at service boundaries: duplicate signup, provisioning retries, partial failure cleanup, tenant isolation, persisted onboarding steps, completion gate, document ownership, and subscription payment idempotency.
- Run the complete backend suite and frontend build/lint against the exact candidate commit. Report missing CI checks honestly.

## Immediate next engineering tasks

1. Trace the frontend registration form to the backend `/platform/register` request; simplify trial signup to minimum required fields and verify post-registration login/session behavior.
2. Audit official GST portal integration options and terms. Implement direct authorised lookup if available; otherwise design a user-assisted official CAPTCHA/verification handoff. Add PAN as the non-GST alternative without relying on an unverified third-party data source.
3. Audit PostgreSQL deployment modes separately from database engine support; default trials to managed cloud and expose customer-hosted/offline choices only when their provisioning paths are tested.
4. Trace platform route mounts and confirm whether `/platform/onboarding/complete` is actually registered; implement a backend completion route only after identifying the intended required-step rules.
5. Replace the acknowledgement-only behavior in `/platform/onboarding/save-step` with real persistence for supported steps; add a persisted onboarding progress model/table if no safe existing store exists.
6. Define and implement the tenant document data model and private upload storage integration after checking the existing MinIO/file-upload infrastructure.
7. Unify trial activation so registration and the trial endpoint cannot reset or diverge the trial period.
8. Add automated tests and run the full suite before claiming the journey complete.


## Implementation progress — latest continuation (2026-11-24)

- Added `GET /platform/onboarding/progress` so the authenticated tenant can retrieve persisted step markers and setup-complete state.
- Updated the onboarding wizard to resume at the first step without a persisted completion marker after reload/login. Existing marker persistence remains the source of truth.
- Removed PF/EPFO and ESIC password fields from initial onboarding. The screen now clearly states that portal credentials are deferred to Settings; no user is led to believe those values were saved.
- Removed development-only trial success responses when the central database lookup or transaction fails. Trial activation now fails closed if it was not persisted.
- Fixed the Express route-registration defect caused by missing subscription payment controller exports. The endpoints now have a Razorpay-only order and server-side capture-verification implementation with a persisted payment-order snapshot and transactional plan/module activation. Manual renewal is enforced; PhonePe, JioPay and automatic renewal remain blocked. This code path is committed but **not yet verified end-to-end** against Razorpay test mode and a migrated staging database. A paid subscription invoice/receipt record is not yet created by this activation transaction and remains a release item.
- Backend dependencies include Multer and MinIO, but a tenant-scoped private document upload/review flow has not yet been implemented or verified. Do not expose uploads until object-storage configuration, private bucket policy, file validation, malware scanning strategy, tenant ownership checks, reviewer audit trail and authorized download are in place.
- The onboarding progress API depends on the previously added `onboarding_progress` central schema migration. It has **not** been applied to a live database; Prisma client generation and automated tests remain pending.

### Remaining release blockers

1. Implement and test the complete Razorpay-only subscription payment/activation transaction; keep manual renewal only.
2. Implement private company-document upload, review, rejection/resubmission and audit workflow using the existing storage dependencies only after confirming deployment configuration.
3. Apply the central schema migration in a controlled non-production environment, regenerate Prisma, and run backend tests/frontend build.
4. Verify wizard save-step endpoints and the resume/complete path end-to-end against a migrated test database.


## Implementation progress — subscription, documents and migration package (2026-11-24)

- Replaced the temporary subscription 503 handlers with a Razorpay-only checkout path. It calculates price on the server, uses the authenticated tenant, snapshots the selected plan/add-ons/term/price in `payment_orders`, checks Razorpay signature and fetches the order/payment from Razorpay before activation. Activation updates the payment ledger, tenant plan/expiry, module entitlements and tenant pricing configuration in one central transaction. Renewal is fixed to manual; non-Razorpay providers and automatic renewal are rejected.
- Subscription checkout derives employee count from the tenant database rather than trusting the browser. It refuses to create another order while an open subscription order exists. A partial unique index in the new migration enforces this at database level too.
- Trial activation now refuses to reset an existing trial/paid plan and uses a conditional update inside a transaction to prevent concurrent duplicate trial activation.
- Added a company document onboarding step with GST certificate, company PAN, incorporation certificate, address proof, bank proof and other categories. Customers can upload, view status and skip explicitly.
- Added private MinIO object storage metadata flow, 10 MB limit, PDF/JPEG/PNG content-signature checks, ClamAV INSTREAM scanning, tenant-scoped metadata queries, five-minute signed download links, platform review queue/download/status endpoints, and append-only reviewer history. Uploads fail closed if private storage or ClamAV is not configured. No public document URL is exposed.
- Added central migration `20261124_company_document_workflow.sql` with document metadata, review history, tenant RLS policies and one-open-subscription-order uniqueness. Updated the central schema reference and migration instructions.
- Added basic ClamAV scanner validation tests. These have not yet been run in a connected checkout.


- Hardened the platform document review endpoint: reviewers now use a row lock, allowed status transitions, and an audit entry recording both the prior and new status. Approved documents are terminal; rejected/resubmission-required documents can return to review.
- Corrected the transaction-local tenant RLS context call in subscription activation to use Prisma's query API for `SELECT set_config(...)`.

## Implementation progress — office-hours code pass (2026-11-24)

- Corrected monthly billing Prisma relation names to match the central Prisma schema (tenant_pricing_configs and tenant_modules) in both the tenant query and pricing calculation.
- Monthly billing now excludes free and trial tenants, enforces manual collection even if legacy pricing metadata says automatic renewal, and uses duplicate-safe invoice insertion so overlapping/retried cron runs do not create duplicate monthly invoices.
- Successful Razorpay subscription activation now creates a paid subscription invoice and links it to the captured payment-order ledger in the same database transaction as plan/module activation. If invoice creation fails, the transaction rolls back the activation and payment-ledger claim.
- No database migrations were run and no database connection was used during this pass. Code execution, Prisma generation, automated tests and GitHub Actions remain unverified.

### Current rollout state

- Code and migration files are committed to `architecture/postgres-tenant-isolation` only. `main` remains unchanged.
- The central database migrations are **prepared but not applied**. No database connection or environment target was available in this workflow, so no staging or production database was modified.
- Before enabling paid checkout, apply the payment ledger, onboarding, storage lifecycle/inventory and company-document migrations in staging; regenerate the central Prisma client; configure Razorpay test credentials, private MinIO and ClamAV; then run end-to-end checkout and replay/idempotency tests.
- Before enabling document uploads, verify MinIO private bucket policy and ClamAV daemon reachability in the deployment environment. Uploads intentionally return 503 until both are ready.
- Latest GitHub status lookup returned no CI statuses or workflow runs for the inspected commit. Automated tests, Prisma generation and frontend build remain unverified.


## Platform company-document review UI (2026-11-24)

- Added a platform-admin Document Review screen at `/admin/documents`.
- Connected the screen to the existing authenticated review queue, short-lived secure download, review-history, and status-update endpoints.
- Added review actions for the supported state machine: submitted → under review / approved / rejected / resubmission required; rejected or resubmission-required → under review; approved remains terminal.
- The queue refreshes periodically and can be refreshed manually. Reviewer notes are limited to 2,000 characters in the UI and backend.
- This is a code implementation only. Frontend build, browser workflow, role/permission checks against a running environment, object-storage access, and database migration remain unverified.


## Global frontend design system (2026-11-24)

- Reworked `frontend/src/styles/theme.css` as the central source for typography, font weights, spacing, radii, layout dimensions, surfaces, text, borders, shadows, and semantic status colours.
- Set a macOS-inspired light appearance as the default for new preferences, retaining the dark appearance through the existing theme toggle.
- Increased the root text scale to 16px and set the base UI font size to 15px for improved readability.
- Added shared focus-visible, reduced-motion, disabled-control, and text-selection defaults.
- Existing screen-specific CSS still needs a systematic token migration and visual QA; central tokens are now available, but this does not mean every legacy hard-coded colour has already been removed.
- Frontend build and cross-screen accessibility/contrast checks have not yet been run.
## Platform admin menu integration pass (2026-11-24)

- Repaired the Document Review screen's handling of the standard API response envelope so the queue and review history render returned records instead of appearing empty.
- Connected Platform Analytics to the existing /platform/admin/stats endpoint rather than a non-existent analytics endpoint; corrected the plan-catalog response parsing.
- Connected Marketing settings to the existing platform settings API and maps the stored hero heading/subheading fields into the editor.
- Corrected tenant list, custom-domain list, client-detail, module and notification response parsing to unwrap the API's { success, data } envelope.
- Corrected Dashboard links so recent sign-ups and account alerts navigate to the actual /admin/clients routes.
- Made Platform Settings edits section-scoped, prevented masked credentials from being resubmitted as literal secrets, and reloads saved settings after a successful update.
- The admin top bar now identifies the active section, and the sidebar becomes horizontally navigable on narrow screens.
- These are source-level integration fixes. No frontend build, live API request, browser QA, automated test or database migration was run during this pass. The remaining work is to complete functional editing for currently informational Marketing subsections, finish legacy theme-token migration, and validate every menu against a running staging environment.
## Admin menu completion pass — continued (2026-11-24)

- Fixed the platform admin top-bar title so it actually renders the active menu name (the earlier layout calculation was present but the markup still showed a hard-coded Dashboard title).
- Added a public read-only marketing-content endpoint that returns only approved landing-page copy fields; it does not expose platform settings secrets.
- Connected the public landing page to saved hero heading, subheading, CTA label, CTA destination (restricted to same-origin paths), and CTA helper text. Marketing edits now affect the live landing page after save.
- Corrected the marketing editor's save payload to persist the exact field names consumed by the public endpoint.
- Corrected Platform Settings SMS sender field naming, removed the unsupported paid GSP option in favour of the official GST portal assisted flow, aligned theme colour examples with the macOS-inspired light palette, and clarified that stored Theme/Security values are not runtime-applied yet.
- Corrected the Plans Analytics screen guidance to point to the actual Pricing & Plans menu instead of a non-existent settings section.
- Changed the Domains screen to label mappings as unverified and stop claiming SSL is active without a DNS/certificate verification integration.
- GitHub Actions exposed two existing PhonePe unit-test failures caused by expired hard-coded token expiry timestamps in test fixtures. Updated those fixtures to use a future expiry timestamp; this does not enable PhonePe as a payment option.
- CI was observed running backend tests on these commits. The failing run had 45 passing, 2 failing, and 4 skipped tests; the two failures were the stale PhonePe test fixtures. The corrected commit's result is pending and must be checked before calling the backend suite green.
- Frontend build, browser QA, and database-backed integration checks remain unverified. Database migrations and deployment remain on hold.
## Verification update — admin work (2026-11-24)

- Added a dedicated frontend GitHub Actions workflow that installs the locked frontend dependencies and runs the production Vite build on changes to frontend files.
- The first frontend build exposed a malformed line-break insertion in the new public marketing-content effect. Corrected it immediately; the frontend production build then completed successfully on commit 651bc7e681251f90b28961a2506d4a82988d79bd.
- Backend GitHub Actions completed successfully on the preceding commit 23d112f6 and on later commits through b64cd112. The backend run for commit 651bc7e6 was still in progress at the time of this note.
- Added custom-domain validation on both the admin form and backend tenant update route; invalid hostnames, URLs, ports and paths are rejected. DNS/SSL are explicitly shown as unverified until deployment-level checks exist.
- The admin platform menus have code-level integrations and responsive styling, but this does not certify a production rollout. Live DB/API tests, DNS/SSL provisioning verification, browser/accessibility QA and deployment remain outstanding.