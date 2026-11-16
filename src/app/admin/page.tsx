import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/lib/types";
import { getUserProfileServer } from "@/lib/userService";
import { AdminDashboardClient } from "./AdminDashboardClient";
import { ShieldAlert, ArrowLeft } from "lucide-react";

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
  const cookieStore = await cookies();
  const uid = cookieStore.get("pronto_uid")?.value;
  let role = (cookieStore.get("pronto_role")?.value as UserRole) || "patient";
  const doctorId = cookieStore.get("pronto_doctor_id")?.value;

  if (!uid) {
    redirect("/login?redirect=/admin");
  }

  const dbUser = await getUserProfileServer(uid);
  if (dbUser?.role === "super_admin") {
    role = "super_admin";
  } else if (dbUser?.role === "doctor") {
    role = "doctor";
  }

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
