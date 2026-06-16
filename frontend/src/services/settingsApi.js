import api from './api';

export const settingsApi = {
  
  getCompany: () => api.get('/settings/company').then(r => r.data),
  updateCompany: (data) => api.put('/settings/company', data).then(r => r.data),

  listDepts: () => api.get('/settings/departments').then(r => r.data),
  createDept: (data) => api.post('/settings/departments', data).then(r => r.data),
  updateDept: (id, data) => api.put(`/settings/departments/${id}`, data).then(r => r.data),
  deleteDept: (id) => api.delete(`/settings/departments/${id}`).then(r => r.data),

  listDesigs: () => api.get('/settings/designations').then(r => r.data),
  createDesig: (data) => api.post('/settings/designations', data).then(r => r.data),
  updateDesig: (id, data) => api.put(`/settings/designations/${id}`, data).then(r => r.data),
  deleteDesig: (id) => api.delete(`/settings/designations/${id}`).then(r => r.data),

  listBranches: () => api.get('/settings/branches').then(r => r.data),
  createBranch: (data) => api.post('/settings/branches', data).then(r => r.data),
  updateBranch: (id, data) => api.put(`/settings/branches/${id}`, data).then(r => r.data),
  deleteBranch: (id) => api.delete(`/settings/branches/${id}`).then(r => r.data),

  listShifts: () => api.get('/settings/shifts').then(r => r.data),
  createShift: (data) => api.post('/settings/shifts', data).then(r => r.data),
  updateShift: (id, data) => api.put(`/settings/shifts/${id}`, data).then(r => r.data),
  deleteShift: (id) => api.delete(`/settings/shifts/${id}`).then(r => r.data),

  listHolidays: (year) => api.get('/settings/holidays', { params: { year } }).then(r => r.data),
  addHoliday: (data) => api.post('/settings/holidays', data).then(r => r.data),
  updateHoliday: (id, data) => api.put(`/settings/holidays/${id}`, data).then(r => r.data),
  deleteHoliday: (id) => api.delete(`/settings/holidays/${id}`).then(r => r.data),
  loadNationalHolidays: (year) => api.post('/settings/holidays/load-national', { year }).then(r => r.data),

  getNotifications: () => api.get('/settings/notifications').then(r => r.data),
  saveNotifications: (data) => api.put('/settings/notifications', data).then(r => r.data),
  testEmail: (toEmail) => api.post('/settings/notifications/test-email', { toEmail }).then(r => r.data),
};

export default settingsApi;

