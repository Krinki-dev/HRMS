const expensesService = {

  listClaims: async (db, employeeId, companyId, { status, mine } = {}) => {
    
    const where = mine
      ? { employee_id: employeeId, employee: { company_id: companyId } }
      : { employee: { company_id: companyId } };

    if (status) where.status = status;

    const claims = await db.expense_claims.findMany({
      where,
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });

    const empIds = [...new Set(claims.map(c => c.employee_id))];
    const emps   = empIds.length ? await db.employees.findMany({
      where:  { id: { in: empIds } },
      select: { id: true, first_name: true, last_name: true, employee_code: true },
    }) : [];
    const empMap = Object.fromEntries(emps.map(e => [e.id, e]));

    return claims.map(c => ({ ...c, employee: empMap[c.employee_id] || null }));
  },

  pendingApprovals: async (db, companyId) => {
    return expensesService.listClaims(db, null, companyId, { status: 'pending' });
  },

  getClaim: async (db, id, employeeId, companyId) => {
    const c = await db.expense_claims.findFirst({
      where: {
        id,
        OR: [
          { employee_id: employeeId },
          { employee: { company_id: companyId } },
        ],
      },
      include: { items: true },
    });
    if (!c) throw new Error('NOT_FOUND');
    return c;
  },

  createClaim: async (db, employeeId, data) => {
    if (!data.items?.length) throw new Error('NO_ITEMS');

    const items = data.items.map(i => ({
      category:     i.category,
      description:  i.description  || null,
      expense_date: new Date(i.expenseDate),
      amount:       parseInt(i.amount),
      receipt_url:  i.receiptUrl   || null,
    }));

    const total = items.reduce((s, i) => s + i.amount, 0);

    return db.expense_claims.create({
      data: {
        employee_id:  employeeId,
        total_amount: total,
        status:       'pending',
        notes:        data.notes || null,
        items:        { create: items },
      },
      include: { items: true },
    });
  },

  approveClaim: async (db, companyId, claimId, approverId, { approveItems, notes } = {}) => {
    const claim = await db.expense_claims.findFirst({
      where:   { id: claimId, employee: { company_id: companyId } },
      include: { items: true },
    });
    if (!claim) throw new Error('NOT_FOUND');

    let approvedAmount = 0;

    if (approveItems?.length) {
      for (const ai of approveItems) {
        await db.expense_items.update({
          where: { id: ai.itemId },
          data: {
            is_approved:      ai.approved,
            approved_amount:  ai.approved ? parseInt(ai.approvedAmount || 0) : 0,
            rejection_reason: ai.approved ? null : (ai.reason || null),
          },
        });
        if (ai.approved) approvedAmount += parseInt(ai.approvedAmount || 0);
      }
    } else {
      approvedAmount = claim.total_amount;
      await db.expense_items.updateMany({
        where: { claim_id: claimId },
        data:  { is_approved: true },
      });
    }

    return db.expense_claims.update({
      where: { id: claimId },
      data: {
        status:          'approved',
        approved_amount: approvedAmount,
        approved_by:     approverId,
        approved_at:     new Date(),
        notes:           notes || claim.notes,
      },
    });
  },

  rejectClaim: async (db, companyId, claimId, approverId, { reason } = {}) => {
    const claim = await db.expense_claims.findFirst({
      where: { id: claimId, employee: { company_id: companyId } },
    });
    if (!claim) throw new Error('NOT_FOUND');

    return db.expense_claims.update({
      where: { id: claimId },
      data: {
        status:      'rejected',
        approved_by: approverId,
        approved_at: new Date(),
        notes:       reason || null,
      },
    });
  },

  deleteClaim: async (db, employeeId, claimId) => {
    const claim = await db.expense_claims.findFirst({
      where: { id: claimId, employee_id: employeeId },
    });
    if (!claim)                     throw new Error('NOT_FOUND');
    if (claim.status !== 'pending') throw new Error('CANNOT_DELETE');

    await db.expense_items.deleteMany({ where: { claim_id: claimId } });
    return db.expense_claims.delete({ where: { id: claimId } });
  },

  listPolicies: async (db, companyId) => {
    return db.expense_policies.findMany({
      where:   { company_id: companyId, is_active: true },
      orderBy: { category: 'asc' },
    });
  },

  createPolicy: async (db, companyId, data) => {
    return db.expense_policies.create({
      data: {
        company_id:              companyId,
        category:                data.category,
        max_amount:              data.maxAmount              ? parseInt(data.maxAmount)              : null,
        receipt_required_above:  data.receiptRequiredAbove   ? parseInt(data.receiptRequiredAbove)   : null,
        is_active:               true,
      },
    });
  },

  updatePolicy: async (db, companyId, id, data) => {
    const p = await db.expense_policies.findFirst({ where: { id, company_id: companyId } });
    if (!p) throw new Error('NOT_FOUND');

    return db.expense_policies.update({
      where: { id },
      data: {
        max_amount:             data.maxAmount             != null ? parseInt(data.maxAmount)             : p.max_amount,
        receipt_required_above: data.receiptRequiredAbove  != null ? parseInt(data.receiptRequiredAbove)  : p.receipt_required_above,
        is_active:              data.isActive              ?? p.is_active,
      },
    });
  },

  uploadReceipt: async (db, companyId, file) => {
    try {
      const minio = require('../../shared/utils/minio');
      const objectName = await minio.uploadFile(companyId, 'expenses', file.buffer, file.originalname, file.mimetype);
      const url        = await minio.getPresignedUrl(objectName);
      return { objectName, url };
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND' || e.message?.includes('not configured')) {
        throw new Error('FILE_STORAGE_NOT_CONFIGURED');
      }
      throw e;
    }
  },

};

module.exports = expensesService;

