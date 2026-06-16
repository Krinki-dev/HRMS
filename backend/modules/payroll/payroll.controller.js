const svc = require('./payroll.service');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');

const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) {
    if (e.message === 'NOT_FOUND')              return sendError(res, ERROR_CODES.NOT_FOUND,   'Not found.', 404);
    if (e.message === 'ALREADY_EXISTS')         return sendError(res, ERROR_CODES.VALIDATION,  'Payroll run already exists for this month.');
    if (e.message === 'ALREADY_LOCKED')         return sendError(res, ERROR_CODES.VALIDATION,  'Payroll run is locked.');
    if (e.message === 'NOT_PROCESSED')          return sendError(res, ERROR_CODES.VALIDATION,  'Run must be processed before locking.');
    if (e.message === 'NOT_LOCKED')             return sendError(res, ERROR_CODES.VALIDATION,  'Run must be locked before publishing.');
    if (e.message === 'RUN_LOCKED')             return sendError(res, ERROR_CODES.VALIDATION,  'Cannot edit a locked payroll run.');
    if (e.message === 'CANNOT_DELETE_LOCKED')   return sendError(res, ERROR_CODES.VALIDATION,  'Cannot delete a locked run.');
    if (e.message === 'NAME_REQUIRED')          return sendError(res, ERROR_CODES.VALIDATION,  'Name is required.');
    if (e.message === 'EMPLOYEE_NOT_FOUND')     return sendError(res, ERROR_CODES.NOT_FOUND,   'Employee not found.', 404);
    console.error('[Payroll]', e.message, e.stack?.split('\n')[1]);
    sendError(res, ERROR_CODES.SERVER, 'Server error.', 500);
  }
};

module.exports = {
  dashboard:    wrap(async (req, res) => sendSuccess(res, await svc.getDashboard(req.db, req.user.tenantId))),

  listRuns:     wrap(async (req, res) => {
    const result = await svc.listRuns(req.db, req.user.tenantId, req.query);
    res.json({ success: true, ...result });
  }),

  createRun:    wrap(async (req, res) => {
    const { month, year } = req.body;
    if (!month || !year) return sendError(res, ERROR_CODES.VALIDATION, 'Month and year required.');
    if (month < 1 || month > 12) return sendError(res, ERROR_CODES.VALIDATION, 'Invalid month.');
    sendSuccess(res, await svc.createRun(req.db, req.user.tenantId, parseInt(month), parseInt(year)), 'Payroll run created.', 201);
  }),

  getRun:       wrap(async (req, res) => sendSuccess(res, await svc.getRun(req.db, req.params.runId, req.user.tenantId))),

  processRun:   wrap(async (req, res) => {
    const result = await svc.processRun(req.db, req.params.runId, req.user.tenantId, req.user.id);
    sendSuccess(res, result, `Payroll processed for ${result.payslipCount} employees.`);
  }),

  lockRun:      wrap(async (req, res) => sendSuccess(res, await svc.lockRun(req.db, req.params.runId, req.user.tenantId, req.user.id), 'Payroll run locked.')),

  publishRun:   wrap(async (req, res) => sendSuccess(res, await svc.publishRun(req.db, req.params.runId, req.user.tenantId), 'Payslips published to employees.')),

  deleteRun:    wrap(async (req, res) => { await svc.deleteRun(req.db, req.params.runId, req.user.tenantId); sendSuccess(res, null, 'Deleted.'); }),

  listPayslips: wrap(async (req, res) => {
    const result = await svc.listPayslips(req.db, req.params.runId, req.user.tenantId, req.query);
    res.json({ success: true, ...result });
  }),

  getPayslip:   wrap(async (req, res) => sendSuccess(res, await svc.getPayslip(req.params.runId, req.params.empId, req.user.tenantId))),

  updatePayslip: wrap(async (req, res) => sendSuccess(res, await svc.updatePayslip(req.params.runId, req.params.empId, req.body, req.user.tenantId), 'Payslip updated.')),

  addBonus:     wrap(async (req, res) => {
    if (!req.body.employee_id || !req.body.amount) return sendError(res, ERROR_CODES.VALIDATION, 'employee_id and amount required.');
    sendSuccess(res, await svc.addBonus(req.db, req.params.runId, req.user.tenantId, { ...req.body, created_by: req.user.id }), 'Bonus added.', 201);
  }),

  removeBonus:  wrap(async (req, res) => { await svc.removeBonus(req.params.id, req.params.runId, req.user.tenantId); sendSuccess(res, null, 'Removed.'); }),

  listSalaryStructures:  wrap(async (req, res) => sendSuccess(res, await svc.listSalaryStructures(req.db, req.user.tenantId))),
  createSalaryStructure: wrap(async (req, res) => sendSuccess(res, await svc.createSalaryStructure(req.db, req.user.tenantId, req.body), 'Structure created.', 201)),
  updateSalaryStructure: wrap(async (req, res) => sendSuccess(res, await svc.updateSalaryStructure(req.db, req.params.id, req.user.tenantId, req.body), 'Updated.')),
  deleteSalaryStructure: wrap(async (req, res) => { await svc.deleteSalaryStructure(req.db, req.params.id, req.user.tenantId); sendSuccess(res, null, 'Deleted.'); }),

  getEmployeeSalary: wrap(async (req, res) => sendSuccess(res, await svc.getEmployeeSalary(req.db, req.params.empId, req.user.tenantId))),
  setEmployeeSalary: wrap(async (req, res) => {
    if (!req.body.employee_id || !req.body.salary_structure_id || !req.body.ctc_annual)
      return sendError(res, ERROR_CODES.VALIDATION, 'employee_id, salary_structure_id, ctc_annual required.');
    sendSuccess(res, await svc.setEmployeeSalary(req.db, req.user.tenantId, req.body), 'Salary set.', 201);
  }),

  monthlyReport:      wrap(async (req, res) => sendSuccess(res, await svc.monthlyReport(req.db, req.user.tenantId, req.query.month, req.query.year))),
  bankTransferReport: wrap(async (req, res) => sendSuccess(res, await svc.bankTransferReport(req.db, req.user.tenantId, req.query.month, req.query.year))),

  pfStatement:  wrap(async (req, res) => {
    if (!req.query.month || !req.query.year) return sendError(res, ERROR_CODES.VALIDATION, 'month and year required.');
    sendSuccess(res, await svc.pfStatement(req.db, req.user.tenantId, req.query.month, req.query.year));
  }),

  esiStatement: wrap(async (req, res) => {
    if (!req.query.month || !req.query.year) return sendError(res, ERROR_CODES.VALIDATION, 'month and year required.');
    sendSuccess(res, await svc.esiStatement(req.db, req.user.tenantId, req.query.month, req.query.year));
  }),
};

