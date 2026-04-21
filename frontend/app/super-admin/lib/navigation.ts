export const SUPER_ADMIN_TABS = [
  'dashboard',
  'patients',
  'leads',
  'staff',
  'attendance',
  'finance',
  'branches',
  'services',
  'settings'
] as const;

export type SuperAdminTab = (typeof SUPER_ADMIN_TABS)[number];

export const TAB_LABELS: Record<SuperAdminTab, string> = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  leads: 'Leads',
  staff: 'Staff',
  attendance: 'Attendance',
  finance: 'Finance',
  branches: 'Branches',
  services: 'Services',
  settings: 'Settings'
};

export const isSuperAdminTab = (value: string): value is SuperAdminTab => {
  return SUPER_ADMIN_TABS.includes(value as SuperAdminTab);
};
