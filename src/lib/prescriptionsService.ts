import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  getDocs,
  onSnapshot 
} from "firebase/firestore";
import type { PrescriptionRecord } from "./types";
import { db, isLiveFirebaseConfigured } from "@/lib/firebaseConfig";
import { uploadSlipToCloudinary } from "./cloudinary";

/**
 * Server-Side Fetcher for Server Components (e.g. /prescriptions page.tsx)
 * Queries strictly from Firestore database.
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
      return list;
    } catch (err) {
      console.warn("getPrescriptionsServer Firestore error:", err);
    }
  }
  return [];
}

/**
 * Realtime Database Listener for Patient Prescriptions
 * Listens strictly to Firestore "prescriptions" collection in realtime.
 */
export function subscribeToPrescriptions(
  patientUid: string,
  callback: (prescriptions: PrescriptionRecord[]) => void
): () => void {
  // Purge any stale legacy local cache from previous sessions
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("pronto_medical_prescriptions");
    } catch {}
  }

  if (isLiveFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, "prescriptions"),
        where("patientUid", "==", patientUid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: PrescriptionRecord[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<PrescriptionRecord, "id">) });
          });
          callback(list);
        },
        (error) => {
          console.warn("Firestore prescriptions onSnapshot error:", error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn("Error setting up prescriptions Firestore listener:", err);
    }
  }

  callback([]);
  return () => {};
}

/**
 * Upload prescription photo strictly to Cloudinary & save document into Firestore.
 * Zero local fallback — strictly Cloudinary HTTPS CDN & Firestore database.
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
  // 1. Upload to Cloudinary (returns real https://res.cloudinary.com/... URL)
  const cloudResult = await uploadSlipToCloudinary(file, patientUid);
  const downloadUrl = cloudResult.url;

  const newRecordData = {
    patientUid,
    doctorName: metadata.doctorName,
    clinicName: metadata.clinicName,
    visitDate: metadata.visitDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    imageUrl: downloadUrl,
    uploadedAt: "Just now • Cloudinary Vault",
    chiefComplaint: metadata.chiefComplaint || "Clinic prescription & consultation record",
  };

  let docId = `presc-${Date.now()}`;

  // 2. Save document directly into Firestore database
  if (isLiveFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, "prescriptions"), {
        ...newRecordData,
        createdAt: serverTimestamp(),
      });
      docId = docRef.id;
    } catch (err) {
      console.error("Firestore prescription add error:", err);
      throw err;
    }
  }

  return {
    id: docId,
    ...newRecordData,
  };
}
