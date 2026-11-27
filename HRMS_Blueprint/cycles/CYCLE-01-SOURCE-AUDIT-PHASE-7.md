# Cycle 01 — Fresh Source Audit (Phase 7: Onboarding, Company Documents and Settings API Contracts)

- Audit ID: HRMS-C01-AUDIT-P7
- Repository: Krinki-dev/HRMS
- Branch: architecture/postgres-tenant-isolation
- Source SHA inspected: 8b99f8a40311d81f5e200700562effb06ced0255
- Date: 2026-11-27
- Status: In Progress — frontend API contract traced against mounted Express routes.
- Application code changed: No.

## 1. C01-FE-004 — Onboarding wizard calls endpoints not mounted by backend

**Severity:** P1 — new customer onboarding workflow.

**Evidence:**
- frontend/src/pages/onboarding/OnboardingWizard.jsx calls GET /platform/onboarding/progress, POST /platform/onboarding/complete, POST /platform/onboarding/save-step and POST /payroll/salary-components.
- backend/server.js mounts platform.routes.js at /api/v1/platform, subscription.routes.js at /api/v1/platform/subscribe, and payroll.routes.js at /api/v1/payroll.
- platform.routes.js only declares /register, /link-branch, /gstin-lookup/:gstin, /sitemap.xml, /gstin-check/:gstin and /pincode/:pincode.
- subscription.routes.js has plan/trial/payment routes but no onboarding progress/save-step/complete routes.
- payroll.routes.js declares /salary-structures, not /salary-components.
- 20261124_tenant_onboarding_progress.sql creates onboarding progress persistence, but no matching backend API route/controller was found in the mounted route inventory.

**Impact:** The onboarding wizard's progress load/save/complete calls and payroll salary-components save call do not match the mounted backend contract. The onboarding wizard can fail to persist progress or complete setup even though the frontend production build succeeds.

**Required direction:** Define one canonical onboarding API contract; implement authenticated tenant-scoped controller/service operations backed by the onboarding progress table; align salary component UI with the canonical payroll salary-structure API or implement the intended endpoint. Do not add duplicate aliases without a versioned compatibility reason.

**Acceptance tests:** New tenant can resume wizard, save each step, complete setup, and persist payroll structure settings; another tenant cannot read/update its progress.

## 2. C01-FE-005 — Company document upload and admin review APIs are referenced by UI but absent from mounted routes

**Severity:** P1 — onboarding KYC/document workflow not wired end-to-end.

**Evidence:**
- frontend/src/pages/onboarding/CompanyDocumentsStep.jsx calls /platform/company-documents and /platform/onboarding/save-step.
- frontend/src/pages/admin/AdminDocuments.jsx uses adminApi functions that call /platform/company-documents/review-queue, /platform/company-documents/:id/review-download, /platform/company-documents/:id/reviews and PATCH /platform/company-documents/:id/review.
- backend/db-migrations/20261124_company_document_workflow.sql and 20261125_central_platform_schema_upgrade.sql create Central company_documents and company_document_reviews tables with tenant RLS and metadata constraints.
- backend/server.js mounts platform.routes.js, admin.routes.js and subscription.routes.js. The inspected platform.routes.js and admin.routes.js route inventories contain no company-documents endpoints; the admin routes are mounted under /api/v1/platform/admin, not the /api/v1/platform/company-documents path requested by the frontend.
- No backend company-document controller/service or file-scanning/storage route was found in the repository tree/source inventory.

**Impact:** The onboarding upload and platform admin review UI cannot complete its API workflow. The DB tables alone do not implement upload, malware scanning, private object storage, review authorization, audit history or secure download.

**Required direction:** Implement a complete backend workflow only after the private storage and malware-scanning controls are designed: tenant-bound upload, content/type/size validation, ClamAV fail-closed scan, SHA-256, private object key, metadata transaction, platform-admin review, immutable review history and short-lived signed download. Keep document bytes out of PostgreSQL.

**Acceptance tests:** Tenant A cannot list/download Tenant B documents; platform reviewers can review; scanner outage/malware/invalid file fail closed; download links expire; audit history is append-only.

## 3. C01-FE-006 — Notification settings frontend URL does not match mounted backend URL

**Severity:** P2 — settings workflow integration.

**Evidence:**
- frontend/src/services/settingsApi.js and frontend/src/services/adminApi.js call /settings/notifications, /settings/notifications/test-email and /settings/notifications/test-sms.
- backend/server.js mounts settings.routes.js at /api/v1/settings; that router has no notification settings routes.
- The separate backend/modules/notifications/notification.routes.js is mounted at /api/v1/config/notifications and declares /notifications, /notifications/test-email, /notifications/test-sms, etc. Its actual route prefix therefore differs from the frontend /settings/notifications contract.

**Impact:** Notification settings GET/PUT/test calls from the frontend do not reach the separate notification configuration routes and are expected to return 404.

**Required direction:** Choose the canonical path and update either the frontend API service or backend mount/routes. Keep one route contract and add an API contract test.

**Acceptance tests:** Settings page loads/saves config and test email/SMS requests reach the intended authenticated, settings-permission-gated handler.

## 4. Audit status

This phase adds GAP-0032 through GAP-0034. These are route-contract/source findings; no API or UI fix has been implemented. Continue Central lifecycle, billing, RLS, files, import/export, backup/restore and operations audits before Cycle 01 planning.
