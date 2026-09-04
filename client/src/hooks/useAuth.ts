import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';

export function useAuth() {
  const store = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(
    async (email: string, password: string) => {
      store.setLoading(true);
      try {
        const { user, profile, settings, token } = await authService.login(email, password);
        store.setAuth(user, profile, settings, token);
        // No manual navigate here — AuthLayout's <Navigate to="/progress" replace />
        // handles the redirect so the login page isn't duplicated in history and
        // Back never lands on the login form again.
      } finally {
        store.setLoading(false);
      }
    },
    [store]
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      store.setLoading(true);
      try {
        const { user, profile, settings, token } = await authService.register(username, email, password);
        store.setAuth(user, profile, settings, token);
      } finally {
        store.setLoading(false);
      }
    },
    [store]
  );

  const logout = useCallback(() => {
    store.logout();
    // Replace so Back doesn't return into authenticated pages after signing out.
    navigate('/', { replace: true });
  }, [store, navigate]);

  return {
    user: store.user,
    profile: store.profile,
    settings: store.settings,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login,
    register,
    logout,
  };
}
