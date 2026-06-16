const router = require('express').Router();
const auth   = require('../../shared/middleware/auth');
const perm   = require('../../shared/middleware/permission');
const requireSetupComplete = require('../../shared/middleware/requireSetupComplete');
const ctrl   = require('./settings.controller');

router.use(auth);
const can = (a) => perm.checkPermission('settings', a);

const requireAdminRole = (req, res, next) => {
  const adminRoles = ['company_admin', 'hr_manager', 'super_admin'];
  if (!adminRoles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      code:    'FORBIDDEN',
      message: 'Only HR administrators can manage this setting.',
    });
  }
  next();
};

router.get('/company',          can('view'),   ctrl.getCompany);
router.put('/company',          can('edit'),   ctrl.updateCompany);

router.get('/db-config',        can('view'),   ctrl.getDbConfig);
router.put('/db-config',        can('edit'),   ctrl.updateDbConfig);
router.post('/db-config/test',  can('edit'),   ctrl.testDbConnection);

router.get('/holidays',         can('view'),   ctrl.listHolidays);
router.post(
  '/holidays',
  requireSetupComplete,
  requireAdminRole,
  can('create'),
  ctrl.addHoliday
);
router.post(
  '/holidays/load-national',
  requireSetupComplete,
  requireAdminRole,
  can('create'),
  ctrl.loadNationalHolidays
);
router.put(
  '/holidays/:id',
  requireSetupComplete,
  requireAdminRole,
  can('edit'),
  ctrl.updateHoliday
);
router.delete(
  '/holidays/:id',
  requireSetupComplete,
  requireAdminRole,
  can('delete'),
  ctrl.deleteHoliday
);

router.get('/shifts',           can('view'),   ctrl.listShifts);
router.post(
  '/shifts',
  requireSetupComplete,
  requireAdminRole,
  can('create'),
  ctrl.createShift
);
router.put(
  '/shifts/:id',
  requireSetupComplete,
  requireAdminRole,
  can('edit'),
  ctrl.updateShift
);
router.delete(
  '/shifts/:id',
  requireSetupComplete,
  requireAdminRole,
  can('delete'),
  ctrl.deleteShift
);
router.post(
  '/shifts/:id/assign',
  requireSetupComplete,
  requireAdminRole,
  can('edit'),
  ctrl.assignShift
);

router.get('/departments',      ctrl.listDepartments);  
router.post(
  '/departments',
  requireSetupComplete,
  requireAdminRole,
  can('create'),
  ctrl.createDepartment
);
router.put(
  '/departments/:id',
  requireSetupComplete,
  requireAdminRole,
  can('edit'),
  ctrl.updateDepartment
);
router.delete(
  '/departments/:id',
  requireSetupComplete,
  requireAdminRole,
  can('delete'),
  ctrl.deleteDepartment
);

router.get('/designations',     ctrl.listDesignations);  
router.post(
  '/designations',
  requireSetupComplete,
  requireAdminRole,
  can('create'),
  ctrl.createDesignation
);
router.put(
  '/designations/:id',
  requireSetupComplete,
  requireAdminRole,
  can('edit'),
  ctrl.updateDesignation
);
router.delete(
  '/designations/:id',
  requireSetupComplete,
  requireAdminRole,
  can('delete'),
  ctrl.deleteDesignation
);

router.get('/branches',         ctrl.listBranches);  
router.post(
  '/branches',
  requireSetupComplete,
  requireAdminRole,
  can('create'),
  ctrl.createBranch
);
router.put(
  '/branches/:id',
  requireSetupComplete,
  requireAdminRole,
  can('edit'),
  ctrl.updateBranch
);
router.delete(
  '/branches/:id',
  requireSetupComplete,
  requireAdminRole,
  can('delete'),
  ctrl.deleteBranch
);

module.exports = router;

