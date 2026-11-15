import type { Doctor, UserProfile, PrescriptionRecord, Appointment } from "./types";

/**
 * 100% Database-Driven: Zero mock data.
 * All doctors, appointments, prescriptions, and users are loaded strictly from Firestore.
 */
export const INITIAL_DOCTORS: Doctor[] = [];
export const INITIAL_APPOINTMENTS: Appointment[] = [];
export const INITIAL_PRESCRIPTIONS: PrescriptionRecord[] = [];
export const INITIAL_USER: UserProfile | null = null;
