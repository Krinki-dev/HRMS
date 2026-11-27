# Cycle 01 — Fresh Source Audit (Phase 5: Payroll and Compliance)

- Audit ID: HRMS-C01-AUDIT-P5
- Repository: Krinki-dev/HRMS
- Branch: architecture/postgres-tenant-isolation
- Source SHA inspected: e008b95f718a17458152428535bde74ae5cd2d84
- Date: 2026-11-27
- Status: In Progress — focused Payroll and Compliance controller/service contract review.
- Application code changed: No.

## 1. C01-BUG-002 — Payroll payslip and bonus controller calls do not match service signatures

**Severity:** P1 — core payroll operations broken.

**Evidence:**
- payroll.service.js defines getPayslip(db, runId, empId, companyId).
- payroll.controller.js getPayslip calls svc.getPayslip(req.params.runId, req.params.empId, req.user.companyId), omitting req.db and shifting every argument.
- payroll.service.js defines updatePayslip(db, runId, empId, data, companyId).
- payroll.controller.js updatePayslip calls svc.updatePayslip(req.params.runId, req.params.empId, req.body, req.user.companyId), again omitting req.db and shifting arguments.
- payroll.service.js defines removeBonus(db, bonusId, runId, companyId).
- payroll.controller.js removeBonus calls svc.removeBonus(req.params.id, req.params.runId, req.user.companyId), omitting req.db and shifting arguments.

**Impact:** These endpoints are expected to fail at runtime when the service attempts to call Prisma methods on a string/incorrect argument. This breaks individual payslip retrieval/edit and bonus removal despite the routes existing.

**Required direction:** Correct controller/service contracts and add API-level tests. While correcting getPayslip, ensure the payroll run is first verified against companyId before returning a payslip. While correcting removeBonus, verify the bonus belongs to the same verified run; do not delete by bonus ID alone.

**Acceptance tests:** Authorized same-company payslip GET/update and bonus removal work; wrong company, wrong run, wrong employee and mismatched bonus IDs return not found/forbidden; invalid argument contracts fail in unit tests.

## 2. Payroll ownership controls observed

Positive controls:
- Payroll run retrieval, processing, lock, publish and deletion first look up the run with company_id.
- Employee selection during payroll processing filters by company_id and active status.
- Salary structure update/delete first verify company_id.
- The employee self-service /my-payslips routes bind employee_id to req.user.employeeId and only return published, non-deleted payslips.

Remaining concern:
- getPayslip accepts companyId but does not verify the run's company in its service query. Correcting the controller argument bug must include the company-scoped run check.
- removeBonus verifies the run's company but deletes the bonus by bonusId without proving that bonusId belongs to the supplied runId.

## 3. Compliance ownership observations

- Main compliance routes are mounted behind auth and checkModuleEnabled('compliance').
- PF/ESI/PT/TDS/LWF administrative endpoints generally use module-level checkPermission.
- TDS declaration handlers derive employeeId from req.user.employeeId rather than trusting a body-supplied employee ID.
- markFiled first finds a filing with both filingId and companyId before updating it.
- These observations are positive source controls only; statutory calculations, payroll reconciliation, state-specific rules, report correctness and end-to-end filing workflows still require dedicated domain verification.

## 4. Audit status

This phase adds GAP-0029 to the master register. No code fix has been made. Continue audit of settings, notification data paths, Central tenant lifecycle, payment/webhook flow, RLS table inventory, document/file pipeline, import/export and operations before Cycle 01 plan drafting.
