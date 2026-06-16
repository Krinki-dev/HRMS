const router = require('express').Router();
const multer = require('multer');
const auth = require('../../shared/middleware/auth');
const perm = require('../../shared/middleware/permission');
const ctrl = require('./expenses.controller');

const upload = multer({ storage: multer.memoryStorage() });

router.use(auth);   
const can = (a) => perm.checkPermission('expenses', a);

router.get ('/claims',             can('view'),   ctrl.listClaims);
router.post('/claims',             can('create'), ctrl.createClaim);
router.get ('/claims/pending',     can('edit'),   ctrl.pendingApprovals);
router.get ('/claims/:id',         can('view'),   ctrl.getClaim);
router.put ('/claims/:id/approve', can('edit'),   ctrl.approveClaim);
router.put ('/claims/:id/reject',  can('edit'),   ctrl.rejectClaim);
router.delete('/claims/:id',       can('delete'), ctrl.deleteClaim);

router.post('/upload', upload.single('file'), ctrl.uploadReceipt);

router.get ('/policies',       can('view'),   ctrl.listPolicies);
router.post('/policies',       can('create'), ctrl.createPolicy);
router.put ('/policies/:id',   can('edit'),   ctrl.updatePolicy);

module.exports = router;

