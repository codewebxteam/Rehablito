"use client";

import React from 'react';

import { DashboardView } from '../views/DashboardView';
import { PatientsView } from '../views/PatientsView';
import { LeadsView } from '../views/LeadsView';
import { StaffView } from '../views/StaffView';
import { AttendanceView } from '../views/AttendanceView';
import { FinanceView } from '../views/FinanceView';
import { BranchesView } from '../views/BranchesView';
import { SettingsView } from '../views/SettingsView';
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
  if (tab === 'branches') return <BranchesView />;
  if (tab === 'settings') return <SettingsView />;

  return null;
}
