import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  Firestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  doc, 
  updateDoc,
  getDocs,
  Timestamp 
} from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ==========================================
// 1. FIREBASE CONFIGURATION & INITIALIZATION
// ==========================================

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyMockKeyForDevelopmentMode-ProntoHealth",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "health-triage-mvp.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "health-triage-mvp",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "health-triage-mvp.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1029384756:web:9876543210abcdef",
};

// Check if running on client and valid project ID is configured
export const isLiveFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("MockKey") &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;
let storage: FirebaseStorage | undefined = undefined;

if (typeof window !== "undefined") {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (err) {
    console.warn("Firebase SDK initialization notice (running with responsive local fallback layer):", err);
  }
}

export { app, auth, db, storage };

// ==========================================
// 2. CORE TYPES (DATABASE SCHEMA)
// ==========================================

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  createdAt?: any;
  defaultClinic?: string;
  registeredByGroundTeam?: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  rating: number;
  reviews: number;
  image: string;
  experienceYears?: number;
  isNew?: boolean;
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
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  clinicName?: string;
  followupDate: string; // ISO date or formatted (e.g., "Nov 02, 2026")
  timeWindow: string;   // e.g. "Evening (5:00 PM - 7:00 PM)"
  status: AppointmentStatus;
  prescriptionUrl: string;
  createdAt: any;
  consultationFee?: number;
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
  uploadedAt: string;
  chiefComplaint?: string;
  scheduledFollowupDate?: string;
}

// ==========================================
// 3. INITIAL SEED DATA
// ==========================================

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Ananya Sharma",
    specialty: "Cardiology & Internal Medicine",
    clinic: "Apollo Clinic, Gomti Nagar",
    rating: 4.9,
    reviews: 1420,
    image: "/images/doctor-1.jpg",
    experienceYears: 12,
    isNew: false,
    nextAvailableDay: "In 7 Days",
    consultationFee: 500,
    regularFee: 800,
  },
  {
    id: "doc-2",
    name: "Dr. Rajesh Verma",
    specialty: "General Physician & Diabetology",
    clinic: "Sanjeevani Health Hub, Sector 4",
    rating: 4.9,
    reviews: 2180,
    image: "/images/doctor-2.jpg",
    experienceYears: 15,
    isNew: false,
    nextAvailableDay: "In 5 Days",
    consultationFee: 400,
    regularFee: 650,
  },
  {
    id: "doc-3",
    name: "Dr. Sarah Jenkins",
    specialty: "Pediatrics & Child Wellness",
    clinic: "Little Feet Children's Clinic",
    rating: 4.9,
    reviews: 980,
    image: "/images/doctor-3.jpg",
    experienceYears: 9,
    isNew: true,
    nextAvailableDay: "In 7 Days",
    consultationFee: 450,
    regularFee: 700,
  },
  {
    id: "doc-4",
    name: "Dr. Amitav Ghosh",
    specialty: "Orthopedics & Joint Care",
    clinic: "Metro Specialty Clinic, Viram Khand",
    rating: 4.8,
    reviews: 1640,
    image: "/images/doctor-4.jpg",
    experienceYears: 18,
    isNew: false,
    nextAvailableDay: "In 7 Days",
    consultationFee: 600,
    regularFee: 900,
  },
];

export const INITIAL_USER: UserProfile = {
  uid: "patient-demo-001",
  name: "Rahul Verma",
  phone: "+91 98765 43210",
  defaultClinic: "Apollo Clinic, Gomti Nagar",
  registeredByGroundTeam: true,
};

export const INITIAL_PRESCRIPTIONS: PrescriptionRecord[] = [
  {
    id: "presc-101",
    patientUid: "patient-demo-001",
    doctorName: "Dr. Ananya Sharma",
    clinicName: "Apollo Clinic, Gomti Nagar",
    visitDate: "Oct 18, 2026",
    imageUrl: "/images/prescription-demo.jpg",
    uploadedAt: "Oct 18, 2026 • Ground Team Verified",
    chiefComplaint: "Post-hypertension & Amoxicillin review",
    scheduledFollowupDate: "Oct 25, 2026",
  },
];

// Initial appointments for rich demo preview
export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-101",
    patientUid: "patient-demo-001",
    patientName: "Rahul Verma",
    patientPhone: "+91 98765 43210",
    doctorId: "doc-1",
    doctorName: "Dr. Ananya Sharma",
    doctorSpecialty: "Cardiology & Internal Medicine",
    clinicName: "Apollo Clinic, Gomti Nagar",
    followupDate: "Oct 28, 2026",
    timeWindow: "Morning (9:00 AM - 11:30 AM)",
    status: "Pending Screening",
    prescriptionUrl: "/images/prescription-demo.jpg",
    createdAt: new Date().toISOString(),
    consultationFee: 500,
    notes: "Review BP log after 7 days on Lisinopril 10mg",
    queueBypassCode: "PRONTO-FAST-7721",
  },
];

// ==========================================
// 4. LOCAL FALLBACK / HYBRID REACTIVE STORE
// ==========================================
// Ensures immediate out-of-the-box reactivity even before live Firebase keys are set up.

const LOCAL_STORAGE_KEY_APPOINTMENTS = "pronto_medical_appointments";
const LOCAL_STORAGE_KEY_PRESCRIPTIONS = "pronto_medical_prescriptions";
const appointmentSubscribers: Array<(appointments: Appointment[]) => void> = [];
const prescriptionSubscribers: Array<(prescriptions: PrescriptionRecord[]) => void> = [];

function getStoredAppointments(): Appointment[] {
  if (typeof window === "undefined") return INITIAL_APPOINTMENTS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_APPOINTMENTS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(INITIAL_APPOINTMENTS));
      return INITIAL_APPOINTMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_APPOINTMENTS;
  }
}

function saveStoredAppointments(data: Appointment[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  }
  appointmentSubscribers.forEach((cb) => cb(data));
}

function getStoredPrescriptions(): PrescriptionRecord[] {
  if (typeof window === "undefined") return INITIAL_PRESCRIPTIONS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PRESCRIPTIONS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY_PRESCRIPTIONS, JSON.stringify(INITIAL_PRESCRIPTIONS));
      return INITIAL_PRESCRIPTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRESCRIPTIONS;
  }
}

function saveStoredPrescriptions(data: PrescriptionRecord[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PRESCRIPTIONS, JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  }
  prescriptionSubscribers.forEach((cb) => cb(data));
}

// ==========================================
// 5. FIRESTORE & FALLBACK REACTION SERVICES
// ==========================================

/**
 * Real-time listener for patient appointments
 */
export function subscribeToAppointments(
  patientUid: string,
  callback: (appointments: Appointment[]) => void
): () => void {
  // If Live Firebase is configured and db is ready
  if (isLiveFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, "appointments"),
        where("patientUid", "==", patientUid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: Appointment[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Appointment, "id">) });
          });
          callback(list);
        },
        (error) => {
          console.warn("Firestore onSnapshot error, reverting to local synchronized storage:", error);
          const localData = getStoredAppointments().filter((a) => a.patientUid === patientUid);
          callback(localData);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn("Error subscribing to Firestore, using fallback store:", err);
    }
  }

  // Fallback / In-Memory & LocalStorage Subscriptions
  appointmentSubscribers.push(callback);
  callback(getStoredAppointments().filter((a) => a.patientUid === patientUid));

  return () => {
    const index = appointmentSubscribers.indexOf(callback);
    if (index > -1) {
      appointmentSubscribers.splice(index, 1);
    }
  };
}

/**
 * Create a new follow-up appointment in Firestore
 */
export async function createAppointment(
  data: Omit<Appointment, "id" | "createdAt" | "status"> & { notes?: string }
): Promise<string> {
  const newAppointment: Appointment = {
    ...data,
    id: `apt-${Date.now()}`,
    status: "Pending Screening",
    createdAt: new Date().toISOString(),
    queueBypassCode: `PRONTO-FAST-${Math.floor(1000 + Math.random() * 9000)}`,
  };

  if (isLiveFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, "appointments"), {
        ...newAppointment,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (err) {
      console.warn("Error adding to Firestore, saving to local store:", err);
    }
  }

  // Update local storage store
  const current = getStoredAppointments();
  const updated = [newAppointment, ...current];
  saveStoredAppointments(updated);
  return newAppointment.id;
}

/**
 * Escalate or update status of an appointment (e.g. for ground triage simulation)
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<void> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "appointments", appointmentId);
      await updateDoc(docRef, { status });
      return;
    } catch (err) {
      console.warn("Firestore update error, updating local store:", err);
    }
  }

  const current = getStoredAppointments();
  const updated = current.map((item) => (item.id === appointmentId ? { ...item, status } : item));
  saveStoredAppointments(updated);
}

/**
 * Real-time listener for patient prescription records
 */
export function subscribeToPrescriptions(
  patientUid: string,
  callback: (prescriptions: PrescriptionRecord[]) => void
): () => void {
  prescriptionSubscribers.push(callback);
  callback(getStoredPrescriptions().filter((p) => p.patientUid === patientUid));

  return () => {
    const index = prescriptionSubscribers.indexOf(callback);
    if (index > -1) {
      prescriptionSubscribers.splice(index, 1);
    }
  };
}

/**
 * Upload Prescription Image (via Firebase Storage or Local Data URI fallback)
 */
export async function uploadPrescriptionPhoto(
  file: File,
  patientUid: string,
  metadata: {
    doctorName: string;
    clinicName: string;
    visitDate: string;
    chiefComplaint?: string;
  }
): Promise<PrescriptionRecord> {
  let downloadUrl = "";

  if (isLiveFirebaseConfigured && storage) {
    try {
      const storageRef = ref(storage, `prescriptions/${patientUid}/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      downloadUrl = await getDownloadURL(uploadResult.ref);
    } catch (err) {
      console.warn("Firebase Storage upload failed, converting to local preview URL:", err);
    }
  }

  // If storage upload was skipped or in demo mode, convert to data URL for high-fidelity offline preview
  if (!downloadUrl) {
    downloadUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  const newRecord: PrescriptionRecord = {
    id: `presc-${Date.now()}`,
    patientUid,
    doctorName: metadata.doctorName,
    clinicName: metadata.clinicName,
    visitDate: metadata.visitDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    imageUrl: downloadUrl,
    uploadedAt: "Just now • Mobile Camera Snapshot",
    chiefComplaint: metadata.chiefComplaint || "Physical visit follow-up slip",
  };

  const current = getStoredPrescriptions();
  const updated = [newRecord, ...current];
  saveStoredPrescriptions(updated);

  return newRecord;
}
