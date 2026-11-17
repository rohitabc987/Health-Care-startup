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
import { isAppointmentForDate } from "@/lib/appointmentsService";
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
  Filter,
  Calendar
} from "lucide-react";

interface QueueManagerClientProps {
  initialAppointments: Appointment[];
}

export function QueueManagerClient({ initialAppointments }: QueueManagerClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const todayIso = new Date().toISOString().split("T")[0];
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");
  const [dateFilterMode, setDateFilterMode] = useState<"today" | "all" | "custom">("today");
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
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

  // Ensure strict uniqueness by id across all mutations & snapshots
  const uniqueAppointments = React.useMemo(() => {
    const map = new Map<string, Appointment>();
    for (const apt of appointments) {
      if (apt && apt.id) {
        map.set(apt.id, apt);
      }
    }
    return Array.from(map.values());
  }, [appointments]);

  const filteredAppointments = uniqueAppointments.filter((a) => {
    if (selectedDoctorId !== "all" && a.doctorId !== selectedDoctorId) return false;
    if (!isAppointmentForDate(a, selectedDate)) return false;
    return true;
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

  const cleanDoctorTitle = (name?: string) => {
    if (!name) return "Consulting Doctor";
    return name.startsWith("Dr.") ? name : `Dr. ${name}`;
  };

  const handleSendWhatsApp = (apt: Appointment) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://livesehat.in";
    const roomUrl = `${origin}/room/${apt.id}`;
    const docTitle = cleanDoctorTitle(apt.doctorName);
    const text = encodeURIComponent(
      `Namaste ${apt.patientName || "Patient"} ji,\n\n${docTitle} will consult with you shortly for your follow-up review.\n\n📹 Tap this link on your phone to enter the consultation room:\n👉 ${roomUrl}\n\n(No app download or login required). Please ensure your camera and microphone are allowed.`
    );
    let cleanPhone = apt.patientPhone?.replace(/[^0-9]/g, "") || "";
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }
    if (!cleanPhone) cleanPhone = "919876543210";
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto py-2 sm:py-4 animate-in fade-in duration-200">
      {/* Top Header & Filter Bar */}
      <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Live Follow-Up Queue Manager
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Pre-verify audio &amp; network before connecting patients to doctor.
          </p>
        </div>

        {/* Date Filter & Doctor Filter & Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5 max-w-full">
          {/* Date Filter Dropdown (Defaults to Today) */}
          <select
            value={dateFilterMode}
            onChange={(e) => {
              const mode = e.target.value as "today" | "all" | "custom";
              setDateFilterMode(mode);
              if (mode === "today") setSelectedDate(todayIso);
              else if (mode === "all") setSelectedDate("all");
            }}
            className="text-xs sm:text-sm font-semibold bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 text-gray-800 focus:outline-emerald-500 cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="all">All Dates</option>
            <option value="custom">Pick Specific Date...</option>
          </select>

          {/* Date Picker Input (Only shown when "Pick Specific Date..." is selected) */}
          {dateFilterMode === "custom" && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500 animate-in fade-in duration-150">
              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                type="date"
                value={selectedDate === "all" ? todayIso : selectedDate}
                onChange={(e) => setSelectedDate(e.target.value || todayIso)}
                className="text-xs sm:text-sm font-semibold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
                title="Filter queue by consultation date"
              />
            </div>
          )}

          {/* Doctor Filter */}
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="text-xs sm:text-sm font-semibold bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 text-gray-800 focus:outline-emerald-500 max-w-[180px] sm:max-w-xs truncate cursor-pointer"
          >
            <option value="all">All Doctors ({doctors.length})</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <Link
            href="/doctor/consultation"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition-all flex items-center gap-2 shrink-0"
          >
            <Video className="w-4 h-4" />
            <span>Open Consultation</span>
          </Link>
        </div>
      </div>

      {/* Runway Counters Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 text-center shadow-2xs">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500 block">
            Needs Pre-Check
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 block">
            {needsPrecheck.length}
          </span>
        </div>

        <div className="bg-emerald-50/80 rounded-3xl border border-emerald-100 p-4 sm:p-5 text-center shadow-2xs">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800 block">
            Ready for Doctor
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 block">
            {readyRunway.length}
          </span>
        </div>

        <div className="bg-indigo-50/80 rounded-3xl border border-indigo-100 p-4 sm:p-5 text-center shadow-2xs">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-900 block">
            Live in Call
          </span>
          <span className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1 block">
            {activeOrDone.filter((a) => a.queueStatus === "in_consultation").length}
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 text-center shadow-2xs">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500 block">
            Completed Today
          </span>
          <span className="text-2xl sm:text-3xl font-black text-gray-900 mt-1 block">
            {activeOrDone.filter((a) => a.queueStatus === "completed").length}
          </span>
        </div>
      </div>

      {/* 3-Column Runway Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        {/* Column 1: Needs Pre-Check */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 pb-1">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>1. Needs Pre-Check ({needsPrecheck.length})</span>
            </h2>
            <span className="text-xs font-semibold text-gray-400">Verify 4G &amp; Audio</span>
          </div>

          <div className="space-y-3">
            {needsPrecheck.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
                <p className="text-sm font-semibold text-gray-400">All scheduled patients pre-checked! 🎉</p>
              </div>
            ) : (
              needsPrecheck.map((apt, idx) => (
                <div
                  key={apt.id || `precheck-${idx}`}
                  className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200 shadow-xs space-y-3 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                        {apt.patientName || "Patient"}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        {apt.patientPhone || "No Phone"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-bold">
                        {apt.patientHealthId || "#IND-XXXXXX"}
                      </span>
                      <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2.5 py-0.5 rounded-lg">
                        📅 {apt.followupDate || "Today"}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 text-xs sm:text-sm italic bg-gray-50 p-3 rounded-2xl border border-gray-100 line-clamp-2 leading-relaxed">
                    &quot;{apt.notes || "Routine follow-up review"}&quot;
                  </p>

                  {/* Actions for Coordinator */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(apt)}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs sm:text-sm cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Link</span>
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating === apt.id}
                      onClick={() => handleUpdateStatus(apt.id, "ready_for_doctor", "Audio & 4G Verified ✅")}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs sm:text-sm shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Ready ➡️</span>
                    </button>
                  </div>

                  {/* Pre-check & Direct Call shortcuts */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs sm:text-sm">
                    <a
                      href={`tel:${apt.patientPhone?.replace(/[^0-9]/g, "")}`}
                      className="text-gray-600 hover:text-emerald-700 font-semibold flex items-center gap-1.5"
                      title="Call patient phone for audio pre-check"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Call Patient</span>
                    </a>

                    <Link
                      href={`/room/${apt.id}`}
                      target="_blank"
                      className="text-gray-600 hover:text-emerald-700 font-semibold flex items-center gap-1.5"
                      title="Test room video & audio before marking ready"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pre-Check Room</span>
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(apt.id, "parked_tech_issue", "No answer / poor network")}
                    className="w-full text-center text-xs text-gray-400 hover:text-rose-600 font-semibold transition-colors py-1 cursor-pointer"
                  >
                    Pause: Network Issue / No Answer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Ready Runway (Waiting for Doctor) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 pb-1">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>2. Ready Runway ({readyRunway.length})</span>
            </h2>
            <span className="text-xs text-emerald-700 font-bold">Ready for Consultation</span>
          </div>

          <div className="space-y-3">
            {readyRunway.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-dashed border-emerald-200 text-center space-y-1">
                <p className="text-sm font-semibold text-gray-400">No patients waiting in ready runway.</p>
                <p className="text-xs text-emerald-700 font-medium">Verify a patient from Column 1 to feed the queue.</p>
              </div>
            ) : (
              readyRunway.map((apt, idx) => (
                <div
                  key={apt.id || `ready-${idx}`}
                  className="p-4 sm:p-5 rounded-3xl bg-white border border-emerald-300 space-y-3 shadow-xs relative hover:border-emerald-500 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                          {apt.patientName || "Patient"}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 pl-7 mt-0.5">
                        {apt.patientPhone ? `${apt.patientPhone} • ` : ""}{cleanDoctorTitle(apt.doctorName)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                        Verified ✅
                      </span>
                      <span className="text-xs font-mono text-gray-500">
                        {apt.patientHealthId || "#IND-XXXXXX"}
                      </span>
                    </div>
                  </div>

                  {apt.preCheckNotes && (
                    <p className="text-xs sm:text-sm text-emerald-700 font-semibold bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100">
                      {apt.preCheckNotes}
                    </p>
                  )}

                  {/* Actions for Doctor & Coordinator */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {/* Direct Room Link for Doctor */}
                    <a
                      href={`/room/${apt.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs sm:text-sm"
                      title="Open direct consultation room in new tab"
                    >
                      <ExternalLink className="w-4 h-4 text-emerald-700" />
                      <span>Doctor Direct Link</span>
                    </a>

                    {/* Start Consult & Bridge */}
                    <button
                      type="button"
                      disabled={isUpdating === apt.id}
                      onClick={async () => {
                        await handleUpdateStatus(apt.id, "in_consultation");
                        window.open(`/room/${apt.id}`, "_blank");
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all text-xs sm:text-sm cursor-pointer"
                      title="Mark live and open consultation room"
                    >
                      <Video className="w-4 h-4" />
                      <span>Start &amp; Join 🩺</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Active & Completed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 pb-1">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-gray-800 flex items-center gap-2">
              <span>3. In Consult &amp; History ({activeOrDone.length})</span>
            </h2>
            <span className="text-xs font-semibold text-gray-400">Session Status</span>
          </div>

          <div className="space-y-3">
            {activeOrDone.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
                <p className="text-sm font-semibold text-gray-400">No completed consultations yet today.</p>
              </div>
            ) : (
              activeOrDone.map((apt, idx) => (
                <div
                  key={apt.id || `done-${idx}`}
                  className={`p-4 sm:p-5 rounded-3xl border space-y-2.5 shadow-xs bg-white ${apt.queueStatus === "in_consultation"
                      ? "border-indigo-300 ring-2 ring-indigo-100"
                      : apt.queueStatus === "parked_tech_issue"
                        ? "border-rose-300"
                        : "border-gray-200"
                    }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-gray-900 text-base sm:text-lg">
                      {apt.patientName || "Patient"}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${apt.queueStatus === "in_consultation"
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

                  <p className="text-xs sm:text-sm text-gray-500">
                    {cleanDoctorTitle(apt.doctorName)} • {apt.clinicName || "Pronto Partner Clinic"}
                  </p>

                  {/* Direct Rejoin Link for Doctor when Consultation is Active */}
                  {apt.queueStatus === "in_consultation" && (
                    <div className="pt-1.5">
                      <a
                        href={`/room/${apt.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xs transition-all"
                      >
                        <Video className="w-4 h-4" />
                        <span>Rejoin Live Room (Doctor Link)</span>
                      </a>
                    </div>
                  )}

                  {apt.queueStatus === "parked_tech_issue" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(apt.id, "waiting_precheck")}
                      className="w-full text-center text-xs sm:text-sm bg-rose-50 text-rose-700 font-bold py-2 rounded-xl border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer mt-1"
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
