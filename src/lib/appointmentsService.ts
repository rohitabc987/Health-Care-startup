import { 
  collection, 
  addDoc, 
  setDoc,
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getAggregateFromServer, 
  count, 
  sum 
} from "firebase/firestore";
import { Appointment, AppointmentStatus, AppointmentQueueStatus } from "./types";
import { db, isLiveFirebaseConfigured } from "@/lib/firebaseConfig";
import { generateAppointmentKeywords, normalizePhoneDigits, normalizeSearchQuery } from "./searchUtils";

const LOCAL_STORAGE_KEY_APPOINTMENTS = "pronto_medical_appointments";
const appointmentSubscribers: Array<(appointments: Appointment[]) => void> = [];

export function getStoredAppointments(): Appointment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_APPOINTMENTS);
    if (!raw) return [];
    if (raw.includes("apt-101") || raw.includes("Rahul Verma") || raw.includes("Dr. Ananya Sharma")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY_APPOINTMENTS);
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter(
        (a) => !["apt-101", "apt-102", "apt-103", "apt-104"].includes(a.id) &&
               a.patientName !== "Rahul Verma" &&
               a.doctorName !== "Dr. Ananya Sharma"
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(cleaned));
      }
      return cleaned;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredAppointments(data: Appointment[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  }
  appointmentSubscribers.forEach((cb) => cb(data));
}

export function sanitizeAppointmentForClient(raw: any, id?: string): Appointment {
  const apt = { ...raw };
  if (id) apt.id = id;

  if (apt.createdAt) {
    if (typeof apt.createdAt.toDate === "function") {
      apt.createdAt = apt.createdAt.toDate().toISOString();
    } else if (typeof apt.createdAt === "object" && typeof apt.createdAt.seconds === "number") {
      apt.createdAt = new Date(apt.createdAt.seconds * 1000).toISOString();
    }
  }

  return JSON.parse(
    JSON.stringify(apt, (_key, val) => {
      if (val && typeof val === "object" && typeof val.toDate === "function") {
        return val.toDate().toISOString();
      }
      if (val && typeof val === "object" && typeof val.seconds === "number" && typeof val.nanoseconds === "number") {
        return new Date(val.seconds * 1000).toISOString();
      }
      return val;
    })
  );
}

/**
 * Server-Side Fetcher for Server Components (e.g. /bookings, /admin/queue, /doctor/consultation)
 * Queries strictly from Firestore database.
 */
export async function getAppointmentsServer(patientUid?: string): Promise<Appointment[]> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const q = patientUid
        ? query(
            collection(db, "appointments"),
            where("patientUid", "==", patientUid),
            orderBy("createdAt", "desc")
          )
        : query(collection(db, "appointments"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list: Appointment[] = [];
      snap.forEach((d) => list.push(sanitizeAppointmentForClient(d.data(), d.id)));
      return list;
    } catch (err) {
      console.warn("getAppointmentsServer error:", err);
    }
  }
  return [];
}

/**
 * Real-time listener for patient appointments
 */
export function subscribeToAppointments(
  patientUid: string,
  callback: (appointments: Appointment[]) => void
): () => void {
  // Always subscribe to local updates so mutations instantly reflect in UI
  appointmentSubscribers.push(callback);

  let unsubscribeFirestore: (() => void) | undefined = undefined;

  if (isLiveFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, "appointments"),
        where("patientUid", "==", patientUid),
        orderBy("createdAt", "desc")
      );

      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          const list: Appointment[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Appointment, "id">) });
          });
          callback(list);
        },
        (error) => {
          console.warn("Firestore onSnapshot error, fallback to local store:", error);
          const localData = getStoredAppointments().filter((a) => a.patientUid === patientUid);
          callback(localData);
        }
      );
    } catch (err) {
      console.warn("Error subscribing to Firestore, using fallback:", err);
    }
  }

  // Initial emit with local data
  callback(getStoredAppointments().filter((a) => a.patientUid === patientUid));

  return () => {
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
    const index = appointmentSubscribers.indexOf(callback);
    if (index > -1) {
      appointmentSubscribers.splice(index, 1);
    }
  };
}

/**
 * 1-Write Booking Function (Strictly 1 Document Written)
 */
export async function bookAppointment(
  data: Omit<Appointment, "id" | "createdAt" | "status" | "queueBypassCode"> & {
    queueBypassCode?: string;
  }
): Promise<string> {
  const patientPhoneDigits = normalizePhoneDigits(data.patientPhone);
  const queueBypassCode = data.queueBypassCode || `PRONTO-FAST-${Math.floor(1000 + Math.random() * 9000)}`;
  const searchKeywords = generateAppointmentKeywords({
    patientName: data.patientName,
    patientPhone: data.patientPhone,
    patientHealthId: data.patientHealthId,
    doctorName: data.doctorName,
    queueBypassCode,
  });

  const generatedId = `apt-${Date.now()}`;
  const meetingRoomUrl = data.meetingRoomUrl || `https://meet.jit.si/livesehat-tele-${generatedId}`;

  const newAppointment: Appointment = {
    ...data,
    id: generatedId,
    patientPhoneDigits,
    status: "Pending Screening",
    queueStatus: data.queueStatus || "waiting_precheck",
    meetingRoomUrl,
    createdAt: new Date().toISOString(),
    queueBypassCode,
    searchKeywords,
  };

  let appointmentId = newAppointment.id;

  if (isLiveFirebaseConfigured && db) {
    try {
      const sanitized = Object.fromEntries(
        Object.entries(newAppointment).filter(([_, v]) => v !== undefined)
      );
      const docRef = await addDoc(collection(db, "appointments"), {
        ...sanitized,
        createdAt: serverTimestamp(),
      });
      appointmentId = docRef.id;
    } catch (err) {
      console.warn("Error adding to Firestore, saving to local store:", err);
    }
  }

  const current = getStoredAppointments();
  const updated = [{ ...newAppointment, id: appointmentId }, ...current];
  saveStoredAppointments(updated);
  return appointmentId;
}

export const createAppointment = bookAppointment;

/**
 * Server-Side Aggregation for Overall Sales & Patient Volume
 * Cost: Exactly 1 Firestore Read per 1,000 matches!
 */
export async function getTodayOverallSales(dateStr?: string): Promise<{ totalPatients: number; totalRevenue: number }> {
  const targetDate = dateStr || new Date().toISOString().split("T")[0];

  if (isLiveFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, "appointments"),
        where("createdAt", ">=", targetDate),
        where("createdAt", "<=", targetDate + "T23:59:59.999Z")
      );
      const snapshot = await getAggregateFromServer(q, {
        totalPatients: count(),
        totalRevenue: sum("consultationFee"),
      });
      const data = snapshot.data();
      return {
        totalPatients: data.totalPatients || 0,
        totalRevenue: data.totalRevenue || 0,
      };
    } catch (err) {
      console.warn("getAggregateFromServer failed, falling back to local calculation:", err);
    }
  }

  const all = getStoredAppointments();
  const todayBookings = all.filter((a) => (typeof a.createdAt === "string" ? a.createdAt.slice(0, 10) : "") === targetDate);
  const totalPatients = todayBookings.length;
  const totalRevenue = todayBookings.reduce((acc, curr) => acc + (Number(curr.consultationFee) || 0), 0);
  return { totalPatients, totalRevenue };
}

/**
 * Server-Side Aggregation for Specific Doctor's Patients & Sales
 * Cost: Exactly 1 Firestore Read!
 */
export async function getDoctorDailySales(
  doctorId: string, 
  dateStr?: string
): Promise<{ doctorPatients: number; doctorRevenue: number }> {
  const targetDate = dateStr || new Date().toISOString().split("T")[0];

  if (isLiveFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctorId),
        where("createdAt", ">=", targetDate),
        where("createdAt", "<=", targetDate + "T23:59:59.999Z")
      );
      const snapshot = await getAggregateFromServer(q, {
        doctorPatients: count(),
        doctorRevenue: sum("consultationFee"),
      });
      const data = snapshot.data();
      return {
        doctorPatients: data.doctorPatients || 0,
        doctorRevenue: data.doctorRevenue || 0,
      };
    } catch (err) {
      console.warn("getDoctorDailySales aggregate failed, falling back to local calculation:", err);
    }
  }

  const all = getStoredAppointments();
  const docBookings = all.filter(
    (a) => a.doctorId === doctorId && (typeof a.createdAt === "string" ? a.createdAt.slice(0, 10) : "") === targetDate
  );
  const doctorPatients = docBookings.length;
  const doctorRevenue = docBookings.reduce((acc, curr) => acc + (Number(curr.consultationFee) || 0), 0);
  return { doctorPatients, doctorRevenue };
}

/**
 * Query Appointments (Paginated & Filterable for Admin / Doctor Desk)
 */
export async function getAppointments(params?: {
  dateStr?: string;
  doctorId?: string;
  patientUid?: string;
  searchTerm?: string;
  pageSize?: number;
}): Promise<Appointment[]> {
  const pageSize = params?.pageSize || 25;
  const cleanSearch = params?.searchTerm ? normalizeSearchQuery(params.searchTerm) : "";

  if (isLiveFirebaseConfigured && db) {
    try {
      const q = collection(db, "appointments") as any;
      const conditions = [];

      if (cleanSearch) {
        conditions.push(where("searchKeywords", "array-contains", cleanSearch));
      }
      if (params?.dateStr) {
        conditions.push(where("createdAt", ">=", params.dateStr));
        conditions.push(where("createdAt", "<=", params.dateStr + "T23:59:59.999Z"));
      }
      if (params?.doctorId) {
        conditions.push(where("doctorId", "==", params.doctorId));
      }
      if (params?.patientUid) {
        conditions.push(where("patientUid", "==", params.patientUid));
      }

      conditions.push(orderBy("createdAt", "desc"));
      conditions.push(limit(pageSize));

      const queryRef = query(q, ...conditions);
      const snap = await getDocs(queryRef);
      const list: Appointment[] = [];
      snap.forEach((d) => list.push(sanitizeAppointmentForClient(d.data(), d.id)));
      if (list.length > 0) return list;
    } catch (err) {
      console.warn("getAppointments Firestore failed, using local store:", err);
    }
  }

  let list = getStoredAppointments();
  if (cleanSearch) {
    list = list.filter(
      (a) =>
        a.searchKeywords?.some((k) => k.includes(cleanSearch)) ||
        a.patientName?.toLowerCase().includes(cleanSearch) ||
        a.patientPhone?.includes(cleanSearch) ||
        a.patientHealthId?.toLowerCase().includes(cleanSearch)
    );
  }
  if (params?.dateStr) {
    list = list.filter((a) => (typeof a.createdAt === "string" ? a.createdAt.slice(0, 10) : "") === params.dateStr);
  }
  if (params?.doctorId) {
    list = list.filter((a) => a.doctorId === params.doctorId);
  }
  if (params?.patientUid) {
    list = list.filter((a) => a.patientUid === params.patientUid);
  }
  return list.slice(0, pageSize);
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<void> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "appointments", appointmentId);
      const localItem = getStoredAppointments().find((a) => a.id === appointmentId);
      const mergedData = localItem ? { ...localItem, status } : { status };
      await setDoc(docRef, mergedData, { merge: true });
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
 * Fetch a single appointment by ID (Server or Client fallback)
 */
export async function getAppointmentById(appointmentId: string): Promise<Appointment | null> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(query(collection(db, "appointments"), where("__name__", "==", appointmentId)));
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...(d.data() as Omit<Appointment, "id">) };
      }
    } catch (err) {
      console.warn("getAppointmentById Firestore lookup error:", err);
    }
  }

  const list = getStoredAppointments();
  return list.find((a) => a.id === appointmentId) || null;
}

/**
 * Update an appointment's queue status and tele-consultation metadata
 */
export async function updateAppointmentQueueStatus(
  appointmentId: string,
  queueStatus: AppointmentQueueStatus,
  metadata?: {
    consultationOutcome?: 'continued_meds' | 'dose_adjusted' | 'escalated_to_clinic';
    consultationNotes?: string;
    preCheckNotes?: string;
    meetingRoomUrl?: string;
  }
): Promise<void> {
  const updatePayload: Record<string, any> = { queueStatus };
  if (metadata?.consultationOutcome) updatePayload.consultationOutcome = metadata.consultationOutcome;
  if (metadata?.consultationNotes !== undefined) updatePayload.consultationNotes = metadata.consultationNotes;
  if (metadata?.preCheckNotes !== undefined) updatePayload.preCheckNotes = metadata.preCheckNotes;
  if (metadata?.meetingRoomUrl) updatePayload.meetingRoomUrl = metadata.meetingRoomUrl;

  if (queueStatus === 'completed') {
    updatePayload.status = 'Screening Complete';
  } else if (queueStatus === 'escalated') {
    updatePayload.status = 'Escalated to Physical Visit';
    updatePayload.queueBypassCode = `FAST-PASS-${Math.floor(100 + Math.random() * 900)}`;
  }

  if (isLiveFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "appointments", appointmentId);
      const localItem = getStoredAppointments().find((a) => a.id === appointmentId);
      const mergedData = localItem ? { ...localItem, ...updatePayload } : updatePayload;
      const sanitized = Object.fromEntries(
        Object.entries(mergedData).filter(([_, v]) => v !== undefined)
      );
      await setDoc(docRef, sanitized, { merge: true });
      return;
    } catch (err) {
      console.warn("Firestore updateAppointmentQueueStatus error, updating local store:", err);
    }
  }

  const current = getStoredAppointments();
  const updated = current.map((item) =>
    item.id === appointmentId ? { ...item, ...updatePayload } : item
  );
  saveStoredAppointments(updated);
}

/**
 * Real-time listener for Doctor's Live Virtual Queue
 * Queries without requiring Firebase Composite Indexes; sorts in memory
 */
export function subscribeToDoctorQueue(
  doctorId: string | undefined,
  callback: (appointments: Appointment[]) => void
): () => void {
  // Local subscriber
  const localCb = (all: Appointment[]) => {
    const filtered = doctorId ? all.filter((a) => a.doctorId === doctorId) : all;
    callback(filtered);
  };
  appointmentSubscribers.push(localCb);

  let unsubscribeFirestore: (() => void) | undefined = undefined;

  if (isLiveFirebaseConfigured && db) {
    try {
      // Avoid composite index: query by doctorId single field (or all), sort in client memory
      const q = doctorId
        ? query(collection(db, "appointments"), where("doctorId", "==", doctorId))
        : query(collection(db, "appointments"));

      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          const list: Appointment[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Appointment, "id">) });
          });
          list.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });
          callback(list);
        },
        (error) => {
          if (error.name !== "AbortError") {
            console.warn("subscribeToDoctorQueue Firestore error:", error);
          }
        }
      );
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("subscribeToDoctorQueue setup error:", err);
      }
    }
  }

  return () => {
    if (unsubscribeFirestore) {
      try {
        unsubscribeFirestore();
      } catch {}
    }
    const idx = appointmentSubscribers.indexOf(localCb);
    if (idx !== -1) appointmentSubscribers.splice(idx, 1);
  };
}
