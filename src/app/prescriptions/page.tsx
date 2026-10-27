"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  PrescriptionRecord, 
  subscribeToPrescriptions, 
  INITIAL_USER 
} from "@/lib/firebase";
import { PrescriptionUpload } from "../components/PrescriptionUpload";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { 
  Stethoscope, 
  FileText, 
  ExternalLink, 
  ArrowRight, 
  X,
  Camera,
  ShieldCheck
} from "lucide-react";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [previewPrescriptionUrl, setPreviewPrescriptionUrl] = useState<string | null>(null);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToPrescriptions(INITIAL_USER.uid, (data) => {
      setPrescriptions(data);
    });
    return () => unsub();
  }, []);

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
          />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">Prescription Vault</h1>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Encrypted Vault
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Physical paper prescriptions snapshot by ground team or uploaded from phone.
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Patient Health ID</span>
          <span className="text-sm font-mono font-bold text-emerald-800">#PRN-8821-LKO</span>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload Component */}
        <div className="lg:col-span-5 space-y-4">
          <PrescriptionUpload
            patientUid={INITIAL_USER.uid}
            onUploadSuccess={(newRecord) => {
              setPrescriptions((prev) => [newRecord, ...prev]);
            }}
          />

          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-3xl text-xs space-y-1.5 text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Ground Team Onboarding Support</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800">
              Prescription slips are analyzed by our general physicians before your scheduled follow-up window. Your physical paper remains safely with you.
            </p>
          </div>
        </div>

        {/* Right Column: Timeline Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Prescription History ({prescriptions.length})
            </h2>
            <span className="text-xs text-gray-400">Chronological Feed</span>
          </div>

          <div className="space-y-3.5">
            {prescriptions.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-gray-200/80 p-4 sm:p-5 shadow-xs space-y-3.5 hover:border-emerald-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div
                    onClick={() => setPreviewPrescriptionUrl(p.imageUrl)}
                    className="cursor-pointer group relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-2xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl}
                      alt="Prescription"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                        Checkup: {p.visitDate}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">
                        #{p.id.replace("presc-", "")}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate pt-1">
                      {p.doctorName}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{p.clinicName}</p>
                    <p className="text-xs text-gray-500 italic line-clamp-2 pt-0.5">
                      &quot;{p.chiefComplaint || "Routine follow-up"}&quot;
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2.5 border-t border-gray-150 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPreviewPrescriptionUrl(p.imageUrl)}
                    className="text-xs text-gray-600 hover:text-emerald-700 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Full Paper Slip</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    href="/"
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1"
                  >
                    <span>Book Follow-up</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Prescription Zoom Modal */}
      {previewPrescriptionUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewPrescriptionUrl(null)}
        >
          <div 
            className="relative max-w-xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Physical Prescription Sheet
                </h3>
                <p className="text-[11px] text-gray-500">Verified doctor clinic prescription</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPrescriptionUrl(null)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex items-center justify-center bg-gray-900/5 min-h-[350px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPrescriptionUrl}
                alt="Prescription Document Full View"
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
