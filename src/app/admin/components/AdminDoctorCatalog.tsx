"use client";

import React, { useState, useMemo } from "react";
import { Doctor } from "@/lib/firebase";
import { Plus, ToggleLeft, ToggleRight, Search, X, Edit3 } from "lucide-react";
import { normalizeSearchQuery } from "@/lib/searchUtils";

interface AdminDoctorCatalogProps {
  doctorsList: Doctor[];
  onOpenAddModal: () => void;
  onEditDoctor: (doctor: Doctor) => void;
  onToggleDoctor: (docId: string, currentStatus?: boolean) => void;
}

export function AdminDoctorCatalog({
  doctorsList,
  onOpenAddModal,
  onEditDoctor,
  onToggleDoctor,
}: AdminDoctorCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDoctors = useMemo(() => {
    const raw = searchQuery.trim();
    if (!raw) return doctorsList;

    const term = normalizeSearchQuery(raw);
    return doctorsList.filter((doc) => {
      if (doc.searchKeywords && doc.searchKeywords.some((k) => k.includes(term))) {
        return true;
      }
      const name = doc.name.toLowerCase();
      const spec = doc.specialty.toLowerCase();
      const clinic = doc.clinic.toLowerCase();
      const phone = (doc.phone || "").replace(/\D/g, "");

      return (
        name.includes(term) ||
        spec.includes(term) ||
        clinic.includes(term) ||
        phone.includes(term)
      );
    });
  }, [doctorsList, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-150 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-gray-900">
            Doctor Catalog Management ({filteredDoctors.length}
            {filteredDoctors.length !== doctorsList.length ? ` of ${doctorsList.length}` : ""})
          </h2>
          <p className="text-xs text-gray-400">
            Doctors shown on the home page are managed strictly from this Admin panel.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-sm flex items-center gap-1.5 transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* Doctor Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search doctor by name, specialty, clinic, or mobile..."
          className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Doctor Cards with Active / Inactive Toggle */}
      {filteredDoctors.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-gray-150 text-center text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-600">No doctors match &quot;{searchQuery}&quot;</p>
          <p className="text-[11px]">Try searching by specialty (e.g. &quot;Cardiology&quot;) or doctor surname.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className={`bg-white p-4 sm:p-5 rounded-3xl border transition-all flex items-start justify-between gap-3 shadow-xs ${doc.isActive !== false ? "border-emerald-200" : "border-gray-200 opacity-60 bg-gray-50/70"
                }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.image}
                  alt={doc.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/20 shrink-0"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-gray-900 truncate">{doc.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{doc.specialty}</p>
                  <p className="text-xs text-gray-400 truncate">{doc.clinic}</p>

                  {/* Schedule, Timing & Phone Information */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-gray-500">
                    {doc.phone && (
                      <span className="text-slate-700 font-mono font-medium">
                        📞 {doc.phone}
                      </span>
                    )}
                    <span className="text-slate-600 font-medium">
                      📅 {doc.availableDays?.length === 7 ? "All Days (Mon-Sun)" : (doc.availableDays?.join(", ") || doc.nextAvailableDay || "Mon, Wed, Fri")}
                    </span>
                    {doc.clinicTimings && (
                      <span className="text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                        ⏰ {doc.clinicTimings}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="font-bold text-emerald-800">₹{doc.consultationFee}</span>
                    <span className="line-through text-gray-400 text-[11px]">₹{doc.regularFee}</span>
                    <span className="text-amber-800 font-semibold text-[11px]">★ {doc.rating}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => onEditDoctor(doc)}
                  className="py-1.5 px-2 md:px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 cursor-pointer"
                  title="Edit Doctor Details"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                  {/* <span>Edit</span> */}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleDoctor(doc.id, doc.isActive)}
                  className={`py-1.5 px-2 md:px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${doc.isActive !== false
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                  {doc.isActive !== false ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-700" />
                      {/* <span>Visible</span> */}
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-gray-500" />
                      {/* <span>Hidden</span> */}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
