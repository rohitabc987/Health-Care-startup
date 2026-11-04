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
import { INITIAL_DOCTORS } from "./mockData";
import { db, isLiveFirebaseConfigured } from "@/lib/firebaseConfig";
import { generateDoctorKeywords, normalizePhoneDigits, normalizeSearchQuery } from "./searchUtils";

const LOCAL_STORAGE_KEY_DOCTORS = "pronto_doctors_catalog";
const doctorSubscribers: Array<(doctors: Doctor[]) => void> = [];

export function getStoredDoctors(): Doctor[] {
  if (typeof window === "undefined") return INITIAL_DOCTORS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_DOCTORS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY_DOCTORS, JSON.stringify(INITIAL_DOCTORS));
      return INITIAL_DOCTORS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DOCTORS;
  } catch {
    return INITIAL_DOCTORS;
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
 * Runs on server, returns active doctors with zero client-side latency.
 */
export async function getActiveDoctorsServer(): Promise<Doctor[]> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "doctors"), where("isActive", "==", true));
      const snap = await getDocs(q);
      const list: Doctor[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Doctor, "id">) }));
      if (list.length > 0) return list;
    } catch (err) {
      console.warn("getActiveDoctorsServer failed, using initial doctors:", err);
    }
  }
  return INITIAL_DOCTORS.filter((d) => d.isActive !== false);
}

export async function getDoctorByIdServer(doctorId: string): Promise<Doctor | null> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "doctors", doctorId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Doctor;
      }
    } catch (err) {
      console.warn("getDoctorByIdServer error, fallback:", err);
    }
  }
  return INITIAL_DOCTORS.find((d) => d.id === doctorId) || null;
}

/**
 * Real-time listener for Doctor directory
 */
export function subscribeToDoctors(callback: (doctors: Doctor[]) => void): () => void {
  if (isLiveFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "doctors"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs: Doctor[] = [];
        snapshot.forEach((d) => docs.push({ id: d.id, ...(d.data() as Omit<Doctor, "id">) }));
        if (docs.length > 0) {
          callback(docs);
        } else {
          callback(getStoredDoctors());
        }
      });
      return unsubscribe;
    } catch (err) {
      console.warn("Doctors onSnapshot error, fallback to local:", err);
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

