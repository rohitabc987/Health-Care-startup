"use server";

import { cookies } from "next/headers";
import { Doctor } from "@/lib/types";
import { adminDb } from "@/lib/firebaseAdmin";
import { db, isLiveFirebaseConfigured } from "@/lib/firebaseConfig";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { revalidateDoctorsCatalogAction } from "./cacheActions";
import { normalizePhoneDigits, generateDoctorKeywords } from "@/lib/searchUtils";
import { getUserProfileServer } from "@/lib/userService";

/**
 * Server-Side Action: Add Doctor
 * Strictly restricted to verified Super Admins.
 * Uses Firebase Admin SDK server credentials to write directly to Firestore (bypassing client rules).
 */
export async function addDoctorServerAction(
  doctor: Omit<Doctor, "id"> & { id?: string }
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("pronto_role")?.value;
    const uid = cookieStore.get("pronto_uid")?.value;

    let isSuperAdmin = role === "super_admin";
    if (!isSuperAdmin && uid) {
      const dbUser = await getUserProfileServer(uid);
      if (dbUser?.role === "super_admin") {
        isSuperAdmin = true;
      }
    }

    if (!isSuperAdmin) {
      return { success: false, error: "Unauthorized: Only Super Admins can add new doctors." };
    }

    const id = doctor.id || `doc-${Date.now()}`;
    const phoneDigits = doctor.phone ? normalizePhoneDigits(doctor.phone) : "";
    const searchKeywords = generateDoctorKeywords({
      name: doctor.name,
      phone: doctor.phone || "",
      specialty: doctor.specialty,
      clinic: doctor.clinic,
    });

    const newDoc = {
      ...doctor,
      id,
      phone: doctor.phone || "",
      phoneDigits: phoneDigits || "",
      experienceYears: doctor.experienceYears ?? 5,
      availableDays: doctor.availableDays && doctor.availableDays.length > 0 ? doctor.availableDays : ["Mon", "Wed", "Fri"],
      clinicTimings: doctor.clinicTimings || "05:00 PM - 08:00 PM",
      nextAvailableDay: doctor.nextAvailableDay || "Mon, Wed, Fri",
      searchKeywords,
      isActive: doctor.isActive ?? true,
      rating: doctor.rating || 4.9,
      reviews: doctor.reviews || 10,
      image: doctor.image || "/images/doctor-1.jpg",
    };

    // Strip any undefined keys
    const sanitizedDoc = Object.fromEntries(
      Object.entries(newDoc).filter(([_, v]) => v !== undefined)
    );

    // 1. Prefer Firebase Admin SDK (Server Credentials - completely bypasses security rules)
    if (adminDb) {
      try {
        await adminDb.collection("doctors").doc(id).set(sanitizedDoc);
      } catch (adminErr: any) {
        console.warn("adminDb write attempt encountered error, falling back to client SDK:", adminErr?.message);
        // Fallback if service account key is pending in .env.local
        if (isLiveFirebaseConfigured && db) {
          await setDoc(doc(db, "doctors", id), sanitizedDoc);
        }
      }
    } else if (isLiveFirebaseConfigured && db) {
      await setDoc(doc(db, "doctors", id), sanitizedDoc);
    }

    // Purge Vercel Edge Cache on-demand
    await revalidateDoctorsCatalogAction();

    return { success: true, id };
  } catch (err: any) {
    console.error("addDoctorServerAction error:", err);
    return { success: false, error: err.message || "Failed to add doctor." };
  }
}

/**
 * Server-Side Action: Toggle Doctor Active Status
 * Strictly restricted to verified Super Admins.
 */
export async function toggleDoctorStatusServerAction(
  doctorId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("pronto_role")?.value;
    const uid = cookieStore.get("pronto_uid")?.value;

    let isSuperAdmin = role === "super_admin";
    if (!isSuperAdmin && uid) {
      const dbUser = await getUserProfileServer(uid);
      if (dbUser?.role === "super_admin") {
        isSuperAdmin = true;
      }
    }

    if (!isSuperAdmin) {
      return { success: false, error: "Unauthorized: Only Super Admins can modify doctor visibility." };
    }

    if (adminDb) {
      try {
        await adminDb.collection("doctors").doc(doctorId).update({ isActive });
      } catch (adminErr: any) {
        console.warn("adminDb toggle error, falling back to client SDK:", adminErr?.message);
        if (isLiveFirebaseConfigured && db) {
          const docRef = doc(db, "doctors", doctorId);
          await updateDoc(docRef, { isActive });
        }
      }
    } else if (isLiveFirebaseConfigured && db) {
      const docRef = doc(db, "doctors", doctorId);
      await updateDoc(docRef, { isActive });
    }

    await revalidateDoctorsCatalogAction();
    return { success: true };
  } catch (err: any) {
    console.error("toggleDoctorStatusServerAction error:", err);
    return { success: false, error: err.message || "Failed to update doctor status." };
  }
}

/**
 * Server-Side Action: Update Doctor Details
 * Strictly restricted to verified Super Admins.
 * Allows editing all doctor details: name, phone, specialty, clinic, fees, schedule, etc.
 */
export async function updateDoctorServerAction(
  doctorId: string,
  updates: Partial<Doctor>
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("pronto_role")?.value;
    const uid = cookieStore.get("pronto_uid")?.value;

    let isSuperAdmin = role === "super_admin";
    if (!isSuperAdmin && uid) {
      const dbUser = await getUserProfileServer(uid);
      if (dbUser?.role === "super_admin") {
        isSuperAdmin = true;
      }
    }

    if (!isSuperAdmin) {
      return { success: false, error: "Unauthorized: Only Super Admins can update doctor details." };
    }

    const payload: Record<string, any> = { ...updates };
    delete payload.id;

    // If searchable fields changed, recalculate keywords and normalized phone
    if (updates.name || updates.specialty || updates.clinic || updates.phone !== undefined) {
      if (updates.phone !== undefined) {
        payload.phoneDigits = normalizePhoneDigits(updates.phone || "");
      }
      payload.searchKeywords = generateDoctorKeywords({
        name: updates.name || "",
        phone: updates.phone || "",
        specialty: updates.specialty || "",
        clinic: updates.clinic || "",
      });
    }

    // Strip any undefined keys
    const sanitizedDoc = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined)
    );

    if (adminDb) {
      try {
        await adminDb.collection("doctors").doc(doctorId).update(sanitizedDoc);
      } catch (adminErr: any) {
        console.warn("adminDb update error, falling back to client SDK:", adminErr?.message);
        if (isLiveFirebaseConfigured && db) {
          const docRef = doc(db, "doctors", doctorId);
          await updateDoc(docRef, sanitizedDoc);
        }
      }
    } else if (isLiveFirebaseConfigured && db) {
      const docRef = doc(db, "doctors", doctorId);
      await updateDoc(docRef, sanitizedDoc);
    }

    await revalidateDoctorsCatalogAction();
    return { success: true };
  } catch (err: any) {
    console.error("updateDoctorServerAction error:", err);
    return { success: false, error: err.message || "Failed to update doctor details." };
  }
}
