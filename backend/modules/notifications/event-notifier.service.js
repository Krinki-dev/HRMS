'use strict';

const axios = require('axios');
const logger = require('../../shared/utils/logger');
const emailService = require('../../shared/utils/emailService');
const wsNotifications = require('./notifications.service');
const { decrypt } = require('../../shared/utils/encryption');

function tryDecrypt(val) {
  if (!val) return null;
  try { return decrypt(val); } catch { return null; }
}

function uniq(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
}

async function getNotificationConfig(db, companyId) {
  if (!db || !companyId) return null;
  try {
    return await db.notification_config.findFirst({ where: { company_id: companyId } });
  } catch {
    return null;
  }
}

async function sendSmsFromConfig(cfg, toPhone, text) {
  if (!cfg || cfg.sms_provider === 'none' || !cfg.sms_api_key_enc) {
    return { skipped: true, reason: 'sms_not_configured' };
  }

  const apiKey = tryDecrypt(cfg.sms_api_key_enc);
  if (!apiKey) return { skipped: true, reason: 'sms_key_unavailable' };

  const provider = cfg.sms_provider;
  const senderId = cfg.sms_sender_id || 'SYNTRN';
  const number = normalizePhone(toPhone);
  if (!number) return { skipped: true, reason: 'invalid_phone' };

  if (provider === 'fast2sms') {
    await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'q',
      numbers: number,
      message: text,
      flash: 0,
    }, {
      headers: { authorization: apiKey, 'Content-Type': 'application/json' },
    });
    return { success: true };
  }

  if (provider === 'msg91') {
    await axios.post('https://api.msg91.com/api/v5/flow/', {
      template_id: 'test',
      sender: senderId,
      short_url: '0',
      mobiles: `91${number}`,
      VAR1: text,
    }, {
      headers: { authkey: apiKey, 'Content-Type': 'application/json' },
    });
    return { success: true };
  }

  return { skipped: true, reason: `unsupported_provider:${provider}` };
}

async function getStakeholderUsers(db, companyId) {
  if (!db || !companyId) return [];
  const rows = await db.users.findMany({
    where: { company_id: companyId, is_active: true, deleted_at: null },
    include: { role: true, employee: true },
  });

  const allowedRoles = new Set(['super admin', 'super_admin', 'admin', 'hr admin', 'hr_admin', 'hr', 'manager']);
  return rows.filter((u) => allowedRoles.has((u.role?.name || '').toLowerCase()));
}

async function dispatch({
  db,
  companyId,
  title,
  body,
  link,
  priority = 'normal',
  emailSubject,
  emailHtml,
  smsText,
  recipients = [],
  inAppUserIds = [],
}) {
  const emailTargets = uniq(recipients.map((r) => r.email));
  const smsTargets = uniq(recipients.map((r) => normalizePhone(r.phone)));
  const userTargets = uniq(inAppUserIds);

  if (userTargets.length) {
    try {
      await wsNotifications.create(db, companyId, {
        userIds: userTargets,
        type: 'info',
        title,
        body,
        link,
        priority,
      });
    } catch (err) {
      logger.warn('[EventNotifier] In-app notification failed', { error: err.message, title });
    }
  }

  await Promise.all(emailTargets.map(async (to) => {
    try {
      await emailService.sendCustom(db, companyId, {
        to,
        subject: emailSubject || title,
        html: emailHtml || `<p>${body}</p>`,
      });
    } catch (err) {
      logger.warn('[EventNotifier] Email dispatch failed', { error: err.message, to, title });
    }
  }));

  const cfg = await getNotificationConfig(db, companyId);
  await Promise.all(smsTargets.map(async (toPhone) => {
    try {
      await sendSmsFromConfig(cfg, toPhone, smsText || body);
    } catch (err) {
      logger.warn('[EventNotifier] SMS dispatch failed', { error: err.message, toPhone, title });
    }
  }));
}

const eventNotifier = {
  async notifyLogin({ db, companyId, user, ipAddress }) {
    if (!user?.email) return;
    const when = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const title = 'New sign-in detected';
    const body = `A new sign-in was detected for your account on ${when} IST.`;
    const html = `<p>Hello ${user.employee?.first_name || user.email},</p><p>${body}</p><p>IP: ${ipAddress || 'unknown'}</p>`;

    await dispatch({
      db,
      companyId,
      title,
      body,
      priority: 'normal',
      emailSubject: 'Security alert: New login to your account',
      emailHtml: html,
      smsText: `Syntern HRMS: New login detected at ${when} IST. If this wasn't you, change password now.`,
      recipients: [{ email: user.email, phone: user.phone }],
      inAppUserIds: [user.id],
    });
  },

  async notifyEmployeeCreated({ db, companyId, employee, actorLabel }) {
    if (!employee) return;
    const stakeholders = await getStakeholderUsers(db, companyId);
    const recipients = [
      { email: employee.workEmail || employee.personalEmail, phone: employee.phone },
      ...stakeholders.map((u) => ({ email: u.email, phone: u.phone })),
    ];

    const title = 'Employee onboarding created';
    const body = `${employee.fullName} (${employee.employeeCode}) was added by ${actorLabel || 'system'}.`;
    await dispatch({
      db,
      companyId,
      title,
      body,
      link: '/employees',
      emailSubject: `Onboarding update: ${employee.fullName} added`,
      smsText: `HRMS: ${employee.fullName} (${employee.employeeCode}) added to employee records.`,
      recipients,
      inAppUserIds: stakeholders.map((u) => u.id),
    });
  },

  async notifyEmployeeUpdated({ db, companyId, employee, actorLabel }) {
    if (!employee) return;
    const stakeholders = await getStakeholderUsers(db, companyId);
    const recipients = [
      { email: employee.workEmail || employee.personalEmail, phone: employee.phone },
      ...stakeholders.map((u) => ({ email: u.email, phone: u.phone })),
    ];

    const title = 'Employee profile updated';
    const body = `${employee.fullName} (${employee.employeeCode}) profile was updated by ${actorLabel || 'system'}.`;
    await dispatch({
      db,
      companyId,
      title,
      body,
      link: '/employees',
      emailSubject: `Employee record updated: ${employee.fullName}`,
      smsText: `HRMS: Employee profile updated for ${employee.fullName}.`,
      recipients,
      inAppUserIds: stakeholders.map((u) => u.id),
    });
  },

  async notifyEmployeeLoginProvisioned({ db, companyId, employeeId, loginEmail, actorLabel }) {
    if (!employeeId) return;
    const employee = await db.employees.findFirst({
      where: { id: employeeId, company_id: companyId, deleted_at: null },
      include: { user: true },
    });
    const stakeholders = await getStakeholderUsers(db, companyId);
    const recipients = [
      { email: loginEmail || employee?.work_email || employee?.personal_email, phone: employee?.phone },
      ...stakeholders.map((u) => ({ email: u.email, phone: u.phone })),
    ];

    const empName = `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim() || 'Employee';
    const title = 'Employee login created';
    const body = `Login access was created for ${empName} by ${actorLabel || 'system'}.`;
    await dispatch({
      db,
      companyId,
      title,
      body,
      link: '/employees',
      emailSubject: `Access granted: ${empName}`,
      smsText: `HRMS: Login access enabled for ${empName}.`,
      recipients,
      inAppUserIds: uniq([employee?.user?.id, ...stakeholders.map((u) => u.id)]),
    });
  },

  async notifyEmployeeLoginToggled({ db, companyId, employeeId, isActive, actorLabel }) {
    if (!employeeId) return;
    const employee = await db.employees.findFirst({
      where: { id: employeeId, company_id: companyId, deleted_at: null },
      include: { user: true },
    });
    const stakeholders = await getStakeholderUsers(db, companyId);
    const recipients = [
      { email: employee?.user?.email || employee?.work_email || employee?.personal_email, phone: employee?.phone },
      ...stakeholders.map((u) => ({ email: u.email, phone: u.phone })),
    ];

    const empName = `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim() || 'Employee';
    const action = isActive ? 'enabled' : 'disabled';
    const title = `Employee login ${action}`;
    const body = `Login access for ${empName} was ${action} by ${actorLabel || 'system'}.`;
    await dispatch({
      db,
      companyId,
      title,
      body,
      link: '/employees',
      emailSubject: `Access ${action}: ${empName}`,
      smsText: `HRMS: Login access ${action} for ${empName}.`,
      recipients,
      inAppUserIds: uniq([employee?.user?.id, ...stakeholders.map((u) => u.id)]),
    });
  },

  async notifyRoleChanged({ db, companyId, roleName, actorLabel, action = 'updated' }) {
    const stakeholders = await getStakeholderUsers(db, companyId);
    const title = `Role ${action}`;
    const body = `Role ${roleName || 'Unknown role'} was ${action} by ${actorLabel || 'system'}.`;
    await dispatch({
      db,
      companyId,
      title,
      body,
      link: '/settings/roles',
      emailSubject: `Role policy ${action}: ${roleName || 'Role'}`,
      smsText: `HRMS: Role ${roleName || 'Role'} ${action}.`,
      recipients: stakeholders.map((u) => ({ email: u.email, phone: u.phone })),
      inAppUserIds: stakeholders.map((u) => u.id),
    });
  },

  async notifyRoleAssigned({ db, companyId, userId, roleId, actorLabel }) {
    const [user, role, stakeholders] = await Promise.all([
      db.users.findFirst({ where: { id: userId, company_id: companyId, deleted_at: null }, include: { employee: true } }),
      db.roles.findFirst({ where: { id: roleId, deleted_at: null } }),
      getStakeholderUsers(db, companyId),
    ]);

    if (!user) return;
    const userName = `${user.employee?.first_name || ''} ${user.employee?.last_name || ''}`.trim() || user.email;
    const roleName = role?.name || 'Role';
    const title = 'Role assignment updated';
    const body = `${userName} was assigned role ${roleName} by ${actorLabel || 'system'}.`;

    await dispatch({
      db,
      companyId,
      title,
      body,
      link: '/settings/roles',
      emailSubject: `Role assigned: ${roleName}`,
      smsText: `HRMS: ${userName} assigned role ${roleName}.`,
      recipients: [{ email: user.email, phone: user.phone }, ...stakeholders.map((u) => ({ email: u.email, phone: u.phone }))],
      inAppUserIds: uniq([user.id, ...stakeholders.map((u) => u.id)]),
    });
  },

  async notifyPasswordChanged({ db, companyId, userId }) {
    if (!userId) return;
    const user = await db.users.findFirst({
      where: { id: userId, company_id: companyId, is_active: true, deleted_at: null },
      include: { employee: true },
    });
    if (!user?.email) return;
    const userName = `${user.employee?.first_name || ''} ${user.employee?.last_name || ''}`.trim() || user.email;
    const title = 'Password changed successfully';
    const body = 'Your account password has been changed. If this was not you, contact support immediately.';

    await dispatch({
      db,
      companyId,
      title,
      body,
      emailSubject: 'Password changed on your HRMS account',
      emailHtml: `<p>Hello ${userName},</p><p>${body}</p>`,
      smsText: 'Syntern HRMS: Your password was changed. If this was not you, reset password immediately.',
      recipients: [{ email: user.email, phone: user.phone }],
      inAppUserIds: [user.id],
    });
  },

  async notifyEmployeeUpdateRequestDecision({ db, companyId, requestId, decision, reason }) {
    if (!requestId) return;
    const request = await db.audit_logs.findFirst({
      where: { id: requestId, company_id: companyId },
    });
    if (!request?.record_id) return;

    const employee = await db.employees.findFirst({
      where: { id: request.record_id, company_id: companyId, deleted_at: null },
    });
    if (!employee) return;

    const user = await db.users.findFirst({
      where: {
        company_id: companyId,
        employee_id: employee.id,
        is_active: true,
        deleted_at: null,
      },
      include: { employee: true },
    });

    const employeeName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.employee_code;
    const approved = decision === 'approved';
    const title = approved ? 'Profile update approved' : 'Profile update rejected';
    const body = approved
      ? `Your profile update request for ${employeeName} has been approved and applied.`
      : `Your profile update request for ${employeeName} was rejected.${reason ? ` Reason: ${reason}` : ''}`;

    const recipients = [{ email: user?.email || employee.work_email || employee.personal_email, phone: employee.phone }];
    await dispatch({
      db,
      companyId,
      title,
      body,
      link: '/employees',
      emailSubject: title,
      smsText: `HRMS: ${body}`,
      recipients,
      inAppUserIds: user?.id ? [user.id] : [],
    });
  },

  async notifyLeaveDecision({ db, companyId, application, decision, reason }) {
    if (!application) return;
    const user = await db.users.findFirst({
      where: {
        company_id: companyId,
        employee_id: application.employee_id,
        is_active: true,
        deleted_at: null,
      },
    });

    const leaveType = application.leave_type?.name || 'Leave';
    const employeeName = `${application.employee?.first_name || ''} ${application.employee?.last_name || ''}`.trim() || 'Employee';
    const title = `Leave ${decision}`;
    const body = decision === 'approved'
      ? `${leaveType} request has been approved.`
      : `${leaveType} request has been rejected.${reason ? ` Reason: ${reason}` : ''}`;

    await dispatch({
      db,
      companyId,
      title,
      body,
      link: '/leave',
      emailSubject: `${leaveType} request ${decision}`,
      emailHtml: `<p>Hello ${employeeName},</p><p>${body}</p>`,
      smsText: `HRMS: ${leaveType} request ${decision}.${reason ? ` Reason: ${reason}` : ''}`,
      recipients: [{
        email: application.employee?.work_email || application.employee?.personal_email,
        phone: application.employee?.phone,
      }],
      inAppUserIds: user?.id ? [user.id] : [],
    });
  },

  async notifyExpenseDecision({ db, companyId, claim, decision, reason }) {
    if (!claim?.employee_id) return;

    const [employee, user] = await Promise.all([
      db.employees.findFirst({ where: { id: claim.employee_id, company_id: companyId, deleted_at: null } }),
      db.users.findFirst({
        where: {
          company_id: companyId,
          employee_id: claim.employee_id,
          is_active: true,
          deleted_at: null,
        },
      }),
    ]);

    const employeeName = `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim() || 'Employee';
    const title = `Expense claim ${decision}`;
    const body = decision === 'approved'
      ? `Your expense claim has been approved for amount ${claim.approved_amount || claim.total_amount || 0}.`
      : `Your expense claim has been rejected.${reason ? ` Reason: ${reason}` : ''}`;

    await dispatch({
      db,
      companyId,
      title,
      body,
      link: '/expenses',
      emailSubject: `Expense claim ${decision}`,
      emailHtml: `<p>Hello ${employeeName},</p><p>${body}</p>`,
      smsText: `HRMS: Expense claim ${decision}.${reason ? ` Reason: ${reason}` : ''}`,
      recipients: [{ email: user?.email || employee?.work_email || employee?.personal_email, phone: employee?.phone }],
      inAppUserIds: user?.id ? [user.id] : [],
    });
  },

  async notifyRegularizationDecision({ db, companyId, requestId, decision, reason }) {
    if (!requestId) return;
    const request = await db.regularization_requests.findFirst({
      where: { id: requestId, company_id: companyId },
      include: { employee: true },
    });
    if (!request?.employee) return;

    const user = await db.users.findFirst({
      where: {
        company_id: companyId,
        employee_id: request.employee_id,
        is_active: true,
        deleted_at: null,
      },
    });

    const employeeName = `${request.employee.first_name || ''} ${request.employee.last_name || ''}`.trim() || 'Employee';
    const title = `Attendance regularization ${decision}`;
    const body = decision === 'approved'
      ? 'Your attendance regularization request has been approved.'
      : `Your attendance regularization request was rejected.${reason ? ` Reason: ${reason}` : ''}`;

    await dispatch({
      db,
      companyId,
      title,
      body,
      link: '/attendance',
      emailSubject: `Attendance regularization ${decision}`,
      emailHtml: `<p>Hello ${employeeName},</p><p>${body}</p>`,
      smsText: `HRMS: Regularization request ${decision}.${reason ? ` Reason: ${reason}` : ''}`,
      recipients: [{
        email: user?.email || request.employee.work_email || request.employee.personal_email,
        phone: request.employee.phone,
      }],
      inAppUserIds: user?.id ? [user.id] : [],
    });
  },
};

module.exports = eventNotifier;