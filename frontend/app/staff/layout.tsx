"use client";

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { SearchProvider } from './context/SearchContext';
import { MainLayout } from './components/MainLayout';
import { RoleGuard } from '../components/RoleGuard';

function StaffWebLayoutContent({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevents hydration mismatch
  }

  return <MainLayout>{children}</MainLayout>;
}

export default function StaffWebLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['super_admin', 'branch_manager', 'staff']}>
      <AuthProvider>
        <AttendanceProvider>
          <SearchProvider>
            <StaffWebLayoutContent>{children}</StaffWebLayoutContent>
          </SearchProvider>
        </AttendanceProvider>
      </AuthProvider>
    </RoleGuard>
  );
}
