import api from './api';

export const adminApi = {

  getStats: () =>
    api.get('/platform/admin/stats').then(r => r.data),

  listTenants: (params = {}) =>
    api.get('/platform/admin/tenants', { params }).then(r => r.data),

  getTenant: (id) =>
    api.get(`/platform/admin/tenants/${id}`).then(r => r.data),

  updateTenant: (id, data) =>
    api.put(`/platform/admin/tenants/${id}`, data).then(r => r.data),

  suspendTenant: (id, reason = '') =>
    api.post(`/platform/admin/tenants/${id}/suspend`, { reason }).then(r => r.data),

  activateTenant: (id) =>
    api.post(`/platform/admin/tenants/${id}/activate`).then(r => r.data),

  deleteTenant: (id) =>
    api.delete(`/platform/admin/tenants/${id}`).then(r => r.data),

  deleteTenantPermanent: (id, { password, reason, backup, confirmExternalDelete }) =>
    api.post(`/platform/admin/tenants/${id}/delete-permanent`, { password, reason, backup, confirmExternalDelete }).then(r => r.data),

  getModules: (id) =>
    api.get(`/platform/admin/tenants/${id}/modules`).then(r => r.data),

  updateModules: (id, modules) =>
    api.put(`/platform/admin/tenants/${id}/modules`, { modules }).then(r => r.data),

  getNotifications: (id) =>
    api.get(`/platform/admin/tenants/${id}/notifications`).then(r => r.data),

  saveNotifications: (id, data) =>
    api.put(`/platform/admin/tenants/${id}/notifications`, data).then(r => r.data),

  testEmail: (id, toEmail) =>
    api.post(`/platform/admin/tenants/${id}/notifications/test`, { type: 'email', toEmail }).then(r => r.data),

};

export const notificationSettingsApi = {

  get: () =>
    api.get('/settings/notifications').then(r => r.data),

  save: (data) =>
    api.put('/settings/notifications', data).then(r => r.data),

  testEmail: (toEmail) =>
    api.post('/settings/notifications/test-email', { toEmail }).then(r => r.data),

  testSms: (toPhone) =>
    api.post('/settings/notifications/test-sms', { toPhone }).then(r => r.data),

};

