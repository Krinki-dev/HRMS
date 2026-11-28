# Central Tenant–Operational Company Membership Mapping — Phase 32 Design Proposal

**Date:** 2026-11-28 (Asia/Kolkata)  
**Parent task:** HRMS-D-005 — canonical PostgreSQL migration baseline  
**Related task:** HRMS-D-003 — explicit tenant/company identity binding  
**Status:** Proposed design only — not frozen, not implemented, no DDL generated for execution

## 1. Problem statement

The system has two distinct identity domains:
- Central `tenants.id`: SaaS customer/workspace and storage-routing boundary.
- Operational `companies.id`: legal company inside that SaaS tenant's HRMS database.

Operational `users` is unique by `(company_id, email)`, so one email may be represented by different user rows in multiple operational companies.

Central `central_user_index` is unique by `(email, company_id)`, where that Central `company_id` is actually the Central tenant UUID. It stores only one optional `user_id` per email/tenant. It therefore cannot represent multiple operational company memberships for the same email inside one tenant.

The operational public schema is shared by multiple Free/Trial SaaS tenants and operational rows do not carry Central tenantId. Querying `users` by email alone cannot safely determine which company belongs to the selected Central tenant.

## 2. Proposed Central mapping table

Proposed name: `tenant_user_company_memberships`.

The table maps one Central tenant to one operational company and one operational user. The operational UUIDs are references across the tenant DB boundary; PostgreSQL cannot enforce a foreign key from the Central DB into a separate operational database/schema.

### Proposed columns

| Column | Type | Null | Purpose |
|---|---|---:|---|
| id | uuid | No | Central membership row ID |
| tenant_id | uuid | No | FK to Central `tenants.id` |
| operational_company_id | uuid | No | Operational `companies.id` |
| operational_user_id | uuid | No | Operational `users.id` |
| normalized_email | text | No | Canonical lower/trim email snapshot for lookup |
| status | text | No | pending / active / suspended / revoked |
| source | text | No | registration / verified_backfill / admin_approval |
| verified_at | timestamptz | Yes | Explicit verification time |
| created_at | timestamptz | No | Creation timestamp |
| updated_at | timestamptz | No | Last update timestamp |

### Proposed constraints and indexes

- PK: `id`.
- FK: `tenant_id REFERENCES tenants(id) ON DELETE CASCADE`.
- Unique: `(tenant_id, operational_company_id, normalized_email)`.
- Unique: `(tenant_id, operational_user_id)` if the product contract confirms one operational user belongs to exactly one company within a tenant.
- Lookup index: `(tenant_id, normalized_email, status)`.
- Company index: `(tenant_id, operational_company_id, status)`.
- Status check constraint limited to the defined lifecycle values.
- Normalize email in application and enforce lower-case canonical storage; consider a DB check for lower(trim(normalized_email)) equality.

**Important:** The second unique constraint is conditional on the actual multi-company account model. If one user identity may legitimately belong to more than one company, do not apply it. This requires validation against frozen owner decisions and existing application behavior before DDL.

## 3. RLS design

Enable RLS on the mapping table. Proposed tenant policy:

```sql
USING (
  current_setting('jwt.claims.is_platform_admin', true) = 'true'
  OR tenant_id::text = current_setting('app.current_tenant', true)
)
WITH CHECK (
  current_setting('jwt.claims.is_platform_admin', true) = 'true'
  OR tenant_id::text = current_setting('app.current_tenant', true)
)
```

- Tenant-scoped lookup should use `withTenantRLS(centralPrisma, tenantId, callback)`, not a broad platform-admin context.
- Registration, backfill and cross-tenant administration use an explicit audited platform-admin path.
- Validate RLS as a non-owner, non-superuser, non-BYPASSRLS application role in disposable PostgreSQL CI.
- The deployed Central role still requires a DBA report; source policy is not deployed-role proof.

## 4. Application contract after mapping exists

1. Public lookup discovers Central tenant workspaces through the existing `central_user_index`.
2. After tenant selection, query active membership rows by `tenant_id + normalized_email`.
3. If one operational company is mapped, select it automatically.
4. If multiple operational companies are mapped, require explicit user selection.
5. Load the operational user by `operational_user_id + operational_company_id + normalized_email`; never query the shared public users table by email alone.
6. Bind both immutable tenantId and operational companyId to login, OTP, password reset, access/refresh tokens, WebSocket ticket, notifications and authorization context.
7. OTP key remains tenantId + companyId + normalized email.
8. Forgot-password creates the reset token for the mapped user and sends email through the same resolved tenant database.
9. Revoke/suspend a membership centrally without deleting operational HR data.

## 5. Legacy backfill and adoption

Backfill must be idempotent, auditable and fail closed.

### Eligible deterministic source

- For a Central index row with non-null `user_id`, resolve that exact operational user by ID in the selected tenant storage target.
- Verify the user's email matches the normalized Central email and obtain its operational company_id.
- Verify the company row exists and is active.
- Insert one membership row with `source='verified_backfill'` and `verified_at`.

### Ambiguous/unindexed source

- A Central index row with null `user_id` is not safely backfilled by searching operational `users` on email in shared public storage.
- Multiple same-email operational users in shared public storage cannot be attributed to a Central tenant from the operational row alone.
- These records require a trusted registration ledger, owner/admin verification, or a separately approved reconciliation import.
- Unresolved rows remain pending and authentication fails closed. Do not guess or silently choose first row.
- Dedicated tenant DBs may permit narrower reconciliation, but still require an explicit tenant target and company/user verification.

### Rollout sequence

1. Inventory current Central index rows, null user IDs, duplicate emails and tenant storage tiers.
2. Create the table/policy/indexes in the canonical PostgreSQL migration baseline.
3. Backfill deterministic mappings in disposable copies; produce counts for mapped, ambiguous, orphaned and rejected records.
4. Validate with two tenants sharing one public DB and two companies within one tenant.
5. Deploy code that reads the mapping only after migration state is verified.
6. Monitor missing/ambiguous mappings; keep old login path disabled rather than falling back to email-only lookup.
7. Reconcile legacy rows through approved process; no destructive user or employee changes.

## 6. Required tests

- Two Central tenants with the same email map to separate memberships.
- One Central tenant with two operational companies and same email returns two explicit company choices.
- Wrong tenant/company pair is rejected.
- User ID/company ID mismatch is rejected.
- Revoked/suspended membership cannot authenticate.
- RLS blocks tenant A from reading or writing tenant B mappings.
- Non-owner application role cannot bypass RLS.
- Legacy null-userId row remains pending; no email-only auto-mapping.
- Backfill rerun is idempotent.
- Partial failure and retry do not create duplicate memberships.

## 7. Risks and decisions still open

- Confirm whether one operational user may belong to multiple companies or whether each company has a separate user row.
- Confirm membership lifecycle: invite/approval, transfer, suspension, revocation and audit retention.
- Confirm whether a company can be linked to more than one Central tenant. Default recommendation: prohibit it unless a documented branch/legal-entity sharing model requires it.
- Confirm the treatment of platform admins who have access to multiple tenants.
- Decide if `central_user_index.user_id` remains as a backward-compatible primary-user pointer or is deprecated after migration.
- Establish an owner-approved reconciliation path for legacy rows where user_id is null or same-email membership is ambiguous.

## 8. Safety

This is a design proposal only:
- No migration SQL file was created.
- No DDL or database query was executed.
- No production/customer database was connected.
- No user, employee or membership record was changed.
- No deployment or credential change occurred.
- `main` remains untouched.
