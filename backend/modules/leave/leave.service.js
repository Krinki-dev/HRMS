/**
 * @file leave.service.js
 * @description Leave management and accrual logic with enriched Mac-style logging.
 */
const logger = require('../../shared/utils/logger');
const { THEME } = require('../../shared/utils/uiConstants');

const todayIST = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 330);
  return now.toISOString().slice(0, 10);
};

const leaveService = {

  dashboard: async (db, employeeId, companyId, isHR = false) => {
    const today = new Date(todayIST());
    const year  = today.getFullYear();
    logger.debug(`${THEME.ICONS.INFO} Fetching leave dashboard for employee ${employeeId}`);

    const [balances, myPending, myUpcoming, pendingCount, teamOnLeave] = await Promise.all([
      
      db.leave_balances.findMany({
        where: { employee_id: employeeId, year },
        include: { leave_type: { select: { id: true, name: true, code: true, is_paid: true } } },
      }),
      
      db.leave_applications.findMany({
        where: { employee_id: employeeId, status: 'pending' },
        include: { leave_type: { select: { name: true, code: true } } },
        orderBy: { from_date: 'asc' },
      }),
      
      db.leave_applications.findMany({
        where: { employee_id: employeeId, status: 'approved', from_date: { gte: today } },
        include: { leave_type: { select: { name: true, code: true } } },
        take: 5, orderBy: { from_date: 'asc' },
      }),
      
      isHR ? db.leave_applications.count({
        where: {
          status: 'pending',
          employee: { company_id: companyId },
        },
      }) : Promise.resolve(0),
      
      db.leave_applications.findMany({
        where: {
          status:    'approved',
          from_date: { lte: today },
          to_date:   { gte: today },
          employee:  { company_id: companyId },
        },
        include: {
          employee:   { select: { id: true, first_name: true, last_name: true, photo_url: true } },
          leave_type: { select: { name: true } },
        },
        take: 20,
      }),
    ]);

    return {
      balances:         balances.map(leaveService._fmtBalance),
      myPending,
      myUpcoming,
      pendingApprovals: pendingCount,
      teamOnLeave: teamOnLeave.map(l => ({
        id:        l.id,
        employee:  { id: l.employee.id, fullName: `${l.employee.first_name} ${l.employee.last_name}`, photoUrl: l.employee.photo_url },
        leaveType: l.leave_type.name,
        fromDate:  l.from_date,
        toDate:    l.to_date,
        days:      l.days,
      })),
    };
  },

  calendar: async (db, companyId, month, year) => {
    const m     = parseInt(month) || new Date().getMonth() + 1;
    const y     = parseInt(year)  || new Date().getFullYear();
    const start = new Date(`${y}-${String(m).padStart(2,'0')}-01`);
    const end   = new Date(start);
    logger.debug(`${THEME.ICONS.INFO} Loading leave calendar for ${m}/${y}`);
    end.setMonth(end.getMonth() + 1);

    const [leaves, holidays] = await Promise.all([
      db.leave_applications.findMany({
        where: {
          status:   'approved',
          employee: { company_id: companyId },
          OR: [
            { from_date: { gte: start, lt: end } },
            { to_date:   { gte: start, lt: end } },
            { AND: [{ from_date: { lt: start } }, { to_date: { gte: end } }] },
          ],
        },
        include: {
          employee:   { select: { id: true, first_name: true, last_name: true } },
          leave_type: { select: { name: true } },
        },
      }),
      db.holidays.findMany({
        where: { company_id: companyId, deleted_at: null, date: { gte: start, lt: end } },
      }),
    ]);

    return { leaves, holidays, month: m, year: y };
  },

  list: async (db, companyId, query = {}) => {
    const { status, employeeId, from, to, limit = 30, cursor } = query;
    logger.debug(`${THEME.ICONS.PROCESS} Listing leave applications for company: ${companyId}`);

    const where = { employee: { company_id: companyId } };
    if (status)     where.status      = status;
    if (employeeId) where.employee_id = employeeId;
    if (from && to) where.from_date   = { gte: new Date(from), lte: new Date(to) };

    return db.leave_applications.findMany({
      where,
      take:    parseInt(limit),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { created_at: 'desc' },
      include: {
        employee:   { select: { id: true, first_name: true, last_name: true, employee_code: true } },
        leave_type: { select: { id: true, name: true, code: true } },
      },
    });
  },

  myApplications: async (db, employeeId, query = {}) => {
    const { status, year } = query;
    const where = { employee_id: employeeId };
    if (status) where.status = status;
    if (year) {
      where.from_date = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }
    return db.leave_applications.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: { leave_type: { select: { name: true, code: true, is_paid: true } } },
    });
  },

  calculateDays: async (db, companyId, employeeId, { fromDate, toDate, halfDay }) => {
    if (halfDay) return { days: 0.5, workingDays: 0.5 };
    logger.debug(`${THEME.ICONS.PROCESS} Calculating leave days: ${fromDate} to ${toDate}`);

    const start = new Date(fromDate);
    const end   = new Date(toDate);
    if (start > end) return { days: 0, workingDays: 0 };

    const empShift = await db.employee_shifts.findFirst({
      where:   { employee_id: employeeId, deleted_at: null },
      include: { shift: true },
    }).catch(() => null);

    const weekOffs = (() => {
      try { return JSON.parse(empShift?.shift?.week_offs || '["sunday"]'); }
      catch { return ['sunday']; }
    })();

    const holidays = await db.holidays.findMany({
      where: { company_id: companyId, deleted_at: null, date: { gte: start, lte: end } },
      select: { date: true },
    });
    const holidayDates = new Set(holidays.map(h => h.date.toISOString().slice(0,10)));

    const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    let days = 0;
    const cur = new Date(start);
    while (cur <= end) {
      if (!weekOffs.includes(DAYS[cur.getDay()]) && !holidayDates.has(cur.toISOString().slice(0,10))) {
        days++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return { days, workingDays: days };
  },

  apply: async (db, employeeId, companyId, data) => {
    const { leaveTypeId, fromDate, toDate, halfDay, halfDaySession, reason } = data;
    logger.info(`${THEME.ICONS.WAIT} Applying for leave: Employee ${employeeId}, Type ${leaveTypeId}`);

    const from = new Date(fromDate);
    const to   = new Date(toDate || fromDate);
    if (from > to) throw new Error('INVALID_DATES');

    const { days } = await leaveService.calculateDays(db, companyId, employeeId, { fromDate, toDate: toDate || fromDate, halfDay });
    if (days <= 0) throw new Error('NO_WORKING_DAYS');

    const overlap = await db.leave_applications.findFirst({
      where: {
        employee_id: employeeId,
        status:      { not: 'rejected' },
        AND: [
          { from_date: { lte: to } },
          { to_date:   { gte: from } },
        ],
      },
    });
    if (overlap) throw new Error('OVERLAPPING_LEAVE');

    const leaveType = await db.leave_types.findFirst({
      where: { id: leaveTypeId, company_id: companyId },
    });
    if (!leaveType) throw new Error('INVALID_LEAVE_TYPE');

    if (leaveType.code !== 'LWP') {
      const year    = from.getFullYear();
      const balance = await db.leave_balances.findFirst({
        where: { employee_id: employeeId, leave_type_id: leaveTypeId, year },
      });
      const available = balance ? (balance.opening + balance.accrued - balance.used - balance.pending) : 0;
      if (available < days) throw new Error('INSUFFICIENT_BALANCE');
    }

    const application = await db.leave_applications.create({
      data: {
        employee_id:      employeeId,
        leave_type_id:    leaveTypeId,
        from_date:        from,
        to_date:          to,
        days,
        half_day:         halfDay       || false,
        half_day_session: halfDaySession || null,
        reason:           reason         || null,
        status:           'pending',
      },
    });

    const year = from.getFullYear();
    await leaveService._updateBalance(db, employeeId, leaveTypeId, year, companyId, { pendingDelta: days });

    return application;
  },

  getPendingApprovals: async (db, companyId, isHR = false, managerId = null) => {
    const where = {
      status:   'pending',
      employee: { company_id: companyId },
    };

    if (!isHR && managerId) {
      where.employee = { company_id: companyId, reporting_to: managerId };
    }

    return db.leave_applications.findMany({
      where,
      orderBy: { created_at: 'asc' },
      include: {
        employee: {
          select: {
            id: true, first_name: true, last_name: true,
            photo_url: true, employee_code: true,
            department: { select: { name: true } },
          },
        },
        leave_type: { select: { name: true, code: true, is_paid: true } },
      },
    });
  },

  approveLeave: async (db, applicationId, companyId, approverId) => {
    logger.info(`${THEME.ICONS.SUCCESS} Approving leave: ${applicationId} by ${approverId}`);
    const app = await db.leave_applications.findFirst({
      where: { id: applicationId, status: 'pending', employee: { company_id: companyId } },
    });
    if (!app) throw new Error('NOT_FOUND');

    const year = new Date(app.from_date).getFullYear();

    await Promise.all([
      db.leave_applications.update({
        where: { id: applicationId },
        data: {
          status:      'approved',
          approved_by: approverId,
          approved_at: new Date(),
        },
      }),
      leaveService._updateBalance(db, app.employee_id, app.leave_type_id, year, companyId, {
        pendingDelta: -app.days,
        usedDelta:    app.days,
      }),
      leaveService._markAttendanceOnLeave(db, app.employee_id, app.from_date, app.to_date),
    ]);
  },

  rejectLeave: async (db, applicationId, companyId, approverId, reason) => {
    if (!reason?.trim()) throw new Error('REASON_REQUIRED');
    logger.warn(`${THEME.ICONS.ERROR} Rejecting leave: ${applicationId}`);

    const app = await db.leave_applications.findFirst({
      where: { id: applicationId, status: 'pending', employee: { company_id: companyId } },
    });
    if (!app) throw new Error('NOT_FOUND');

    const year = new Date(app.from_date).getFullYear();

    await Promise.all([
      db.leave_applications.update({
        where: { id: applicationId },
        data: {
          status:           'rejected',
          approved_by:      approverId,
          rejection_reason: reason,
        },
      }),
      leaveService._updateBalance(db, app.employee_id, app.leave_type_id, year, companyId, {
        pendingDelta: -app.days,
      }),
    ]);
  },

  cancelLeave: async (db, applicationId, employeeId) => {
    const app = await db.leave_applications.findFirst({
      where: { id: applicationId, employee_id: employeeId },
    });
    if (!app) throw new Error('NOT_FOUND');
    if (!['pending','approved'].includes(app.status)) throw new Error('CANNOT_CANCEL');

    const today = new Date(todayIST());
    if (new Date(app.from_date) < today && app.status === 'approved') throw new Error('PAST_LEAVE');

    const year = new Date(app.from_date).getFullYear();

    await Promise.all([
      db.leave_applications.update({
        where: { id: applicationId },
        data: { status: 'cancelled', cancelled_at: new Date() },
      }),
      leaveService._updateBalance(db, app.employee_id, app.leave_type_id, year, null, {
        pendingDelta: app.status === 'pending' ? -app.days : 0,
        usedDelta:    app.status === 'approved' ? -app.days : 0,
      }),
    ]);
  },

  getBalances: async (db, employeeId, year) => {
    const y = parseInt(year) || new Date().getFullYear();
    const balances = await db.leave_balances.findMany({
      where: { employee_id: employeeId, year: y },
      include: { leave_type: { select: { id: true, name: true, code: true, is_paid: true, encashable: true } } },
    });
    return balances.map(leaveService._fmtBalance);
  },

  getLeaveTypes: async (db, companyId) => {
    return db.leave_types.findMany({
      where: { company_id: companyId, deleted_at: null, is_active: true },
      orderBy: { name: 'asc' },
    });
  },

  createLeaveType: async (db, companyId, data) => {
    const lt = await db.leave_types.create({
      data: {
        company_id:          companyId,
        name:                data.name,
        code:                data.code?.toUpperCase(),
        is_paid:             data.isPaid !== false,
        accrual_type:        data.accrualType        || 'yearly',
        accrual_days:        parseFloat(data.accrualDays) || 0,
        max_balance:         data.maxBalance          ? parseFloat(data.maxBalance) : null,
        carry_forward:       data.carryForward        || false,
        max_carry_forward:   data.maxCarryForward      ? parseFloat(data.maxCarryForward) : null,
        encashable:          data.encashable           || false,  
        min_days_per_app:    data.minDaysPerApp        ? parseFloat(data.minDaysPerApp) : 0.5,
        max_days_per_app:    data.maxDaysPerApp        ? parseFloat(data.maxDaysPerApp) : null,
        advance_notice_days: data.advanceNoticeDays    || 0,
        allow_past_date:     data.allowPastDate        || false,
        half_day_allowed:    data.halfDayAllowed !== false,       
        document_required:   data.documentRequired     || 'never',
        document_after_days: data.documentAfterDays    || null,
        gender_specific:     data.genderSpecific        || 'all', 
        min_service_months:  data.minServiceMonths      || 0,     
        is_active:           true,
      },
    });

    const employees = await db.employees.findMany({
      where: { company_id: companyId, status: 'active', deleted_at: null },
      select: { id: true },
    });
    const year = new Date().getFullYear();
    if (employees.length > 0) {
      await db.leave_balances.createMany({
        data: employees.map(e => ({
          employee_id:   e.id,
          leave_type_id: lt.id,
          year,
          opening: 0, accrued: 0, used: 0, pending: 0,
        })),
        skipDuplicates: true,
      });
    }
    return lt;
  },

  updateLeaveType: async (db, id, companyId, data) => {
    const lt = await db.leave_types.findFirst({ where: { id, company_id: companyId } });
    if (!lt) throw new Error('NOT_FOUND');
    return db.leave_types.update({
      where: { id },
      data: {
        name:               data.name              ?? lt.name,
        is_paid:            data.isPaid             ?? lt.is_paid,
        accrual_type:       data.accrualType        ?? lt.accrual_type,
        accrual_days:       data.accrualDays != null ? parseFloat(data.accrualDays) : lt.accrual_days,
        carry_forward:      data.carryForward        ?? lt.carry_forward,
        max_carry_forward:  data.maxCarryForward != null ? parseFloat(data.maxCarryForward) : lt.max_carry_forward,
        encashable:         data.encashable           ?? lt.encashable,
        half_day_allowed:   data.halfDayAllowed        ?? lt.half_day_allowed,
        document_required:  data.documentRequired      ?? lt.document_required,
        gender_specific:    data.genderSpecific         ?? lt.gender_specific,
        min_service_months: data.minServiceMonths != null ? parseInt(data.minServiceMonths) : lt.min_service_months,
        is_active:          data.isActive               ?? lt.is_active,
      },
    });
  },

  deleteLeaveType: async (db, id, companyId) => {
    return db.leave_types.update({
      where: { id },
      data: { deleted_at: new Date(), is_active: false },
    });
  },

  manualAccrue: async (db, companyId) => {
    const leaveTypes = await db.leave_types.findMany({
      where: { company_id: companyId, deleted_at: null, is_active: true },
    });
    const employees = await db.employees.findMany({
      where: { company_id: companyId, status: 'active', deleted_at: null },
      select: { id: true, date_of_joining: true },
    });
    const year = new Date().getFullYear();
    let accrued = 0;

    for (const lt of leaveTypes) {
      if (lt.accrual_type === 'one_time') continue;
      for (const emp of employees) {
        const monthsEmployed = Math.floor((new Date() - new Date(emp.date_of_joining)) / (1000 * 60 * 60 * 24 * 30));
        if (monthsEmployed < (lt.min_service_months || 0)) continue;

        await db.leave_balances.upsert({
          where: { employee_id_leave_type_id_year: { employee_id: emp.id, leave_type_id: lt.id, year } },
          update: { accrued: { increment: lt.accrual_days } },
          create: {
            employee_id: emp.id, leave_type_id: lt.id, year,
            opening: 0, accrued: lt.accrual_days, used: 0, pending: 0,
          },
        });
        accrued++;
      }
    }

    return { processed: employees.length, accrued };
  },

  report: async (db, companyId, query) => {
    const { month, year, employeeId, leaveTypeId, status } = query;
    const where = { employee: { company_id: companyId } };
    if (status)      where.status        = status;
    if (employeeId)  where.employee_id   = employeeId;
    if (leaveTypeId) where.leave_type_id = leaveTypeId;
    if (month && year) {
      where.from_date = {
        gte: new Date(`${year}-${String(month).padStart(2,'0')}-01`),
        lt:  new Date(parseInt(year), parseInt(month), 1),
      };
    }
    return db.leave_applications.findMany({
      where,
      orderBy: { from_date: 'desc' },
      include: {
        employee:   { select: { id: true, first_name: true, last_name: true, employee_code: true, department: { select: { name: true } } } },
        leave_type: { select: { name: true, code: true, is_paid: true } },
      },
    });
  },

  _updateBalance: async (db, employeeId, leaveTypeId, year, companyId, { pendingDelta = 0, usedDelta = 0, accruedDelta = 0 }) => {
    await db.leave_balances.upsert({
      where: { employee_id_leave_type_id_year: { employee_id: employeeId, leave_type_id: leaveTypeId, year } },
      update: {
        ...(pendingDelta  ? { pending: { increment: pendingDelta  } } : {}),
        ...(usedDelta     ? { used:    { increment: usedDelta     } } : {}),
        ...(accruedDelta  ? { accrued: { increment: accruedDelta  } } : {}),
      },
      create: {
        employee_id:   employeeId,
        leave_type_id: leaveTypeId,
        year,
        opening: 0,
        accrued: Math.max(0, accruedDelta),
        used:    Math.max(0, usedDelta),
        pending: Math.max(0, pendingDelta),
      },
    });
  },

  _markAttendanceOnLeave: async (db, employeeId, fromDate, toDate) => {
    const start   = new Date(fromDate);
    const end     = new Date(toDate);
    const current = new Date(start);
    while (current <= end) {
      const d = new Date(current);
      await db.attendance.upsert({
        where:  { employee_id_date: { employee_id: employeeId, date: d } },
        update: { status: 'on_leave' },
        create: { employee_id: employeeId, date: d, status: 'on_leave' }, 
      }).catch(() => {}); 
      current.setDate(current.getDate() + 1);
    }
  },

  _fmtBalance: (b) => ({
    id:        b.id,
    leaveType: b.leave_type,
    year:      b.year,
    opening:   b.opening,
    accrued:   b.accrued,
    used:      b.used,
    pending:   b.pending,
    available: Math.max(0, b.opening + b.accrued - b.used - b.pending),
  }),
};

module.exports = leaveService;

