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
   * Doctor Catalog TTL: 7 Days (604,800s)
   * Served globally from Vercel Edge CDN with 0 database reads.
   * Purged immediately on-demand when Admin toggles or adds a doctor.
   */
  DOCTORS_CATALOG_SECONDS: 604800,

  /**
   * Today's Analytics TTL: 1 Hour (3,600s)
   * Micro-cached so high admin traffic doesn't repeatedly query aggregates.
   * Purged immediately on-demand whenever a new appointment is booked.
   */
  ANALYTICS_TODAY_SECONDS: 3600,

  /**
   * Patient Bookings TTL: 1 Day (86,400s)
   * Purged immediately on-demand when a follow-up is booked or status changed.
   */
  PATIENT_BOOKINGS_SECONDS: 86400,

  /**
   * Patient Prescriptions TTL: 1 Day (86,400s)
   * Purged immediately on-demand when a new paper slip is uploaded.
   */
  PATIENT_PRESCRIPTIONS_SECONDS: 86400,

  /**
   * Patient Profile & Address TTL: 1 Day (86,400s)
   * Purged immediately on-demand when address or name is edited.
   */
  USER_PROFILE_SECONDS: 86400,
} as const;
