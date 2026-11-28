# Cycle 01 Source Audit — Phase 18: Frontend-to-Backend API Contract Mapping

**Date:** 2026-11-28 (Asia/Kolkata)  
**Repository:** `Krinki-dev/HRMS`  
**Branch:** `architecture/postgres-tenant-isolation`  
**Scope:** Static comparison of frontend API service methods against backend router mounts and route declarations for core HRMS modules.

## 1. Executive summary

Phase 18 expanded the API mapping beyond the notification settings mismatch already recorded in Phase 17.

The following core service areas were compared with the corresponding backend route modules: authentication, employees, attendance, leave, payroll, compliance, dashboard, recruitment, performance, training, assets, expenses, settings, platform subscription and reports.

Most high-level module prefixes and many CRUD paths align. However, three concrete employee/expense contract mismatches were identified:

- Employee address listing calls an endpoint that is not declared by the employee router.
- Employee photo upload uses POST in the frontend while the backend route is PUT.
- Expense receipt upload uses a different path and multipart field name from the backend handler.

These are source-confirmed contract defects; actual browser/API failure was not reproduced.

The mapping is not yet exhaustive for every page, request payload, response shape, permission rule, or platform-admin action. Do not mark the API layer verified or claim all endpoints are correct.

## 2. Source evidence

| File | Blob SHA | Purpose |
|---|---|---|
| `frontend/src/services/attendanceLeaveApi.js` | `a0d7f0a8d9ae9b691632a0aff42bba3c3dbb1e34` | Attendance and leave endpoint calls |
| `frontend/src/services/complianceApi.js` | `f387c7604e7029f7959544070ab9b9f5b7c9e214` | Compliance endpoint calls |
| `frontend/src/services/dashboardApi.js` | `60176ad72d936afe2202a012165e895beea2fc18` | Dashboard endpoint calls |
| `frontend/src/services/employeeApi.js` | `b2f3bbacc3452a26d46ad219a8e7b39700f86c15` | Employee CRUD, photo, address, bank and document API calls |
| `frontend/src/services/moduleApis.js` | `b6a63d3940cc78984a0542159b686e6fa3c71ca0` | Performance, training, assets and expenses API calls |
| `frontend/src/services/payrollApi.js` | `e96caf6fa9c007126af793e0e7b2de1b656c1b7d` | Payroll endpoint calls |
| `frontend/src/services/recruitmentApi.js` | `3fc8128b40ee0a2a090aae03df37960f9acf8c07` | Recruitment endpoint calls |
| `frontend/src/services/settingsApi.js` | `156628a625b49f3f2de30b5c31ab95c6e6b1c57f` | Settings endpoint calls |
| `frontend/src/services/adminApi.js` | `ed16209b53254a1f01f67a5dfbec4dce3bca1209` | Platform admin and notification settings API calls |
| `backend/modules/auth/auth.routes.js` | `78e014fa55480c79ca3eadde719fcd72098354d6` | Authentication route declarations |
| `backend/modules/employees/employees.routes.js` | `e778d21fa4b368fa3dd387b27e19b56c13c166c6` | Employee route declarations and multipart photo method |
| `backend/modules/attendance/attendance.routes.js` | `b6249dfca2f6dbeb547a4d040f382478fd2c68df` | Attendance route declarations |
| `backend/modules/leave/leave.routes.js` | `6eec514b9a01a6bd9bd6d2ddeff97cb1e1e084c9` | Leave route declarations |
| `backend/modules/payroll/payroll.routes.js` | `5426fe5692d9df9a767504b140b27d83dd11ac2c` | Payroll route declarations |
| `backend/modules/compliance/compliance.routes.js` | `ff820d673f9e210a63a3739290818328a0968220` | Compliance route declarations |
| `backend/modules/dashboard/dashboard.routes.js` | `051672ef1f1351cf51f0b45887437258b667612a` | Dashboard route declarations |
| `backend/modules/recruitment/recruitment.routes.js` | `29bf8fbf994019e6dc97c68e17008d7717a7cdcd` | Recruitment route declarations |
| `backend/modules/performance/performance.routes.js` | `7e537ecd4f2f8b1b4293ccd2c75c4e6e027fa241` | Performance route declarations |
| `backend/modules/training/training.routes.js` | `b6cf54913ca6a7c2a4f0d095bb39e8f9185b484a` | Training route declarations |
| `backend/modules/assets/assets.routes.js` | `9cdc158f353b949524a2afc47a9cda68e7774620` | Asset route declarations |
| `backend/modules/expenses/expenses.routes.js` | `ab1630796fe0c29505c88057c2a9010b1aa0efc6` | Expense route declarations and receipt multipart field |
| `backend/modules/settings/settings.routes.js` | `69f580c1b85e0f20dba2b0361a3a93202aa0e1d1` | Settings route declarations |
| `backend/modules/notifications/notification.routes.js` | `67c42ce109d88ac8286a73808ce7d1a186dddd37` | Notification route declarations |
| `backend/modules/reports/reports.routes.js` | `4cc0ec5173eb7fb35a030cdcddda7f063030ed47` | Reports route declarations |
| `backend/server.js` | `8a412ffed98826379fc832ea90b99c8ff97a9097` | Router mount prefixes |

## 3. Confirmed contract findings

### GAP-0055 — Employee address-list endpoint is not mounted

**Severity:** P2  
**Status:** Open — source-confirmed

- Frontend `employeeApi.getAddresses(id)` calls `GET /employees/:id/addresses`.
- Backend employee router declares `GET /:id/addresses/:type`, not `GET /:id/addresses`.
- The per-type GET and PUT paths are present; the frontend list-all call has no matching route in the inspected router.

**Impact:** Employee profile address panels that request all address records may fail with 404.

**Required remediation:** Either add a permission-protected list-all endpoint with a clear response contract or change the frontend to request each supported address type. Add route contract and employee-ownership tests.

### GAP-0056 — Expense receipt upload path and multipart field do not match

**Severity:** P1  
**Status:** Open — source-confirmed

- Frontend `expensesApi.uploadReceipt` posts to `/expenses/claims/upload-receipt` and appends the file under multipart field `receipt`.
- Backend server mounts the expense router at `/api/v1/expenses`.
- Backend expense router declares `POST /upload` and uses `upload.single('file')`.
- The actual backend path is therefore `/api/v1/expenses/upload`, and the accepted field name is `file`.

**Impact:** Receipt upload is expected to fail at routing; changing only the URL would still leave a Multer field-name mismatch.

**Required remediation:** Agree one canonical path and field name, add file-size/type limits, verify authorization and tenant ownership, and run a real multipart API integration test. Do not weaken upload scanning or validation.

### GAP-0057 — Employee photo upload HTTP method does not match

**Severity:** P1  
**Status:** Open — source-confirmed

- Frontend `employeeApi.uploadPhoto` calls `POST /employees/:id/photo`.
- Backend employee router declares `PUT /:id/photo`.
- Both sides otherwise use the employee photo endpoint and the backend expects multipart field `photo`.

**Impact:** Photo upload is expected to receive 404/405 because the HTTP method differs.

**Required remediation:** Align the frontend method or backend route method; preserve authentication, employee edit permission, file-size/type restrictions, and tenant/object ownership checks. Add multipart integration coverage.

## 4. Route-prefix mapping summary

The following paths were statically checked against `server.js` mount prefixes and corresponding route declarations:

| Module | Frontend service prefix | Backend mount | Static result |
|---|---|---|---|
| Authentication | `/auth` | `/api/v1/auth` | Main login/refresh/me/OTP paths align; payload/response tests pending |
| Employees | `/employees` | `/api/v1/employees` | Most CRUD paths align; GAP-0055 and GAP-0057 |
| Attendance | `/attendance` | `/api/v1/attendance` | Reviewed service paths align with route declarations |
| Leave | `/leave` | `/api/v1/leave` | Reviewed service paths align; permission/object-scope findings remain open separately |
| Payroll | `/payroll` | `/api/v1/payroll` | Reviewed run/payslip/salary/report paths align; controller/service contract findings remain open |
| Compliance | `/compliance` | `/api/v1/compliance` | Reviewed filing/PF/ESI/PT/TDS/LWF paths align |
| Dashboard | `/dashboard` | `/api/v1/dashboard` | Reviewed stats/activity paths align |
| Recruitment | `/recruitment` | `/api/v1/recruitment` | Reviewed requisition/job/candidate/interview/offer paths align |
| Performance | `/performance` | `/api/v1/performance` | Reviewed paths align at route-prefix level; service ownership gaps remain open |
| Training | `/training` | `/api/v1/training` | Reviewed training paths align at route-prefix level; ownership gaps remain open |
| Assets | `/assets` | `/api/v1/assets` | Reviewed assets CRUD/allocation/return/dashboard paths align; ownership gaps remain open |
| Expenses | `/expenses` | `/api/v1/expenses` | Claims/policies align; receipt upload is GAP-0056 |
| Settings | `/settings` | `/api/v1/settings` | Company/org/holiday/shift paths align; legacy DB-config issues and GAP-0034 notification mismatch remain |
| Notifications | `/settings/notifications` | `/api/v1/config/notifications` and `/api/v1/notifications` mounts | No matching `/settings/notifications` route; GAP-0034/GAP-0054 |
| Reports | Module-specific report URLs | `/api/v1/reports` | Only monthly attendance and payroll summary routes were verified; wider reports UI mapping pending |

This is a static path comparison, not a runtime contract test. It does not validate request body schemas, query parameter types, response envelopes, pagination, status codes, permission behavior, or object ownership.

## 5. Cross-cutting notes

- `server.js` mounts the core HR modules under `/api/v1` and mounts notification routers separately.
- `api.js` unwraps a response envelope when `response.data.data` exists. Some service wrappers return `r.data.data` while most return `r.data`; payload envelope expectations need a dedicated response-contract audit.
- Frontend build CI does not exercise these paths in a browser. Backend unit tests do not prove every frontend method maps to a mounted endpoint.
- Existing source-level authorization/tenant-scope findings remain independently open; a matching route does not prove its controller/service safely scopes the requested employee, company, or tenant.

## 6. Completion boundary and next actions

Completed:
- Static mapping of the listed frontend API service files to corresponding backend route files.
- Confirmed GAP-0055, GAP-0056 and GAP-0057.
- Revalidated notification path mismatch GAP-0034/GAP-0054.

Not completed:
- Full page-by-page mapping for all 66 frontend page components.
- Request/response schema comparison, multipart integration tests, permission and tenant-ownership verification.
- Browser E2E, runtime API calls, backend test execution or database integration tests.
- Platform-admin API coverage and all onboarding/billing/document workflows.

**Next:** finish the remaining platform/admin/onboarding/billing/document API mapping and reconcile duplicate findings. Then prepare the Cycle 01 improvement plan with priority, dependencies, safe implementation sequence and objective acceptance criteria. Independent verification of that plan is required before any code implementation. Keep `main` untouched.
