import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;
if (!baseURL) {
  throw new Error('VITE_API_BASE_URL is not set. Configure it before running the application.');
}

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Token helpers — the single authoritative location for JWT persistence.
// authSlice reads authToken from Redux state; this module owns the localStorage
// key so that the interceptor and authSlice use the same string.
// ---------------------------------------------------------------------------
export const TOKEN_STORAGE_KEY = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_TOKEN_STORAGE_KEY ?? 'hr_jwt_token';

export function persistToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function readToken(): string | null {
  // Prefer Redux store when available (avoids a stale-storage read), fall back
  // to localStorage so the interceptor works even before Redux hydrates.
  try {
    // Dynamic require keeps this module free of a hard import cycle with the store.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { store } = require('../store/store') as { store: { getState: () => { auth: { token: string | null } } } };
    const token = store.getState().auth.token;
    if (token) return token;
  } catch {
    // Store not yet initialised — fall through to localStorage.
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

// ---------------------------------------------------------------------------
// Request interceptor — attach JWT bearer token
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = readToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor — handle 401 by clearing state and redirecting
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { store } = require('../store/store') as { store: { dispatch: (a: unknown) => void } };
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { clearAuth } = require('../store/authSlice') as { clearAuth: () => unknown };
        store.dispatch(clearAuth());
      } catch {
        // Store not available; token already cleared from localStorage.
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ---------------------------------------------------------------------------
// Typed request helpers
// The backend wraps successful payloads in { data, meta }.
// Errors are shaped { error: { code, message } }.
// These helpers unwrap once and return the payload T directly.
// ---------------------------------------------------------------------------

interface SuccessEnvelope<T> {
  data: T;
  meta?: unknown;
}

async function unwrap<T>(promise: Promise<AxiosResponse<SuccessEnvelope<T>>>): Promise<T> {
  const response = await promise;
  const body = response.data;
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data as T;
  }
  // Some endpoints (e.g. PDF streams) return raw data — pass through.
  return body as unknown as T;
}

export function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return unwrap(apiClient.get<SuccessEnvelope<T>>(url, { params }));
}

export function post<T>(url: string, data?: unknown): Promise<T> {
  return unwrap(apiClient.post<SuccessEnvelope<T>>(url, data));
}

export function put<T>(url: string, data?: unknown): Promise<T> {
  return unwrap(apiClient.put<SuccessEnvelope<T>>(url, data));
}

export function patch<T>(url: string, data?: unknown): Promise<T> {
  return unwrap(apiClient.patch<SuccessEnvelope<T>>(url, data));
}

export function del<T>(url: string): Promise<T> {
  return unwrap(apiClient.delete<SuccessEnvelope<T>>(url));
}