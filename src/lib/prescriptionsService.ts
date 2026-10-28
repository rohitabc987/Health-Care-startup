import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from "firebase/firestore";
import { PrescriptionRecord } from "./types";
import { INITIAL_PRESCRIPTIONS } from "./mockData";
import { db, isLiveFirebaseConfigured } from "@/lib/firebaseConfig";
import { uploadSlipToCloudinary } from "./cloudinary";

const LOCAL_STORAGE_KEY_PRESCRIPTIONS = "pronto_medical_prescriptions";
const prescriptionSubscribers: Array<(prescriptions: PrescriptionRecord[]) => void> = [];

export function getStoredPrescriptions(): PrescriptionRecord[] {
  if (typeof window === "undefined") return INITIAL_PRESCRIPTIONS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PRESCRIPTIONS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY_PRESCRIPTIONS, JSON.stringify(INITIAL_PRESCRIPTIONS));
      return INITIAL_PRESCRIPTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRESCRIPTIONS;
  } catch {
    return INITIAL_PRESCRIPTIONS;
  }
}

export function saveStoredPrescriptions(data: PrescriptionRecord[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PRESCRIPTIONS, JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  }
  prescriptionSubscribers.forEach((cb) => cb(data));
}

/**
 * Server-Side Fetcher for Server Components (e.g. /prescriptions page.tsx)
 */
export async function getPrescriptionsServer(patientUid = "patient-demo-001"): Promise<PrescriptionRecord[]> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, "prescriptions"),
        where("patientUid", "==", patientUid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list: PrescriptionRecord[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<PrescriptionRecord, "id">) }));
      if (list.length > 0) return list;
    } catch (err) {
      console.warn("getPrescriptionsServer error, fallback to initial:", err);
    }
  }
  return INITIAL_PRESCRIPTIONS.filter((p) => p.patientUid === patientUid);
}

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
  const cloudResult = await uploadSlipToCloudinary(file, patientUid);
  const downloadUrl = cloudResult.url;

  const newRecord: PrescriptionRecord = {
    id: `presc-${Date.now()}`,
    patientUid,
    doctorName: metadata.doctorName,
    clinicName: metadata.clinicName,
    visitDate: metadata.visitDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    imageUrl: downloadUrl,
    pdfUrl: cloudResult.pdfUrl,
    uploadedAt: "Just now • Mobile Camera Snapshot (~150 KB)",
    chiefComplaint: metadata.chiefComplaint || "Clinic prescription & consultation record",
    fileSizeBytes: cloudResult.bytes,
  };

  if (isLiveFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, "prescriptions"), {
        ...newRecord,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Firestore prescription add error, saving locally:", err);
    }
  }

  const current = getStoredPrescriptions();
  const updated = [newRecord, ...current];
  saveStoredPrescriptions(updated);

  return newRecord;
}
