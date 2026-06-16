/**
 * @file recruitment.routes.js
 * @description Routes for recruitment module including requisitions, jobs, candidates, and interviews.
 */
const router = require('express').Router();
const auth   = require('../../shared/middleware/auth');
const perm   = require('../../shared/middleware/permission');
const ctrl   = require('./recruitment.controller');

router.use(auth);
const can = (action) => perm.checkPermission('recruitment', action);

router.get ('/requisitions',             can('view'),   ctrl.listRequisitions);
router.get ('/requisitions/:id',         can('view'),   ctrl.getRequisition);
router.post('/requisitions',             can('create'), ctrl.createRequisition);
router.put ('/requisitions/:id',         can('edit'),   ctrl.updateRequisition);
router.put ('/requisitions/:id/approve', can('edit'),   ctrl.approveRequisition);
router.put ('/requisitions/:id/reject',  can('edit'),   ctrl.rejectRequisition);
router.delete('/requisitions/:id',       can('delete'), ctrl.deleteRequisition);

router.get ('/jobs',                     can('view'),   ctrl.listJobs);
router.get ('/jobs/:id',                 can('view'),   ctrl.getJob);
router.post('/jobs/post',                can('create'), ctrl.postJob);
router.put ('/jobs/:id/close',           can('edit'),   ctrl.closeJob);

router.get ('/candidates',               can('view'),   ctrl.listCandidates);
router.get ('/candidates/:id',           can('view'),   ctrl.getCandidate);
router.post('/candidates',               can('create'), ctrl.addCandidate);
router.put ('/candidates/:id',           can('edit'),   ctrl.updateCandidate);
router.put ('/candidates/:id/stage',     can('edit'),   ctrl.moveStage);
router.post('/candidates/:id/convert',   can('create'), ctrl.convertToEmployee);
router.delete('/candidates/:id',         can('delete'), ctrl.deleteCandidate);

router.get ('/interviews',               can('view'),   ctrl.listInterviews);
router.get ('/interviews/:id',           can('view'),   ctrl.getInterview);
router.post('/interviews',               can('create'), ctrl.scheduleInterview);
router.put ('/interviews/:id',           can('edit'),   ctrl.updateInterview);
router.put ('/interviews/:id/cancel',    can('edit'),   ctrl.cancelInterview);
router.post('/interviews/:id/feedback',  auth,          ctrl.submitFeedback);

router.post('/offers',                   can('create'), ctrl.createOffer);
router.put ('/offers/:id/accept',        can('edit'),   ctrl.acceptOffer);
router.put ('/offers/:id/decline',       can('edit'),   ctrl.declineOffer);

router.get ('/dashboard',                can('view'),   ctrl.dashboard);

module.exports = router;

