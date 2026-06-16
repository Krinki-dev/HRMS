const svc = require('./compliance.service');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');

const ctrl = {

  dashboard: async (req, res) => {
    try {
      sendSuccess(res, await svc.dashboard(req.db, req.user.tenantId));
    } catch (e) {
      console.error('[Compliance/dashboard]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Dashboard load failed.', 500);
    }
  },

  calendar: async (req, res) => {
    try {
      sendSuccess(res, await svc.calendar(req.db, req.user.tenantId, parseInt(req.query.year)));
    } catch (e) {
      console.error('[Compliance/calendar]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Calendar load failed.', 500);
    }
  },

  pfSummary: async (req, res) => {
    try {
      const { month, year } = req.query;
      sendSuccess(res, await svc.pfSummary(req.db, req.user.tenantId, parseInt(month), parseInt(year)));
    } catch (e) {
      console.error('[Compliance/pfSummary]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'PF summary failed.', 500);
    }
  },

  generateECR: async (req, res) => {
    try {
      const { month, year } = req.body;
      if (!month || !year) return sendError(res, ERROR_CODES.VALIDATION, 'Month and year required.');
      sendSuccess(res, await svc.generateECR(req.db, req.user.tenantId, parseInt(month), parseInt(year)));
    } catch (e) {
      if (e.message === 'NO_PAYROLL')         return sendError(res, ERROR_CODES.NOT_FOUND, 'No payroll run found for this period.', 404);
      if (e.message === 'PAYROLL_NOT_LOCKED') return sendError(res, ERROR_CODES.VALIDATION, 'Payroll must be processed before generating ECR.');
      console.error('[Compliance/generateECR]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'ECR generation failed.', 500);
    }
  },

  missingUAN: async (req, res) => {
    try {
      sendSuccess(res, await svc.missingUAN(req.db, req.user.tenantId));
    } catch (e) {
      console.error('[Compliance/missingUAN]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Failed to load missing UAN list.', 500);
    }
  },

  updateUAN: async (req, res) => {
    try {
      const { updates } = req.body;
      if (!updates?.length) return sendError(res, ERROR_CODES.VALIDATION, 'No updates provided.');
      sendSuccess(res, await svc.updateUAN(req.db, req.user.tenantId, updates), 'UAN updated.');
    } catch (e) {
      console.error('[Compliance/updateUAN]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Failed to update UAN.', 500);
    }
  },

  esiSummary: async (req, res) => {
    try {
      const { month, year } = req.query;
      sendSuccess(res, await svc.esiSummary(req.db, req.user.tenantId, parseInt(month), parseInt(year)));
    } catch (e) {
      console.error('[Compliance/esiSummary]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'ESI summary failed.', 500);
    }
  },

  generateESIChallan: async (req, res) => {
    try {
      const { month, year } = req.body;
      if (!month || !year) return sendError(res, ERROR_CODES.VALIDATION, 'Month and year required.');
      sendSuccess(res, await svc.generateESIChallan(req.db, req.user.tenantId, parseInt(month), parseInt(year)));
    } catch (e) {
      if (e.message === 'NO_PAYROLL')         return sendError(res, ERROR_CODES.NOT_FOUND, 'No payroll found for this period.', 404);
      if (e.message === 'PAYROLL_NOT_LOCKED') return sendError(res, ERROR_CODES.VALIDATION, 'Payroll must be processed first.');
      console.error('[Compliance/generateESIChallan]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Challan generation failed.', 500);
    }
  },

  ptSlabs: async (req, res) => {
    try {
      sendSuccess(res, await svc.ptSlabs(req.db, req.query.state));
    } catch (e) {
      console.error('[Compliance/ptSlabs]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Failed to load PT slabs.', 500);
    }
  },

  ptSummary: async (req, res) => {
    try {
      const { month, year } = req.query;
      sendSuccess(res, await svc.ptSummary(req.db, req.user.tenantId, parseInt(month), parseInt(year)));
    } catch (e) {
      console.error('[Compliance/ptSummary]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'PT summary failed.', 500);
    }
  },

  generatePTChallan: async (req, res) => {
    try {
      const { month, year } = req.body;
      if (!month || !year) return sendError(res, ERROR_CODES.VALIDATION, 'Month and year required.');
      sendSuccess(res, await svc.generatePTChallan(req.db, req.user.tenantId, parseInt(month), parseInt(year)));
    } catch (e) {
      if (e.message === 'NO_PAYROLL')         return sendError(res, ERROR_CODES.NOT_FOUND, 'No payroll found for this period.', 404);
      if (e.message === 'PAYROLL_NOT_LOCKED') return sendError(res, ERROR_CODES.VALIDATION, 'Payroll must be processed first.');
      console.error('[Compliance/generatePTChallan]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Challan generation failed.', 500);
    }
  },

  tdsSummary: async (req, res) => {
    try {
      const { month, year } = req.query;
      sendSuccess(res, await svc.tdsSummary(req.db, req.user.tenantId, parseInt(month), parseInt(year)));
    } catch (e) {
      console.error('[Compliance/tdsSummary]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'TDS summary failed.', 500);
    }
  },

  getMyDeclaration: async (req, res) => {
    try {
      const empId = req.user.employeeId;
      if (!empId) return sendError(res, ERROR_CODES.VALIDATION, 'No employee record for this user.', 400);
      sendSuccess(res, await svc.getMyDeclaration(req.db, empId, req.query.fy));
    } catch (e) {
      console.error('[Compliance/getMyDeclaration]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Failed to load declaration.', 500);
    }
  },

  saveDeclaration: async (req, res) => {
    try {
      const empId = req.user.employeeId;
      if (!empId) return sendError(res, ERROR_CODES.VALIDATION, 'No employee record for this user.', 400);
      sendSuccess(res, await svc.saveDeclaration(req.db, empId, req.body), 'Declaration saved.');
    } catch (e) {
      console.error('[Compliance/saveDeclaration]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Failed to save declaration.', 500);
    }
  },

  generateForm16: async (req, res) => {
    try {
      const { financialYear } = req.body;
      sendSuccess(res, await svc.generateForm16(req.db, req.user.tenantId, financialYear));
    } catch (e) {
      console.error('[Compliance/generateForm16]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Form 16 generation failed.', 500);
    }
  },

  lwfRules: async (req, res) => {
    try {
      sendSuccess(res, await svc.lwfRules(req.db, req.query.state));
    } catch (e) {
      console.error('[Compliance/lwfRules]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Failed to load LWF rules.', 500);
    }
  },

  lwfSummary: async (req, res) => {
    try {
      const { month, year } = req.query;
      sendSuccess(res, await svc.lwfSummary(req.db, req.user.tenantId, parseInt(month), parseInt(year)));
    } catch (e) {
      console.error('[Compliance/lwfSummary]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'LWF summary failed.', 500);
    }
  },

  generateLWFReturn: async (req, res) => {
    try {
      const { month, year } = req.body;
      if (!month || !year) return sendError(res, ERROR_CODES.VALIDATION, 'Month and year required.');
      sendSuccess(res, await svc.generateLWFReturn(req.db, req.user.tenantId, parseInt(month), parseInt(year)));
    } catch (e) {
      if (e.message === 'NO_PAYROLL') return sendError(res, ERROR_CODES.NOT_FOUND, 'No payroll found for this period.', 404);
      console.error('[Compliance/generateLWFReturn]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'LWF return generation failed.', 500);
    }
  },

  listFilings: async (req, res) => {
    try {
      const { month, year } = req.query;
      sendSuccess(res, await svc.listFilings(req.db, req.user.tenantId, parseInt(month), parseInt(year)));
    } catch (e) {
      console.error('[Compliance/listFilings]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Failed to load filings.', 500);
    }
  },

  markFiled: async (req, res) => {
    try {
      sendSuccess(res, await svc.markFiled(req.db, req.user.tenantId, req.params.id, req.body), 'Marked as filed.');
    } catch (e) {
      if (e.message === 'NOT_FOUND') return sendError(res, ERROR_CODES.NOT_FOUND, 'Filing not found.', 404);
      console.error('[Compliance/markFiled]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Failed.', 500);
    }
  },

  ensureFilings: async (req, res) => {
    try {
      const { month, year } = req.body;
      await svc.ensureFilings(req.db, req.user.tenantId, parseInt(month) || undefined, parseInt(year) || undefined);
      sendSuccess(res, null, 'Filings ensured.');
    } catch (e) {
      console.error('[Compliance/ensureFilings]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Failed.', 500);
    }
  },

};

module.exports = ctrl;

