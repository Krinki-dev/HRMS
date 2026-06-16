const express = require('express');
const router  = express.Router();
const auth    = require('../../shared/middleware/auth');
const { sendSuccess, sendError } = require('../../shared/utils/response');

router.use(auth);

router.get('/stats', async (req, res) => {
  try {
    const db        = req.db;           
    const companyId = req.tenant?.id || req.user?.tenantId;

    if (!db) {
      return sendError(res, 'ERR_DASHBOARD', 'Database client not available', 500);
    }
    if (!companyId) {
      return sendError(res, 'ERR_DASHBOARD', 'Company ID not found on request', 400);
    }

    const today     = new Date();
    const todayStr  = today.toISOString().split('T')[0];
    const todayStart = new Date(todayStr + 'T00:00:00.000Z');
    const todayEnd   = new Date(todayStr + 'T23:59:59.999Z');

    let totalEmployees = 0;
    try {
      totalEmployees = await db.employees.count({
        where: { status: 'active', deleted_at: null },
      });
    } catch (e) {
      console.error('[Dashboard/stats] totalEmployees count failed:', e.message);
    }

    let presentToday = 0;
    try {
      presentToday = await db.attendance.count({
        where: {
          date:       { gte: todayStart, lte: todayEnd },
          status:     { in: ['present', 'half_day'] },
        },
      });
    } catch (e) {
      console.error('[Dashboard/stats] presentToday count failed:', e.message);
    }

    let onLeaveToday = 0;
    try {
      onLeaveToday = await db.leave_applications.count({
        where: {
          status:     'approved',
          from_date:  { lte: todayEnd },
          to_date:    { gte: todayStart },
        },
      });
    } catch (e) {
      console.error('[Dashboard/stats] onLeaveToday count failed:', e.message);
    }

    let openPositions = 0;
    try {
      openPositions = await db.job_requisitions.count({
        where: { status: 'open', deleted_at: null },
      });
    } catch (e) {
      console.error('[Dashboard/stats] openPositions count failed:', e.message);
    }

    let pendingLeaves = 0;
    try {
      pendingLeaves = await db.leave_applications.count({
        where: { status: 'pending'},
      });
    } catch (e) {
      console.error('[Dashboard/stats] pendingLeaves count failed:', e.message);
    }

    let upcomingBirthdays = [];
    try {
      const allEmps = await db.employees.findMany({
        where: {
          status:        'active',
          deleted_at:    null,
          date_of_birth: { not: null },
        },
        select: {
          id:             true,
          first_name:     true,
          last_name:      true,
          date_of_birth:  true,
          employee_code:  true,
        },
      });

      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      upcomingBirthdays = allEmps
        .filter(e => {
          if (!e.date_of_birth) return false;
          const dob      = new Date(e.date_of_birth);
          const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          
          const target   = thisYear < today
            ? new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate())
            : thisYear;
          const diff = target - today;
          return diff >= 0 && diff <= sevenDaysMs;
        })
        .slice(0, 5)
        .map(e => ({
          id:   e.id,
          name: `${e.first_name} ${e.last_name}`.trim(),
          code: e.employee_code,
          dob:  e.date_of_birth,
        }));
    } catch (e) {
      console.error('[Dashboard/stats] upcomingBirthdays failed:', e.message);
    }

    return sendSuccess(res, {
      totalEmployees,
      presentToday,
      onLeaveToday,
      openPositions,
      pendingLeaves,
      upcomingBirthdays,
    });

  } catch (err) {
    console.error('[Dashboard/stats] Unexpected error:', err.message);
    return sendError(res, 'ERR_DASHBOARD', err.message, 500);
  }
});

router.get('/activity', async (req, res) => {
  try {
    const db        = req.db;
    const companyId = req.tenant?.id || req.user?.tenantId;

    if (!db || !companyId) {
      return sendSuccess(res, { logs: [] });
    }

    let logs = [];
    try {
      const rows = await db.audit_logs.findMany({
  orderBy: { created_at: "desc" },
  take: 10,
  include: {
    user: {                             
      include: {
        employee: {                     
          select: { work_email: true, first_name: true, last_name: true }
        }
      }
    }
  }
});

      logs = rows.map(r => {
        const emp = r.user?.employee;
        return {
          id:        r.id,
          action:    r.action,
          module:    r.module,
          recordId:  r.record_id,
          createdAt: r.created_at,
          actor: emp ? {
            email: emp.work_email,
            name:  `${emp.first_name} ${emp.last_name}`.trim(),
          } : { name: r.user?.email || 'System' },
        };
      });
    } catch (e) {
      console.error('[Dashboard/activity] audit_logs query failed:', e.message);
      
    }

    return sendSuccess(res, { logs });

  } catch (err) {
    console.error('[Dashboard/activity] Unexpected error:', err.message);
    return sendError(res, 'ERR_DASHBOARD', err.message, 500);
  }
});

module.exports = router;

