export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  phone: string;
  onboardedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: 'New' | 'Contacted' | 'Converted' | 'Cold' | 'Hot' | 'In Discussion';
  dateReceived: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Physio' | 'Admin' | 'Support';
  status: 'Active' | 'Inactive';
  email: string;
  attendance: AttendanceRecord[];
}

export interface AttendanceRecord {
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  checkIn?: string;
}

export interface BillingRecord {
  id: string;
  patientName: string;
  amountPaid: number;
  dueAmount: number;
  date: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  sessions: number | string;
  price: number;
}

export type ViewType = 'dashboard' | 'onboarding' | 'leads' | 'staff' | 'billing';
