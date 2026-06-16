const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const router   = express.Router();

const { enqueue }        = require('./automation.queue');
const { encrypt }        = require('../../shared/utils/encryption');
const {
  findKycByHash,
  findKycById,
  createKycRecord,
  upsertKycRecord,
  linkKycToEmployee,
  verifyHash,
  hashAadhaar,
} = require('../../shared/utils/centralDb');

const auth    = require('../../shared/middleware/auth');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');

router.use(auth);

const HR = ['super_admin','admin','hr_admin','hr','Super Admin','Admin','HR'];

const uploadDir = path.join(__dirname, '../../../uploads/kyc_temp');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const multerStore = multer.diskStorage({
  destination: (_q, _f, cb) => cb(null, uploadDir),
  filename:    (_q,  f, cb) => {
    const ext  = path.extname(f.originalname).toLowerCase();
    const name = Date.now() + '_' + require('crypto').randomBytes(6).toString('hex') + ext;
    cb(null, name);
  },
});
const upload = multer({
  storage:    multerStore,
  limits:     { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_q, f, cb) => {
    const ok = ['.zip','.xml','.jpg','.jpeg','.png'].includes(
      path.extname(f.originalname).toLowerCase()
    );
    cb(null, ok);
  },
});

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
      step: l.step_number, description: l.step_description,
      status: l.status, error: l.error, timestamp: l.timestamp,
    })),
  };
}
const safeJson = s => { try { return JSON.parse(s); } catch { return s; } };

function encodePhoto(base64Data) {
  if (!base64Data) return null;
  if (String(base64Data).startsWith('data:')) return base64Data;
  return `data:image/jpeg;base64,${base64Data}`;
}

async function audit(db, companyId, userId, action, meta, ip) {
  try {
    const scrubbed = { ...meta };
    const sensitiveKeys = ['aadhaarNumber', 'panNumber', 'otp', 'captcha', 'mobile', 'email'];
    sensitiveKeys.forEach(key => {
      if (scrubbed[key]) scrubbed[key] = '***';
    });
    await db.audit_logs.create({
      data: {
        company_id:  companyId, user_id: userId,
        module: 'automation', action,
        record_type: 'kyc',
        new_values:  JSON.stringify(scrubbed),
        ip_address:  ip,
      },
    });
  } catch {  }
}

router.post('/kyc/check-duplicate', async (req, res) => {
  if (!HR.includes(req.user.role))
    return sendError(res, ERROR_CODES.FORBIDDEN, 'HR only', 403);
  try {
    const { aadhaarNumber } = req.body;
    const clean = (aadhaarNumber || '').replace(/\s/g, '');
    if (!/^\d{12}$/.test(clean))
      return sendError(res, ERROR_CODES.VALIDATION, 'Aadhaar must be 12 digits', 400);

    const existing = await findKycByHash(hashAadhaar(clean));
    if (existing) {
      return sendSuccess(res, {
        isDuplicate:  true,
        kycId:        existing.id,
        method:       existing.method,
        createdAt:    existing.created_at,
        hasEmployee:  !!existing.employee_id,
      });
    }
    return sendSuccess(res, { isDuplicate: false });
  } catch (e) {
    return sendError(res, ERROR_CODES.SERVER, e.message, 500);
  }
});

router.get('/kyc/:kycId', async (req, res) => {
  if (!HR.includes(req.user.role))
    return sendError(res, ERROR_CODES.FORBIDDEN, 'HR only', 403);
  try {
    const rec = await findKycById(req.params.kycId);
    if (!rec)
      return sendError(res, ERROR_CODES.NOT_FOUND, 'KYC record not found', 404);

    const { decrypt } = require('../../shared/utils/encryption');
    const d = (f) => f ? decrypt(f) : null;
    const house   = d(rec.house);
    const street  = d(rec.street);
    const loc     = d(rec.loc);
    const vtc     = d(rec.vtc);
    const address = [house, street, loc, vtc].filter(Boolean).join(', ') || null;

    const safe = {
      id:           rec.id,
      method:       rec.method,
      createdAt:    rec.created_at,
      kycTimestamp: rec.kyc_timestamp,
      photo:        rec.pht,
      name:     d(rec.name),
      dob:      d(rec.dob),
      gender:   d(rec.gender),
      careof:   d(rec.careof),
      mobile:   d(rec.mobile_encrypted),
      email:    d(rec.email_encrypted),
      address, house, street, loc, vtc,
      po:       d(rec.po),
      subdist:  d(rec.subdist),
      dist:     d(rec.dist),
      state:    d(rec.state),
      country:  rec.country || 'India',
      pc:       d(rec.pc),
      fullName:    d(rec.name),
      dateOfBirth: (() => {
        const raw = d(rec.dob);
        if (!raw) return null;
        const p = raw.split('-');
        return p.length === 3 ? p[2]+'-'+p[1]+'-'+p[0] : raw;
      })(),
      fatherName:  (() => {
        const co = d(rec.careof);
        if (!co) return null;
        const m = co.match(/(?:S\/O|D\/O|C\/O|W\/O)[:\s]+(.+)/i);
        return m ? m[1].trim() : null;
      })(),
      phone:       d(rec.mobile_encrypted),
      personalEmail: d(rec.email_encrypted),
      city:    d(rec.vtc),
      pincode: d(rec.pc),
      district: d(rec.dist),
    };

    await audit(req.db, req.user.tenantId, req.user.id, 'kyc_record_accessed',
      { kycId: rec.id, method: rec.method }, req.ip);

    return sendSuccess(res, safe);
  } catch (e) {
    return sendError(res, ERROR_CODES.SERVER, e.message, 500);
  }
});

router.post('/kyc/:kycId/verify-contact', async (req, res) => {
  try {
    const { mobile, email } = req.body;
    const rec = await findKycById(req.params.kycId);
    if (!rec) return sendError(res, ERROR_CODES.NOT_FOUND, 'KYC not found', 404);
    const mobileVerified = mobile ? verifyHash(mobile, rec.m) : null;
    const emailVerified  = email  ? verifyHash(email,  rec.e) : null;
    return sendSuccess(res, {
      mobileVerified, emailVerified,
      hasMobileHash: !!rec.mobile_hash,
      hasEmailHash:  !!rec.email_hash,
    });
  } catch (e) {
    return sendError(res, ERROR_CODES.SERVER, e.message, 500);
  }
});

router.post('/kyc/:kycId/link', async (req, res) => {
  if (!HR.includes(req.user.role))
    return sendError(res, ERROR_CODES.FORBIDDEN, 'HR only', 403);
  try {
    const { employeeId } = req.body;
    if (!employeeId)
      return sendError(res, ERROR_CODES.VALIDATION, 'employeeId required', 400);
    const rec = await findKycById(req.params.kycId);
    if (!rec) return sendError(res, ERROR_CODES.NOT_FOUND, 'KYC record not found', 404);
    await linkKycToEmployee(rec.id, employeeId);
    await audit(req.db, req.user.tenantId, req.user.id, 'kyc_linked_to_employee',
      { kycId: rec.id, employeeId }, req.ip);
    return sendSuccess(res, null, 'KYC linked to employee');
  } catch (e) {
    return sendError(res, ERROR_CODES.SERVER, e.message, 500);
  }
});

router.post('/kyc/start-otp', async (req, res) => {
  if (!HR.includes(req.user.role))
    return sendError(res, ERROR_CODES.FORBIDDEN, 'HR only', 403);
  try {
    const { aadhaarNumber, mode = 'direct' } = req.body;
    const clean = (aadhaarNumber || '').replace(/\s/g, '');
    if (!/^\d{12}$/.test(clean))
      return sendError(res, ERROR_CODES.VALIDATION, 'Aadhaar must be 12 digits', 400);

    const companyId = req.user.tenantId;

    const running = await req.db.automation_tasks.findFirst({
      where: {
        company_id: companyId,
        task_type:  'aadhaar_kyc',
        status:     { in: ['running','captcha_required','otp_required'] },
      },
    });
    if (running)
      return sendSuccess(res, { taskId: running.id, alreadyRunning: true },
        'Verification already in progress');

    const task = await req.db.automation_tasks.create({
      data: {
        company_id:   companyId,
        task_type:    'aadhaar_kyc',
        status:       'running',
        triggered_by: req.user.id,
        input_data:   JSON.stringify({ mode }),
      },
    });

    const dbUrl = req.db._datasources?.db?.url || process.env.DEV_TENANT_DATABASE_URL;

    await enqueue('aadhaar_kyc', task.id, {
      aadhaarNumber: clean,
      companyId,
      mode,
      createdBy: req.user.id,
      dbUrl, 
    });

    await audit(req.db, companyId, req.user.id, 'kyc_otp_started',
      { mode, aadhaarHash: hashAadhaar(clean), taskId: task.id }, req.ip);

    return sendSuccess(res, { taskId: task.id, mode }, 'KYC started');
  } catch (e) {
    return sendError(res, ERROR_CODES.SERVER, e.message, 500);
  }
});

router.post('/kyc/upload-xml',
  (req, res, next) => upload.single('kycFile')(req, res, err => {
    if (err) return sendError(res, 'UPLOAD_ERROR', err.message, 400);
    next();
  }),
  async (req, res) => {
    if (!HR.includes(req.user.role))
      return sendError(res, ERROR_CODES.FORBIDDEN, 'HR only', 403);
    if (!req.file)
      return sendError(res, ERROR_CODES.VALIDATION, 'No file uploaded', 400);

    try {
      const { shareCode: userCode, mode = 'direct', aadhaarNumber = '' } = req.body;
      const cleanAadhaar = (aadhaarNumber || '').replace(/\s/g, '');
      const companyId = req.user.tenantId;
      const now       = new Date();
      const shareCode = userCode?.trim() ||
        String(now.getDate()).padStart(2,'0') + String(now.getMonth()+1).padStart(2,'0');

      const AdmZip = require('adm-zip');
      const { parseKycXml } = require('./kyc/kyc.worker');
      const ext = path.extname(req.file.originalname).toLowerCase();
      let xmlContent;

      if (ext === '.xml') {
        xmlContent = fs.readFileSync(req.file.path, 'utf-8');
      } else if (ext === '.zip') {
        const zip   = new AdmZip(req.file.path);
        const entry = zip.getEntries().find(e => e.name.toLowerCase().endsWith('.xml'))
                   || zip.getEntries()[0];
        if (!entry)
          return sendError(res, ERROR_CODES.VALIDATION, 'No XML inside ZIP', 400);
        const buf = zip.readFile(entry, shareCode);
        if (!buf)
          return sendError(res, ERROR_CODES.VALIDATION,
            `Cannot decrypt ZIP — share code "${shareCode}" may be wrong`, 400);
        xmlContent = buf.toString('utf-8');
      } else {
        return sendError(res, ERROR_CODES.VALIDATION, 'File must be .zip or .xml', 400);
      }

      const kycData = parseKycXml(xmlContent, cleanAadhaar);
      const photoUrl = encodePhoto(kycData.photoBase64);
      const aadhaarHash = kycData.aadhaarHash || hashAadhaar(kycData.uid || '');

      await audit(req.db, companyId, req.user.id, 'kyc_xml_parsed',
        { method: 'xml_upload', mode, aadhaarHash }, req.ip);

      try { fs.unlinkSync(req.file.path); } catch {}

      return sendSuccess(res, {
        requiresReview: true,
        kycData: {
          ...kycData,
          photoBase64:  undefined,
          photoDataUrl: undefined,
          photo:        photoUrl,
          hasMobileHash:  !!kycData.m,
          hasEmailHash:   !!kycData.e,
          shareCode,
          aadhaarDigit9:    req.body.aadhaarDigit9 || '',
          aadhaarLastDigit: req.body.aadhaarLastDigit || '',
        },
        aadhaarHash,
        method: 'xml_upload',
        mode,
      });
    } catch (e) {
      try { fs.unlinkSync(req.file?.path); } catch {}
      return sendError(res, ERROR_CODES.SERVER, e.message, 500);
    }
  }
);

router.post('/kyc/save-after-review', async (req, res) => {
  if (!HR.includes(req.user.role))
    return sendError(res, ERROR_CODES.FORBIDDEN, 'HR only', 403);
  try {
    const { kycData, aadhaarHash, method = 'xml_upload', mode = 'direct' } = req.body;
    if (!kycData || !aadhaarHash)
      return sendError(res, ERROR_CODES.VALIDATION, 'kycData and aadhaarHash required', 400);
    const { encrypt } = require('../../shared/utils/encryption');
    const kycRec = await upsertKycRecord(aadhaarHash, {
      method,
      kycTimestamp: kycData.kycTimestamp || null,
      name:    kycData.name    ? encrypt(kycData.name)    : null,
      dob:     kycData.dob     ? encrypt(kycData.dob)     : null,
      gender:  kycData.gender  ? encrypt(kycData.gender)  : null,
      careof:  kycData.careof  ? encrypt(kycData.careof)  : null,
      mobile_encrypted: kycData.mobile_encrypted || null,
      email_encrypted:  kycData.email_encrypted  || null,
      house:   kycData.house   ? encrypt(kycData.house)   : null,
      street:  kycData.street  ? encrypt(kycData.street)  : null,
      loc:     kycData.loc     ? encrypt(kycData.loc)     : null,
      vtc:     kycData.vtc     ? encrypt(kycData.vtc)     : null,
      po:      kycData.po      ? encrypt(kycData.po)      : null,
      subdist: kycData.subdist ? encrypt(kycData.subdist) : null,
      dist:    kycData.dist    ? encrypt(kycData.dist)    : null,
      state:   kycData.state   ? encrypt(kycData.state)   : null,
      country: kycData.country || 'India',
      pc:      kycData.pc      ? encrypt(kycData.pc)      : null,
      pht:     kycData.photo    || kycData.photoUrl || null,
      taskId:  null,
    });
    await audit(req.db, req.user.tenantId, req.user.id, `kyc_${method}_confirmed`,
      { kycId: kycRec?.id, method, mode }, req.ip);
    return sendSuccess(res, { kycId: kycRec?.id, mode }, 'KYC saved to central database');
  } catch (e) { return sendError(res, ERROR_CODES.SERVER, e.message, 500); }
});

router.get('/tasks', async (req, res) => {
  try {
    const { status } = req.query;
    const where = { company_id: req.user.tenantId };
    if (status) where.status = status;
    const tasks = await req.db.automation_tasks.findMany({
      where, orderBy: { created_at: 'desc' }, take: 100,
      include: { logs: { orderBy: { step_number: 'asc' } } },
    });
    return sendSuccess(res, tasks.map(t => fmtTask(t, false)));
  } catch (e) { return sendError(res, ERROR_CODES.SERVER, e.message, 500); }
});

router.get('/task/:taskId', async (req, res) => {
  try {
    const task = await req.db.automation_tasks.findFirst({
      where: { id: req.params.taskId, company_id: req.user.tenantId },
      include: { logs: { orderBy: { step_number: 'asc' } } },
    });
    if (!task) return sendError(res, ERROR_CODES.NOT_FOUND, 'Task not found', 404);
    return sendSuccess(res, fmtTask(task, true));
  } catch (e) { return sendError(res, ERROR_CODES.SERVER, e.message, 500); }
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
  } catch (e) { return sendError(res, ERROR_CODES.SERVER, e.message, 500); }
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
  } catch (e) { return sendError(res, ERROR_CODES.SERVER, e.message, 500); }
});

router.post('/task/:taskId/confirm', async (req, res) => {
  try {
    const { confirm, mobile, email } = req.body;
    if (confirm !== 'YES') return sendError(res, ERROR_CODES.VALIDATION, 'confirm must be "YES"', 400);
    if (!mobile || !email) return sendError(res, ERROR_CODES.VALIDATION, 'Mobile and email required', 400);
    
    const task = await req.db.automation_tasks.findFirst({
      where: { id: req.params.taskId, company_id: req.user.tenantId },
    });
    if (!task) return sendError(res, ERROR_CODES.NOT_FOUND, 'Task not found', 404);
    if (task.status !== 'review_required') return sendError(res, ERROR_CODES.VALIDATION, `Status is "${task.status}", expected "review_required"`, 400);
    
    const { encrypt } = require('../../shared/utils/encryption');
    const encryptedMobile = encrypt(mobile);
    const encryptedEmail = encrypt(email);
    
    await req.db.automation_tasks.update({
      where: { id: req.params.taskId },
      data: { 
        input_data: JSON.stringify({ confirm: 'YES', mobile: encryptedMobile, email: encryptedEmail }),
        status: 'running'
      },
    });
    return sendSuccess(res, null, 'Confirmed – saving to central database');
  } catch (e) { return sendError(res, ERROR_CODES.SERVER, e.message, 500); }
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
  } catch (e) { return sendError(res, ERROR_CODES.SERVER, e.message, 500); }
});

router.post('/task/:taskId/cancel', async (req, res) => {
  try {
    await req.db.automation_tasks.update({
      where: { id: req.params.taskId },
      data:  { status: 'cancelled', completed_at: new Date() },
    });
    return sendSuccess(res, null, 'Task cancelled');
  } catch (e) { return sendError(res, ERROR_CODES.SERVER, e.message, 500); }
});

module.exports = router;

