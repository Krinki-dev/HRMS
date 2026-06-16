const svc = require('./leave.service');
const emailSvc = require('../../shared/utils/emailService');
const logger = require('../../shared/utils/logger');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');

const ADMIN_ROLES = ['super_admin','admin','hr_admin'];

const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) {
    console.error('[Leave]', e.message);
    sendError(res, ERROR_CODES.SERVER, 'Server error.', 500);
  }
};

const ctrl = {
  dashboard: wrap(async (req, res) => {
    const isHR = ADMIN_ROLES.includes(req.user.role);
    const empId = req.user.employeeId || req.query.employeeId;
    if (!empId) return sendSuccess(res, {
      balances: [], myPending: [], myUpcoming: [],
      pendingApprovals: await svc.list(req.db, req.user.tenantId, { status: 'pending', limit: 1 }).then(r => r.length),
      teamOnLeave: [],
    });
    sendSuccess(res, await svc.dashboard(req.db, empId, req.user.tenantId, isHR));
  }),

  calendar: wrap(async (req, res) => {
    sendSuccess(res, await svc.calendar(req.db, req.user.tenantId, req.query.month, req.query.year));
  }),

  list: wrap(async (req, res) => {
    sendSuccess(res, await svc.list(req.db, req.user.tenantId, req.query));
  }),

  myApplications: wrap(async (req, res) => {
    const empId = req.user.employeeId;
    if (!empId) return sendSuccess(res, []);
    sendSuccess(res, await svc.myApplications(empId, req.query));
  }),

  calculateDays: wrap(async (req, res) => {
    const { fromDate, toDate } = req.body;
    if (!fromDate) return sendError(res, ERROR_CODES.VALIDATION, 'fromDate required.');
    sendSuccess(res, await svc.calculateDays(req.db, req.user.tenantId, req.user.employeeId, req.body));
  }),

  apply: wrap(async (req, res) => {
    const empId = req.user.employeeId;
    if (!empId) return sendError(res, ERROR_CODES.VALIDATION, 'No employee record for this account.');
    const { leaveTypeId, fromDate } = req.body;
    if (!leaveTypeId || !fromDate) return sendError(res, ERROR_CODES.VALIDATION, 'leaveTypeId and fromDate required.');
    try {
      sendSuccess(res, await svc.apply(req.db, empId, req.user.tenantId, req.body), 'Leave applied. Pending approval.', 201);
    } catch (e) {
      const map = {
        INVALID_DATES:        'End date must be after start date.',
        NO_WORKING_DAYS:      'No working days in selected range.',
        OVERLAPPING_LEAVE:    'You already have leave for these dates.',
        INSUFFICIENT_BALANCE: 'Insufficient leave balance.',
        INVALID_LEAVE_TYPE:   'Invalid leave type.',
      };
      if (map[e.message]) return sendError(res, ERROR_CODES.VALIDATION, map[e.message]);
      throw e;
    }
  }),

  getPendingApprovals: wrap(async (req, res) => {
    const isHR      = ADMIN_ROLES.includes(req.user.role);
    const managerId = req.user.employeeId;
    sendSuccess(res, await svc.getPendingApprovals(req.db, req.user.tenantId, isHR, managerId));
  }),

  approveLeave: wrap(async (req, res) => {
    try {
      await svc.approveLeave(req.db, req.params.id, req.user.tenantId, req.user.id);

      try {
        const application = await req.db.leave_applications.findUnique({
          where: { id: req.params.id },
          include: {
            employee: { select: { first_name: true, last_name: true, work_email: true, personal_email: true } },
            leave_type: { select: { name: true } },
          },
        });
        if (application) {
          const email = application.employee?.work_email || application.employee?.personal_email;
          if (email) {
            await emailSvc.sendLeaveUpdate(req.db, req.user.tenantId, {
              email,
              name: `${application.employee.first_name || ''} ${application.employee.last_name || ''}`.trim(),
              status: 'approved',
              leaveType: application.leave_type?.name,
              fromDate: application.from_date,
              toDate: application.to_date,
              days: application.days,
            });
          }
        }
      } catch (emailError) {
        logger.error('[Leave/approveLeave] Notification email failed', { error: emailError.message, applicationId: req.params.id });
      }

      sendSuccess(res, null, 'Leave approved.');
    } catch (e) {
      if (e.message === 'NOT_FOUND') return sendError(res, ERROR_CODES.NOT_FOUND, 'Application not found.', 404);
      throw e;
    }
  }),

  rejectLeave: wrap(async (req, res) => {
    const { reason } = req.body;
    if (!reason?.trim()) return sendError(res, ERROR_CODES.VALIDATION, 'Rejection reason required.');
    try {
      await svc.rejectLeave(req.db, req.params.id, req.user.tenantId, req.user.id, reason);

      try {
        const application = await req.db.leave_applications.findUnique({
          where: { id: req.params.id },
          include: {
            employee: { select: { first_name: true, last_name: true, work_email: true, personal_email: true } },
            leave_type: { select: { name: true } },
          },
        });
        if (application) {
          const email = application.employee?.work_email || application.employee?.personal_email;
          if (email) {
            await emailSvc.sendLeaveUpdate(req.db, req.user.tenantId, {
              email,
              name: `${application.employee.first_name || ''} ${application.employee.last_name || ''}`.trim(),
              status: 'rejected',
              leaveType: application.leave_type?.name,
              fromDate: application.from_date,
              toDate: application.to_date,
              days: application.days,
              rejectionReason: reason,
            });
          }
        }
      } catch (emailError) {
        logger.error('[Leave/rejectLeave] Notification email failed', { error: emailError.message, applicationId: req.params.id });
      }

      sendSuccess(res, null, 'Leave rejected.');
    } catch (e) {
      if (e.message === 'NOT_FOUND')       return sendError(res, ERROR_CODES.NOT_FOUND, 'Application not found.', 404);
      if (e.message === 'REASON_REQUIRED') return sendError(res, ERROR_CODES.VALIDATION, 'Reason required.');
      throw e;
    }
  }),

  cancelLeave: wrap(async (req, res) => {
    try {
      await svc.cancelLeave(req.params.id, req.user.employeeId);

      try {
        const application = await req.db.leave_applications.findUnique({
          where: { id: req.params.id },
          include: {
            employee: { select: { first_name: true, last_name: true, work_email: true, personal_email: true } },
            leave_type: { select: { name: true } },
          },
        });
        if (application) {
          const email = application.employee?.work_email || application.employee?.personal_email;
          if (email) {
            await emailSvc.sendLeaveUpdate(req.db, req.user.tenantId, {
              email,
              name: `${application.employee.first_name || ''} ${application.employee.last_name || ''}`.trim(),
              status: 'cancelled',
              leaveType: application.leave_type?.name,
              fromDate: application.from_date,
              toDate: application.to_date,
              days: application.days,
            });
          }
        }
      } catch (emailError) {
        logger.error('[Leave/cancelLeave] Notification email failed', { error: emailError.message, applicationId: req.params.id });
      }

      sendSuccess(res, null, 'Leave cancelled.');
    } catch (e) {
      const map = { NOT_FOUND: 'Not found.', CANNOT_CANCEL: 'Cannot cancel in current status.', PAST_LEAVE: 'Cannot cancel past approved leave.' };
      if (map[e.message]) return sendError(res, ERROR_CODES.VALIDATION, map[e.message]);
      throw e;
    }
  }),

  getBalances: wrap(async (req, res) => {
    const empId = req.query.employeeId || req.user.employeeId;
    if (!empId) return sendSuccess(res, []);
    sendSuccess(res, await svc.getBalances(empId, req.query.year));
  }),

  getAllBalances: wrap(async (req, res) => {
    sendSuccess(res, await svc.getAllBalances(req.db, req.user.tenantId, req.query.year));
  }),

  getLeaveTypes: wrap(async (req, res) => {
    sendSuccess(res, await svc.getLeaveTypes(req.db, req.user.tenantId));
  }),

  createLeaveType: wrap(async (req, res) => {
    const { name, code } = req.body;
    if (!name || !code) return sendError(res, ERROR_CODES.VALIDATION, 'Name and code required.');
    sendSuccess(res, await svc.createLeaveType(req.db, req.user.tenantId, req.body), 'Leave type created.', 201);
  }),

  updateLeaveType: wrap(async (req, res) => {
    sendSuccess(res, await svc.updateLeaveType(req.db, req.params.id, req.user.tenantId, req.body));
  }),

  deleteLeaveType: wrap(async (req, res) => {
    await svc.deleteLeaveType(req.db, req.params.id, req.user.tenantId);
    sendSuccess(res, null, 'Leave type deleted.');
  }),

  manualAccrue: wrap(async (req, res) => {
    sendSuccess(res, await svc.manualAccrue(req.db, req.user.tenantId), 'Accrual processed.');
  }),

  accrualLog: wrap(async (req, res) => {
    sendSuccess(res, await svc.accrualLog(req.db, req.user.tenantId, req.query));
  }),

  encashLeave: wrap(async (req, res) => {
    const empId = req.user.employeeId;
    if (!empId) return sendError(res, ERROR_CODES.VALIDATION, 'No employee record for this account.');
    const { leaveTypeId, days, reason } = req.body;
    if (!leaveTypeId || !days) return sendError(res, ERROR_CODES.VALIDATION, 'leaveTypeId and days required.');
    sendSuccess(res, await svc.encashLeave(req.db, empId, req.user.tenantId, req.body), 'Encashment request submitted.', 201);
  }),

  report: wrap(async (req, res) => {
    sendSuccess(res, await svc.report(req.db, req.user.tenantId, req.query));
  }),
};

module.exports = ctrl;

