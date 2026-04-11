import React from 'react';
import { RoleGuard } from '../components/RoleGuard';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['super_admin', 'branch_manager']}>
      {children}
    </RoleGuard>
  );
}
