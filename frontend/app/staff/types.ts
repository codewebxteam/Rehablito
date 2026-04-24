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
  status: 'present' | 'absent' | 'leave' | 'half_day' | 'on_duty';
  ward: string;
}

export interface OfficeLocation {
  lat: number;
  lng: number;
  radius: number; // meters
  name: string;
}

export const OFFICE_LOCATION: OfficeLocation = {
  lat: 37.7749, // Example: San Francisco
  lng: -122.4194,
  radius: 100,
  name: "Central Medical Plaza"
};

export const MOCK_STAFF = [
  {
    id: "1",
    staffId: "HC-000-0000",
    name: "Dr. Elena Rodriguez",
    role: "Clinical Lead",
    mobile: "1234567890",
    photoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAf5PiJmncrmmO56rA9g515Y06FMO2K1wVkibnlyUZo8CGd4zCBkTNO69XpjmLk6E51nJJj0Jm1Px7kjGKCOoRiyTltrrn7c-iqNfppLhUjPgzu5HayCP7PgXxOtFYQjgcbubhbjwr16UvN1cpTo8R8eEJTtckUoPpmoYTElisUK6Fc2vRugdTHTmD5P2JEm_-aB6q3BXKTTfq8Pjml9JP9d4DUNaFXAwfF4YMh9RB4Jso2k2uMllszdojGXXva5bW95FeyIgR5sDI5"
  }
];
