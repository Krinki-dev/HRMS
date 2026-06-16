const express = require('express');
const router  = express.Router();

const auth    = require('../../../shared/middleware/auth');
const { sendSuccess, sendError, ERROR_CODES } = require('../../../shared/utils/response');

router.use(auth);

const safeJson = s => { try { return JSON.parse(s); } catch { return s; } };

function fmtTask(t, full = false) {
  return {
    id:           t.id,
    taskType:     t.task_type,
    status:       t.status,
    reviewData:   t.status === 'review_required' && t.result_data ? safeJson(t.result_data) : undefined,
    startedAt:    t.started_at,
    completedAt:  t.completed_at,
    errorMessage: t.error_message,
    captchaImage: full ? (t.captcha_image || null) : undefined,
    resultData:   t.result_data ? safeJson(t.result_data) : null,
    retryCount:   t.retry_count,
    logs: (t.logs || []).map(l => ({
      step:        l.step_number,
      description: l.step_description,
      status:      l.status,
      error:       l.error,
      timestamp:   l.timestamp,
    })),
  };
}

router.get('/tasks', async (req, res) => {
  try {
    const { status } = req.query;
    const where = { company_id: req.user.tenantId };
    if (status) where.status = status;

    const tasks = await req.db.automation_tasks.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take:    100,
      include: { logs: { orderBy: { step_number: 'asc' } } },
    });

    return sendSuccess(res, tasks.map(t => fmtTask(t, false)));
  } catch (e) {
    console.error('[Management/tasks]', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message, 500);
  }
});

router.get('/task/:taskId', async (req, res) => {
  try {
    const task = await req.db.automation_tasks.findFirst({
      where:   { id: req.params.taskId, company_id: req.user.tenantId },
      include: { logs: { orderBy: { step_number: 'asc' } } },
    });
    if (!task) return sendError(res, ERROR_CODES.NOT_FOUND, 'Task not found', 404);
    return sendSuccess(res, fmtTask(task, true));
  } catch (e) {
    console.error('[Management/task]', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message, 500);
  }
});

router.post('/task/:taskId/captcha', async (req, res) => {
  try {
    const { captcha } = req.body;
    if (!captcha?.trim())
      return sendError(res, ERROR_CODES.VALIDATION, 'captcha required', 400);

    const task = await req.db.automation_tasks.findFirst({
      where: { id: req.params.taskId, company_id: req.user.tenantId },
    });
    if (!task) return sendError(res, ERROR_CODES.NOT_FOUND, 'Task not found', 404);
    if (task.status !== 'captcha_required')
      return sendError(res, ERROR_CODES.VALIDATION,
        `Status is "${task.status}", expected "captcha_required"`, 400);

    await req.db.automation_tasks.update({
      where: { id: req.params.taskId },
      data:  { input_data: JSON.stringify({ captcha: captcha.trim() }) },
    });
    return sendSuccess(res, null, 'Captcha submitted');
  } catch (e) {
    console.error('[Management/captcha]', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message, 500);
  }
});

router.post('/task/:taskId/otp', async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp?.trim() || !/^\d{6}$/.test(otp.trim()))
      return sendError(res, ERROR_CODES.VALIDATION, 'OTP must be 6 digits', 400);

    const task = await req.db.automation_tasks.findFirst({
      where: { id: req.params.taskId, company_id: req.user.tenantId },
    });
    if (!task) return sendError(res, ERROR_CODES.NOT_FOUND, 'Task not found', 404);
    if (task.status !== 'otp_required')
      return sendError(res, ERROR_CODES.VALIDATION,
        `Status is "${task.status}", expected "otp_required"`, 400);

    await req.db.automation_tasks.update({
      where: { id: req.params.taskId },
      data:  { input_data: JSON.stringify({ otp: otp.trim() }) },
    });
    return sendSuccess(res, null, 'OTP submitted');
  } catch (e) {
    console.error('[Management/otp]', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message, 500);
  }
});

router.post('/task/:taskId/confirm', async (req, res) => {
  try {
    const { confirm, mobile, email } = req.body;
    if (confirm !== 'YES')
      return sendError(res, ERROR_CODES.VALIDATION, 'confirm must be "YES"', 400);
    if (!mobile || !email)
      return sendError(res, ERROR_CODES.VALIDATION, 'Mobile and email required', 400);

    const task = await req.db.automation_tasks.findFirst({
      where: { id: req.params.taskId, company_id: req.user.tenantId },
    });
    if (!task) return sendError(res, ERROR_CODES.NOT_FOUND, 'Task not found', 404);
    if (task.status !== 'review_required')
      return sendError(res, ERROR_CODES.VALIDATION,
        `Status is "${task.status}", expected "review_required"`, 400);

    const { encrypt } = require('../../../shared/utils/encryption');

    await req.db.automation_tasks.update({
      where: { id: req.params.taskId },
      data: {
        input_data: JSON.stringify({
          confirm:        'YES',
          mobile:         encrypt(mobile),
          email:          encrypt(email),
        }),
        status: 'running',
      },
    });
    return sendSuccess(res, null, 'Confirmed — saving to central database');
  } catch (e) {
    console.error('[Management/confirm]', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message, 500);
  }
});

router.post('/task/:taskId/cancel', async (req, res) => {
  try {
    await req.db.automation_tasks.update({
      where: { id: req.params.taskId },
      data:  { status: 'cancelled', completed_at: new Date() },
    });
    return sendSuccess(res, null, 'Task cancelled');
  } catch (e) {
    console.error('[Management/cancel]', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message, 500);
  }
});

router.post('/task/:taskId/refresh-captcha', async (req, res) => {
  try {
    const task = await req.db.automation_tasks.findFirst({
      where: { id: req.params.taskId, company_id: req.user.tenantId },
    });
    if (!task) return sendError(res, ERROR_CODES.NOT_FOUND, 'Task not found', 404);
    if (task.status !== 'captcha_required')
      return sendError(res, ERROR_CODES.VALIDATION,
        `Status is "${task.status}", expected "captcha_required"`, 400);

    await req.db.automation_tasks.update({
      where: { id: req.params.taskId },
      data:  { input_data: JSON.stringify({ refreshCaptcha: true }) },
    });
    return sendSuccess(res, null, 'Refresh requested — new captcha image will appear shortly');
  } catch (e) {
    console.error('[Management/refresh-captcha]', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message, 500);
  }
});

module.exports = router;

