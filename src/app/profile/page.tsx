"use client";

import React, { useState } from "react";
import Link from "next/link";
import { INITIAL_USER } from "@/lib/firebase";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { 
  Stethoscope, 
  MapPin, 
  CheckCircle2, 
  User, 
  PhoneCall, 
  ShieldCheck, 
  FileText, 
  CalendarCheck,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function ProfilePage() {
  const [selectedLocation, setSelectedLocation] = useState("Viram Khand 5, Gomti Nagar, Lucknow");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  const locations = [
    "Viram Khand 5, Gomti Nagar, Lucknow",
    "Indira Nagar Clinic Hub, Lucknow",
    "Aliganj Health Sector, Lucknow",
    "Hazratganj Medical Cluster, Lucknow",
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Mobile Top Brand Bar */}
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
            className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
              isMobileProfileOpen
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
            currentLocation={selectedLocation}
          />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">Patient Profile</h1>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Verified Account
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your personal profile and registered neighborhood clinic cluster.
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Patient Health ID</span>
          <span className="text-sm font-mono font-bold text-emerald-800">#PRN-8821-LKO</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Patient Details */}
        <div className="space-y-5">
          {/* Patient Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-emerald-600/20">
                RV
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-gray-900 text-lg">{INITIAL_USER.name}</h2>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                    Ground Verified
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{INITIAL_USER.phone}</p>
                <p className="text-xs text-gray-400 mt-0.5">{INITIAL_USER.defaultClinic}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-150 space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>Account Status:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Clinic Ground Onboarded
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Zero-Queue Physical Bypass:</span>
                <span className="font-semibold text-emerald-700">Eligible (Fast-Track Pass)</span>
              </div>
            </div>
          </div>

          {/* Prescription Vault Feature Card (Vault lives under Profile) */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white rounded-3xl border border-emerald-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-gray-900">Prescription Vault</h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Digital Slips
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">Digitized paper slips & uploads</p>
                </div>
              </div>

              <Link
                href="/prescriptions"
                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1 group"
              >
                <span>Open Vault</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Paper prescriptions captured during clinic onboarding are securely archived here for internal GP follow-up triage. You can snapshot new slips anytime.
            </p>
          </div>

          {/* Quick Bookings Navigation Link */}
          <Link
            href="/bookings"
            className="bg-white p-4 rounded-2xl border border-gray-200 hover:border-emerald-300 shadow-2xs hover:shadow-sm transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-gray-900">My Follow-up Bookings</p>
                <p className="text-[11px] text-gray-400">Track active recovery screening & clinic bypass status</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Right Column: Location Cluster & Support */}
        <div className="space-y-5">
          {/* Clinic Location Cluster Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Clinic Location & Cluster</h3>
                  <p className="text-[11px] text-gray-400">Your local partner clinic neighborhood</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLocationModal(!showLocationModal)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl transition-colors"
              >
                Change
              </button>
            </div>

            {/* Current Active Location */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs font-semibold text-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span>{selectedLocation}</span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                Active Cluster
              </span>
            </div>

            {/* Change Location Modal / Panel */}
            {showLocationModal && (
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 animate-in fade-in duration-150">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Select Clinic Neighborhood
                </p>
                <div className="space-y-1">
                  {locations.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(loc);
                        setShowLocationModal(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        selectedLocation === loc
                          ? "bg-emerald-600 text-white font-bold shadow-xs"
                          : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      <span className="truncate">{loc}</span>
                      {selectedLocation === loc && (
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] text-gray-400 leading-snug">
              When our online GP escalates your case, our ground team alerts the receptionist at your selected clinic cluster to bypass the physical waiting queue.
            </p>
          </div>

          {/* 24/7 Operations Desk Support Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">24/7 Triage Operations Desk</h3>
                <p className="text-xs text-gray-500">Need help with your clinic follow-up or bypass code?</p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-indigo-950 space-y-1">
              <p className="font-mono font-bold text-sm text-indigo-900">1800-PRONTO-CARE (Toll-Free)</p>
              <p className="text-[11px] text-indigo-800">Direct Ground Ops Desk: +91 99887 76655</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
