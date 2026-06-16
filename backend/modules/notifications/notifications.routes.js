'use strict';

const express    = require('express');
const router     = express.Router();
const nodemailer = require('nodemailer');
const auth       = require('../../shared/middleware/auth');
const { checkPermission } = require('../../shared/middleware/permission');
const { encrypt, decrypt } = require('../../shared/utils/encryption');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');

const can = (action) => checkPermission('settings', action);

function tryDecrypt(val) {
  if (!val) return null;
  try { return decrypt(val); } catch { return null; }
}

router.get('/notifications', auth, can('view'), async (req, res) => {
  try {
    const db = req.db;
    const cfg = await db.notification_config.findFirst({
      where: { company_id: req.user.tenantId },
    });

    if (!cfg) {
      return sendSuccess(res, { config: null });
    }

    return sendSuccess(res, {
      config: {
        emailProvider: cfg.email_provider,
        emailHost:     cfg.email_host    || '',
        emailPort:     cfg.email_port    || 587,
        emailUser:     cfg.email_user    || '',
        emailFrom:     cfg.email_from    || '',
        emailSsl:      cfg.email_ssl     || false,
        emailVerified: cfg.email_verified || false,
        hasEmailPass:  !!cfg.email_pass_enc,
        smsProvider:   cfg.sms_provider  || 'none',
        smsSenderId:   cfg.sms_sender_id || '',
        hasSmsKey:     !!cfg.sms_api_key_enc,
        waProvider:    cfg.wa_provider   || 'none',
        waPhoneId:     cfg.wa_phone_id   || '',
        hasWaKey:      !!cfg.wa_api_key_enc,
      },
    });
  } catch (err) {
    console.error('[Notifications/get]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to load notification config', 500);
  }
});

router.put('/notifications', auth, can('edit'), async (req, res) => {
  try {
    const db        = req.db;
    const companyId = req.user.tenantId;

    const {
      emailProvider = 'smtp',
      emailHost, emailPort = 587, emailUser, emailPass,
      emailFrom, emailSsl = false,
      smsProvider = 'none', smsApiKey, smsSenderId,
      waProvider = 'none', waApiKey, waPhoneId,
    } = req.body;

    const data = {
      email_provider:  emailProvider,
      email_host:      emailHost   || null,
      email_port:      emailPort   ? Number(emailPort) : 587,
      email_user:      emailUser   || null,
      email_from:      emailFrom   || null,
      email_ssl:       !!emailSsl,
      email_verified:  false, 
      sms_provider:    smsProvider || 'none',
      sms_sender_id:   smsSenderId || null,
      wa_provider:     waProvider  || 'none',
      wa_phone_id:     waPhoneId   || null,
      updated_at:      new Date(),
    };

    if (emailPass)  data.email_pass_enc   = encrypt(emailPass);
    if (smsApiKey)  data.sms_api_key_enc  = encrypt(smsApiKey);
    if (waApiKey)   data.wa_api_key_enc   = encrypt(waApiKey);

    const existing = await db.notification_config.findFirst({
      where: { company_id: companyId },
    });

    if (existing) {
      await db.notification_config.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await db.notification_config.create({
        data: { ...data, company_id: companyId },
      });
    }

    return sendSuccess(res, null, 'Notification settings saved');
  } catch (err) {
    console.error('[Notifications/put]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to save notification config', 500);
  }
});

// Alias: frontend calls /notifications/test, backend originally used /notifications/test-email
router.post('/notifications/test', auth, can('edit'), async (req, res, next) => {
  // Normalise body so both {to} (frontend) and {toEmail} (legacy) work
  req.body.toEmail = req.body.toEmail || req.body.to;
  next();
}, testEmailHandler);

router.post('/notifications/test-email', auth, can('edit'), (req, res, next) => {
  req.body.toEmail = req.body.toEmail || req.body.to;
  next();
}, testEmailHandler);

async function testEmailHandler(req, res) {
  try {
    const db        = req.db;
    const companyId = req.user.tenantId;
    const toEmail   = req.body.toEmail || req.user.email;

    if (!toEmail) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Provide a recipient email address', 400);
    }

    const cfg = await db.notification_config.findFirst({
      where: { company_id: companyId },
    });

    if (!cfg || !cfg.email_host || !cfg.email_user) {
      return sendError(res, ERROR_CODES.VALIDATION,
        'SMTP is not configured. Fill in host, port, username and password first.', 400);
    }

    const pass = cfg.email_pass_enc ? tryDecrypt(cfg.email_pass_enc) : '';

    const transporter = nodemailer.createTransport({
      host:   cfg.email_host,
      port:   cfg.email_port || 587,
      secure: cfg.email_ssl  || false,
      auth:   cfg.email_user ? { user: cfg.email_user, pass } : undefined,
      tls:    { rejectUnauthorized: false },
    });

    await transporter.verify();

    await transporter.sendMail({
      from:    cfg.email_from || cfg.email_user,
      to:      toEmail,
      subject: `✅ Email configuration verified — Syntern HRMS`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#1E40AF">Email configuration is working!</h2>
          <p>This test email confirms that your SMTP settings are correctly configured in Syntern HRMS.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            <tr><td style="padding:6px 0;color:#6B7280;font-size:13px">SMTP host</td><td style="font-size:13px">${cfg.email_host}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280;font-size:13px">Port</td><td style="font-size:13px">${cfg.email_port || 587}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280;font-size:13px">From</td><td style="font-size:13px">${cfg.email_from || cfg.email_user}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280;font-size:13px">Tested at</td><td style="font-size:13px">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td></tr>
          </table>
          <p style="font-size:12px;color:#9CA3AF">Syntern HRMS · syntern.in</p>
        </div>
      `,
    });

    await db.notification_config.update({
      where: { id: cfg.id },
      data:  { email_verified: true, updated_at: new Date() },
    });

    return sendSuccess(res, { sentTo: toEmail }, `Test email sent to ${toEmail}`);
  } catch (err) {
    console.error('[Notifications/test-email]', err);
    return sendError(res, ERROR_CODES.SERVER,
      `SMTP test failed: ${err.message}`, 500);
  }
}

router.post('/notifications/test-sms', auth, can('edit'), async (req, res) => {
  try {
    const db        = req.db;
    const companyId = req.user.tenantId;
    const { toPhone } = req.body;

    if (!toPhone) {
      return sendError(res, ERROR_CODES.VALIDATION, 'Provide a recipient phone number', 400);
    }

    const cfg = await db.notification_config.findFirst({
      where: { company_id: companyId },
    });

    if (!cfg || cfg.sms_provider === 'none' || !cfg.sms_api_key_enc) {
      return sendError(res, ERROR_CODES.VALIDATION, 'SMS not configured', 400);
    }

    const apiKey   = tryDecrypt(cfg.sms_api_key_enc);
    const provider = cfg.sms_provider;
    const senderId = cfg.sms_sender_id || 'SYNTRN';
    const message  = `Syntern HRMS: SMS configuration test successful. Time: ${new Date().toLocaleTimeString('en-IN')}`;

    let result;

    if (provider === 'fast2sms') {
      const axios = require('axios');
      const resp  = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
        route: 'q', numbers: toPhone, message, flash: 0,
      }, {
        headers: { authorization: apiKey, 'Content-Type': 'application/json' },
      });
      result = resp.data;
    } else if (provider === 'msg91') {
      const axios = require('axios');
      const resp  = await axios.post('https://api.msg91.com/api/v5/flow/', {
        template_id: 'test',
        sender:      senderId,
        short_url:   '0',
        mobiles:     `91${toPhone}`,
        VAR1:        message,
      }, {
        headers: { authkey: apiKey, 'Content-Type': 'application/json' },
      });
      result = resp.data;
    } else {
      return sendError(res, ERROR_CODES.VALIDATION, `Unsupported SMS provider: ${provider}`, 400);
    }

    return sendSuccess(res, { sentTo: toPhone, providerResponse: result }, 'Test SMS sent');
  } catch (err) {
    console.error('[Notifications/test-sms]', err);
    return sendError(res, ERROR_CODES.SERVER, `SMS test failed: ${err.message}`, 500);
  }
});
module.exports = router;