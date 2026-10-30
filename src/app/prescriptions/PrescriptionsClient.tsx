"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PrescriptionRecord,
  subscribeToPrescriptions,
  INITIAL_DOCTORS,
  Doctor
} from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { PrescriptionUpload } from "../components/PrescriptionUpload";
import { BookingModal } from "../components/BookingModal";
import {
  FileText,
  Calendar,
  X,
  Eye,
  LogIn
} from "lucide-react";

interface PrescriptionsClientProps {
  initialPrescriptions: PrescriptionRecord[];
  serverUid?: string;
}

export function PrescriptionsClient({ initialPrescriptions, serverUid }: PrescriptionsClientProps) {
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const isUserAuthenticated = Boolean(serverUid || isAuthenticated || user?.uid);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>(initialPrescriptions);
  const [previewPrescription, setPreviewPrescription] = useState<PrescriptionRecord | null>(null);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);

  const effectiveUid = user?.uid || serverUid;

  useEffect(() => {
    if (!effectiveUid) {
      setPrescriptions([]);
      return;
    }
    const unsub = subscribeToPrescriptions(effectiveUid, (data) => {
      setPrescriptions(data);
    });
    return () => unsub();
  }, [effectiveUid]);

  const handleBookFollowup = (docName: string) => {
    const matched = INITIAL_DOCTORS.find(
      (d) => d.name.toLowerCase() === docName.toLowerCase()
    ) || INITIAL_DOCTORS[0];
    setBookingDoctor(matched);
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">

      {!isUserAuthenticated ? (
        /* Unauthenticated Centered Hero Card */
        <div className="bg-white rounded-3xl border border-gray-150 p-5 sm:p-8 text-center max-w-md mx-auto shadow-sm space-y-4 sm:space-y-5 my-2 sm:my-4 animate-in fade-in zoom-in-95">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
            <FileText className="w-7 h-7 stroke-[2.2]" />
          </div>

          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Medical Vault
            </span>
            <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-1.5 leading-snug">
              Sign In to View Your Prescriptions
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Your paper prescriptions, diagnostic lab reports, and clinic slips are securely stored in your personal vault.
            </p>
          </div>

          {/* Quick Value Props: 2 in row, 3rd centered, with centered content */}
          <div className="space-y-2 sm:space-y-2.5 py-2">
            {/* Top Row: 2 Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              <div className="p-2.5 sm:p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
                <span className="text-lg block mb-1">📸</span>
                <p className="text-xs font-bold text-gray-900 leading-tight">1-Tap Upload</p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-tight">Snap & save slips</p>
              </div>

              <div className="p-2.5 sm:p-3 bg-teal-50/70 rounded-2xl border border-teal-100 flex flex-col items-center text-center">
                <span className="text-lg block mb-1">🔒</span>
                <p className="text-xs font-bold text-gray-900 leading-tight">Encrypted Vault</p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-tight">Private to you</p>
              </div>
            </div>

            {/* Bottom Row: 3rd Card Centered with identical width */}
            <div className="flex justify-center">
              <div className="w-[calc(50%-4px)] sm:w-[calc(50%-5px)] p-2.5 sm:p-3 bg-amber-50/70 rounded-2xl border border-amber-100 flex flex-col items-center text-center">
                <span className="text-lg block mb-1">🩺</span>
                <p className="text-xs font-bold text-gray-900 leading-tight">Doctor Access</p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-tight">At next visit</p>
              </div>
            </div>
          </div>

          <div className="pt-1 space-y-2">
            <Link
              href="/login?redirect=/prescriptions"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold rounded-2xl shadow-md shadow-emerald-600/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <LogIn className="w-4 h-4 stroke-[2.3]" />
              <span>Login with Mobile Number</span>
            </Link>

            <button
              type="button"
              onClick={openLoginModal}
              className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-2xl text-xs transition-colors"
            >
              Open Quick Login Modal
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Clean Page Header */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-150 shadow-xs flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-black text-gray-900">My Prescriptions</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Saved clinic slips &amp; doctor prescriptions
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Health ID</span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 whitespace-nowrap inline-block">
                {user?.healthId || "#PRN-8821-LKO"}
              </span>
            </div>
          </div>

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Streamlined Upload Card */}
            <div className="lg:col-span-5 lg:sticky lg:top-20">
              <PrescriptionUpload
                patientUid={user?.uid || "patient-demo-001"}
                onUploadSuccess={(newRecord) => {
                  setPrescriptions((prev) => [newRecord, ...prev]);
                }}
              />
            </div>

            {/* Right Column: Prescriptions List */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Saved Prescriptions ({prescriptions.length})
                </h2>
              </div>

              {prescriptions.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="max-w-xs mx-auto">
                    <h3 className="font-bold text-gray-900 text-sm">No Prescriptions Uploaded Yet</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Take a photo of your paper slip or clinic bill above to keep your health records handy for your next follow-up.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-3xl border border-gray-150 p-4 shadow-xs space-y-3 hover:border-emerald-300 transition-all"
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Thumbnail Preview */}
                        <button
                          type="button"
                          onClick={() => setPreviewPrescription(p)}
                          className="cursor-pointer group relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-2xs text-left"
                          aria-label="View full prescription"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.imageUrl}
                            alt="Prescription thumbnail"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </button>

                        {/* Prescription Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              {p.visitDate}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              #{p.id.replace("presc-", "")}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm truncate pt-0.5">
                            {p.doctorName}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">{p.clinicName}</p>
                          {p.chiefComplaint && (
                            <p className="text-xs text-gray-500 italic line-clamp-1 pt-0.5">
                              &quot;{p.chiefComplaint}&quot;
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setPreviewPrescription(p)}
                          className="text-xs text-gray-600 hover:text-emerald-700 font-semibold flex items-center gap-1.5 transition-colors py-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Slip</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBookFollowup(p.doctorName)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Book Follow-up</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Direct Booking Modal from Prescription */}
          {bookingDoctor && (
            <BookingModal
              doctor={bookingDoctor}
              isOpen={!!bookingDoctor}
              onClose={() => setBookingDoctor(null)}
              onSuccess={() => setBookingDoctor(null)}
            />
          )}

          {/* Fullscreen Prescription Zoom Modal */}
          {previewPrescription && (
            <div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
              onClick={() => setPreviewPrescription(null)}
            >
              <div
                className="relative max-w-xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Prescription Slip • {previewPrescription.doctorName}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {previewPrescription.clinicName} • {previewPrescription.visitDate}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewPrescription(null)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center transition-colors"
                    aria-label="Close preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 overflow-y-auto flex items-center justify-center bg-gray-900/5 min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewPrescription.imageUrl}
                    alt="Prescription Document Full View"
                    className="max-w-full max-h-[65vh] object-contain rounded-2xl shadow-md"
                  />
                </div>

                <div className="p-3.5 border-t border-gray-150 bg-white flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Tap outside to close
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const docName = previewPrescription.doctorName;
                      setPreviewPrescription(null);
                      handleBookFollowup(docName);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Follow-up with Doctor</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
