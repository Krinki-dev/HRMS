/**
 * @file attendance.service.js
 * @description Attendance tracking and regularization logic with enriched Mac-style logging.
 */
const logger = require('../../shared/utils/logger');
const { THEME } = require('../../shared/utils/uiConstants');

const todayIST = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 330);
  return now.toISOString().slice(0, 10); 
};

const calcWorkingHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  return Math.round((new Date(checkOut) - new Date(checkIn)) / 1000 / 60) / 60;
};

const formatMinutes = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return `${h}h ${m}m`;
};

const attendanceService = {

  dashboard: async (db, companyId, date) => {
    const targetDate = date || todayIST();
    logger.debug(`${THEME.ICONS.INFO} Fetching attendance dashboard for ${targetDate}`);

    const [totalActive, todayRecords, notMarked] = await Promise.all([
      db.employees.count({
        where: { company_id: companyId, status: 'active', deleted_at: null },
      }),
      db.attendance.findMany({
        where: {
          date:     new Date(targetDate),
          employee: { company_id: companyId },
        },
        include: {
          employee: {
            select: {
              id: true, first_name: true, last_name: true,
              employee_code: true, department: { select: { name: true } },
            },
          },
        },
        orderBy: { check_in: 'asc' },
      }),
      db.employees.findMany({
        where: {
          company_id: companyId,
          status:     'active',
          deleted_at: null,
          attendance: { none: { date: new Date(targetDate) } },
        },
        select: {
          id: true, first_name: true, last_name: true,
          employee_code: true, department: { select: { name: true } },
        },
        take: 100,
      }),
    ]);

    const present   = todayRecords.filter(r => r.status === 'present').length;
    const onLeave   = todayRecords.filter(r => r.status === 'on_leave').length;
    const absent    = todayRecords.filter(r => r.status === 'absent').length;
    const halfDay   = todayRecords.filter(r => r.status === 'half_day').length;
    const lateCount = todayRecords.filter(r => r.late_arrival).length;

    return {
      date:      targetDate,
      summary:   { totalActive, present, absent, onLeave, halfDay, notMarked: notMarked.length, lateCount },
      records:   todayRecords.map(attendanceService._fmt),
      notMarked,
    };
  },

  list: async (db, companyId, query = {}) => {
    const { date, employeeId, month, year, status, limit = 50, cursor } = query;
    logger.debug(`${THEME.ICONS.PROCESS} Listing attendance records for company: ${companyId}`);

    const where = { employee: { company_id: companyId } };
    if (date)       where.date        = new Date(date);
    if (employeeId) where.employee_id = employeeId;
    if (status)     where.status      = status;
    if (month && year) {
      const start = new Date(`${year}-${String(month).padStart(2,'0')}-01`);
      const end   = new Date(start);
      end.setMonth(end.getMonth() + 1);
      where.date = { gte: start, lt: end };
    }

    const records = await db.attendance.findMany({
      where,
      take:    parseInt(limit),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ date: 'desc' }, { check_in: 'asc' }],
      include: {
        employee: {
          select: { id: true, first_name: true, last_name: true, employee_code: true },
        },
      },
    });

    return records.map(attendanceService._fmt);
  },

  getToday: async (db, employeeId) => {
    const today  = todayIST();
    logger.debug(`${THEME.ICONS.INFO} Getting today's record for employee: ${employeeId}`);
    const record = await db.attendance.findFirst({
      where: { employee_id: employeeId, date: new Date(today) },
    });
    return record ? attendanceService._fmt(record) : null;
  },

  checkIn: async (db, employeeId, data) => {
    const today = todayIST();
    const now   = new Date();
    logger.info(`${THEME.ICONS.WAIT} Check-in attempt: ${employeeId} at ${now.toISOString()}`);

    const existing = await db.attendance.findFirst({
      where: { employee_id: employeeId, date: new Date(today) },
    });
    if (existing?.check_in) throw new Error('ALREADY_CHECKED_IN');

    let isLate = false;
    const empShift = await db.employee_shifts.findFirst({
      where:   { employee_id: employeeId, deleted_at: null },
      include: { shift: true },
    }).catch(() => null);

    if (empShift?.shift?.start_time) {
      const [sh, sm]   = empShift.shift.start_time.split(':').map(Number);
      const grace      = empShift.shift.late_grace_minutes || 15;
      const istNow     = new Date(now.getTime() + 330 * 60000);
      const nowMin     = istNow.getHours() * 60 + istNow.getMinutes();
      isLate = nowMin > (sh * 60 + sm + grace);
    }

    await db.attendance.upsert({
      where:  { employee_id_date: { employee_id: employeeId, date: new Date(today) } },
      update: { check_in: now, status: 'present', late_arrival: isLate },
      create: {
        employee_id:  employeeId,
        date:         new Date(today),
        check_in:     now,
        status:       'present',
        late_arrival: isLate,
        location_lat: data?.latitude  ? parseFloat(data.latitude)  : null,
        location_lng: data?.longitude ? parseFloat(data.longitude) : null,
        ip_address:   data?.ipAddress || null,
      },
    });

    logger.info(`${THEME.ICONS.SUCCESS} Check-in confirmed: ${employeeId}`);
    return {
      checkInTime: now.toISOString(),
      isLate,
      message: isLate ? 'Checked in (late arrival)' : 'Checked in successfully',
    };
  },

  checkOut: async (db, employeeId) => {
    const today  = todayIST();
    const now    = new Date();
    logger.info(`${THEME.ICONS.WAIT} Check-out attempt: ${employeeId}`);

    const record = await db.attendance.findFirst({
      where: { employee_id: employeeId, date: new Date(today) },
    });
    if (!record?.check_in) throw new Error('NOT_CHECKED_IN');
    if (record.check_out)  throw new Error('ALREADY_CHECKED_OUT');

    const workingHours = calcWorkingHours(record.check_in, now);

    let overtimeHours    = 0;
    let isEarlyDeparture = false;
    const empShift = await db.employee_shifts.findFirst({
      where:   { employee_id: employeeId, deleted_at: null },
      include: { shift: true },
    }).catch(() => null);

    if (empShift?.shift) {
      overtimeHours = Math.max(0, workingHours - (empShift.shift.total_hours || 8));
      if (empShift.shift.end_time) {
        const [eh, em]  = empShift.shift.end_time.split(':').map(Number);
        const istNow    = new Date(now.getTime() + 330 * 60000);
        isEarlyDeparture = (istNow.getHours() * 60 + istNow.getMinutes()) < (eh * 60 + em - 5);
      }
    }

    await db.attendance.update({
      where: { id: record.id },
      data: {
        check_out:       now,
        working_hours:   workingHours,
        overtime_hours:  overtimeHours,
        early_departure: isEarlyDeparture,
        ot_status:       overtimeHours > 0 ? 'pending' : null,
      },
    });

    logger.info(`${THEME.ICONS.SUCCESS} Check-out confirmed: ${employeeId} (Hrs: ${workingHours.toFixed(2)})`);
    const workingMinutes = workingHours * 60;
    return {
      checkOutTime:  now.toISOString(),
      workingHours:  workingHours.toFixed(2),
      workingTime:   formatMinutes(workingMinutes),
      overtimeHours: overtimeHours.toFixed(2),
      message:       `Checked out. Total: ${formatMinutes(workingMinutes)}`,
    };
  },

  getUnmarked: async (db, companyId, date) => {
    const targetDate = date || todayIST();
    return db.employees.findMany({
      where: {
        company_id: companyId,
        status:     'active',
        deleted_at: null,
        attendance: { none: { date: new Date(targetDate) } },
      },
      select: {
        id: true, first_name: true, last_name: true, employee_code: true,
        department:  { select: { name: true } },
        designation: { select: { name: true } },
      },
      orderBy: [{ first_name: 'asc' }],
    });
  },

  bulkMark: async (db, companyId, userId, { date, records }) => {
    const targetDate = new Date(date);
    const today      = new Date(todayIST());
    if (targetDate > today) throw new Error('FUTURE_DATE');

    const results = { saved: 0, errors: [] };

    for (const rec of records) {
      try {
        const workingHours = rec.checkIn && rec.checkOut
          ? calcWorkingHours(rec.checkIn, rec.checkOut) : 0;

        await db.attendance.upsert({
          where:  { employee_id_date: { employee_id: rec.employeeId, date: targetDate } },
          update: {
            check_in:      rec.checkIn  ? new Date(rec.checkIn)  : undefined,
            check_out:     rec.checkOut ? new Date(rec.checkOut) : undefined,
            status:        rec.status   || 'present',
            working_hours: workingHours,
          },
          create: {
            employee_id:   rec.employeeId,
            date:          targetDate,
            check_in:      rec.checkIn  ? new Date(rec.checkIn)  : null,
            check_out:     rec.checkOut ? new Date(rec.checkOut) : null,
            status:        rec.status   || 'present',
            working_hours: workingHours,
          },
        });
        results.saved++;
      } catch (err) {
        results.errors.push({ employeeId: rec.employeeId, error: err.message });
      }
    }

    try {
      await db.audit_logs.create({
        data: {
          company_id:  companyId,
          user_id:     userId,
          module:      'attendance',
          action:      'bulk_mark',
          record_type: 'attendance',
          meta:        JSON.stringify({ date, count: results.saved }),
        },
      });
    } catch {  }

    return results;
  },

  updateRecord: async (db, id, companyId, data) => {
    
    const record = await db.attendance.findFirst({
      where: { id, employee: { company_id: companyId } },
    });
    if (!record) throw new Error('NOT_FOUND');

    const workingHours = data.checkIn && data.checkOut
      ? calcWorkingHours(data.checkIn, data.checkOut)
      : record.working_hours;

    return db.attendance.update({
      where: { id },
      data: {
        check_in:      data.checkIn  ? new Date(data.checkIn)  : record.check_in,
        check_out:     data.checkOut ? new Date(data.checkOut) : record.check_out,
        status:        data.status   || record.status,
        working_hours: workingHours,
        regularized:   data.regularized ?? record.regularized,
      },
    });
  },

  submitRegularization: async (db, employeeId, companyId, data) => {
    const { date, requestedCheckIn, requestedCheckOut, reason } = data;
    if (!reason || reason.length < 5) throw new Error('REASON_TOO_SHORT');

    const existing = await db.regularization_requests.findFirst({
      where: { employee_id: employeeId, date: new Date(date), status: 'pending' },
    });
    if (existing) throw new Error('DUPLICATE_REQUEST');

    return db.regularization_requests.create({
      data: {
        company_id:          companyId,
        employee_id:         employeeId,
        date:                new Date(date),
        requested_check_in:  requestedCheckIn  ? new Date(requestedCheckIn)  : null,
        requested_check_out: requestedCheckOut ? new Date(requestedCheckOut) : null,
        reason,
        status: 'pending',
      },
    });
  },

  getPendingRegularizations: async (db, companyId) => {
    return db.regularization_requests.findMany({
      where:   { company_id: companyId, status: 'pending' },
      include: {
        employee: {
          select: { id: true, first_name: true, last_name: true, employee_code: true },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  },

  approveRegularization: async (db, requestId, companyId, approverId) => {
    const req = await db.regularization_requests.findFirst({
      where: { id: requestId, company_id: companyId, status: 'pending' },
    });
    if (!req) throw new Error('NOT_FOUND');

    const workingHours = req.requested_check_in && req.requested_check_out
      ? calcWorkingHours(req.requested_check_in, req.requested_check_out) : 0;

    await Promise.all([
      db.attendance.upsert({
        where:  { employee_id_date: { employee_id: req.employee_id, date: req.date } },
        update: {
          check_in:      req.requested_check_in,
          check_out:     req.requested_check_out,
          status:        'present',
          working_hours: workingHours,
          regularized:   true,
        },
        create: {
          employee_id:   req.employee_id,
          date:          req.date,
          check_in:      req.requested_check_in,
          check_out:     req.requested_check_out,
          status:        'present',
          working_hours: workingHours,
          regularized:   true,
        },
      }),
      db.regularization_requests.update({
        where: { id: requestId },
        data:  { status: 'approved', approved_by: approverId, approved_at: new Date() },
      }),
    ]);
  },

  rejectRegularization: async (db, requestId, companyId, approverId, reason) => {
    if (!reason) throw new Error('REASON_REQUIRED');
    return db.regularization_requests.update({
      where: { id: requestId },
      data:  { status: 'rejected', approved_by: approverId, rejection_reason: reason },
    });
  },

  getPendingOvertime: async (db, companyId) => {
    return db.attendance.findMany({
      where: {
        employee:      { company_id: companyId },
        overtime_hours: { gt: 0 },
        ot_status:     'pending',
      },
      include: {
        employee: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy: { date: 'desc' },
    });
  },

  approveOvertime: async (db, id, companyId, { type }) => {
    const record = await db.attendance.findFirst({
      where: { id, employee: { company_id: companyId } },
    });
    if (!record) throw new Error('NOT_FOUND');

    await db.attendance.update({
      where: { id },
      data:  { ot_status: 'approved', ot_type: type },
    });

    if (type === 'comp_off') {
      const compOffType = await db.leave_types.findFirst({
        where: { company_id: companyId, code: 'CO', deleted_at: null },
      });
      if (compOffType) {
        const year = new Date(record.date).getFullYear();
        await db.leave_balances.upsert({
          where: {
            employee_id_leave_type_id_year: {
              employee_id: record.employee_id, leave_type_id: compOffType.id, year,
            },
          },
          update: { accrued: { increment: record.overtime_hours >= 8 ? 1 : 0.5 } },
          create: {
            company_id:    companyId,
            employee_id:   record.employee_id,
            leave_type_id: compOffType.id,
            year,
            opening: 0,
            accrued: record.overtime_hours >= 8 ? 1 : 0.5,
          },
        });
      }
    }
  },

  getShifts: async (db, companyId) => {
    return db.shifts.findMany({
      where: { company_id: companyId, deleted_at: null },
      orderBy: { name: 'asc' },
    });
  },

  createShift: async (db, companyId, data) => {
    const [sh, sm] = data.startTime.split(':').map(Number);
    const [eh, em] = data.endTime.split(':').map(Number);
    let totalHours  = (eh * 60 + em - sh * 60 - sm) / 60;
    if (totalHours < 0) totalHours += 24;

    return db.shifts.create({
      data: {
        company_id:          companyId,
        name:                data.name,
        start_time:          data.startTime,
        end_time:            data.endTime,
        total_hours:         totalHours,
        late_grace_minutes:  data.lateGraceMinutes  || 15,
        early_grace_minutes: data.earlyGraceMinutes || 15,
        week_offs:           JSON.stringify(data.weekOffs || ['sunday']),
        is_active:           true,
      },
    });
  },

  getHolidays: async (db, companyId, year) => {
    const y = parseInt(year) || new Date().getFullYear();
    return db.holidays.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        date: { gte: new Date(`${y}-01-01`), lte: new Date(`${y}-12-31`) },
      },
      orderBy: { date: 'asc' },
    });
  },

  addHoliday: async (db, companyId, data) => {
    return db.holidays.create({
      data: {
        company_id:   companyId,
        date:         new Date(data.date),
        name:         data.name,
        type:         data.type         || 'national',
        is_recurring: data.isRecurring  || false,
        branch_id:    data.branchId     || null,
      },
    });
  },

  deleteHoliday: async (db, id, companyId) => {
    return db.holidays.update({ where: { id }, data: { deleted_at: new Date() } });
  },

  monthlyReport: async (db, companyId, month, year) => {
    const m     = parseInt(month);
    const y     = parseInt(year);
    const start = new Date(`${y}-${String(m).padStart(2,'0')}-01`);
    const end   = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const records = await db.attendance.findMany({
      where: {
        date:     { gte: start, lt: end },
        employee: { company_id: companyId },
      },
      include: {
        employee: {
          select: {
            id: true, first_name: true, last_name: true,
            employee_code: true, department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ employee_id: 'asc' }, { date: 'asc' }],
    });

    const byEmployee = {};
    for (const r of records) {
      const id = r.employee_id;
      if (!byEmployee[id]) {
        byEmployee[id] = {
          employee: r.employee,
          present: 0, absent: 0, onLeave: 0,
          halfDay: 0, weekOff: 0, holiday: 0,
          totalHours: 0, overtimeHours: 0, lateDays: 0,
        };
      }
      const s = r.status;
      if (s === 'present')  byEmployee[id].present++;
      else if (s === 'absent')   byEmployee[id].absent++;
      else if (s === 'on_leave') byEmployee[id].onLeave++;
      else if (s === 'half_day') byEmployee[id].halfDay++;
      else if (s === 'week_off') byEmployee[id].weekOff++;
      else if (s === 'holiday')  byEmployee[id].holiday++;
      byEmployee[id].totalHours    += r.working_hours   || 0;
      byEmployee[id].overtimeHours += r.overtime_hours  || 0;
      if (r.late_arrival) byEmployee[id].lateDays++;
    }

    return { month: m, year: y, employees: Object.values(byEmployee) };
  },

  _fmt: (r) => ({
    id:              r.id,
    employeeId:      r.employee_id,
    employee:        r.employee
      ? { id: r.employee.id, fullName: `${r.employee.first_name} ${r.employee.last_name}`,
          code: r.employee.employee_code, department: r.employee.department?.name }
      : null,
    date:            r.date,
    checkIn:         r.check_in,
    checkOut:        r.check_out,
    status:          r.status,
    workingHours:    r.working_hours,
    overtimeHours:   r.overtime_hours,
    isLateArrival:   r.late_arrival,
    isEarlyDeparture: r.early_departure,
    isRegularized:   r.regularized,
    otStatus:        r.ot_status,
    otType:          r.ot_type,
  }),
};

module.exports = attendanceService;

