const logger = require('../../shared/utils/logger');
const emailService = require('../../shared/utils/emailService');

const payrollService = {

  getDashboard: async (db, companyId) => {
    const now       = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear  = now.getFullYear();
    const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
    const lastYear  = thisMonth === 1 ? thisYear - 1 : thisYear;

    const [currentRun, lastRun, totalEmployees, pendingSalaries] = await Promise.all([
      db.payroll_runs.findFirst({
        where: { company_id: companyId, month: thisMonth, year: thisYear },
      }),
      db.payroll_runs.findFirst({
        where: { company_id: companyId, month: lastMonth, year: lastYear },
      }),
      db.employees.count({
        where: { company_id: companyId, status: 'active', deleted_at: null },
      }),
      
      db.employees.count({
        where: {
          company_id:  companyId,
          status:      'active',
          deleted_at:  null,
          salaries:    { none: {} },
        },
      }),
    ]);

    return {
      currentMonth: { month: thisMonth, year: thisYear, run: currentRun, status: currentRun?.status || 'not_started' },
      lastMonth:    { month: lastMonth,  year: lastYear,  run: lastRun,  totalNet: lastRun?.total_net || 0, totalGross: lastRun?.total_gross || 0 },
      totalEmployees,
      pendingSalaries,
    };
  },

  listRuns: async (db, companyId, query = {}) => {
    const limit = Math.min(parseInt(query.limit) || 12, 24);
    const where = { company_id: companyId };
    if (query.year) where.year = parseInt(query.year);

    const [runs, total] = await Promise.all([
      db.payroll_runs.findMany({
        where,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: limit,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      }),
      db.payroll_runs.count({ where }),
    ]);

    return { data: runs, cursor: runs.length > 0 ? runs[runs.length - 1].id : null, hasMore: runs.length === limit, total };
  },

  createRun: async (db, companyId, month, year) => {
    const existing = await db.payroll_runs.findFirst({
      where: { company_id: companyId, month, year },
    });
    if (existing) throw new Error('ALREADY_EXISTS');

    return db.payroll_runs.create({
      data: { company_id: companyId, month, year, status: 'draft' },
    });
  },

  getRun: async (db, runId, companyId) => {
    const run = await db.payroll_runs.findFirst({
      where: { id: runId, company_id: companyId },
    });
    if (!run) throw new Error('NOT_FOUND');
    return run;
  },

  processRun: async (db, runId, companyId, processedBy) => {
    const run = await db.payroll_runs.findFirst({
      where: { id: runId, company_id: companyId },
    });
    if (!run)               throw new Error('NOT_FOUND');
    if (run.status === 'locked') throw new Error('ALREADY_LOCKED');

    const { month, year } = run;

    const employees = await db.employees.findMany({
      where: {
        company_id: companyId,
        status:     { in: ['active', 'probation', 'notice'] },
        deleted_at: null,
      },
      include: {
        salaries: {
          where:   { effective_to: null },
          orderBy: { effective_from: 'desc' },
          take:    1,
        },
      },
    });

    const daysInMonth = new Date(year, month, 0).getDate();
    const workingDays = await payrollService._getWorkingDays(db, companyId, month, year, daysInMonth);

    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month - 1, daysInMonth, 23, 59, 59);

    const attendanceRecs = await db.attendance.findMany({
      where: {
        date:     { gte: startDate, lte: endDate },
        employee: { company_id: companyId },
      },
      select: { employee_id: true, status: true, overtime_hours: true },
    });

    const attMap = {};
    for (const r of attendanceRecs) {
      if (!attMap[r.employee_id]) attMap[r.employee_id] = { present: 0, absent: 0, onLeave: 0, otHours: 0 };
      const m = attMap[r.employee_id];
      if      (r.status === 'present')  m.present++;
      else if (r.status === 'absent')   m.absent++;
      else if (r.status === 'half_day') m.present += 0.5;
      else if (r.status === 'on_leave') { m.onLeave++; m.present++; } 
      m.otHours += r.overtime_hours || 0;
    }

    const companyEmpIds = employees.map(e => e.id);
    const encashments = companyEmpIds.length > 0
      ? await db.leave_encashments.findMany({
          where: {
            employee_id:    { in: companyEmpIds },
            status:         'approved',
            add_to_payroll: true,
            payslip_id:     null,
          },
        })
      : [];

    const encashMap = {};
    for (const e of encashments) {
      encashMap[e.employee_id] = (encashMap[e.employee_id] || 0) + e.total_amount;
    }

    const bonuses = await db.payroll_bonuses.findMany({
      where: { payroll_run_id: runId },
    });
    const bonusMap = {};
    for (const b of bonuses) {
      bonusMap[b.employee_id] = (bonusMap[b.employee_id] || 0) + b.amount;
    }

    let totalGross = 0, totalDeductions = 0, totalNet = 0;
    const payslips = [];

    for (const emp of employees) {
      const salary = emp.salaries[0];
      if (!salary) continue;

      const att     = attMap[emp.id] || { present: workingDays, absent: 0, onLeave: 0, otHours: 0 };
      const lopDays = Math.max(0, att.absent);
      const paidDays = Math.max(0, workingDays - lopDays);
      const ratio    = workingDays > 0 ? paidDays / workingDays : 1;

      const basic   = Math.round(salary.basic * ratio);
      const hra     = Math.round(salary.hra   * ratio);
      const da      = Math.round((salary.da    || 0) * ratio);
      const ta      = Math.round((salary.ta    || 0) * ratio);
      const special = Math.round((salary.special_allowance || 0) * ratio);
      const gross   = basic + hra + da + ta + special;

      const pfEmployee  = payrollService._calcPF(basic,  salary.pf_employee);
      const pfEmployer  = payrollService._calcPF(basic,  salary.pf_employer);
      const esiEmployee = payrollService._calcESI(gross, salary.esi_employee);
      const esiEmployer = payrollService._calcESI(gross, salary.esi_employer);
      const pt          = salary.pt_monthly  || 0;
      const tds         = salary.tds_monthly || 0;

      const otherEarnings   = (encashMap[emp.id] || 0) + (bonusMap[emp.id] || 0);
      const otherDeductions = 0;
      const totalDeduct     = pfEmployee + esiEmployee + pt + tds + otherDeductions;
      const netSalary       = Math.max(0, gross + otherEarnings - totalDeduct);

      payslips.push({
        payroll_run_id:    runId,
        employee_id:       emp.id,
        month,
        year,
        working_days:      workingDays,
        present_days:      att.present,
        lop_days:          lopDays,
        paid_days:         paidDays,
        gross,
        basic,
        hra,
        da,
        ta,
        special_allowance: special,
        other_earnings:    otherEarnings,
        pf_employee:       pfEmployee,
        pf_employer:       pfEmployer,
        esi_employee:      esiEmployee,
        esi_employer:      esiEmployer,
        pt,
        tds,
        lwf_employee:      0,
        lwf_employer:      0,
        other_deductions:  otherDeductions,
        total_deductions:  totalDeduct,
        net_salary:        netSalary,
        is_published:      false,
      });

      totalGross      += gross + otherEarnings;
      totalDeductions += totalDeduct;
      totalNet        += netSalary;
    }

    await db.payslips.deleteMany({ where: { payroll_run_id: runId } });
    if (payslips.length > 0) {
      await db.payslips.createMany({ data: payslips });
    }

    const updatedRun = await db.payroll_runs.update({
      where: { id: runId },
      data: {
        total_employees:  payslips.length,
        total_gross:      totalGross,
        total_deductions: totalDeductions,
        total_net:        totalNet,
        status:           'processed',
        processed_at:     new Date(),
        processed_by:     processedBy,
      },
    });

    if (encashments.length > 0) {
      await db.leave_encashments.updateMany({
        where: { id: { in: encashments.map(e => e.id) } },
        data:  { status: 'paid' },
      });
    }

    return { run: updatedRun, payslipCount: payslips.length };
  },

  lockRun: async (db, runId, companyId, lockedBy) => {
    const run = await db.payroll_runs.findFirst({ where: { id: runId, company_id: companyId } });
    if (!run) throw new Error('NOT_FOUND');
    if (run.status !== 'processed') throw new Error('NOT_PROCESSED');
    return db.payroll_runs.update({
      where: { id: runId },
      data:  { status: 'locked', locked_at: new Date(), locked_by: lockedBy },
    });
  },

  publishRun: async (db, runId, companyId) => {
    const run = await db.payroll_runs.findFirst({ where: { id: runId, company_id: companyId } });
    if (!run) throw new Error('NOT_FOUND');
    if (run.status !== 'locked') throw new Error('NOT_LOCKED');
    await db.payslips.updateMany({ where: { payroll_run_id: runId }, data: { is_published: true } });

    const publishedPayslips = await db.payslips.findMany({
      where: { payroll_run_id: runId, is_published: true },
      include: {
        employee: {
          select: { id: true, first_name: true, last_name: true, work_email: true, personal_email: true },
        },
      },
    });

    const emailTasks = publishedPayslips.map((p) => {
      const recipient = p.employee?.work_email || p.employee?.personal_email;
      if (!recipient) return Promise.resolve({ skipped: true, reason: 'no_email', payslipId: p.id });
      const name = `${p.employee.first_name || ''} ${p.employee.last_name || ''}`.trim() || recipient;
      return emailService.sendPayslip(db, companyId, {
        email: recipient,
        name,
        month: run.month,
        year:  run.year,
        netSalary: p.net_salary,
      });
    });

    const emailResults = await Promise.allSettled(emailTasks);
    emailResults.forEach((result, idx) => {
      if (result.status === 'rejected') {
        logger.error('[Payroll/PublishRun] Payslip email failed', {
          runId,
          payslipId: publishedPayslips[idx]?.id,
          error: result.reason?.message || result.reason,
        });
      }
    });

    return { published: true };
  },

  deleteRun: async (db, runId, companyId) => {
    const run = await db.payroll_runs.findFirst({ where: { id: runId, company_id: companyId } });
    if (!run) throw new Error('NOT_FOUND');
    if (run.status === 'locked') throw new Error('CANNOT_DELETE_LOCKED');
    await db.payslips.deleteMany({ where: { payroll_run_id: runId } });
    await db.payroll_bonuses.deleteMany({ where: { payroll_run_id: runId } });
    await db.payroll_runs.delete({ where: { id: runId } });
    return { deleted: true };
  },

  listPayslips: async (db, runId, companyId, query = {}) => {
    const run = await db.payroll_runs.findFirst({ where: { id: runId, company_id: companyId } });
    if (!run) throw new Error('NOT_FOUND');

    const limit = Math.min(parseInt(query.limit) || 50, 200);
    const payslips = await db.payslips.findMany({
      where: { payroll_run_id: runId },
      include: {
        employee: {
          select: {
            id: true, first_name: true, last_name: true, employee_code: true,
            department:  { select: { name: true } },
            designation: { select: { name: true } },
            bank_accounts: {
              where:  { is_primary: true, deleted_at: null },
              select: { bank_name: true, ifsc_code: true, account_number: true },
              take:   1,
            },
          },
        },
      },
      orderBy: { employee: { employee_code: 'asc' } },
      take: limit,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    let filtered = payslips;
    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = payslips.filter(p =>
        p.employee.first_name.toLowerCase().includes(s) ||
        p.employee.last_name.toLowerCase().includes(s)  ||
        p.employee.employee_code.toLowerCase().includes(s)
      );
    }

    return { data: filtered, run, cursor: filtered.at(-1)?.id || null, hasMore: payslips.length === limit };
  },

  getPayslip: async (db, runId, empId, companyId) => {
    const payslip = await db.payslips.findFirst({
      where: { payroll_run_id: runId, employee_id: empId },
      include: {
        payroll_run: true,
        employee: {
          select: {
            id: true, first_name: true, last_name: true, employee_code: true,
            department:    { select: { name: true } },
            designation:   { select: { name: true } },
            uan_number: true, esi_ip_number: true,
            bank_accounts: { where: { is_primary: true, deleted_at: null }, take: 1 },
          },
        },
      },
    });
    if (!payslip) throw new Error('NOT_FOUND');
    return payslip;
  },

  updatePayslip: async (db, runId, empId, data, companyId) => {
    const run = await db.payroll_runs.findFirst({ where: { id: runId, company_id: companyId } });
    if (!run)               throw new Error('NOT_FOUND');
    if (run.status === 'locked') throw new Error('RUN_LOCKED');

    const payslip = await db.payslips.findFirst({ where: { payroll_run_id: runId, employee_id: empId } });
    if (!payslip) throw new Error('NOT_FOUND');

    const allowed = ['other_earnings', 'other_deductions', 'tds', 'lop_days'];
    const updateData = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = parseInt(data[key]);
    }

    const merged = { ...payslip, ...updateData };
    const totalDeductions = merged.pf_employee + merged.esi_employee + merged.pt + merged.tds + merged.other_deductions;
    const net_salary      = Math.max(0, merged.gross + merged.other_earnings - totalDeductions);

    return db.payslips.update({
      where: { id: payslip.id },
      data:  { ...updateData, total_deductions: totalDeductions, net_salary },
    });
  },

  addBonus: async (db, runId, companyId, data) => {
    const run = await db.payroll_runs.findFirst({ where: { id: runId, company_id: companyId } });
    if (!run)               throw new Error('NOT_FOUND');
    if (run.status === 'locked') throw new Error('RUN_LOCKED');
    return db.payroll_bonuses.create({
      data: {
        payroll_run_id: runId,
        employee_id:    data.employee_id,
        bonus_type:     data.bonus_type || 'adhoc',
        amount:         parseInt(data.amount),
        taxable:        data.taxable !== false,
        notes:          data.notes || null,
        created_by:     data.created_by || null,
      },
    });
  },

  removeBonus: async (db, bonusId, runId, companyId) => {
    const run = await db.payroll_runs.findFirst({ where: { id: runId, company_id: companyId } });
    if (!run)               throw new Error('NOT_FOUND');
    if (run.status === 'locked') throw new Error('RUN_LOCKED');
    await db.payroll_bonuses.delete({ where: { id: bonusId } });
    return { deleted: true };
  },

  listSalaryStructures: async (db, companyId) => {
    const structures = await db.salary_structures.findMany({
      where:   { company_id: companyId, deleted_at: null },
      orderBy: { created_at: 'desc' },
    });
    return structures.map(s => ({ ...s, components: payrollService._parseJSON(s.components, []) }));
  },

  createSalaryStructure: async (db, companyId, data) => {
    if (!data.name) throw new Error('NAME_REQUIRED');
    return db.salary_structures.create({
      data: { company_id: companyId, name: data.name, components: JSON.stringify(data.components || []) },
    });
  },

  updateSalaryStructure: async (db, id, companyId, data) => {
    const s = await db.salary_structures.findFirst({ where: { id, company_id: companyId, deleted_at: null } });
    if (!s) throw new Error('NOT_FOUND');
    return db.salary_structures.update({
      where: { id },
      data: {
        name:       data.name       || s.name,
        components: data.components ? JSON.stringify(data.components) : s.components,
      },
    });
  },

  deleteSalaryStructure: async (db, id, companyId) => {
    const s = await db.salary_structures.findFirst({ where: { id, company_id: companyId, deleted_at: null } });
    if (!s) throw new Error('NOT_FOUND');
    return db.salary_structures.update({ where: { id }, data: { deleted_at: new Date() } });
  },

  getEmployeeSalary: async (db, empId, companyId) => {
    const emp = await db.employees.findFirst({ where: { id: empId, company_id: companyId, deleted_at: null } });
    if (!emp) throw new Error('NOT_FOUND');

    const current = await db.employee_salaries.findFirst({
      where:   { employee_id: empId, effective_to: null },
      orderBy: { effective_from: 'desc' },
      include: { salary_structure: true },
    });
    const history = await db.employee_salaries.findMany({
      where:   { employee_id: empId, effective_to: { not: null } },
      orderBy: { effective_from: 'desc' },
      take:    5,
    });
    return { current, history };
  },

  setEmployeeSalary: async (db, companyId, data) => {
    const emp = await db.employees.findFirst({ where: { id: data.employee_id, company_id: companyId, deleted_at: null } });
    if (!emp) throw new Error('EMPLOYEE_NOT_FOUND');

    await db.employee_salaries.updateMany({
      where: { employee_id: data.employee_id, effective_to: null },
      data:  { effective_to: new Date(data.effective_from) },
    });

    return db.employee_salaries.create({
      data: {
        employee_id:         data.employee_id,
        salary_structure_id: data.salary_structure_id,
        ctc_annual:          parseInt(data.ctc_annual),
        basic:               parseInt(data.basic),
        hra:                 parseInt(data.hra),
        da:                  parseInt(data.da    || 0),
        ta:                  parseInt(data.ta    || 0),
        special_allowance:   parseInt(data.special_allowance || 0),
        gross_monthly:       parseInt(data.gross_monthly),
        pf_employee:         parseInt(data.pf_employee  || 0),
        pf_employer:         parseInt(data.pf_employer  || 0),
        esi_employee:        parseInt(data.esi_employee || 0),
        esi_employer:        parseInt(data.esi_employer || 0),
        pt_monthly:          parseInt(data.pt_monthly   || 0),
        tds_monthly:         parseInt(data.tds_monthly  || 0),
        net_monthly:         parseInt(data.net_monthly),
        effective_from:      new Date(data.effective_from),
        effective_to:        null,
      },
    });
  },

  monthlyReport: async (db, companyId, month, year) => {
    const run = await db.payroll_runs.findFirst({
      where: { company_id: companyId, month: parseInt(month), year: parseInt(year) },
    });
    if (!run) throw new Error('NOT_FOUND');

    const payslips = await db.payslips.findMany({
      where:   { payroll_run_id: run.id },
      include: {
        employee: { select: { first_name: true, last_name: true, employee_code: true, department: { select: { name: true } } } },
      },
      orderBy: { employee: { employee_code: 'asc' } },
    });

    return { run, payslips };
  },

  bankTransferReport: async (db, companyId, month, year) => {
    const run = await db.payroll_runs.findFirst({
      where: { company_id: companyId, month: parseInt(month), year: parseInt(year) },
    });
    if (!run) throw new Error('NOT_FOUND');

    const payslips = await db.payslips.findMany({
      where:   { payroll_run_id: run.id },
      include: {
        employee: {
          select: {
            first_name: true, last_name: true, employee_code: true,
            bank_accounts: { where: { is_primary: true, deleted_at: null }, select: { bank_name: true, ifsc_code: true, account_number: true }, take: 1 },
          },
        },
      },
    });

    return { run, payslips };
  },

  pfStatement: async (db, companyId, month, year) => {
    const run = await db.payroll_runs.findFirst({
      where: { company_id: companyId, month: parseInt(month), year: parseInt(year) },
    });
    if (!run) throw new Error('NOT_FOUND');

    const payslips = await db.payslips.findMany({
      where:   { payroll_run_id: run.id, pf_employee: { gt: 0 } },
      include: {
        employee: {
          select: { first_name: true, last_name: true, employee_code: true, uan_number: true },
        },
      },
    });

    return {
      run,
      payslips,
      totalEmployee: payslips.reduce((s, p) => s + p.pf_employee, 0),
      totalEmployer: payslips.reduce((s, p) => s + p.pf_employer, 0),
    };
  },

  esiStatement: async (db, companyId, month, year) => {
    const run = await db.payroll_runs.findFirst({
      where: { company_id: companyId, month: parseInt(month), year: parseInt(year) },
    });
    if (!run) throw new Error('NOT_FOUND');

    const payslips = await db.payslips.findMany({
      where:   { payroll_run_id: run.id, esi_employee: { gt: 0 } },
      include: {
        employee: {
          select: { first_name: true, last_name: true, employee_code: true, esi_ip_number: true },
        },
      },
    });

    return {
      run,
      payslips,
      totalEmployee: payslips.reduce((s, p) => s + p.esi_employee, 0),
      totalEmployer: payslips.reduce((s, p) => s + p.esi_employer, 0),
    };
  },

  _getWorkingDays: async (db, companyId, month, year, daysInMonth) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month - 1, daysInMonth);

    const holidays = await db.holidays.findMany({
      where: { company_id: companyId, date: { gte: startDate, lte: endDate }, deleted_at: null },
    });
    const holidayDates = new Set(holidays.map(h => h.date.toISOString().slice(0, 10)));

    let workingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date  = new Date(year, month - 1, d);
      const dow   = date.getDay();
      const dateStr = date.toISOString().slice(0, 10);
      if (dow !== 0 && dow !== 6 && !holidayDates.has(dateStr)) workingDays++;
    }
    return workingDays || 26;
  },

  _calcPF: (basic, override) => {
    if (override != null) return override;
    const pfWage = Math.min(basic, 1500000); 
    return Math.round(pfWage * 0.12);
  },

  _calcESI: (gross, override) => {
    if (override != null) return override;
    if (gross > 2100000) return 0; 
    return Math.round(gross * 0.0075);
  },

  _parseJSON: (val, fallback) => {
    if (!val) return fallback;
    try { return JSON.parse(val); } catch { return fallback; }
  },
};

module.exports = payrollService;

