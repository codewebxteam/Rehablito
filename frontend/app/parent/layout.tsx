import React from 'react';
import { RoleGuard } from '../components/RoleGuard';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['parent']}>
      {children}
    </RoleGuard>
  );
}
