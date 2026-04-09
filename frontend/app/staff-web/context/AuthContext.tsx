"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MOCK_STAFF } from '../types';

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

  // Use effect for hydration
  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (user !== null) {
      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('auth_user');
      }
    }
  }, [user]);

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
