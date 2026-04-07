import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const TOKEN_BUFFER_TIME = 5 * 60 * 1000; // 5 minutes buffer
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const TOKEN_KEY = 'auth_token';
const EXPIRES_AT_KEY = 'auth_expires_at';
const USER_KEY = 'auth_user';
const ROLES_KEY = 'auth_roles';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      roles: [],
      expiresAt: null,
      
      // Add these role checking methods
      hasRole: (role) => {
        const { roles } = get();
        return roles.includes(role);
      },
      
      hasAnyRole: (requiredRoles = []) => {
        const { roles } = get();
        if (!requiredRoles.length) return true;
        return requiredRoles.some(role => roles.includes(role));
      },
      
      login: (userData, token, refreshToken, expiresIn = 86400) => {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
        
        set({
          user: userData,
          token,
          refreshToken,
          roles: userData.roles || [],
          expiresAt: expiresAt.toISOString()
        });
        
        // Backup to localStorage for redundancy
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(EXPIRES_AT_KEY, expiresAt.toISOString());
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        localStorage.setItem(ROLES_KEY, JSON.stringify(userData.roles || []));
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          roles: [],
          expiresAt: null
        });
        
        // Clear localStorage
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(EXPIRES_AT_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(ROLES_KEY);
      },
      
      setToken: (token, refreshToken, expiresIn = 86400) => {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
        
        set({
          token,
          refreshToken,
          expiresAt: expiresAt.toISOString()
        });
        
        // Update localStorage
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(EXPIRES_AT_KEY, expiresAt.toISOString());
      },
      
      updateUserData: (userData) => {
        set({
          user: userData,
          roles: userData.roles || []
        });
        
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        localStorage.setItem(ROLES_KEY, JSON.stringify(userData.roles || []));
      },
      
      isAuthenticated: () => {
        const { token, expiresAt } = get();
        return !!token && new Date(expiresAt) > new Date();
      },
      
      isTokenExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        
        // Check with buffer time to prevent edge cases
        const expirationTime = new Date(expiresAt).getTime();
        const currentTime = Date.now();
        return currentTime >= (expirationTime - TOKEN_BUFFER_TIME);
      },
      
      isTokenValid: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        
        const expirationTime = new Date(expiresAt).getTime();
        const currentTime = Date.now();
        return currentTime < expirationTime;
      },
      
      // Check if token will expire soon (for proactive refresh)
      willTokenExpireSoon: (minutes = 5) => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        
        const expirationTime = new Date(expiresAt).getTime();
        const currentTime = Date.now();
        const bufferTime = minutes * 60 * 1000; // Convert minutes to milliseconds
        
        return currentTime >= (expirationTime - bufferTime);
      },
      
      // Initialize from localStorage (fallback for edge cases)
      initializeFromStorage: () => {
        try {
          const token = localStorage.getItem(TOKEN_KEY);
          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
          const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
          const userStr = localStorage.getItem(USER_KEY);
          const rolesStr = localStorage.getItem(ROLES_KEY);
          
          if (token && refreshToken && expiresAt) {
            const user = userStr ? JSON.parse(userStr) : null;
            const roles = rolesStr ? JSON.parse(rolesStr) : [];
            
            set({
              user,
              token,
              refreshToken,
              roles,
              expiresAt
            });
            
            console.log('Auth state initialized from localStorage');
            return true;
          }
        } catch (error) {
          console.error('Error initializing auth from localStorage:', error);
        }
        return false;
      },
      
      // Clear all auth data (for debugging)
      clearAll: () => {
        get().logout();
        console.log('All auth data cleared');
      }
    }),
    {
      name: 'emr-auth-storage',
      getStorage: () => localStorage,
      // Custom partialize to ensure all data is saved
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        roles: state.roles,
        expiresAt: state.expiresAt,
      }),
      // Custom merge to handle migration or conflicts
      merge: (persistedState, currentState) => {
        // Prioritize persisted state
        if (persistedState && typeof persistedState === 'object') {
          return {
            ...currentState,
            ...persistedState,
            // Ensure we always have the latest methods
            hasRole: currentState.hasRole,
            hasAnyRole: currentState.hasAnyRole,
            login: currentState.login,
            logout: currentState.logout,
            setToken: currentState.setToken,
            updateUserData: currentState.updateUserData,
            isAuthenticated: currentState.isAuthenticated,
            isTokenExpired: currentState.isTokenExpired,
            isTokenValid: currentState.isTokenValid,
            willTokenExpireSoon: currentState.willTokenExpireSoon,
            initializeFromStorage: currentState.initializeFromStorage,
            clearAll: currentState.clearAll,
          };
        }
        return currentState;
      },
      // Custom version for migrations
      version: 1,
    }
  )
);

// Initialize auth state on module load
if (typeof window !== 'undefined') {
  // Try to initialize from localStorage as fallback
  const authStore = useAuthStore.getState();
  
  // First, check if we have data in zustand storage
  const hasZustandData = authStore.token && authStore.expiresAt;
  
  // If not, try to initialize from localStorage
  if (!hasZustandData) {
    authStore.initializeFromStorage();
  }
  
  // Validate token on startup
  if (authStore.token && authStore.isTokenExpired()) {
    console.warn('Token expired on app startup');
    // Don't logout immediately - let the interceptor handle it
  }
}

export default useAuthStore;