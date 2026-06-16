const router = require('express').Router();
const auth   = require('../../shared/middleware/auth');
const perm   = require('../../shared/middleware/permission');
const ctrl   = require('./compliance.controller');

router.use(auth);

const can = (action) => perm.checkPermission('compliance', action);

router.get('/dashboard',                    can('view'),   ctrl.dashboard);
router.get('/calendar',                     can('view'),   ctrl.calendar);

router.get ('/pf',                          can('view'),   ctrl.pfSummary);
router.post('/pf/ecr',                      can('create'), ctrl.generateECR);
router.get ('/pf/missing-uan',              can('view'),   ctrl.missingUAN);
router.put ('/pf/uan',                      can('edit'),   ctrl.updateUAN);

router.get ('/esi',                         can('view'),   ctrl.esiSummary);
router.post('/esi/challan',                 can('create'), ctrl.generateESIChallan);

router.get ('/pt',                          can('view'),   ctrl.ptSummary);
router.get ('/pt/slabs',                    can('view'),   ctrl.ptSlabs);
router.post('/pt/challan',                  can('create'), ctrl.generatePTChallan);

router.get ('/tds',                         can('view'),   ctrl.tdsSummary);
router.get ('/tds/declaration',             auth,          ctrl.getMyDeclaration);     
router.post('/tds/declaration',             auth,          ctrl.saveDeclaration);
router.post('/tds/form16',                  can('create'), ctrl.generateForm16);

router.get ('/lwf',                         can('view'),   ctrl.lwfSummary);
router.get ('/lwf/rules',                   can('view'),   ctrl.lwfRules);
router.post('/lwf/return',                  can('create'), ctrl.generateLWFReturn);

router.get ('/filings',                     can('view'),   ctrl.listFilings);
router.put ('/filings/:id/mark-filed',      can('edit'),   ctrl.markFiled);
router.post('/filings/ensure',              can('create'), ctrl.ensureFilings); 

module.exports = router;

