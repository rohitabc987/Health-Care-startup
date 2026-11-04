// Core TypeScript Types & Database Schemas for Pronto Health

export interface UserAddress {
  locality?: string;
  city?: string;
  houseNo?: string;
  street?: string;
  state?: string;
  pincode?: string;
}

export type UserRole = 'patient' | 'doctor' | 'staff' | 'super_admin';

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  phoneDigits?: string;
  gender?: "male" | "female" | "other";
  age?: number;
  role?: UserRole;
  doctorId?: string;
  healthId?: string;
  address?: UserAddress;
  createdAt?: any;
  isNewUser?: boolean;
  searchKeywords?: string[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  phone?: string;
  phoneDigits?: string;
  rating: number;
  reviews: number;
  image: string;
  experienceYears?: number; // Optional
  isNew?: boolean;
  isActive?: boolean;
  availableDays?: string[]; // e.g. ["Mon", "Wed", "Fri"] or ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  clinicTimings?: string;   // e.g. "5:00 PM - 8:00 PM"
  nextAvailableDay?: string; // Formatted display or dynamic calculation
  consultationFee: number;
  regularFee: number;
  searchKeywords?: string[];
}

export type AppointmentStatus = 
  | 'Pending Screening' 
  | 'Escalated to Physical Visit' 
  | 'Screening Complete';

export interface Appointment {
  id: string;
  patientUid: string;
  patientName?: string;
  patientPhone?: string;
  patientPhoneDigits?: string;
  patientHealthId?: string;
  patientAddress?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  doctorImage?: string;
  clinicName?: string;
  followupDate: string; // ISO date or formatted (e.g., "Nov 02, 2026")
  timeWindow: string;   // e.g. "Evening (5:00 PM - 7:00 PM)"
  status: AppointmentStatus;
  createdAt: any;       // Timestamp when booked (replaces redundant bookingDate)
  consultationFee: number;
  notes?: string;
  queueBypassCode?: string; // High-priority clinic bypass token if escalated
  searchKeywords?: string[];
}

export interface PrescriptionRecord {
  id: string;
  patientUid: string;
  doctorName: string;
  clinicName: string;
  visitDate: string;
  imageUrl: string;
  uploadedAt: string;
  chiefComplaint?: string;
}

