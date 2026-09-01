import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStorage } from './authStorage';

export function getApiBaseUrl(): string {
  let url = process.env.EXPO_PUBLIC_API_URL || 'https://api-aytsks.ayeapps.com/api/v1';
  if (Platform.OS === 'android' && url.includes('localhost')) {
    url = url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  return url;
}

export function getAuthApiBaseUrl(): string {
  let url = process.env.EXPO_PUBLIC_AUTH_API_URL || 'https://api-auth.ayeapps.com/api/v1';
  if (Platform.OS === 'android' && url.includes('localhost')) {
    url = url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  return url;
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  isRetry?: boolean;
  isAuthService?: boolean;
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, isRetry = false, isAuthService = false, headers = {}, ...rest } = options;
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await authStorage.getAccessToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const baseUrl = isAuthService ? getAuthApiBaseUrl() : getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
    });

    if (response.status === 401 && requiresAuth && !isRetry) {
      const refreshToken = await authStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const authBase = getAuthApiBaseUrl();
          const refreshResponse = await fetch(`${authBase}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            await authStorage.setTokens(data.access_token, data.refresh_token);
            // Replay original request with the fresh token
            return await apiRequest<T>(endpoint, {
              ...options,
              isRetry: true,
            });
          } else {
            await authStorage.clearTokens();
          }
        } catch {
          await authStorage.clearTokens();
        }
      }
    }

    if (!response.ok) {
      let errorMessage = 'Error en la solicitud';
      try {
        const err = await response.json();
        if (typeof err.detail === 'string') {
          errorMessage = err.detail;
        } else if (Array.isArray(err.detail)) {
          errorMessage = err.detail
            .map((d: any) => d.msg || d.message || JSON.stringify(d))
            .join(', ');
        } else if (err.message) {
          errorMessage = err.message;
        }
      } catch {
        if (response.status === 401) errorMessage = 'Credenciales incorrectas';
        else if (response.status === 400) errorMessage = 'Datos incorrectos';
        else if (response.status === 422) errorMessage = 'Datos inválidos en el formulario';
        else if (response.status === 429) errorMessage = 'Demasiados intentos. Espera un momento.';
        else if (response.status >= 500) errorMessage = 'Error interno del servidor';
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error: any) {
    if (
      error.name === 'TypeError' ||
      error.message?.includes('Network request failed') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError')
    ) {
      throw new Error('No se pudo conectar con el servidor. Verifica que esté encendido.');
    }
    throw error;
  }
}

export const api = {
  // Auth (Centralized in aye-auth)
  register: (data: any) =>
    apiRequest<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, app_client: 'tasks' }),
      isAuthService: true,
      requiresAuth: false,
    }),
  login: (data: any) =>
    apiRequest<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ ...data, app_client: 'tasks' }),
      isAuthService: true,
      requiresAuth: false,
    }),
  loginWithGoogle: (idToken: string) =>
    apiRequest<any>('/auth/oauth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken, app_client: 'tasks' }),
      isAuthService: true,
      requiresAuth: false,
    }),
  loginWithApple: (identityToken: string, name?: string, email?: string) =>
    apiRequest<any>('/auth/oauth/apple', {
      method: 'POST',
      body: JSON.stringify({ identity_token: identityToken, name, email, app_client: 'tasks' }),
      isAuthService: true,
      requiresAuth: false,
    }),
  logout: () => apiRequest<void>('/auth/logout', { method: 'DELETE', isAuthService: true }),
  deleteAccount: () => apiRequest<void>('/auth/me', { method: 'DELETE', isAuthService: true }),
  getMe: () => apiRequest<any>('/auth/me', { isAuthService: true }),
  updateProfile: (data: any) => apiRequest<any>('/auth/me', { method: 'PUT', body: JSON.stringify(data), isAuthService: true }),

  // Tasks
  getTasks: (dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/tasks/${qs}`);
  },
  createTask: (data: any) => apiRequest<any>('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) => apiRequest<any>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: string) => apiRequest<void>(`/tasks/${id}`, { method: 'DELETE' }),

  // Connections
  getConnections: () => apiRequest<any[]>('/connections/'),
  createConnection: (data: any) => apiRequest<any>('/connections/', { method: 'POST', body: JSON.stringify(data) }),
  deleteConnection: (id: string) => apiRequest<void>(`/connections/${id}`, { method: 'DELETE' }),

  // Time Tracking
  getActiveTimer: () => apiRequest<any>('/time/active'),
  startTimer: (taskId: string, mode = 'stopwatch') =>
    apiRequest<any>('/time/start', { method: 'POST', body: JSON.stringify({ task_id: taskId, mode }) }),
  stopTimer: (taskId?: string, notes?: string) =>
    apiRequest<any>('/time/stop', { method: 'POST', body: JSON.stringify({ task_id: taskId, notes }) }),

  // Health Check
  checkHealth: async (): Promise<boolean> => {
    const baseUrl = getApiBaseUrl();
    const healthUrl = baseUrl.endsWith('/api/v1')
      ? `${baseUrl.replace('/api/v1', '')}/health`
      : `${baseUrl}/health`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },
};
