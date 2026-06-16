const svc = require('./performance.service');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');

const h = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) {
    if (e.message === 'NOT_FOUND')              return sendError(res, ERROR_CODES.NOT_FOUND, 'Not found.', 404);
    if (e.message === 'CYCLE_NOT_FOUND')        return sendError(res, ERROR_CODES.NOT_FOUND, 'Appraisal cycle not found.', 404);
    if (e.message === 'WEIGHTAGE_EXCEEDED')     return sendError(res, ERROR_CODES.VALIDATION, 'Total weightage cannot exceed 100%.');
    if (e.message === 'CANNOT_EDIT_APPROVED')   return sendError(res, ERROR_CODES.VALIDATION, 'Approved goals cannot be edited.');
    if (e.message === 'CANNOT_DELETE_APPROVED') return sendError(res, ERROR_CODES.VALIDATION, 'Approved goals cannot be deleted.');
    if (e.message === 'NO_ACTIVE_CYCLE')        return sendError(res, ERROR_CODES.VALIDATION, 'No active appraisal cycle found.');
    console.error(e);
    sendError(res, ERROR_CODES.SERVER, 'Internal server error.', 500);
  }
};

const empId = (req) => req.user.employeeId;

module.exports = {
  dashboard:             h(async (req, res) => sendSuccess(res, await svc.dashboard(req.db, req.user.tenantId))),

  listCycles:            h(async (req, res) => sendSuccess(res, await svc.listCycles(req.db, req.user.tenantId))),
  createCycle:           h(async (req, res) => sendSuccess(res, await svc.createCycle(req.db, req.user.tenantId, req.body), 'Cycle created.', 201)),
  updateCycle:           h(async (req, res) => sendSuccess(res, await svc.updateCycle(req.db, req.user.tenantId, req.params.id, req.body))),
  activateCycle:         h(async (req, res) => sendSuccess(res, await svc.activateCycle(req.db, req.user.tenantId, req.params.id), 'Cycle activated.')),
  closeCycle:            h(async (req, res) => sendSuccess(res, await svc.closeCycle(req.db, req.user.tenantId, req.params.id), 'Cycle closed.')),

  listMyGoals:           h(async (req, res) => sendSuccess(res, await svc.listMyGoals(empId(req), req.query.cycleId))),
  listTeamGoals:         h(async (req, res) => sendSuccess(res, await svc.listTeamGoals(req.db, req.user.tenantId, req.query.cycleId))),
  createGoal:            h(async (req, res) => sendSuccess(res, await svc.createGoal(empId(req), req.body), 'Goal created.', 201)),
  updateGoal:            h(async (req, res) => sendSuccess(res, await svc.updateGoal(empId(req), req.params.id, req.body))),
  approveGoal:           h(async (req, res) => sendSuccess(res, await svc.approveGoal(req.user.id, req.params.id), 'Goal approved.')),
  deleteGoal:            h(async (req, res) => sendSuccess(res, await svc.deleteGoal(empId(req), req.params.id), 'Goal deleted.')),

  getMyAppraisal:        h(async (req, res) => sendSuccess(res, await svc.getMyAppraisal(empId(req), req.query.cycleId))),
  getTeamAppraisals:     h(async (req, res) => sendSuccess(res, await svc.getTeamAppraisals(req.db, req.user.tenantId, req.query.cycleId))),
  submitSelfAppraisal:   h(async (req, res) => sendSuccess(res, await svc.submitSelfAppraisal(empId(req), req.body), 'Self appraisal submitted.')),
  submitManagerAppraisal:h(async (req, res) => sendSuccess(res, await svc.submitManagerAppraisal(req.user.id, req.body), 'Manager appraisal submitted.')),
  finalizeAppraisal:     h(async (req, res) => sendSuccess(res, await svc.finalizeAppraisal(req.db, req.user.tenantId, req.params.id, req.body), 'Appraisal finalized.')),
};

