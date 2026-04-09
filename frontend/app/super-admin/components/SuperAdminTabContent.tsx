"use client";

import React from 'react';

import { DashboardView } from '../views/DashboardView';
import { PatientsView } from '../views/PatientsView';
import { LeadsView } from '../views/LeadsView';
import { StaffView } from '../views/StaffView';
import { AttendanceView } from '../views/AttendanceView';
import { FinanceView } from '../views/FinanceView';
import { SuperAdminTab } from '../lib/navigation';

interface SuperAdminTabContentProps {
  tab: SuperAdminTab;
}

export default function SuperAdminTabContent({ tab }: SuperAdminTabContentProps) {
  if (tab === 'dashboard') return <DashboardView />;
  if (tab === 'patients') return <PatientsView />;
  if (tab === 'leads') return <LeadsView />;
  if (tab === 'staff') return <StaffView />;
  if (tab === 'attendance') return <AttendanceView />;
  if (tab === 'finance') return <FinanceView />;
  if (tab === 'branches') {
    return (
      <div className="max-w-3xl rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-sm">
        <h3 className="text-2xl font-black text-on-surface">Branches</h3>
        <p className="mt-2 text-sm text-on-surface-variant">This section is coming soon.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-sm">
      <h3 className="text-2xl font-black text-on-surface">Settings</h3>
      <p className="mt-2 text-sm text-on-surface-variant">This section is coming soon.</p>
    </div>
  );
}
