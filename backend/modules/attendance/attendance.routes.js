const express = require('express');
const router  = express.Router();
const ctrl    = require('./attendance.controller');
const auth    = require('../../shared/middleware/auth');
const { checkPermission } = require('../../shared/middleware/permission');

router.use(auth);

router.get  ('/dashboard',              checkPermission('attendance','view'),   ctrl.dashboard);
router.get  ('/',                       checkPermission('attendance','view'),   ctrl.list);

router.get  ('/today',                                                          ctrl.getToday);
router.post ('/checkin',                                                        ctrl.checkIn);
router.post ('/checkout',                                                       ctrl.checkOut);

router.get  ('/unmarked',               checkPermission('attendance','view'),   ctrl.getUnmarked);
router.post ('/bulk-mark',              checkPermission('attendance','create'), ctrl.bulkMark);
router.put  ('/:id',                    checkPermission('attendance','edit'),   ctrl.updateRecord);

router.get  ('/regularize/pending',     checkPermission('attendance','view'),   ctrl.getPendingRegularizations);
router.post ('/regularize',                                                     ctrl.submitRegularization);
router.put  ('/regularize/:id/approve', checkPermission('attendance','edit'),   ctrl.approveRegularization);
router.put  ('/regularize/:id/reject',  checkPermission('attendance','edit'),   ctrl.rejectRegularization);

router.get  ('/overtime/pending',       checkPermission('attendance','view'),   ctrl.getPendingOvertime);
router.put  ('/overtime/:id/approve',   checkPermission('attendance','edit'),   ctrl.approveOvertime);

router.get  ('/shifts',                 checkPermission('attendance','view'),   ctrl.getShifts);
router.post ('/shifts',                 checkPermission('attendance','create'), ctrl.createShift);
router.put  ('/shifts/:id',             checkPermission('attendance','edit'),   ctrl.updateShift);
router.delete('/shifts/:id',            checkPermission('attendance','delete'), ctrl.deleteShift);

router.get  ('/holidays',               checkPermission('attendance','view'),   ctrl.getHolidays);
router.post ('/holidays',               checkPermission('attendance','create'), ctrl.addHoliday);
router.delete('/holidays/:id',          checkPermission('attendance','delete'), ctrl.deleteHoliday);
router.post ('/holidays/load-national', checkPermission('attendance','create'), ctrl.loadNationalHolidays);

router.get  ('/reports/monthly',        checkPermission('attendance','view'),   ctrl.monthlyReport);

module.exports = router;

