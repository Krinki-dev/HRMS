const router = require('express').Router();
const auth   = require('../../shared/middleware/auth');
const perm   = require('../../shared/middleware/permission');
const bcrypt = require('bcryptjs');
const requireSetupComplete = require('../../shared/middleware/requireSetupComplete');
const ctrl   = require('./settings.controller');
const { centralPrisma } = require('../../shared/utils/centralPrisma');
const { resolveTenantId } = require('../../shared/utils/tenantResolver');
const {
  getDeletionReadiness,
  permanentlyDeleteTenant,
} = require('../platform/tenantDeletion.service');

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

router.get(
  '/account/deletion-readiness',
  requireAdminRole,
  can('view'),
  async (req, res) => {
    try {
      const tenantId = await resolveTenantId(req);
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          code: 'TENANT_REQUIRED',
          message: 'Tenant ID could not be resolved',
        });
      }
      const data = await getDeletionReadiness(centralPrisma, tenantId);
      return res.json({ success: true, data });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ success: false, code: err.code, message: err.message });
      }
      return res.status(500).json({ success: false, code: 'SERVER', message: 'Failed to load deletion readiness' });
    }
  }
);

router.post(
  '/account/delete-permanent',
  requireSetupComplete,
  requireAdminRole,
  can('delete'),
  async (req, res) => {
    try {
      const tenantId = await resolveTenantId(req);
      if (!tenantId) {
        return res.status(400).json({ success: false, code: 'TENANT_REQUIRED', message: 'Tenant ID could not be resolved' });
      }

      const { currentPassword, confirmExternalDelete = false, backupConfig = null, reason = '' } = req.body || {};
      if (!currentPassword) {
        return res.status(400).json({ success: false, code: 'PASSWORD_REQUIRED', message: 'Current password is required' });
      }

      const user = await req.db.users.findUnique({ where: { id: req.user.id } });
      if (!user || !user.password_hash) {
        return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'User not allowed' });
      }

      const ok = await bcrypt.compare(currentPassword, user.password_hash);
      if (!ok) {
        return res.status(403).json({ success: false, code: 'INVALID_PASSWORD', message: 'Current password is incorrect' });
      }

      const result = await permanentlyDeleteTenant({
        centralDb: centralPrisma,
        tenantId,
        actorEmail: req.user?.email,
        reason,
        confirmExternalDelete,
        backupConfig,
      });

      return res.json({
        success: true,
        data: {
          backupProvider: result.backupProvider,
          backupUrl: result.backupUrl,
        },
        message: 'Account and tenant data permanently deleted',
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ success: false, code: err.code, message: err.message });
      }
      return res.status(500).json({ success: false, code: 'SERVER', message: 'Permanent deletion failed' });
    }
  }
);

module.exports = router;

