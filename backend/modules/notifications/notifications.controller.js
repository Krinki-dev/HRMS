const svc = require('./notifications.service');
const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');

const ctrl = {

  list: async (req, res) => {
    try {
      sendSuccess(res, await svc.list(req.db, req.user.tenantId, req.user.id, req.query));
    } catch (e) {
      console.error('[Notifications/list]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Failed to fetch notifications.', 500);
    }
  },

  unreadCount: async (req, res) => {
    try {
      sendSuccess(res, await svc.unreadCount(req.db, req.user.tenantId, req.user.id));
    } catch (e) {
      console.error('[Notifications/unreadCount]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Failed.', 500);
    }
  },

  markRead: async (req, res) => {
    try {
      await svc.markRead(req.db, req.params.id, req.user.id);
      sendSuccess(res, null, 'Marked as read.');
    } catch (e) {
      console.error('[Notifications/markRead]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Failed.', 500);
    }
  },

  markAllRead: async (req, res) => {
    try {
      const result = await svc.markAllRead(req.db, req.user.tenantId, req.user.id);
      sendSuccess(res, result, `${result.marked} notifications marked as read.`);
    } catch (e) {
      console.error('[Notifications/markAllRead]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Failed.', 500);
    }
  },

  send: async (req, res) => {
    try {
      const { userIds, type = 'manual', title, body, link, priority } = req.body;
      if (!title || !body) return sendError(res, ERROR_CODES.VALIDATION, 'Title and body are required.');
      sendSuccess(res, await svc.create(req.db, req.user.tenantId, { userIds, type, title, body, link, priority }), 'Notification sent.', 201);
    } catch (e) {
      console.error('[Notifications/send]', e.message);
      sendError(res, ERROR_CODES.SERVER, 'Failed to send notification.', 500);
    }
  },
};

module.exports = ctrl;

