import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  getDocs, 
  where 
} from "firebase/firestore";
import { Doctor } from "./types";
import { INITIAL_DOCTORS } from "./mockData";
import { db, isLiveFirebaseConfigured } from "./firebaseConfig";

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
  const newDoc: Doctor = {
    ...doctor,
    id,
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
