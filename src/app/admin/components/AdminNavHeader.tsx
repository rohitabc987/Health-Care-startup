"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Stethoscope,
  ShieldCheck,
  ArrowLeft
} from "lucide-react";
import { UserRole } from "@/lib/types";

interface AdminNavHeaderProps {
  userRole?: UserRole;
  currentDoctorName?: string;
  doctorCount?: number;
  showBackButton?: boolean;
}

export function AdminNavHeader({
  userRole = "super_admin",
  currentDoctorName,
  showBackButton = false,
}: AdminNavHeaderProps) {
  const pathname = usePathname();
  const isDoctor = userRole === "doctor";
  const isSubPage = showBackButton || pathname !== "/admin";

  return (
    <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Title & Role Info */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-emerald-500 text-slate-950">
            {isDoctor ? (
              <Stethoscope className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            )}
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            {isDoctor
              ? `Doctor Consultation Desk${currentDoctorName ? ` • ${currentDoctorName}` : ""}`
              : pathname.startsWith("/admin/booking")
                ? "Bookings Desk"
                : pathname.startsWith("/admin/doctor")
                  ? "Doctors Directory Management"
                  : "Admin Operations Desk"}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {isDoctor
            ? "Today's live clinic patient queue, appointment statuses & consultation earnings."
            : pathname.startsWith("/admin/booking")
              ? "Review patient consultation queue, clinical triage statuses, and daily revenue."
              : pathname.startsWith("/admin/doctor")
                ? "Onboard new specialists, update clinic visiting schedules, time windows, and pricing."
                : "Central operations console for clinic bookings, doctors, and virtual queue."}
        </p>
      </div>

      {/* Back to Operations Hub button for subpages (Only visible to Super Admin) */}
      {isSubPage && !isDoctor && (
        <Link
          href="/admin"
          className="self-start sm:self-auto py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Back</span>
        </Link>
      )}
    </div>
  );
}
