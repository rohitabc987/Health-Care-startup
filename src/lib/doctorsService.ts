import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  getDocs,
  getDoc,
  where,
  limit
} from "firebase/firestore";
import { Doctor } from "./types";
import { db, isLiveFirebaseConfigured } from "@/lib/firebaseConfig";
import { generateDoctorKeywords, normalizePhoneDigits, normalizeSearchQuery } from "./searchUtils";

const LOCAL_STORAGE_KEY_DOCTORS = "pronto_doctors_catalog";
const doctorSubscribers: Array<(doctors: Doctor[]) => void> = [];

export function getStoredDoctors(): Doctor[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_DOCTORS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Purge any legacy mock doctors (doc-1, doc-2, etc.)
      const cleaned = parsed.filter(
        (d) => !["doc-1", "doc-2", "doc-3", "doc-4"].includes(d.id) && d.name !== "Dr. Ananya Sharma"
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(LOCAL_STORAGE_KEY_DOCTORS, JSON.stringify(cleaned));
      }
      return cleaned;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredDoctors(data: Doctor[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_DOCTORS, JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  }
  doctorSubscribers.forEach((cb) => cb(data));
}

/**
 * Server-Side Fetcher for Server Components (e.g. page.tsx)
 * Queries strictly from the Firestore database.
 */
export async function getActiveDoctorsServer(): Promise<Doctor[]> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "doctors"), where("isActive", "==", true));
      const snap = await getDocs(q);
      const list: Doctor[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Doctor, "id">) }));
      return list;
    } catch (err) {
      console.warn("getActiveDoctorsServer failed:", err);
    }
  }
  return [];
}

export async function getDoctorByIdServer(doctorId: string): Promise<Doctor | null> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "doctors", doctorId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Doctor;
      }
    } catch (err) {
      console.warn("getDoctorByIdServer error:", err);
    }
  }
  return null;
}

/**
 * Real-time listener for Doctor directory directly from Firestore database
 */
export function subscribeToDoctors(callback: (doctors: Doctor[]) => void): () => void {
  // Purge any legacy mock doctors from local storage
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY_DOCTORS);
      if (raw && (raw.includes("doc-1") || raw.includes("Dr. Ananya Sharma"))) {
        localStorage.removeItem(LOCAL_STORAGE_KEY_DOCTORS);
      }
    } catch {}
  }

  if (isLiveFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "doctors"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs: Doctor[] = [];
          snapshot.forEach((d) => docs.push({ id: d.id, ...(d.data() as Omit<Doctor, "id">) }));
          callback(docs);
        },
        (error) => {
          console.warn("Doctors onSnapshot error:", error);
          callback(getStoredDoctors());
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn("Doctors onSnapshot setup error:", err);
    }
  }

  doctorSubscribers.push(callback);
  callback(getStoredDoctors());

  return () => {
    const idx = doctorSubscribers.indexOf(callback);
    if (idx > -1) doctorSubscribers.splice(idx, 1);
  };
}

export async function toggleDoctorStatus(doctorId: string, isActive: boolean): Promise<void> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "doctors", doctorId);
      await updateDoc(docRef, { isActive });
    } catch (err) {
      console.warn("Error updating doctor status in Firestore:", err);
    }
  }

  const current = getStoredDoctors();
  const updated = current.map((d) => (d.id === doctorId ? { ...d, isActive } : d));
  saveStoredDoctors(updated);
}

export async function addDoctor(doctor: Omit<Doctor, "id"> & { id?: string }): Promise<string> {
  const id = doctor.id || `doc-${Date.now()}`;
  const phoneDigits = doctor.phone ? normalizePhoneDigits(doctor.phone) : undefined;
  const searchKeywords = generateDoctorKeywords({
    name: doctor.name,
    phone: doctor.phone,
    specialty: doctor.specialty,
    clinic: doctor.clinic,
  });

  const newDoc: Doctor = {
    ...doctor,
    id,
    phoneDigits,
    searchKeywords,
    isActive: doctor.isActive ?? true,
    rating: doctor.rating || 4.9,
    reviews: doctor.reviews || 10,
    image: doctor.image || "/images/doctor-1.jpg",
  };

  if (isLiveFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "doctors", id), newDoc);
    } catch (err) {
      console.warn("Error adding doctor to Firestore:", err);
    }
  }

  const current = getStoredDoctors();
  const updated = [newDoc, ...current];
  saveStoredDoctors(updated);
  return id;
}

/**
 * Admin Doctor Search: Searches Firestore doctors collection by name, specialty, clinic, or phone.
 */
export async function searchDoctors(searchTerm: string, limitCount = 20): Promise<Doctor[]> {
  const term = normalizeSearchQuery(searchTerm);
  if (!term) return [];

  if (isLiveFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, "doctors"),
        where("searchKeywords", "array-contains", term),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      const results: Doctor[] = [];
      snap.forEach((docSnap) => results.push({ id: docSnap.id, ...(docSnap.data() as Omit<Doctor, "id">) }));
      if (results.length > 0) return results;
    } catch (err) {
      console.warn("Firestore searchDoctors failed, fallback to local:", err);
    }
  }

  const current = getStoredDoctors();
  return current.filter((doc) => doc.searchKeywords?.some((k) => k.includes(term)));
}

/**
 * Calculates the next available consultation day based on a doctor's visiting schedule.
 * E.g., if doctor visits on ["Mon", "Wed", "Fri"] and today is Tuesday, returns "Tomorrow (Wed)".
 */
export function getDoctorNextAvailable(availableDays?: string[]): string {
  if (!availableDays || availableDays.length === 0) return "Mon, Wed, Fri";
  if (availableDays.includes("Daily") || availableDays.length >= 7) return "Today (Open)";

  const dayMap: Record<string, number> = {
    Sun: 0, Sunday: 0,
    Mon: 1, Monday: 1,
    Tue: 2, Tuesday: 2,
    Wed: 3, Wednesday: 3,
    Thu: 4, Thursday: 4,
    Fri: 5, Friday: 5,
    Sat: 6, Saturday: 6,
  };

  const targetDayIndices = availableDays
    .map((d) => dayMap[d.slice(0, 3)])
    .filter((v): v is number => v !== undefined);

  if (targetDayIndices.length === 0) return availableDays.join(", ");

  const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...

  for (let offset = 0; offset < 7; offset++) {
    const checkDay = (todayIndex + offset) % 7;
    if (targetDayIndices.includes(checkDay)) {
      if (offset === 0) return "Today";
      if (offset === 1) return "Tomorrow";
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return dayNames[checkDay];
    }
  }

  return availableDays.join(", ");
}

