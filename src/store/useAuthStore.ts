import { create } from 'zustand';
import { api } from '../services/api';
import { authStorage } from '../services/authStorage';
import { User } from '../types';

type SessionPurgeHandler = (userId?: string | null) => Promise<void> | void;
const sessionPurgeHandlers = new Set<SessionPurgeHandler>();

export const registerSessionPurgeHandler = (handler: SessionPurgeHandler) => {
  sessionPurgeHandlers.add(handler);
  return () => sessionPurgeHandlers.delete(handler);
};

type AuthSuccessHandler = (user: User) => Promise<void> | void;
const authSuccessHandlers = new Set<AuthSuccessHandler>();

export const registerAuthSuccessHandler = (handler: AuthSuccessHandler) => {
  authSuccessHandlers.add(handler);
  return () => authSuccessHandlers.delete(handler);
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;

  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; current_password?: string; new_password?: string }) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const purgeAllSessionData = async (userId?: string | null) => {
  for (const handler of sessionPurgeHandlers) {
    try {
      await handler(userId);
    } catch {}
  }
  await authStorage.clearTokens();
};

const notifyAuthSuccess = async (user: User) => {
  for (const handler of authSuccessHandlers) {
    try {
      await handler(user);
    } catch {}
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  isLoading: false,
  error: null,

  initAuth: async () => {
    set({ isInitializing: true, error: null });
    try {
      const token = await authStorage.getAccessToken();
      if (token) {
        try {
          const user = await api.getMe();
          set({ user, isAuthenticated: true, isInitializing: false, isLoading: false });
          await notifyAuthSuccess(user);
          return;
        } catch {
          // Token expired or invalid -> purge all residual session data
          await purgeAllSessionData();
        }
      }
    } catch {
      await purgeAllSessionData();
    }
    set({ user: null, isAuthenticated: false, isInitializing: false, isLoading: false });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const currentUserId = get().user?.id;
      await purgeAllSessionData(currentUserId);

      const data = await api.login({ email, password });
      await authStorage.setTokens(data.access_token, data.refresh_token);
      const user = await api.getMe();

      set({ user, isAuthenticated: true, isLoading: false, error: null });
      await notifyAuthSuccess(user);
    } catch (err: any) {
      set({ error: err.message || 'Error al iniciar sesión', isLoading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const currentUserId = get().user?.id;
      await purgeAllSessionData(currentUserId);

      await api.register({ name, email, password });
      const data = await api.login({ email, password });
      await authStorage.setTokens(data.access_token, data.refresh_token);
      const user = await api.getMe();

      set({ user, isAuthenticated: true, isLoading: false, error: null });
      await notifyAuthSuccess(user);
    } catch (err: any) {
      set({ error: err.message || 'Error en el registro', isLoading: false });
      throw err;
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await api.updateProfile(data);
      set({ user: updatedUser, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Error al actualizar perfil', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    const currentUserId = get().user?.id;
    try {
      await api.logout();
    } catch {}

    await purgeAllSessionData(currentUserId);

    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },

  deleteAccount: async () => {
    set({ isLoading: true, error: null });
    const currentUserId = get().user?.id;
    try {
      await api.deleteAccount();
    } catch (err: any) {
      set({ error: err.message || 'Error al eliminar cuenta', isLoading: false });
      throw err;
    } finally {
      await purgeAllSessionData(currentUserId);
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },
}));
