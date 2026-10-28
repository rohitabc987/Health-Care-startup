"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserProfile, UserAddress } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { AddressEditorCard } from "./components/AddressEditorCard";
import { 
  Stethoscope, 
  CheckCircle2, 
  PhoneCall, 
  FileText, 
  CalendarCheck, 
  ArrowRight, 
  LogIn 
} from "lucide-react";

interface ProfileClientProps {
  initialUser: UserProfile;
}

export function ProfileClient({ initialUser }: ProfileClientProps) {
  const { user, updateUser, openLoginModal } = useAuth();
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  const activeUser = user || initialUser;

  const getInitials = (name?: string) => {
    if (!name) return "PT";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleUpdateAddress = (address: UserAddress) => {
    updateUser({ address });
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5 animate-in fade-in duration-200">
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
            {getInitials(activeUser?.name)}
          </button>

          <ProfileDropdown
            isOpen={isMobileProfileOpen}
            onClose={() => setIsMobileProfileOpen(false)}
          />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-150 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-gray-900">Patient Profile</h1>
            <span className="text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Verified
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Personal details, address &amp; medical vault
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Health ID</span>
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 whitespace-nowrap inline-block">
            {activeUser?.healthId || "#PRN-8821-LKO"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start">
        {/* Left Column: Patient Details & Optional Address */}
        <div className="space-y-4">
          {/* Patient Card */}
          <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                  {getInitials(activeUser?.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="font-bold text-gray-900 text-base">{activeUser?.name || "Rahul Verma"}</h2>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{activeUser?.phone || "+91 98765 43210"}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{activeUser?.defaultClinic || "Apollo Clinic, Gomti Nagar"}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={openLoginModal}
                className="shrink-0 p-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1"
                title="Switch account with mobile OTP"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Switch</span>
              </button>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>Account Status:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Mobile Access
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Smart Follow-up Pass:</span>
                <span className="font-semibold text-emerald-700">Active (Zero-Queue Pass)</span>
              </div>
            </div>
          </div>

          {/* Optional Address Card (Modular Component) */}
          <AddressEditorCard
            user={activeUser}
            onUpdateAddress={handleUpdateAddress}
          />
        </div>

        {/* Right Column: Medical Records Vault & Operations Support */}
        <div className="space-y-4">
          {/* Medical Records Vault Card */}
          <div className="bg-gradient-to-br from-emerald-50/60 via-teal-50/30 to-white rounded-3xl border border-emerald-200/90 p-4 sm:p-5 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/20 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Medical Records Vault</h3>
                  <p className="text-[11px] text-gray-500">Prescriptions &amp; clinic slips</p>
                </div>
              </div>

              <Link
                href="/prescriptions"
                className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1 group"
              >
                <span>Open Vault</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            
            <p className="text-xs text-gray-600 leading-relaxed">
              Safely store paper slips and prescriptions for doctor consults and follow-ups.
            </p>
          </div>

          {/* Quick Bookings Navigation Link */}
          <Link
            href="/bookings"
            className="bg-white p-4 rounded-3xl border border-gray-150 hover:border-emerald-300 shadow-xs transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-gray-900">My Appointments &amp; Bookings</p>
                <p className="text-[11px] text-gray-400">Track doctor consults &amp; follow-up passes</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* 24/7 Operations Desk Support Card */}
          <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">24/7 Patient Support Desk</h3>
                <p className="text-xs text-gray-400">Questions about your appointments or passes?</p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-950 space-y-1">
              <p className="font-mono font-bold text-sm text-indigo-900">1800-PRONTO-CARE (Toll-Free)</p>
              <p className="text-[11px] text-indigo-800">Direct Patient Care: +91 99887 76655</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
