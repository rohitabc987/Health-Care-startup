"use client";

import React, { useState, useMemo } from "react";
import { Appointment, AppointmentStatus } from "@/lib/firebase";
import { Calendar, MapPin, Search, Hash, X } from "lucide-react";
import { normalizeSearchQuery } from "@/lib/searchUtils";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isHealthIdOnly, setIsHealthIdOnly] = useState(false);

  // Filter appointments using normalized searchKeywords & direct fields
  const filteredAppointments = useMemo(() => {
    const raw = searchQuery.trim();
    if (!raw) return appointments;

    const term = normalizeSearchQuery(raw);
    return appointments.filter((apt) => {
      // Direct keywords array check
      if (apt.searchKeywords && apt.searchKeywords.some((k) => k.includes(term))) {
        return true;
      }
      // Fallback direct string matching
      const pName = (apt.patientName || "").toLowerCase();
      const pPhone = (apt.patientPhone || "").replace(/\D/g, "");
      const pHealth = (apt.patientHealthId || "").toLowerCase();
      const pCode = (apt.queueBypassCode || "").toLowerCase();
      const dName = (apt.doctorName || "").toLowerCase();

      return (
        pName.includes(term) ||
        pPhone.includes(term) ||
        pHealth.includes(term) ||
        pCode.includes(term) ||
        dName.includes(term)
      );
    });
  }, [appointments, searchQuery]);

  return (
    <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-gray-900">
            Today&apos;s Booked Appointments ({filteredAppointments.length}
            {filteredAppointments.length !== appointments.length ? ` of ${appointments.length}` : ""})
          </h2>
          <p className="text-xs text-gray-400">
            Real-time appointments for the selected date
          </p>
        </div>

        {canClearDoctorFilter && selectedDoctorId !== "all" && (
          <button
            type="button"
            onClick={onClearDoctorFilter}
            className="text-xs text-emerald-700 hover:underline font-bold cursor-pointer self-start sm:self-auto"
          >
            Clear Doctor Filter
          </button>
        )}
      </div>

      {/* Search Input Bar with #IND- Prefix Support */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 flex items-center">
          {isHealthIdOnly ? (
            <div className="flex items-center w-full bg-gray-50 border border-emerald-300 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all">
              <span className="px-3 py-2 bg-emerald-100 text-emerald-800 font-mono font-bold text-xs select-none border-r border-emerald-200">
                #IND-
              </span>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
                placeholder="Enter 8-digit Health ID (e.g. 37141300)"
                className="w-full px-3 py-2 bg-transparent text-xs font-mono font-semibold placeholder:text-gray-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="pr-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="relative w-full flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient by name, mobile, Health ID, or bypass code..."
                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Toggle between Omnisearch & Dedicated #IND- mode */}
        <button
          type="button"
          onClick={() => {
            setIsHealthIdOnly(!isHealthIdOnly);
            setSearchQuery("");
          }}
          className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            isHealthIdOnly
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
          title="Toggle dedicated #IND- Health ID search"
        >
          <Hash className="w-3.5 h-3.5" />
          <span>{isHealthIdOnly ? "Exit #IND- Mode" : "#IND- Lookup"}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-gray-400">
          Loading appointments...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-xs space-y-2">
          <Calendar className="w-10 h-10 mx-auto text-gray-300" />
          <p className="font-semibold text-gray-600">
            {searchQuery
              ? `No matching appointments found for "${searchQuery}"`
              : `No appointments booked for this filter on ${todayDate}`}
          </p>
          <p className="text-[11px]">
            {searchQuery
              ? "Try searching with 10-digit mobile, last name, or 8-digit Health ID."
              : "Book an appointment from the Home page to test real-time aggregate reporting."}
          </p>
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
              {filteredAppointments.map((apt) => (
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
