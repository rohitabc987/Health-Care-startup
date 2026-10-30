"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useNavigation } from "@/context/NavigationContext";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  CalendarCheck,
  FileText,
  PhoneCall,
  ShieldCheck,
  ChevronRight,
  LogOut,
  X,
  Check,
  Stethoscope,
  LogIn
} from "lucide-react";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: string;
}

export function ProfileDropdown({ isOpen, onClose, currentLocation = "Viram Khand 5, Gomti Nagar" }: ProfileDropdownProps) {
  const { activeBookingsCount } = useNavigation();
  const { user, openLoginModal, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const getInitials = (name?: string) => {
    if (!name) return "PT";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

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
        {/* Header: User Profile Info or Sign In Prompt */}
        <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-b border-gray-150">
          <div className="flex items-start justify-between">
            {!user ? (
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">Welcome Patient</h3>
                    <p className="text-[11px] text-gray-500">Sign in for follow-ups &amp; slips</p>
                  </div>
                </div>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5 stroke-[2.3]" />
                  <span>Login with Mobile Number</span>
                </Link>
              </div>
            ) : (
              <Link
                href="/profile"
                onClick={onClose}
                className="flex items-center gap-3 flex-1 group/user cursor-pointer pr-2 hover:opacity-95 transition-opacity"
                title="Click photo or name to open Profile page"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover/user:scale-105 group-hover/user:ring-2 group-hover/user:ring-emerald-400 transition-all">
                  {getInitials(user?.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover/user:text-emerald-700 transition-colors">
                      {user?.name || "Patient"}
                    </h3>
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white shrink-0 shadow-2xs"
                      title="Verified"
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{user?.phone || ""}</p>
                  {user?.healthId && (
                    <p className="text-[10px] font-mono text-emerald-700 font-semibold mt-0.5">{user.healthId}</p>
                  )}
                </div>
              </Link>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/80 hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors shrink-0"
              aria-label="Close menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dropdown Menu Items */}
        <div className="p-2 space-y-1 text-xs">
          {/* Profile Section */}
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
                <p className="font-bold text-gray-900 group-hover:text-emerald-900">My Profile</p>
                <p className="text-[11px] text-gray-400">Health ID, address details &amp; records</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Item 1: My Follow-ups */}
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
                <p className="font-bold text-gray-900 group-hover:text-emerald-900">My Booking</p>
                <p className="text-[11px] text-gray-400">Track active follow-up triage & clinic pass</p>
              </div>
            </div>
            {activeBookingsCount > 0 ? (
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {activeBookingsCount}
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
                <p className="font-bold text-gray-900 group-hover:text-emerald-900">My Prescription</p>
                <p className="text-[11px] text-gray-400">View & snapshot paper slips</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>



          {/* Item 4: Switch Account / Zero-Captcha Phone Login */}
          <div className="pt-1 border-t border-gray-150">

          </div>

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
                <p className="font-bold text-gray-900 group-hover:text-emerald-900">Find Doctors</p>
                <p className="text-[11px] text-gray-400">Directory & book follow-ups</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Item 5: Booking & Triage Support */}
          <div>
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
                  <p className="font-bold text-gray-900">Healthcare Support</p>
                  <p className="text-[11px] text-gray-400">Call helpline (1800-PRONTO)</p>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                24/7
              </span>
            </button>
          </div>

          {/* Item 6: Log Out (Visible only if authenticated) */}
          {user && (
            <div className="pt-1 border-t border-gray-150">
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full p-2.5 rounded-2xl hover:bg-rose-50 text-rose-700 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-100/70 text-rose-600 flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 group-hover:text-rose-900">Log Out</p>
                    <p className="text-[11px] text-gray-400">Sign out of this device</p>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
