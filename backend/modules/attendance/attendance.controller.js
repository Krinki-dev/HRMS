const svc = require('./attendance.service');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');

const ctrl = {
  dashboard: async (req, res) => {
    try { sendSuccess(res, await svc.dashboard(req.db, req.user.tenantId, req.query.date)); }
    catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed to load dashboard.', 500); }
  },

  list: async (req, res) => {
    try { sendSuccess(res, await svc.list(req.db, req.user.tenantId, req.query)); }
    catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed to fetch records.', 500); }
  },

  getToday: async (req, res) => {
    try { sendSuccess(res, await svc.getToday(req.db, req.user.employeeId, req.user.tenantId)); }
    catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed.', 500); }
  },

  checkIn: async (req, res) => {
    try {
      const data = await svc.checkIn(req.db, req.user.employeeId, req.user.tenantId, req.body);
      sendSuccess(res, data, data.message, 201);
    } catch (e) {
      if (e.message === 'ALREADY_CHECKED_IN') return sendError(res, ERROR_CODES.DUPLICATE, 'Already checked in today.');
      sendError(res, ERROR_CODES.SERVER, 'Check-in failed.', 500);
    }
  },

  checkOut: async (req, res) => {
    try {
      const data = await svc.checkOut(req.db, req.user.employeeId, req.user.tenantId);
      sendSuccess(res, data, data.message);
    } catch (e) {
      if (e.message === 'NOT_CHECKED_IN')    return sendError(res, ERROR_CODES.NOT_FOUND, 'Not checked in today.');
      if (e.message === 'ALREADY_CHECKED_OUT') return sendError(res, ERROR_CODES.DUPLICATE, 'Already checked out today.');
      sendError(res, ERROR_CODES.SERVER, 'Check-out failed.', 500);
    }
  },

  getUnmarked: async (req, res) => {
    try { sendSuccess(res, await svc.getUnmarked(req.db, req.user.tenantId, req.query.date)); }
    catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed.', 500); }
  },

  bulkMark: async (req, res) => {
    try {
      const { date, records } = req.body;
      if (!date || !records?.length) return sendError(res, ERROR_CODES.VALIDATION, 'Date and records are required.');
      const result = await svc.bulkMark(req.db, req.user.tenantId, req.user.id, { date, records });
      sendSuccess(res, result, `${result.saved} attendance records saved.`);
    } catch (e) {
      if (e.message === 'FUTURE_DATE') return sendError(res, ERROR_CODES.VALIDATION, 'Cannot mark attendance for future dates.');
      sendError(res, ERROR_CODES.SERVER, 'Bulk mark failed.', 500);
    }
  },

  updateRecord: async (req, res) => {
    try { sendSuccess(res, await svc.updateRecord(req.db, req.params.id, req.user.tenantId, req.body)); }
    catch (e) {
      if (e.message === 'NOT_FOUND') return sendError(res, ERROR_CODES.NOT_FOUND, 'Record not found.', 404);
      sendError(res, ERROR_CODES.SERVER, 'Update failed.', 500);
    }
  },

  submitRegularization: async (req, res) => {
    try {
      const { date, reason } = req.body;
      if (!date || !reason) return sendError(res, ERROR_CODES.VALIDATION, 'Date and reason are required.');
      const data = await svc.submitRegularization(req.db, req.user.employeeId, req.user.tenantId, req.body);
      sendSuccess(res, data, 'Regularization request submitted.', 201);
    } catch (e) {
      if (e.message === 'REASON_TOO_SHORT')   return sendError(res, ERROR_CODES.VALIDATION, 'Reason must be at least 10 characters.');
      if (e.message === 'DUPLICATE_REQUEST')  return sendError(res, ERROR_CODES.DUPLICATE, 'A pending request already exists for this date.');
      sendError(res, ERROR_CODES.SERVER, 'Failed.', 500);
    }
  },

  getPendingRegularizations: async (req, res) => {
    try { sendSuccess(res, await svc.getPendingRegularizations(req.db, req.user.tenantId, req.user.id)); }
    catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed.', 500); }
  },

  approveRegularization: async (req, res) => {
    try {
      await svc.approveRegularization(req.db, req.params.id, req.user.tenantId, req.user.id);
      sendSuccess(res, null, 'Regularization approved.');
    } catch (e) {
      if (e.message === 'NOT_FOUND') return sendError(res, ERROR_CODES.NOT_FOUND, 'Request not found.', 404);
      sendError(res, ERROR_CODES.SERVER, 'Failed.', 500);
    }
  },

  rejectRegularization: async (req, res) => {
    try {
      await svc.rejectRegularization(req.db, req.params.id, req.user.tenantId, req.user.id, req.body.reason);
      sendSuccess(res, null, 'Regularization rejected.');
    } catch (e) {
      if (e.message === 'REASON_REQUIRED') return sendError(res, ERROR_CODES.VALIDATION, 'Rejection reason is required.');
      sendError(res, ERROR_CODES.SERVER, 'Failed.', 500);
    }
  },

  getPendingOvertime: async (req, res) => {
    try { sendSuccess(res, await svc.getPendingOvertime(req.db, req.user.tenantId)); }
    catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed.', 500); }
  },

  approveOvertime: async (req, res) => {
    try {
      const { type } = req.body;
      if (!['pay', 'comp_off'].includes(type)) return sendError(res, ERROR_CODES.VALIDATION, 'Type must be pay or comp_off.');
      await svc.approveOvertime(req.db, req.params.id, req.user.tenantId, { type });
      sendSuccess(res, null, `Overtime approved as ${type === 'pay' ? 'payment' : 'comp off'}.`);
    } catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed.', 500); }
  },

  getShifts: async (req, res) => {
    try { sendSuccess(res, await svc.getShifts(req.db, req.user.tenantId)); }
    catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed.', 500); }
  },

  createShift: async (req, res) => {
    try {
      const { name, startTime, endTime } = req.body;
      if (!name || !startTime || !endTime) return sendError(res, ERROR_CODES.VALIDATION, 'Name, start time, and end time are required.');
      sendSuccess(res, await svc.createShift(req.db, req.user.tenantId, req.body), 'Shift created.', 201);
    } catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed.', 500); }
  },

  updateShift: async (req, res) => {
    try { sendSuccess(res, await svc.updateShift(req.db, req.params.id, req.user.tenantId, req.body)); }
    catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed.', 500); }
  },

  deleteShift: async (req, res) => {
    try { sendSuccess(res, await svc.deleteShift(req.db, req.params.id, req.user.tenantId), 'Shift deleted.'); }
    catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed.', 500); }
  },

  getHolidays: async (req, res) => {
    try { sendSuccess(res, await svc.getHolidays(req.db, req.user.tenantId, req.query.year)); }
    catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed.', 500); }
  },

  addHoliday: async (req, res) => {
    try {
      const { date, name } = req.body;
      if (!date || !name) return sendError(res, ERROR_CODES.VALIDATION, 'Date and name are required.');
      sendSuccess(res, await svc.addHoliday(req.db, req.user.tenantId, req.body), 'Holiday added.', 201);
    } catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed.', 500); }
  },

  deleteHoliday: async (req, res) => {
    try { sendSuccess(res, await svc.deleteHoliday(req.db, req.params.id, req.user.tenantId), 'Holiday removed.'); }
    catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed.', 500); }
  },

  loadNationalHolidays: async (req, res) => {
    try { sendSuccess(res, await svc.loadNationalHolidays(req.db, req.user.tenantId, req.body.year)); }
    catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed.', 500); }
  },

  monthlyReport: async (req, res) => {
    try {
      const { month, year } = req.query;
      if (!month || !year) return sendError(res, ERROR_CODES.VALIDATION, 'Month and year are required.');
      sendSuccess(res, await svc.monthlyReport(req.db, req.user.tenantId, month, year));
    } catch (e) { sendError(res, ERROR_CODES.SERVER, 'Failed.', 500); }
  },
};

module.exports = ctrl;

