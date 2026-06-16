const svc  = require('./roles.service');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');
const { resolveTenantId } = require('../../shared/utils/tenantResolver');

const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) {
    if (e.message === 'NOT_FOUND')       return sendError(res, ERROR_CODES.NOT_FOUND,   'Role not found.', 404);
    if (e.message === 'NAME_REQUIRED')   return sendError(res, ERROR_CODES.VALIDATION,  'Role name is required.');
    if (e.message === 'DUPLICATE_NAME')  return sendError(res, ERROR_CODES.VALIDATION,  'A role with this name already exists.');
    if (e.message === 'SYSTEM_ROLE')     return sendError(res, ERROR_CODES.VALIDATION,  'System roles cannot be modified or deleted.');
    if (e.message === 'ROLE_IN_USE')     return sendError(res, ERROR_CODES.VALIDATION,  'Cannot delete — users are assigned to this role.');
    if (e.message === 'ROLE_NOT_FOUND')  return sendError(res, ERROR_CODES.NOT_FOUND,   'Role not found.', 404);
    if (e.message === 'USER_NOT_FOUND')  return sendError(res, ERROR_CODES.NOT_FOUND,   'User not found.', 404);
    console.error('[Roles]', e.message);
    sendError(res, ERROR_CODES.SERVER, 'Server error.', 500);
  }
};

module.exports = {
  list: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, {
      roles:     await svc.list(req.db, tenantId),
      templates: svc.getTemplates(),
    });
  }),

  create: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.create(req.db, tenantId, req.body), 'Role created.', 201);
  }),

  update: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    sendSuccess(res, await svc.update(req.db, tenantId, req.params.id, req.body), 'Role updated.');
  }),

  remove: wrap(async (req, res) => {
    const tenantId = await resolveTenantId(req);
    await svc.remove(req.db, tenantId, req.params.id);
    sendSuccess(res, null, 'Role deleted.');
  }),

  assignRole: wrap(async (req, res) => {
    if (!req.body.roleId) return sendError(res, ERROR_CODES.VALIDATION, 'roleId required.');
    const tenantId = await resolveTenantId(req);
    sendSuccess(res,
      await svc.assignRole(req.db, tenantId, req.params.userId, req.body.roleId),
      'Role assigned.'
    );
  }),
};

