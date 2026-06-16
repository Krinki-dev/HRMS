import api from './api';

const BASE = '/recruitment';

export const recruitmentApi = {
  dashboard:        ()                => api.get(`${BASE}/dashboard`).then(r => r.data),

  listRequisitions: (params)          => api.get(`${BASE}/requisitions`, { params }).then(r => r.data),
  getRequisition:   (id)              => api.get(`${BASE}/requisitions/${id}`).then(r => r.data),
  createRequisition:(data)            => api.post(`${BASE}/requisitions`, data).then(r => r.data),
  updateRequisition:(id, data)        => api.put(`${BASE}/requisitions/${id}`, data).then(r => r.data),
  approveRequisition:(id)             => api.put(`${BASE}/requisitions/${id}/approve`).then(r => r.data),
  rejectRequisition:(id)              => api.put(`${BASE}/requisitions/${id}/reject`).then(r => r.data),
  deleteRequisition:(id)              => api.delete(`${BASE}/requisitions/${id}`).then(r => r.data),

  listJobs:         (params)          => api.get(`${BASE}/jobs`, { params }).then(r => r.data),
  getJob:           (id)              => api.get(`${BASE}/jobs/${id}`).then(r => r.data),
  postJob:          (data)            => api.post(`${BASE}/jobs/post`, data).then(r => r.data),
  closeJob:         (id)              => api.put(`${BASE}/jobs/${id}/close`).then(r => r.data),

  listCandidates:   (params)          => api.get(`${BASE}/candidates`, { params }).then(r => r.data),
  getCandidate:     (id)              => api.get(`${BASE}/candidates/${id}`).then(r => r.data),
  addCandidate:     (data)            => api.post(`${BASE}/candidates`, data).then(r => r.data),
  updateCandidate:  (id, data)        => api.put(`${BASE}/candidates/${id}`, data).then(r => r.data),
  moveStage:        (id, data)        => api.put(`${BASE}/candidates/${id}/stage`, data).then(r => r.data),
  convertToEmployee:(id, data)        => api.post(`${BASE}/candidates/${id}/convert`, data).then(r => r.data),
  deleteCandidate:  (id)              => api.delete(`${BASE}/candidates/${id}`).then(r => r.data),

  listInterviews:   (params)          => api.get(`${BASE}/interviews`, { params }).then(r => r.data),
  scheduleInterview:(data)            => api.post(`${BASE}/interviews`, data).then(r => r.data),
  updateInterview:  (id, data)        => api.put(`${BASE}/interviews/${id}`, data).then(r => r.data),
  cancelInterview:  (id)              => api.put(`${BASE}/interviews/${id}/cancel`).then(r => r.data),
  submitFeedback:   (id, data)        => api.post(`${BASE}/interviews/${id}/feedback`, data).then(r => r.data),

  createOffer:      (data)            => api.post(`${BASE}/offers`, data).then(r => r.data),
  acceptOffer:      (id)              => api.put(`${BASE}/offers/${id}/accept`).then(r => r.data),
  declineOffer:     (id)              => api.put(`${BASE}/offers/${id}/decline`).then(r => r.data),
};

