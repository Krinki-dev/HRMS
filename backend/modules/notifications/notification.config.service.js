'use strict';

const nodemailer = require('nodemailer');
const { encrypt, decrypt } = require('../../shared/utils/encryption');
const logger = require('../../shared/utils/logger');
const { THEME } = require('../../shared/utils/uiConstants');

function tryDecrypt(val) {
  if (!val) return null;
  try { return decrypt(val); } catch { return null; }
}

/**
 * Service to handle notification configurations (SMTP, SMS, WhatsApp)
 */
const notificationConfigService = {
  async getConfig(db, companyId) {
    const cfg = await db.notification_config.findFirst({
      where: { company_id: companyId },
    });

    if (!cfg) return null;

    return {
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
    };
  },

  async saveConfig(db, companyId, data) {
    const existing = await db.notification_config.findFirst({
      where: { company_id: companyId },
    });

    const payload = {
      email_provider:  data.emailProvider || 'smtp',
      email_host:      data.emailHost     || null,
      email_port:      data.emailPort     ? Number(data.emailPort) : 587,
      email_user:      data.emailUser     || null,
      email_from:      data.emailFrom     || null,
      email_ssl:       !!data.emailSsl,
      email_verified:  false, 
      sms_provider:    data.smsProvider   || 'none',
      sms_sender_id:   data.smsSenderId   || null,
      wa_provider:     data.waProvider    || 'none',
      wa_phone_id:     data.waPhoneId     || null,
      updated_at:      new Date(),
    };

    if (data.emailPass) payload.email_pass_enc = encrypt(data.emailPass);
    if (data.smsApiKey) payload.sms_api_key_enc = encrypt(data.smsApiKey);
    if (data.waApiKey)  payload.wa_api_key_enc  = encrypt(data.waApiKey);

    if (existing) {
      return await db.notification_config.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      return await db.notification_config.create({
        data: { ...payload, company_id: companyId },
      });
    }
  },

  async sendTestEmail(db, companyId, toEmail) {
    const cfg = await db.notification_config.findFirst({ where: { company_id: companyId } });
    if (!cfg || !cfg.email_host || !cfg.email_user) {
      throw new Error('SMTP is not configured. Fill in host, port, username and password first.');
    }

    const pass = cfg.email_pass_enc ? tryDecrypt(cfg.email_pass_enc) : '';
    const transporter = nodemailer.createTransport({
      host: cfg.email_host,
      port: cfg.email_port || 587,
      secure: cfg.email_ssl || false,
      auth: cfg.email_user ? { user: cfg.email_user, pass } : undefined,
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();
    await transporter.sendMail({
      from: cfg.email_from || cfg.email_user,
      to: toEmail,
      subject: `✅ Email configuration verified — Syntern HRMS`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#1E40AF">Email configuration is working!</h2>
          <p>This test email confirms that your SMTP settings are correctly configured.</p>
          <p style="font-size:12px;color:#9CA3AF">Syntern HRMS · syntern.in</p>
        </div>
      `,
    });

    await db.notification_config.update({
      where: { id: cfg.id },
      data: { email_verified: true, updated_at: new Date() },
    });

    logger.info(`${THEME.ICONS.SUCCESS} [NotifConfig] Test email sent to ${toEmail}`);
    return toEmail;
  }
};

module.exports = notificationConfigService;