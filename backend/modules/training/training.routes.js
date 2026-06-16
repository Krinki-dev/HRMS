const router = require('express').Router();
const auth   = require('../../shared/middleware/auth');
const perm   = require('../../shared/middleware/permission');
const ctrl   = require('./training.controller');

router.use(auth);
const can = (a) => perm.checkPermission('training', a);

router.get ('/trainings',                      can('view'),   ctrl.list);
router.post('/trainings',                      can('create'), ctrl.create);
router.get ('/trainings/:id',                  can('view'),   ctrl.get);
router.put ('/trainings/:id',                  can('edit'),   ctrl.update);
router.delete('/trainings/:id',                can('delete'), ctrl.remove);

router.get ('/trainings/:id/nominations',      can('view'),   ctrl.listNominations);
router.post('/trainings/:id/nominate',         can('edit'),   ctrl.nominate);
router.delete('/trainings/:id/nominations/:empId', can('edit'), ctrl.removeNomination);

router.post('/trainings/:id/attendance',       can('edit'),   ctrl.markAttendance);
router.post('/trainings/:id/feedback',         auth,          ctrl.submitFeedback);
router.get ('/my-trainings',                   auth,          ctrl.myTrainings);

module.exports = router;

