"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useNavigation } from "@/context/NavigationContext";
import { useAuth } from "@/context/AuthContext";
import { generateHealthId } from "@/lib/userService";
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
  Crown,
  Stethoscope,
  LogIn,
  LayoutDashboard,
  Video
} from "lucide-react";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: string;
}

export function ProfileDropdown({ isOpen, onClose }: ProfileDropdownProps) {
  const { activeBookingsCount } = useNavigation();
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const getInitials = (name?: string) => {
    if (!name) return "PT";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const isSuperAdmin = user?.role === "super_admin";
  const isDoctor = user?.role === "doctor";
  const isPatient = Boolean(user && user.role !== "super_admin" && user.role !== "doctor");
  const isGuest = !user;
  const healthId = user?.healthId || (user?.phone ? generateHealthId(user.phone) : null);

  const handleSupportClick = () => {
    alert("Pronto 24/7 Operations Desk\nToll-Free: 1800-PRONTO-CARE (1800-776-686)\nClinic Ops Liaison: +91 99887 76655\nGround hours: Mon-Sun 8 AM - 10 PM");
    onClose();
  };

  const handleLogoutClick = () => {
    logout();
    onClose();
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

      {/* Clean Compact Dropdown Menu */}
      <div
        ref={dropdownRef}
        className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-gray-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
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
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">Welcome</h3>
                    <p className="text-[11px] text-gray-500">Sign in to your account</p>
                  </div>
                </div>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5 stroke-[2.3]" />
                  <span>Login with Mobile</span>
                </Link>
              </div>
            ) : (
              <Link
                href="/profile"
                onClick={onClose}
                className="flex items-center gap-3 flex-1 group/user cursor-pointer pr-2 hover:opacity-95 transition-opacity min-w-0"
                title="View Profile"
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-base flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover/user:scale-105 transition-all shrink-0">
                  {getInitials(user?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover/user:text-emerald-700 transition-colors truncate">
                      {user?.name || "User"}
                    </h3>
                    {isSuperAdmin ? (
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-slate-950 shrink-0 shadow-2xs"
                        title="Super Admin"
                      >
                        <Crown className="w-2.5 h-2.5 stroke-[2.8]" />
                      </span>
                    ) : isDoctor ? (
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-teal-600 text-white shrink-0 shadow-2xs"
                        title="Doctor"
                      >
                        <Stethoscope className="w-2.5 h-2.5 stroke-[2.8]" />
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500 text-white shrink-0 shadow-2xs"
                        title="Verified Patient"
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">{user?.phone || ""}</p>
                  {healthId && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200/80 px-1.5 py-0.2 rounded select-all">
                        {healthId}
                      </span>
                    </div>
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

        {/* Clean Menu Items (Headlines Only, Zero Subtitles, Clean Section Dividers) */}
        <div className="p-2 space-y-0.5 text-xs">
          {/* ================= 1. PATIENT ROLE ================= */}
          {user && isPatient && (
            <>
              {/* Group 1: Profile, Booking, Prescriptions */}
              <Link
                href="/profile"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">My Profile</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/bookings"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                    <CalendarCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">My Bookings</span>
                </div>
                {activeBookingsCount > 0 ? (
                  <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {activeBookingsCount}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                )}
              </Link>

              <Link
                href="/prescriptions"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">My Prescriptions</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Section Divider */}
              <div className="my-1.5 border-t border-gray-150" />

              {/* Group 2: Find Doctors, Health Support */}
              <Link
                href="/"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                    <Stethoscope className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">Find Doctors</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button
                type="button"
                onClick={handleSupportClick}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <PhoneCall className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">Healthcare Support</span>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded-full">
                  24/7
                </span>
              </button>

              {/* Section Divider */}
              <div className="my-1.5 border-t border-gray-150" />

              {/* Group 3: Log Out */}
              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100/70 text-rose-600 flex items-center justify-center">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-rose-700">Log Out</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </>
          )}

          {/* ================= 2. DOCTOR ROLE ================= */}
          {user && isDoctor && (
            <>
              {/* Group 1: My Profile, My Booking (Today's Bookings), Doctor Consultation */}
              <Link
                href="/profile"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">My Profile</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/booking"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <CalendarCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">My Bookings</span>
                </div>
                {activeBookingsCount > 0 ? (
                  <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {activeBookingsCount}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                )}
              </Link>

              <Link
                href="/doctor/consultation"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-950 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Stethoscope className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">Doctor Consultation</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Section Divider */}
              <div className="my-1.5 border-t border-gray-150" />

              {/* Group 2: Healthcare Support */}
              <button
                type="button"
                onClick={handleSupportClick}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <PhoneCall className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">Healthcare Support</span>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded-full">
                  24/7
                </span>
              </button>

              {/* Section Divider */}
              <div className="my-1.5 border-t border-gray-150" />

              {/* Group 3: Log Out */}
              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100/70 text-rose-600 flex items-center justify-center">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-rose-700">Log Out</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </>
          )}

          {/* ================= 3. SUPER ADMIN ROLE ================= */}
          {user && isSuperAdmin && (
            <>
              {/* Group 1: Profile, Today's Booking, Doctor Directory */}
              <Link
                href="/profile"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">Profile</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/booking"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <CalendarCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">Today&apos;s Bookings</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/doctor"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                    <Stethoscope className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">Doctor Directory</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Section Divider */}
              <div className="my-1.5 border-t border-gray-150" />

              {/* Group 2: Admin, Virtual Queue, Doctor Consultation */}
              <Link
                href="/admin"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-amber-50 text-amber-950 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">Admin Hub</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/queue"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-purple-50 text-purple-950 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Video className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">Virtual Queue</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/doctor/consultation"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">Doctor Consultation</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Section Divider */}
              <div className="my-1.5 border-t border-gray-150" />

              {/* Group 3: Healthcare Support */}
              <button
                type="button"
                onClick={handleSupportClick}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <PhoneCall className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">Healthcare Support</span>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded-full">
                  24/7
                </span>
              </button>

              {/* Section Divider */}
              <div className="my-1.5 border-t border-gray-150" />

              {/* Group 4: Log Out */}
              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100/70 text-rose-600 flex items-center justify-center">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-rose-700">Log Out</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </>
          )}

          {/* ================= 4. GUEST / UNLOGGED USER ================= */}
          {isGuest && (
            <>
              {/* Group 1: My Profile, My Booking, My Prescription */}
              <Link
                href="/login?redirect=/profile"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">My Profile</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/bookings"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                    <CalendarCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">My Bookings</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/prescriptions"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">My Prescriptions</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Section Divider */}
              <div className="my-1.5 border-t border-gray-150" />

              {/* Group 2: Find Doctors, Healthcare Support */}
              <Link
                href="/"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                    <Stethoscope className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">Find Doctors</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button
                type="button"
                onClick={handleSupportClick}
                className="w-full px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-800 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <PhoneCall className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900">Healthcare Support</span>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded-full">
                  24/7
                </span>
              </button>

              {/* Section Divider */}
              <div className="my-1.5 border-t border-gray-150" />

              {/* Group 3: Staff & Doctor Login */}
              <Link
                href="/login"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-emerald-900">Staff &amp; Doctor Login</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
