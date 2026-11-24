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

## Target customer journey

### Phase 1 — Signup and identity

**Fast-start principle:** keep trial registration to the minimum required fields and defer optional setup. Use progressive profiling after the customer reaches the workspace; do not make a trial user complete the full implementation checklist before seeing the product.

**Business identity lookup:**
- Ask whether the business is GST-registered. If yes, collect GSTIN; otherwise offer PAN as the alternative identifier.
- Prefer an authorised official GST portal/API integration for GSTIN lookup and prefill. Confirm current portal/API terms and permitted access before implementation; do not automate around or defeat CAPTCHA.
- If official lookup requires CAPTCHA or no permitted API is available, embed/redirect to an official user-assisted verification step where feasible, or show a clear CAPTCHA/manual verification step in the registration journey. The customer solves it; the system then validates and records the returned details/status.
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
