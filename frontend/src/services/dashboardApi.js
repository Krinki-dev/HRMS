import api from './api';

export const dashboardApi = {
  
  getStats: () => api.get('/dashboard/stats').then(r => r.data.data),

  getActivity: () => api.get('/dashboard/activity').then(r => r.data.data),
};

export default dashboardApi;

