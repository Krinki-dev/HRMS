'use strict';

/**
 * Integration test for the compliance module
 * (backend/modules/compliance/compliance.service.js), run against a real
 * Postgres tenant-schema database — not mocked.
 *
 * Regression test for a real cross-company/cross-tenant data leak: every
 * summary function (dashboard, pfSummary, esiSummary, ptSummary, tdsSummary,
 * lwfSummary) looked up the payroll run for a month/year with NO company_id
 * filter, picking whichever run was created most recently regardless of
 * which company asked. Because tenants running in shared "cloud" db_mode
 * (see shared/middleware/tenant.js resolveTenantDB) can have MULTIPLE
 * companies — or even multiple different SaaS tenants — sharing one
 * physical database distinguished only by the `company_id` column, this
 * meant one company could see another's PF/ESI/PT/TDS data, including real
 * PAN and UAN numbers. Fixed by adding `company_id: companyId` to every
 * lookup; this test proves the fix and guards against regressions.
 *
 * Requires a Postgres instance with the tenant schema pushed (see
 * backend/test/README.md — same setup as payroll-integration.test.js).
 * Skips itself if COMPLIANCE_TEST_TENANT_DATABASE_URL is not set.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const TENANT_DB_URL = process.env.COMPLIANCE_TEST_TENANT_DATABASE_URL;

test('compliance.service — company-scoped payroll lookups (no cross-company/cross-tenant leak)', { skip: !TENANT_DB_URL && 'COMPLIANCE_TEST_TENANT_DATABASE_URL not set — see backend/test/README.md' }, async (t) => {
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient({ datasources: { db: { url: TENANT_DB_URL } } });
  const complianceService = require('../modules/compliance/compliance.service');
  t.after(() => db.$disconnect());

  const MONTH = 5;
  const YEAR = 2027;

  const companyA = await db.companies.create({ data: { name: 'Compliance Co A' } });
  const companyB = await db.companies.create({ data: { name: 'Compliance Co B' } });

  const empA = await db.employees.create({
    data: { company_id: companyA.id, employee_code: 'CA-001', first_name: 'Divya', last_name: 'Iyer', status: 'active', uan_number: 'UANAAA111', esi_ip_number: 'ESIAAA111', pan_number: 'AAAAA1111A' },
  });
  const empB = await db.employees.create({
    data: { company_id: companyB.id, employee_code: 'CB-001', first_name: 'Farhan', last_name: 'Khan', status: 'active', uan_number: 'UANBBB222', esi_ip_number: 'ESIBBB222', pan_number: 'BBBBB2222B' },
  });

  // Run A created FIRST, run B created SECOND — the bug used
  // `orderBy: { created_at: 'desc' }` with no company filter, so it would
  // always resolve to run B (the most recent) regardless of which company
  // asked. Company A's queries below must still return Company A's own data.
  const runA = await db.payroll_runs.create({ data: { company_id: companyA.id, month: MONTH, year: YEAR, status: 'locked' } });
  const runB = await db.payroll_runs.create({ data: { company_id: companyB.id, month: MONTH, year: YEAR, status: 'locked' } });

  await db.payslips.create({
    data: {
      payroll_run_id: runA.id, employee_id: empA.id, month: MONTH, year: YEAR,
      working_days: 22, present_days: 22, paid_days: 22,
      gross: 500000, basic: 300000, hra: 200000,
      pf_employee: 36000, pf_employer: 36000, esi_employee: 3750, esi_employer: 16250,
      pt: 2000, tds: 5000, total_deductions: 46750, net_salary: 453250,
    },
  });
  await db.payslips.create({
    data: {
      payroll_run_id: runB.id, employee_id: empB.id, month: MONTH, year: YEAR,
      working_days: 22, present_days: 22, paid_days: 22,
      gross: 900000, basic: 600000, hra: 300000,
      pf_employee: 72000, pf_employer: 72000, esi_employee: 0, esi_employer: 0,
      pt: 2500, tds: 15000, total_deductions: 89500, net_salary: 810500,
    },
  });

  t.after(async () => {
    await db.payslips.deleteMany({ where: { employee_id: { in: [empA.id, empB.id] } } });
    await db.payroll_runs.deleteMany({ where: { id: { in: [runA.id, runB.id] } } });
    await db.employees.deleteMany({ where: { id: { in: [empA.id, empB.id] } } });
    await db.companies.deleteMany({ where: { id: { in: [companyA.id, companyB.id] } } });
  });

  await t.test('pfSummary returns only the requesting company\'s employees and UAN numbers', async () => {
    const result = await complianceService.pfSummary(db, companyA.id, MONTH, YEAR);
    assert.equal(result.payrollRunId, runA.id);
    assert.equal(result.employees.length, 1);
    assert.equal(result.employees[0].uan, 'UANAAA111');
    assert.ok(!result.employees.some((e) => e.uan === 'UANBBB222'), 'must not leak Company B\'s UAN');
  });

  await t.test('esiSummary is scoped to the requesting company', async () => {
    const result = await complianceService.esiSummary(db, companyA.id, MONTH, YEAR);
    assert.equal(result.employees.length, 1);
    assert.equal(result.employees[0].employeeCode, 'CA-001');
  });

  await t.test('ptSummary is scoped to the requesting company', async () => {
    const result = await complianceService.ptSummary(db, companyB.id, MONTH, YEAR);
    assert.equal(result.employees.length, 1);
    assert.equal(result.employees[0].employeeCode, 'CB-001');
    assert.equal(result.summary.totalPT, 2500);
  });

  await t.test('tdsSummary does not leak another company\'s PAN', async () => {
    const result = await complianceService.tdsSummary(db, companyA.id, MONTH, YEAR);
    assert.equal(result.employees.length, 1);
    assert.equal(result.employees[0].pan, 'AAAAA1111A');
    assert.ok(!result.employees.some((e) => e.pan === 'BBBBB2222B'));
  });

  await t.test('dashboard payrollStats reflect the requesting company only', async () => {
    // dashboard() always uses the real current month/year internally (no
    // params), so seed dedicated runs for "now" to exercise it directly.
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    const curRunA = await db.payroll_runs.create({ data: { company_id: companyA.id, month: curMonth, year: curYear, status: 'locked' } });
    const curRunB = await db.payroll_runs.create({ data: { company_id: companyB.id, month: curMonth, year: curYear, status: 'locked' } });
    await db.payslips.create({
      data: {
        payroll_run_id: curRunA.id, employee_id: empA.id, month: curMonth, year: curYear,
        working_days: 22, present_days: 22, paid_days: 22,
        gross: 500000, basic: 300000, hra: 200000,
        pf_employee: 36000, pf_employer: 36000, esi_employee: 3750, esi_employer: 16250,
        pt: 2000, tds: 5000, total_deductions: 46750, net_salary: 453250,
      },
    });
    await db.payslips.create({
      data: {
        payroll_run_id: curRunB.id, employee_id: empB.id, month: curMonth, year: curYear,
        working_days: 22, present_days: 22, paid_days: 22,
        gross: 900000, basic: 600000, hra: 300000,
        pf_employee: 72000, pf_employer: 72000, esi_employee: 0, esi_employer: 0,
        pt: 2500, tds: 15000, total_deductions: 89500, net_salary: 810500,
      },
    });
    t.after(async () => {
      await db.payslips.deleteMany({ where: { payroll_run_id: { in: [curRunA.id, curRunB.id] } } });
      await db.payroll_runs.deleteMany({ where: { id: { in: [curRunA.id, curRunB.id] } } });
    });

    const result = await complianceService.dashboard(db, companyA.id);
    assert.ok(result.payrollStats, 'expected Company A\'s current-month payroll stats to be found');
    assert.equal(result.payrollStats.totalPF, 72000, 'must be Company A\'s own PF total (36000+36000), not Company B\'s (144000)');
  });
});
