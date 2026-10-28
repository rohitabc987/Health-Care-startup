"use client";

import React from "react";
import { Users, DollarSign, Sparkles } from "lucide-react";

interface AdminKpiCardsProps {
  selectedDoctorId: string;
  overallMetrics: { totalPatients: number; totalRevenue: number };
  doctorMetrics: { doctorPatients: number; doctorRevenue: number } | null;
}

export function AdminKpiCards({
  selectedDoctorId,
  overallMetrics,
  doctorMetrics,
}: AdminKpiCardsProps) {
  const isAll = selectedDoctorId === "all";
  const patientsCount = isAll ? overallMetrics.totalPatients : (doctorMetrics?.doctorPatients ?? 0);
  const revenueCount = isAll ? overallMetrics.totalRevenue : (doctorMetrics?.doctorRevenue ?? 0);
  const avgFee = patientsCount > 0 ? Math.round(revenueCount / patientsCount) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Card 1: Patients Today */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-3xl shadow-md space-y-2">
        <div className="flex items-center justify-between opacity-90 text-xs font-bold uppercase tracking-wider">
          <span>{isAll ? "Today's Total Patients" : "Doctor's Patients Today"}</span>
          <Users className="w-5 h-5" />
        </div>
        <div className="text-3xl sm:text-4xl font-black">
          {patientsCount}
        </div>
        <p className="text-[11px] text-emerald-100">
          {isAll 
            ? "Computed via server-side count() [Cost: 1 Read]" 
            : "Total patients booked with selected doctor"}
        </p>
      </div>

      {/* Card 2: Total Sales Today */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-md space-y-2">
        <div className="flex items-center justify-between opacity-90 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <span>{isAll ? "Today's Total Revenue" : "Doctor's Daily Sales"}</span>
          <DollarSign className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="text-3xl sm:text-4xl font-black text-emerald-400">
          ₹{revenueCount.toLocaleString()}
        </div>
        <p className="text-[11px] text-slate-400">
          Computed via server-side sum(&apos;consultationFee&apos;) [Cost: 1 Read]
        </p>
      </div>

      {/* Card 3: Average Ticket */}
      <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
          <span>Avg. Consultation Fee</span>
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
        <div className="text-3xl sm:text-4xl font-black text-gray-900">
          ₹{avgFee}
        </div>
        <p className="text-[11px] text-gray-400">
          Zero document hotspots • Strictly 1 write per booking
        </p>
      </div>
    </div>
  );
}
