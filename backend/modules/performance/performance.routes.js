const router = require('express').Router();
const auth   = require('../../shared/middleware/auth');
const perm   = require('../../shared/middleware/permission');
const ctrl   = require('./performance.controller');

router.use(auth);
const can = (a) => perm.checkPermission('performance', a);

router.get ('/cycles',              can('view'),   ctrl.listCycles);
router.post('/cycles',              can('create'), ctrl.createCycle);
router.put ('/cycles/:id',          can('edit'),   ctrl.updateCycle);
router.put ('/cycles/:id/activate', can('edit'),   ctrl.activateCycle);
router.put ('/cycles/:id/close',    can('edit'),   ctrl.closeCycle);

router.get ('/goals',               auth,          ctrl.listMyGoals);
router.get ('/goals/team',          can('view'),   ctrl.listTeamGoals);
router.post('/goals',               auth,          ctrl.createGoal);
router.put ('/goals/:id',           auth,          ctrl.updateGoal);
router.put ('/goals/:id/approve',   can('edit'),   ctrl.approveGoal);
router.delete('/goals/:id',         auth,          ctrl.deleteGoal);

router.get ('/appraisals/my',       auth,          ctrl.getMyAppraisal);
router.get ('/appraisals/team',     can('view'),   ctrl.getTeamAppraisals);
router.post('/appraisals/self',     auth,          ctrl.submitSelfAppraisal);
router.post('/appraisals/manager',  can('edit'),   ctrl.submitManagerAppraisal);
router.put ('/appraisals/:id/finalize', can('edit'), ctrl.finalizeAppraisal);

router.get ('/dashboard',           can('view'),   ctrl.dashboard);

module.exports = router;

