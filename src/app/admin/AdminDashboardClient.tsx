"use client";

import React from "react";
import Link from "next/link";
import { 
  CalendarCheck, 
  Stethoscope, 
  Video, 
  ArrowRight, 
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { AdminNavHeader } from "./components/AdminNavHeader";
import { UserRole } from "@/lib/types";

interface AdminDashboardClientProps {
  userRole?: UserRole;
  currentDoctorId?: string;
}

export function AdminDashboardClient({
  userRole = "super_admin",
  currentDoctorId,
}: AdminDashboardClientProps) {
  const isDoctor = userRole === "doctor";

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Clean Admin Header */}
      <AdminNavHeader
        userRole={userRole}
      />

      {/* Central Launchpad Cards */}
      <div>
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-black text-gray-900">
            Operations Management Hub
          </h2>
          <p className="text-xs text-gray-400">
            Select a dedicated module below to manage patient appointments, doctor catalogs, or tele-consultation queue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Today's Bookings */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-700 group-hover:scale-105 transition-transform">
                  <CalendarCheck className="w-6 h-6 stroke-[2.5]" />
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                  Bookings &amp; Sales
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900 group-hover:text-emerald-700 transition-colors">
                  Today&apos;s Bookings Desk
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Review the patient consultation queue, clinical triage statuses, screening progress, and daily revenue calculations.
                </p>
              </div>

              {/* Module Feature Highlights */}
              <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/70 text-xs text-emerald-900 space-y-1.5 pt-2.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Real-time patient triage feed</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Daily revenue &amp; patient volume metrics</span>
                </div>
              </div>
            </div>

            <Link
              href="/admin/booking"
              className="mt-6 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              <span>Open Bookings Desk</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Doctors Directory (Hidden for Doctor users) */}
          {!isDoctor && (
            <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="p-3 rounded-2xl bg-blue-500/10 text-blue-700 group-hover:scale-105 transition-transform">
                    <Stethoscope className="w-6 h-6 stroke-[2.5]" />
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                    Specialist Catalog
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-700 transition-colors">
                    Doctors Directory
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Onboard new specialists, update clinic visiting schedules, set consultation time windows, and configure fees.
                  </p>
                </div>

                {/* Module Feature Highlights */}
                <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100/70 text-xs text-blue-900 space-y-1.5 pt-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Onboard &amp; edit doctor profiles</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-blue-950">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Visiting days &amp; time windows control</span>
                  </div>
                </div>
              </div>

              <Link
                href="/admin/doctor"
                className="mt-6 w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>Manage Doctor Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Card 3: Runway Virtual Queue */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-3 rounded-2xl bg-purple-500/10 text-purple-700 group-hover:scale-105 transition-transform">
                  <Video className="w-6 h-6 stroke-[2.5]" />
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full">
                  Tele-Consultation
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900 group-hover:text-purple-700 transition-colors">
                  Runway Virtual Queue
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Real-time patient triage, care team pre-checks, audio-video screening, and zero-wait consultation rooms.
                </p>
              </div>

              {/* Module Feature Highlights */}
              <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100/70 text-xs text-purple-900 space-y-1.5 pt-2.5">
                <div className="flex items-center gap-1.5 font-bold text-purple-950">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Zero-wait patient runway</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-purple-950">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Audio &amp; 4G connectivity pre-checks</span>
                </div>
              </div>
            </div>

            <Link
              href="/admin/queue"
              className="mt-6 w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              <span>Open Virtual Queue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
