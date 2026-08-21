'use strict';

/**
 * Integration test for the payroll processing engine
 * (backend/modules/payroll/payroll.service.js), run against a real Postgres
 * tenant-schema database — not mocked.
 *
 * Covers:
 *   - Salary proration by attendance (LOP days reduce paid days/earnings)
 *   - Statutory PF wage ceiling cap (₹15,000/month) and ESI eligibility
 *     ceiling (₹21,000/month gross), matching Indian payroll rules
 *   - Multi-company isolation WITHIN one tenant database: payroll_runs and
 *     employees are only ever scoped by an explicit `company_id` column in
 *     this schema (there is no per-company RLS or DB separation — see
 *     HRMS_Blueprint/07_FROZEN_DECISIONS.md), so a run for Company A must
 *     never pick up Company B's employees or payslips.
 *   - Run lifecycle guards: lockRun requires 'processed', publishRun
 *     requires 'locked', deleteRun refuses a locked run.
 *
 * Requires a Postgres instance with the tenant schema pushed (see
 * backend/test/README.md). Skips itself if PAYROLL_TEST_TENANT_DATABASE_URL
 * is not set, so it never breaks a normal `npm test` run.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const TENANT_DB_URL = process.env.PAYROLL_TEST_TENANT_DATABASE_URL;

test('payroll.service — proration, PF/ESI ceilings, multi-company isolation, run lifecycle', { skip: !TENANT_DB_URL && 'PAYROLL_TEST_TENANT_DATABASE_URL not set — see backend/test/README.md' }, async (t) => {
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient({ datasources: { db: { url: TENANT_DB_URL } } });
  const payrollService = require('../modules/payroll/payroll.service');
  t.after(() => db.$disconnect());

  const MONTH = 3;
  const YEAR = 2027; // future month, won't collide with real seeded data

  // ── Seed two companies in the SAME tenant database ───────────────────────
  const companyA = await db.companies.create({ data: { name: 'Company A' } });
  const companyB = await db.companies.create({ data: { name: 'Company B' } });

  const structA = await db.salary_structures.create({
    data: { company_id: companyA.id, name: 'Standard', components: '{}' },
  });
  const structB = await db.salary_structures.create({
    data: { company_id: companyB.id, name: 'Standard', components: '{}' },
  });

  // Employee 1: no attendance records seeded -> full month present, no LOP.
  // Basic above the PF wage ceiling (₹15,000 = 1,500,000 paise) to test the cap.
  const emp1 = await db.employees.create({
    data: { company_id: companyA.id, employee_code: 'A-001', first_name: 'Asha', last_name: 'Rao', status: 'active' },
  });
  const salary1 = await db.employee_salaries.create({
    data: {
      employee_id: emp1.id, salary_structure_id: structA.id,
      ctc_annual: 6000000, basic: 3000000, hra: 1200000, gross_monthly: 4200000,
      net_monthly: 4200000, effective_from: new Date(YEAR, 0, 1),
    },
  });

  // Employee 2: 3 explicit absent days -> tests LOP proration. Basic below
  // the PF ceiling, so PF applies to the full (unprorated) basic wage.
  const emp2 = await db.employees.create({
    data: { company_id: companyA.id, employee_code: 'A-002', first_name: 'Bhavesh', last_name: 'Shah', status: 'active' },
  });
  const salary2 = await db.employee_salaries.create({
    data: {
      employee_id: emp2.id, salary_structure_id: structA.id,
      ctc_annual: 1500000, basic: 1000000, hra: 0, gross_monthly: 1000000,
      net_monthly: 1000000, effective_from: new Date(YEAR, 0, 1),
    },
  });
  await db.attendance.createMany({
    data: [1, 2, 3].map((d) => ({
      employee_id: emp2.id, date: new Date(YEAR, MONTH - 1, d), status: 'absent',
    })),
  });

  // Employee in Company B — must never leak into Company A's payroll run.
  const empB = await db.employees.create({
    data: { company_id: companyB.id, employee_code: 'B-001', first_name: 'Chetan', last_name: 'Nair', status: 'active' },
  });
  const salaryB = await db.employee_salaries.create({
    data: {
      employee_id: empB.id, salary_structure_id: structB.id,
      ctc_annual: 2400000, basic: 2000000, hra: 0, gross_monthly: 2000000,
      net_monthly: 2000000, effective_from: new Date(YEAR, 0, 1),
    },
  });

  t.after(async () => {
    await db.payslips.deleteMany({ where: { employee_id: { in: [emp1.id, emp2.id, empB.id] } } });
    await db.payroll_bonuses.deleteMany({ where: { employee_id: { in: [emp1.id, emp2.id, empB.id] } } });
    await db.payroll_runs.deleteMany({ where: { company_id: { in: [companyA.id, companyB.id] } } });
    await db.attendance.deleteMany({ where: { employee_id: { in: [emp1.id, emp2.id, empB.id] } } });
    await db.employee_salaries.deleteMany({ where: { id: { in: [salary1.id, salary2.id, salaryB.id] } } });
    await db.employees.deleteMany({ where: { id: { in: [emp1.id, emp2.id, empB.id] } } });
    await db.salary_structures.deleteMany({ where: { id: { in: [structA.id, structB.id] } } });
    await db.companies.deleteMany({ where: { id: { in: [companyA.id, companyB.id] } } });
  });

  let run;
  await t.test('createRun + processRun computes gross/PF/ESI/net for Company A only', async () => {
    run = await payrollService.createRun(db, companyA.id, MONTH, YEAR);
    const result = await payrollService.processRun(db, run.id, companyA.id, 'tester');

    assert.equal(result.payslipCount, 2, 'only Company A employees should be included');

    const payslips = await db.payslips.findMany({ where: { payroll_run_id: run.id }, orderBy: { employee: { employee_code: 'asc' } } });
    assert.equal(payslips.length, 2);

    const [p1, p2] = payslips;

    // Employee 1: no LOP, basic above PF ceiling.
    assert.equal(p1.paid_days, p1.working_days, 'no absences -> full paid days');
    assert.equal(p1.basic, salary1.basic, 'no proration when fully present');
    assert.equal(p1.gross, salary1.basic + salary1.hra);
    assert.equal(p1.pf_employee, Math.round(1500000 * 0.12), 'PF wage capped at statutory ceiling');
    assert.equal(p1.esi_employee, p1.gross > 2100000 ? 0 : Math.round(p1.gross * 0.0075));
    assert.equal(p1.net_salary, p1.gross - p1.total_deductions);

    // Employee 2: 3 LOP days -> proration must reduce basic proportionally.
    assert.equal(p2.lop_days, 3);
    assert.equal(p2.paid_days, p2.working_days - 3);
    const expectedRatio = p2.paid_days / p2.working_days;
    assert.equal(p2.basic, Math.round(salary2.basic * expectedRatio), 'basic prorated by LOP ratio');
    assert.equal(p2.pf_employee, Math.round(p2.basic * 0.12), 'basic below PF ceiling -> PF on prorated basic');

    // Company B must be completely absent from Company A's run.
    const leaked = payslips.find((p) => p.employee_id === empB.id);
    assert.equal(leaked, undefined, 'Company B employee must not appear in Company A payroll run');
  });

  await t.test('Company B has no payroll run created as a side effect', async () => {
    const runB = await db.payroll_runs.findFirst({ where: { company_id: companyB.id, month: MONTH, year: YEAR } });
    assert.equal(runB, null);
  });

  await t.test('lockRun rejects a run id/company mismatch (cross-company access)', async () => {
    await assert.rejects(
      () => payrollService.lockRun(db, run.id, companyB.id, 'tester'),
      /NOT_FOUND/,
      'a run belonging to Company A must not be lockable via Company B\'s id'
    );
  });

  await t.test('publishRun refuses a run that is not yet locked', async () => {
    await assert.rejects(() => payrollService.publishRun(db, run.id, companyA.id), /NOT_LOCKED/);
  });

  await t.test('lockRun then publishRun succeeds and marks payslips published', async () => {
    const locked = await payrollService.lockRun(db, run.id, companyA.id, 'tester');
    assert.equal(locked.status, 'locked');

    const published = await payrollService.publishRun(db, run.id, companyA.id);
    assert.equal(published.published, true);

    const payslips = await db.payslips.findMany({ where: { payroll_run_id: run.id } });
    assert.ok(payslips.every((p) => p.is_published === true));
  });

  await t.test('deleteRun refuses to delete a locked run', async () => {
    await assert.rejects(() => payrollService.deleteRun(db, run.id, companyA.id), /CANNOT_DELETE_LOCKED/);
  });
});
