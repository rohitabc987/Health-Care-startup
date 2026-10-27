"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { INITIAL_DOCTORS, Doctor } from "@/lib/firebase";
import { DoctorCard } from "./components/DoctorCard";
import { ProfileDropdown } from "./components/ProfileDropdown";
import {
  Sparkles,
  ShieldCheck,
  Search,
  Stethoscope,
  Activity,
  ArrowRight,
  Clock,
  Zap,
  FileText
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [doctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  // Filter doctors by specialty and search query
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpecialty =
      selectedSpecialty === "All" || doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clinic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  const specialties = ["All", "General Physician", "Cardiology", "Pediatrics", "Orthopedics"];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Mobile Top Brand Bar (Clean navigation, profile icon only) */}
      <div className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3 pt-3 pb-2.5 -mx-3 border-b border-gray-150 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
            <Stethoscope className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-black text-sm text-gray-950 tracking-tight">PRONTO</span>
            <span className="ml-1 text-[9px] uppercase font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded">
              Health
            </span>
          </div>
        </Link>

        {/* Profile Avatar trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMobileProfileOpen(!isMobileProfileOpen)}
            className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${isMobileProfileOpen
              ? "bg-emerald-600 text-white ring-2 ring-emerald-500/30"
              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
              }`}
            aria-label="Profile and Menu"
          >
            RV
          </button>

          <ProfileDropdown
            isOpen={isMobileProfileOpen}
            onClose={() => setIsMobileProfileOpen(false)}
          />
        </div>
      </div>

      {/* Patient-First Action Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-3xl p-4 py-6 sm:p-6 shadow-lg shadow-emerald-950/10 border border-emerald-600/30">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
          <div className="md:col-span-8 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/20">
                <Sparkles className="w-3 h-3 text-amber-300" /> Patient Care
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold bg-emerald-500/30 text-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                <ShieldCheck className="w-3 h-3 text-emerald-300" /> Zero Clinic Queue
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Book Your Clinic Follow-up
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
              Consult your doctor online from home or fast-track your physical visit. Upload your paper slip or select your doctor below to book your slot directly.
            </p>

            {/* Direct Patient 1-Tap Actions */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("doctors-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="py-2.5 px-4 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>Book Now</span>
              </button>

              <Link
                href="/prescriptions"
                className="py-2.5 px-3.5 bg-emerald-900/40 hover:bg-emerald-900/60 border border-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-xs transition-all active:scale-95 flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-emerald-300" />
                <span>Upload Prescription</span>
              </Link>
            </div>
          </div>

          {/* Right Action Card on Desktop */}
          <div className="hidden md:flex md:col-span-4 flex-col justify-center items-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-white text-emerald-700 flex items-center justify-center shadow-md">
              <FileText className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white">Have a Clinic Slip?</h3>
              <p className="text-[11px] text-emerald-100 mt-0.5">
                Snapshot your paper prescription to schedule triage.
              </p>
            </div>
            <Link
              href="/prescriptions"
              className="w-full py-2 px-3 bg-white text-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-50 transition-all shadow-xs text-center"
            >
              Prescription Vault →
            </Link>
          </div>
        </div>
      </div>

      {/* Search Bar & Specialty Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctor name, specialty, or clinic..."
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Doctors Counter */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Showing {filteredDoctors.length} Partnered Specialists</span>
          </div>
        </div>

        {/* Specialty Filter Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {specialties.map((spec) => (
            <button
              key={spec}
              type="button"
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedSpecialty === spec
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Directory Grid */}
      <div id="doctors-section" className="scroll-mt-20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-800">
              Select Doctor ({filteredDoctors.length})
            </h2>
            <p className="text-[11px] text-gray-400">Tap directly book your slot</p>
          </div>
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero-Queue Pass
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {filteredDoctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              onBookingSuccess={() => router.push("/bookings")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
