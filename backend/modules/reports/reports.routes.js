const express = require('express');
const router  = express.Router();
const auth    = require('../../shared/middleware/auth');
const { checkPermission, checkModuleEnabled } = require('../../shared/middleware/permission');
const ctrl    = require('./reports.controller');

router.use(auth);
router.use(checkModuleEnabled('reports'));

router.get(
  '/attendance/monthly',
  checkPermission('reports', 'view'),
  ctrl.getMonthlyAttendanceSummary
);

router.get(
  '/payroll/summary',
  checkPermission('reports', 'view'),
  ctrl.getPayrollSummary
);

module.exports = router;

