"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'branch_manager' | 'staff' | 'user';
  branchId?: string;
  staffId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  requestOtp: (staffId: string, mobileNumber: string) => Promise<boolean>;
  verifyOtp: (staffId: string, otp: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('rehablito_token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data);
        } catch (error) {
          console.error("Failed to fetch user:", error);
          Cookies.remove('rehablito_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const redirectByRole = (role: string) => {
    switch (role) {
      case 'super_admin':
        router.push('/super-admin');
        break;
      case 'branch_manager':
        router.push('/manager');
        break;
      case 'staff':
        router.push('/staff');
        break;
      default:
        router.push('/');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/login', { email, password });
      
      if (data.success) {
        Cookies.set('rehablito_token', data.token, { expires: 30 });
        setUser(data.user);
        toast.success(`Welcome back, ${data.user.name}!`);
        redirectByRole(data.user.role);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async (staffId: string, mobileNumber: string) => {
    try {
      const { data } = await api.post('/auth/request-otp', { staffId, mobileNumber });
      if (data.success) {
        toast.success('Access code sent to your mobile number.');
        return true;
      }
      return false;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send access code.';
      toast.error(message);
      return false;
    }
  };

  const verifyOtp = async (staffId: string, otp: string) => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/verify-otp', { staffId, otp });
      
      if (data.success) {
        Cookies.set('rehablito_token', data.token, { expires: 30 });
        setUser(data.user);
        toast.success(`Welcome to the portal, ${data.user.name}!`);
        redirectByRole(data.user.role);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid or expired access code.';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('rehablito_token');
    setUser(null);
    router.push('/login');
    toast.message('You have been logged out.');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, requestOtp, verifyOtp, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
