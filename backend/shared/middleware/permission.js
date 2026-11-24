const { sendError, ERROR_CODES } = require('../utils/response');
const { THEME } = require('../utils/uiConstants');
const logger = require('../utils/logger');

const ADMIN_ROLES = ['super_admin', 'admin', 'hr_admin', 'Super Admin', 'Admin'];

const checkPermission = (module, action) => {
  return (req, res, next) => {
    if (ADMIN_ROLES.includes(req.user?.role)) return next();
    const permissions = req.user?.permissions;
    if (!permissions) {
      logger.warn(`${THEME.ICONS.LOCK} Access Denied: User ${req.user?.id} has no permissions for ${module}/${action}`);
      return sendError(res, ERROR_CODES.FORBIDDEN, `${THEME.ICONS.LOCK} No permissions assigned.`, 403);
    }

    // Optimization: Cache parsed permissions on req.user to avoid repeated JSON.parse
    if (typeof permissions === 'string' && !req.user._parsedPermissions) {
      try {
        req.user._parsedPermissions = JSON.parse(permissions);
      } catch {
        logger.error(`${THEME.ICONS.ERROR} Permission parse failed for user ${req.user?.id}`);
        req.user._parsedPermissions = {};
      }
    }

    const perms = req.user._parsedPermissions || permissions;

    const modulePerms = perms[module];
    if (!modulePerms) return sendError(res, ERROR_CODES.FORBIDDEN, `${THEME.ICONS.LOCK} No access to ${module} module.`, 403);
    if (!modulePerms[action]) return sendError(res, ERROR_CODES.FORBIDDEN, `${THEME.ICONS.LOCK} Cannot ${action} in ${module}.`, 403);

    next();
  };
};

function isModuleEnabled(enabledModules, moduleName) {
  if (!Array.isArray(enabledModules) || typeof moduleName !== 'string' || !moduleName.trim()) return false;
  const normalized = new Set(enabledModules.filter((item) => typeof item === 'string').map((item) => item.trim().toLowerCase()));
  return normalized.has(moduleName.trim().toLowerCase());
}

const checkModuleEnabled = (moduleName) => {
  return (req, res, next) => {
    // Only a platform-level operator can bypass a tenant plan entitlement.
    // Tenant admins and HR admins remain subject to the purchased module set.
    if (req.user?.is_platform_admin === true) return next();
    if (!isModuleEnabled(req.tenant?.enabledModules, moduleName)) {
      logger.warn(`${THEME.ICONS.LOCK} Module entitlement denied: tenant=${req.tenant?.id || 'unknown'} module=${moduleName}`);
      return sendError(res, ERROR_CODES.FORBIDDEN,
        `The ${moduleName} module is not enabled for this company plan. Upgrade the plan or contact support.`, 403);
    }
    return next();
  };
};

module.exports = { checkPermission, checkModuleEnabled, isModuleEnabled };

