import { Suspense } from "react";
import { connection } from "next/server";
import { getCachedActiveDoctors, Doctor } from "@/lib/firebase";
import { requireAdminRole } from "@/lib/adminAuthGuard";
import { DoctorAdminClient } from "./DoctorAdminClient";

function DoctorAdminSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse py-2">
      <div className="h-28 bg-slate-800 rounded-3xl" />
      <div className="h-16 bg-gray-200/70 rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-44 bg-gray-200/70 rounded-3xl" />
        <div className="h-44 bg-gray-200/70 rounded-3xl" />
      </div>
    </div>
  );
}

async function DoctorAdminData() {
  await connection();
  // Doctor directory control is strictly restricted to Super Admin.
  // Doctors and patients attempting to access it are redirected to /unauthorized.
  const { role, doctorId } = await requireAdminRole("/admin/doctor", ["super_admin"]);

  const doctors: Doctor[] = await getCachedActiveDoctors();

  return (
    <DoctorAdminClient
      initialDoctors={doctors}
      userRole={role}
      currentDoctorId={doctorId}
    />
  );
}

export default function AdminDoctorPage() {
  return (
    <Suspense fallback={<DoctorAdminSkeleton />}>
      <DoctorAdminData />
    </Suspense>
  );
}

