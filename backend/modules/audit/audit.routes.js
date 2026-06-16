const express = require('express');
const router  = express.Router();
const auth    = require('../../shared/middleware/auth');
const { checkPermission } = require('../../shared/middleware/permission');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');

router.use(auth);

const ADMIN_ROLES = ['super_admin', 'admin', 'hr_admin', 'Super Admin', 'Admin'];

const safeJson = (str) => {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return str; }
};

const fmt = (row, canSeeSensitive) => {
  const isSensitive = row.action === 'view_sensitive';
  return {
    id:          row.id,
    module:      row.module,
    action:      row.action,
    recordId:    row.record_id,
    recordType:  row.record_type,
    ipAddress:   row.ip_address,
    createdAt:   row.created_at,
    
    newValues:   (!isSensitive || canSeeSensitive) ? safeJson(row.new_values) : '[redacted]',
    oldValues:   (!isSensitive || canSeeSensitive) ? safeJson(row.old_values) : '[redacted]',
    
    actor: row.employee ? {
      id:    row.employee.id,
      email: row.employee.work_email,
      name:  `${row.employee.first_name} ${row.employee.last_name}`.trim(),
    } : { name: 'System' },
  };
};

router.get('/', checkPermission('settings', 'view'), async (req, res) => {
  const prisma = req.db; 
  try {
    const {
      module: mod, action, userId, recordId,
      from, to, search,
      cursor, limit = '50',
    } = req.query;

    const canSeeSensitive = ADMIN_ROLES.includes(req.user.role);
    const companyId       = req.user.tenantId;
    const take            = Math.min(parseInt(limit, 10) || 50, 200);

    const where = {
      ...(mod      && { module:      mod }),
      ...(action   && { action }),
      ...(userId   && { user_id:     userId }),
      ...(recordId && { record_id:   recordId }),
      ...(from || to) && {
        created_at: {
          ...(from && { gte: new Date(from) }),
          ...(to   && { lte: new Date(to + 'T23:59:59.999Z') }),
        },
      },
      ...(search && {
        OR: [
          { new_values: { contains: search } },
          { old_values: { contains: search } },
          { record_id:  { contains: search } },
        ],
      }),
      
      ...(!canSeeSensitive && { action: { not: 'view_sensitive' } }),
    };

    const total = await prisma.audit_logs.count({ where });

    const rows = await prisma.audit_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take:    take + 1,
      cursor:  cursor ? { id: cursor } : undefined,
      include: {
        employee: {
          select: {
            id: true, work_email: true,
            first_name: true, last_name: true,
          },
        },
      },
    });

    const hasMore    = rows.length > take;
    const data       = hasMore ? rows.slice(0, -1) : rows;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return sendSuccess(res, {
      logs:       data.map(r => fmt(r, canSeeSensitive)),
      pagination: { total, hasMore, cursor: nextCursor },
    });
  } catch (e) {
    console.error('[AuditLog.list]', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to load audit logs', 500);
  }
});

router.get('/export', checkPermission('settings', 'export'), async (req, res) => {
  const prisma = req.db; 
  try {
    const canSeeSensitive = ADMIN_ROLES.includes(req.user.role);
    const companyId       = req.user.tenantId;
    const { module: mod, action, from, to } = req.query;

    const where = {
      company_id: companyId,
      ...(mod    && { module: mod }),
      ...(action && { action }),
      ...(!canSeeSensitive && { action: { not: 'view_sensitive' } }),
      ...(from || to) && {
        created_at: {
          ...(from && { gte: new Date(from) }),
          ...(to   && { lte: new Date(to + 'T23:59:59.999Z') }),
        },
      },
    };

    const rows = await prisma.audit_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take:    5000,
      include: {
        user: {
          select: {
            email: true,
            employee: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });

    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const headers = ['Date & Time', 'Module', 'Action', 'Actor', 'Email', 'Record ID', 'IP Address', 'Details'];
    const csvRows = rows.map(r => {
      const actor = r.user
        ? (r.user.employee ? `${r.user.employee.first_name} ${r.user.employee.last_name}`.trim() : r.user.email)
        : 'System';
      const details = r.action === 'view_sensitive' && !canSeeSensitive
        ? '[redacted]'
        : JSON.stringify(safeJson(r.new_values) || safeJson(r.old_values) || '');
      return [
        q(new Date(r.created_at).toLocaleString('en-IN')),
        q(r.module),
        q(r.action),
        q(actor),
        q(r.user?.email || ''),
        q(r.record_id || ''),
        q(r.ip_address || ''),
        q(details),
      ].join(',');
    });

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv;charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="audit_log_${date}.csv"`);
    res.send('\uFEFF' + [headers.join(','), ...csvRows].join('\n'));
  } catch (e) {
    console.error('[AuditLog.export]', e.message);
    return sendError(res, ERROR_CODES.SERVER, 'Export failed', 500);
  }
});

router.get('/:id', checkPermission('settings', 'view'), async (req, res) => {
  const prisma = req.db; 
  try {
    const canSeeSensitive = ADMIN_ROLES.includes(req.user.role);
    const row = await prisma.audit_logs.findFirst({
      where: { id: req.params.id, company_id: req.user.tenantId },
      include: {
        user: {
          select: {
            id: true, email: true,
            employee: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });
    if (!row) return sendError(res, ERROR_CODES.NOT_FOUND, 'Log entry not found', 404);
    return sendSuccess(res, fmt(row, canSeeSensitive));
  } catch (e) {
    console.error('[AuditLog.getOne]', e.message);
    return sendError(res, ERROR_CODES.SERVER, 'Failed to load entry', 500);
  }
});

module.exports = router;

