const logger = require('./logger');

﻿async function logAudit(db, userId, action, tableName, recordId, changes = {}, ipAddress = null) {
  try {
    
    if (tableName === 'audit_logs') return null;

    const auditEntry = await db.audit_logs.create({
      data: {
        user_id: userId,
        action,
        table_name: tableName,
        record_id: String(recordId),
        changes: JSON.stringify(changes),
        ip_address: ipAddress,
        created_at: new Date(),
      },
    });

    return auditEntry;
  } catch (error) {
    
    logger.error('[AuditLog] Error:', error.message);
    return null;
  }
}

function auditMiddleware(tableName) {
  return async (req, res, next) => {
    
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const action = req.method === 'POST' ? 'CREATE' : 
                      req.method === 'PUT' || req.method === 'PATCH' ? 'UPDATE' : 
                      req.method === 'DELETE' ? 'DELETE' : null;

        if (action && req.body) {
          const recordId = data?.data?.id || req.params.id || 'unknown';
          logAudit(
            req.db,
            req.user.id,
            action,
            tableName,
            recordId,
            req.body,
            req.ip
          ).catch(err => logger.error('[AuditMiddleware] Failed:', err.message));
        }
      }
      return originalJson(data);
    };

    next();
  };
}

const auditActions = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
};

module.exports = {
  logAudit,
  auditMiddleware,
  auditActions,
};
