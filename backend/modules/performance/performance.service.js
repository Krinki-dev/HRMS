const parseArr = (v) => { try { return JSON.parse(v || '[]'); } catch { return []; } };

async function requireCompanyEmployee(db, companyId, employeeId) {
  if (!employeeId) throw new Error('NOT_FOUND');
  const employee = await db.employees.findFirst({
    where: { id: employeeId, company_id: companyId, deleted_at: null },
    select: { id: true, reporting_to: true },
  });
  if (!employee) throw new Error('NOT_FOUND');
  return employee;
}

async function requireCompanyCycle(db, companyId, cycleId) {
  if (!cycleId) throw new Error('CYCLE_NOT_FOUND');
  const cycle = await db.appraisal_cycles.findFirst({ where: { id: cycleId, company_id: companyId } });
  if (!cycle) throw new Error('CYCLE_NOT_FOUND');
  return cycle;
}

const performanceService = {

  dashboard: async (db, companyId) => {
    const activeCycle = await db.appraisal_cycles.findFirst({
      where: { company_id: companyId, status: 'active' },
      orderBy: { created_at: 'desc' },
    });

    if (!activeCycle) return { activeCycle: null, stats: null };

    const [totalGoals, approvedGoals, selfDone, managerDone] = await Promise.all([
      db.performance_goals.count({ where: { cycle_id: activeCycle.id } }),
      db.performance_goals.count({ where: { cycle_id: activeCycle.id, status: 'approved' } }),
      db.appraisals.count({ where: { cycle_id: activeCycle.id, type: 'self', status: { not: 'draft' } } }),
      db.appraisals.count({ where: { cycle_id: activeCycle.id, type: 'manager', status: { not: 'draft' } } }),
    ]);

    const finalized = await db.appraisals.findMany({
      where: { cycle_id: activeCycle.id, type: 'final', status: 'submitted' },
      select: { overall_rating: true },
    });
    const ratingDist = [1,2,3,4,5].map(r => ({
      rating: r,
      count:  finalized.filter(a => Math.round(a.overall_rating || 0) === r).length,
    }));

    return {
      activeCycle,
      stats: { totalGoals, approvedGoals, selfDone, managerDone, finalized: finalized.length },
      ratingDist,
    };
  },

  listCycles: async (db, companyId) => {
    return db.appraisal_cycles.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
  },

  createCycle: async (db, companyId, data) => {
    return db.appraisal_cycles.create({
      data: {
        company_id:           companyId,
        name:                 data.name,
        period_start:         new Date(data.periodStart),
        period_end:           new Date(data.periodEnd),
        goal_setting_end:     data.goalSettingEnd      ? new Date(data.goalSettingEnd)      : null,
        self_appraisal_start: data.selfAppraisalStart  ? new Date(data.selfAppraisalStart)  : null,
        self_appraisal_end:   data.selfAppraisalEnd    ? new Date(data.selfAppraisalEnd)    : null,
        manager_review_end:   data.managerReviewEnd    ? new Date(data.managerReviewEnd)    : null,
        status:               'upcoming',
        rating_scale:         parseInt(data.ratingScale) || 5,
      },
    });
  },

  updateCycle: async (db, companyId, id, data) => {
    const cycle = await db.appraisal_cycles.findFirst({ where: { id, company_id: companyId } });
    if (!cycle) throw new Error('NOT_FOUND');
    return db.appraisal_cycles.update({
      where: { id },
      data: {
        name:                 data.name                ?? cycle.name,
        goal_setting_end:     data.goalSettingEnd      ? new Date(data.goalSettingEnd)      : cycle.goal_setting_end,
        self_appraisal_start: data.selfAppraisalStart  ? new Date(data.selfAppraisalStart)  : cycle.self_appraisal_start,
        self_appraisal_end:   data.selfAppraisalEnd    ? new Date(data.selfAppraisalEnd)    : cycle.self_appraisal_end,
        manager_review_end:   data.managerReviewEnd    ? new Date(data.managerReviewEnd)    : cycle.manager_review_end,
      },
    });
  },

  activateCycle: async (db, companyId, id) => {
    const cycle = await requireCompanyCycle(db, companyId, id);
    await db.appraisal_cycles.updateMany({
      where: { company_id: companyId, status: 'active' },
      data: { status: 'upcoming' },
    });
    return db.appraisal_cycles.update({ where: { id: cycle.id }, data: { status: 'active' } });
  },

  closeCycle: async (db, companyId, id) => {
    const cycle = await requireCompanyCycle(db, companyId, id);
    return db.appraisal_cycles.update({ where: { id: cycle.id }, data: { status: 'closed' } });
  },

  listMyGoals: async (db, companyId, employeeId, cycleId) => {
    await requireCompanyEmployee(db, companyId, employeeId);
    const where = { employee_id: employeeId, cycle: { company_id: companyId } };
    if (cycleId) where.cycle_id = cycleId;
    return db.performance_goals.findMany({
      where,
      include: { cycle: { select: { name: true, status: true } } },
      orderBy: { created_at: 'desc' },
    });
  },

  listTeamGoals: async (db, companyId, cycleId) => {
    const where = { cycle: { company_id: companyId } };
    if (cycleId) where.cycle_id = cycleId;
    const goals = await db.performance_goals.findMany({
      where,
      include: {
        cycle: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const empIds = [...new Set(goals.map(g => g.employee_id))];
    const emps = await db.employees.findMany({
      where: { id: { in: empIds }, company_id: companyId },
      select: { id: true, first_name: true, last_name: true, employee_code: true },
    });
    const empMap = Object.fromEntries(emps.map(e => [e.id, e]));

    return goals.map(g => ({
      ...g,
      employee: empMap[g.employee_id] || null,
    }));
  },

  createGoal: async (db, companyId, employeeId, data) => {
    await requireCompanyEmployee(db, companyId, employeeId);
    const cycle = await requireCompanyCycle(db, companyId, data.cycleId);

    const existing = await db.performance_goals.findMany({
      where: { employee_id: employeeId, cycle_id: data.cycleId },
    });
    const usedWeight = existing.reduce((s, g) => s + (g.weightage || 0), 0);
    const newWeight  = parseFloat(data.weightage) || 0;
    if (usedWeight + newWeight > 100) throw new Error('WEIGHTAGE_EXCEEDED');

    return db.performance_goals.create({
      data: {
        employee_id:  employeeId,
        cycle_id:     data.cycleId,
        title:        data.title,
        description:  data.description  || null,
        category:     data.category     || 'kra',
        target:       data.target       || null,
        weightage:    newWeight,
        target_date:  data.targetDate   ? new Date(data.targetDate) : null,
        status:       'draft',
      },
    });
  },

  updateGoal: async (db, companyId, employeeId, id, data) => {
    await requireCompanyEmployee(db, companyId, employeeId);
    const goal = await db.performance_goals.findFirst({
      where: { id, employee_id: employeeId, cycle: { company_id: companyId } },
    });
    if (!goal) throw new Error('NOT_FOUND');
    if (goal.status === 'approved') throw new Error('CANNOT_EDIT_APPROVED');
    return db.performance_goals.update({
      where: { id },
      data: {
        title:       data.title       ?? goal.title,
        description: data.description ?? goal.description,
        target:      data.target      ?? goal.target,
        weightage:   data.weightage   != null ? parseFloat(data.weightage) : goal.weightage,
        target_date: data.targetDate  ? new Date(data.targetDate) : goal.target_date,
        achievement: data.achievement != null ? parseFloat(data.achievement) : goal.achievement,
        status:      data.status      ?? goal.status,
      },
    });
  },

  approveGoal: async (db, companyId, approverId, id) => {
    const approver = await db.users.findFirst({ where: { id: approverId, company_id: companyId, is_active: true }, select: { id: true } });
    if (!approver) throw new Error('NOT_FOUND');
    const goal = await db.performance_goals.findFirst({ where: { id, cycle: { company_id: companyId } } });
    if (!goal) throw new Error('NOT_FOUND');
    return db.performance_goals.update({
      where: { id: goal.id },
      data: { status: 'approved', approved_by: approverId },
    });
  },

  deleteGoal: async (db, companyId, employeeId, id) => {
    await requireCompanyEmployee(db, companyId, employeeId);
    const goal = await db.performance_goals.findFirst({
      where: { id, employee_id: employeeId, cycle: { company_id: companyId } },
    });
    if (!goal) throw new Error('NOT_FOUND');
    if (goal.status === 'approved') throw new Error('CANNOT_DELETE_APPROVED');
    return db.performance_goals.delete({ where: { id } });
  },

  getMyAppraisal: async (db, companyId, employeeId, cycleId) => {
    await requireCompanyEmployee(db, companyId, employeeId);
    const cycle = cycleId
      ? await db.appraisal_cycles.findFirst({ where: { id: cycleId, company_id: companyId } })
      : await db.appraisal_cycles.findFirst({ where: { company_id: companyId, status: 'active' }, orderBy: { created_at: 'desc' } });

    if (!cycle) return { cycle: null, goals: [], selfAppraisal: null, managerAppraisal: null };

    const [goals, selfAppraisal, managerAppraisal] = await Promise.all([
      db.performance_goals.findMany({ where: { employee_id: employeeId, cycle_id: cycle.id } }),
      db.appraisals.findFirst({ where: { employee_id: employeeId, cycle_id: cycle.id, type: 'self' } }),
      db.appraisals.findFirst({ where: { employee_id: employeeId, cycle_id: cycle.id, type: 'manager' } }),
    ]);

    return {
      cycle,
      goals,
      selfAppraisal,
      managerAppraisal,
      goalRatings: selfAppraisal ? parseArr(selfAppraisal.goal_ratings) : [],
    };
  },

  getTeamAppraisals: async (db, companyId, cycleId) => {
    const selectedCycle = cycleId
      ? await requireCompanyCycle(db, companyId, cycleId)
      : await db.appraisal_cycles.findFirst({
          where: { company_id: companyId, status: 'active' },
          orderBy: { created_at: 'desc' },
        });
    const cid = selectedCycle?.id;
    if (!cid) return [];

    const appraisals = await db.appraisals.findMany({
      where: { cycle_id: cid, cycle: { company_id: companyId } },
      orderBy: [{ employee_id: 'asc' }, { type: 'asc' }],
    });

    const empIds = [...new Set(appraisals.map(a => a.employee_id))];
    const emps   = await db.employees.findMany({
      where: { id: { in: empIds } },
      select: { id: true, first_name: true, last_name: true, employee_code: true,
                department: { select: { name: true } } },
    });
    const empMap = Object.fromEntries(emps.map(e => [e.id, e]));

    return appraisals.map(a => ({ ...a, employee: empMap[a.employee_id] || null }));
  },

  submitSelfAppraisal: async (db, companyId, employeeId, data) => {
    await requireCompanyEmployee(db, companyId, employeeId);
    const cycle = await db.appraisal_cycles.findFirst({
      where: { company_id: companyId, status: 'active' },
      orderBy: { created_at: 'desc' },
    });
    if (!cycle) throw new Error('NO_ACTIVE_CYCLE');

    const existing = await db.appraisals.findFirst({
      where: { employee_id: employeeId, cycle_id: cycle.id, type: 'self' },
    });

    const payload = {
      employee_id:    employeeId,
      cycle_id:       cycle.id,
      type:           'self',
      goal_ratings:   JSON.stringify(data.goalRatings || []),
      overall_rating: parseFloat(data.overallRating) || null,
      comments:       data.comments || null,
      status:         'submitted',
      submitted_at:   new Date(),
      submitted_by:   employeeId,
    };

    if (existing) return db.appraisals.update({ where: { id: existing.id }, data: payload });
    return db.appraisals.create({ data: payload });
  },

  submitManagerAppraisal: async (db, companyId, managerId, data) => {
    const manager = await db.users.findFirst({ where: { id: managerId, company_id: companyId, is_active: true }, select: { id: true } });
    if (!manager) throw new Error('NOT_FOUND');
    const employee = await requireCompanyEmployee(db, companyId, data.employeeId);
    const cycle = await db.appraisal_cycles.findFirst({
      where: { company_id: companyId, status: 'active' },
      orderBy: { created_at: 'desc' },
    });
    if (!cycle) throw new Error('NO_ACTIVE_CYCLE');

    const existing = await db.appraisals.findFirst({
      where: { employee_id: data.employeeId, cycle_id: cycle.id, type: 'manager' },
    });

    const payload = {
      employee_id:           data.employeeId,
      cycle_id:              cycle.id,
      type:                  'manager',
      goal_ratings:          JSON.stringify(data.goalRatings || []),
      overall_rating:        parseFloat(data.overallRating) || null,
      comments:              data.comments || null,
      promotion_recommended: data.promotionRecommended || false,
      increment_recommended: data.incrementRecommended ? parseInt(data.incrementRecommended) : null,
      status:                'submitted',
      submitted_at:          new Date(),
      submitted_by:          managerId,
    };

    if (existing) return db.appraisals.update({ where: { id: existing.id }, data: payload });
    return db.appraisals.create({ data: payload });
  },

  finalizeAppraisal: async (db, companyId, id, data) => {
    const appraisal = await db.appraisals.findFirst({ where: { id, cycle: { company_id: companyId } } });
    if (!appraisal) throw new Error('NOT_FOUND');
    return db.appraisals.update({
      where: { id: appraisal.id },
      data: {
        overall_rating: parseFloat(data.overallRating) || undefined,
        status:         'submitted',
      },
    });
  },
};

module.exports = performanceService;

