"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useNavigation } from "@/context/NavigationContext";
import { INITIAL_USER } from "@/lib/firebase";
import { 
  User, 
  CalendarCheck, 
  FileText, 
  PhoneCall, 
  ShieldCheck, 
  ChevronRight, 
  LogOut, 
  X,
  Stethoscope
} from "lucide-react";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: string;
}

export function ProfileDropdown({ isOpen, onClose, currentLocation = "Viram Khand 5, Gomti Nagar" }: ProfileDropdownProps) {
  const { activeBookingsCount } = useNavigation();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs md:hidden"
        onClick={onClose}
      />

      {/* Dropdown Container */}
      <div
        ref={dropdownRef}
        className="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-white rounded-3xl shadow-2xl border border-gray-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header: User Profile Info (Clickable: Profile photo or name directly opens profile) */}
        <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-b border-gray-150">
          <div className="flex items-start justify-between">
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 flex-1 group/user cursor-pointer pr-2 hover:opacity-95 transition-opacity"
              title="Click photo or name to open Profile page"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover/user:scale-105 group-hover/user:ring-2 group-hover/user:ring-emerald-400 transition-all">
                RV
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover/user:text-emerald-700 transition-colors">
                    {INITIAL_USER.name}
                  </h3>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded uppercase">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{INITIAL_USER.phone}</p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-0.5">
                  <span>Open Profile</span>
                  <ChevronRight className="w-3 h-3 group-hover/user:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/80 hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors shrink-0"
              aria-label="Close menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ground Team Status Pill */}
          <div className="mt-3 pt-2.5 border-t border-emerald-100/80 flex items-center justify-between text-[11px]">
            <span className="text-gray-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ground Onboarded:</span>
            </span>
            <span className="font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
              Zero Queue Active
            </span>
          </div>
        </div>

        {/* Dropdown Menu Items */}
        <div className="p-2 space-y-1 text-xs">
          {/* Profile Section at top before My Bookings */}
          <Link
            href="/profile"
            onClick={onClose}
            className="w-full p-2.5 rounded-2xl hover:bg-emerald-50/70 text-gray-700 hover:text-emerald-950 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100/70 group-hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900 group-hover:text-emerald-900">Patient Profile</p>
                <p className="text-[11px] text-gray-400">Health ID, demographics & account</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Item 1: My Bookings */}
          <Link
            href="/bookings"
            onClick={onClose}
            className="w-full p-2.5 rounded-2xl hover:bg-emerald-50/70 text-gray-700 hover:text-emerald-950 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-emerald-100 text-gray-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900 group-hover:text-emerald-900">My Bookings</p>
                <p className="text-[11px] text-gray-400">Track active follow-up triage</p>
              </div>
            </div>
            {activeBookingsCount > 0 ? (
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {activeBookingsCount} Active
              </span>
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            )}
          </Link>

          {/* Item 2: Prescription Vault */}
          <Link
            href="/prescriptions"
            onClick={onClose}
            className="w-full p-2.5 rounded-2xl hover:bg-emerald-50/70 text-gray-700 hover:text-emerald-950 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-emerald-100 text-gray-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900 group-hover:text-emerald-900">Prescription Vault</p>
                <p className="text-[11px] text-gray-400">View & snapshot paper slips</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Item 3: Find Doctors */}
          <Link
            href="/"
            onClick={onClose}
            className="w-full p-2.5 rounded-2xl hover:bg-emerald-50/70 text-gray-700 hover:text-emerald-950 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-emerald-100 text-gray-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900 group-hover:text-emerald-900">Partnered Doctors</p>
                <p className="text-[11px] text-gray-400">Directory & schedule follow-ups</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Item 4: Booking & Triage Support */}
          <div className="pt-1 border-t border-gray-150">
            <button
              type="button"
              onClick={() => {
                alert("Pronto 24/7 Operations Desk\nToll-Free: 1800-PRONTO-CARE (1800-776-686)\nClinic Ops Liaison: +91 99887 76655\nGround hours: Mon-Sun 8 AM - 10 PM");
                onClose();
              }}
              className="w-full p-2.5 rounded-2xl hover:bg-slate-50 text-gray-700 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Booking Support</p>
                  <p className="text-[11px] text-gray-400">Call triage operations (1800-PRONTO)</p>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                24/7
              </span>
            </button>
          </div>
        </div>

        {/* Footer: View Full Profile & Sign Out Demo */}
        <div className="p-3 bg-gray-50 border-t border-gray-150 flex items-center justify-between text-xs">
          <Link
            href="/profile"
            onClick={onClose}
            className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
          >
            <span>Open Profile Page</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => {
              alert("Switch patient / Reset demo state");
              onClose();
            }}
            className="text-gray-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch</span>
          </button>
        </div>
      </div>
    </>
  );
}
