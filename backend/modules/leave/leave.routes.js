const express = require('express');
const router  = express.Router();
const ctrl    = require('./leave.controller');
const auth    = require('../../shared/middleware/auth');
const requireSetupComplete = require('../../shared/middleware/requireSetupComplete');
const { checkPermission }  = require('../../shared/middleware/permission');

router.use(auth);

router.get('/dashboard',                  ctrl.dashboard);
router.get('/calendar',                   ctrl.calendar);
router.get('/',                           ctrl.list);
router.get('/my',                         ctrl.myApplications);
router.get('/balances',                   ctrl.getBalances);
router.get('/balances/all',               checkPermission('leave', 'view'),   ctrl.getAllBalances);
router.get('/types',                      ctrl.getLeaveTypes);
router.get('/accrual-log',                checkPermission('leave', 'view'),   ctrl.accrualLog);
router.get('/reports',                    checkPermission('leave', 'view'),   ctrl.report);
router.get('/approvals/pending',          checkPermission('leave', 'edit'),   ctrl.getPendingApprovals);

router.post(
  '/apply',
  requireSetupComplete,
  ctrl.apply
);
router.post(
  '/calculate-days',
  requireSetupComplete,
  ctrl.calculateDays
);
router.put(
  '/:id/cancel',
  requireSetupComplete,
  ctrl.cancelLeave
);
router.put(
  '/:id/approve',
  requireSetupComplete,
  checkPermission('leave', 'edit'),
  ctrl.approveLeave
);
router.put(
  '/:id/reject',
  requireSetupComplete,
  checkPermission('leave', 'edit'),
  ctrl.rejectLeave
);

router.post(
  '/types',
  requireSetupComplete,
  checkPermission('leave', 'create'),
  ctrl.createLeaveType
);
router.put(
  '/types/:id',
  requireSetupComplete,
  checkPermission('leave', 'edit'),
  ctrl.updateLeaveType
);
router.delete(
  '/types/:id',
  requireSetupComplete,
  checkPermission('leave', 'delete'),
  ctrl.deleteLeaveType
);

router.post(
  '/accrue',
  requireSetupComplete,
  checkPermission('leave', 'create'),
  ctrl.manualAccrue
);
router.post(
  '/encash',
  requireSetupComplete,
  checkPermission('leave', 'create'),
  ctrl.encashLeave
);

module.exports = router;

