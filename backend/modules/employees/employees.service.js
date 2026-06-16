/**
 * @file employees.service.js
 * @description Core business logic for employee management with Mac-style enriched logging.
 */
const { encrypt, decrypt, mask } = require('../../shared/utils/encryption');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../../shared/utils/logger');
const { THEME } = require('../../shared/utils/uiConstants');

async function writeAuditLog(db, { companyId, userId, module = 'employees', action, recordId, recordType = 'employee', oldValues, newValues, ip }) {
  try {
    const log = await db.audit_logs.create({
      data: {
        company_id:  companyId  || null,
        user_id:     userId     || null,
        module,
        action,
        record_id:   recordId   || null,
        record_type: recordType,
        old_values:  oldValues  ? JSON.stringify(oldValues)  : null,
        new_values:  newValues  ? JSON.stringify(newValues)  : null,
        ip_address:  ip         || null,
      },
    });
    return log;
  } catch (err) {
    logger.error(`${THEME.ICONS.ERROR} [AuditLog] Failed to write entry:`, { message: err.message });
    return null;
  }
}

async function generateEmployeeCode(db, companyId) {
  logger.debug(`${THEME.ICONS.PROCESS} Generating new unique employee code for company ${companyId}`);
  return db.$transaction(async (tx) => {
    const last = await tx.employees.findFirst({
      where:   { company_id: companyId },
      orderBy: { employee_code: 'desc' },
      select:  { employee_code: true },
    });

    let nextNum = 1;
    if (last?.employee_code) {
      const match = last.employee_code.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    return `EMP${String(nextNum).padStart(4, '0')}`;
  });
}

const formatEmployee = (e) => {
  if (!e) return null;
  return {
    id:               e.id,
    employeeCode:     e.employee_code,
    fullName:         `${e.first_name} ${e.last_name}`.trim(),
    firstName:        e.first_name,
    lastName:         e.last_name,
    middleName:       e.middle_name       || null,
    fatherName:       e.father_name       || null,
    motherName:       e.mother_name       || null,
    spouseName:       e.spouse_name       || null,
    disabilityStatus: e.disability_status || false,
    dateOfBirth:      e.date_of_birth     || null,
    gender:           e.gender            || null,
    maritalStatus:    e.marital_status    || null,
    bloodGroup:       e.blood_group       || null,
    phone:            e.phone             || null,
    personalEmail:    e.personal_email    || null,
    workEmail:        e.work_email        || null,
    photoUrl:         e.photo_url         || null,
    address:          e.address           || null,
    city:             e.city              || null,
    state:            e.state             || null,
    pincode:          e.pincode           || null,
    emergencyContactName:  e.emergency_contact_name  || null,
    emergencyContactPhone: e.emergency_contact_phone || null,
    emergencyContactRel:   e.emergency_contact_rel   || null,
    aadhaarMasked:    e.aadhaar_number ? mask(e.aadhaar_number)    : null,
    panMasked:        e.pan_number     ? mask(e.pan_number, 4)     : null,
    uanNumber:        e.uan_number     || null,
    esiIpNumber:      e.esi_ip_number  || null,
    dateOfJoining:    e.date_of_joining    || null,
    dateOfLeaving:    e.date_of_leaving    || null,
    employmentType:   e.employment_type    || 'full_time',
    status:           e.status             || 'active',
    probationEndDate: e.probation_end_date || null,
    confirmationDate: e.confirmation_date  || null,
    isUserCreated:    e.is_user_created     || false,
    department:  e.department  ? { id: e.department.id,  name: e.department.name }  : null,
    designation: e.designation ? { id: e.designation.id, name: e.designation.name } : null,
    branch:      e.branch      ? { id: e.branch.id,      name: e.branch.name }      : null,
    manager:     e.manager     ? {
      id: e.manager.id,
      firstName: e.manager.first_name,
      lastName:  e.manager.last_name,
    } : null,
    bankAccounts: (e.bank_accounts || []).map(b => ({
      id:            b.id,
      bankName:      b.bank_name,
      accountMasked: mask(b.account_number || '', 4),
      ifscCode:      b.ifsc_code,
      accountType:   b.account_type,
      isPrimary:     b.is_primary,
    })),
    documents: (e.documents || []).map(d => ({
      id:           d.id,
      documentType: d.document_type,
      documentName: d.document_name,
      fileUrl:      d.file_url,
      isVerified:   d.is_verified,
      expiryDate:   d.expiry_date,
    })),
    loginAccount: e.user ? {
      id:          e.user.id,
      email:       e.user.email,
      isActive:    e.user.is_active,
      isFirstLogin: e.user.is_first_login,
      lastLoginAt: e.user.last_login_at,
    } : null,
  };
};

const employeeInclude = {
  department:    { select: { id: true, name: true } },
  designation:   { select: { id: true, name: true } },
  branch:        { select: { id: true, name: true } },
  manager:       { select: { id: true, first_name: true, last_name: true } },
  bank_accounts: { where: { deleted_at: null } },
  documents:     { where: { deleted_at: null } },
  user:          { select: { id: true, email: true, is_active: true, is_first_login: true, last_login_at: true } },
};

const employeeService = {

  list: async (db, companyId, { search, status, type: empType, cursor, limit = 20 } = {}) => {
    const where = { company_id: companyId, deleted_at: null };
    if (status)  where.status          = status;
    if (empType) where.employment_type = empType;

    if (search) {
      logger.debug(`${THEME.ICONS.PROCESS} Searching employees in company ${companyId} for: "${search}"`);
      where.OR = [
        { first_name:     { contains: search, mode: 'insensitive' } },
        { last_name:      { contains: search, mode: 'insensitive' } },
        { work_email:     { contains: search, mode: 'insensitive' } },
        { personal_email: { contains: search, mode: 'insensitive' } },
        { phone:          { contains: search } },
        { employee_code:  { contains: search, mode: 'insensitive' } },
      ];
    }

    const total     = await db.employees.count({ where });
    const employees = await db.employees.findMany({
      where,
      orderBy: { employee_code: 'asc' },
      take:    parseInt(limit, 10) + 1,
      cursor:  cursor ? { id: cursor } : undefined,
      include: {
        department:  { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        branch:      { select: { id: true, name: true } },
      },
    });

    const hasMore    = employees.length > parseInt(limit, 10);
    const data       = hasMore ? employees.slice(0, -1) : employees;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data: data.map(formatEmployee), pagination: { total, hasMore, cursor: nextCursor } };
  },

  exportList: async (db, companyId, { search, status, type: empType } = {}) => {
    const where = { company_id: companyId, deleted_at: null };
    if (status)  where.status          = status;
    if (empType) where.employment_type = empType;

    if (search) {
      where.OR = [
        { first_name:     { contains: search, mode: 'insensitive' } },
        { last_name:      { contains: search, mode: 'insensitive' } },
        { work_email:     { contains: search, mode: 'insensitive' } },
        { personal_email: { contains: search, mode: 'insensitive' } },
        { phone:          { contains: search } },
        { employee_code:  { contains: search, mode: 'insensitive' } },
      ];
    }

    const employees = await db.employees.findMany({
      where,
      orderBy: { employee_code: 'asc' },
      take:    2000,
      include: {
        department:  { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        branch:      { select: { id: true, name: true } },
        manager:     { select: { id: true, first_name: true, last_name: true } },
      },
    });

    return employees.map(formatEmployee);
  },

  getOne: async (db, companyId, id) => {
    const emp = await db.employees.findFirst({
      where:   { id, company_id: companyId, deleted_at: null },
      include: employeeInclude,
    });
    if (!emp) throw new Error('NOT_FOUND');
    return formatEmployee(emp);
  },

  create: async (db, companyId, data, { userId, ip } = {}) => {
  const employeeCode = data.employeeCode?.trim() || await generateEmployeeCode(db, companyId);

  logger.info(`${THEME.ICONS.USER} Creating employee: ${data.firstName} ${data.lastName} (${employeeCode})`);

  const existing = await db.employees.findFirst({
    where: { company_id: companyId, employee_code: employeeCode, deleted_at: null },
  });
  if (existing) throw new Error('DUPLICATE_CODE');

  const emp = await db.employees.create({
    data: {
      company_id:              companyId,
      employee_code:           employeeCode,
      first_name:              data.firstName?.trim()  || '',
      last_name:               data.lastName?.trim()   || '',
      middle_name:             data.middleName         || null,
      father_name:             data.fatherName         || null,
      mother_name:             data.motherName         || null,
      spouse_name:             data.spouseName         || null,
      disability_status:       data.disabilityStatus   || false,
      date_of_birth:           data.dateOfBirth   ? new Date(data.dateOfBirth)   : null,
      gender:                  data.gender         || null,
      marital_status:          data.maritalStatus  || null,
      blood_group:             data.bloodGroup     || null,
      phone:                   data.phone          || null,
      personal_email:          data.personalEmail  || null,
      work_email:              data.workEmail       || null,
      emergency_contact_name:  data.emergencyContactName  || null,
      emergency_contact_phone: data.emergencyContactPhone || null,
      emergency_contact_rel:   data.emergencyContactRel   || null,
      aadhaar_number:          data.aadhaarNumber ? encrypt(data.aadhaarNumber.replace(/\s/g, '')) : null,
      pan_number:              data.panNumber     ? encrypt(data.panNumber.toUpperCase())          : null,
      uan_number:              data.uanNumber     || null,
      esi_ip_number:           data.esiIpNumber   || null,
      date_of_joining:         data.dateOfJoining  ? new Date(data.dateOfJoining)  : new Date(),
      employment_type:         data.employmentType || 'full_time',
      status:                  data.status         || 'active',
      department_id:           data.departmentId   || null,
      designation_id:          data.designationId  || null,
      branch_id:               data.branchId       || null,
      reporting_to:            data.reportingTo    || null,
      probation_end_date:      data.probationEndDate ? new Date(data.probationEndDate) : null,
      central_kyc_id:          data.kycId || null,               
      photo_url:               data.kycPhoto || null,            
    },
    include: employeeInclude,
  });

  await writeAuditLog(db, {
    companyId, userId, ip,
    action:    'create',
    recordId:  emp.id,
    newValues: { employeeCode: emp.employee_code, name: `${emp.first_name} ${emp.last_name}` },
  });

  return formatEmployee(emp);
},

  update: async (db, companyId, id, data, { userId, ip } = {}) => {
    const emp = await db.employees.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!emp) throw new Error('NOT_FOUND');

    logger.info(`${THEME.ICONS.PROCESS} Updating employee record: ${emp.employee_code}`);

    const oldSnap = {
      firstName: emp.first_name, lastName: emp.last_name,
      phone: emp.phone, status: emp.status,
      departmentId: emp.department_id, designationId: emp.designation_id,
    };

    const updated = await db.employees.update({
      where:   { id },
      include: employeeInclude,
      data: {
        first_name:              data.firstName     ?? emp.first_name,
        last_name:               data.lastName      ?? emp.last_name,
        middle_name:             data.middleName    ?? emp.middle_name,
        father_name:             data.fatherName    ?? emp.father_name,
        mother_name:             data.motherName    ?? emp.mother_name,
        spouse_name:             data.spouseName    ?? emp.spouse_name,
        disability_status:       data.disabilityStatus ?? emp.disability_status,
        date_of_birth:           data.dateOfBirth   ? new Date(data.dateOfBirth)   : emp.date_of_birth,
        gender:                  data.gender         ?? emp.gender,
        marital_status:          data.maritalStatus  ?? emp.marital_status,
        blood_group:             data.bloodGroup     ?? emp.blood_group,
        phone:                   data.phone          ?? emp.phone,
        personal_email:          data.personalEmail  ?? emp.personal_email,
        work_email:              data.workEmail      ?? emp.work_email,
        address:                 data.address        ?? emp.address,
        city:                    data.city           ?? emp.city,
        state:                   data.state          ?? emp.state,
        pincode:                 data.pincode        ?? emp.pincode,
        emergency_contact_name:  data.emergencyContactName  ?? emp.emergency_contact_name,
        emergency_contact_phone: data.emergencyContactPhone ?? emp.emergency_contact_phone,
        emergency_contact_rel:   data.emergencyContactRel   ?? emp.emergency_contact_rel,
        aadhaar_number:          data.aadhaarNumber ? encrypt(data.aadhaarNumber.replace(/\s/g, '')) : emp.aadhaar_number,
        pan_number:              data.panNumber     ? encrypt(data.panNumber.toUpperCase())          : emp.pan_number,
        uan_number:              data.uanNumber     ?? emp.uan_number,
        esi_ip_number:           data.esiIpNumber   ?? emp.esi_ip_number,
        date_of_joining:         data.dateOfJoining     ? new Date(data.dateOfJoining)     : emp.date_of_joining,
        employment_type:         data.employmentType    ?? emp.employment_type,
        status:                  data.status            ?? emp.status,
        department_id:           data.departmentId      ?? emp.department_id,
        designation_id:          data.designationId     ?? emp.designation_id,
        branch_id:               data.branchId          ?? emp.branch_id,
        reporting_to:            data.reportingTo       ?? emp.reporting_to,
        probation_end_date:      data.probationEndDate   ? new Date(data.probationEndDate)   : emp.probation_end_date,
        confirmation_date:       data.confirmationDate   ? new Date(data.confirmationDate)   : emp.confirmation_date,
      },
    });

    await writeAuditLog(db, {
      companyId, userId, ip,
      action:    'update',
      recordId:  id,
      oldValues: oldSnap,
      newValues: { firstName: data.firstName, lastName: data.lastName, phone: data.phone, status: data.status },
    });

    return formatEmployee(updated);
  },

  softDelete: async (db, companyId, id, { userId, ip } = {}) => {
    const emp = await db.employees.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!emp) throw new Error('NOT_FOUND');

    logger.warn(`${THEME.ICONS.LOCK} Terminating/Deleting employee: ${emp.employee_code}`);

    const result = await db.employees.update({
      where: { id },
      data:  { deleted_at: new Date(), status: 'terminated' },
    });

    await writeAuditLog(db, {
      companyId, userId, ip,
      action:    'delete',
      recordId:  id,
      oldValues: { name: `${emp.first_name} ${emp.last_name}`, code: emp.employee_code },
    });

    return result;
  },

  restore: async (db, companyId, id, { userId, ip } = {}) => {
    const emp = await db.employees.findFirst({
      where: { id, company_id: companyId, deleted_at: { not: null } },
    });
    if (!emp) throw new Error('NOT_FOUND_OR_NOT_DELETED');

    logger.info(`${THEME.ICONS.SUCCESS} Restoring employee: ${emp.employee_code}`);

    const result = await db.employees.update({
      where: { id },
      data:  { deleted_at: null, status: 'active' },
    });

    await writeAuditLog(db, {
      companyId, userId, ip,
      action:    'restore',
      recordId:  id,
      newValues: { name: `${emp.first_name} ${emp.last_name}`, code: emp.employee_code },
    });

    return result;
  },

  listDeleted: async (db, companyId, { search } = {}) => {
    const where = { company_id: companyId, deleted_at: { not: null } };
    if (search) {
      where.OR = [
        { first_name:    { contains: search, mode: 'insensitive' } },
        { last_name:     { contains: search, mode: 'insensitive' } },
        { employee_code: { contains: search, mode: 'insensitive' } },
      ];
    }
    const rows = await db.employees.findMany({
      where,
      orderBy: { deleted_at: 'desc' },
      take:    100,
      include: {
        department:  { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
      },
    });
    return rows.map(formatEmployee);
  },

  unmask: async (db, companyId, id, { userId, ip } = {}) => {
    const emp = await db.employees.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!emp) throw new Error('NOT_FOUND');

    logger.info(`${THEME.ICONS.LOCK} Unmasking sensitive PII for employee: ${emp.employee_code}`);

    await writeAuditLog(db, {
      companyId, userId, ip,
      action:    'view_sensitive',
      recordId:  id,
      newValues: { fieldsViewed: ['aadhaar_number', 'pan_number'] },
    });

    return {
      aadhaarNumber: emp.aadhaar_number ? decrypt(emp.aadhaar_number) : null,
      panNumber:     emp.pan_number     ? decrypt(emp.pan_number)     : null,
    };
  },

  updatePhoto: async (db, companyId, id, photoPath, { userId, ip } = {}) => {
    const emp = await db.employees.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!emp) throw new Error('NOT_FOUND');

    await db.employees.update({
      where: { id },
      data:  { photo_url: photoPath },
    });

    await writeAuditLog(db, {
      companyId, userId, ip,
      action:    'update',
      recordId:  id,
      newValues: { photoUpdated: true, photoPath },
    });

    return { photoUrl: photoPath };
  },

  getBankAccounts: async (db, companyId, employeeId) => {
    const emp = await db.employees.findFirst({ where: { id: employeeId, company_id: companyId } });
    if (!emp) throw new Error('NOT_FOUND');
    logger.debug(`${THEME.ICONS.INFO} Fetching bank accounts for employee: ${employeeId}`);
    return db.employee_bank_accounts.findMany({ where: { employee_id: employeeId, deleted_at: null } });
  },

  addBankAccount: async (db, companyId, employeeId, data) => {
    const emp = await db.employees.findFirst({ where: { id: employeeId, company_id: companyId } });
    if (!emp) throw new Error('NOT_FOUND');
    logger.info(`${THEME.ICONS.BANK} Adding new bank account for employee: ${employeeId}`);
    if (data.isPrimary !== false) {
      await db.employee_bank_accounts.updateMany({
        where: { employee_id: employeeId, deleted_at: null },
        data:  { is_primary: false },
      });
    }
    return db.employee_bank_accounts.create({
      data: {
        employee_id:    employeeId,
        bank_name:      data.bankName,
        account_number: encrypt(data.accountNumber),
        ifsc_code:      data.ifscCode.toUpperCase(),
        account_type:   data.accountType || 'savings',
        is_primary:     data.isPrimary !== false,
      },
    });
  },

  updateBankAccount: async (db, companyId, employeeId, bankId, data) => {
    const bank = await db.employee_bank_accounts.findFirst({ where: { id: bankId, employee_id: employeeId } });
    if (!bank) throw new Error('NOT_FOUND');
    logger.info(`${THEME.ICONS.PROCESS} Updating bank account ${bankId} for employee: ${employeeId}`);
    return db.employee_bank_accounts.update({
      where: { id: bankId },
      data: {
        bank_name:    data.bankName    ?? bank.bank_name,
        ifsc_code:    data.ifscCode    ? data.ifscCode.toUpperCase() : bank.ifsc_code,
        account_type: data.accountType ?? bank.account_type,
        is_primary:   data.isPrimary   ?? bank.is_primary,
      },
    });
  },

  deleteBankAccount: async (db, companyId, employeeId, bankId) => {
    const bank = await db.employee_bank_accounts.findFirst({ where: { id: bankId, employee_id: employeeId } });
    if (!bank) throw new Error('NOT_FOUND');
    logger.warn(`${THEME.ICONS.LOCK} Deleting bank account ${bankId} for employee: ${employeeId}`);
    return db.employee_bank_accounts.update({ where: { id: bankId }, data: { deleted_at: new Date() } });
  },

  getDocuments: async (db, companyId, employeeId) => {
    const emp = await db.employees.findFirst({ where: { id: employeeId, company_id: companyId } });
    if (!emp) throw new Error('NOT_FOUND');
    logger.debug(`${THEME.ICONS.DOCUMENTS} Fetching documents for employee: ${employeeId}`);
    return db.employee_documents.findMany({ where: { employee_id: employeeId, deleted_at: null } });
  },

  addDocument: async (db, companyId, employeeId, data) => {
  const emp = await db.employees.findFirst({ where: { id: employeeId, company_id: companyId } });
  if (!emp) throw new Error('NOT_FOUND');
  logger.info(`${THEME.ICONS.FILE} Uploading document "${data.documentType}" for employee: ${employeeId}`);
  return db.employee_documents.create({
    data: {
      employee_id:    employeeId,
      document_type:  data.documentType,
      document_name:  data.documentName,
      document_number: data.documentNumber || null,
      file_name:      data.fileName || null,
      file_url:       data.fileUrl || '',
      expiry_date:    data.expiryDate ? new Date(data.expiryDate) : null,
      is_verified:    data.isVerified || false,
    },
  });
},

  deleteDocument: async (db, companyId, employeeId, docId) => {
    const doc = await db.employee_documents.findFirst({ where: { id: docId, employee_id: employeeId } });
    if (!doc) throw new Error('NOT_FOUND');
    logger.warn(`${THEME.ICONS.LOCK} Deleting document ${docId} for employee: ${employeeId}`);
    return db.employee_documents.update({ where: { id: docId }, data: { deleted_at: new Date() } });
  },

  createLogin: async (db, companyId, employeeId, data, { userId, ip } = {}) => {
    const emp = await db.employees.findFirst({
      where: { id: employeeId, company_id: companyId, deleted_at: null },
    });
    if (!emp) throw new Error('NOT_FOUND');

    const existingLogin = await db.users.findFirst({
      where: { employee_id: employeeId, deleted_at: null },
    });
    if (existingLogin) throw new Error('LOGIN_EXISTS');

    logger.info(`${THEME.ICONS.LOCK} Provisioning new login for employee: ${employeeId}`);

    const emailToUse = data.email?.trim() || emp.work_email || emp.personal_email;
    if (!emailToUse) throw new Error('NO_EMAIL');

    const emailUsed = await db.users.findFirst({ where: { email: emailToUse, deleted_at: null } });
    if (emailUsed) throw new Error('EMAIL_EXISTS');

    let tempPassword;
    if (emp.pan_number) {
      try { tempPassword = decrypt(emp.pan_number).toLowerCase(); }
      catch { tempPassword = crypto.randomBytes(6).toString('base64').slice(0, 10); }
    } else {
      tempPassword = crypto.randomBytes(6).toString('base64').slice(0, 10);
    }
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    let role = await db.roles.findFirst({
      where: { company_id: companyId, name: { in: ['Employee', 'employee', 'Staff', 'staff'] }, deleted_at: null },
    });
    if (!role) {
      
      const allRoles = await db.roles.findMany({
        where: { company_id: companyId, deleted_at: null },
      });
      if (!allRoles.length) throw new Error('NO_ROLE');
      role = allRoles.sort((a, b) => {
        const countPerms = (r) => {
          try {
            const p = typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions;
            return Object.values(p).reduce((s, m) => s + Object.values(m).filter(Boolean).length, 0);
          } catch { return 999; }
        };
        return countPerms(a) - countPerms(b);
      })[0];
    }

    const user = await db.users.create({
      data: {
        company_id:     companyId,
        employee_id:    employeeId,
        email:          emailToUse,
        password_hash:  passwordHash,
        role_id:        role.id,
        is_active:      true,
        is_first_login: true,
      },
    });

    await db.employees.update({
      where: { id: employeeId },
      data:  { is_user_created: true },
    });

    await writeAuditLog(db, {
      companyId, userId, ip,
      action:    'create_login',
      recordId:  employeeId,
      newValues: { email: emailToUse, roleId: role.id, roleName: role.name },
    });

    return { userId: user.id, email: emailToUse, tempPassword, roleName: role.name };
  },

  toggleLogin: async (db, companyId, employeeId) => {
    const user = await db.users.findFirst({ where: { employee_id: employeeId, company_id: companyId } });
    if (!user) throw new Error('NO_LOGIN');
    const action = user.is_active ? 'Deactivating' : 'Activating';
    logger.info(`${THEME.ICONS.LOCK} ${action} login access for employee: ${employeeId}`);
    const updated = await db.users.update({ where: { id: user.id }, data: { is_active: !user.is_active } });
    return { isActive: updated.is_active };
  },

  bulkImport: async (db, companyId, rows, { userId, ip } = {}) => {
    const results = { success: 0, failed: 0, errors: [] };

    logger.info(`${THEME.ICONS.DOWNLOAD} Starting bulk import for ${rows.length} records`);

    const [depts, desigs, branches] = await Promise.all([
      db.departments.findMany({
        where: { company_id: companyId, deleted_at: null },
        select: { id: true, name: true },
      }),
      db.designations.findMany({
        where: { company_id: companyId, deleted_at: null },
        select: { id: true, name: true },
      }),
      db.branches.findMany({
        where: { company_id: companyId, deleted_at: null },
        select: { id: true, name: true },
      }),
    ]);

    const deptMap   = Object.fromEntries(depts.map(d    => [d.name.toLowerCase().trim(), d.id]));
    const desigMap  = Object.fromEntries(desigs.map(d   => [d.name.toLowerCase().trim(), d.id]));
    const branchMap = Object.fromEntries(branches.map(b => [b.name.toLowerCase().trim(), b.id]));

    for (const row of rows) {
      try {
        const departmentId  = row.departmentName  ? deptMap[row.departmentName.toLowerCase().trim()]   || null : null;
        const designationId = row.designationName ? desigMap[row.designationName.toLowerCase().trim()]  || null : null;
        const branchId      = row.branchName      ? branchMap[row.branchName.toLowerCase().trim()]     || null : null;

        await employeeService.create(db, companyId, {
          employeeCode:           row.employeeCode        || null,
          firstName:              row.firstName,
          lastName:               row.lastName,
          middleName:             row.middleName           || null,
          fatherName:             row.fatherName           || null,
          motherName:             row.motherName           || null,
          spouseName:             row.spouseName           || null,
          disabilityStatus:       row.disabilityStatus === 'true' || row.disabilityStatus === '1' || false,
          dateOfBirth:            row.dateOfBirth          || null,
          gender:                 row.gender               || null,
          maritalStatus:          row.maritalStatus        || null,
          bloodGroup:             row.bloodGroup           || null,
          phone:                  row.phone,
          personalEmail:          row.personalEmail || row.email || null,
          workEmail:              row.workEmail             || null,
          emergencyContactName:   row.emergencyContactName  || null,
          emergencyContactPhone:  row.emergencyContactPhone || null,
          emergencyContactRel:    row.emergencyContactRel   || null,
          aadhaarNumber:          row.aadhaarNumber         || null,
          panNumber:              row.panNumber             || null,
          uanNumber:              row.uanNumber             || null,
          esiIpNumber:            row.esiIpNumber           || null,
          dateOfJoining:          row.dateOfJoining,
          employmentType:         row.employmentType        || 'full_time',
          status:                 row.status               || 'active',
          probationEndDate:       row.probationEndDate      || null,
          departmentId,
          designationId,
          branchId,
        }, { userId, ip });

        results.success++;
      } catch (e) {
        results.failed++;
        results.errors.push({
          row:   row._rowNum || row.firstName || '?',
          name:  `${row.firstName || ''} ${row.lastName || ''}`.trim(),
          error: e.message,
        });
      }
    }

    await writeAuditLog(db, {
      companyId, userId, ip,
      action:     'bulk_import',
      recordType: 'employee',
      newValues:  { total: rows.length, success: results.success, failed: results.failed },
    });

    logger.info(`${THEME.ICONS.SUCCESS} Bulk import finished: ${results.success} succeeded, ${results.failed} failed`);
    return results;
  },

  getDepartments: async (db, companyId) =>
    db.departments.findMany({
      where:   { company_id: companyId, is_active: true, deleted_at: null },
      orderBy: { name: 'asc' },
      select:  { id: true, name: true },
    }),

  getDesignations: async (db, companyId) =>
    db.designations.findMany({
      where:   { company_id: companyId, is_active: true, deleted_at: null },
      orderBy: { name: 'asc' },
      select:  { id: true, name: true },
    }),

  getBranches: async (db, companyId) =>
    db.branches.findMany({
      where:   { company_id: companyId, is_active: true, deleted_at: null },
      orderBy: { name: 'asc' },
      select:  { id: true, name: true },
    }),

  getManagers: async (db, companyId) =>
    db.employees.findMany({
      where:   { company_id: companyId, status: { not: 'terminated' }, deleted_at: null },
      orderBy: { first_name: 'asc' },
      select:  { id: true, first_name: true, last_name: true, employee_code: true },
    }),
};
module.exports = employeeService;

