const crypto = require('crypto');
const { encrypt, decrypt } = require('../../shared/utils/encryption');
const { findKycByHash, hashAadhaar } = require('../../shared/utils/centralDb');

function safeJson(str, fallback = null) {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
}

const draftService = {

  async checkDuplicate(db, companyId, aadhaarRaw) {
    const clean = (aadhaarRaw || '').replace(/\s/g, '');
    const hash = hashAadhaar(clean);

    const encAadhaar = encrypt(clean);
    const emp = await db.employees.findFirst({
      where: { company_id: companyId, aadhaar_number: encAadhaar, deleted_at: null },
      select: { id: true, first_name: true, last_name: true, employee_code: true, status: true },
    });
    if (emp) {
      return {
        isDuplicate: true,
        source: 'employee',
        existing: {
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`.trim(),
          code: emp.employee_code,
          status: emp.status,
        },
      };
    }

    const draft = await db.employee_onboarding_draft.findFirst({
      where: {
        company_id: companyId,
        aadhaar_hash: hash,
        is_complete: false,
        expires_at: { gt: new Date() },
      },
      select: { id: true, employee_id: true, current_step: true },
    });

    if (draft) {
      if (draft.current_step > 1) {
        return {
          isDuplicate: true,
          source: 'draft',
          draftId: draft.id,
          currentStep: draft.current_step,
        };
      }
      return { isDuplicate: false, existingDraftId: draft.id };
    }

    return { isDuplicate: false };
  },

  async getDraft(db, companyId, draftId) {
    const d = await db.employee_onboarding_draft.findFirst({
      where: { id: draftId, company_id: companyId, is_complete: false },
    });
    if (!d) return null;
    return {
      id: d.id,
      employeeId: d.employee_id,
      currentStep: d.current_step,
      completedSteps: safeJson(d.completed_steps, []),
      step1: safeJson(d.step1_data),
      step2: safeJson(d.step2_data),
      step3: safeJson(d.step3_data, []),
      step4: safeJson(d.step4_data, []),
      step5: safeJson(d.step5_data, []),
      step6: safeJson(d.step6_data, []),
      step7: safeJson(d.step7_data),
      step8: safeJson(d.step8_data),
      lastSavedAt: d.last_saved_at,
    };
  },

  async createDraft(db, companyId, createdBy, aadhaarRaw) {
    const clean = (aadhaarRaw || '').replace(/\s/g, '');
    const hash = hashAadhaar(clean);
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    const existing = await db.employee_onboarding_draft.findFirst({
      where: {
        company_id: companyId,
        aadhaar_hash: hash,
        is_complete: false,
        current_step: 1,
        expires_at: { gt: new Date() },
      },
      select: { id: true },
    });

    if (existing) {
      await db.employee_onboarding_draft.update({
        where: { id: existing.id },
        data: { expires_at: expires, last_saved_at: new Date() },
      });
      return { draftId: existing.id };
    }

    const draft = await db.employee_onboarding_draft.create({
      data: {
        company_id: companyId,
        created_by: createdBy,
        aadhaar_hash: hash,
        completed_steps: '[]',
        expires_at: expires,
      },
    });
    return { draftId: draft.id };
  },

  async saveStep(db, companyId, draftId, stepNumber, data, employeeId = null) {
    const existing = await db.employee_onboarding_draft.findFirst({
      where: { id: draftId, company_id: companyId },
      select: { completed_steps: true },
    });
    if (!existing) throw new Error('Draft not found');

    const completed = safeJson(existing.completed_steps, []);
    if (!completed.includes(stepNumber)) completed.push(stepNumber);
    completed.sort((a, b) => a - b);

    const stepKey = `step${stepNumber}_data`;
    const updateData = {
      [stepKey]: JSON.stringify(data),
      current_step: stepNumber,
      completed_steps: JSON.stringify(completed),
      last_saved_at: new Date(),
    };
    if (employeeId) updateData.employee_id = employeeId;

    await db.employee_onboarding_draft.updateMany({
      where: { id: draftId, company_id: companyId },
      data: updateData,
    });
    return { saved: true, completedSteps: completed };
  },

  async completeDraft(db, companyId, draftId) {
    await db.employee_onboarding_draft.updateMany({
      where: { id: draftId, company_id: companyId },
      data: { is_complete: true, last_saved_at: new Date() },
    });
    return { completed: true };
  },

  async listDrafts(db, companyId, createdBy = null) {
    const where = {
      company_id: companyId,
      is_complete: false,
      expires_at: { gt: new Date() },
    };
    if (createdBy) where.created_by = createdBy;

    const rows = await db.employee_onboarding_draft.findMany({
      where,
      orderBy: { last_saved_at: 'desc' },
      select: {
        id: true, employee_id: true, current_step: true,
        completed_steps: true, step1_data: true, last_saved_at: true,
      },
    });

    return rows.map(d => {
      const p = safeJson(d.step1_data);
      return {
        draftId: d.id,
        employeeId: d.employee_id,
        currentStep: d.current_step,
        completedSteps: safeJson(d.completed_steps, []),
        name: p
          ? `${p.personal?.firstName || ''} ${p.personal?.lastName || ''}`.trim() || 'Incomplete'
          : 'Incomplete',
        lastSaved: d.last_saved_at,
      };
    });
  },
};

const addressService = {

  async getAll(db, employeeId) {
    const rows = await db.employee_addresses.findMany({
      where: { employee_id: employeeId, deleted_at: null },
      orderBy: { address_type: 'asc' },
    });
    return rows.map(r => ({
      id: r.id,
      addressType: r.address_type,
      houseNo: r.house_no,
      street: r.street,
      villageCity: r.village_city,
      district: r.district,
      state: r.state,
      country: r.country,
      pincode: r.pincode,
    }));
  },

  async upsert(db, employeeId, type, data) {
    const existing = await db.employee_addresses.findFirst({
      where: { employee_id: employeeId, address_type: type, deleted_at: null },
    });
    const payload = {
      address_type: type,
      house_no: data.houseNo || null,
      street: data.street || null,
      village_city: data.villageCity || null,
      district: data.district || null,
      state: data.state || null,
      country: data.country || 'India',
      pincode: data.pincode || null,
    };
    if (existing) {
      await db.employee_addresses.update({ where: { id: existing.id }, data: payload });
      return { id: existing.id, updated: true };
    }
    const created = await db.employee_addresses.create({
      data: { ...payload, employee_id: employeeId },
    });
    return { id: created.id, created: true };
  },

  async copyLocalToPermanent(db, employeeId) {
    const local = await db.employee_addresses.findFirst({
      where: { employee_id: employeeId, address_type: 'local', deleted_at: null },
    });
    if (!local) throw new Error('No local address found');
    return addressService.upsert(db, employeeId, 'permanent', {
      houseNo: local.house_no,
      street: local.street,
      villageCity: local.village_city,
      district: local.district,
      state: local.state,
      country: local.country,
      pincode: local.pincode,
    });
  },
};

const educationService = {

  async list(db, employeeId) {
    const rows = await db.employee_education.findMany({
      where: { employee_id: employeeId, deleted_at: null },
      orderBy: [{ passing_year: 'desc' }],
    });
    return rows.map(r => ({
      id: r.id,
      eduLevel: r.edu_level,
      courseType: r.course_type,
      streamSubject: r.stream_subject,
      courseName: r.course_name,
      institutionName: r.institution_name,
      boardUniversity: r.board_university,
      passingYear: r.passing_year,
      percentage: r.percentage,
      grade: r.grade,
      rollNumber: r.roll_number,
      certificateUrl: r.certificate_url,
      isCurrent: r.is_current,
    }));
  },

  async create(db, employeeId, data) {
    const row = await db.employee_education.create({
      data: {
        employee_id: employeeId,
        edu_level: data.eduLevel,
        course_type: data.courseType || null,
        stream_subject: data.streamSubject || null,
        course_name: data.courseName || null,
        institution_name: data.institutionName || null,
        board_university: data.boardUniversity || null,
        passing_year: data.passingYear ? parseInt(data.passingYear, 10) : null,
        percentage: data.percentage ? parseFloat(data.percentage) : null,
        grade: data.grade || null,
        roll_number: data.rollNumber || null,
        certificate_url: data.certificateUrl || null,
        is_current: data.isCurrent || false,
      },
    });
    return { id: row.id };
  },

  async update(db, employeeId, eduId, data) {
    await db.employee_education.updateMany({
      where: { id: eduId, employee_id: employeeId, deleted_at: null },
      data: {
        edu_level: data.eduLevel,
        course_type: data.courseType || null,
        stream_subject: data.streamSubject || null,
        course_name: data.courseName || null,
        institution_name: data.institutionName || null,
        board_university: data.boardUniversity || null,
        passing_year: data.passingYear ? parseInt(data.passingYear, 10) : null,
        percentage: data.percentage ? parseFloat(data.percentage) : null,
        grade: data.grade || null,
        roll_number: data.rollNumber || null,
        certificate_url: data.certificateUrl || null,
        is_current: data.isCurrent || false,
        updated_at: new Date(),
      },
    });
    return { updated: true };
  },

  async remove(db, employeeId, eduId) {
    await db.employee_education.updateMany({
      where: { id: eduId, employee_id: employeeId },
      data: { deleted_at: new Date() },
    });
    return { deleted: true };
  },

  async bulkReplace(db, employeeId, rows) {
    if (!rows || rows.length === 0) return { count: 0 };

    await db.employee_education.updateMany({
      where: { employee_id: employeeId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    for (const row of rows) {
      if (row.eduLevel) await educationService.create(db, employeeId, row);
    }
    return { count: rows.filter(r => r.eduLevel).length };
  },
};

const familyService = {

  async list(db, employeeId) {
    const rows = await db.employee_family.findMany({
      where: { employee_id: employeeId, deleted_at: null },
      orderBy: { relationship: 'asc' },
    });
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      relationship: r.relationship,
      gender: r.gender,
      dateOfBirth: r.date_of_birth,
      age: r.age,
      isDependent: r.is_dependent,
      isNominee: r.is_nominee,
      nomineePercentage: r.nominee_percentage,
      nomineeFor: r.nominee_for,
      isMinor: r.is_minor,
      guardianName: r.guardian_name,
      guardianRelation: r.guardian_relation,
      disabilityStatus: r.disability_status,
      aadhaarMasked: r.aadhaar_number
        ? '****-****-' + (decrypt(r.aadhaar_number) || '').slice(-4)
        : null,
    }));
  },

  async create(db, employeeId, data) {
    const encAadhaar = data.aadhaarNumber
      ? encrypt(data.aadhaarNumber.replace(/\s/g, ''))
      : null;

    const row = await db.employee_family.create({
      data: {
        employee_id: employeeId,
        aadhaar_number: encAadhaar,
        name: data.name,
        date_of_birth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        age: data.age ? parseInt(data.age, 10) : null,
        relationship: data.relationship,
        gender: data.gender || null,
        is_dependent: data.isDependent || false,
        is_nominee: data.isNominee || false,
        nominee_percentage: parseFloat(data.nomineePercentage || 0),
        nominee_for: data.nomineeFor || null,
        is_minor: data.isMinor || false,
        guardian_name: data.guardianName || null,
        guardian_relation: data.guardianRelation || null,
        disability_status: data.disabilityStatus || false,
      },
    });
    return { id: row.id };
  },

  async update(db, employeeId, memberId, data) {
    const encAadhaar = data.aadhaarNumber
      ? encrypt(data.aadhaarNumber.replace(/\s/g, ''))
      : undefined;

    const payload = {
      name: data.name,
      date_of_birth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      age: data.age ? parseInt(data.age, 10) : null,
      relationship: data.relationship,
      gender: data.gender || null,
      is_dependent: data.isDependent || false,
      is_nominee: data.isNominee || false,
      nominee_percentage: parseFloat(data.nomineePercentage || 0),
      nominee_for: data.nomineeFor || null,
      is_minor: data.isMinor || false,
      guardian_name: data.guardianName || null,
      guardian_relation: data.guardianRelation || null,
      disability_status: data.disabilityStatus || false,
      updated_at: new Date(),
    };
    if (encAadhaar !== undefined) payload.aadhaar_number = encAadhaar;

    await db.employee_family.updateMany({
      where: { id: memberId, employee_id: employeeId, deleted_at: null },
      data: payload,
    });
    return { updated: true };
  },

  async remove(db, employeeId, memberId) {
    await db.employee_family.updateMany({
      where: { id: memberId, employee_id: employeeId },
      data: { deleted_at: new Date() },
    });
    return { deleted: true };
  },

  async validateNomineeTotal(db, employeeId) {
    const nominees = await db.employee_family.findMany({
      where: { employee_id: employeeId, is_nominee: true, deleted_at: null },
      select: { nominee_percentage: true },
    });
    const total = nominees.reduce((s, n) => s + (n.nominee_percentage || 0), 0);
    const rounded = Math.round(total * 100) / 100;
    return { total: rounded, valid: rounded === 0 || Math.abs(rounded - 100) < 0.01 };
  },

  async bulkReplace(db, employeeId, rows) {
    if (!rows || rows.length === 0) return { count: 0 };

    await db.employee_family.updateMany({
      where: { employee_id: employeeId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    for (const row of rows) {
      if (row.name && row.relationship) await familyService.create(db, employeeId, row);
    }
    return { count: rows.filter(r => r.name && r.relationship).length };
  },
};

const prevEmploymentService = {

  async list(db, employeeId) {
    const rows = await db.employee_prev_employment.findMany({
      where: { employee_id: employeeId, deleted_at: null },
      orderBy: { leaving_date: 'desc' },
    });
    return rows.map(r => ({
      id: r.id,
      isFresher: r.is_fresher,
      organizationName: r.organization_name,
      designation: r.designation,
      department: r.department,
      joiningDate: r.joining_date,
      leavingDate: r.leaving_date,
      lastCtcRupees: r.last_ctc ? Number(r.last_ctc) / 100 : null,
      reasonForLeaving: r.reason_for_leaving,
      referenceName: r.reference_name,
      referencePhone: r.reference_phone,
      experienceLetterUrl: r.experience_letter_url,
      relievingLetterUrl: r.relieving_letter_url,
    }));
  },

  async create(db, employeeId, data) {
    const row = await db.employee_prev_employment.create({
      data: {
        employee_id: employeeId,
        is_fresher: data.isFresher || false,
        organization_name: data.organizationName || null,
        designation: data.designation || null,
        department: data.department || null,
        joining_date: data.joiningDate ? new Date(data.joiningDate) : null,
        leaving_date: data.leavingDate ? new Date(data.leavingDate) : null,
        last_ctc: data.lastCtcRupees
          ? Math.round(parseFloat(data.lastCtcRupees) * 100)
          : null,
        reason_for_leaving: data.reasonForLeaving || null,
        reference_name: data.referenceName || null,
        reference_phone: data.referencePhone || null,
        experience_letter_url: data.experienceLetterUrl || null,
        relieving_letter_url: data.relievingLetterUrl || null,
      },
    });
    return { id: row.id };
  },

  async update(db, employeeId, prevId, data) {
    await db.employee_prev_employment.updateMany({
      where: { id: prevId, employee_id: employeeId, deleted_at: null },
      data: {
        is_fresher: data.isFresher || false,
        organization_name: data.organizationName || null,
        designation: data.designation || null,
        department: data.department || null,
        joining_date: data.joiningDate ? new Date(data.joiningDate) : null,
        leaving_date: data.leavingDate ? new Date(data.leavingDate) : null,
        last_ctc: data.lastCtcRupees
          ? Math.round(parseFloat(data.lastCtcRupees) * 100)
          : null,
        reason_for_leaving: data.reasonForLeaving || null,
        reference_name: data.referenceName || null,
        reference_phone: data.referencePhone || null,
        experience_letter_url: data.experienceLetterUrl || null,
        relieving_letter_url: data.relievingLetterUrl || null,
        updated_at: new Date(),
      },
    });
    return { updated: true };
  },

  async remove(db, employeeId, prevId) {
    await db.employee_prev_employment.updateMany({
      where: { id: prevId, employee_id: employeeId },
      data: { deleted_at: new Date() },
    });
    return { deleted: true };
  },

  async bulkReplace(db, employeeId, rows) {
    if (!rows || rows.length === 0) return { count: 0 };

    await db.employee_prev_employment.updateMany({
      where: { employee_id: employeeId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    for (const row of rows) {
      await prevEmploymentService.create(db, employeeId, row);
    }
    return { count: rows.length };
  },
};

async function checkAadhaar(db, companyId, userId, { aadhaarNumber, aadhaarHash }) {
  
  let hash = aadhaarHash;
  if (!hash && aadhaarNumber) {
    hash = hashAadhaar(aadhaarNumber);
  }
  if (!hash) {
    throw new Error('Unable to compute Aadhaar hash');
  }

  const encAadhaar = aadhaarNumber ? encrypt(aadhaarNumber.replace(/\s/g, '')) : null;
  let existingEmployee = null;
  if (encAadhaar) {
    existingEmployee = await db.employees.findFirst({
      where: {
        company_id: companyId,
        aadhaar_number: encAadhaar,
        deleted_at: null,
      },
      select: {
        id: true,
        employee_code: true,
        first_name: true,
        last_name: true,
      },
    });
  }

  if (existingEmployee) {
    return {
      status: 'exists',
      existing: {
        id: existingEmployee.id,
        employeeCode: existingEmployee.employee_code,
        name: `${existingEmployee.first_name} ${existingEmployee.last_name}`.trim(),
      },
    };
  }

  const draft = await db.employee_onboarding_draft.findFirst({
    where: {
      company_id: companyId,
      aadhaar_hash: hash,
      is_complete: false,
      expires_at: { gt: new Date() },
    },
    select: {
      id: true,
      current_step: true,
      employee_id: true,
    },
  });

  if (draft) {
    return {
      status: 'draft',
      draftId: draft.id,
      currentStep: draft.current_step,
      employeeId: draft.employee_id,
    };
  }

  const centralKyc = await findKycByHash(hash);
  if (centralKyc) {
    return {
      status: 'kyc_available',
      kycRecord: {
        id: centralKyc.id,
        createdAt: centralKyc.created_at,
        method: centralKyc.method,
        hasEmployee: !!centralKyc.employee_id,
      },
    };
  }

  let newDraftId = null;
  if (aadhaarNumber) {
    
    const draftResult = await draftService.createDraft(db, companyId, userId, aadhaarNumber);
    newDraftId = draftResult.draftId;
  }

  return {
    status: 'no_kyc',
    draftId: newDraftId,
  };
}

module.exports = {
  draftService,
  addressService,
  educationService,
  familyService,
  prevEmploymentService,
  checkAadhaar,   
};

