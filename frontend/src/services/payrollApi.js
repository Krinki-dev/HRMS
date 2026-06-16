import api from './api';

export const toRupees  = (paise) => (paise || 0) / 100;
export const toPaise   = (rupees) => Math.round((rupees || 0) * 100);
export const formatINR = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(toRupees(paise));

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const monthName = (m) => MONTHS[(m || 1) - 1];

export const getPayrollDashboard = () =>
  api.get('/payroll/dashboard').then(r => r.data);

export const listPayrollRuns    = (params = {}) =>
  api.get('/payroll/runs', { params }).then(r => r.data);

export const createPayrollRun   = (month, year) =>
  api.post('/payroll/runs', { month, year }).then(r => r.data);

export const getPayrollRun      = (runId) =>
  api.get(`/payroll/runs/${runId}`).then(r => r.data);

export const processPayrollRun  = (runId) =>
  api.post(`/payroll/runs/${runId}/process`).then(r => r.data);

export const lockPayrollRun     = (runId) =>
  api.post(`/payroll/runs/${runId}/lock`).then(r => r.data);

export const publishPayrollRun  = (runId) =>
  api.post(`/payroll/runs/${runId}/publish`).then(r => r.data);

export const deletePayrollRun   = (runId) =>
  api.delete(`/payroll/runs/${runId}`).then(r => r.data);

export const listPayslips = (runId, params = {}) =>
  api.get(`/payroll/runs/${runId}/payslips`, { params }).then(r => r.data);

export const getPayslip   = (runId, empId) =>
  api.get(`/payroll/runs/${runId}/payslips/${empId}`).then(r => r.data);

export const updatePayslip = (runId, empId, data) =>
  api.put(`/payroll/runs/${runId}/payslips/${empId}`, data).then(r => r.data);

export const addBonus    = (runId, data) =>
  api.post(`/payroll/runs/${runId}/bonuses`, data).then(r => r.data);

export const removeBonus = (runId, bonusId) =>
  api.delete(`/payroll/runs/${runId}/bonuses/${bonusId}`).then(r => r.data);

export const listSalaryStructures  = () =>
  api.get('/payroll/salary-structures').then(r => r.data);

export const createSalaryStructure = (data) =>
  api.post('/payroll/salary-structures', data).then(r => r.data);

export const updateSalaryStructure = (id, data) =>
  api.put(`/payroll/salary-structures/${id}`, data).then(r => r.data);

export const deleteSalaryStructure = (id) =>
  api.delete(`/payroll/salary-structures/${id}`).then(r => r.data);

export const getEmployeeSalary = (empId) =>
  api.get(`/payroll/employee-salaries/${empId}`).then(r => r.data);

export const setEmployeeSalary = (data) =>
  api.post('/payroll/employee-salaries', data).then(r => r.data);

export const getMonthlyReport     = (month, year) =>
  api.get('/payroll/reports/monthly', { params: { month, year } }).then(r => r.data);

export const getBankTransferReport = (month, year) =>
  api.get('/payroll/reports/bank-transfer', { params: { month, year } }).then(r => r.data);

export const getPFStatement       = (month, year) =>
  api.get('/payroll/reports/pf-statement', { params: { month, year } }).then(r => r.data);

export const getESIStatement      = (month, year) =>
  api.get('/payroll/reports/esi-statement', { params: { month, year } }).then(r => r.data);

