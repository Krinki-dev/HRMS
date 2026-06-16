import api from './api';

export const attendanceApi = {
  
  dashboard:        (date)      => api.get('/attendance/dashboard', { params: { date } }).then(r => r.data),

  list:             (params)    => api.get('/attendance', { params }).then(r => r.data),

  getToday:         ()          => api.get('/attendance/today').then(r => r.data),
  checkIn:          (data)      => api.post('/attendance/checkin', data).then(r => r.data),
  checkOut:         ()          => api.post('/attendance/checkout').then(r => r.data),

  getUnmarked:      (date)      => api.get('/attendance/unmarked', { params: { date } }).then(r => r.data),
  bulkMark:         (data)      => api.post('/attendance/bulk-mark', data).then(r => r.data),
  updateRecord:     (id, data)  => api.put(`/attendance/${id}`, data).then(r => r.data),

  submitRegularize: (data)      => api.post('/attendance/regularize', data).then(r => r.data),
  getPending:       ()          => api.get('/attendance/regularize/pending').then(r => r.data),
  approveReg:       (id)        => api.put(`/attendance/regularize/${id}/approve`).then(r => r.data),
  rejectReg:        (id, reason)=> api.put(`/attendance/regularize/${id}/reject`, { reason }).then(r => r.data),

  getOTPending:     ()          => api.get('/attendance/overtime/pending').then(r => r.data),
  approveOT:        (id, type)  => api.put(`/attendance/overtime/${id}/approve`, { type }).then(r => r.data),

  getShifts:        ()          => api.get('/attendance/shifts').then(r => r.data),
  createShift:      (data)      => api.post('/attendance/shifts', data).then(r => r.data),
  updateShift:      (id, data)  => api.put(`/attendance/shifts/${id}`, data).then(r => r.data),
  deleteShift:      (id)        => api.delete(`/attendance/shifts/${id}`).then(r => r.data),

  getHolidays:      (year)      => api.get('/attendance/holidays', { params: { year } }).then(r => r.data),
  addHoliday:       (data)      => api.post('/attendance/holidays', data).then(r => r.data),
  deleteHoliday:    (id)        => api.delete(`/attendance/holidays/${id}`).then(r => r.data),
  loadNational:     (year)      => api.post('/attendance/holidays/load-national', { year }).then(r => r.data),

  monthlyReport:    (month, year) => api.get('/attendance/reports/monthly', { params: { month, year } }).then(r => r.data),
};

export const leaveApi = {
  
  dashboard:        ()             => api.get('/leave/dashboard').then(r => r.data),
  calendar:         (params)       => api.get('/leave/calendar', { params }).then(r => r.data),

  list:             (params)       => api.get('/leave', { params }).then(r => r.data),
  myApplications:   (params)       => api.get('/leave/my', { params }).then(r => r.data),
  apply:            (data)         => api.post('/leave/apply', data).then(r => r.data),
  cancel:           (id)           => api.put(`/leave/${id}/cancel`).then(r => r.data),
  calculateDays:    (data)         => api.post('/leave/calculate-days', data).then(r => r.data),

  getPendingApprovals: ()          => api.get('/leave/approvals/pending').then(r => r.data),
  approve:          (id, comment)  => api.put(`/leave/${id}/approve`, { comment }).then(r => r.data),
  reject:           (id, reason)   => api.put(`/leave/${id}/reject`, { reason }).then(r => r.data),

  getBalances:      (year)         => api.get('/leave/balances', { params: { year } }).then(r => r.data),
  getAllBalances:    (params)       => api.get('/leave/balances/all', { params }).then(r => r.data),

  getLeaveTypes:    ()             => api.get('/leave/types').then(r => r.data),
  createLeaveType:  (data)         => api.post('/leave/types', data).then(r => r.data),
  updateLeaveType:  (id, data)     => api.put(`/leave/types/${id}`, data).then(r => r.data),
  deleteLeaveType:  (id)           => api.delete(`/leave/types/${id}`).then(r => r.data),

  manualAccrue:     ()             => api.post('/leave/accrue').then(r => r.data),
  accrualLog:       ()             => api.get('/leave/accrual-log').then(r => r.data),

  encash:           (data)         => api.post('/leave/encash', data).then(r => r.data),

  report:           (params)       => api.get('/leave/reports', { params }).then(r => r.data),
};

