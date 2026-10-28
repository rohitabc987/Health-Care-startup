// Core TypeScript Types & Database Schemas for Pronto Health

export interface UserAddress {
  houseNo?: string;
  street?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  role?: 'patient' | 'doctor' | 'admin';
  healthId?: string;
  address?: UserAddress;
  createdAt?: any;
  defaultClinic?: string;
  registeredByGroundTeam?: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  specialtyCategory?: string;
  clinic: string;
  clinicId?: string;
  rating: number;
  reviews: number;
  image: string;
  experienceYears?: number;
  isNew?: boolean;
  isActive?: boolean;
  nextAvailableDay?: string;
  consultationFee: number;
  regularFee: number;
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
  patientHealthId?: string;
  patientAddress?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  clinicName?: string;
  bookingDate: string; // ISO "YYYY-MM-DD" e.g. "2026-10-28" for date-scoped aggregate queries
  followupDate: string; // ISO date or formatted (e.g., "Nov 02, 2026")
  timeWindow: string;   // e.g. "Evening (5:00 PM - 7:00 PM)"
  status: AppointmentStatus;
  prescriptionUrl: string;
  createdAt: any;
  consultationFee: number;
  notes?: string;
  queueBypassCode?: string; // High-priority clinic bypass token if escalated
}

export interface PrescriptionRecord {
  id: string;
  patientUid: string;
  doctorName: string;
  clinicName: string;
  visitDate: string;
  imageUrl: string;
  pdfUrl?: string;
  uploadedAt: string;
  chiefComplaint?: string;
  scheduledFollowupDate?: string;
  fileSizeBytes?: number;
}
