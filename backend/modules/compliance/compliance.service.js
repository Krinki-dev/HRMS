const toRupees = (paise)  => (paise / 100).toFixed(2);
const toPaise  = (rupees) => Math.round(parseFloat(rupees) * 100);

const currentMonth = () => new Date().getMonth() + 1;
const currentYear  = () => new Date().getFullYear();

function getCurrentFY() {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  if (month >= 4) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

const DUE_DAYS = {
  pf_ecr:      15,
  esi_challan: 21,
  pt_challan:  15,   
  tds:          7,
  lwf:         31,   
  form16:      15,   
};

const FILING_LABELS = {
  pf_ecr:      'PF ECR',
  esi_challan: 'ESI Challan',
  pt_challan:  'PT Challan',
  tds:         'TDS Challan',
  lwf:         'LWF Return',
  form16:      'Form 16',
};

function getDueDate(type, month, year) {
  const day = DUE_DAYS[type] || 15;
  
  if (['pf_ecr', 'esi_challan', 'tds'].includes(type)) {
    return new Date(year, month, day); 
  }
  return new Date(year, month - 1, day);
}

function formatFiling(f) {
  const now    = new Date();
  let   status = f.status;
  if (status === 'pending' && f.due_date && new Date(f.due_date) < now) {
    status = 'overdue';
  }
  return {
    id:            f.id,
    filingType:    f.filing_type,
    label:         FILING_LABELS[f.filing_type] || f.filing_type,
    periodMonth:   f.period_month,
    periodYear:    f.period_year,
    dueDate:       f.due_date,
    status,
    ackNumber:     f.ack_number,
    challanNumber: f.challan_number,
    filedAt:       f.filed_at,
    fileUrl:       f.file_url,
  };
}

const complianceService = {

  dashboard: async (db, companyId) => {
    const month = currentMonth();
    const year  = currentYear();

    await complianceService.ensureFilings(db, companyId, month, year);

    const now      = new Date();
    const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const filings = await db.compliance_filings.findMany({
      where: {
        company_id:   companyId,
        period_year:  year,
        period_month: { gte: month - 1 },
      },
      orderBy: { due_date: 'asc' },
    });

    const formatted = filings.map(formatFiling);
    const overdue   = formatted.filter(f => f.status === 'overdue');
    const dueSoon   = formatted.filter(f => f.status === 'pending' && f.dueDate && new Date(f.dueDate) <= in15Days);
    const upcoming  = formatted.filter(f => f.status === 'pending' && f.dueDate && new Date(f.dueDate) > in15Days);
    const filed     = formatted.filter(f => f.status === 'filed');

    const payrollRun = await db.payroll_runs.findFirst({
      where:   { month, year },
      orderBy: { created_at: 'desc' },
    });

    let payrollStats = null;
    if (payrollRun) {
      const agg = await db.payslips.aggregate({
        where: { payroll_run_id: payrollRun.id },
        _sum: {
          pf_employee: true, pf_employer: true,
          esi_employee: true, esi_employer: true,
          pt: true, tds: true, net_salary: true,
        },
        _count: { id: true },
      });
      payrollStats = {
        employeeCount: agg._count.id,
        totalPF:       (agg._sum.pf_employee || 0) + (agg._sum.pf_employer || 0),
        totalESI:      (agg._sum.esi_employee || 0) + (agg._sum.esi_employer || 0),
        totalPT:        agg._sum.pt  || 0,
        totalTDS:       agg._sum.tds || 0,
        payrollStatus:  payrollRun.status,
      };
    }

    return { overdue, dueSoon, upcoming, filed, payrollStats, month, year };
  },

  ensureFilings: async (db, companyId, month, year) => {
    const m = month || currentMonth();
    const y = year  || currentYear();
    const types = ['pf_ecr', 'esi_challan', 'pt_challan', 'tds'];

    for (const type of types) {
      const exists = await db.compliance_filings.findFirst({
        where: { company_id: companyId, filing_type: type, period_month: m, period_year: y },
      });
      if (!exists) {
        await db.compliance_filings.create({
          data: {
            company_id:   companyId,
            filing_type:  type,
            period_month: m,
            period_year:  y,
            due_date:     getDueDate(type, m, y),
            status:       'pending',
          },
        });
      }
    }
    
    if ([6, 12].includes(m)) {
      const exists = await db.compliance_filings.findFirst({
        where: { company_id: companyId, filing_type: 'lwf', period_month: m, period_year: y },
      });
      if (!exists) {
        await db.compliance_filings.create({
          data: {
            company_id:   companyId,
            filing_type:  'lwf',
            period_month: m,
            period_year:  y,
            due_date:     getDueDate('lwf', m, y),
            status:       'pending',
          },
        });
      }
    }
  },

  calendar: async (db, companyId, year) => {
    const y = year || currentYear();

    const filings = await db.compliance_filings.findMany({
      where:   { company_id: companyId, period_year: y },
      orderBy: { due_date: 'asc' },
    });

    const events = filings.map(f => ({ ...formatFiling(f), date: f.due_date }));

    const annualEvents = [
      { label: 'Form 16 Issue Deadline', date: new Date(y, 5, 15),  filingType: 'form16',     status: 'info' },
      { label: 'PF Annual Return',        date: new Date(y, 3, 30),  filingType: 'pf_annual',  status: 'info' },
    ];

    return { events, annualEvents, year: y };
  },

  pfSummary: async (db, companyId, month, year) => {
    const m = month || currentMonth();
    const y = year  || currentYear();

    const run = await db.payroll_runs.findFirst({
      where:   { month: m, year: y },
      orderBy: { created_at: 'desc' },
    });

    if (!run) return { month: m, year: y, hasPayroll: false, employees: [], summary: null };

    const payslips = await db.payslips.findMany({
      where: { payroll_run_id: run.id, pf_employee: { gt: 0 } },
      include: {
        employee: {
          select: {
            id: true, first_name: true, last_name: true,
            employee_code: true, uan_number: true, esi_ip_number: true,
          },
        },
      },
    });

    const employees = payslips.map(p => ({
      employeeId:   p.employee_id,
      employeeCode: p.employee.employee_code,
      name:         `${p.employee.first_name} ${p.employee.last_name}`,
      uan:          p.employee.uan_number || '',
      basic:        p.basic,
      pfWages:      p.basic,
      pfEmployee:   p.pf_employee,
      pfEmployer:   p.pf_employer,
      eps:          Math.min(Math.round(p.basic * 0.0833), 125000),
      edli:         Math.round(Math.min(p.basic, 150000) * 0.005),
    }));

    const summary = {
      totalEmployees:  employees.length,
      totalPFEmployee: employees.reduce((s, e) => s + e.pfEmployee, 0),
      totalPFEmployer: employees.reduce((s, e) => s + e.pfEmployer, 0),
      totalEPS:        employees.reduce((s, e) => s + e.eps, 0),
      totalEDLI:       employees.reduce((s, e) => s + e.edli, 0),
      payrollStatus:   run.status,
    };
    summary.grandTotal = summary.totalPFEmployee + summary.totalPFEmployer;

    return { month: m, year: y, hasPayroll: true, employees, summary, payrollRunId: run.id };
  },

  generateECR: async (db, companyId, month, year) => {
    const data = await complianceService.pfSummary(db, companyId, month, year);
    if (!data.hasPayroll) throw new Error('NO_PAYROLL');
    if (data.summary.payrollStatus === 'draft') throw new Error('PAYROLL_NOT_LOCKED');

    const lines = [];
    lines.push('#~#'); 

    for (const emp of data.employees) {
      if (!emp.uan) continue;

      const grossWages = Math.round(emp.pfWages / 100);
      const epfWages   = Math.round(emp.pfWages / 100);
      const epsWages   = Math.min(grossWages, 15000);
      const eeShare    = Math.round(emp.pfEmployee / 100);
      const erShare    = Math.round(emp.pfEmployer / 100);
      const eps        = Math.round(emp.eps / 100);

      lines.push([
        emp.uan,
        emp.name.toUpperCase().replace(/[^A-Z0-9 ]/g, ''),
        grossWages,
        epfWages,
        epsWages,
        eeShare,
        erShare,
        eps,
        0,   
        0,   
      ].join('#~#'));
    }

    return {
      fileName:     `ECR_${year}_${String(month).padStart(2, '0')}.txt`,
      content:      lines.join('\n'),
      totalRecords: data.employees.filter(e => e.uan).length,
      skipped:      data.employees.filter(e => !e.uan).length,
      summary:      data.summary,
    };
  },

  missingUAN: async (db, companyId) => {
    return db.employees.findMany({
      where: {
        company_id: companyId,
        status:     'active',
        deleted_at: null,
        uan_number: null,
      },
      select: {
        id: true, first_name: true, last_name: true,
        employee_code: true, date_of_joining: true,
        department: { select: { name: true } },
      },
    });
  },

  updateUAN: async (db, companyId, updates) => {
    const results = [];
    for (const u of updates) {
      await db.employees.update({
        where: { id: u.employeeId, company_id: companyId },
        data:  { uan_number: u.uanNumber },
      });
      results.push(u.employeeId);
    }
    return { updated: results.length };
  },

  esiSummary: async (db, companyId, month, year) => {
    const m = month || currentMonth();
    const y = year  || currentYear();

    const run = await db.payroll_runs.findFirst({
      where:   { month: m, year: y },
      orderBy: { created_at: 'desc' },
    });

    if (!run) return { month: m, year: y, hasPayroll: false, employees: [], summary: null };

    const payslips = await db.payslips.findMany({
      where: { payroll_run_id: run.id, esi_employee: { gt: 0 } },
      include: {
        employee: {
          select: {
            id: true, first_name: true, last_name: true,
            employee_code: true, esi_ip_number: true,
          },
        },
      },
    });

    const employees = payslips.map(p => ({
      employeeId:   p.employee_id,
      employeeCode: p.employee.employee_code,
      name:         `${p.employee.first_name} ${p.employee.last_name}`,
      ipNumber:     p.employee.esi_ip_number || '',
      gross:        p.gross,
      esiEmployee:  p.esi_employee,
      esiEmployer:  p.esi_employer,
      total:        p.esi_employee + p.esi_employer,
    }));

    const summary = {
      totalEmployees:   employees.length,
      totalESIWages:    employees.reduce((s, e) => s + e.gross, 0),
      totalESIEmployee: employees.reduce((s, e) => s + e.esiEmployee, 0),
      totalESIEmployer: employees.reduce((s, e) => s + e.esiEmployer, 0),
      payrollStatus:    run.status,
    };
    summary.grandTotal = summary.totalESIEmployee + summary.totalESIEmployer;

    return { month: m, year: y, hasPayroll: true, employees, summary };
  },

  generateESIChallan: async (db, companyId, month, year) => {
    const data = await complianceService.esiSummary(db, companyId, month, year);
    if (!data.hasPayroll) throw new Error('NO_PAYROLL');
    if (!data.summary || data.summary.payrollStatus === 'draft') throw new Error('PAYROLL_NOT_LOCKED');

    const nextMonth = month + 1 > 12 ? 1 : month + 1;
    return {
      period:        `${String(month).padStart(2, '0')}/${year}`,
      dueDate:       `21/${String(nextMonth).padStart(2, '0')}/${year}`,
      employeeCount:  data.summary.totalEmployees,
      totalWages:    Math.round(data.summary.totalESIWages / 100),
      employeeESI:   Math.round(data.summary.totalESIEmployee / 100),
      employerESI:   Math.round(data.summary.totalESIEmployer / 100),
      totalESI:      Math.round(data.summary.grandTotal / 100),
    };
  },

  ptSlabs: async (db, state) => {
    if (state) {
      return db.pt_slabs.findMany({ where: { state }, orderBy: { min_salary: 'asc' } });
    }
    return db.pt_slabs.findMany({ orderBy: [{ state: 'asc' }, { min_salary: 'asc' }] });
  },

  ptSummary: async (db, companyId, month, year) => {
    const m = month || currentMonth();
    const y = year  || currentYear();

    const run = await db.payroll_runs.findFirst({
      where:   { month: m, year: y },
      orderBy: { created_at: 'desc' },
    });

    if (!run) return { month: m, year: y, hasPayroll: false, employees: [], summary: null };

    const payslips = await db.payslips.findMany({
      where: { payroll_run_id: run.id, pt: { gt: 0 } },
      include: {
        employee: {
          select: { id: true, first_name: true, last_name: true, employee_code: true },
        },
      },
    });

    const employees = payslips.map(p => ({
      employeeId:   p.employee_id,
      employeeCode: p.employee.employee_code,
      name:         `${p.employee.first_name} ${p.employee.last_name}`,
      gross:        p.gross,
      pt:           p.pt,
    }));

    const summary = {
      totalEmployees: employees.length,
      totalPT:        employees.reduce((s, e) => s + e.pt, 0),
      payrollStatus:  run.status,
    };

    return { month: m, year: y, hasPayroll: true, employees, summary };
  },

  generatePTChallan: async (db, companyId, month, year) => {
    const data = await complianceService.ptSummary(db, companyId, month, year);
    if (!data.hasPayroll) throw new Error('NO_PAYROLL');
    if (!data.summary || data.summary.payrollStatus === 'draft') throw new Error('PAYROLL_NOT_LOCKED');

    return {
      period:        `${String(month).padStart(2, '0')}/${year}`,
      employeeCount:  data.summary.totalEmployees,
      totalPT:       Math.round(data.summary.totalPT / 100),
      employees:     data.employees.map(e => ({
        name:  e.name,
        code:  e.employeeCode,
        gross: Math.round(e.gross / 100),
        pt:    Math.round(e.pt / 100),
      })),
    };
  },

  tdsSummary: async (db, companyId, month, year) => {
    const m = month || currentMonth();
    const y = year  || currentYear();

    const run = await db.payroll_runs.findFirst({
      where:   { month: m, year: y },
      orderBy: { created_at: 'desc' },
    });

    if (!run) return { month: m, year: y, hasPayroll: false, employees: [], summary: null };

    const payslips = await db.payslips.findMany({
      where: { payroll_run_id: run.id, tds: { gt: 0 } },
      include: {
        employee: {
          select: {
            id: true, first_name: true, last_name: true,
            employee_code: true, pan_number: true,
          },
        },
      },
    });

    const employees = payslips.map(p => ({
      employeeId:   p.employee_id,
      employeeCode: p.employee.employee_code,
      name:         `${p.employee.first_name} ${p.employee.last_name}`,
      pan:          p.employee.pan_number || '',
      gross:        p.gross,
      tds:          p.tds,
    }));

    const summary = {
      totalEmployees: employees.length,
      totalTDS:       employees.reduce((s, e) => s + e.tds, 0),
      payrollStatus:  run.status,
    };

    return { month: m, year: y, hasPayroll: true, employees, summary };
  },

  getMyDeclaration: async (db, employeeId, financialYear) => {
    const fy = financialYear || getCurrentFY();
    return db.tds_declarations.findFirst({
      where: { employee_id: employeeId, financial_year: fy },
    });
  },

  saveDeclaration: async (db, employeeId, data) => {
    const fy = data.financialYear || getCurrentFY();

    const existing = await db.tds_declarations.findFirst({
      where: { employee_id: employeeId, financial_year: fy },
    });

    const payload = {
      regime:              data.regime || 'new',
      hra_rent:            toPaise(data.hraRent || 0),
      landlord_pan:        data.landlordPan || null,
      section_80c:         toPaise(data.section80c || 0),
      section_80d:         toPaise(data.section80d || 0),
      section_80g:         toPaise(data.section80g || 0),
      home_loan_interest:  toPaise(data.homeLoanInterest || 0),
      lta:                 toPaise(data.lta || 0),
      submitted_at:        new Date(),
    };

    if (existing) {
      return db.tds_declarations.update({ where: { id: existing.id }, data: payload });
    }
    return db.tds_declarations.create({
      data: { employee_id: employeeId, financial_year: fy, ...payload },
    });
  },

  generateForm16: async (db, companyId, financialYear) => {
    const fy = financialYear || getCurrentFY();
    const [startYear, endYear] = fy.split('-').map(Number);

    const payslips = await db.payslips.findMany({
      where: {
        employee: { company_id: companyId, deleted_at: null },
        OR: [
          { year: startYear, month: { in: [4, 5, 6, 7, 8, 9, 10, 11, 12] } },
          { year: endYear,   month: { in: [1, 2, 3] } },
        ],
      },
      include: {
        employee: {
          select: {
            id: true, first_name: true, last_name: true,
            employee_code: true, pan_number: true, work_email: true,
          },
        },
      },
    });

    const empMap = {};
    for (const p of payslips) {
      const id = p.employee_id;
      if (!empMap[id]) {
        empMap[id] = { employee: p.employee, gross: 0, basic: 0, hra: 0, pf: 0, tds: 0, pt: 0, net: 0 };
      }
      empMap[id].gross += p.gross;
      empMap[id].basic += p.basic;
      empMap[id].hra   += p.hra;
      empMap[id].pf    += p.pf_employee;
      empMap[id].tds   += p.tds;
      empMap[id].pt    += p.pt;
      empMap[id].net   += p.net_salary;
    }

    const form16List = Object.values(empMap).map(e => ({
      employeeCode:  e.employee.employee_code,
      name:          `${e.employee.first_name} ${e.employee.last_name}`,
      pan:           e.employee.pan_number || 'N/A',
      email:         e.employee.work_email || '',
      financialYear: fy,
      grossSalary:   Math.round(e.gross / 100),
      basicSalary:   Math.round(e.basic / 100),
      hra:           Math.round(e.hra / 100),
      pfDeduction:   Math.round(e.pf / 100),
      ptDeduction:   Math.round(e.pt / 100),
      totalTDS:      Math.round(e.tds / 100),
      netSalary:     Math.round(e.net / 100),
    }));

    return { financialYear: fy, employees: form16List, total: form16List.length };
  },

  lwfRules: async (db, state) => {
    if (state) {
      return db.lwf_rules.findFirst({ where: { state } });
    }
    return db.lwf_rules.findMany({ orderBy: { state: 'asc' } });
  },

  lwfSummary: async (db, companyId, month, year) => {
    const m = month || currentMonth();
    const y = year  || currentYear();

    const run = await db.payroll_runs.findFirst({
      where:   { month: m, year: y },
      orderBy: { created_at: 'desc' },
    });

    if (!run) return { month: m, year: y, hasPayroll: false, employees: [], summary: null };

    const payslips = await db.payslips.findMany({
      where: { payroll_run_id: run.id, lwf_employee: { gt: 0 } },
      include: {
        employee: {
          select: { id: true, first_name: true, last_name: true, employee_code: true },
        },
      },
    });

    const employees = payslips.map(p => ({
      employeeId:   p.employee_id,
      employeeCode: p.employee.employee_code,
      name:         `${p.employee.first_name} ${p.employee.last_name}`,
      lwfEmployee:  p.lwf_employee,
      lwfEmployer:  p.lwf_employer,
    }));

    const summary = {
      totalEmployees:   employees.length,
      totalLWFEmployee: employees.reduce((s, e) => s + e.lwfEmployee, 0),
      totalLWFEmployer: employees.reduce((s, e) => s + e.lwfEmployer, 0),
    };
    summary.grandTotal = summary.totalLWFEmployee + summary.totalLWFEmployer;

    return { month: m, year: y, hasPayroll: true, employees, summary };
  },

  generateLWFReturn: async (db, companyId, month, year) => {
    const data = await complianceService.lwfSummary(db, companyId, month, year);
    if (!data.hasPayroll) throw new Error('NO_PAYROLL');
    return data;
  },

  listFilings: async (db, companyId, month, year) => {
    const m = month || currentMonth();
    const y = year  || currentYear();

    const filings = await db.compliance_filings.findMany({
      where:   { company_id: companyId, period_year: y, period_month: m },
      orderBy: { due_date: 'asc' },
    });

    return filings.map(formatFiling);
  },

  markFiled: async (db, companyId, filingId, { ackNumber, challanNumber }) => {
    const filing = await db.compliance_filings.findFirst({
      where: { id: filingId, company_id: companyId },
    });
    if (!filing) throw new Error('NOT_FOUND');

    return db.compliance_filings.update({
      where: { id: filingId },
      data: {
        status:         'filed',
        filed_at:       new Date(),
        ack_number:     ackNumber     || null,
        challan_number: challanNumber || null,
      },
    });
  },

};

module.exports = complianceService;

