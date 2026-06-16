const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();

const ctrl    = require('./employees.controller');
const extCtrl = require('./employees.extended.controller');
const reqCtrl = require('./employees.update-request');
const auth    = require('../../shared/middleware/auth');
const requireSetupComplete = require('../../shared/middleware/requireSetupComplete');
const { checkPermission } = require('../../shared/middleware/permission');
const { sendError }       = require('../../shared/utils/response');

const UPLOAD_DIR = path.join(__dirname, '../../../uploads/employees');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `photo_${req.params.id}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed.'));
    }
  },
});

router.use(auth);

let extLoaded = true;
try {
  require('./employees.extended.controller');
} catch {
  extLoaded = false;
}
const ext = (fn) => (req, res, next) => {
  if (!extLoaded || typeof extCtrl?.[fn] !== 'function') {
    return sendError(
      res,
      'ERR_NOT_IMPLEMENTED',
      `Extended employee feature '${fn}' not available.`,
      501
    );
  }
  return extCtrl[fn](req, res, next);
};

router.post(
  '/check-aadhaar',
  requireSetupComplete,
  checkPermission('employees', 'create'),
  ext('checkAadhaar')
);

router.post(
  '/drafts/check-duplicate',
  requireSetupComplete,
  checkPermission('employees', 'create'),
  ext('checkDuplicate')
);
router.get('/drafts', checkPermission('employees', 'create'), ext('listDrafts'));
router.post(
  '/drafts',
  requireSetupComplete,
  checkPermission('employees', 'create'),
  ext('createDraft')
);
router.get('/drafts/:draftId', checkPermission('employees', 'create'), ext('getDraft'));
router.put(
  '/drafts/:draftId/step/:step',
  requireSetupComplete,
  checkPermission('employees', 'create'),
  ext('saveDraftStep')
);
router.post(
  '/drafts/:draftId/complete',
  requireSetupComplete,
  checkPermission('employees', 'create'),
  ext('completeDraft')
);

router.get('/update-requests', checkPermission('employees', 'edit'), reqCtrl.listPending);
router.post(
  '/update-requests/:requestId/approve',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  reqCtrl.approve
);
router.post(
  '/update-requests/:requestId/reject',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  reqCtrl.reject
);

router.post(
  '/bulk-import',
  requireSetupComplete,
  checkPermission('employees', 'create'),
  ctrl.bulkImport
);
router.get('/bulk-import/template', checkPermission('employees', 'view'), ctrl.downloadTemplate);
router.get('/export.csv', checkPermission('employees', 'view'), ctrl.downloadExportCsv);

router.get('/deleted', checkPermission('employees', 'view'), ctrl.listDeleted);

router.get('/meta/departments',  checkPermission('employees', 'view'), ctrl.getDepartments);
router.get('/meta/designations', checkPermission('employees', 'view'), ctrl.getDesignations);
router.get('/meta/branches',     checkPermission('employees', 'view'), ctrl.getBranches);
router.get('/meta/managers',     checkPermission('employees', 'view'), ctrl.getManagers);

router.get('/', checkPermission('employees', 'view'), ctrl.list);
router.post(
  '/',
  requireSetupComplete,
  checkPermission('employees', 'create'),
  ctrl.create
);

router.get('/:id',    checkPermission('employees', 'view'),   ctrl.getOne);
router.put(
  '/:id',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ctrl.update
);
router.delete(
  '/:id',
  requireSetupComplete,
  checkPermission('employees', 'delete'),
  ctrl.softDelete
);
router.get('/:id/unmask', checkPermission('employees', 'view'), ctrl.unmask);

router.post(
  '/:id/restore',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ctrl.restore
);

router.put(
  '/:id/photo',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  (req, res, next) =>
    photoUpload.single('photo')(req, res, (err) => {
      if (err) return sendError(res, 'VALIDATION', err.message || 'File upload failed.', 400);
      next();
    }),
  ctrl.uploadPhoto
);

router.post('/:id/update-request', reqCtrl.submit);

router.get('/:id/bank', checkPermission('employees', 'view'), ctrl.getBankAccounts);
router.post(
  '/:id/bank',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ctrl.addBankAccount
);
router.put(
  '/:id/bank/:bid',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ctrl.updateBankAccount
);
router.delete(
  '/:id/bank/:bid',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ctrl.deleteBankAccount
);

router.get('/:id/documents', checkPermission('employees', 'view'), ctrl.getDocuments);
router.post(
  '/:id/documents',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ctrl.addDocument
);
router.delete(
  '/:id/documents/:did',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ctrl.deleteDocument
);

router.post(
  '/:id/create-login',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ctrl.createLogin
);
router.put(
  '/:id/toggle-login',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ctrl.toggleLogin
);

router.get('/:id/addresses/:type', checkPermission('employees', 'view'), ext('getAddresses'));
router.put(
  '/:id/addresses/:type',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ext('upsertAddress')
);
router.post(
  '/:id/addresses/copy-local',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ext('copyLocalAddress')
);

router.get('/:id/education', checkPermission('employees', 'view'), ext('listEducation'));
router.post(
  '/:id/education/bulk',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ext('bulkReplaceEducation')
);
router.post(
  '/:id/education',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ext('createEducation')
);
router.put(
  '/:id/education/:eid',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ext('updateEducation')
);
router.delete(
  '/:id/education/:eid',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ext('deleteEducation')
);

router.get('/:id/family/nominee-check', checkPermission('employees', 'view'), ext('checkNomineeTotal'));
router.get('/:id/family', checkPermission('employees', 'view'), ext('listFamily'));
router.post(
  '/:id/family/bulk',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ext('bulkReplaceFamily')
);
router.post(
  '/:id/family',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ext('createFamilyMember')
);
router.put(
  '/:id/family/:mid',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ext('updateFamilyMember')
);
router.delete(
  '/:id/family/:mid',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ext('deleteFamilyMember')
);

router.get('/:id/prev-employment', checkPermission('employees', 'view'), ext('listPrevEmployment'));
router.post(
  '/:id/prev-employment/bulk',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ext('bulkReplacePrevEmployment')
);
router.post(
  '/:id/prev-employment',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ext('createPrevEmployment')
);
router.put(
  '/:id/prev-employment/:pid',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ext('updatePrevEmployment')
);
router.delete(
  '/:id/prev-employment/:pid',
  requireSetupComplete,
  checkPermission('employees', 'edit'),
  ext('deletePrevEmployment')
);

module.exports = router;

