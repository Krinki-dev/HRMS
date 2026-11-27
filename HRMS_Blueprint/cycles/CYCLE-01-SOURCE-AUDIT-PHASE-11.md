# Cycle 01 — Fresh Source Audit (Phase 11: Auth Identity and Attendance Contract Reconciliation)

- Audit ID: HRMS-C01-AUDIT-P11
- Repository: Krinki-dev/HRMS
- Branch: architecture/postgres-tenant-isolation
- Date: 2026-11-27
- Status: In Progress — focused source trace; runtime verification not performed.
- Application code changed: No.

## 1. Scope and source evidence

The following current-branch files were fetched and inspected:

| Area | Source file | Blob SHA |
|---|---|---|
| API mount order and global middleware | backend/server.js | 8a412ffed98826379fc832ea90b99c8ff97a9097 |
| Authentication routes and token construction | backend/modules/auth/auth.routes.js | 78e014fa55480c79ca3eadde719fcd72098354d6 |
| Authentication service and token construction | backend/modules/auth/auth.service.js | 676e5b0fb0b7af43bcf6ce4efe62d0cb8d7cb33a |
| Auth middleware | backend/shared/middleware/auth.js | 76a056c0e1e46e34a1e95beb9ac8e617cfb52420 |
| Tenant routing middleware | backend/shared/middleware/tenant.js | 21e49bd0e113768666d97fa1f78e9139a4cc61ea |
| Tenant identity normalization | backend/shared/utils/tenantIdentity.js | 6e8e49f833d87c5e14c55bea9fa92515e0cf551f |
| Identity regression tests | backend/test/tenant-identity.test.js | 590792a661dd0e4f98ffefd41787daf36a36c10b |
| Attendance routes | backend/modules/attendance/attendance.routes.js | b6249dfca2f6dbeb547a4d040f382478fd2c68df |
| Attendance controller | backend/modules/attendance/attendance.controller.js | 65ca55fded7ef87537cccc1164361067eb8eb177 |
| Attendance service | backend/modules/attendance/attendance.service.js | 611ab04357a99f1cdc1c31c62cf5b1117ea567cd |
| Employee routes | backend/modules/employees/employees.routes.js | e778d21fa4b368fa3dd387b27e19b56c13c166c6 |
| Employee service | backend/modules/employees/employees.service.js | f432308dc535d5af5170b89ea1a6af2e0272926d |
| Tenant Prisma schema | backend/prisma/schema.prisma | 39fb35175b4daa6767d1575bc6f8eef8e3449066 |
| Migration safety guidance | backend/db-migrations/README.md | 5098e3f7ab934ee43108b1e061ac42194d2de72f |
| Backend package scripts | backend/package.json | 57063e701a437714076c565c58bc85e04d53aa57 |

## 2. Authentication and tenant identity trace

### Positive controls verified in source

- Access tokens carry distinct `companyId` and `centralTenantId` claims. The current signer also retains a compatibility `tenantId` alias for the Central tenant.
- `tenantIdentity.js` maps a legacy token containing only `tenantId` to operational `companyId`, and uses the authenticated Central user index to resolve the Central tenant. It does not rebind an ordinary user's Central identity from an arbitrary request host.
- `auth.js` fetches the Central index mapping, normalizes identity, checks tenant-context match, and places company and Central tenant IDs separately on `req.user`.
- Existing `backend/test/tenant-identity.test.js` contains positive and negative cases for legacy claims, independent IDs, host mismatch and platform-admin selection.
- `tenant.js` resolves a ready storage target through the explicit PostgreSQL storage resolver and fails closed for unclassified targets.
- The tenant Prisma datasource is PostgreSQL. Migration README explicitly warns that the retained legacy migration history declares MSSQL and must not be run against PostgreSQL.

### Remaining verification

- The current source tests are not proof that every login, refresh, company-selection, platform-admin and tenant-host flow uses the same identity contract. Complete the call-site inventory and run the focused test suite on the latest branch head.
- No live database or staging identity test was run in this phase.

## 3. C01-ATT-002 — Attendance check-in controller/service argument contract is inconsistent

**Severity:** P2 — attendance data completeness / API contract defect.
**Status:** Open — source confirmed; runtime test pending.

**Evidence:**
- `attendance.controller.js` calls `svc.checkIn(req.db, req.user.employeeId, req.user.companyId, req.body)`.
- `attendance.service.js` declares `checkIn: async (db, employeeId, data)`; the third argument therefore receives the company ID string and the actual request body is the unused fourth argument.
- The service reads `data.latitude`, `data.longitude` and `data.ipAddress` for the attendance record. With the current controller call, these fields are not read from the request body and are not persisted.
- The same controller passes an additional company ID to `getToday` and `checkOut`, while those service methods declare only `(db, employeeId)`. Those extra arguments are currently ignored; confirm whether the signatures are intended to become company-scoped.

**Impact:** Check-in may still create the attendance record, but the requested geolocation/IP metadata is silently lost. This also makes the controller/service contract misleading and vulnerable to future regression.

**Required direction:** Choose one explicit service contract and align both sides. Prefer passing `companyId` explicitly where the service needs company scoping, and pass request data as a separate final argument. Validate location values and avoid storing IP/location unless product policy and privacy requirements permit it.

**Acceptance tests:**
1. Controller-to-service test proves request latitude/longitude/IP reach the intended service fields.
2. Missing and malformed coordinates are handled safely.
3. Employee A cannot read or mutate Employee B's attendance by changing request IDs.
4. Existing self-service check-in/check-out behavior remains intact.

## 4. Cross-cutting observations (not new findings in this phase)

- `server.js` serves `backend/uploads` through unauthenticated `express.static`; employee-photo exposure is already tracked as GAP-0037 and must be resolved there rather than duplicated.
- Attendance approval/rejection permission and ownership concerns remain tracked under GAP-0018. This phase did not independently reproduce them.
- The auth identity helper and test suite contain useful separation controls; keep these tests as regression gates when resolving inherited GAP-0001.
- The employee route layer applies authentication and module gating, and individual routes mostly declare action permissions. This is not proof of service-level object ownership; GAP-0036 remains open.

## 5. Audit status and next work

- This phase adds GAP-0040 for the check-in controller/service argument mismatch.
- No code was changed and no tests, application boot, browser workflow, database migration or live service was run.
- Continue with the remaining module/API inventory, auth refresh and company-selection trace, runtime boot checks for GAP-0017/GAP-0021, frontend route verification, operational runbooks and whole-repo evidence reconciliation.
- Do not begin implementation until the full audit is complete and Cycle 01 plan verification passes.
