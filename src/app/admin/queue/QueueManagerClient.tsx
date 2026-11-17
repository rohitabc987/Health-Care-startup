"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Appointment,
  AppointmentQueueStatus,
  subscribeToDoctorQueue,
  updateAppointmentQueueStatus,
  subscribeToDoctors,
  Doctor
} from "@/lib/firebase";
import {
  PhoneCall,
  Video,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Zap,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";

interface QueueManagerClientProps {
  initialAppointments: Appointment[];
}

export function QueueManagerClient({ initialAppointments }: QueueManagerClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Subscribe to real doctors from Firestore
  useEffect(() => {
    const unsub = subscribeToDoctors((docs) => setDoctors(docs));
    return () => unsub();
  }, []);

  // Realtime subscription to the queue
  useEffect(() => {
    const docId = selectedDoctorId === "all" ? undefined : selectedDoctorId;
    const unsub = subscribeToDoctorQueue(docId, (list) => {
      setAppointments(list);
    });
    return () => unsub();
  }, [selectedDoctorId]);

  const filteredAppointments = appointments.filter((a) => {
    if (selectedDoctorId === "all") return true;
    return a.doctorId === selectedDoctorId;
  });

  // Group appointments into the 3 Runway columns
  const needsPrecheck = filteredAppointments.filter(
    (a) => !a.queueStatus || a.queueStatus === "waiting_precheck"
  );

  const readyRunway = filteredAppointments.filter(
    (a) => a.queueStatus === "ready_for_doctor"
  );

  const activeOrDone = filteredAppointments.filter(
    (a) =>
      a.queueStatus === "in_consultation" ||
      a.queueStatus === "completed" ||
      a.queueStatus === "escalated" ||
      a.queueStatus === "parked_tech_issue"
  );

  const handleUpdateStatus = async (
    id: string,
    status: AppointmentQueueStatus,
    notes?: string
  ) => {
    setIsUpdating(id);
    try {
      await updateAppointmentQueueStatus(id, status, { preCheckNotes: notes });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleSendWhatsApp = (apt: Appointment) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://livesehat.in";
    const roomUrl = `${origin}/room/${apt.id}`;
    const text = encodeURIComponent(
      `Namaste ${apt.patientName || "Patient"} ji,\n\nDr. ${apt.doctorName} will consult with you in 15 minutes for your follow-up.\n\n📹 Tap this link on your phone to enter the consultation room:\n👉 ${roomUrl}\n\n(No app download or login required). Please ensure your camera and microphone are allowed.`
    );
    const cleanPhone = apt.patientPhone?.replace(/[^0-9]/g, "") || "919876543210";
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto py-1 sm:py-2 animate-in fade-in duration-200">
      {/* Top Header & Filter Bar */}
      <div className="bg-white rounded-3xl border border-gray-150 p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            Live Follow-Up Queue Manager
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Pre-verify audio &amp; network before connecting patients to doctor consultation.
          </p>
        </div>

        {/* Doctor Filter & Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 text-gray-800 focus:outline-emerald-500 max-w-[180px] sm:max-w-xs truncate cursor-pointer"
          >
            <option value="all">All Doctors ({appointments.length})</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <Link
            href="/doctor/consultation"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Open Consultation</span>
          </Link>
        </div>
      </div>

      {/* Runway Counters Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white rounded-2xl border border-gray-150 p-3 sm:p-3.5 text-center shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            Needs Pre-Check
          </span>
          <span className="text-xl font-black text-amber-600 mt-0.5 block">
            {needsPrecheck.length}
          </span>
        </div>

        <div className="bg-emerald-50/80 rounded-2xl border border-emerald-100 p-3 sm:p-3.5 text-center shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
            Ready for Doctor
          </span>
          <span className="text-xl font-black text-emerald-700 mt-0.5 block">
            {readyRunway.length}
          </span>
        </div>

        <div className="bg-indigo-50/80 rounded-2xl border border-indigo-100 p-3 sm:p-3.5 text-center shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">
            Live in Call
          </span>
          <span className="text-xl font-black text-indigo-700 mt-0.5 block">
            {activeOrDone.filter((a) => a.queueStatus === "in_consultation").length}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-150 p-3 sm:p-3.5 text-center shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            Completed Today
          </span>
          <span className="text-xl font-black text-gray-900 mt-0.5 block">
            {activeOrDone.filter((a) => a.queueStatus === "completed").length}
          </span>
        </div>
      </div>

      {/* 3-Column Runway Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
        {/* Column 1: Needs Pre-Check */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 pb-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>1. Needs Pre-Check ({needsPrecheck.length})</span>
            </h2>
            <span className="text-[10px] text-gray-400 font-medium">Verify 4G &amp; Audio</span>
          </div>

          <div className="space-y-2.5">
            {needsPrecheck.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                <p className="text-xs text-gray-400">All scheduled patients pre-checked! 🎉</p>
              </div>
            ) : (
              needsPrecheck.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2.5 hover:border-emerald-300 transition-all text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{apt.patientName}</h3>
                      <p className="text-[11px] text-gray-500">{apt.patientPhone}</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold">
                      {apt.patientHealthId || "#IND-XXXXXX"}
                    </span>
                  </div>

                  <p className="text-gray-600 text-[11px] italic bg-gray-50 p-2.5 rounded-xl border border-gray-100 line-clamp-2">
                    &quot;{apt.notes || "Routine follow-up review"}&quot;
                  </p>

                  {/* Actions for Coordinator */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(apt)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl flex items-center justify-center gap-1 transition-colors text-[11px] cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Link</span>
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating === apt.id}
                      onClick={() => handleUpdateStatus(apt.id, "ready_for_doctor", "Audio & 4G Verified ✅")}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-1 transition-all text-[11px] shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Ready ➡️</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(apt.id, "parked_tech_issue", "No answer / poor network")}
                    className="w-full text-center text-[10px] text-gray-400 hover:text-rose-600 font-semibold transition-colors py-0.5 cursor-pointer"
                  >
                    Pause: Network Issue / No Answer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Ready Runway (Waiting for Doctor) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 pb-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>2. Ready Runway ({readyRunway.length})</span>
            </h2>
            <span className="text-[10px] text-emerald-700 font-bold">Ready for Consultation</span>
          </div>

          <div className="space-y-2.5">
            {readyRunway.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-dashed border-emerald-200 text-center space-y-1">
                <p className="text-xs text-gray-400">No patients waiting in ready runway.</p>
                <p className="text-[10px] text-emerald-700 font-medium">Verify a patient from Column 1 to feed the queue.</p>
              </div>
            ) : (
              readyRunway.map((apt, idx) => (
                <div
                  key={apt.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white border border-emerald-300 space-y-2.5 shadow-xs text-xs relative hover:border-emerald-500 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-gray-900 text-sm">{apt.patientName}</h3>
                      </div>
                      <p className="text-[11px] text-gray-500 pl-5">{apt.doctorName}</p>
                    </div>

                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      Verified ✅
                    </span>
                  </div>

                  {apt.preCheckNotes && (
                    <p className="text-[10px] text-emerald-700 font-medium bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
                      {apt.preCheckNotes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <Link
                      href={`/room/${apt.id}`}
                      target="_blank"
                      className="text-gray-500 hover:text-emerald-700 font-semibold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Test Room Link</span>
                    </Link>

                    <button
                      type="button"
                      disabled={isUpdating === apt.id}
                      onClick={() => handleUpdateStatus(apt.id, "in_consultation")}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-xs transition-all text-xs cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Start Consult</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Active & Completed */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 pb-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
              <span>3. In Consult &amp; History ({activeOrDone.length})</span>
            </h2>
            <span className="text-[10px] text-gray-400 font-medium">Session Status</span>
          </div>

          <div className="space-y-2.5">
            {activeOrDone.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                <p className="text-xs text-gray-400">No completed consultations yet today.</p>
              </div>
            ) : (
              activeOrDone.map((apt) => (
                <div
                  key={apt.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-xs space-y-2 shadow-xs bg-white ${
                    apt.queueStatus === "in_consultation"
                      ? "border-indigo-300 ring-2 ring-indigo-100"
                      : apt.queueStatus === "parked_tech_issue"
                        ? "border-rose-300"
                        : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{apt.patientName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        apt.queueStatus === "in_consultation"
                          ? "bg-indigo-600 text-white animate-pulse"
                          : apt.queueStatus === "parked_tech_issue"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {apt.queueStatus === "in_consultation"
                        ? "Live with Doctor 🩺"
                        : apt.queueStatus === "parked_tech_issue"
                          ? "Paused: Network Issue"
                          : "Completed ✅"}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500">Dr. {apt.doctorName} • {apt.clinicName}</p>

                  {apt.queueStatus === "parked_tech_issue" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(apt.id, "waiting_precheck")}
                      className="w-full text-center text-xs bg-rose-50 text-rose-700 font-bold py-1.5 rounded-xl border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer mt-1"
                    >
                      Retry Pre-Check
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

