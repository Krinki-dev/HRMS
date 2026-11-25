import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, _get) => ({

      isLoggedIn:      false,
      accessToken:     null,
      user:            null,
      companyLogoUrl:  null,
      companyName:     null,

      login: (data) => {
        const {
          accessToken,
          user,
          companyLogoUrl,
          companyName,
        } = data;

        set({
          isLoggedIn:     true,
          accessToken,
          companyLogoUrl: companyLogoUrl || user?.companyLogoUrl || null,
          companyName:    companyName    || user?.companyName    || null,
          user: {
            id:              user?.id              || null,
            name:            user?.name            || null,
            email:           user?.email           || null,
            role:            user?.role            || null,
            is_platform_admin: user?.is_platform_admin || false,
            plan:            user?.plan            || 'free',
            isSetupComplete: user?.isSetupComplete  ?? true,
            isFirstLogin:    user?.isFirstLogin     ?? false,
            planExpiresAt:   user?.planExpiresAt    || null,
            tenantId:        user?.tenantId         || null,
            subdomain:       user?.subdomain        || null,
            companyName:     user?.companyName      || null,
            companyLogoUrl:  user?.companyLogoUrl   || companyLogoUrl || null,
          },
        });
      },

      updateToken: (accessToken) => set({ accessToken }),

      logout: () => {
        // Remove any access token left by older versions; tokens are memory-only.
        set({
          isLoggedIn:     false,
          accessToken:    null,
          user:           null,
          companyLogoUrl: null,
          companyName:    null,
        });
      },

      clearFirstLogin: () => {
        set((state) => ({
          user: {
            ...state.user,
            isFirstLogin: false,
          },
        }));
      },

      setSetupComplete: () => {
        set((state) => ({
          user: {
            ...state.user,
            isSetupComplete: true,
          },
        }));
      },

      setPlan: (plan, expiresAt) => {
        set((state) => ({
          user: {
            ...state.user,
            plan,
            planExpiresAt: expiresAt,
          },
        }));
      },

      updateCompanyBrand: (logoUrl, name) => {
        set((state) => ({
          companyLogoUrl: logoUrl || state.companyLogoUrl,
          companyName:    name    || state.companyName,
          user: {
            ...state.user,
            companyLogoUrl: logoUrl || state.user?.companyLogoUrl,
            companyName:    name    || state.user?.companyName,
          },
        }));
      },
    }),
    {
      name: 'hrms-auth',
      partialize: (state) => ({
        isLoggedIn:     state.isLoggedIn,
        user:           state.user,
        companyLogoUrl: state.companyLogoUrl,
        companyName:    state.companyName,
      }),
      version: 2,
      migrate: (persistedState) => ({
        ...persistedState,
        accessToken: null,
      }),
      onRehydrateStorage: () => (state) => {
        // Purge the legacy standalone token and never restore tokens from storage.
        localStorage.removeItem('accessToken');
        if (state?.accessToken) state.accessToken = null;
      },
    }
  )
);
