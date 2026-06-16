const svc  = require('./recruitment.service');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const { resolveTenantId } = require('../../shared/utils/tenantResolver');

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    if (e.message === 'NOT_FOUND')              return sendError(res, ERROR_CODES.NOT_FOUND, 'Not found.', 404);
    if (e.message === 'CANNOT_EDIT')            return sendError(res, ERROR_CODES.VALIDATION, 'Cannot edit in current status.');
    if (e.message === 'INVALID_STAGE')          return sendError(res, ERROR_CODES.VALIDATION, 'Invalid pipeline stage.');
    if (e.message === 'REQUISITION_NOT_APPROVED') return sendError(res, ERROR_CODES.VALIDATION, 'Requisition must be approved before posting.');
    console.error('[Recruitment]', e.message);
    sendError(res, ERROR_CODES.SERVER, 'Server error.', 500);
  }
};

module.exports = {

  dashboard: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.dashboard(req.db, tenantId));
  }),

  listRequisitions: wrap(async (req, res) => {
    const { status, cursor, limit } = req.query;
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.listRequisitions(req.db, tenantId, { status, cursor, limit: limit ? parseInt(limit) : 20 }));
  }),
  getRequisition: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.getRequisition(req.db, tenantId, req.params.id));
  }),
  createRequisition: wrap(async (req, res) => {
    if (!req.body.jobTitle) return sendError(res, ERROR_CODES.VALIDATION, 'Job title is required.');
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.createRequisition(req.db, tenantId, req.user.id, req.body), 'Requisition submitted for approval.', 201);
  }),
  updateRequisition: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.updateRequisition(req.db, tenantId, req.params.id, req.body), 'Requisition updated.');
  }),
  approveRequisition: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.approveRequisition(req.db, tenantId, req.params.id, req.user.id), 'Requisition approved.');
  }),
  rejectRequisition: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.rejectRequisition(req.db, tenantId, req.params.id), 'Requisition rejected.');
  }),
  deleteRequisition: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    await svc.deleteRequisition(req.db, tenantId, req.params.id);
    sendSuccess(res, null, 'Requisition deleted.');
  }),

  listJobs: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.listJobs(req.db, tenantId, { status: req.query.status }));
  }),
  getJob: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.getJob(req.db, tenantId, req.params.id));
  }),
  postJob: wrap(async (req, res) => {
    if (!req.body.requisitionId) return sendError(res, ERROR_CODES.VALIDATION, 'Requisition ID required.');
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.postJob(req.db, tenantId, req.body), 'Job posted.', 201);
  }),
  closeJob: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.closeJob(req.db, tenantId, req.params.id), 'Job closed.');
  }),

  listCandidates: wrap(async (req, res) => {
    const { jobId, stage, search, cursor, limit } = req.query;
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.listCandidates(req.db, tenantId, { jobId, stage, search, cursor, limit: limit ? parseInt(limit) : 30 }));
  }),
  getCandidate: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.getCandidate(req.db, tenantId, req.params.id));
  }),
  addCandidate: wrap(async (req, res) => {
    if (!req.body.firstName || !req.body.jobId) return sendError(res, ERROR_CODES.VALIDATION, 'Name and job are required.');
    const tenantId = await resolveTenantId(req);
    const result = await svc.addCandidate(req.db, tenantId, req.body);
    const msg = result.isDuplicate ? 'Candidate added (possible duplicate detected).' : 'Candidate added.';
    sendSuccess(res, result, msg, 201);
  }),
  updateCandidate: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.updateCandidate(req.db, tenantId, req.params.id, req.body), 'Candidate updated.');
  }),
  moveStage: wrap(async (req, res) => {
    if (!req.body.toStage) return sendError(res, ERROR_CODES.VALIDATION, 'Target stage required.');
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.moveStage(req.db, tenantId, req.params.id, {
      toStage:   req.body.toStage,
      notes:     req.body.notes,
      changedBy: req.user.id,
    }), 'Stage updated.');
  }),
  convertToEmployee: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.convertToEmployee(req.db, tenantId, req.params.id, req.body), 'Candidate converted to employee!');
  }),
  deleteCandidate: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    await svc.deleteCandidate(req.db, tenantId, req.params.id);
    sendSuccess(res, null, 'Candidate removed.');
  }),

  listInterviews: wrap(async (req, res) => {
    const { candidateId, upcoming } = req.query;
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.listInterviews(req.db, tenantId, { candidateId, upcoming: upcoming === 'true' }));
  }),
  getInterview: wrap(async (req, res) => {
    sendSuccess(res, await svc.getInterview(req.params.id));
  }),
  scheduleInterview: wrap(async (req, res) => {
    if (!req.body.candidateId || !req.body.scheduledAt) return sendError(res, ERROR_CODES.VALIDATION, 'Candidate and schedule required.');
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.scheduleInterview(req.db, tenantId, req.body), 'Interview scheduled.', 201);
  }),
  updateInterview: wrap(async (req, res) => {
    sendSuccess(res, await svc.updateInterview(req.params.id, req.body), 'Interview updated.');
  }),
  cancelInterview: wrap(async (req, res) => {
    sendSuccess(res, await svc.cancelInterview(req.params.id), 'Interview cancelled.');
  }),
  submitFeedback: wrap(async (req, res) => {
    if (!req.user.id) return sendError(res, ERROR_CODES.AUTH, 'Not authenticated.', 401);
    sendSuccess(res, await svc.submitFeedback(req.params.id, req.user.id, req.body), 'Feedback submitted.');
  }),

  createOffer: wrap(async (req, res) => {
    if (!req.body.candidateId) return sendError(res, ERROR_CODES.VALIDATION, 'Candidate ID required.');
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.createOffer(req.db, tenantId, { ...req.body, createdBy: req.user.id }), 'Offer created.', 201);
  }),
  acceptOffer: wrap(async (req, res) => {
    sendSuccess(res, await svc.acceptOffer(req.params.id), 'Offer accepted.');
  }),
  declineOffer: wrap(async (req, res) => {
    sendSuccess(res, await svc.declineOffer(req.params.id), 'Offer declined.');
  }),
};

