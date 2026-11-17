import { Suspense } from "react";
import { connection } from "next/server";
import { requireAdminRole } from "@/lib/adminAuthGuard";
import { getAppointmentsServer } from "@/lib/appointmentsService";
import { getCachedActiveDoctors } from "@/lib/firebase";
import { DoctorConsultationClient } from "./DoctorConsultationClient";

export const instant = false;

function DoctorConsultationSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4 animate-pulse">
      <div className="h-20 bg-gray-200/70 rounded-3xl" />
      <div className="h-96 bg-gray-200/60 rounded-3xl" />
    </div>
  );
}

async function DoctorConsultationData() {
  await connection();
  // Doctor consultation desk is strictly restricted to verified Doctors and Super Admins.
  // Patients attempting to access it are redirected to /unauthorized.
  const { role, doctorId: userDoctorId } = await requireAdminRole("/doctor/consultation", [
    "super_admin",
    "doctor",
  ]);

  // Fetch doctors and queue appointments server-side to eliminate client flash/flicker
  const [initialDoctors, initialAppointments] = await Promise.all([
    getCachedActiveDoctors(),
    getAppointmentsServer(),
  ]);

  // Convert to plain serializable JSON objects for React Server Components boundary
  const plainDoctors = JSON.parse(JSON.stringify(initialDoctors));
  const plainAppointments = JSON.parse(
    JSON.stringify(initialAppointments, (_key, val) => {
      if (val && typeof val === "object" && typeof val.seconds === "number" && typeof val.nanoseconds === "number") {
        return new Date(val.seconds * 1000).toISOString();
      }
      return val;
    })
  );

  return (
    <DoctorConsultationClient
      initialDoctors={plainDoctors}
      initialAppointments={plainAppointments}
      userRole={role}
      userDoctorId={userDoctorId}
    />
  );
}

export default function DoctorConsultationPage() {
  return (
    <Suspense fallback={<DoctorConsultationSkeleton />}>
      <DoctorConsultationData />
    </Suspense>
  );
}

