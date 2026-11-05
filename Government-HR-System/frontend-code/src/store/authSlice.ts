import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../backend-code/src/types';

export type UserRole = 'HR Staff' | 'Manager' | 'Employee';

export interface AuthUser {
  employeeId: string;
  role: UserRole;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

const TOKEN_STORAGE_KEY = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_TOKEN_STORAGE_KEY ?? 'hr_auth_token';

function loadTokenFromStorage(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseUserFromToken(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    const employeeId: string = decoded.EmployeeID ?? decoded.employeeId ?? decoded.sub ?? '';
    const role: UserRole = decoded.Role ?? decoded.role ?? '';
    if (!employeeId || !role) return null;
    return { employeeId, role };
  } catch {
    return null;
  }
}

const storedToken = loadTokenFromStorage();
const initialUser = storedToken ? parseUserFromToken(storedToken) : null;

const initialState: AuthState = {
  token: storedToken,
  user: initialUser,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<{ token: string }>) {
      const { token } = action.payload;
      state.token = token;
      state.user = parseUserFromToken(token);
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } catch {
        // storage unavailable
      }
    },
    logout(state) {
      state.token = null;
      state.user = null;
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {
        // storage unavailable
      }
    },
  },
});

export const { login, logout } = authSlice.actions;

export const selectCurrentUser = (state: RootState): AuthUser | null => state.auth.user;
export const selectToken = (state: RootState): string | null => state.auth.token;

export default authSlice;