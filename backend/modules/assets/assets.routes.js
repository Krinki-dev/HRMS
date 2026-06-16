const router = require('express').Router();
const auth   = require('../../shared/middleware/auth');
const perm   = require('../../shared/middleware/permission');
const ctrl   = require('./assets.controller');

router.use(auth);
const can = (a) => perm.checkPermission('assets', a);

router.get ('/assets',                    can('view'),   ctrl.list);
router.post('/assets',                    can('create'), ctrl.create);
router.get ('/assets/:id',                can('view'),   ctrl.get);
router.put ('/assets/:id',                can('edit'),   ctrl.update);
router.delete('/assets/:id',              can('delete'), ctrl.remove);
router.post('/assets/:id/allocate',       can('edit'),   ctrl.allocate);
router.put ('/assets/:id/return',         can('edit'),   ctrl.returnAsset);
router.get ('/assets/employee/:empId',    can('view'),   ctrl.byEmployee);
router.get ('/dashboard',                 can('view'),   ctrl.dashboard);

module.exports = router;

