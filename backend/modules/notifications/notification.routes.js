﻿﻿﻿'use strict';

const express    = require('express');
const router     = express.Router();
const auth       = require('../../shared/middleware/auth');
const { checkPermission } = require('../../shared/middleware/permission');
const { encrypt, decrypt } = require('../../shared/utils/encryption');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const configService = require('./notification.config.service');

const can = (action) => checkPermission('settings', action);

router.get('/notifications', auth, can('view'), async (req, res) => {
  try {
    const config = await configService.getConfig(req.db, req.user.tenantId);
    return sendSuccess(res, { config });
  } catch (err) {
    console.error('[Notifications/get]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to load notification config', 500);
  }
});

router.put('/notifications', auth, can('edit'), async (req, res) => {
  try {
    await configService.saveConfig(req.db, req.user.tenantId, req.body);
    return sendSuccess(res, null, 'Notification settings saved');
  } catch (err) {
    console.error('[Notifications/put]', err);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to save notification config', 500);
  }
});

// Alias: frontend calls /notifications/test, backend originally used /notifications/test-email
router.post('/notifications/test', auth, can('edit'), async (req, res, next) => {
  // Normalize body so both {to} (new frontend) and {toEmail} (legacy) work
  req.body.toEmail = req.body.toEmail || req.body.to;
  next();
}, testEmailHandler);

router.post('/notifications/test-email', auth, can('edit'), (req, res, next) => {
  req.body.toEmail = req.body.toEmail || req.body.to;
  next();
}, testEmailHandler);

async function testEmailHandler(req, res) {
  try {
    const toEmail   = req.body.toEmail || req.user.email;
    const result = await configService.sendTestEmail(req.db, req.user.tenantId, toEmail);
    return sendSuccess(res, { sentTo: result }, `Test email sent to ${result}`);
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

router.post('/notifications/test-whatsapp', auth, can('edit'), async (req, res) => {
  // Placeholder for future WhatsApp integration (Twilio/WATI)
  return sendError(res, ERROR_CODES.SERVER, 'WhatsApp test not yet implemented', 501);
});

function tryDecrypt(val) {
  if (!val) return null;
  try { return decrypt(val); } catch { return null; }
}

module.exports = router;
