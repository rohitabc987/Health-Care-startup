"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserProfile, UserAddress } from "@/lib/firebase";
import { revalidatePatientDataAction } from "@/app/actions/cacheActions";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle2,
  FileText,
  CalendarCheck,
  ArrowRight,
  LogIn,
  Edit3,
  Check,
  X
} from "lucide-react";

interface ProfileClientProps {
  initialUser: UserProfile | null;
}

export function ProfileClient({ initialUser }: ProfileClientProps) {
  const { user, updateUser, openLoginModal } = useAuth();
  const activeUser = user || initialUser;

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(activeUser?.name || "");
  const [editAge, setEditAge] = useState<string>(activeUser?.age ? String(activeUser.age) : "");
  const [editGender, setEditGender] = useState<"male" | "female" | "other">(activeUser?.gender || "male");
  const [locality, setLocality] = useState(activeUser?.address?.locality || "Gomti Nagar");
  const [stateName, setStateName] = useState(activeUser?.address?.state || "Uttar Pradesh");
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (activeUser?.name) {
      setEditName(activeUser.name);
    }
    if (activeUser?.age) {
      setEditAge(String(activeUser.age));
    }
    if (activeUser?.gender) {
      setEditGender(activeUser.gender);
    }
    if (activeUser?.address?.locality) {
      setLocality(activeUser.address.locality);
    }
    if (activeUser?.address?.state) {
      setStateName(activeUser.address.state);
    }
  }, [activeUser?.name, activeUser?.age, activeUser?.gender, activeUser?.address?.locality, activeUser?.address?.state]);

  const getInitials = (name?: string) => {
    if (!name) return "PT";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = editName.trim() || activeUser?.name || "Patient";
    const parsedAge = editAge ? parseInt(editAge, 10) : activeUser?.age;
    const updatedAddress: UserAddress = {
      ...activeUser?.address,
      locality: locality.trim(),
      state: stateName.trim(),
    };
    updateUser({
      name: trimmedName,
      age: isNaN(parsedAge as number) ? undefined : parsedAge,
      gender: editGender,
      address: updatedAddress,
    });
    if (activeUser?.uid) {
      await revalidatePatientDataAction(activeUser.uid);
    }
    setIsEditingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5 animate-in fade-in duration-200">

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
                {profileSaved && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Profile details updated successfully!</span>
                  </div>
                )}

                {!isEditingProfile ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                          {getInitials(activeUser.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h2 className="font-bold text-gray-900 text-base">{activeUser.name}</h2>
                            <span
                              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white shrink-0 shadow-2xs"
                              title="Verified"
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{activeUser.phone}</p>
                        </div>
                      </div>

                      {/* Pencil icon in place of sign out / switch icon */}
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="shrink-0 w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-colors shadow-2xs"
                        title="Edit profile details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* After horizontal line: Age, Gender, Location */}
                    <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Age:</span>
                        <span className="font-bold text-gray-900">
                          {activeUser.age ? `${activeUser.age} yrs` : "Not specified"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Gender:</span>
                        <span className="font-bold text-gray-900 capitalize">
                          {activeUser.gender || "Not specified"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Location:</span>
                        <span className="font-bold text-gray-900 text-right truncate max-w-[65%]">
                          {locality && stateName ? `${locality}, ${stateName}` : locality || stateName || "Gomti Nagar, Uttar Pradesh"}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-3 pt-1 text-xs animate-in fade-in">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                      <span className="font-bold text-gray-800 flex items-center gap-1.5 text-xs sm:text-sm">
                        <Edit3 className="w-4 h-4 text-emerald-600" />
                        Edit Profile Details
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditName(activeUser.name || "");
                          setEditAge(activeUser.age ? String(activeUser.age) : "");
                          setEditGender(activeUser.gender || "male");
                          setLocality(activeUser.address?.locality || "Gomti Nagar");
                          setStateName(activeUser.address?.state || "Uttar Pradesh");
                          setIsEditingProfile(false);
                        }}
                        className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. Rahul Verma"
                        required
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Age</label>
                        <input
                          type="number"
                          value={editAge}
                          onChange={(e) => setEditAge(e.target.value)}
                          placeholder="e.g. 28"
                          min={1}
                          max={120}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Gender</label>
                        <select
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value as any)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Locality</label>
                        <input
                          type="text"
                          value={locality}
                          onChange={(e) => setLocality(e.target.value)}
                          placeholder="e.g. Gomti Nagar"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">State</label>
                        <input
                          type="text"
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                          placeholder="e.g. Uttar Pradesh"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs transition-all shadow-xs"
                    >
                      Save Details
                    </button>
                  </form>
                )}

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
                    <span className="font-semibold text-emerald-700">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Medical Records Vault & Bookings */}
            <div className="space-y-3">
              {/* Medical Records Vault Card - Simple, matching the bookings card */}
              <Link
                href="/prescriptions"
                className="bg-white p-4 rounded-3xl border border-gray-150 hover:border-emerald-300 shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-gray-900">Medical Records Vault</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">Prescriptions, clinic slips &amp; reports</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
              </Link>

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
