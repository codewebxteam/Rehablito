"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { SuperAdminTab } from '../lib/navigation';

// Dynamic imports — each view is code-split and loaded only when its tab is active
const DashboardView = dynamic(() => import('../views/DashboardView').then(m => ({ default: m.DashboardView })), {
  loading: () => <ViewSkeleton />,
});
const PatientsView = dynamic(() => import('../views/PatientsView').then(m => ({ default: m.PatientsView })), {
  loading: () => <ViewSkeleton />,
});
const LeadsView = dynamic(() => import('../views/LeadsView').then(m => ({ default: m.LeadsView })), {
  loading: () => <ViewSkeleton />,
});
const StaffView = dynamic(() => import('../views/StaffView').then(m => ({ default: m.StaffView })), {
  loading: () => <ViewSkeleton />,
});
const AttendanceView = dynamic(() => import('../views/AttendanceView').then(m => ({ default: m.AttendanceView })), {
  loading: () => <ViewSkeleton />,
});
const FinanceView = dynamic(() => import('../views/FinanceView').then(m => ({ default: m.FinanceView })), {
  loading: () => <ViewSkeleton />,
});
const BranchesView = dynamic(() => import('../views/BranchesView').then(m => ({ default: m.BranchesView })), {
  loading: () => <ViewSkeleton />,
});
const ServicesView = dynamic(() => import('../views/ServicesView').then(m => ({ default: m.ServicesView })), {
  loading: () => <ViewSkeleton />,
});
const SettingsView = dynamic(() => import('../views/SettingsView').then(m => ({ default: m.SettingsView })), {
  loading: () => <ViewSkeleton />,
});

function ViewSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-surface-container-low rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-surface-container-low rounded-2xl" />
      <div className="h-96 bg-surface-container-low rounded-2xl" />
    </div>
  );
}

interface SuperAdminTabContentProps {
  tab: SuperAdminTab;
  initialData?: any;
}

const SuperAdminTabContent = React.memo(function SuperAdminTabContent({ tab, initialData }: SuperAdminTabContentProps) {
  if (tab === 'dashboard') return <DashboardView initialData={initialData} />;
  if (tab === 'patients') return <PatientsView initialData={initialData} />;
  if (tab === 'leads') return <LeadsView initialData={initialData} />;
  if (tab === 'staff') return <StaffView initialData={initialData} />;
  if (tab === 'attendance') return <AttendanceView initialData={initialData} />;
  if (tab === 'finance') return <FinanceView initialData={initialData} />;
  if (tab === 'branches') return <BranchesView initialData={initialData} />;
  if (tab === 'services') return <ServicesView />;
  if (tab === 'settings') return <SettingsView />;

  return null;
});

export default SuperAdminTabContent;
