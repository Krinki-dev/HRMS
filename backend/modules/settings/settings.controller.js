const svc  = require('./settings.service');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const { resolveTenantId } = require('../../shared/utils/tenantResolver');

const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) {
    if (e.message === 'NOT_FOUND')       return sendError(res, ERROR_CODES.NOT_FOUND,  'Not found.', 404);
    if (e.message === 'NAME_REQUIRED')   return sendError(res, ERROR_CODES.VALIDATION, 'Name is required.');
    if (e.message === 'DUPLICATE')       return sendError(res, ERROR_CODES.VALIDATION, 'Already exists with this name.');
    if (e.message === 'DUPLICATE_DATE')  return sendError(res, ERROR_CODES.VALIDATION, 'A holiday already exists on this date.');
    if (e.message === 'HAS_EMPLOYEES')   return sendError(res, ERROR_CODES.VALIDATION, 'Cannot delete — employees are assigned to this.');
    if (e.message === 'SHIFT_IN_USE')    return sendError(res, ERROR_CODES.VALIDATION, 'Cannot delete — employees are on this shift.');
    if (e.message === 'MISSING_FIELDS')  return sendError(res, ERROR_CODES.VALIDATION, 'Name, start time and end time are required.');
    console.error('[Settings]', e.message);
    sendError(res, ERROR_CODES.SERVER, 'Server error.', 500);
  }
};

module.exports = {
  
  getCompany:    wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.getCompany(req.db, tenantId)); }),
  updateCompany: wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.updateCompany(req.db, tenantId, req.body), 'Company profile updated.'); }),

  listHolidays:         wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.listHolidays(req.db, tenantId, req.query.year)); }),
  addHoliday:           wrap(async (req, res) => {
    if (!req.body.name || !req.body.date) return sendError(res, ERROR_CODES.VALIDATION, 'Name and date required.');
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.addHoliday(req.db, tenantId, req.body), 'Holiday added.', 201);
  }),
  loadNationalHolidays: wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.loadNationalHolidays(req.db, tenantId, req.body.year), 'National holidays loaded.'); }),
  updateHoliday:        wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.updateHoliday(req.db, tenantId, req.params.id, req.body), 'Holiday updated.'); }),
  deleteHoliday:        wrap(async (req, res) => { const tenantId = await resolveTenantId(req); await svc.deleteHoliday(req.db, tenantId, req.params.id); sendSuccess(res, null, 'Holiday deleted.'); }),

  listShifts:   wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.listShifts(req.db, tenantId)); }),
  createShift:  wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.createShift(req.db, tenantId, req.body), 'Shift created.', 201); }),
  updateShift:  wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.updateShift(req.db, tenantId, req.params.id, req.body), 'Shift updated.'); }),
  deleteShift:  wrap(async (req, res) => { const tenantId = await resolveTenantId(req); await svc.deleteShift(req.db, tenantId, req.params.id); sendSuccess(res, null, 'Shift deleted.'); }),
  assignShift:  wrap(async (req, res) => {
    if (!req.body.employeeIds?.length) return sendError(res, ERROR_CODES.VALIDATION, 'employeeIds required.');
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.assignShift(req.db, tenantId, req.params.id, req.body), 'Shift assigned.');
  }),

  listDepartments:   wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.listDepartments(req.db, tenantId)); }),
  createDepartment:  wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.createDepartment(req.db, tenantId, req.body), 'Department created.', 201); }),
  updateDepartment:  wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.updateDepartment(req.db, tenantId, req.params.id, req.body), 'Department updated.'); }),
  deleteDepartment:  wrap(async (req, res) => { const tenantId = await resolveTenantId(req); await svc.deleteDepartment(req.db, tenantId, req.params.id); sendSuccess(res, null, 'Department deleted.'); }),

  listDesignations:  wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.listDesignations(req.db, tenantId)); }),
  createDesignation: wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.createDesignation(req.db, tenantId, req.body), 'Designation created.', 201); }),
  updateDesignation: wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.updateDesignation(req.db, tenantId, req.params.id, req.body), 'Designation updated.'); }),
  deleteDesignation: wrap(async (req, res) => { const tenantId = await resolveTenantId(req); await svc.deleteDesignation(req.db, tenantId, req.params.id); sendSuccess(res, null, 'Designation deleted.'); }),

  listBranches:  wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.listBranches(req.db, tenantId)); }),
  createBranch:  wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.createBranch(req.db, tenantId, req.body), 'Branch created.', 201); }),
  updateBranch:  wrap(async (req, res) => { const tenantId = await resolveTenantId(req); return sendSuccess(res, await svc.updateBranch(req.db, tenantId, req.params.id, req.body), 'Branch updated.'); }),
  deleteBranch:  wrap(async (req, res) => { const tenantId = await resolveTenantId(req); await svc.deleteBranch(req.db, tenantId, req.params.id); sendSuccess(res, null, 'Branch deleted.'); }),
  
  getDbConfig: async (req, res) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const central = new PrismaClient({ datasources: { db: { url: process.env.CENTRAL_DATABASE_URL } } });
      const tenantId = await resolveTenantId(req);
      let cfg = await central.tenant_db_config.findFirst({ where: { company_id: tenantId } });
      await central.$disconnect();
      if (!cfg) cfg = { db_mode:'local', local_db_type:'sqlserver', local_db_host:'localhost',
                        local_db_port:55747, local_db_name:'hrms_dev_tenant',
                        local_db_user:null, cloud_db_url:null, sync_interval_min:5 };
      const safe = { ...cfg };
      delete safe.local_db_pass;
      return res.json({ success:true, data:safe });
    } catch(e) { return res.status(500).json({ success:false, message:e.message }); }
  },

  updateDbConfig: async (req, res) => {
    try {
      const { dbMode, localDbType, localDbHost, localDbPort, localDbName,
              localDbUser, localDbPass, cloudDbUrl, syncIntervalMin } = req.body;
      if (!['local','cloud'].includes(dbMode))
        return res.status(400).json({ success:false, message:'dbMode must be local or cloud' });
      if (dbMode === 'cloud' && !cloudDbUrl?.trim())
        return res.status(400).json({ success:false, message:'Cloud database URL is required' });
      if (dbMode === 'local' && (!localDbHost || !localDbName))
        return res.status(400).json({ success:false, message:'Host and database name are required' });
      const { PrismaClient } = require('@prisma/client');
      const central = new PrismaClient({ datasources: { db: { url: process.env.CENTRAL_DATABASE_URL } } });
      const data = {
        db_mode:           dbMode,
        local_db_type:     localDbType   || 'sqlserver',
        local_db_host:     localDbHost   || null,
        local_db_port:     localDbPort   ? parseInt(localDbPort) : null,
        local_db_name:     localDbName   || null,
        local_db_user:     localDbUser   || null,
        cloud_db_url:      dbMode === 'cloud' ? (cloudDbUrl?.trim() || null) : null,
        sync_interval_min: syncIntervalMin ? parseInt(syncIntervalMin) : 5,
      };
      if (localDbPass?.trim()) data.local_db_pass = localDbPass.trim();
      const tenantId = await resolveTenantId(req);
      await central.tenant_db_config.upsert({
        where:  { company_id: tenantId },
        create: { company_id: tenantId, ...data },
        update: data,
      });
      await central.$disconnect();
      return res.json({ success:true, data:null,
        message: dbMode === 'cloud'
          ? 'Saved. Update DEV_TENANT_DATABASE_URL in .env and restart.'
          : 'Saved. Using local SQL Server.' });
    } catch(e) { return res.status(500).json({ success:false, message:e.message }); }
  },

  testDbConnection: async (req, res) => {
    try {
      const { dbMode, cloudDbUrl, localDbHost, localDbPort, localDbName, localDbUser, localDbPass } = req.body;
      let testUrl;
      if (dbMode === 'cloud') {
        testUrl = cloudDbUrl;
      } else {
        const auth = localDbUser
          ? `;user=${localDbUser};password=${localDbPass || ''}`
          : ';integratedSecurity=true';
        testUrl = `sqlserver://${localDbHost}:${localDbPort || 55747};database=${localDbName};trustServerCertificate=true${auth}`;
      }
      if (!testUrl) return res.status(400).json({ success:false, message:'No URL to test' });
      const { PrismaClient } = require('@prisma/client');
      const test = new PrismaClient({ datasources: { db: { url: testUrl } } });
      await test.$queryRaw`SELECT 1 AS test`;
      await test.$disconnect();
      return res.json({ success:true, data:null, message:'Connection successful ✓' });
    } catch(e) {
      return res.status(400).json({ success:false,
        message: 'Connection failed: ' + e.message.split('\n')[0] });
    }
  },

};

