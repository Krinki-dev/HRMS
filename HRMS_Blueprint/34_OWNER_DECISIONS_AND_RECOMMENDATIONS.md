# HRMS — Owner Decisions & Recommendations

> Prepared: 2026-11-25
> Branch: architecture/postgres-tenant-isolation
> Purpose: Ask only the business/product questions that cannot safely be decided from code. Technical defaults already approved by the user are recorded as settled in the master audit and are not repeated here.

## Recommended path

The best route is to keep the existing modular monolith, fix tenant/company identity and storage lifecycle first, enforce shared-schema isolation, then complete billing/recovery and module-level audit. Do not add new architecture patterns, databases or microservices while the current tenancy contract is still split across different files.

## A. Decisions that need your product/business preference

### 1. Employee count and subscription pricing — important conflict

Older pricing text says a plan includes up to 25 employees and charges an excess amount per employee. Other frozen text says employee count is unlimited on every plan. Current checkout also counts active employees and uses that count in server-side price calculation.

**Recommendation:** Decide one policy and make all plan screens, server pricing, invoices and limits use it. My default recommendation is to keep a simple predictable price per plan/module and remove employee-count caps unless employee-based billing is a deliberate business model. If you prefer per-employee billing, define the exact included count, overage price, active/inactive/deleted rules and whether it is calculated per operational company or per SaaS tenant.

### 2. Free plan versus 90-day Trial

Older documents say all cloud registrations receive a 90-day trial. Signup code currently creates a Free tenant, while separate trial activation exists. We need one customer-facing state transition.

**Recommendation:** Offer an explicit choice:
- Start Free: stays on Free and shared public storage.
- Start Trial: 90-day trial on the agreed trial entitlements, still in public storage.
- After Trial ends: move to Free and keep operational data in public unless/until the customer pays.

This avoids auto-starting a trial for someone who only wants Free. Confirm whether the product should work this way.

### 3. Meaning of a customer tenant versus companies inside it

Source code creates a Central tenant UUID and a separate operational companies.id UUID. The operational schema supports multiple companies, and multi-company support is listed as a paid add-on.

**Recommendation:** Keep the model as:
- Tenant = one SaaS customer/workspace and storage boundary.
- Company = one legal/business entity inside that tenant.
- One Free/Trial tenant's companies are in shared public but remain isolated by company and tenant context.
- One Paid tenant gets one dedicated schema containing that tenant's permitted companies.
This matches the current data model best. Please confirm that a Paid customer with multiple legal companies should still have one dedicated schema for the customer, not one schema per legal company.

### 4. Client-hosted/offline installation model

The requirement for client-hosted/offline PostgreSQL is known, but "offline" can mean either a fully independent local installation or a local node that later synchronizes with SaaS cloud. The current hybrid code is only fallback routing, not synchronization.

**Recommendation:** Phase 1 should be a fully independent self-hosted installation using PostgreSQL and the same application release, with local backup/restore. Do not promise cloud synchronization or automatic fallback. Add synchronization only as a separately designed feature with outbox, retry, conflict resolution, identity mapping and audit. Please confirm this scope.

### 5. Optional Enterprise dedicated database/instance

**Recommendation:** Keep dedicated schema as the Paid default. Offer an entirely dedicated PostgreSQL database/instance only as a separately priced Enterprise option with clear backup/monitoring/restore responsibilities. No need to build it before standard schema-per-tenant works.

### 6. Backup destination policy

Current code supports Google Drive and OneDrive paths, but restore must be verified and shared-schema per-tenant recovery is not yet implemented.

**Recommendation:** Keep both integrations optional, allow one or both per customer, and support a server-managed encrypted backup destination for customers who do not provide their own cloud storage. No delete should be enabled until a restore drill passes. Confirm whether OneDrive and Google Drive should both remain supported at launch, or whether one is sufficient.

### 7. Permanent deletion and retention policy

Older frozen decisions say "soft delete only" and "seven years minimum". Product requirements also include permanent account deletion after backup. A blanket retention period is not appropriate for every class of HR data without a record-specific legal review.

**Recommendation:** Keep ordinary user-record removal as soft delete. Separate account erasure from normal delete. Before hard erasure, apply a record-class retention schedule, legal hold, customer export, verified restorable backup and an approval log. Ask qualified Indian legal/compliance counsel to confirm retention periods for payroll, tax, PF/ESI, identity/KYC, recruitment and ordinary profile data.

### 8. Launch payment provider policy

This is already recorded as settled in the current handoff: Razorpay only, manual renewal; PhonePe/JioPay and automated payouts remain disabled until verified. No decision is needed unless you want to change that business choice.

**Recommendation:** Keep Razorpay-only for first launch and finish webhook replay/reconciliation and sandbox verification before turning on other providers.

## B. Technical recommendations I will treat as the default unless you object

1. PostgreSQL only; remove MySQL, MSSQL and SQLite runtime support after verifying no customer deployment depends on it.
2. Free/Trial use operational public; Paid gets a schema derived from immutable Central tenant UUID.
3. tenantId and companyId are separate first-class fields in tokens and request context.
4. Shared public tables use transaction-scoped RLS plus explicit company_id filters. App DB role must not bypass RLS.
5. Storage routing comes from one fail-closed resolver; no development database fallback in production.
6. Provisioning and paid promotion use an idempotent state machine, not a one-shot schema clone.
7. Versioned PostgreSQL migrations replace cloneSchema / SQL Server migration history.
8. Payment capture and storage provisioning are separate durable steps; paid entitlements activate only when verified storage is ready.
9. Backups are storage-aware; shared-schema recovery must restore only the intended tenant's rows. Destructive deletion stays disabled until a restore drill passes.
10. CSV and relational XLSX remain required in every HRMS module, with preview/validate/confirm and field-level permission checks.
11. No production SQL, real payment, database deletion or deployment during source audit.
12. Keep the modular monolith; don't introduce microservices or extra databases without a proven requirement.

## C. Confirmed requirements — do not reopen as questions

- PostgreSQL only.
- Free and Trial customers share public schema.
- Every Paid customer receives a UUID-derived dedicated schema.
- Client-hosted/offline PostgreSQL remains supported.
- Hybrid synchronization is not implemented and must not be described as working.
- Main branch is protected; work remains on architecture/postgres-tenant-isolation.
- Every HRMS module needs CSV and relational XLSX import/export.
- User has permitted eventual cleanup of dummy tenant operational data, but only after inventory, tenant classification, backup and restore safeguards.
- Do not ask for another SQL run before completing source-code work.

## D. How to reply

Please respond only to the items where you want a different choice. For example: "1. Per employee pricing; 2. Trial automatic; 3. one schema per SaaS tenant; 4. fully local only; 6. both clouds; 7. legal retention schedule." Any item you accept as recommended needs no further discussion.
