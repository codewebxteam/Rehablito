"use client";

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { SearchProvider } from './context/SearchContext';
import { AuthScreen } from './components/AuthScreen';
import { MainLayout } from './components/MainLayout';

function StaffWebLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevents hydration mismatch
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <MainLayout>{children}</MainLayout>;
}

export default function StaffWebLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <SearchProvider>
          <StaffWebLayoutContent>{children}</StaffWebLayoutContent>
        </SearchProvider>
      </AttendanceProvider>
    </AuthProvider>
  );
}
