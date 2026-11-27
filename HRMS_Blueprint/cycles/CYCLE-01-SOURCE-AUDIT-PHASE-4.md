# Cycle 01 — Fresh Source Audit (Phase 4: Performance, Training, Assets and File Uploads)

- Audit ID: HRMS-C01-AUDIT-P4
- Repository: Krinki-dev/HRMS
- Branch: architecture/postgres-tenant-isolation
- Source SHA inspected: 8caa1cfaf153563a22269f6a3bca11fb60e5ef3b
- Date: 2026-11-27
- Status: In Progress — focused company-scope and upload-security review.
- Application code changed: No.

## 1. C01-SEC-005 — Performance mutations do not consistently enforce company ownership

**Severity:** P1 — cross-company object mutation.

**Evidence:**
- performance.controller.js passes companyId to closeCycle and finalizeAppraisal, but performance.service.js closeCycle updates appraisal_cycles by id only and finalizeAppraisal updates appraisals by id only.
- approveGoal controller passes only user ID and goal ID; service updates performance_goals by id only.
- The corresponding routes require performance.edit, but service methods do not verify the target record belongs to req.user.companyId.

**Impact:** In a shared tenant operational database containing multiple companies, a user with the required module permission and a known record ID may close another company's appraisal cycle, approve another company's goal or finalize another company's appraisal.

**Required direction:** Pass companyId into every mutation and verify the record through its owning company relation before changing it. Keep read/check/update in one transaction where state transitions are involved.

**Acceptance tests:** Company A cannot mutate Company B's cycle, goal or appraisal; authorized Company A actions work; unknown IDs return not found.

## 2. C01-SEC-006 — Training service ignores companyId for several record operations

**Severity:** P1 — cross-company data access/mutation.

**Evidence:**
- training.controller.js passes companyId into remove, listNominations, nominate and markAttendance, but training.service.js does not use it in those queries.
- remove updates trainings by ID only.
- listNominations filters only by training_id.
- nominate does not verify the training or nominated employees belong to the caller's company.
- removeNomination accepts only trainingId and employeeId and does not validate company ownership.
- markAttendance uses trainingId and employeeId without validating either against companyId.
- submitFeedback uses trainingId and employeeId but does not verify training ownership/company; the route is auth-only.

**Impact:** A user may read or mutate training/nominations/attendance/feedback associated with another company if IDs are known and the tenant operational database is shared across companies.

**Required direction:** Validate training.company_id and employee.company_id before all actions; pass companyId into every service method; validate that feedback employee is the authenticated employee; perform related changes transactionally.

**Acceptance tests:** Cross-company list, nomination, attendance, feedback and deletion attempts are rejected; own-company workflows succeed.

## 3. C01-SEC-007 — Asset allocation/return and employee lookup do not consistently scope employee/asset ownership

**Severity:** P1 — cross-company record access/mutation.

**Evidence:**
- assets.controller.js passes companyId to service methods.
- assets.service.js allocate verifies the asset belongs to companyId but does not verify the employeeId belongs to that company before creating the allocation.
- returnAsset accepts companyId but finds the active allocation by asset_id only, then updates allocation and asset by ID without verifying asset.company_id.
- byEmployee accepts companyId but queries allocations only by employee_id, without confirming the employee belongs to companyId.

**Impact:** A caller may allocate an asset to an employee from another company, return/change an asset from another company by known ID, or view another company's allocations by employee ID.

**Required direction:** Verify asset and employee ownership in the same company for every allocation, return and lookup. Scope all mutation queries by verified record IDs and company ownership.

**Acceptance tests:** Cross-company allocation, return and employee lookup attempts are rejected; valid own-company asset lifecycle succeeds.

## 4. C01-FILE-001 — Expense receipt upload bypasses file limits and malware scanner

**Severity:** P1 — upload abuse / malware exposure.

**Evidence:**
- expenses.routes.js configures Multer memoryStorage() without file size limits or file-type filtering for POST /upload.
- The route applies auth and module entitlement but no explicit expense permission middleware.
- expenses.controller.js forwards req.file to expenses.service.js uploadReceipt.
- expenses.service.js uploadReceipt calls minio.uploadFile directly; it does not call shared/utils/clamavScanner.js scanBuffer.
- shared/utils/minio.js uploads the supplied buffer directly to private object storage and does not scan it.
- clamavScanner.js is designed to fail closed when scanner configuration or response is missing, but this receipt-upload path does not invoke it.

**Impact:** An authenticated user with the expense module enabled may upload arbitrarily large in-memory files without MIME/content validation or malware scanning. This can cause memory pressure and store unscanned files.

**Required direction:** Add strict upload size limits and content validation; scan the buffer fail-closed before MinIO upload; validate authenticated user/claim association; add explicit route permission or document the intended employee self-service permission. Store only after all checks pass.

**Acceptance tests:** Oversized, malformed, unsupported and malware-positive uploads are rejected; scanner unavailable fails closed; valid small clean receipts upload; upload cannot be associated with another company's claim.

## 5. Positive observations

- Expense claim deletion checks both employee ownership and pending status.
- Asset listing/get/update paths generally perform company lookup before update; the above findings concern specific service methods where companyId is accepted but ignored or incomplete.
- Training and Performance route layers do apply module entitlement and some permission gates; those gates do not replace service-level record ownership checks.

## 6. Audit status

This phase adds GAP-0025 through GAP-0028 to the master register. No fixes are implemented yet. Continue auditing Payroll, Compliance, Notifications, Settings, Central tenancy/RLS, billing, file/document workflows, import/export and operations before Cycle 01 planning.
