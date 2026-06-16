const router = require('express').Router();
const auth   = require('../../shared/middleware/auth');
const perm   = require('../../shared/middleware/permission');
const ctrl   = require('./roles.controller');

router.use(auth);
const can = (a) => perm.checkPermission('settings', a);

router.get   ('/',          can('view'),   ctrl.list);
router.post  ('/',          can('create'), ctrl.create);
router.put   ('/:id',       can('edit'),   ctrl.update);
router.delete('/:id',       can('delete'), ctrl.remove);

router.put('/assign/:userId', can('edit'), ctrl.assignRole);

module.exports = router;

