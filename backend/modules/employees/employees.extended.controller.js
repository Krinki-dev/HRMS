const {
  draftService,
  addressService,
  educationService,
  familyService,
  prevEmploymentService,
  checkAadhaar,
} = require('./employees.extended.service');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');

exports.checkDuplicate = async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;
    if (!aadhaarNumber || !String(aadhaarNumber).trim())
      return sendError(res, ERROR_CODES.VALIDATION, 'aadhaarNumber is required in request body', 400);

    const clean = String(aadhaarNumber).replace(/\s/g, '');
    if (clean.length !== 12)
      return sendError(res, ERROR_CODES.VALIDATION, 'Aadhaar must be exactly 12 digits', 400);

    const result = await draftService.checkDuplicate(req.db, req.user.tenantId, clean);
    return sendSuccess(res, result);
  } catch (e) {
    console.error('[checkDuplicate] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Duplicate check failed', 500);
  }
};

exports.listDrafts = async (req, res) => {
  try {
    const rows = await draftService.listDrafts(req.db, req.user.tenantId, req.user.id);
    return sendSuccess(res, rows);
  } catch (e) {
    console.error('[listDrafts] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to list drafts', 500);
  }
};

exports.createDraft = async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;
    if (!aadhaarNumber || !String(aadhaarNumber).trim())
      return sendError(res, ERROR_CODES.VALIDATION, 'aadhaarNumber is required', 400);

    const clean  = String(aadhaarNumber).replace(/\s/g, '');
    const result = await draftService.createDraft(req.db, req.user.tenantId, req.user.id, clean);
    return sendSuccess(res, result, 'Draft created');
  } catch (e) {
    console.error('[createDraft] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to create draft', 500);
  }
};

exports.getDraft = async (req, res) => {
  try {
    const draft = await draftService.getDraft(req.db, req.user.tenantId, req.params.draftId);
    if (!draft) return sendError(res, ERROR_CODES.NOT_FOUND, 'Draft not found', 404);
    return sendSuccess(res, draft);
  } catch (e) {
    console.error('[getDraft] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to get draft', 500);
  }
};

exports.saveDraftStep = async (req, res) => {
  try {
    const step = parseInt(req.params.step, 10);
    if (!step || step < 1 || step > 8)
      return sendError(res, ERROR_CODES.VALIDATION, 'Step must be a number between 1 and 8', 400);
    if (req.body.data === undefined)
      return sendError(res, ERROR_CODES.VALIDATION, 'data field is required in request body', 400);

    const result = await draftService.saveStep(
      req.db,
      req.user.tenantId,
      req.params.draftId,
      step,
      req.body.data,
      req.body.employeeId || null,
    );
    return sendSuccess(res, result, `Step ${step} saved`);
  } catch (e) {
    console.error('[saveDraftStep] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to save step', 500);
  }
};

exports.completeDraft = async (req, res) => {
  try {
    const result = await draftService.completeDraft(req.db, req.user.tenantId, req.params.draftId);
    return sendSuccess(res, result, 'Onboarding complete');
  } catch (e) {
    console.error('[completeDraft] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to complete draft', 500);
  }
};

exports.checkAadhaar = async (req, res) => {
  try {
    const { aadhaarNumber, aadhaarHash } = req.body || {};

    if ((!aadhaarNumber || !String(aadhaarNumber).trim()) && !aadhaarHash) {
      return sendError(
        res,
        ERROR_CODES.VALIDATION,
        'Either aadhaarNumber or aadhaarHash is required',
        400
      );
    }

    const result = await checkAadhaar(
      req.db,
      req.user.tenantId,
      req.user.id,
      { aadhaarNumber, aadhaarHash }
    );

    return sendSuccess(res, result);
  } catch (e) {
    console.error('[checkAadhaar] ERROR:', e.message);
    return sendError(
      res,
      ERROR_CODES.SERVER,
      e.message || 'Aadhaar/KYC check failed',
      500
    );
  }
};

exports.getAddresses = async (req, res) => {
  try {
    return sendSuccess(res, await addressService.getAll(req.db, req.params.id));
  } catch (e) {
    console.error('[getAddresses] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to get addresses', 500);
  }
};

exports.upsertAddress = async (req, res) => {
  try {
    const { type } = req.params;
    if (!['local', 'permanent'].includes(type))
      return sendError(res, ERROR_CODES.VALIDATION, 'Address type must be local or permanent', 400);
    return sendSuccess(res, await addressService.upsert(req.db, req.params.id, type, req.body), 'Address saved');
  } catch (e) {
    console.error('[upsertAddress] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to save address', 500);
  }
};

exports.copyLocalAddress = async (req, res) => {
  try {
    return sendSuccess(res, await addressService.copyLocalToPermanent(req.db, req.params.id), 'Copied');
  } catch (e) {
    console.error('[copyLocalAddress] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to copy address', 500);
  }
};

exports.listEducation = async (req, res) => {
  try {
    return sendSuccess(res, await educationService.list(req.db, req.params.id));
  } catch (e) {
    console.error('[listEducation] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to list education', 500);
  }
};

exports.createEducation = async (req, res) => {
  try {
    if (!req.body.eduLevel)
      return sendError(res, ERROR_CODES.VALIDATION, 'eduLevel is required', 400);
    return sendSuccess(res, await educationService.create(req.db, req.params.id, req.body), 'Education added');
  } catch (e) {
    console.error('[createEducation] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to add education', 500);
  }
};

exports.updateEducation = async (req, res) => {
  try {
    return sendSuccess(res, await educationService.update(req.db, req.params.id, req.params.eid, req.body), 'Updated');
  } catch (e) {
    console.error('[updateEducation] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to update education', 500);
  }
};

exports.deleteEducation = async (req, res) => {
  try {
    return sendSuccess(res, await educationService.remove(req.db, req.params.id, req.params.eid), 'Deleted');
  } catch (e) {
    console.error('[deleteEducation] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to delete education', 500);
  }
};

exports.bulkReplaceEducation = async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows))
      return sendError(res, ERROR_CODES.VALIDATION, 'rows must be an array', 400);
    return sendSuccess(res, await educationService.bulkReplace(req.db, req.params.id, rows), `${rows.length} rows saved`);
  } catch (e) {
    console.error('[bulkReplaceEducation] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to save education', 500);
  }
};

exports.listFamily = async (req, res) => {
  try {
    return sendSuccess(res, await familyService.list(req.db, req.params.id));
  } catch (e) {
    console.error('[listFamily] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to list family', 500);
  }
};

exports.createFamilyMember = async (req, res) => {
  try {
    if (!req.body.name || !req.body.relationship)
      return sendError(res, ERROR_CODES.VALIDATION, 'name and relationship are required', 400);
    return sendSuccess(res, await familyService.create(req.db, req.params.id, req.body), 'Member added');
  } catch (e) {
    console.error('[createFamilyMember] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to add family member', 500);
  }
};

exports.updateFamilyMember = async (req, res) => {
  try {
    return sendSuccess(res, await familyService.update(req.db, req.params.id, req.params.mid, req.body), 'Updated');
  } catch (e) {
    console.error('[updateFamilyMember] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to update member', 500);
  }
};

exports.deleteFamilyMember = async (req, res) => {
  try {
    return sendSuccess(res, await familyService.remove(req.db, req.params.id, req.params.mid), 'Removed');
  } catch (e) {
    console.error('[deleteFamilyMember] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to remove member', 500);
  }
};

exports.bulkReplaceFamily = async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows))
      return sendError(res, ERROR_CODES.VALIDATION, 'rows must be an array', 400);
    return sendSuccess(res, await familyService.bulkReplace(req.db, req.params.id, rows), `${rows.length} members saved`);
  } catch (e) {
    console.error('[bulkReplaceFamily] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to save family', 500);
  }
};

exports.checkNomineeTotal = async (req, res) => {
  try {
    return sendSuccess(res, await familyService.validateNomineeTotal(req.db, req.params.id));
  } catch (e) {
    console.error('[checkNomineeTotal] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to check nominees', 500);
  }
};

exports.listPrevEmployment = async (req, res) => {
  try {
    return sendSuccess(res, await prevEmploymentService.list(req.db, req.params.id));
  } catch (e) {
    console.error('[listPrevEmployment] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to list employment', 500);
  }
};

exports.createPrevEmployment = async (req, res) => {
  try {
    return sendSuccess(res, await prevEmploymentService.create(req.db, req.params.id, req.body), 'Added');
  } catch (e) {
    console.error('[createPrevEmployment] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to add employment', 500);
  }
};

exports.updatePrevEmployment = async (req, res) => {
  try {
    return sendSuccess(res, await prevEmploymentService.update(req.db, req.params.id, req.params.pid, req.body), 'Updated');
  } catch (e) {
    console.error('[updatePrevEmployment] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to update employment', 500);
  }
};

exports.deletePrevEmployment = async (req, res) => {
  try {
    return sendSuccess(res, await prevEmploymentService.remove(req.db, req.params.id, req.params.pid), 'Removed');
  } catch (e) {
    console.error('[deletePrevEmployment] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to remove employment', 500);
  }
};

exports.bulkReplacePrevEmployment = async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows))
      return sendError(res, ERROR_CODES.VALIDATION, 'rows must be an array', 400);
    return sendSuccess(res, await prevEmploymentService.bulkReplace(req.db, req.params.id, rows), `${rows.length} records saved`);
  } catch (e) {
    console.error('[bulkReplacePrevEmployment] ERROR:', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to save employment', 500);
  }
};

