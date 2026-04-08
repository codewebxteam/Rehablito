/**
 * Rehablito RMS — Auth token & user helpers
 * Thin wrappers around localStorage to decouple storage from logic.
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'branch_manager' | 'staff' | 'public_user';
  phone?: string;
  branchId?: string;
  staffId?: string;
}

const TOKEN_KEY = 'rehablito_token';
const USER_KEY  = 'rehablito_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function clearAuth(): void {
  removeToken();
  removeUser();
}
