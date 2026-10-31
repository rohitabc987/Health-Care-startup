"use client";

import React from "react";
import { Appointment, AppointmentStatus } from "@/lib/firebase";
import { Calendar, MapPin } from "lucide-react";

interface AdminBookingsTableProps {
  appointments: Appointment[];
  isLoading: boolean;
  todayDate: string;
  selectedDoctorId: string;
  canClearDoctorFilter?: boolean;
  onClearDoctorFilter: () => void;
  onStatusChange: (aptId: string, status: AppointmentStatus) => void;
}

export function AdminBookingsTable({
  appointments,
  isLoading,
  todayDate,
  selectedDoctorId,
  canClearDoctorFilter = true,
  onClearDoctorFilter,
  onStatusChange,
}: AdminBookingsTableProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-black text-gray-900">
            Today&apos;s Booked Appointments ({appointments.length})
          </h2>
          <p className="text-xs text-gray-400">
            Self-contained snapshots (1-read guarantee with zero N+1 secondary lookups)
          </p>
        </div>

        {canClearDoctorFilter && selectedDoctorId !== "all" && (
          <button
            type="button"
            onClick={onClearDoctorFilter}
            className="text-xs text-emerald-700 hover:underline font-bold cursor-pointer"
          >
            Clear Doctor Filter
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-gray-400">
          Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-xs space-y-2">
          <Calendar className="w-10 h-10 mx-auto text-gray-300" />
          <p className="font-semibold text-gray-600">No appointments booked for this filter on {todayDate}</p>
          <p className="text-[11px]">Book an appointment from the Home page to test real-time aggregate reporting.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-150 text-gray-400 uppercase text-[10px] font-bold">
                <th className="pb-3 pl-2">Patient &amp; Health ID</th>
                <th className="pb-3">Doctor &amp; Clinic</th>
                <th className="pb-3">Window &amp; Pass Code</th>
                <th className="pb-3">Fee</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 pl-2">
                    <div className="font-bold text-gray-900">{apt.patientName || "Patient"}</div>
                    <div className="text-[11px] text-gray-500 font-mono">{apt.patientPhone}</div>
                    {apt.patientHealthId && (
                      <span className="text-[9px] font-mono bg-emerald-50 text-emerald-800 px-1 py-0.2 rounded border border-emerald-100">
                        {apt.patientHealthId}
                      </span>
                    )}
                    {apt.patientAddress && (
                      <div className="text-[10px] text-gray-400 truncate max-w-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate">{apt.patientAddress}</span>
                      </div>
                    )}
                  </td>

                  <td className="py-3">
                    <div className="font-bold text-gray-900">{apt.doctorName}</div>
                    <div className="text-[11px] text-gray-400">{apt.clinicName}</div>
                  </td>

                  <td className="py-3">
                    <div className="font-medium text-gray-700">{apt.timeWindow}</div>
                    <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                      {apt.queueBypassCode || "PRN-FAST"}
                    </span>
                  </td>

                  <td className="py-3 font-bold text-gray-900">
                    ₹{apt.consultationFee || 500}
                  </td>

                  <td className="py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      apt.status === "Pending Screening"
                        ? "bg-amber-100 text-amber-800"
                        : apt.status === "Escalated to Physical Visit"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {apt.status}
                    </span>
                  </td>

                  <td className="py-3 pr-2 text-right">
                    <select
                      value={apt.status}
                      onChange={(e) => onStatusChange(apt.id, e.target.value as AppointmentStatus)}
                      className="text-[11px] font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="Pending Screening">Pending Screening</option>
                      <option value="Escalated to Physical Visit">Escalate to Visit</option>
                      <option value="Screening Complete">Screening Complete</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
