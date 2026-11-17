import { Suspense } from "react";
import { connection } from "next/server";
import { 
  getCachedTodaySales, 
  getCachedActiveDoctors, 
  getAppointments,
  getDoctorDailySales,
  Doctor,
  Appointment
} from "@/lib/firebase";
import { requireAdminRole } from "@/lib/adminAuthGuard";
import { BookingAdminClient } from "./BookingAdminClient";

function BookingAdminSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse py-2">
      <div className="h-28 bg-slate-800 rounded-3xl" />
      <div className="h-16 bg-gray-200/70 rounded-3xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-32 bg-gray-200/70 rounded-3xl" />
        <div className="h-32 bg-gray-200/70 rounded-3xl" />
        <div className="h-32 bg-gray-200/70 rounded-3xl" />
      </div>
      <div className="h-96 bg-gray-200/60 rounded-3xl" />
    </div>
  );
}

async function BookingAdminData() {
  await connection();
  // Bookings desk is restricted to Super Admin and verified Doctors.
  // Patients attempting to access it are redirected to /unauthorized.
  const { role, doctorId } = await requireAdminRole("/admin/booking", ["super_admin", "doctor"]);

  const todayStr = new Date().toISOString().split("T")[0];

  let initialOverallMetrics = { totalPatients: 0, totalRevenue: 0 };
  let initialDoctors: Doctor[] = [];
  let initialAppointments: Appointment[] = [];

  if (role === "doctor" && doctorId) {
    const [allDocs, docSales, docApts] = await Promise.all([
      getCachedActiveDoctors(),
      getDoctorDailySales(doctorId, todayStr),
      getAppointments({ dateStr: todayStr, doctorId, pageSize: 50 }),
    ]);

    initialDoctors = allDocs.filter((d) => d.id === doctorId);
    initialOverallMetrics = {
      totalPatients: docSales.doctorPatients,
      totalRevenue: docSales.doctorRevenue,
    };
    initialAppointments = docApts;
  } else {
    const [metrics, docs, apts] = await Promise.all([
      getCachedTodaySales(todayStr),
      getCachedActiveDoctors(),
      getAppointments({ dateStr: todayStr, pageSize: 50 }),
    ]);

    initialOverallMetrics = metrics;
    initialDoctors = docs;
    initialAppointments = apts;
  }

  return (
    <BookingAdminClient
      initialOverallMetrics={JSON.parse(JSON.stringify(initialOverallMetrics))}
      initialDoctors={JSON.parse(JSON.stringify(initialDoctors))}
      initialAppointments={JSON.parse(JSON.stringify(initialAppointments))}
      userRole={role}
      currentDoctorId={doctorId}
    />
  );
}

export default function AdminBookingPage() {
  return (
    <Suspense fallback={<BookingAdminSkeleton />}>
      <BookingAdminData />
    </Suspense>
  );
}

