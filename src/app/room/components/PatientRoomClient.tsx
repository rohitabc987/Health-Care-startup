"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Appointment, subscribeToAppointments, updateAppointmentQueueStatus } from "@/lib/firebase";
import { TeleConsultationRoom } from "@/app/components/TeleConsultationRoom";
import { getCleanVideoRoomUrl } from "@/lib/appointmentsService";
import {
  Video,
  PhoneCall,
  Clock,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  UserCheck
} from "lucide-react";

interface PatientRoomClientProps {
  appointment: Appointment;
  currentUserRole?: "patient" | "doctor" | "super_admin";
  currentUserName?: string;
}

export function PatientRoomClient({
  appointment: initialAppointment,
  currentUserRole = "patient",
  currentUserName,
}: PatientRoomClientProps) {
  const [appointment, setAppointment] = useState<Appointment>(initialAppointment);
  const [hasJoinedVideo, setHasJoinedVideo] = useState(
    appointment.queueStatus === "in_consultation" || appointment.queueStatus === "ready_for_doctor"
  );

  const isStaff = currentUserRole === "doctor" || currentUserRole === "super_admin";

  useEffect(() => {
    // Listen for live status changes on this patient's booking
    const unsub = subscribeToAppointments(appointment.patientUid, (list) => {
      const match = list.find((a) => a.id === appointment.id);
      if (match) {
        setAppointment(match);
        if (match.queueStatus === "in_consultation" || match.queueStatus === "ready_for_doctor") {
          setHasJoinedVideo(true);
        }
      }
    });
    return () => unsub();
  }, [appointment.id, appointment.patientUid]);

  const meetingUrl = getCleanVideoRoomUrl(
    appointment.meetingRoomUrl,
    appointment.id
  );

  const coordinatorWhatsAppNumber = "919876543210";
  const coordinatorHelpText = encodeURIComponent(
    `Namaste LiveSehat Team, I am ${appointment.patientName} (Booking #${appointment.id.replace("apt-", "")}). I need help connecting to Dr. ${appointment.doctorName}.`
  );

  const doctorDisplayName = appointment.doctorName && appointment.doctorName !== "undefined"
    ? (appointment.doctorName.startsWith("Dr.") ? appointment.doctorName : `Dr. ${appointment.doctorName}`)
    : "Dr. Consulting Doctor";

  // Automatic clean user name (no typing or prompt needed)
  const autoParticipantName = isStaff
    ? (currentUserName || appointment.doctorName || "Doctor")
    : (appointment.patientName || currentUserName || "Patient");
  const counterpartName = isStaff ? (appointment.patientName || "Patient") : doctorDisplayName;
  const backHref = currentUserRole === "doctor" ? "/doctor/consultation" : (currentUserRole === "super_admin" ? "/admin/queue" : "/bookings");

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col text-white overflow-hidden">
      {/* Top Header Bar - Clean WhatsApp Call Style */}
      <header className="p-3 sm:p-4 bg-slate-900/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-600 border border-emerald-400/30 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
            {counterpartName.replace("Dr. ", "").charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {isStaff ? `Consulting: ${appointment.patientName || "Patient"}` : doctorDisplayName}
              </h1>
            </div>
            <p className="text-[11px] text-gray-400 truncate max-w-[200px] sm:max-w-xs">
              {appointment.clinicName || "Pronto Health Partner Clinic"}
            </p>
          </div>
        </div>

        {/* Support & Quick Exit */}
        <div className="flex items-center gap-2">
          {!isStaff && (
            <a
              href={`https://wa.me/${coordinatorWhatsAppNumber}?text=${coordinatorHelpText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Chat with clinic support on WhatsApp"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">WhatsApp Help</span>
            </a>
          )}

          <Link
            href={backHref}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
            title="Return"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Dynamic View: Video Screen vs WhatsApp-Style Pre-Call Lobby */}
      <div className="flex-1 w-full relative flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden min-h-0">
        {hasJoinedVideo ? (
          /* Live Connected Screen */
          <div className="w-full h-full max-w-5xl mx-auto flex flex-col relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl min-h-0">
            <TeleConsultationRoom
              roomUrl={meetingUrl}
              userName={autoParticipantName}
              counterpartName={counterpartName}
              isDoctor={isStaff}
              onEndCall={() => setHasJoinedVideo(false)}
            />
          </div>
        ) : (
          /* Pre-Call Lobby - Simple & Familiar like WhatsApp Incoming Video Call */
          <div className="w-full max-w-sm mx-auto bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in fade-in duration-200">
            {/* Pulsing Avatar */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-emerald-400/50 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                {counterpartName.replace("Dr. ", "").charAt(0)}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full inline-block">
                {isStaff ? "Doctor Access Granted" : "Ready for Consultation"}
              </span>
              <h2 className="text-xl font-black text-white">
                {counterpartName}
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                {isStaff
                  ? "Enter the room as consultation moderator."
                  : "Tap below to start your video consultation. No login or app download required."}
              </p>
            </div>

            {/* In-App Browser Guidance */}
            {!isStaff && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left flex items-start gap-2.5 text-xs text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-tight">
                  Opening from WhatsApp? If camera is blocked, tap <strong>⋮ (three dots)</strong> at top right and select <strong>&quot;Open in Chrome / Safari&quot;</strong>.
                </p>
              </div>
            )}

            {/* Main Action Button */}
            <button
              type="button"
              onClick={async () => {
                setHasJoinedVideo(true);
                try {
                  if (appointment.queueStatus === "waiting_precheck" && !isStaff) {
                    await updateAppointmentQueueStatus(appointment.id, "ready_for_doctor", {
                      preCheckNotes: "Patient online in room ✅",
                    });
                  }
                } catch (err) {
                  console.warn("Could not auto-advance queue status:", err);
                }
              }}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black rounded-2xl shadow-lg shadow-emerald-600/40 text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <Video className="w-5 h-5 stroke-[2.5]" />
              <span>{isStaff ? "Enter Room as Doctor / Admin" : "Join Video Call Now"}</span>
            </button>

            {/* Direct External Browser Fallback */}
            <a
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-emerald-400 font-semibold flex items-center justify-center gap-1.5 transition-colors pt-1"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
              <span>Open in Fullscreen / External Browser</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientRoomClient;
