# Cycle 01 — Fresh Source Audit (Phase 3: Leave and Recruitment Access Control)

- Audit ID: HRMS-C01-AUDIT-P3
- Repository: Krinki-dev/HRMS
- Branch: architecture/postgres-tenant-isolation
- Source SHA inspected: 181a4ee3fee3cc581d5cd59b6c52bfe16b026fe0
- Date: 2026-11-27
- Status: In Progress — focused service-level authorization and company ownership review.
- Application code changed: No.

## 1. C01-SEC-003 — Leave application listing lacks permission gate and returns company-wide records

**Severity:** P1 — employee privacy / authorization.

**Evidence:**
- backend/modules/leave/leave.routes.js registers GET / without checkPermission.
- backend/modules/leave/leave.controller.js list handler calls svc.list(req.db, req.user.companyId, req.query) without checking whether the user is HR/manager or has leave.view.
- backend/modules/leave/leave.service.js list filters by employee.company_id, but returns the matching company's leave_applications and includes employee identity and leave type. It does not restrict the result to the caller's employeeId.
- A separate GET /my endpoint exists for self-service.

**Impact:** Any authenticated user in a tenant/company can request the general leave list and retrieve other employees' leave applications. Company scoping prevents other companies' rows but does not enforce within-company role privacy.

**Required direction:** Gate the company-wide list behind leave.view / manager authorization. Keep /my self-scoped. Add tests proving an employee cannot list coworkers' leave requests while an authorized HR user can.

## 2. C01-BUG-001 — Leave balance endpoint calls the service with the wrong arguments and accepts arbitrary employeeId

**Severity:** P1 — broken self-service feature and object-level access risk.

**Evidence:**
- backend/modules/leave/leave.controller.js calls svc.getBalances(empId, req.query.year).
- backend/modules/leave/leave.service.js defines getBalances(db, employeeId, year) and uses db.leave_balances.findMany.
- The controller omits req.db, so the current invocation shifts all arguments and cannot call the service correctly.
- The controller also selects empId from req.query.employeeId before req.user.employeeId. No permission gate exists on GET /balances, so after fixing the missing db argument an ordinary employee could ask for another employee's balance unless the service contract is tightened.

**Required direction:** Pass req.db explicitly and bind the employee ID to req.user.employeeId for self-service. If HR needs to inspect other balances, expose a separate route with leave.view permission and strict company-scoped lookup.

**Acceptance tests:** Self endpoint works for the caller; caller-supplied employeeId is ignored/rejected; HR endpoint can query only employees in req.user.companyId; cross-company IDs return not found/forbidden.

## 3. C01-SEC-004 — Recruitment interview feedback and offer decisions lack company ownership checks

**Severity:** P1 — object-level authorization / cross-company mutation.

**Evidence:**
- backend/modules/recruitment/recruitment.routes.js registers POST /interviews/:id/feedback with authentication only.
- recruitment.controller.js submitFeedback calls svc.submitFeedback(req.db, req.params.id, req.user.id, req.body), without passing companyId.
- recruitment.service.js submitFeedback checks/creates interview_feedback by interview_id and interviewer_id but does not first verify that the interview belongs to req.user.companyId or that the user is assigned as an interviewer.
- recruitment.controller.js acceptOffer and declineOffer call service methods with only req.params.id.
- recruitment.service.js acceptOffer/declineOffer find and update offers by id only, and declineOffer also updates the linked candidate by id only. The routes require recruitment.edit, but that permission does not replace object-level company ownership.

**Impact:** In a tenant database containing multiple operational companies, a user with an interview/offer ID may be able to submit feedback or mutate another company's offer. The feedback endpoint is especially weak because the route only requires authentication.

**Required direction:** Pass authenticated companyId to all service methods; validate interview/offer/candidate ownership in the same company before mutation; validate interviewer assignment for feedback; make related updates transactional.

**Acceptance tests:** Company A cannot submit feedback for or accept/decline Company B's interview/offer; an unassigned user cannot submit feedback; authorized actions succeed and related candidate/offer state changes atomically.

## 4. Route-scan observations — not a full authorization sign-off

A static route scan was performed for Leave, Compliance, Recruitment, Performance, Training, Assets, Expenses, Reports, Roles, Settings and Notifications. Many administrative routes do use module permission middleware. Self-service routes commonly use authentication and rely on service-level object ownership. This is not enough to mark the modules secure: each such service must be checked for company scoping and actor ownership.

Additional items requiring detailed review:
- Leave GET /dashboard, /calendar, / and /balances should have explicit documented visibility contracts.
- Performance self-goal and appraisal routes must verify that IDs belong to the caller and company.
- Training feedback and my-training routes must verify employee/participant ownership.
- Recruitment interview feedback and offer actions need the company checks above.
- Expenses receipt upload must be reviewed for file limits, content validation, malware scan and association with the caller's own claim.
- Settings GET departments/designations/branches currently lack an explicit checkPermission in the route; confirm the intended visibility and controller scoping.
- Compliance employee declaration routes appear self-bound by req.user.employeeId; verify all service queries use that ID and company context.

## 5. Audit status

This phase adds source-level findings GAP-0022 through GAP-0024 to the master register. No fixes are implemented yet. Full audit still needs all remaining module service paths, data models, RLS coverage, billing, files, imports/exports, backup/restore, frontend build and E2E.

No production database, customer data, live payment or deployment was changed.
