const svc  = require('./settings.service');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const { resolveCompanyId } = require('../../shared/utils/tenantResolver');

const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) {
    if (e.message === 'NOT_FOUND')       return sendError(res, ERROR_CODES.NOT_FOUND,  'Not found.', 404);
    if (e.message === 'NAME_REQUIRED')   return sendError(res, ERROR_CODES.VALIDATION, 'Name is required.');
    if (e.message === 'DUPLICATE')       return sendError(res, ERROR_CODES.VALIDATION, 'Already exists with this name.');
    if (e.message === 'DUPLICATE_DATE')  return sendError(res, ERROR_CODES.VALIDATION, 'A holiday already exists on this date.');
    if (e.message === 'HAS_EMPLOYEES')   return sendError(res, ERROR_CODES.VALIDATION, 'Cannot delete — employees are assigned to this.');
    if (e.message === 'SHIFT_IN_USE')    return sendError(res, ERROR_CODES.VALIDATION, 'Cannot delete — employees are on this shift.');
    if (e.message === 'MISSING_FIELDS')  return sendError(res, ERROR_CODES.VALIDATION, 'Name, start time and end time are required.');
    console.error('[Settings]', e.message);
    sendError(res, ERROR_CODES.SERVER, 'Server error.', 500);
  }
};

module.exports = {
  
  getCompany:    wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.getCompany(req.db, tenantId)); }),
  updateCompany: wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.updateCompany(req.db, tenantId, req.body), 'Company profile updated.'); }),

  listHolidays:         wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.listHolidays(req.db, tenantId, req.query.year)); }),
  addHoliday:           wrap(async (req, res) => {
    if (!req.body.name || !req.body.date) return sendError(res, ERROR_CODES.VALIDATION, 'Name and date required.');
    const tenantId = await resolveCompanyId(req);
    sendSuccess(res, await svc.addHoliday(req.db, tenantId, req.body), 'Holiday added.', 201);
  }),
  loadNationalHolidays: wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.loadNationalHolidays(req.db, tenantId, req.body.year), 'National holidays loaded.'); }),
  updateHoliday:        wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.updateHoliday(req.db, tenantId, req.params.id, req.body), 'Holiday updated.'); }),
  deleteHoliday:        wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); await svc.deleteHoliday(req.db, tenantId, req.params.id); sendSuccess(res, null, 'Holiday deleted.'); }),

  listShifts:   wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.listShifts(req.db, tenantId)); }),
  createShift:  wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.createShift(req.db, tenantId, req.body), 'Shift created.', 201); }),
  updateShift:  wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.updateShift(req.db, tenantId, req.params.id, req.body), 'Shift updated.'); }),
  deleteShift:  wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); await svc.deleteShift(req.db, tenantId, req.params.id); sendSuccess(res, null, 'Shift deleted.'); }),
  assignShift:  wrap(async (req, res) => {
    if (!req.body.employeeIds?.length) return sendError(res, ERROR_CODES.VALIDATION, 'employeeIds required.');
    const tenantId = await resolveCompanyId(req);
    sendSuccess(res, await svc.assignShift(req.db, tenantId, req.params.id, req.body), 'Shift assigned.');
  }),

  listDepartments:   wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.listDepartments(req.db, tenantId)); }),
  createDepartment:  wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.createDepartment(req.db, tenantId, req.body), 'Department created.', 201); }),
  updateDepartment:  wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.updateDepartment(req.db, tenantId, req.params.id, req.body), 'Department updated.'); }),
  deleteDepartment:  wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); await svc.deleteDepartment(req.db, tenantId, req.params.id); sendSuccess(res, null, 'Department deleted.'); }),

  listDesignations:  wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.listDesignations(req.db, tenantId)); }),
  createDesignation: wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.createDesignation(req.db, tenantId, req.body), 'Designation created.', 201); }),
  updateDesignation: wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.updateDesignation(req.db, tenantId, req.params.id, req.body), 'Designation updated.'); }),
  deleteDesignation: wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); await svc.deleteDesignation(req.db, tenantId, req.params.id); sendSuccess(res, null, 'Designation deleted.'); }),

  listBranches:  wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.listBranches(req.db, tenantId)); }),
  createBranch:  wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.createBranch(req.db, tenantId, req.body), 'Branch created.', 201); }),
  updateBranch:  wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); return sendSuccess(res, await svc.updateBranch(req.db, tenantId, req.params.id, req.body), 'Branch updated.'); }),
  deleteBranch:  wrap(async (req, res) => { const tenantId = await resolveCompanyId(req); await svc.deleteBranch(req.db, tenantId, req.params.id); sendSuccess(res, null, 'Branch deleted.'); }),
  
  // Legacy tenant_db_config settings are intentionally disabled. Active
  // tenant storage is controlled by the Central provisioning lifecycle.
  // These endpoints previously opened a direct Prisma client (bypassing
  // Central RLS context), stored raw credentials and accepted arbitrary DB
  // URLs/hosts. Keep explicit 410 responses for old clients; never connect.
  getDbConfig: (_req, res) => res.status(410).json({
    success: false,
    code: 'LEGACY_DB_CONFIG_DISABLED',
    message: 'Legacy database settings are disabled. Tenant storage is managed by secure platform provisioning.',
  }),
  updateDbConfig: (_req, res) => res.status(410).json({
    success: false,
    code: 'LEGACY_DB_CONFIG_DISABLED',
    message: 'Legacy database settings are disabled. Contact support for tenant storage changes.',
  }),
  testDbConnection: (_req, res) => res.status(410).json({
    success: false,
    code: 'LEGACY_DB_CONFIG_DISABLED',
    message: 'Direct database connection testing is disabled.',
  }),

};

