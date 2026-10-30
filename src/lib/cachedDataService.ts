import { unstable_cache } from "next/cache";
import { CACHE_TAGS, CACHE_TTL } from "./cacheConfig";
import { getActiveDoctorsServer } from "./doctorsService";
import { getTodayOverallSales, getAppointmentsServer } from "./appointmentsService";
import { getPrescriptionsServer } from "./prescriptionsService";
import { getUserProfileServer } from "./userService";
import { Doctor, Appointment, PrescriptionRecord, UserProfile } from "./types";

/**
 * 1. Cached Active Doctors Directory
 * Strategy: On-Demand Revalidation + 24-Hour TTL
 * Serves 10,000+ visitors directly from Vercel Edge with ZERO database reads.
 */
export const getCachedActiveDoctors = unstable_cache(
  async (): Promise<Doctor[]> => {
    return await getActiveDoctorsServer();
  },
  ["cached-active-doctors-key"],
  {
    revalidate: CACHE_TTL.DOCTORS_CATALOG_SECONDS,
    tags: [CACHE_TAGS.DOCTORS_CATALOG],
  }
);

/**
 * 2. Cached Today's Sales & Patient Volume
 * Strategy: Time-Based Micro-ISR (60s) + On-Demand Tag on New Bookings
 * Prevents multiple admin or dashboard views from repeatedly running aggregate sums.
 */
export async function getCachedTodaySales(dateStr: string): Promise<{ totalPatients: number; totalRevenue: number }> {
  return unstable_cache(
    async () => getTodayOverallSales(dateStr),
    [`today-sales-aggregate-${dateStr}`],
    {
      revalidate: CACHE_TTL.ANALYTICS_TODAY_SECONDS,
      tags: [CACHE_TAGS.ANALYTICS_TODAY],
    }
  )();
}

/**
 * 3. Cached Patient Appointments & Follow-up Passes
 * Strategy: User-Scoped Tag + 5-Minute TTL
 */
export async function getCachedAppointments(patientUid?: string): Promise<Appointment[]> {
  if (!patientUid) return [];
  return unstable_cache(
    async () => getAppointmentsServer(patientUid),
    [`patient-appointments-${patientUid}`],
    {
      revalidate: CACHE_TTL.PATIENT_BOOKINGS_SECONDS,
      tags: [CACHE_TAGS.PATIENT_BOOKINGS(patientUid)],
    }
  )();
}

/**
 * 4. Cached Patient Prescriptions Vault
 * Strategy: User-Scoped Tag + 10-Minute TTL
 */
export async function getCachedPrescriptions(patientUid?: string): Promise<PrescriptionRecord[]> {
  if (!patientUid) return [];
  return unstable_cache(
    async () => getPrescriptionsServer(patientUid),
    [`patient-prescriptions-${patientUid}`],
    {
      revalidate: CACHE_TTL.PATIENT_PRESCRIPTIONS_SECONDS,
      tags: [CACHE_TAGS.PATIENT_PRESCRIPTIONS(patientUid)],
    }
  )();
}

/**
 * 5. Cached User Profile & Address
 * Strategy: User-Scoped Tag + 10-Minute TTL
 */
export async function getCachedUserProfile(uid?: string): Promise<UserProfile | null> {
  if (!uid) return null;
  return unstable_cache(
    async () => getUserProfileServer(uid),
    [`patient-profile-${uid}`],
    {
      revalidate: CACHE_TTL.USER_PROFILE_SECONDS,
      tags: [CACHE_TAGS.USER_PROFILE(uid)],
    }
  )();
}
