const express  = require('express');
const router   = express.Router();
const auth     = require('../../shared/middleware/auth');
const requireSetupComplete = require('../../shared/middleware/requireSetupComplete');
const { checkPermission }  = require('../../shared/middleware/permission');
const c        = require('./payroll.controller');

router.use(auth);

router.get('/my-payslips', async (req, res) => {
  try {
    const empId = req.user?.employeeId;
    if (!empId) {
      return res.status(400).json({ success: false, message: 'No employee linked to this account' });
    }

    const payslips = await req.db.payslips.findMany({
      where: {
        employee_id:  empId,
        is_published: true,
        deleted_at:   null,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 24,
      include: {
        payroll_run: {
          select: { month: true, year: true, status: true },
        },
      },
    });

    return res.json({
      success: true,
      data: payslips.map(p => ({
        id:               p.id,
        month:            p.month,
        year:             p.year,
        workingDays:      p.working_days,
        presentDays:      p.present_days,
        lopDays:          p.lop_days,
        paidDays:         p.paid_days,
        basic:            p.basic,
        hra:              p.hra,
        da:               p.da,
        ta:               p.ta,
        specialAllowance: p.special_allowance,
        otherEarnings:    p.other_earnings,
        gross:            p.gross,
        pfEmployee:       p.pf_employee,
        esiEmployee:      p.esi_employee,
        pt:               p.pt,
        tds:              p.tds,
        lwfEmployee:      p.lwf_employee,
        otherDeductions:  p.other_deductions,
        totalDeductions:  p.total_deductions,
        netSalary:        p.net_salary,
        pfEmployer:       p.pf_employer,
        esiEmployer:      p.esi_employer,
        isPublished:      p.is_published,
      })),
    });
  } catch (err) {
    console.error('[my-payslips]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch payslips' });
  }
});

router.get('/my-payslips/:month/:year', async (req, res) => {
  try {
    const empId = req.user?.employeeId;
    if (!empId) return res.status(400).json({ success: false, message: 'No employee linked' });

    const payslip = await req.db.payslips.findFirst({
      where: {
        employee_id:  empId,
        month:        Number(req.params.month),
        year:         Number(req.params.year),
        is_published: true,
        deleted_at:   null,
      },
    });

    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found' });
    return res.json({ success: true, data: payslip });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payslip' });
  }
});

router.get('/dashboard', checkPermission('payroll', 'view'), c.dashboard);

router.get('/runs',                     checkPermission('payroll', 'view'),   c.listRuns);
router.post(
  '/runs',
  requireSetupComplete,
  checkPermission('payroll', 'create'),
  c.createRun
);
router.get('/runs/:runId',              checkPermission('payroll', 'view'),   c.getRun);
router.post(
  '/runs/:runId/process',
  requireSetupComplete,
  checkPermission('payroll', 'create'),
  c.processRun
);
router.post(
  '/runs/:runId/lock',
  requireSetupComplete,
  checkPermission('payroll', 'create'),
  c.lockRun
);
router.post(
  '/runs/:runId/publish',
  requireSetupComplete,
  checkPermission('payroll', 'create'),
  c.publishRun
);
router.delete(
  '/runs/:runId',
  requireSetupComplete,
  checkPermission('payroll', 'delete'),
  c.deleteRun
);

router.get('/runs/:runId/payslips',          checkPermission('payroll', 'view'),   c.listPayslips);
router.get('/runs/:runId/payslips/:empId',   checkPermission('payroll', 'view'),   c.getPayslip);
router.put(
  '/runs/:runId/payslips/:empId',
  requireSetupComplete,
  checkPermission('payroll', 'edit'),
  c.updatePayslip
);

router.post(
  '/runs/:runId/bonuses',
  requireSetupComplete,
  checkPermission('payroll', 'create'),
  c.addBonus
);
router.delete(
  '/runs/:runId/bonuses/:id',
  requireSetupComplete,
  checkPermission('payroll', 'delete'),
  c.removeBonus
);

router.get('/salary-structures',     checkPermission('payroll', 'view'),   c.listSalaryStructures);
router.post(
  '/salary-structures',
  requireSetupComplete,
  checkPermission('payroll', 'create'),
  c.createSalaryStructure
);
router.put(
  '/salary-structures/:id',
  requireSetupComplete,
  checkPermission('payroll', 'edit'),
  c.updateSalaryStructure
);
router.delete(
  '/salary-structures/:id',
  requireSetupComplete,
  checkPermission('payroll', 'delete'),
  c.deleteSalaryStructure
);

router.get('/employee-salaries/:empId', checkPermission('payroll', 'view'),   c.getEmployeeSalary);
router.post(
  '/employee-salaries',
  requireSetupComplete,
  checkPermission('payroll', 'create'),
  c.setEmployeeSalary
);

router.get('/reports/monthly',       checkPermission('payroll', 'view'), c.monthlyReport);
router.get('/reports/bank-transfer', checkPermission('payroll', 'view'), c.bankTransferReport);
router.get('/reports/pf-statement',  checkPermission('payroll', 'view'), c.pfStatement);
router.get('/reports/esi-statement', checkPermission('payroll', 'view'), c.esiStatement);

module.exports = router;

