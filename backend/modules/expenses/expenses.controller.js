const svc = require('./expenses.service');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');

const h = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    if (e.message === 'NOT_FOUND')               return sendError(res, ERROR_CODES.NOT_FOUND,  'Claim not found.', 404);
    if (e.message === 'NO_ITEMS')                return sendError(res, ERROR_CODES.VALIDATION, 'At least one expense item is required.');
    if (e.message === 'CANNOT_DELETE')           return sendError(res, ERROR_CODES.VALIDATION, 'Only pending claims can be deleted.');
    if (e.message === 'FILE_STORAGE_NOT_CONFIGURED')
      return sendError(res, ERROR_CODES.SERVER, 'File storage is not configured. Contact your admin.', 503);
    console.error('[Expenses]', e.message);
    sendError(res, ERROR_CODES.SERVER, 'Internal server error.', 500);
  }
};

const empId = (req) => req.user.employeeId;

module.exports = {
  listClaims:       h(async (req, res) => sendSuccess(res, await svc.listClaims(req.db, empId(req), req.user.tenantId, { ...req.query, mine: req.query.mine === 'true' }))),
  createClaim:      h(async (req, res) => sendSuccess(res, await svc.createClaim(req.db, empId(req), req.body), 'Claim submitted.', 201)),
  pendingApprovals: h(async (req, res) => sendSuccess(res, await svc.pendingApprovals(req.db, req.user.tenantId))),
  getClaim:         h(async (req, res) => sendSuccess(res, await svc.getClaim(req.db, req.params.id, empId(req), req.user.tenantId))),
  approveClaim:     h(async (req, res) => sendSuccess(res, await svc.approveClaim(req.db, req.user.tenantId, req.params.id, req.user.id, req.body), 'Claim approved.')),
  rejectClaim:      h(async (req, res) => sendSuccess(res, await svc.rejectClaim(req.db, req.user.tenantId, req.params.id, req.user.id, req.body), 'Claim rejected.')),
  deleteClaim:      h(async (req, res) => sendSuccess(res, await svc.deleteClaim(req.db, empId(req), req.params.id), 'Claim deleted.')),
  listPolicies:     h(async (req, res) => sendSuccess(res, await svc.listPolicies(req.db, req.user.tenantId))),
  createPolicy:     h(async (req, res) => sendSuccess(res, await svc.createPolicy(req.db, req.user.tenantId, req.body), 'Policy created.', 201)),
  updatePolicy:     h(async (req, res) => sendSuccess(res, await svc.updatePolicy(req.db, req.user.tenantId, req.params.id, req.body))),
  uploadReceipt:    h(async (req, res) => sendSuccess(res, await svc.uploadReceipt(req.db, req.user.tenantId, req.file), 'Receipt uploaded.', 201)),
};

