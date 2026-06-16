const trainingService = {

  list: async (db, companyId, { status, upcoming } = {}) => {
    const where = { company_id: companyId, deleted_at: null };
    if (status) where.status = status;
    if (upcoming) where.start_date = { gte: new Date() };
    return db.trainings.findMany({
      where,
      include: {
        _count: { select: { nominations: true, attendance: true } },
      },
      orderBy: { start_date: 'asc' },
    });
  },

  create: async (db, companyId, data) => {
    return db.trainings.create({
      data: {
        company_id:          companyId,
        name:                data.name,
        type:                data.type           || 'internal',
        trainer_name:        data.trainerName    || null,
        trainer_type:        data.trainerType    || 'external',
        trainer_employee_id: data.trainerEmpId   || null,
        start_date:          new Date(data.startDate),
        end_date:            data.endDate        ? new Date(data.endDate)  : null,
        duration_hours:      data.durationHours  ? parseFloat(data.durationHours) : null,
        venue:               data.venue          || null,
        platform:            data.platform       || null,
        max_participants:    data.maxParticipants ? parseInt(data.maxParticipants) : null,
        target_dept_id:      data.targetDeptId   || null,
        cost:                data.cost           ? parseInt(data.cost) : null,
        status:              'upcoming',
      },
    });
  },

  get: async (db, companyId, id) => {
    const t = await db.trainings.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
      include: {
        nominations: true,
        attendance:  true,
        feedback:    true,
      },
    });
    if (!t) throw new Error('NOT_FOUND');

    const empIds = [...new Set([
      ...t.nominations.map(n => n.employee_id),
      ...t.attendance.map(a => a.employee_id),
    ])];
    const emps = await db.employees.findMany({
      where: { id: { in: empIds } },
      select: { id: true, first_name: true, last_name: true, employee_code: true },
    });
    const empMap = Object.fromEntries(emps.map(e => [e.id, e]));

    return {
      ...t,
      nominations: t.nominations.map(n => ({ ...n, employee: empMap[n.employee_id] || null })),
      attendance:  t.attendance.map(a => ({ ...a, employee: empMap[a.employee_id] || null })),
    };
  },

  update: async (db, companyId, id, data) => {
    const t = await db.trainings.findFirst({ where: { id, company_id: companyId } });
    if (!t) throw new Error('NOT_FOUND');
    return db.trainings.update({
      where: { id },
      data: {
        name:          data.name           ?? t.name,
        trainer_name:  data.trainerName    ?? t.trainer_name,
        start_date:    data.startDate      ? new Date(data.startDate) : t.start_date,
        end_date:      data.endDate        ? new Date(data.endDate)   : t.end_date,
        venue:         data.venue          ?? t.venue,
        platform:      data.platform       ?? t.platform,
        status:        data.status         ?? t.status,
        duration_hours:data.durationHours  != null ? parseFloat(data.durationHours) : t.duration_hours,
      },
    });
  },

  remove: async (db, companyId, id) => {
    return db.trainings.update({ where: { id }, data: { deleted_at: new Date() } });
  },

  listNominations: async (db, companyId, trainingId) => {
    return db.training_nominations.findMany({
      where: { training_id: trainingId },
      orderBy: { created_at: 'asc' },
    });
  },

  nominate: async (db, companyId, trainingId, { employeeIds, nominatedBy }) => {
    const results = [];
    for (const empId of employeeIds) {
      const exists = await db.training_nominations.findFirst({
        where: { training_id: trainingId, employee_id: empId },
      });
      if (!exists) {
        const n = await db.training_nominations.create({
          data: { training_id: trainingId, employee_id: empId, nominated_by: nominatedBy, status: 'nominated' },
        });
        results.push(n);
      }
    }
    return results;
  },

  removeNomination: async (db, trainingId, empId) => {
    return db.training_nominations.deleteMany({
      where: { training_id: trainingId, employee_id: empId },
    });
  },

  markAttendance: async (db, companyId, trainingId, records) => {
    const results = [];
    for (const r of records) {
      const existing = await db.training_attendance.findFirst({
        where: { training_id: trainingId, employee_id: r.employeeId },
      });
      if (existing) {
        const updated = await db.training_attendance.update({
          where: { id: existing.id },
          data: { attended: r.attended, hours_attended: r.hoursAttended ? parseFloat(r.hoursAttended) : null, marked_at: new Date() },
        });
        results.push(updated);
      } else {
        const created = await db.training_attendance.create({
          data: { training_id: trainingId, employee_id: r.employeeId, attended: r.attended,
                  hours_attended: r.hoursAttended ? parseFloat(r.hoursAttended) : null, marked_at: new Date() },
        });
        results.push(created);
      }
    }
    
    await db.trainings.update({ where: { id: trainingId }, data: { status: 'completed' } });
    return results;
  },

  submitFeedback: async (db, trainingId, employeeId, data) => {
    const existing = await db.training_feedback.findFirst({
      where: { training_id: trainingId, employee_id: employeeId },
    });
    const payload = {
      training_id:    trainingId,
      employee_id:    employeeId,
      content_rating: data.contentRating ? parseInt(data.contentRating) : null,
      trainer_rating: data.trainerRating ? parseInt(data.trainerRating) : null,
      venue_rating:   data.venueRating   ? parseInt(data.venueRating)   : null,
      overall_rating: data.overallRating ? parseInt(data.overallRating) : null,
      comments:       data.comments      || null,
    };
    if (existing) return db.training_feedback.update({ where: { id: existing.id }, data: payload });
    return db.training_feedback.create({ data: payload });
  },

  myTrainings: async (db, employeeId) => {
    const nominations = await db.training_nominations.findMany({
      where: { employee_id: employeeId },
      include: { training: true },
    });
    return nominations.map(n => ({ ...n.training, nominationStatus: n.status }));
  },
};

module.exports = trainingService;

