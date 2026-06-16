const svc = require('./assets.service');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');

const h = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) {
    if (e.message === 'NOT_FOUND')        return sendError(res, ERROR_CODES.NOT_FOUND,   'Asset not found.', 404);
    if (e.message === 'ALREADY_ALLOCATED') return sendError(res, ERROR_CODES.VALIDATION,  'Asset is already allocated to someone.');
    if (e.message === 'NOT_ALLOCATED')     return sendError(res, ERROR_CODES.VALIDATION,  'This asset has no active allocation.');
    if (e.message === 'ASSET_ALLOCATED')   return sendError(res, ERROR_CODES.VALIDATION,  'Cannot delete an allocated asset. Return it first.');
    console.error(e);
    sendError(res, ERROR_CODES.SERVER, 'Internal server error.', 500);
  }
};

module.exports = {
  dashboard:   h(async (req, res) => sendSuccess(res, await svc.dashboard(req.db, req.user.tenantId))),
  list:        h(async (req, res) => sendSuccess(res, await svc.list(req.db, req.user.tenantId, req.query))),
  create:      h(async (req, res) => sendSuccess(res, await svc.create(req.db, req.user.tenantId, req.body), 'Asset created.', 201)),
  get:         h(async (req, res) => sendSuccess(res, await svc.get(req.db, req.user.tenantId, req.params.id))),
  update:      h(async (req, res) => sendSuccess(res, await svc.update(req.db, req.user.tenantId, req.params.id, req.body))),
  remove:      h(async (req, res) => sendSuccess(res, await svc.remove(req.db, req.user.tenantId, req.params.id), 'Deleted.')),
  allocate:    h(async (req, res) => sendSuccess(res, await svc.allocate(req.db, req.user.tenantId, req.params.id, { ...req.body, allocatedBy: req.user.id }), 'Asset allocated.')),
  returnAsset: h(async (req, res) => sendSuccess(res, await svc.returnAsset(req.db, req.user.tenantId, req.params.id, req.body), 'Asset returned.')),
  byEmployee:  h(async (req, res) => sendSuccess(res, await svc.byEmployee(req.db, req.user.tenantId, req.params.empId))),
};

