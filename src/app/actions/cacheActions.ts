"use server";

import { updateTag, revalidatePath } from "next/cache";
import { CACHE_TAGS } from "@/lib/cacheConfig";

/**
 * On-Demand Purge: Doctor Catalog
 * Called immediately when Admin toggles a doctor or adds a new doctor.
 * Purges the Vercel Edge Cache globally so all visitors see the new doctor directory.
 */
export async function revalidateDoctorsCatalogAction() {
  try {
    updateTag(CACHE_TAGS.DOCTORS_CATALOG);
    revalidatePath("/", "page");
    revalidatePath("/admin", "page");
    return { success: true };
  } catch (err: any) {
    console.warn("revalidateDoctorsCatalogAction warning:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * On-Demand Purge: Today's Analytics & Bookings
 * Called immediately when a booking is created or appointment status changes.
 */
export async function revalidateTodayAnalyticsAction() {
  try {
    updateTag(CACHE_TAGS.ANALYTICS_TODAY);
    revalidatePath("/admin", "page");
    return { success: true };
  } catch (err: any) {
    console.warn("revalidateTodayAnalyticsAction warning:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * On-Demand Purge: Patient-Specific Passes & Prescriptions
 * Called when a patient or ground staff books a follow-up or uploads a prescription slip.
 */
export async function revalidatePatientDataAction(patientUid?: string) {
  try {
    const uid = patientUid || "patient-demo-001";
    updateTag(CACHE_TAGS.PATIENT_BOOKINGS(uid));
    updateTag(CACHE_TAGS.PATIENT_PRESCRIPTIONS(uid));
    updateTag(CACHE_TAGS.USER_PROFILE(uid));
    updateTag(CACHE_TAGS.ANALYTICS_TODAY);
    revalidatePath("/bookings", "page");
    revalidatePath("/prescriptions", "page");
    revalidatePath("/profile", "page");
    return { success: true };
  } catch (err: any) {
    console.warn("revalidatePatientDataAction warning:", err.message);
    return { success: false, error: err.message };
  }
}
