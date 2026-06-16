import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, _get) => ({

      isLoggedIn:  false,
      accessToken: null,
      user:        null,

      login: (data) => {
        const { accessToken, user } = data;
        localStorage.setItem('accessToken', accessToken);
        set({
          isLoggedIn:  true,
          accessToken,
          user: {
            id:              user.id,
            name:            user.name || user.email,
            email:           user.email,
            role:            user.role,
            permissions:     user.permissions     || {},
            employeeId:      user.employeeId      || user.employee?.id || null,
            employee:        user.employee        || null,
            isFirstLogin:    user.isFirstLogin    ?? false,
            is_platform_admin: user.is_platform_admin || false,
            
            plan:            user.plan            || 'free',
            isSetupComplete: user.isSetupComplete ?? true,
            planExpiresAt:   user.planExpiresAt   || null,
            tenantId:        user.tenantId        || null,
            subdomain:       user.subdomain       || null,
            companyName:     user.companyName     || null,
          },
        });
      },

      clearFirstLogin: () => {
        set(state => ({
          user: state.user ? { ...state.user, isFirstLogin: false } : null,
        }));
      },

      setSetupComplete: () => {
        set(state => ({
          user: state.user ? { ...state.user, isSetupComplete: true } : null,
        }));
      },

      setPlan: (plan, planExpiresAt) => {
        set(state => ({
          user: state.user
            ? { ...state.user, plan, planExpiresAt }
            : null,
        }));
      },

      updateToken: (accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        set({ accessToken });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        set({ isLoggedIn: false, accessToken: null, user: null });
      },
    }),

    {
      name: 'hrms-auth',
      partialize: (state) => ({
        isLoggedIn:  state.isLoggedIn,
        accessToken: state.accessToken,
        user:        state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          localStorage.setItem('accessToken', state.accessToken);
        }
      },
    }
  )
);

