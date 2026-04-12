"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleLabel = (role?: string) => {
  switch (role) {
    case 'staff': return 'Therapist';
    case 'branch_manager': return 'Branch Manager';
    case 'super_admin': return 'Super Admin';
    default: return role || 'Staff';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncSession = async () => {
      const token = Cookies.get('rehablito_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        const staffUser: User = {
          id: data.id,
          staffId: data.staffId || '',
          name: data.name || 'Staff Member',
          role: roleLabel(data.role),
          mobile: data.phone || '',
          photoUrl: '',
        };
        setUser(staffUser);
      } catch (err) {
        console.error('Failed to load session:', err);
        Cookies.remove('rehablito_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    syncSession();
  }, []);

  const logout = () => {
    Cookies.remove('rehablito_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      logout,
      isAuthenticated: !!user,
    }}>
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
