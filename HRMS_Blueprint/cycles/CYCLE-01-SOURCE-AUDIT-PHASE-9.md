# Cycle 01 — Fresh Source Audit (Phase 9: Employee Sensitive Data and Upload Access)

- Audit ID: HRMS-C01-AUDIT-P9
- Repository: Krinki-dev/HRMS
- Branch: architecture/postgres-tenant-isolation
- Source SHA inspected: 3fe4bf85d9539e4568882495efeab376d7358a3a
- Date: 2026-11-27
- Status: In Progress — employee bank/document/photo access paths reviewed.
- Application code changed: No.

## 1. C01-SEC-008 — Employee bank/document mutations do not enforce company ownership in service queries

**Severity:** P1 — sensitive employee data integrity / cross-company object access.

**Evidence:**
- employees.routes.js protects bank update/delete and document delete with employees.edit permission.
- employees.controller.js passes req.user.companyId, employee ID and bank/document ID into the service methods.
- employees.service.js updateBankAccount finds a bank account using only { id: bankId, employee_id: employeeId }; deleteBankAccount uses the same unscoped predicate.
- employees.service.js deleteDocument finds a document using only { id: docId, employee_id: employeeId }.
- These methods accept companyId but do not first verify that the employee belongs to that company. By contrast, getBankAccounts, addBankAccount, getDocuments and addDocument explicitly verify the employee with { id, company_id: companyId }.

**Impact:** An authorized user in Company A may update/delete a bank account or employee document belonging to Company B if the employee ID and child record ID are known and both companies share the operational schema.

**Required direction:** Verify the employee belongs to companyId before any child-record operation, then scope the child record through the verified employee/company relationship. Prefer transactional update/delete with ownership predicate.

**Acceptance tests:** Company A cannot update/delete Company B's bank accounts or documents; own-company authorized changes succeed; invalid IDs return not found.

## 2. C01-FILE-002 — Employee photos are served from a public static directory

**Severity:** P1 candidate — employee privacy; confirm product visibility policy.

**Evidence:**
- employees.routes.js stores uploaded photos under backend/uploads/employees using a filename containing employee ID and timestamp.
- employees.controller.js saves the path as /uploads/employees/{filename}.
- backend/server.js mounts express.static for the entire backend/uploads directory at the unauthenticated /uploads URL, before the API tenant/auth middleware.
- The upload route limits files to 5 MB and allows JPEG/PNG/WebP/GIF MIME types, but static reads do not check authentication, company membership or employee permissions.

**Impact:** Anyone who obtains or guesses an employee photo URL can retrieve the photo without signing in. Employee photos are personal data and should not automatically be internet-public.

**Required direction:** Confirm intended visibility with product owner. Default recommendation is private object storage and an authenticated company-scoped photo endpoint or short-lived signed URL. If public avatars are intentionally required, make that an explicit consent/product decision and avoid exposing the whole uploads directory.

**Acceptance tests:** Unauthenticated requests cannot retrieve private employee photos; Company A cannot retrieve Company B photos; authorized users see only permitted photos; deleted/replaced photo objects are no longer accessible.

## 3. Positive controls

- Employee photo uploads have a 5 MB Multer limit and an allow-list of image MIME types.
- Sensitive Aadhaar/PAN unmasking requires a dedicated view_sensitive permission and writes an audit log.
- Employee bank account read endpoint uses checkSensitivePermission('employees', 'view_sensitive').
- Employee document read/add operations verify the employee belongs to the authenticated company.

## 4. Audit status

This phase adds GAP-0036 and GAP-0037. No employee data, file, or access policy was changed.
