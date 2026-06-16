const settingsService = {

  getCompany: async (db, companyId) => {
    const company = await db.companies.findFirst({
      where: { id: companyId, deleted_at: null },
    });
    if (!company) throw new Error('NOT_FOUND');
    return company;
  },

  updateCompany: async (db, companyId, data) => {
    return db.companies.update({
      where: { id: companyId },
      data: {
        name:                 data.name                || undefined,
        legal_name:           data.legalName           ?? undefined,
        gstin:                data.gstin               ?? undefined,
        pan:                  data.pan                 ?? undefined,
        cin:                  data.cin                 ?? undefined,
        address:              data.address             ?? undefined,
        city:                 data.city                ?? undefined,
        state:                data.state               ?? undefined,
        pincode:              data.pincode             ?? undefined,
        phone:                data.phone               ?? undefined,
        email:                data.email               ?? undefined,
        website:              data.website             ?? undefined,
        epf_number:           data.epfNumber           ?? undefined,
        esic_number:          data.esicNumber          ?? undefined,
        pt_number:            data.ptNumber            ?? undefined,
        lwf_number:           data.lwfNumber           ?? undefined,
        financial_year_start: data.financialYearStart  ? parseInt(data.financialYearStart) : undefined,
        working_days_month:   data.workingDaysMonth    ? parseInt(data.workingDaysMonth)   : undefined,
        overtime_threshold:   data.overtimeThreshold   ? parseInt(data.overtimeThreshold)  : undefined,
        payslip_password_type: data.payslipPasswordType ?? undefined,
      },
    });
  },

  listHolidays: async (db, companyId, year) => {
    const y = parseInt(year) || new Date().getFullYear();
    return db.holidays.findMany({
      where: { company_id: companyId, year: y, deleted_at: null },
      orderBy: { date: 'asc' },
    });
  },

  addHoliday: async (db, companyId, data) => {
    const date = new Date(data.date);
    const year = date.getFullYear();

    const exists = await db.holidays.findFirst({
      where: { company_id: companyId, date, deleted_at: null },
    });
    if (exists) throw new Error('DUPLICATE_DATE');

    return db.holidays.create({
      data: {
        company_id:         companyId,
        name:               data.name,
        date,
        year,
        type:               data.type              || 'national',
        applicable_branches: JSON.stringify(data.applicableBranches || []),
        recurring_yearly:   data.recurringYearly   || false,
      },
    });
  },

  loadNationalHolidays: async (db, companyId, year) => {
    const y = parseInt(year) || new Date().getFullYear();

    const NATIONAL = [
      { name: 'New Year\'s Day',      date: `${y}-01-01`, type: 'national' },
      { name: 'Republic Day',         date: `${y}-01-26`, type: 'national' },
      { name: 'Holi',                 date: `${y}-03-14`, type: 'national' },
      { name: 'Good Friday',          date: `${y}-04-18`, type: 'national' },
      { name: 'Dr. Ambedkar Jayanti', date: `${y}-04-14`, type: 'national' },
      { name: 'Labour Day',           date: `${y}-05-01`, type: 'national' },
      { name: 'Independence Day',     date: `${y}-08-15`, type: 'national' },
      { name: 'Gandhi Jayanti',       date: `${y}-10-02`, type: 'national' },
      { name: 'Diwali',               date: `${y}-10-20`, type: 'national' },
      { name: 'Christmas Day',        date: `${y}-12-25`, type: 'national' },
    ];

    let added = 0;
    for (const h of NATIONAL) {
      const date = new Date(h.date);
      const exists = await db.holidays.findFirst({
        where: { company_id: companyId, date, deleted_at: null },
      });
      if (!exists) {
        await db.holidays.create({
          data: {
            company_id:         companyId,
            name:               h.name,
            date,
            year:               y,
            type:               h.type,
            applicable_branches: '[]',
            recurring_yearly:   true,
          },
        });
        added++;
      }
    }

    return { added, total: NATIONAL.length };
  },

  updateHoliday: async (db, companyId, id, data) => {
    const h = await db.holidays.findFirst({ where: { id, company_id: companyId, deleted_at: null } });
    if (!h) throw new Error('NOT_FOUND');
    return db.holidays.update({
      where: { id },
      data: {
        name:             data.name             || h.name,
        type:             data.type             || h.type,
        recurring_yearly: data.recurringYearly  ?? h.recurring_yearly,
      },
    });
  },

  deleteHoliday: async (db, companyId, id) => {
    const h = await db.holidays.findFirst({ where: { id, company_id: companyId } });
    if (!h) throw new Error('NOT_FOUND');
    return db.holidays.update({ where: { id }, data: { deleted_at: new Date() } });
  },

  listShifts: async (db, companyId) => {
    const shifts = await db.shifts.findMany({
      where: { company_id: companyId, deleted_at: null },
      orderBy: { name: 'asc' },
      include: { _count: { select: { employee_shifts: true } } },
    });
    return shifts.map(s => ({
      ...s,
      week_offs:   JSON.parse(s.week_offs || '[0,6]'),
      employeeCount: s._count.employee_shifts,
    }));
  },

  createShift: async (db, companyId, data) => {
    if (!data.name || !data.startTime || !data.endTime) throw new Error('MISSING_FIELDS');

    const [sh, sm] = data.startTime.split(':').map(Number);
    const [eh, em] = data.endTime.split(':').map(Number);
    let totalHours = (eh * 60 + em - sh * 60 - sm) / 60;
    if (totalHours <= 0) totalHours += 24; 

    return db.shifts.create({
      data: {
        company_id:       companyId,
        name:             data.name,
        start_time:       data.startTime,
        end_time:         data.endTime,
        total_hours:      totalHours,
        late_grace_mins:  data.lateGraceMins  || 15,
        early_leave_mins: data.earlyLeaveMins || 15,
        week_offs:        JSON.stringify(data.weekOffs || [0, 6]), 
        is_active:        true,
      },
    });
  },

  updateShift: async (db, companyId, id, data) => {
    const s = await db.shifts.findFirst({ where: { id, company_id: companyId, deleted_at: null } });
    if (!s) throw new Error('NOT_FOUND');

    let totalHours = s.total_hours;
    if (data.startTime && data.endTime) {
      const [sh, sm] = data.startTime.split(':').map(Number);
      const [eh, em] = data.endTime.split(':').map(Number);
      totalHours = (eh * 60 + em - sh * 60 - sm) / 60;
      if (totalHours <= 0) totalHours += 24;
    }

    return db.shifts.update({
      where: { id },
      data: {
        name:             data.name             || s.name,
        start_time:       data.startTime        || s.start_time,
        end_time:         data.endTime          || s.end_time,
        total_hours:      totalHours,
        late_grace_mins:  data.lateGraceMins    ?? s.late_grace_mins,
        early_leave_mins: data.earlyLeaveMins   ?? s.early_leave_mins,
        week_offs:        data.weekOffs ? JSON.stringify(data.weekOffs) : s.week_offs,
        is_active:        data.isActive         ?? s.is_active,
      },
    });
  },

  deleteShift: async (db, companyId, id) => {
    const s = await db.shifts.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
      include: { _count: { select: { employee_shifts: true } } },
    });
    if (!s) throw new Error('NOT_FOUND');
    if (s._count.employee_shifts > 0) throw new Error('SHIFT_IN_USE');
    return db.shifts.update({ where: { id }, data: { deleted_at: new Date() } });
  },

  assignShift: async (db, companyId, shiftId, { employeeIds, effectiveFrom }) => {
    const shift = await db.shifts.findFirst({ where: { id: shiftId, company_id: companyId } });
    if (!shift) throw new Error('NOT_FOUND');

    const from = effectiveFrom ? new Date(effectiveFrom) : new Date();
    let assigned = 0;

    for (const empId of employeeIds) {
      
      await db.employee_shifts.updateMany({
        where: { employee_id: empId, effective_to: null },
        data:  { effective_to: from },
      });
      
      await db.employee_shifts.create({
        data: { employee_id: empId, shift_id: shiftId, effective_from: from },
      });
      assigned++;
    }

    return { assigned };
  },

  listDepartments: async (db, companyId) => {
    return db.departments.findMany({
      where: { company_id: companyId, is_active: true, deleted_at: null },
      orderBy: { name: 'asc' },
      include: { _count: { select: { employees: true } } },
    });
  },

  createDepartment: async (db, companyId, data) => {
    if (!data.name?.trim()) throw new Error('NAME_REQUIRED');
    const exists = await db.departments.findFirst({
      where: { company_id: companyId, name: data.name.trim(), deleted_at: null },
    });
    if (exists) throw new Error('DUPLICATE');
    return db.departments.create({
      data: { company_id: companyId, name: data.name.trim(), is_active: true },
    });
  },

  updateDepartment: async (db, companyId, id, data) => {
    const d = await db.departments.findFirst({ where: { id, company_id: companyId, deleted_at: null } });
    if (!d) throw new Error('NOT_FOUND');
    return db.departments.update({
      where: { id },
      data: { name: data.name || d.name, is_active: data.isActive ?? d.is_active },
    });
  },

  deleteDepartment: async (db, companyId, id) => {
    const d = await db.departments.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
      include: { _count: { select: { employees: true } } },
    });
    if (!d) throw new Error('NOT_FOUND');
    if (d._count.employees > 0) throw new Error('HAS_EMPLOYEES');
    return db.departments.update({ where: { id }, data: { deleted_at: new Date(), is_active: false } });
  },

  listDesignations: async (db, companyId) => {
    return db.designations.findMany({
      where: { company_id: companyId, is_active: true, deleted_at: null },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { employees: true } } },
    });
  },

  createDesignation: async (db, companyId, data) => {
    if (!data.name?.trim()) throw new Error('NAME_REQUIRED');
    const exists = await db.designations.findFirst({
      where: { company_id: companyId, name: data.name.trim(), deleted_at: null },
    });
    if (exists) throw new Error('DUPLICATE');
    return db.designations.create({
      data: { company_id: companyId, name: data.name.trim(), level: data.level ? parseInt(data.level) : null, is_active: true },
    });
  },

  updateDesignation: async (db, companyId, id, data) => {
    const d = await db.designations.findFirst({ where: { id, company_id: companyId, deleted_at: null } });
    if (!d) throw new Error('NOT_FOUND');
    return db.designations.update({
      where: { id },
      data: {
        name:      data.name      || d.name,
        level:     data.level != null ? parseInt(data.level) : d.level,
        is_active: data.isActive  ?? d.is_active,
      },
    });
  },

  deleteDesignation: async (db, companyId, id) => {
    const d = await db.designations.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
      include: { _count: { select: { employees: true } } },
    });
    if (!d) throw new Error('NOT_FOUND');
    if (d._count.employees > 0) throw new Error('HAS_EMPLOYEES');
    return db.designations.update({ where: { id }, data: { deleted_at: new Date(), is_active: false } });
  },

  listBranches: async (db, companyId) => {
    return db.branches.findMany({
      where: { company_id: companyId, is_active: true, deleted_at: null },
      orderBy: { name: 'asc' },
      include: { _count: { select: { employees: true } } },
    });
  },

  createBranch: async (db, companyId, data) => {
    if (!data.name?.trim()) throw new Error('NAME_REQUIRED');
    return db.branches.create({
      data: {
        company_id: companyId,
        name:       data.name.trim(),
        address:    data.address  || null,
        city:       data.city     || null,
        state:      data.state    || null,
        pincode:    data.pincode  || null,
        phone:      data.phone    || null,
        is_active:  true,
      },
    });
  },

  updateBranch: async (db, companyId, id, data) => {
    const b = await db.branches.findFirst({ where: { id, company_id: companyId, deleted_at: null } });
    if (!b) throw new Error('NOT_FOUND');
    return db.branches.update({
      where: { id },
      data: {
        name:      data.name      || b.name,
        address:   data.address   ?? b.address,
        city:      data.city      ?? b.city,
        state:     data.state     ?? b.state,
        pincode:   data.pincode   ?? b.pincode,
        phone:     data.phone     ?? b.phone,
        is_active: data.isActive  ?? b.is_active,
      },
    });
  },

  deleteBranch: async (db, companyId, id) => {
    const b = await db.branches.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
      include: { _count: { select: { employees: true } } },
    });
    if (!b) throw new Error('NOT_FOUND');
    if (b._count.employees > 0) throw new Error('HAS_EMPLOYEES');
    return db.branches.update({ where: { id }, data: { deleted_at: new Date(), is_active: false } });
  },
};

module.exports = settingsService;

