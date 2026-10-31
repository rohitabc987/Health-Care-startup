import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  getCachedTodaySales, 
  getCachedActiveDoctors, 
  getAppointments,
  getDoctorDailySales,
  Doctor,
  Appointment
} from "@/lib/firebase";
import { UserRole } from "@/lib/types";
import { AdminClient } from "./AdminClient";
import { ShieldAlert, ArrowLeft } from "lucide-react";

function AdminSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse py-2">
      <div className="h-28 bg-slate-800 rounded-3xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-32 bg-gray-200/70 rounded-3xl" />
        <div className="h-32 bg-gray-200/70 rounded-3xl" />
        <div className="h-32 bg-gray-200/70 rounded-3xl" />
      </div>
      <div className="h-96 bg-gray-200/60 rounded-3xl" />
    </div>
  );
}

async function AdminData() {
  // Indicate to Next.js 16 prerender engine to wait for real request before reading request-time IO / new Date()
  await connection();
  const cookieStore = await cookies();
  const uid = cookieStore.get("pronto_uid")?.value;
  const role = (cookieStore.get("pronto_role")?.value as UserRole) || "patient";
  const doctorId = cookieStore.get("pronto_doctor_id")?.value;

  // Unauthenticated visitors are directed to login
  if (!uid) {
    redirect("/login?redirect=/admin");
  }

  // Patients do not have access to admin/doctor operations
  if (role === "patient") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">Staff &amp; Doctor Portal</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Your account is registered as a Patient. The Admin Operations Desk is restricted to verified Doctors and Clinic Administrators.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-xs transition-all w-full cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Patient Portal</span>
          </Link>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];

  let initialOverallMetrics: { totalPatients: number; totalRevenue: number } = { totalPatients: 0, totalRevenue: 0 };
  let initialDoctors: Doctor[] = [];
  let initialAppointments: Appointment[] = [];

  if (role === "doctor" && doctorId) {
    // Doctor View: Only load their own doctor's appointments and metrics
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
    // Super Admin & Clinic Staff View: Load full clinic and doctor roster
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
    <AdminClient
      initialOverallMetrics={initialOverallMetrics}
      initialDoctors={initialDoctors}
      initialAppointments={initialAppointments}
      userRole={role}
      currentDoctorId={doctorId}
    />
  );
}

// Next.js Server Component
// Prerenders static shell and streams role-based admin or doctor data
export default function AdminPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminData />
    </Suspense>
  );
}
