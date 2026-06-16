﻿'use strict';

const nodemailer   = require('nodemailer');
const logger       = require('./logger');
const { decrypt }  = require('./encryption');

const transporterCache = {};

function getCacheKey(cfg) {
  return `${cfg.host}:${cfg.port}:${cfg.user}`;
}

function getTransporter(smtpConfig) {
  const key = getCacheKey(smtpConfig);
  if (transporterCache[key]) return transporterCache[key];

  const transporter = nodemailer.createTransport({
    host:   smtpConfig.host,
    port:   smtpConfig.port,
    secure: smtpConfig.secure,
    auth:   smtpConfig.user ? {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    } : undefined,
    tls: { rejectUnauthorized: false },
  });

  transporterCache[key] = transporter;
  return transporter;
}

async function getSmtpConfig(db, companyId) {
  
  if (db && companyId) {
    try {
      const config = await db.notification_config.findUnique({
        where: { company_id: companyId },
      });
      if (config && config.email_host && config.email_user && config.email_verified) {
        return {
          host:   config.email_host,
          port:   config.email_port  || 587,
          secure: config.email_ssl   || false,
          user:   config.email_user,
          pass:   config.email_pass_enc ? tryDecrypt(config.email_pass_enc) : '',
          from:   config.email_from  || `"${process.env.PRODUCT_NAME}" <${config.email_user}>`,
        };
      }
    } catch {
      
    }
  }

  return {
    host:   process.env.SMTP_HOST   || '',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user:   process.env.SMTP_USER   || '',
    pass:   process.env.SMTP_PASS   || '',
    from:   process.env.SMTP_FROM   || `"${process.env.PRODUCT_NAME || 'Syntern HRMS'}" <noreply@syntern.in>`,
  };
}

function tryDecrypt(val) {
  try { return decrypt(val); } catch { return val; }
}

async function send(db, companyId, { to, subject, html, attachments = [] }) {
  const smtp = await getSmtpConfig(db, companyId);

  if (!smtp.host || !smtp.user) {
    logger.warn(`[EmailService] No SMTP configured — logging email instead`);
    logger.info(`  To:      ${to}`);
    logger.info(`  Subject: ${subject}`);
    return { skipped: true, reason: 'smtp_not_configured' };
  }

  const transporter = getTransporter(smtp);
  const info = await transporter.sendMail({ from: smtp.from, to, subject, html, attachments });
  logger.info(`[EmailService] ✓ Sent "${subject}" → ${to} (${info.messageId})`);
  return { success: true, messageId: info.messageId };
}

function baseTemplate(content, accentColor = '#1E40AF') {
  const product = process.env.PRODUCT_NAME || 'Syntern HRMS';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body{margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#F9FAFB;color:#111827}
  .wrapper{max-width:600px;margin:24px auto;background:#fff;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden}
  .header{background:${accentColor};padding:28px 32px}
  .header h1{margin:0;color:#fff;font-size:20px;font-weight:600}
  .header p{margin:4px 0 0;color:rgba(255,255,255,.8);font-size:13px}
  .body{padding:28px 32px}
  .body p{margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151}
  .btn{display:inline-block;background:${accentColor};color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;margin:8px 0}
  .highlight{background:#EFF6FF;border-left:4px solid ${accentColor};padding:12px 16px;border-radius:4px;font-size:14px;margin:16px 0}
  .highlight code{font-family:monospace;font-size:18px;font-weight:700;color:${accentColor};letter-spacing:4px}
  .info-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px}
  .info-row:last-child{border-bottom:none}
  .info-label{color:#6B7280}
  .info-value{color:#111827;font-weight:500}
  .footer{padding:16px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;font-size:12px;color:#9CA3AF;text-align:center}
</style>
</head>
<body>
<div class="wrapper">
  ${content}
  <div class="footer">
    This email was sent by ${product} · syntern.in<br>
    Please do not reply to this email.
  </div>
</div>
</body>
</html>`;
}

const emailService = {

  async testConnection(smtpConfig) {
    try {
      const transporter = getTransporter(smtpConfig);
      await transporter.verify();
      
      const key = getCacheKey(smtpConfig);
      delete transporterCache[key];
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async sendWelcome(db, companyId, { name, email, tempPassword, loginUrl }) {
    const product = process.env.PRODUCT_NAME || 'Syntern HRMS';
    const url = loginUrl || `https://${process.env.PRODUCT_DOMAIN || 'syntern.in'}/login`;
    const html = baseTemplate(`
      <div class="header">
        <h1>${product}</h1>
        <p>Your account is ready</p>
      </div>
      <div class="body">
        <p>Hi <strong>${name}</strong>,</p>
        <p>Welcome! Your HRMS account has been created. Use the credentials below to log in.</p>
        <div class="highlight">
          <div style="margin-bottom:8px">Email: <strong>${email}</strong></div>
          <div>Temporary password: <code>${tempPassword}</code></div>
        </div>
        <p>You will be prompted to set a new password on first login.</p>
        <a href="${url}" class="btn">Login now →</a>
        <p style="margin-top:20px;font-size:12px;color:#9CA3AF">
          If you did not expect this email, please contact your HR department.
        </p>
      </div>`);
    return send(db, companyId, {
      to: email,
      subject: `Welcome to ${product} — your account is ready`,
      html,
    });
  },

  async sendOTP(db, companyId, { email, otp, purpose = 'login', expiryMinutes = 10 }) {
    const labels = {
      login:   'Login verification',
      aadhaar: 'Aadhaar KYC verification',
      reset:   'Password reset',
      verify:  'Email verification',
    };
    const label = labels[purpose] || 'Verification';
    const html = baseTemplate(`
      <div class="header">
        <h1>${label}</h1>
        <p>${process.env.PRODUCT_NAME || 'Syntern HRMS'}</p>
      </div>
      <div class="body">
        <p>Your one-time password for <strong>${label.toLowerCase()}</strong>:</p>
        <div class="highlight" style="text-align:center">
          <code>${otp}</code>
        </div>
        <p>Expires in <strong>${expiryMinutes} minutes</strong>. Do not share it with anyone.</p>
        <p style="font-size:12px;color:#9CA3AF">
          If you did not request this OTP, please ignore this email and contact your administrator.
        </p>
      </div>`);
    return send(db, companyId, {
      to: email,
      subject: `${otp} — OTP for ${label}`,
      html,
    });
  },

  async sendPasswordReset(db, companyId, { email, name, resetLink }) {
    const html = baseTemplate(`
      <div class="header">
        <h1>Password reset request</h1>
        <p>${process.env.PRODUCT_NAME || 'Syntern HRMS'}</p>
      </div>
      <div class="body">
        <p>Hi <strong>${name || email}</strong>,</p>
        <p>We received a request to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetLink}" class="btn">Reset password</a>
        <p style="word-break:break-all;font-size:12px;color:#6B7280;margin-top:12px">
          Or copy: ${resetLink}
        </p>
        <p style="font-size:12px;color:#9CA3AF;margin-top:16px">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>`);
    return send(db, companyId, {
      to: email,
      subject: 'Reset your password — action required',
      html,
    });
  },

  async sendPayslip(db, companyId, { email, name, pdfBuffer, month, year, netSalary }) {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const label = `${monthNames[(month || 1) - 1]} ${year}`;
    const net   = netSalary ? `₹${netSalary.toLocaleString('en-IN')}` : '';
    const html  = baseTemplate(`
        <h1>Payslip for ${label}</h1>
        <p>${process.env.PRODUCT_NAME || 'Syntern HRMS'}</p>
      </div>
      <div class="body">
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your payslip for <strong>${label}</strong> is attached.${net ? ` Net salary: <strong>${net}</strong>.` : ''}</p>
        <p>You can also view it in your portal under <strong>Payroll → My Payslips</strong>.</p>
        <p style="font-size:12px;color:#9CA3AF">System-generated — do not reply to this email.</p>
      </div>`);
    const attachments = pdfBuffer ? [{
      filename:    `Payslip_${label.replace(' ', '_')}.pdf`,
      content:     pdfBuffer,
      contentType: 'application/pdf',
    }] : [];
    return send(db, companyId, {
      to: email,
      subject: `Payslip for ${label}`,
      html,
      attachments,
    });
  },

  async sendLeaveUpdate(db, companyId, { email, name, status, leaveType, fromDate, toDate, days, rejectionReason }) {
    const colorMap = { approved: '#16A34A', rejected: '#DC2626', cancelled: '#6B7280' };
    const color    = colorMap[status] || '#1E40AF';
    const label    = status.charAt(0).toUpperCase() + status.slice(1);
    const fmt      = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const html = baseTemplate(`
      <div class="header" style="background:${color}">
        <h1>Leave ${label}</h1>
        <p>${process.env.PRODUCT_NAME || 'Syntern HRMS'}</p>
      </div>
      <div class="body">
        <p>Hi <strong>${name}</strong>, your leave application has been <strong>${label.toLowerCase()}</strong>.</p>
        <div style="border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:16px 0">
          <div class="info-row"><span class="info-label">Leave type</span><span class="info-value">${leaveType}</span></div>
          <div class="info-row"><span class="info-label">From</span><span class="info-value">${fmt(fromDate)}</span></div>
          <div class="info-row"><span class="info-label">To</span><span class="info-value">${fmt(toDate)}</span></div>
          <div class="info-row"><span class="info-label">Days</span><span class="info-value">${days}</span></div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value" style="color:${color};font-weight:600">${label}</span>
          </div>
          ${rejectionReason ? `<div class="info-row"><span class="info-label">Reason</span><span class="info-value">${rejectionReason}</span></div>` : ''}
        </div>
      </div>`, color);
    return send(db, companyId, {
      to: email,
      subject: `Leave ${label} — ${leaveType} (${days} day${days !== 1 ? 's' : ''})`,
      html,
    });
  },

  async sendBackupNotification(db, companyId, { email, status, provider, sizeBytes, duration, error }) {
    const ok    = status === 'success';
    const color = ok ? '#16A34A' : '#DC2626';
    const size  = sizeBytes ? `${(sizeBytes / 1024 / 1024).toFixed(2)} MB` : 'N/A';
    const time  = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const html  = baseTemplate(`
      <div class="header" style="background:${color}">
        <h1>Database backup ${ok ? 'completed' : 'failed'}</h1>
        <p>${process.env.PRODUCT_NAME || 'Syntern HRMS'}</p>
      </div>
      <div class="body">
        <p>Your scheduled database backup has ${ok ? 'completed successfully.' : '<strong>failed</strong>.'}</p>
        <div style="border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:16px 0">
          <div class="info-row"><span class="info-label">Provider</span><span class="info-value">${provider}</span></div>
          <div class="info-row"><span class="info-label">Time</span><span class="info-value">${time} IST</span></div>
          ${ok ? `<div class="info-row"><span class="info-label">Size</span><span class="info-value">${size}</span></div>` : ''}
          ${ok ? `<div class="info-row"><span class="info-label">Duration</span><span class="info-value">${duration}s</span></div>` : ''}
          ${!ok && error ? `<div class="info-row"><span class="info-label">Error</span><span class="info-value" style="color:#DC2626">${error}</span></div>` : ''}
        </div>
        ${!ok ? '<p>Check your backup settings in <strong>Settings → Backup</strong> and retry.</p>' : ''}
      </div>`, color);
    return send(db, companyId, {
      to: email,
      subject: `DB Backup ${ok ? '✓ success' : '✗ failed'} — ${new Date().toLocaleDateString('en-IN')}`,
      html,
    });
  },

  async sendCustom(db, companyId, { to, subject, html, attachments }) {
    return send(db, companyId, { to, subject, html, attachments });
  },

};

module.exports = emailService;
