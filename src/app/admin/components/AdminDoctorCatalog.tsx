"use client";

import React from "react";
import { Doctor } from "@/lib/firebase";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";

interface AdminDoctorCatalogProps {
  doctorsList: Doctor[];
  onOpenAddModal: () => void;
  onToggleDoctor: (docId: string, currentStatus?: boolean) => void;
}

export function AdminDoctorCatalog({
  doctorsList,
  onOpenAddModal,
  onToggleDoctor,
}: AdminDoctorCatalogProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-150 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-gray-900">
            Doctor Catalog Management
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

      {/* Doctor Cards with Active / Inactive Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {doctorsList.map((doc) => (
          <div 
            key={doc.id}
            className={`bg-white p-4 sm:p-5 rounded-3xl border transition-all flex items-start justify-between gap-3 shadow-xs ${
              doc.isActive !== false ? "border-emerald-200" : "border-gray-200 opacity-60 bg-gray-50/70"
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
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                    doc.isActive !== false ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"
                  }`}>
                    {doc.isActive !== false ? "Active on Home" : "Hidden from Home"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{doc.specialty}</p>
                <p className="text-xs text-gray-400 truncate">{doc.clinic}</p>
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
                onClick={() => onToggleDoctor(doc.id, doc.isActive)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  doc.isActive !== false
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {doc.isActive !== false ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-700" />
                    <span>Visible</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-gray-500" />
                    <span>Hidden</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
