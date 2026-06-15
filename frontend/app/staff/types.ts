export interface User {
  id: string;
  staffId: string;
  name: string;
  role: string;
  email: string;
  mobile: string;
  photoUrl: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  branchId?: {
    name: string;
  };
  date: string; // ISO date
  checkIn: string; // ISO timestamp
  checkOut?: string; // ISO timestamp
  totalHours?: number;
  dutyHours?: number;
  autoCheckedOut?: boolean;
  status: 'present' | 'absent' | 'leave' | 'half_day' | 'on_duty';
  ward: string;
}

export interface OfficeLocation {
  lat: number;
  lng: number;
  radius: number; // meters
  name: string;
}

