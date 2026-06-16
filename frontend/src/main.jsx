import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';
import { THEME } from './utils/theme';

// Dev-only: allow automatic dev auth when VITE_DEV_BYPASS=true
if (import.meta.env.VITE_DEV_BYPASS === 'true') {
  try {
    const devUser = {
      isLoggedIn: true,
      accessToken: 'DEV_BYPASS_TOKEN',
      user: {
        id: 'dev_admin',
        name: 'Dev Admin',
        email: import.meta.env.VITE_DEV_EMAIL || 'dev@local',
        tenantId: import.meta.env.VITE_DEV_TENANT || 'dev-tenant',
        subdomain: import.meta.env.VITE_DEV_SUBDOMAIN || 'pcepl',
        is_platform_admin: true,
        isSetupComplete: false,
      }
    };
    localStorage.setItem('hrms-auth', JSON.stringify(devUser));
    localStorage.setItem('accessToken', devUser.accessToken);
  } catch (e) {
    // ignore in environments where localStorage isn't available
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: '14px' },
          success: { style: THEME.toast.success },
          error:   { style: THEME.toast.error },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
