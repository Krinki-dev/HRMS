import api from './api';

export const employeeApi = {
  list: (params) => api.get('/employees', { params }).then(r => r.data),
  getEmployees: (params) => api.get('/employees', { params }).then(r => r.data),
  listDeleted: (params) => api.get('/employees/deleted', { params }).then(r => r.data),
  getOne: (id) => api.get(`/employees/${id}`).then(r => r.data),
  create: (data) => api.post('/employees', data).then(r => r.data),
  update: (id, data) => api.put(`/employees/${id}`, data).then(r => r.data),
  updateEmployee: (id, data) => api.put(`/employees/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/employees/${id}`).then(r => r.data),
  restore: (id) => api.post(`/employees/${id}/restore`).then(r => r.data),

  getDepartments: () => api.get('/employees/meta/departments').then(r => r.data),
  getDesignations: () => api.get('/employees/meta/designations').then(r => r.data),
  getBranches: () => api.get('/employees/meta/branches').then(r => r.data),
  getManagers: () => api.get('/employees/meta/managers').then(r => r.data),

  exportCSV: async (params) => {
    const res = await api.get('/employees/export.csv', { params, responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employees.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return res.data;
  },

  getPincode: (pincode) => api.get(`/platform/pincode/${pincode}`).then(r => r.data),

  createDraft: (aadhaarNumber) => api.post('/employees/drafts', { aadhaarNumber }).then(r => r.data),
  checkDuplicate: (aadhaarNumber) => api.post('/employees/drafts/check-duplicate', { aadhaarNumber }).then(r => r.data),
  getDraft: (draftId) => api.get(`/employees/drafts/${draftId}`).then(r => r.data),
  saveDraftStep: (draftId, step, data, employeeId = null) => api.put(`/employees/drafts/${draftId}/step/${step}`, { data, employeeId }).then(r => r.data),
  completeDraft: (draftId) => api.post(`/employees/drafts/${draftId}/complete`).then(r => r.data),

  addBankAccount: (id, data) => api.post(`/employees/${id}/bank`, data).then(r => r.data),
  deleteBankAccount: (id, bid) => api.delete(`/employees/${id}/bank/${bid}`).then(r => r.data),

  addDocument: (id, data) => api.post(`/employees/${id}/documents`, data).then(r => r.data),
  deleteDocument: (id, did) => api.delete(`/employees/${id}/documents/${did}`).then(r => r.data),

  createLogin: (id, data) => api.post(`/employees/${id}/create-login`, data).then(r => r.data),
  toggleLogin: (id) => api.put(`/employees/${id}/toggle-login`).then(r => r.data),

  uploadPhoto: (id, file) => {
    const fd = new FormData();
    fd.append('photo', file);
    return api.post(`/employees/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },

  unmask: (id) => api.post(`/employees/${id}/unmask`).then(r => r.data),

  submitUpdateRequest: (id, data) => api.post(`/employees/${id}/update-request`, data).then(r => r.data),

  bulkImport: (rows) => api.post('/employees/bulk-import', { rows }).then(r => r.data),

  getAddresses: (id) => api.get(`/employees/${id}/addresses`).then(r => r.data),
  upsertAddress: (id, type, data) => api.put(`/employees/${id}/addresses/${type}`, data).then(r => r.data),
  copyLocalAddress: (id) => api.post(`/employees/${id}/addresses/copy-local`).then(r => r.data),

  upsertEmergency: (id, data) => api.put(`/employees/${id}/emergency`, data).then(r => r.data),

  bulkEducation: (id, rows) => api.post(`/employees/${id}/education/bulk`, { rows }).then(r => r.data),
  listEducation: (id) => api.get(`/employees/${id}/education`).then(r => r.data),
  createEducation: (id, data) => api.post(`/employees/${id}/education`, data).then(r => r.data),
  updateEducation: (id, eid, data) => api.put(`/employees/${id}/education/${eid}`, data).then(r => r.data),
  deleteEducation: (id, eid) => api.delete(`/employees/${id}/education/${eid}`).then(r => r.data),

  bulkFamily: (id, rows) => api.post(`/employees/${id}/family/bulk`, { rows }).then(r => r.data),
  listFamily: (id) => api.get(`/employees/${id}/family`).then(r => r.data),
  createFamilyMember: (id, data) => api.post(`/employees/${id}/family`, data).then(r => r.data),
  updateFamilyMember: (id, mid, data) => api.put(`/employees/${id}/family/${mid}`, data).then(r => r.data),
  deleteFamilyMember: (id, mid) => api.delete(`/employees/${id}/family/${mid}`).then(r => r.data),

  bulkPrevEmp: (id, rows) => api.post(`/employees/${id}/prev-employment/bulk`, { rows }).then(r => r.data),
  listPrevEmp: (id) => api.get(`/employees/${id}/prev-employment`).then(r => r.data),
  createPrevEmployment: (id, data) => api.post(`/employees/${id}/prev-employment`, data).then(r => r.data),
  updatePrevEmployment: (id, pid, data) => api.put(`/employees/${id}/prev-employment/${pid}`, data).then(r => r.data),
  deletePrevEmployment: (id, pid) => api.delete(`/employees/${id}/prev-employment/${pid}`).then(r => r.data),
};
