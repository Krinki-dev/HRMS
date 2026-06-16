const assetsService = {

  dashboard: async (db, companyId) => {
    const [total, available, allocated, underRepair] = await Promise.all([
      db.assets.count({ where: { company_id: companyId, deleted_at: null } }),
      db.assets.count({ where: { company_id: companyId, deleted_at: null, status: 'available' } }),
      db.assets.count({ where: { company_id: companyId, deleted_at: null, status: 'allocated' } }),
      db.assets.count({ where: { company_id: companyId, deleted_at: null, status: 'under_repair' } }),
    ]);

    const soon = new Date(); soon.setDate(soon.getDate() + 30);
    const warrantyExpiring = await db.assets.count({
      where: { company_id: companyId, deleted_at: null, warranty_expiry: { lte: soon, gte: new Date() } },
    });

    const byCategory = await db.assets.groupBy({
      by: ['category'],
      where: { company_id: companyId, deleted_at: null },
      _count: { id: true },
    });

    return { total, available, allocated, underRepair, warrantyExpiring, byCategory };
  },

  list: async (db, companyId, { status, category, search, cursor, limit = 30 } = {}) => {
    const where = { company_id: companyId, deleted_at: null };
    if (status)   where.status   = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name:          { contains: search } },
        { serial_number: { contains: search } },
        { brand:         { contains: search } },
      ];
    }

    const items = await db.assets.findMany({
      where,
      include: {
        allocations: {
          where: { returned_at: null },
          take:  1,
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const empIds = items.flatMap(a => a.allocations.map(al => al.employee_id)).filter(Boolean);
    const emps   = empIds.length ? await db.employees.findMany({
      where: { id: { in: empIds } },
      select: { id: true, first_name: true, last_name: true, employee_code: true },
    }) : [];
    const empMap = Object.fromEntries(emps.map(e => [e.id, e]));

    const hasMore = items.length > limit;
    const data    = hasMore ? items.slice(0, -1) : items;
    return {
      data: data.map(a => ({
        ...a,
        currentHolder: a.allocations[0] ? empMap[a.allocations[0].employee_id] || null : null,
      })),
      pagination: { hasMore, cursor: hasMore ? data[data.length - 1].id : null },
    };
  },

  create: async (db, companyId, data) => {
    return db.assets.create({
      data: {
        company_id:      companyId,
        name:            data.name,
        category:        data.category,
        brand:           data.brand           || null,
        model:           data.model           || null,
        serial_number:   data.serialNumber    || null,
        purchase_date:   data.purchaseDate    ? new Date(data.purchaseDate)    : null,
        purchase_price:  data.purchasePrice   ? parseInt(data.purchasePrice)   : null,
        vendor_name:     data.vendorName      || null,
        warranty_expiry: data.warrantyExpiry  ? new Date(data.warrantyExpiry)  : null,
        amc_expiry:      data.amcExpiry       ? new Date(data.amcExpiry)       : null,
        branch_id:       data.branchId        || null,
        condition:       data.condition       || 'good',
        notes:           data.notes           || null,
        status:          'available',
      },
    });
  },

  get: async (db, companyId, id) => {
    const a = await db.assets.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
      include: {
        allocations: { orderBy: { created_at: 'desc' } },
      },
    });
    if (!a) throw new Error('NOT_FOUND');

    const empIds = a.allocations.map(al => al.employee_id);
    const emps   = empIds.length ? await db.employees.findMany({
      where: { id: { in: empIds } },
      select: { id: true, first_name: true, last_name: true, employee_code: true },
    }) : [];
    const empMap = Object.fromEntries(emps.map(e => [e.id, e]));

    return {
      ...a,
      allocations: a.allocations.map(al => ({ ...al, employee: empMap[al.employee_id] || null })),
    };
  },

  update: async (db, companyId, id, data) => {
    const a = await db.assets.findFirst({ where: { id, company_id: companyId } });
    if (!a) throw new Error('NOT_FOUND');
    return db.assets.update({
      where: { id },
      data: {
        name:            data.name           ?? a.name,
        brand:           data.brand          ?? a.brand,
        model:           data.model          ?? a.model,
        serial_number:   data.serialNumber   ?? a.serial_number,
        condition:       data.condition      ?? a.condition,
        warranty_expiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : a.warranty_expiry,
        amc_expiry:      data.amcExpiry      ? new Date(data.amcExpiry)      : a.amc_expiry,
        notes:           data.notes          ?? a.notes,
        status:          data.status         ?? a.status,
      },
    });
  },

  remove: async (db, companyId, id) => {
    const active = await db.asset_allocations.findFirst({ where: { asset_id: id, returned_at: null } });
    if (active) throw new Error('ASSET_ALLOCATED');
    return db.assets.update({ where: { id }, data: { deleted_at: new Date() } });
  },

  allocate: async (db, companyId, assetId, { employeeId, allocatedDate, conditionAtAlloc, allocatedBy }) => {
    const asset = await db.assets.findFirst({ where: { id: assetId, company_id: companyId } });
    if (!asset) throw new Error('NOT_FOUND');
    if (asset.status === 'allocated') throw new Error('ALREADY_ALLOCATED');

    const alloc = await db.asset_allocations.create({
      data: {
        asset_id:           assetId,
        employee_id:        employeeId,
        allocated_date:     allocatedDate ? new Date(allocatedDate) : new Date(),
        condition_at_alloc: conditionAtAlloc || asset.condition,
        allocated_by:       allocatedBy || null,
      },
    });

    await db.assets.update({ where: { id: assetId }, data: { status: 'allocated' } });
    return alloc;
  },

  returnAsset: async (db, companyId, assetId, { returnDate, conditionAtReturn, damageNotes, deductFromFnF, deductionAmount }) => {
    const alloc = await db.asset_allocations.findFirst({
      where: { asset_id: assetId, returned_at: null },
    });
    if (!alloc) throw new Error('NOT_ALLOCATED');

    await db.asset_allocations.update({
      where: { id: alloc.id },
      data: {
        returned_at:         returnDate ? new Date(returnDate) : new Date(),
        condition_at_return: conditionAtReturn || null,
        damage_notes:        damageNotes       || null,
        deduct_from_fnf:     deductFromFnF     || false,
        deduction_amount:    deductionAmount   ? parseInt(deductionAmount) : null,
      },
    });

    const newStatus = conditionAtReturn === 'damaged' ? 'under_repair' : 'available';
    await db.assets.update({ where: { id: assetId }, data: { status: newStatus } });
    return { returned: true };
  },

  byEmployee: async (db, companyId, employeeId) => {
    const allocations = await db.asset_allocations.findMany({
      where: { employee_id: employeeId, returned_at: null },
      include: { asset: true },
    });
    return allocations;
  },
};

module.exports = assetsService;

