const svc  = require('./employees.service');
const emailSvc = require('../../shared/utils/emailService');
const logger = require('../../shared/utils/logger');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    if (e.message === 'NOT_FOUND')
      return sendError(res, ERROR_CODES.NOT_FOUND,  'Employee not found.', 404);
    if (e.message === 'NOT_FOUND_OR_NOT_DELETED')
      return sendError(res, ERROR_CODES.NOT_FOUND,  'Employee not found in deleted records.', 404);
    if (e.message === 'DUPLICATE_CODE')
      return sendError(res, ERROR_CODES.VALIDATION, 'Employee code already exists. Leave blank for auto-generation.', 400);
    if (e.message === 'NO_EMAIL')
      return sendError(res, ERROR_CODES.VALIDATION, 'No email found for this employee. Add an email first.', 400);
    if (e.message === 'EMAIL_EXISTS')
      return sendError(res, ERROR_CODES.DUPLICATE,  'This email is already used by another login account.', 409);
    if (e.message === 'LOGIN_EXISTS')
      return sendError(res, ERROR_CODES.DUPLICATE,  'This employee already has a login account.', 409);
    if (e.message === 'NO_ROLE')
      return sendError(res, ERROR_CODES.SERVER,     'No role configured. Ask admin to create an Employee role.', 500);
    if (e.message === 'NO_LOGIN')
      return sendError(res, ERROR_CODES.NOT_FOUND,  'No login account found for this employee.', 404);
    console.error('[Employees]', e.message, '\n', e.stack);
    sendError(res, ERROR_CODES.SERVER,
      process.env.NODE_ENV === 'development'
        ? `Server error: ${e.message}`
        : 'Something went wrong. Check server logs.',
      500);
  }
};

const actor = (req) => ({ userId: req.user?.id, ip: req.ip });

module.exports = {

  list: wrap(async (req, res) => {
    const result = await svc.list(req.db, req.user.tenantId, req.query);
    res.json({ success: true, ...result });
  }),

  getOne: wrap(async (req, res) => {
    sendSuccess(res, await svc.getOne(req.db, req.user.tenantId, req.params.id));
  }),

  create: wrap(async (req, res) => {
    const { firstName, lastName } = req.body;
    if (!firstName?.trim()) return sendError(res, ERROR_CODES.VALIDATION, 'First name is required.', 400);
    if (!lastName?.trim())  return sendError(res, ERROR_CODES.VALIDATION, 'Last name is required.', 400);
    sendSuccess(res, await svc.create(req.db, req.user.tenantId, req.body, actor(req)), 'Employee created.', 201);
  }),

  update: wrap(async (req, res) => {
    sendSuccess(res, await svc.update(req.db, req.user.tenantId, req.params.id, req.body, actor(req)), 'Employee updated.');
  }),

  softDelete: wrap(async (req, res) => {
    await svc.softDelete(req.db, req.user.tenantId, req.params.id, actor(req));
    sendSuccess(res, null, 'Employee removed.');
  }),

  restore: wrap(async (req, res) => {
    await svc.restore(req.db, req.user.tenantId, req.params.id, actor(req));
    sendSuccess(res, null, 'Employee restored.');
  }),

  listDeleted: wrap(async (req, res) => {
    sendSuccess(res, await svc.listDeleted(req.db, req.user.tenantId, req.query));
  }),

  unmask: wrap(async (req, res) => {
    sendSuccess(res, await svc.unmask(req.db, req.user.tenantId, req.params.id, actor(req)));
  }),

  uploadPhoto: wrap(async (req, res) => {
    if (!req.file) return sendError(res, ERROR_CODES.VALIDATION, 'No file uploaded.', 400);
    const photoPath = `/uploads/employees/${req.file.filename}`;
    sendSuccess(res, await svc.updatePhoto(req.db, req.user.tenantId, req.params.id, photoPath, actor(req)), 'Photo updated.');
  }),

  getBankAccounts: wrap(async (req, res) => {
    sendSuccess(res, await svc.getBankAccounts(req.db, req.user.tenantId, req.params.id));
  }),
  addBankAccount: wrap(async (req, res) => {
    if (!req.body.bankName || !req.body.accountNumber)
      return sendError(res, ERROR_CODES.VALIDATION, 'Bank name and account number are required.', 400);
    sendSuccess(res, await svc.addBankAccount(req.db, req.user.tenantId, req.params.id, req.body), 'Bank account added.');
  }),
  updateBankAccount: wrap(async (req, res) => {
    sendSuccess(res, await svc.updateBankAccount(req.db, req.user.tenantId, req.params.id, req.params.bid, req.body), 'Updated.');
  }),
  deleteBankAccount: wrap(async (req, res) => {
    await svc.deleteBankAccount(req.db, req.user.tenantId, req.params.id, req.params.bid);
    sendSuccess(res, null, 'Bank account removed.');
  }),

  getDocuments: wrap(async (req, res) => {
    sendSuccess(res, await svc.getDocuments(req.db, req.user.tenantId, req.params.id));
  }),
  addDocument: wrap(async (req, res) => {
    if (!req.body.documentType || !req.body.documentName)
      return sendError(res, ERROR_CODES.VALIDATION, 'Document type and name are required.', 400);
    sendSuccess(res, await svc.addDocument(req.db, req.user.tenantId, req.params.id, req.body), 'Document added.');
  }),
  deleteDocument: wrap(async (req, res) => {
    await svc.deleteDocument(req.db, req.user.tenantId, req.params.id, req.params.did);
    sendSuccess(res, null, 'Document removed.');
  }),

  createLogin: wrap(async (req, res) => {
    const loginResult = await svc.createLogin(req.db, req.user.tenantId, req.params.id, req.body, actor(req));

    const loginUrl = process.env.FRONTEND_URL
      || (req.tenant?.subdomain
        ? `https://${req.tenant.subdomain}.syntern.in/login`
        : 'http://localhost:5173/login');

    try {
      await emailSvc.sendWelcome(req.db, req.user.tenantId, {
        name:         loginResult.email,
        email:        loginResult.email,
        tempPassword: loginResult.tempPassword,
        loginUrl,
      });
    } catch (err) {
      logger.error('[Employees/CreateLogin] Welcome email failed', { error: err.message, email: loginResult.email });
    }

    sendSuccess(res, loginResult, 'Login created and welcome email triggered.');
  }),
  toggleLogin: wrap(async (req, res) => {
    sendSuccess(res, await svc.toggleLogin(req.db, req.user.tenantId, req.params.id), 'Login status updated.');
  }),

  bulkImport: wrap(async (req, res) => {
    const { rows } = req.body;

    if (!rows)               return sendError(res, ERROR_CODES.VALIDATION, 'Missing "rows" array in request body.', 400);
    if (!Array.isArray(rows)) return sendError(res, ERROR_CODES.VALIDATION, '"rows" must be an array.', 400);
    if (rows.length === 0)    return sendError(res, ERROR_CODES.VALIDATION, 'No rows provided.', 400);

    const MAX_ROWS = 1000;
    if (rows.length > MAX_ROWS)
      return sendError(res, ERROR_CODES.VALIDATION, `Too many rows. Maximum ${MAX_ROWS}, got ${rows.length}.`, 400);

    const errors = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.firstName?.toString().trim()) errors.push(`Row ${i + 1}: firstName is required`);
      if (!row.lastName?.toString().trim())  errors.push(`Row ${i + 1}: lastName is required`);
      if (errors.length >= 5) break;
    }
    if (errors.length > 0)
      return sendError(res, ERROR_CODES.VALIDATION, `Validation errors: ${errors.join('; ')}`, 400);

    const result = await svc.bulkImport(req.db, req.user.tenantId, rows, actor(req));
    sendSuccess(res, result, `Imported ${result.success} employees successfully.`, 201);
  }),

  downloadTemplate: (req, res) => {
    const headers = [
      'employeeCode', 'firstName', 'lastName', 'middleName',
      'phone', 'personalEmail', 'workEmail',
      'dateOfJoining', 'employmentType', 'status',
      'dateOfBirth', 'gender', 'maritalStatus', 'bloodGroup',
      'fatherName', 'motherName', 'spouseName', 'disabilityStatus',
      'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRel',
      'aadhaarNumber', 'panNumber', 'uanNumber', 'esiIpNumber',
      'departmentName', 'designationName', 'branchName',
      'probationEndDate',
    ];
    const example = [
      '', 'Ravi', 'Sharma', 'Kumar',
      '9876543210', 'ravi@gmail.com', 'ravi@company.com',
      '2024-01-15', 'full_time', 'active',
      '1990-05-15', 'male', 'married', 'B+',
      'Ram Sharma', 'Sita Sharma', 'Priya Sharma', 'false',
      'Anil Sharma', '9999888877', 'Father',
      '', 'ABCDE1234F', '100123456789', '',
      'Engineering', 'Software Engineer', 'Head Office',
      '',
    ].join(',');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employee_import_template.csv"');
    res.send(headers.join(',') + '\n' + example);
  },

  downloadExportCsv: wrap(async (req, res) => {
    const { search, status, type } = req.query;
    const employees = await svc.exportList(req.db, req.user.tenantId, { search, status, type });
    const headers = [
      'employeeCode', 'firstName', 'lastName', 'middleName',
      'phone', 'personalEmail', 'workEmail',
      'dateOfJoining', 'employmentType', 'status',
      'dateOfBirth', 'gender', 'maritalStatus', 'bloodGroup',
      'departmentName', 'designationName', 'branchName',
      'managerName', 'reportingTo',
    ];

    const escapeCsv = (value) => {
      const text = value == null ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = employees.map((employee) => {
      const managerName = employee.manager ? `${employee.manager.firstName || ''} ${employee.manager.lastName || ''}`.trim() : '';
      const row = {
        employeeCode:   employee.employeeCode,
        firstName:      employee.firstName,
        lastName:       employee.lastName,
        middleName:     employee.middleName,
        phone:          employee.phone,
        personalEmail:  employee.personalEmail,
        workEmail:      employee.workEmail,
        dateOfJoining:  employee.dateOfJoining,
        employmentType: employee.employmentType,
        status:         employee.status,
        dateOfBirth:    employee.dateOfBirth,
        gender:         employee.gender,
        maritalStatus:  employee.maritalStatus,
        bloodGroup:     employee.bloodGroup,
        departmentName: employee.department?.name || '',
        designationName:employee.designation?.name || '',
        branchName:     employee.branch?.name || '',
        managerName,
        reportingTo:    employee.reportingTo || '',
      };
      return headers.map((field) => escapeCsv(row[field])).join(',');
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
    res.send([headers.join(','), ...rows].join('\n'));
  }),

  getDepartments:  wrap(async (req, res) => sendSuccess(res, await svc.getDepartments(req.db, req.user.tenantId))),
  getDesignations: wrap(async (req, res) => sendSuccess(res, await svc.getDesignations(req.db, req.user.tenantId))),
  getBranches:     wrap(async (req, res) => sendSuccess(res, await svc.getBranches(req.db, req.user.tenantId))),
  getManagers:     wrap(async (req, res) => sendSuccess(res, await svc.getManagers(req.db, req.user.tenantId))),
};

