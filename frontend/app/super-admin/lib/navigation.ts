export const SUPER_ADMIN_TABS = [
  'dashboard',
  'patients',
  'patient-attendance', // 🔥 NEW: Added Patient Attendance tab
  'leads',
  'staff',
  'attendance',
  'finance',
  'branches',
  'services',
  'feedbacks',
  'settings'
] as const;

export type SuperAdminTab = (typeof SUPER_ADMIN_TABS)[number];

export const TAB_LABELS: Record<SuperAdminTab, string> = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  'patient-attendance': 'Patient Attendance', // 🔥 NEW: Label for UI
  leads: 'Leads',
  staff: 'Staff',
  attendance: 'Staff Attendance', // (Optional) Thoda clear karne ke liye isko 'Staff Attendance' kar sakte ho, ya sirf 'Attendance' rehne do
  finance: 'Finance',
  branches: 'Branches',
  services: 'Services',
  feedbacks: 'Feedbacks',
  settings: 'Settings'
};

export const isSuperAdminTab = (value: string): value is SuperAdminTab => {
  return SUPER_ADMIN_TABS.includes(value as SuperAdminTab);
};