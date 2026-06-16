/**
 * @file recruitment.service.js
 * @description Recruitment module business logic with Mac-style enriched logging.
 */
const logger = require('../../shared/utils/logger');
const { THEME } = require('../../shared/utils/uiConstants');

const STAGES = ['applied', 'screening', 'interview', 'offer', 'joined', 'rejected'];

const candidateInclude = {
  job: {
    include: {
      requisition: { select: { job_title: true, department_id: true } },
    },
  },
  stage_history: { orderBy: { changed_at: 'desc' }, take: 5 },
  interviews:    { orderBy: { scheduled_at: 'desc' }, take: 3, include: { feedback: true } },
  offers:        { orderBy: { created_at: 'desc' }, take: 1 },
};

const parseJSON = (str, fallback = []) => {
  try { return JSON.parse(str); } catch { return fallback; }
};

const recruitmentService = {

  dashboard: async (db, companyId) => {
    logger.debug(`${THEME.ICONS.INFO} Fetching recruitment dashboard metrics for company: ${companyId}`);
    const [
      totalOpen, totalCandidates, interviews, offers, stageBreakdown, recentActivity,
    ] = await Promise.all([
      
      db.job_requisitions.count({
        where: { company_id: companyId, status: { in: ['approved','posted'] }, deleted_at: null },
      }),
      
      db.candidates.count({
        where: { company_id: companyId, deleted_at: null, stage: { notIn: ['joined','rejected'] } },
      }),
      
      db.interviews.count({
        where: {
          candidate: { company_id: companyId },
          scheduled_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          status: 'scheduled',
        },
      }),
      
      db.offers.count({
        where: {
          candidate: { company_id: companyId },
          status: 'generated',
        },
      }),
      
      db.candidates.groupBy({
        by: ['stage'],
        where: { company_id: companyId, deleted_at: null },
        _count: { id: true },
      }),
      
      db.candidates.findMany({
        where: { company_id: companyId, deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
          job: { include: { requisition: { select: { job_title: true } } } },
        },
      }),
    ]);

    const pipeline = STAGES.map(stage => ({
      stage,
      count: stageBreakdown.find(s => s.stage === stage)?._count?.id || 0,
    }));

    return { totalOpen, totalCandidates, interviews, pendingOffers: offers, pipeline, recentActivity };
  },

  listRequisitions: async (db, companyId, { status, cursor, limit = 20 } = {}) => {
    logger.debug(`${THEME.ICONS.PROCESS} Listing job requisitions for company ${companyId}${status ? ' with status: ' + status : ''}`);
    const where = { company_id: companyId, deleted_at: null };
    if (status) where.status = status;

    const items = await db.job_requisitions.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        job_postings: { select: { id: true, status: true, candidates: { select: { id: true } } } },
      },
    });

    const hasMore = items.length > limit;
    const data    = hasMore ? items.slice(0, -1) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      items: data.map(r => ({
        ...r,
        skills_required: parseJSON(r.skills_required),
        candidateCount:  r.job_postings.reduce((s, j) => s + j.candidates.length, 0),
      })),
      nextCursor,
    };
  },

  getRequisition: async (db, companyId, id) => {
    const req = await db.job_requisitions.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
      include: {
        job_postings: {
          include: {
            candidates: { where: { deleted_at: null }, orderBy: { created_at: 'desc' } },
          },
        },
      },
    });
    if (!req) throw new Error('NOT_FOUND');
    return { ...req, skills_required: parseJSON(req.skills_required) };
  },

  createRequisition: async (db, companyId, userId, data) => {
    logger.info(`${THEME.ICONS.PROCESS} Creating job requisition: ${data.jobTitle} (positions: ${data.positions})`);
    return db.job_requisitions.create({
      data: {
        company_id:      companyId,
        created_by:      userId,
        job_title:       data.jobTitle,
        department_id:   data.departmentId   || null,
        designation_id:  data.designationId  || null,
        positions:       data.positions       || 1,
        employment_type: data.employmentType  || null,
        experience_min:  data.experienceMin   || null,
        experience_max:  data.experienceMax   || null,
        salary_min:      data.salaryMin ? Math.round(data.salaryMin * 100) : null,
        salary_max:      data.salaryMax ? Math.round(data.salaryMax * 100) : null,
        job_description: data.jobDescription  || null,
        skills_required: JSON.stringify(data.skillsRequired || []),
        branch_id:       data.branchId        || null,
        target_date:     data.targetDate ? new Date(data.targetDate) : null,
        priority:        data.priority         || 'medium',
        status:          'pending_approval',
      },
    });
  },

  updateRequisition: async (db, companyId, id, data) => {
    logger.info(`${THEME.ICONS.EDIT} Updating job requisition: ${id}`);
    const existing = await db.job_requisitions.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!existing) throw new Error('NOT_FOUND');
    if (!['pending_approval','approved'].includes(existing.status)) throw new Error('CANNOT_EDIT');

    return db.job_requisitions.update({
      where: { id },
      data: {
        job_title:       data.jobTitle       || existing.job_title,
        department_id:   data.departmentId   ?? existing.department_id,
        designation_id:  data.designationId  ?? existing.designation_id,
        positions:       data.positions      ?? existing.positions,
        employment_type: data.employmentType ?? existing.employment_type,
        experience_min:  data.experienceMin  ?? existing.experience_min,
        experience_max:  data.experienceMax  ?? existing.experience_max,
        salary_min:      data.salaryMin ? Math.round(data.salaryMin * 100) : existing.salary_min,
        salary_max:      data.salaryMax ? Math.round(data.salaryMax * 100) : existing.salary_max,
        job_description: data.jobDescription ?? existing.job_description,
        skills_required: data.skillsRequired ? JSON.stringify(data.skillsRequired) : existing.skills_required,
        target_date:     data.targetDate ? new Date(data.targetDate) : existing.target_date,
        priority:        data.priority       || existing.priority,
      },
    });
  },

  approveRequisition: async (db, companyId, id, approvedBy) => {
    logger.info(`${THEME.ICONS.SUCCESS} Requisition approved: ${id} by user: ${approvedBy}`);
    const req = await db.job_requisitions.findFirst({ where: { id, company_id: companyId, deleted_at: null } });
    if (!req) throw new Error('NOT_FOUND');
    return db.job_requisitions.update({
      where: { id },
      data: { status: 'approved', approved_by: approvedBy },
    });
  },

  rejectRequisition: async (db, companyId, id) => {
    logger.warn(`${THEME.ICONS.ERROR} Requisition rejected: ${id}`);
    const req = await db.job_requisitions.findFirst({ where: { id, company_id: companyId, deleted_at: null } });
    if (!req) throw new Error('NOT_FOUND');
    return db.job_requisitions.update({ where: { id }, data: { status: 'rejected' } });
  },

  deleteRequisition: async (db, companyId, id) => {
    logger.warn(`${THEME.ICONS.LOCK} Soft-deleting requisition: ${id}`);
    const req = await db.job_requisitions.findFirst({ where: { id, company_id: companyId, deleted_at: null } });
    if (!req) throw new Error('NOT_FOUND');
    return db.job_requisitions.update({ where: { id }, data: { deleted_at: new Date() } });
  },

  listJobs: async (db, companyId, { status } = {}) => {
    logger.debug(`${THEME.ICONS.INFO} Listing active job postings for company: ${companyId}`);
    const where = { company_id: companyId };
    if (status) where.status = status;

    const jobs = await db.job_postings.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        requisition: {
          select: { job_title: true, positions: true, filled_count: true, priority: true, department_id: true },
        },
        candidates: { where: { deleted_at: null }, select: { id: true, stage: true } },
      },
    });

    return jobs.map(j => ({
      ...j,
      pipelineCounts: STAGES.reduce((acc, s) => {
        acc[s] = j.candidates.filter(c => c.stage === s).length;
        return acc;
      }, {}),
    }));
  },

  getJob: async (db, companyId, id) => {
    const job = await db.job_postings.findFirst({
      where: { id, company_id: companyId },
      include: {
        requisition: true,
        candidates: {
          where: { deleted_at: null },
          orderBy: { created_at: 'desc' },
          include: {
            interviews: { orderBy: { scheduled_at: 'desc' }, take: 1 },
            offers:     { orderBy: { created_at: 'desc' }, take: 1 },
          },
        },
      },
    });
    if (!job) throw new Error('NOT_FOUND');
    return { ...job, requisition: { ...job.requisition, skills_required: parseJSON(job.requisition.skills_required) } };
  },

  postJob: async (db, companyId, data) => {
    logger.info(`${THEME.ICONS.BROWSER} Posting job for requisition: ${data.requisitionId}`);
    const req = await db.job_requisitions.findFirst({
      where: { id: data.requisitionId, company_id: companyId, status: 'approved', deleted_at: null },
    });
    if (!req) throw new Error('REQUISITION_NOT_APPROVED');

    const posting = await db.job_postings.create({
      data: {
        requisition_id:   data.requisitionId,
        company_id:       companyId,
        post_internal:    data.postInternal    || false,
        post_career_page: data.postCareerPage  || false,
        post_naukri:      data.postNaukri      || false,
        post_linkedin:    data.postLinkedin    || false,
        post_indeed:      data.postIndeed      || false,
        deadline:         data.deadline ? new Date(data.deadline) : null,
        status:           'active',
      },
    });

    await db.job_requisitions.update({
      where: { id: data.requisitionId },
      data:  { status: 'posted' },
    });

    return posting;
  },

  closeJob: async (db, companyId, id) => {
    logger.info(`${THEME.ICONS.LOCK} Closing job posting: ${id}`);
    const job = await db.job_postings.findFirst({ where: { id, company_id: companyId } });
    if (!job) throw new Error('NOT_FOUND');
    return db.job_postings.update({ where: { id }, data: { status: 'closed' } });
  },

  listCandidates: async (db, companyId, { jobId, stage, search, cursor, limit = 30 } = {}) => {
    logger.debug(`${THEME.ICONS.USER} Listing candidates for company: ${companyId}`);
    const where = { company_id: companyId, deleted_at: null };
    if (jobId) where.job_id = jobId;
    if (stage) where.stage = stage;
    if (search) {
      where.OR = [
        { first_name: { contains: search } },
        { last_name:  { contains: search } },
        { email:      { contains: search } },
        { phone:      { contains: search } },
      ];
    }

    const items = await db.candidates.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        job: { include: { requisition: { select: { job_title: true } } } },
        interviews: { orderBy: { scheduled_at: 'desc' }, take: 1 },
        offers:     { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    const hasMore = items.length > limit;
    const data    = hasMore ? items.slice(0, -1) : items;
    return { items: data, nextCursor: hasMore ? data[data.length - 1].id : null };
  },

  getCandidate: async (db, companyId, id) => {
    const c = await db.candidates.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
      include: candidateInclude,
    });
    if (!c) throw new Error('NOT_FOUND');
    return c;
  },

  addCandidate: async (db, companyId, data) => {
    logger.info(`${THEME.ICONS.USER} Adding new candidate: ${data.firstName} ${data.lastName} for job: ${data.jobId}`);
    
    const duplicate = await db.candidates.findFirst({
      where: {
        company_id: companyId,
        deleted_at: null,
        OR: [
          data.email ? { email: data.email } : undefined,
          data.phone ? { phone: data.phone } : undefined,
        ].filter(Boolean),
      },
    });

    const candidate = await db.candidates.create({
      data: {
        company_id:     companyId,
        job_id:         data.jobId,
        first_name:     data.firstName,
        last_name:      data.lastName     || null,
        email:          data.email        || null,
        phone:          data.phone        || null,
        resume_url:     data.resumeUrl    || null,
        experience_years: data.experienceYears || null,
        current_ctc:    data.currentCtc ? Math.round(data.currentCtc * 100) : null,
        expected_ctc:   data.expectedCtc ? Math.round(data.expectedCtc * 100) : null,
        notice_period:  data.noticePeriod || null,
        source:         data.source       || 'other',
        source_detail:  data.sourceDetail || null,
        stage:          'applied',
        is_duplicate:   !!duplicate,
      },
    });

    if (duplicate) logger.warn(`${THEME.ICONS.WARNING} Duplicate candidate detected for email/phone: ${data.email || data.phone}`);

    await db.candidate_stage_history.create({
      data: {
        candidate_id: candidate.id,
        to_stage:     'applied',
        notes:        'Candidate added',
      },
    });

    return { candidate, isDuplicate: !!duplicate };
  },

  updateCandidate: async (db, companyId, id, data) => {
    logger.info(`${THEME.ICONS.EDIT} Updating candidate profile: ${id}`);
    const c = await db.candidates.findFirst({ where: { id, company_id: companyId, deleted_at: null } });
    if (!c) throw new Error('NOT_FOUND');
    return db.candidates.update({
      where: { id },
      data: {
        first_name:      data.firstName      || c.first_name,
        last_name:       data.lastName       ?? c.last_name,
        email:           data.email          ?? c.email,
        phone:           data.phone          ?? c.phone,
        experience_years: data.experienceYears ?? c.experience_years,
        current_ctc:     data.currentCtc  ? Math.round(data.currentCtc * 100)  : c.current_ctc,
        expected_ctc:    data.expectedCtc ? Math.round(data.expectedCtc * 100) : c.expected_ctc,
        notice_period:   data.noticePeriod   ?? c.notice_period,
        source:          data.source         || c.source,
        source_detail:   data.sourceDetail   ?? c.source_detail,
      },
    });
  },

  moveStage: async (db, companyId, id, { toStage, notes, changedBy }) => {
    logger.info(`${THEME.ICONS.PROCESS} Moving candidate ${id} to stage: ${toStage}`);
    const c = await db.candidates.findFirst({ where: { id, company_id: companyId, deleted_at: null } });
    if (!c) throw new Error('NOT_FOUND');
    if (!STAGES.includes(toStage)) throw new Error('INVALID_STAGE');

    const [updated] = await db.$transaction([
      db.candidates.update({ where: { id }, data: { stage: toStage } }),
      db.candidate_stage_history.create({
        data: {
          candidate_id: id,
          from_stage:   c.stage,
          to_stage:     toStage,
          changed_by:   changedBy || null,
          notes:        notes || null,
        },
      }),
    ]);
    return updated;
  },

  convertToEmployee: async (db, companyId, candidateId, data) => {
    logger.info(`${THEME.ICONS.SUCCESS} Converting candidate ${candidateId} to employee status`);
    const c = await db.candidates.findFirst({
      where: { id: candidateId, company_id: companyId, deleted_at: null },
      include: { job: { include: { requisition: true } } },
    });
    if (!c) throw new Error('NOT_FOUND');

    const count = await db.employees.count({ where: { company_id: companyId } });
    const code  = `EMP${String(count + 1).padStart(4, '0')}`;

    const employee = await db.employees.create({
      data: {
        company_id:         companyId,
        employee_code:      code,
        first_name:         c.first_name,
        last_name:          c.last_name        || '',
        work_email:         c.email            || `${code.toLowerCase()}@company.com`,
        phone:              c.phone            || null,
        department_id:      c.job.requisition?.department_id || null,
        designation_id:     c.job.requisition?.designation_id || null,
        date_of_joining:    data.joiningDate ? new Date(data.joiningDate) : new Date(),
        employment_type:    c.job.requisition?.employment_type || 'permanent',
        status:             'active',
        candidate_id:       candidateId,
      },
    });

    await db.candidates.update({ where: { id: candidateId }, data: { stage: 'joined' } });
    await db.candidate_stage_history.create({
      data: { candidate_id: candidateId, from_stage: c.stage, to_stage: 'joined', notes: `Converted to employee ${code}` },
    });

    await db.job_requisitions.update({
      where: { id: c.job.requisition_id },
      data:  { filled_count: { increment: 1 } },
    });

    return { employee, employeeCode: code };
  },

  deleteCandidate: async (db, companyId, id) => {
    logger.warn(`${THEME.ICONS.LOCK} Soft-deleting candidate: ${id}`);
    const c = await db.candidates.findFirst({ where: { id, company_id: companyId, deleted_at: null } });
    if (!c) throw new Error('NOT_FOUND');
    return db.candidates.update({ where: { id }, data: { deleted_at: new Date() } });
  },

  listInterviews: async (db, companyId, { candidateId, upcoming } = {}) => {
    logger.debug(`${THEME.ICONS.INFO} Listing interviews for company: ${companyId}`);
    const where = { candidate: { company_id: companyId } };
    if (candidateId) where.candidate_id = candidateId;
    if (upcoming)    where.scheduled_at = { gte: new Date() };

    return db.interviews.findMany({
      where,
      orderBy: { scheduled_at: 'asc' },
      include: {
        candidate: { select: { first_name: true, last_name: true } },
        feedback:  true,
      },
    });
  },

  getInterview: async (db, id) => {
    return db.interviews.findFirst({
      where: { id },
      include: {
        candidate: { select: { id: true, first_name: true, last_name: true, email: true } },
        feedback: true,
      },
    });
  },

  scheduleInterview: async (db, companyId, data) => {
    logger.info(`${THEME.ICONS.WAIT} Scheduling interview round ${data.roundNumber} for candidate: ${data.candidateId}`);
    const candidate = await db.candidates.findFirst({
      where: { id: data.candidateId, company_id: companyId, deleted_at: null },
    });
    if (!candidate) throw new Error('NOT_FOUND');

    const interview = await db.interviews.create({
      data: {
        candidate_id:    data.candidateId,
        round_number:    data.roundNumber    || 1,
        interview_type:  data.interviewType  || 'in_person',
        scheduled_at:    new Date(data.scheduledAt),
        duration_mins:   data.durationMins   || 60,
        interviewer_ids: JSON.stringify(data.interviewerIds || []),
        venue:           data.venue          || null,
        meeting_link:    data.meetingLink    || null,
        status:          'scheduled',
      },
    });

    if (['applied','screening'].includes(candidate.stage)) {
      await db.candidates.update({ where: { id: data.candidateId }, data: { stage: 'interview' } });
      await db.candidate_stage_history.create({
        data: { candidate_id: data.candidateId, from_stage: candidate.stage, to_stage: 'interview', notes: 'Interview scheduled' },
      });
    }

    return interview;
  },

  updateInterview: async (db, id, data) => {
    logger.info(`${THEME.ICONS.EDIT} Updating interview details: ${id}`);
    return db.interviews.update({
      where: { id },
      data: {
        scheduled_at:   data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        duration_mins:  data.durationMins   || undefined,
        venue:          data.venue          ?? undefined,
        meeting_link:   data.meetingLink    ?? undefined,
        interviewer_ids: data.interviewerIds ? JSON.stringify(data.interviewerIds) : undefined,
      },
    });
  },

  cancelInterview: async (db, id) => {
    logger.warn(`${THEME.ICONS.ERROR} Cancelling interview: ${id}`);
    return db.interviews.update({ where: { id }, data: { status: 'cancelled' } });
  },

  submitFeedback: async (db, interviewId, interviewerId, data) => {
    logger.info(`${THEME.ICONS.PROCESS} Submitting interview feedback for interview: ${interviewId}`);
    
    const existing = await db.interview_feedback.findFirst({
      where: { interview_id: interviewId, interviewer_id: interviewerId },
    });

    const payload = {
      skill_ratings:  JSON.stringify(data.skillRatings || {}),
      overall_rating: data.overallRating,
      recommendation: data.recommendation, 
      comments:       data.comments || null,
    };

    if (existing) {
      return db.interview_feedback.update({ where: { id: existing.id }, data: payload });
    }

    return db.interview_feedback.create({
      data: {
        interview_id:    interviewId,
        interviewer_id:  interviewerId,
        ...payload,
      },
    });
  },

  createOffer: async (db, companyId, data) => {
    logger.info(`${THEME.ICONS.LOCK} Generating offer for candidate: ${data.candidateId}`);
    const candidate = await db.candidates.findFirst({
      where: { id: data.candidateId, company_id: companyId, deleted_at: null },
    });
    if (!candidate) throw new Error('NOT_FOUND');

    const offer = await db.offers.create({
      data: {
        candidate_id: data.candidateId,
        offered_ctc:  data.offeredCtc ? Math.round(data.offeredCtc * 100) : null,
        joining_date: data.joiningDate ? new Date(data.joiningDate) : null,
        created_by:   data.createdBy || null,
        status:       'generated',
      },
    });

    if (candidate.stage !== 'offer') {
      await db.candidates.update({ where: { id: data.candidateId }, data: { stage: 'offer' } });
      await db.candidate_stage_history.create({
        data: { candidate_id: data.candidateId, from_stage: candidate.stage, to_stage: 'offer', notes: 'Offer generated' },
      });
    }

    return offer;
  },

  acceptOffer: async (db, id) => {
    logger.info(`${THEME.ICONS.SUCCESS} Candidate accepted offer: ${id}`);
    const offer = await db.offers.findFirst({ where: { id } });
    if (!offer) throw new Error('NOT_FOUND');
    return db.offers.update({
      where: { id },
      data: { status: 'accepted', accepted_at: new Date() },
    });
  },

  declineOffer: async (db, id) => {
    logger.warn(`${THEME.ICONS.ERROR} Candidate declined offer: ${id}`);
    const offer = await db.offers.findFirst({ where: { id }, include: { candidate: true } });
    if (!offer) throw new Error('NOT_FOUND');
    await db.offers.update({ where: { id }, data: { status: 'declined' } });
    
    await db.candidates.update({ where: { id: offer.candidate_id }, data: { stage: 'rejected' } });
    return { declined: true };
  },
};

module.exports = recruitmentService;

