import api from './api';

export const performanceApi = {
  dashboard:              ()          => api.get('/performance/dashboard').then(r => r.data),
  listCycles:             ()          => api.get('/performance/cycles').then(r => r.data),
  createCycle:            (d)         => api.post('/performance/cycles', d).then(r => r.data),
  updateCycle:            (id, d)     => api.put(`/performance/cycles/${id}`, d).then(r => r.data),
  activateCycle:          (id)        => api.put(`/performance/cycles/${id}/activate`).then(r => r.data),
  closeCycle:             (id)        => api.put(`/performance/cycles/${id}/close`).then(r => r.data),
  listMyGoals:            (cycleId)   => api.get('/performance/goals', { params: { cycleId } }).then(r => r.data),
  listTeamGoals:          (cycleId)   => api.get('/performance/goals/team', { params: { cycleId } }).then(r => r.data),
  createGoal:             (d)         => api.post('/performance/goals', d).then(r => r.data),
  updateGoal:             (id, d)     => api.put(`/performance/goals/${id}`, d).then(r => r.data),
  approveGoal:            (id)        => api.put(`/performance/goals/${id}/approve`).then(r => r.data),
  deleteGoal:             (id)        => api.delete(`/performance/goals/${id}`).then(r => r.data),
  getMyAppraisal:         (cycleId)   => api.get('/performance/appraisals/my', { params: { cycleId } }).then(r => r.data),
  getTeamAppraisals:      (cycleId)   => api.get('/performance/appraisals/team', { params: { cycleId } }).then(r => r.data),
  submitSelfAppraisal:    (d)         => api.post('/performance/appraisals/self', d).then(r => r.data),
  submitManagerAppraisal: (d)         => api.post('/performance/appraisals/manager', d).then(r => r.data),
  finalizeAppraisal:      (id, d)     => api.put(`/performance/appraisals/${id}/finalize`, d).then(r => r.data),
};

export const trainingApi = {
  list:             (params)     => api.get('/training/trainings', { params }).then(r => r.data),
  create:           (d)          => api.post('/training/trainings', d).then(r => r.data),
  get:              (id)         => api.get(`/training/trainings/${id}`).then(r => r.data),
  update:           (id, d)      => api.put(`/training/trainings/${id}`, d).then(r => r.data),
  remove:           (id)         => api.delete(`/training/trainings/${id}`).then(r => r.data),
  nominate:         (id, empIds) => api.post(`/training/trainings/${id}/nominate`, { employeeIds: empIds }).then(r => r.data),
  removeNomination: (id, empId)  => api.delete(`/training/trainings/${id}/nominations/${empId}`).then(r => r.data),
  markAttendance:   (id, records)=> api.post(`/training/trainings/${id}/attendance`, { records }).then(r => r.data),
  submitFeedback:   (id, d)      => api.post(`/training/trainings/${id}/feedback`, d).then(r => r.data),
  myTrainings:      ()           => api.get('/training/my-trainings').then(r => r.data),
};

export const assetsApi = {
  dashboard:   ()          => api.get('/assets/dashboard').then(r => r.data),
  list:        (params)    => api.get('/assets/assets', { params }).then(r => r.data),
  create:      (d)         => api.post('/assets/assets', d).then(r => r.data),
  get:         (id)        => api.get(`/assets/assets/${id}`).then(r => r.data),
  update:      (id, d)     => api.put(`/assets/assets/${id}`, d).then(r => r.data),
  remove:      (id)        => api.delete(`/assets/assets/${id}`).then(r => r.data),
  allocate:    (id, d)     => api.post(`/assets/assets/${id}/allocate`, d).then(r => r.data),
  returnAsset: (id, d)     => api.put(`/assets/assets/${id}/return`, d).then(r => r.data),
  byEmployee:  (empId)     => api.get(`/assets/assets/employee/${empId}`).then(r => r.data),
};

export const expensesApi = {
  listClaims:       (params)  => api.get('/expenses/claims', { params }).then(r => r.data),
  createClaim:      (d)       => api.post('/expenses/claims', d).then(r => r.data),
  pendingApprovals: ()        => api.get('/expenses/claims/pending').then(r => r.data),
  getClaim:         (id)      => api.get(`/expenses/claims/${id}`).then(r => r.data),
  approveClaim:     (id, d)   => api.put(`/expenses/claims/${id}/approve`, d).then(r => r.data),
  rejectClaim:      (id, d)   => api.put(`/expenses/claims/${id}/reject`, d).then(r => r.data),
  deleteClaim:      (id)      => api.delete(`/expenses/claims/${id}`).then(r => r.data),
  listPolicies:     ()        => api.get('/expenses/policies').then(r => r.data),
  createPolicy:     (d)       => api.post('/expenses/policies', d).then(r => r.data),
  updatePolicy:     (id, d)   => api.put(`/expenses/policies/${id}`, d).then(r => r.data),
  uploadReceipt:    (file)    => {
    const fd = new FormData();
    fd.append('receipt', file);
    return api.post('/expenses/claims/upload-receipt', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
};

