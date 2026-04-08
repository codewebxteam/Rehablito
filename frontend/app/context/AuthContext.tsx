"use client";
/**
 * Rehablito RMS — Auth Context
 * Provides user + token state, login/logout actions, and initializes
 * session from localStorage on mount.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  AuthUser,
  getToken,
  setToken,
  setUser,
  getUser,
  clearAuth,
} from '@/lib/auth';

interface LoginPayload {
  email: string;
  password: string;
  role?: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session from localStorage and validate with /me
  useEffect(() => {
    const storedToken = getToken();
    const storedUser  = getUser();

    if (storedToken && storedUser) {
      setTokenState(storedToken);
      setUserState(storedUser);

      // Silently validate token in background
      api.get<AuthUser>('/auth/me')
        .then((me) => {
          setUserState(me);
          setUser(me);
        })
        .catch(() => {
          clearAuth();
          setTokenState(null);
          setUserState(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await api.post<{ success: boolean; token: string; user: AuthUser }>(
      '/auth/login',
      payload
    );
    setToken(data.token);
    setUser(data.user);
    setTokenState(data.token);
    setUserState(data.user);

    // Redirect based on role
    if (data.user.role === 'super_admin') {
      router.push('/super-admin');
    } else if (data.user.role === 'branch_manager') {
      router.push('/manager');
    } else {
      router.push('/');
    }
  }, [router]);

  const register = useCallback(async (payload: RegisterPayload) => {
    await api.post('/auth/register', { ...payload, role: 'public_user' });
    router.push('/login?registered=1');
  }, [router]);

  const logout = useCallback(() => {
    clearAuth();
    setTokenState(null);
    setUserState(null);
    router.push('/login');
  }, [router]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

/**
 * Route guard hook — call at top of protected pages.
 * Redirects to /login if unauthenticated or wrong role.
 */
export function useRequireAuth(requiredRole?: AuthUser['role'] | AuthUser['role'][]) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!user || !roles.includes(user.role)) {
        // Wrong role — redirect to appropriate dashboard
        if (user?.role === 'super_admin') router.push('/super-admin');
        else if (user?.role === 'branch_manager') router.push('/manager');
        else router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, router, user]);

  return { user, isLoading };
}
