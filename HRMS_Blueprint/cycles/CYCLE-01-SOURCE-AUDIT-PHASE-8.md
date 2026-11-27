# Cycle 01 — Fresh Source Audit (Phase 8: Billing, Backup and Deletion Lifecycle)

- Audit ID: HRMS-C01-AUDIT-P8
- Repository: Krinki-dev/HRMS
- Branch: architecture/postgres-tenant-isolation
- Source SHA inspected: a9c5f094e145afb95d93fcf136643058c4fb95db
- Date: 2026-11-27
- Status: In Progress — billing/payment and backup/deletion source paths reviewed.
- Application code changed: No.

## 1. Billing/payment observations

### Positive controls verified
- Paid subscription checkout is Razorpay-only at launch and rejects non-manual renewal.
- Server calculates the price and stores a server-side order snapshot in payment_orders.
- Verification checks the Razorpay HMAC signature, retrieves the gateway order/payment server-side, validates amount/currency/order/tenant/purpose, and requires a captured payment.
- A conditional update claims the created order once; repeated verification for the same captured payment returns alreadyProcessed.
- Plan, module entitlements, pricing config, paid invoice and payment-order state are written in one Central transaction.
- Free/Trial onboarding plan transitions reject downgrade when a captured paid subscription order exists.
- PhonePe legacy callback does not mutate payment state; JioPay checkout/callback are explicitly disabled.
- Manual renewal behavior is reflected in subscription order snapshots and the billing renewal metadata.

### C01-BILL-001 — Paid upgrade cannot proceed until dedicated storage exists, but the migration/provisioning workflow is absent
**Severity:** P1 — paid conversion blocker.

**Evidence:**
- payment.controller.js createSubscriptionOrder calls isPaidStorageReady before creating any Razorpay order and returns TENANT_STORAGE_MIGRATION_REQUIRED when the tenant is not already on verified dedicated storage.
- paidStorageGuard.js accepts only a verified UUID-derived dedicated schema for managed cloud, or a dedicated database for customer-managed/approved Enterprise.
- Current registration creates Free/Trial managed-cloud tenants in shared public storage.
- No end-to-end service/route/worker was located that safely migrates an existing Free/Trial shared tenant's operational rows and foreign keys to the UUID-derived dedicated schema, verifies it, and atomically changes storage metadata.

**Impact:** The safety guard correctly prevents payment before storage is ready, but there is no customer upgrade path that makes storage ready. Existing shared Free/Trial tenants cannot complete paid checkout through this code until the separate migration workflow exists.

**Required direction:** Design and implement a resumable, observable, rollback-capable public-to-dedicated migration with a complete table/FK ownership inventory, row counts/checksums, tenant write freeze or dual-write strategy, post-copy validation and explicit admin approval. Only then enable paid checkout.

**Acceptance tests:** A disposable multi-tenant public schema migrates one tenant to a dedicated UUID schema without changing any other tenant; all rows/FKs are reconciled; failed attempts are resumable/rollback-safe; checkout remains blocked until verified.

## 2. C01-BACKUP-001 — Backup files are compressed but not application-layer encrypted before cloud upload

**Severity:** P1 — sensitive HR/payroll backup confidentiality.

**Evidence:**
- backupService.js creates a PostgreSQL dump using pg_dump and gzip, then uploads the resulting .sql.gz file directly to Google Drive or OneDrive.
- No encryption/cipher/key-management step is applied to the dump before upload. The encryption helper is used for stored provider credentials/connection strings, not the backup bytes.
- Temporary dump is removed after upload, but the cloud backup object itself is not application-encrypted by this service.

**Impact:** A cloud storage account compromise or overly broad provider access may expose employee PII, payroll, bank and tax data from the backup. Provider-side encryption at rest is not equivalent to customer-controlled backup encryption.

**Required direction:** Define a key-management model (customer-held or centrally managed envelope encryption with rotation/recovery), encrypt before upload, store key version metadata separately, and test restore/decryption with audited access. Do not silently invent or hardcode a backup encryption key.

**Acceptance tests:** Uploaded object is ciphertext; unauthorized storage access cannot read SQL/PII; authorized restore recovers the database using the correct key version; missing/wrong key fails closed; key rotation/recovery is documented.

## 3. C01-BACKUP-002 — Backup coverage and restore capability are deliberately incomplete

**Severity:** P1 — disaster recovery / deletion safety.

**Evidence:**
- backupService.runBackup calls getSafeBackupTarget before dumping. The target guard refuses shared, legacy, unready and unsupported dedicated-database storage; the unit tests explicitly verify these blocks.
- Consequently, Free/Trial shared public tenants and customer-managed dedicated-database tenants do not have a tenant-specific backup implementation through this path.
- No restore function or restore drill is present in backupService.js. The deletion service's wipeTenantDatabase() deliberately throws RESTORE_VALIDATION_REQUIRED, and physical deletion remains disabled.
- No evidence in the inspected source/tests proves a successful restore from an uploaded backup.

**Impact:** The fail-closed behavior avoids dumping another customer's rows into a tenant-specific archive, but large portions of the product have no usable customer backup/restore path. Backup configuration success must not be presented as recovery readiness.

**Required direction:** Implement safe shared-schema per-tenant export/restore and customer-managed database backup paths; encrypt backups; restore into an isolated disposable target; verify row counts/checksums, constraints, app startup and tenant isolation. Retain permanent deletion block until proof exists.

**Acceptance tests:** Restore drills for shared-schema tenant, dedicated-schema tenant and customer-managed database; verify no other tenant data is present; record RPO/RTO and recovery evidence.

## 4. Deletion safety

- tenantDeletion.service.js permanently refuses physical schema deletion until restore validation and schema ownership audit are implemented.
- tenantDeletionGuard.js blocks shared, legacy, non-ready and unsupported dedicated-database targets.
- These are positive fail-closed controls. Do not relax them to make deletion UX appear complete.

## 5. Audit status

This phase confirms the existing paid-upgrade and backup/restore gaps and adds GAP-0035 for backup encryption. No payment, database, backup provider, deletion or deployment action was performed.
