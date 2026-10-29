"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserProfile, UserAddress } from "@/lib/firebase";
import { revalidatePatientDataAction } from "@/app/actions/cacheActions";
import { useAuth } from "@/context/AuthContext";
import { ProfileDropdown } from "../components/ProfileDropdown";
import {
  Stethoscope,
  CheckCircle2,
  FileText,
  CalendarCheck,
  ArrowRight,
  LogIn,
  MapPin,
  Edit3,
  Check,
  X
} from "lucide-react";

interface ProfileClientProps {
  initialUser: UserProfile | null;
}

export function ProfileClient({ initialUser }: ProfileClientProps) {
  const { user, updateUser, openLoginModal } = useAuth();
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const activeUser = user || initialUser;

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locality, setLocality] = useState(activeUser?.address?.locality || "Gomti Nagar");
  const [stateName, setStateName] = useState(activeUser?.address?.state || "Uttar Pradesh");
  const [locationSaved, setLocationSaved] = useState(false);

  useEffect(() => {
    if (activeUser?.address?.locality) {
      setLocality(activeUser.address.locality);
    }
    if (activeUser?.address?.state) {
      setStateName(activeUser.address.state);
    }
  }, [activeUser?.address?.locality, activeUser?.address?.state]);

  const getInitials = (name?: string) => {
    if (!name) return "PT";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedAddress: UserAddress = {
      ...activeUser?.address,
      locality: locality.trim(),
      state: stateName.trim(),
    };
    updateUser({ address: updatedAddress });
    if (activeUser?.uid) {
      await revalidatePatientDataAction(activeUser.uid);
    }
    setIsEditingLocation(false);
    setLocationSaved(true);
    setTimeout(() => setLocationSaved(false), 2000);
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

        {/* Profile Avatar or Login Trigger */}
        {!activeUser ? (
          <Link
            href="/login?redirect=/profile"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <LogIn className="w-3.5 h-3.5 stroke-[2.3]" />
            <span>Login</span>
          </Link>
        ) : (
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
              {getInitials(activeUser?.name)}
            </button>

            <ProfileDropdown
              isOpen={isMobileProfileOpen}
              onClose={() => setIsMobileProfileOpen(false)}
            />
          </div>
        )}
      </div>

      {!activeUser ? (
        /* Unauthenticated Centered Hero Card */
        <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-6 my-4 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
            <LogIn className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Patient Portal
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
              Sign In to Your Health Profile
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Track zero-queue clinic follow-up passes, securely view digital paper prescriptions, and manage consultation history.
            </p>
          </div>

          {/* Quick Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <span className="text-base block mb-1">⚡</span>
              <p className="text-xs font-bold text-gray-900">Zero-Queue Pass</p>
              <p className="text-[11px] text-gray-500">Walk past clinic waiting rooms</p>
            </div>
            <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100">
              <span className="text-base block mb-1">📋</span>
              <p className="text-xs font-bold text-gray-900">Digital Vault</p>
              <p className="text-[11px] text-gray-500">All doctor slips safely archived</p>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
              <span className="text-base block mb-1">🔒</span>
              <p className="text-xs font-bold text-gray-900">Zero Captcha</p>
              <p className="text-[11px] text-gray-500">Direct 1-tap mobile verification</p>
            </div>
          </div>

          <div className="pt-2 space-y-2.5">
            <Link
              href="/login?redirect=/profile"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold rounded-2xl shadow-md shadow-emerald-600/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <LogIn className="w-4 h-4 stroke-[2.3]" />
              <span>Login with Mobile Number</span>
            </Link>

            <button
              type="button"
              onClick={openLoginModal}
              className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-2xl text-xs transition-colors"
            >
              Open Quick Login Modal
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Header - Health ID directly below Patient Profile */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-150 shadow-xs">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-gray-900">My Profile</h1>
              <span className="text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Verified
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Health ID:</span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100 inline-block">
                {activeUser.healthId || "#PRN-8821-LKO"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start">
            {/* Left Column: Patient Details with Locality & State in the same card */}
            <div className="space-y-4">
              {/* Patient Card */}
              <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                      {getInitials(activeUser.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="font-bold text-gray-900 text-base">{activeUser.name}</h2>
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{activeUser.phone}</p>
                      {activeUser.age && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Age: {activeUser.age} • Gender: {activeUser.gender || "Not specified"}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 truncate mt-0.5">{activeUser.defaultClinic || "Apollo Clinic, Gomti Nagar"}</p>
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

                {/* Locality & State - In the same card */}
                <div className="pt-3 border-t border-gray-100">
                  {locationSaved && (
                    <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5 animate-in fade-in">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Location updated successfully!</span>
                    </div>
                  )}

                  {!isEditingLocation ? (
                    <div className="flex items-center justify-between text-xs py-0.5">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium">Locality &amp; State:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-right">
                          {locality && stateName ? `${locality}, ${stateName}` : locality || stateName || "Gomti Nagar, Uttar Pradesh"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingLocation(true)}
                          className="p-1 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Locality & State"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveLocation} className="space-y-2.5 pt-1 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          Edit Locality &amp; State
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingLocation(false)}
                          className="text-gray-400 hover:text-gray-600 text-[11px] flex items-center gap-0.5"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 block mb-1">Locality</label>
                          <input
                            type="text"
                            value={locality}
                            onChange={(e) => setLocality(e.target.value)}
                            placeholder="e.g. Gomti Nagar"
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 block mb-1">State</label>
                          <input
                            type="text"
                            value={stateName}
                            onChange={(e) => setStateName(e.target.value)}
                            placeholder="e.g. Uttar Pradesh"
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs"
                      >
                        Save Location
                      </button>
                    </form>
                  )}
                </div>

                <div className="pt-2.5 border-t border-gray-100 space-y-2 text-xs">
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
            </div>

            {/* Right Column: Medical Records Vault & Bookings */}
            <div className="space-y-4">
              {/* Medical Records Vault Card - Mobile-Optimized, Non-overlapping */}
              <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white rounded-3xl border border-emerald-200/90 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/20 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">Medical Records Vault</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Prescriptions &amp; clinic slips</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  Safely store paper slips and prescriptions for doctor consults and follow-ups.
                </p>

                <Link
                  href="/prescriptions"
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 group"
                >
                  <span>Open Medical Vault</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Quick Bookings Navigation Link */}
              <Link
                href="/bookings"
                className="bg-white p-4 rounded-3xl border border-gray-150 hover:border-emerald-300 shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-gray-900">My Appointments &amp; Bookings</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">Track doctor consults &amp; follow-up passes</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
