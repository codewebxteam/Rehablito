import { notFound } from 'next/navigation';

import { isSuperAdminTab } from '../lib/navigation';
import SuperAdminTabContent from '../components/SuperAdminTabContent';
import {
  fetchDashboardData,
  fetchPatients,
  fetchStaff,
  fetchLeads,
  fetchBranches,
  fetchAttendance,
  fetchFees,
  fetchFeeSummary,
} from '@/lib/server-api';

interface SuperAdminTabPageProps {
  params: Promise<{ tab: string }>;
}

export default async function SuperAdminTabPage({ params }: SuperAdminTabPageProps) {
  const { tab } = await params;

  if (!isSuperAdminTab(tab)) {
    notFound();
  }

  // Server-side data fetching based on active tab
  let initialData: any = null;

  try {
    switch (tab) {
      case 'dashboard': {
        const res = await fetchDashboardData();
        if (res.success) initialData = res.data;
        break;
      }
      case 'patients': {
        const [patientsRes, branchesRes] = await Promise.all([
          fetchPatients(1, 20),
          fetchBranches(),
        ]);
        initialData = {
          patients: patientsRes.success ? patientsRes.data : [],
          total: patientsRes.total || 0,
          page: patientsRes.page || 1,
          pages: patientsRes.pages || 1,
          branches: branchesRes.success ? branchesRes.data : [],
        };
        break;
      }
      case 'staff': {
        const [staffRes, branchesRes] = await Promise.all([
          fetchStaff(1, 20),
          fetchBranches(),
        ]);
        initialData = {
          staff: staffRes.success ? staffRes.data : [],
          total: staffRes.total || 0,
          page: staffRes.page || 1,
          pages: staffRes.pages || 1,
          branches: branchesRes.success ? branchesRes.data : [],
        };
        break;
      }
      case 'leads': {
        const [leadsRes, branchesRes] = await Promise.all([
          fetchLeads(1, 20),
          fetchBranches(),
        ]);
        initialData = {
          leads: leadsRes.success ? leadsRes.data : [],
          total: leadsRes.total || 0,
          page: leadsRes.page || 1,
          pages: leadsRes.pages || 1,
          branches: branchesRes.success ? branchesRes.data : [],
        };
        break;
      }
      case 'attendance': {
        const [attendanceRes, branchesRes] = await Promise.all([
          fetchAttendance(),
          fetchBranches(),
        ]);
        initialData = {
          attendance: attendanceRes.success ? attendanceRes.data : [],
          branches: branchesRes.success ? branchesRes.data : [],
        };
        break;
      }
      case 'finance': {
        const [feesRes, summaryRes, branchesRes] = await Promise.all([
          fetchFees(1, 20),
          fetchFeeSummary(),
          fetchBranches(),
        ]);
        initialData = {
          fees: feesRes.success ? feesRes.data : [],
          summary: summaryRes.success ? summaryRes.data : null,
          branches: branchesRes.success ? branchesRes.data : [],
        };
        break;
      }
      case 'branches': {
        const branchesRes = await fetchBranches();
        initialData = {
          branches: branchesRes.success ? branchesRes.data : [],
        };
        break;
      }
      case 'settings':
        // No server data needed
        break;
    }
  } catch (error) {
    console.error(`Failed to pre-fetch data for tab: ${tab}`, error);
  }

  return <SuperAdminTabContent tab={tab} initialData={initialData} />;
}
