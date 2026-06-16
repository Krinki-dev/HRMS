const { sendSuccess, sendError } = require('../../shared/utils/response');
const { resolveTenantId } = require('../../shared/utils/tenantResolver');

exports.getMonthlyAttendanceSummary = async (req, res) => {
  try {
    const db          = req.db;
    const companyId   = await resolveTenantId(req);
    const { month, year, departmentId } = req.query;

    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear  = year  ? parseInt(year)  : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate   = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const where = {
      company_id: companyId,
      date:       { gte: startDate, lte: endDate },
      deleted_at: null,
    };
    if (departmentId) {
      where.employee = { department_id: departmentId };
    }

    const records = await db.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id:          true,
            first_name:  true,
            last_name:   true,
            work_email:  true,
            department_id: true,
            department:  { select: { name: true } },
          },
        },
      },
    });

    const summaryMap = new Map();
    records.forEach(record => {
      const eid = record.employee_id;
      if (!summaryMap.has(eid)) {
        summaryMap.set(eid, {
          employee:    record.employee,
          totalDays:   0,
          presentDays: 0,
          absentDays:  0,
          lateDays:    0,
          halfDays:    0,
          workHours:   0,
        });
      }
      const s = summaryMap.get(eid);
      s.totalDays++;
      if (record.status === 'present')   s.presentDays++;
      else if (record.status === 'absent')   s.absentDays++;
      else if (record.status === 'half_day') s.halfDays++;
      if (record.is_late) s.lateDays++;
      if (record.check_in && record.check_out) {
        s.workHours += (new Date(record.check_out) - new Date(record.check_in)) / 3600000;
      }
    });

    const summaryData = Array.from(summaryMap.values()).map(item => ({
      employeeId:      item.employee.id,
      employeeName:    `${item.employee.first_name} ${item.employee.last_name}`.trim(),
      email:           item.employee.work_email,
      department:      item.employee.department?.name || null,
      totalDays:       item.totalDays,
      presentDays:     item.presentDays,
      absentDays:      item.absentDays,
      lateDays:        item.lateDays,
      halfDays:        item.halfDays,
      workHours:       Math.round(item.workHours * 100) / 100,
      attendanceRate:  item.totalDays > 0
        ? Math.round((item.presentDays / item.totalDays) * 10000) / 100
        : 0,
    }));

    return sendSuccess(res, {
      month:          targetMonth,
      year:           targetYear,
      summary:        summaryData,
      totalEmployees: summaryData.length,
    });
  } catch (e) {
    console.error('[Reports/attendanceSummary]', e.message);
    return sendError(res, 'ERR_REPORTS', e.message || 'Failed to load attendance report', 500);
  }
};

exports.getPayrollSummary = async (req, res) => {
  try {
    const db        = req.db;
    const companyId = await resolveTenantId(req);
    const { month, year, departmentId, status } = req.query;

    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear  = year  ? parseInt(year)  : new Date().getFullYear();

    const run = await db.payroll_runs.findFirst({
      where: {
        company_id: companyId,
        month:      targetMonth,
        year:       targetYear,
        deleted_at: null,
        ...(status && { status }),
      },
      orderBy: { created_at: 'desc' },
    });

    if (!run) {
      return sendSuccess(res, {
        month:        targetMonth,
        year:         targetYear,
        hasPayroll:   false,
        summary:      null,
        records:      [],
      });
    }

    const payslipWhere = { payroll_run_id: run.id };

    const payslips = await db.payslips.findMany({
      where:   payslipWhere,
      include: {
        employee: {
          select: {
            id:           true,
            first_name:   true,
            last_name:    true,
            work_email:   true,
            department_id: true,
            department:   { select: { name: true } },
          },
          ...(departmentId ? { where: { department_id: departmentId } } : {}),
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const summary = {
      runId:              run.id,
      runStatus:          run.status,
      totalRecords:       payslips.length,
      totalGrossSalary:   0,
      totalDeductions:    0,
      totalNetSalary:     0,
      totalTDS:           0,
      totalPF:            0,
      totalESI:           0,
      statusBreakdown:    {},
      departmentBreakdown: {},
    };

    const records = payslips.map(p => {
      summary.totalGrossSalary += p.gross          || 0;
      summary.totalNetSalary   += p.net_salary      || 0;
      summary.totalTDS         += p.tds             || 0;
      summary.totalPF          += (p.pf_employee    || 0) + (p.pf_employer || 0);
      summary.totalESI         += (p.esi_employee   || 0) + (p.esi_employer || 0);
      summary.totalDeductions  += (p.tds || 0) + (p.pf_employee || 0) + (p.esi_employee || 0) + (p.pt || 0);

      const dept = p.employee?.department?.name || 'Unknown';
      if (!summary.departmentBreakdown[dept]) {
        summary.departmentBreakdown[dept] = { count: 0, totalNetSalary: 0 };
      }
      summary.departmentBreakdown[dept].count++;
      summary.departmentBreakdown[dept].totalNetSalary += p.net_salary || 0;

      return {
        employeeId:   p.employee_id,
        employeeName: p.employee
          ? `${p.employee.first_name} ${p.employee.last_name}`.trim()
          : null,
        email:        p.employee?.work_email || null,
        department:   p.employee?.department?.name || null,
        gross:        p.gross,
        netSalary:    p.net_salary,
        tds:          p.tds,
        pfEmployee:   p.pf_employee,
        esiEmployee:  p.esi_employee,
        pt:           p.pt,
      };
    });

    return sendSuccess(res, {
      month:      targetMonth,
      year:       targetYear,
      hasPayroll: true,
      summary,
      records,
    });
  } catch (e) {
    console.error('[Reports/payrollSummary]', e.message);
    return sendError(res, 'ERR_REPORTS', e.message || 'Failed to load payroll report', 500);
  }
};

