"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MOCK_STAFF } from '../types';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (staffId: string) => Promise<User>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync with global session
  useEffect(() => {
    const syncSession = async () => {
      const token = Cookies.get('rehablito_token');
      const savedUser = localStorage.getItem('auth_user');

      if (token) {
        try {
          const res = await api.get('/auth/me');
          const backendUser = res.data;
          
          const staffUser: User = {
            id: backendUser._id,
            staffId: backendUser.staffId || "HC-000-0000",
            name: backendUser.name || "Staff Member",
            role: backendUser.role === 'staff' ? 'Therapist' : backendUser.role,
            mobile: backendUser.mobileNumber || "",
            photoUrl: backendUser.photoUrl || "https://picsum.photos/seed/staff/100/100"
          };
          
          setUser(staffUser);
          localStorage.setItem('auth_user', JSON.stringify(staffUser));
        } catch (error) {
          console.error("Failed to sync session:", error);
          localStorage.removeItem('auth_user');
        }
      } else if (savedUser) {
        // Fallback for offline/mock testing if desired
        setUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
    };

    syncSession();
  }, []);

  const login = async (staffId: string) => {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const found = MOCK_STAFF.find(s => s.staffId === staffId);
    if (!found) throw new Error("Invalid Staff ID");
    setTempUser(found);
    return found;
  };

  const verifyOtp = async (otp: string) => {
    // Mock OTP verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (otp !== "123456") throw new Error("Invalid OTP. Use 123456");
    if (!tempUser) throw new Error("Session expired");
    setUser(tempUser);
    setTempUser(null);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    Cookies.remove('rehablito_token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      verifyOtp,
      logout,
      isAuthenticated: !!user
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
