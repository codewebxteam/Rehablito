import React from 'react';

import { SuperAdminShell } from './components/SuperAdminShell';
import { RoleGuard } from '../components/RoleGuard';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['super_admin']}>
      <SuperAdminShell>{children}</SuperAdminShell>
    </RoleGuard>
  );
}
