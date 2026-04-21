export interface Patient {
  id: string;
  patientId?: string;
  name: string;
  parentName?: string;
  age: number;
  gender: string;
  therapyType?: string;
  condition: string;
  address?: string;
  phone: string;
  onboardedAt: string;
  totalFee?: number;
  serviceId?: string;
}

export interface Lead {
  id: string;
  name: string;
  parentName?: string;
  phone: string;
  email?: string;
  age?: number;
  service?: string;
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
  patientId?: string;
  patientName: string;
  amountPaid: number;
  dueAmount: number;
  date: string;
  method?: 'cash' | 'upi' | 'bank_transfer' | 'card';
  status?: 'paid' | 'partial' | 'overdue' | 'pending';
  receiptNumber?: string;
  description?: string;
  items: InvoiceItem[];
}

export interface NewPaymentInput {
  patientId: string;
  patientName: string;
  amount: number;
  dueAmount: number;
  description?: string;
  method?: BillingRecord['method'];
}

export interface InvoiceItem {
  description: string;
  sessions: number | string;
  price: number;
}

export type ViewType = 'dashboard' | 'onboarding' | 'patients' | 'leads' | 'staff' | 'billing' | 'services';
