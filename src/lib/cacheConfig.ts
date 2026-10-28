// =====================================================================
// Centralized Vercel Edge & Server Caching Configuration
// To adjust cache duration or tags anywhere in the platform, edit values here.
// =====================================================================

export const CACHE_TAGS = {
  /** Tag for all active doctors displayed on Home & Directory */
  DOCTORS_CATALOG: "doctors-catalog",

  /** Tag for today's aggregate revenue & booking volume for Admin Desk */
  ANALYTICS_TODAY: "analytics-today",

  /** User-scoped tag for patient follow-up passes */
  PATIENT_BOOKINGS: (uid: string) => `patient-bookings-${uid}`,

  /** User-scoped tag for saved medical prescriptions & slips */
  PATIENT_PRESCRIPTIONS: (uid: string) => `patient-prescriptions-${uid}`,

  /** User-scoped tag for patient profile & address */
  USER_PROFILE: (uid: string) => `user-profile-${uid}`,
} as const;

export const CACHE_TTL = {
  /**
   * Doctor Catalog TTL: 24 Hours (86,400s)
   * Served globally from Vercel Edge CDN with 0 database reads.
   * Purged immediately on-demand when Admin toggles or adds a doctor.
   */
  DOCTORS_CATALOG_SECONDS: 86400,

  /**
   * Today's Analytics TTL: 60 Seconds
   * Micro-cached so high admin traffic doesn't repeatedly query aggregates.
   * Purged immediately on-demand whenever a new appointment is booked.
   */
  ANALYTICS_TODAY_SECONDS: 60,

  /**
   * Patient Bookings TTL: 5 Minutes (300s)
   * Purged immediately on-demand when a follow-up is booked or status changed.
   */
  PATIENT_BOOKINGS_SECONDS: 300,

  /**
   * Patient Prescriptions TTL: 10 Minutes (600s)
   * Purged immediately on-demand when a new paper slip is uploaded.
   */
  PATIENT_PRESCRIPTIONS_SECONDS: 600,

  /**
   * Patient Profile & Address TTL: 10 Minutes (600s)
   * Purged immediately on-demand when address or name is edited.
   */
  USER_PROFILE_SECONDS: 600,
} as const;
