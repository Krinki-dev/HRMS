import api from './api';

const BASE = '/compliance';

export const complianceApi = {

  dashboard:  ()            => api.get(`${BASE}/dashboard`).then(r => r.data),
  calendar:   (year)        => api.get(`${BASE}/calendar`, { params: { year } }).then(r => r.data),

  listFilings: (month, year) => api.get(`${BASE}/filings`, { params: { month, year } }).then(r => r.data),
  markFiled:  (id, data)    => api.put(`${BASE}/filings/${id}/mark-filed`, data).then(r => r.data),

  pfSummary:   (month, year) => api.get(`${BASE}/pf`,           { params: { month, year } }).then(r => r.data),
  generateECR: (month, year) => api.post(`${BASE}/pf/ecr`,      { month, year }).then(r => r.data),
  missingUAN:  ()            => api.get(`${BASE}/pf/missing-uan`).then(r => r.data),
  updateUAN:   (updates)     => api.put(`${BASE}/pf/uan`,        { updates }).then(r => r.data),

  esiSummary:       (month, year) => api.get(`${BASE}/esi`,          { params: { month, year } }).then(r => r.data),
  generateESIChallan:(month, year) => api.post(`${BASE}/esi/challan`, { month, year }).then(r => r.data),

  ptSummary:       (month, year) => api.get(`${BASE}/pt`,          { params: { month, year } }).then(r => r.data),
  ptSlabs:         (state)       => api.get(`${BASE}/pt/slabs`,    { params: { state } }).then(r => r.data),
  generatePTChallan:(month, year) => api.post(`${BASE}/pt/challan`, { month, year }).then(r => r.data),

  tdsSummary:      (month, year)  => api.get(`${BASE}/tds`,              { params: { month, year } }).then(r => r.data),
  getMyDeclaration:(fy)           => api.get(`${BASE}/tds/declaration`,  { params: { fy } }).then(r => r.data),
  saveDeclaration: (data)         => api.post(`${BASE}/tds/declaration`, data).then(r => r.data),
  generateForm16:  (financialYear) => api.post(`${BASE}/tds/form16`,     { financialYear }).then(r => r.data),

  lwfSummary:     (month, year) => api.get(`${BASE}/lwf`,        { params: { month, year } }).then(r => r.data),
  lwfRules:       (state)       => api.get(`${BASE}/lwf/rules`,  { params: { state } }).then(r => r.data),
  generateLWFReturn:(month, year) => api.post(`${BASE}/lwf/return`, { month, year }).then(r => r.data),
};

