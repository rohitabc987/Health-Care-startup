import { 
  collection, 
  addDoc, 
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
import { Appointment, AppointmentStatus } from "./types";
import { INITIAL_APPOINTMENTS } from "./mockData";
import { db, isLiveFirebaseConfigured } from "./firebaseConfig";

const LOCAL_STORAGE_KEY_APPOINTMENTS = "pronto_medical_appointments";
const appointmentSubscribers: Array<(appointments: Appointment[]) => void> = [];

export function getStoredAppointments(): Appointment[] {
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

/**
 * Server-Side Fetcher for Server Components (e.g. /bookings page.tsx)
 */
export async function getAppointmentsServer(patientUid = "patient-demo-001"): Promise<Appointment[]> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, "appointments"),
        where("patientUid", "==", patientUid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list: Appointment[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Appointment, "id">) }));
      if (list.length > 0) return list;
    } catch (err) {
      console.warn("getAppointmentsServer error, fallback to initial:", err);
    }
  }
  return INITIAL_APPOINTMENTS.filter((a) => a.patientUid === patientUid);
}

/**
 * Real-time listener for patient appointments
 */
export function subscribeToAppointments(
  patientUid: string,
  callback: (appointments: Appointment[]) => void
): () => void {
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
          console.warn("Firestore onSnapshot error, fallback to local store:", error);
          const localData = getStoredAppointments().filter((a) => a.patientUid === patientUid);
          callback(localData);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn("Error subscribing to Firestore, using fallback:", err);
    }
  }

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
 * 1-Write Booking Function (Strictly 1 Document Written)
 */
export async function bookAppointment(
  data: Omit<Appointment, "id" | "createdAt" | "status" | "queueBypassCode" | "bookingDate"> & {
    queueBypassCode?: string;
    bookingDate?: string;
  }
): Promise<string> {
  const todayStr = new Date().toISOString().split("T")[0];
  const newAppointment: Appointment = {
    ...data,
    id: `apt-${Date.now()}`,
    status: "Pending Screening",
    bookingDate: data.bookingDate || todayStr,
    createdAt: new Date().toISOString(),
    queueBypassCode: data.queueBypassCode || `PRONTO-FAST-${Math.floor(1000 + Math.random() * 9000)}`,
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

  const current = getStoredAppointments();
  const updated = [newAppointment, ...current];
  saveStoredAppointments(updated);
  return newAppointment.id;
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
        where("bookingDate", "==", targetDate)
      );
      const snapshot = await getAggregateFromServer(q, {
        totalPatients: count(),
        totalRevenue: sum("consultationFee"),
      });
      return {
        totalPatients: snapshot.data().totalPatients || 0,
        totalRevenue: snapshot.data().totalRevenue || 0,
      };
    } catch (err) {
      console.warn("getAggregateFromServer failed, falling back to local calculation:", err);
    }
  }

  const all = getStoredAppointments();
  const todayBookings = all.filter((a) => (a.bookingDate || a.createdAt?.slice(0, 10)) === targetDate);
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
        where("bookingDate", "==", targetDate),
        where("doctorId", "==", doctorId)
      );
      const snapshot = await getAggregateFromServer(q, {
        doctorPatients: count(),
        doctorRevenue: sum("consultationFee"),
      });
      return {
        doctorPatients: snapshot.data().doctorPatients || 0,
        doctorRevenue: snapshot.data().doctorRevenue || 0,
      };
    } catch (err) {
      console.warn("getDoctorDailySales aggregate failed, falling back to local calculation:", err);
    }
  }

  const all = getStoredAppointments();
  const docBookings = all.filter(
    (a) => a.doctorId === doctorId && (a.bookingDate || a.createdAt?.slice(0, 10)) === targetDate
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
  pageSize?: number;
}): Promise<Appointment[]> {
  const pageSize = params?.pageSize || 25;

  if (isLiveFirebaseConfigured && db) {
    try {
      let q = collection(db, "appointments") as any;
      const conditions = [];

      if (params?.dateStr) {
        conditions.push(where("bookingDate", "==", params.dateStr));
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
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Appointment, "id">) }));
      return list;
    } catch (err) {
      console.warn("getAppointments Firestore failed, using local store:", err);
    }
  }

  let list = getStoredAppointments();
  if (params?.dateStr) {
    list = list.filter((a) => (a.bookingDate || a.createdAt?.slice(0, 10)) === params.dateStr);
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
