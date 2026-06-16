const express = require('express');
const router  = express.Router();
const auth    = require('../../shared/middleware/auth');
const { checkPermission } = require('../../shared/middleware/permission');
const ctrl    = require('./reports.controller');

router.use(auth);

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

