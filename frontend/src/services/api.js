import axios from 'axios';
import { tenantSubdomain as _tenantSubdomain } from '../utils/tenantDomain';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || '/api/v1',
  headers:         { 'Content-Type': 'application/json' },
  timeout:         30_000,
  withCredentials: true,
});
api.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

api.interceptors.request.use(
  (config) => {
    
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (_tenantSubdomain) {
      config.headers['X-Tenant-Subdomain'] = _tenantSubdomain;
    } else {
      // Fallback: if the user object from auth store contains a subdomain, send it
      try {
        const user = useAuthStore.getState().user;
        if (user?.subdomain) config.headers['X-Tenant-Subdomain'] = user.subdomain;
      } catch (e) { /* ignore */ }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else       resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  
  (response) => {
    // Normalize: if backend returns { data: { ... } } unwrap to response.data
    if (response && response.data && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },

  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing    = true;

    try {

      const refreshRes = await axios.post(
        `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken =
        refreshRes.data?.data?.accessToken ||
        refreshRes.data?.accessToken;

      if (!newToken) throw new Error('No access token in refresh response');

      localStorage.setItem('accessToken', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      try {
        const { useAuthStore } = await import('../store/authStore');
        
        useAuthStore.getState().updateToken(newToken);
      } catch { /* ignore */ }

      processQueue(null, newToken);

      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);

    } catch (refreshError) {
      
      processQueue(refreshError, null);

      localStorage.removeItem('accessToken');
      try {
        const { useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().logout();
      } catch { /* ignore */ }

      window.location.href = '/login';
      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

