import { Suspense } from "react";
import { connection } from "next/server";
import { requireAdminRole } from "@/lib/adminAuthGuard";
import { AdminDashboardClient } from "./AdminDashboardClient";

function AdminSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse py-2">
      <div className="h-28 bg-slate-800 rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="h-72 bg-gray-200/70 rounded-3xl" />
        <div className="h-72 bg-gray-200/70 rounded-3xl" />
        <div className="h-72 bg-gray-200/70 rounded-3xl" />
      </div>
    </div>
  );
}

async function AdminData() {
  await connection();
  // Main admin operations desk is strictly restricted to Super Admin.
  // Doctors attempting to access /admin are automatically routed to /admin/booking.
  // Patients attempting to access /admin are redirected to /unauthorized.
  const { role, doctorId } = await requireAdminRole("/admin", ["super_admin"]);

  // Pure zero-read launchpad: Database queries are deferred to dedicated module pages
  return (
    <AdminDashboardClient
      userRole={role}
      currentDoctorId={doctorId}
    />
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminData />
    </Suspense>
  );
}
