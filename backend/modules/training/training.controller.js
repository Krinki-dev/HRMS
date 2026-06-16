const svc = require('./training.service');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const { resolveTenantId } = require('../../shared/utils/tenantResolver');

const h = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) {
    if (e.message === 'NOT_FOUND') return sendError(res, ERROR_CODES.NOT_FOUND, 'Training not found.', 404);
    console.error(e);
    sendError(res, ERROR_CODES.SERVER, 'Internal server error.', 500);
  }
};

module.exports = {
  list:             h(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.list(req.db, tenantId, req.query)); }),
  create:           h(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.create(req.db, tenantId, req.body), 'Training created.', 201); }),
  get:              h(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.get(req.db, tenantId, req.params.id)); }),
  update:           h(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.update(req.db, tenantId, req.params.id, req.body)); }),
  remove:           h(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.remove(req.db, tenantId, req.params.id), 'Deleted.'); }),
  listNominations:  h(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.listNominations(req.db, tenantId, req.params.id)); }),
  nominate:         h(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.nominate(req.db, tenantId, req.params.id, { ...req.body, nominatedBy: req.user.id }), 'Nominated.'); }),
  removeNomination: h(async (req, res) => sendSuccess(res, await svc.removeNomination(req.params.id, req.params.empId), 'Removed.')),
  markAttendance:   h(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.markAttendance(req.db, tenantId, req.params.id, req.body.records), 'Attendance marked.'); }),
  submitFeedback:   h(async (req, res) => sendSuccess(res, await svc.submitFeedback(req.params.id, req.user.employeeId, req.body), 'Feedback submitted.')),
  myTrainings:      h(async (req, res) => sendSuccess(res, await svc.myTrainings(req.user.employeeId))),
};

