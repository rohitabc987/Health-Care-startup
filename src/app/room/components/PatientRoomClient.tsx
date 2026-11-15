"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Appointment, subscribeToAppointments } from "@/lib/firebase";
import { TeleConsultationRoom } from "@/app/components/TeleConsultationRoom";
import {
  Video,
  ShieldCheck,
  PhoneCall,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft
} from "lucide-react";

interface PatientRoomClientProps {
  appointment: Appointment;
}

export function PatientRoomClient({ appointment: initialAppointment }: PatientRoomClientProps) {
  const [appointment, setAppointment] = useState<Appointment>(initialAppointment);
  const [hasJoinedVideo, setHasJoinedVideo] = useState(
    appointment.queueStatus === "in_consultation" || appointment.queueStatus === "ready_for_doctor"
  );

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

  const meetingUrl =
    appointment.meetingRoomUrl || `https://meet.jit.si/livesehat-tele-${appointment.id}`;

  const coordinatorWhatsAppNumber = "919876543210";
  const coordinatorHelpText = encodeURIComponent(
    `Namaste LiveSehat Team, I am ${appointment.patientName} (Booking #${appointment.id.replace("apt-", "")}). I need help connecting to Dr. ${appointment.doctorName}.`
  );

  return (
    <div className="min-h-screen bg-gray-50/70 py-4 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
              <Video className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  LiveSehat Follow-Up Desk
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  #{appointment.id.replace("apt-", "")}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-gray-900 mt-0.5">
                {appointment.doctorName}
              </h1>
              <p className="text-xs text-gray-500">{appointment.clinicName || "Clinic Follow-Up"}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">
              Health ID
            </span>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              {appointment.patientHealthId || "#IND-XXXXXX"}
            </span>
          </div>
        </div>

        {/* Dynamic Status / Video Container */}
        {hasJoinedVideo ? (
          /* Live Video Room View */
          <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
            {/* Live Queue Notice Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-3 px-4 flex items-center justify-between text-xs font-medium shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>
                  {appointment.queueStatus === "in_consultation"
                    ? `Doctor is connected with you right now!`
                    : `You are in the doctor's ready queue. Please stay on this screen.`}
                </span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-mono font-bold">
                Token #{appointment.queueOrder || 1}
              </span>
            </div>

            {/* Embedded WebRTC Room */}
            <div className="h-[480px] sm:h-[580px] w-full">
              <TeleConsultationRoom
                roomUrl={meetingUrl}
                userName={appointment.patientName || "Patient"}
                counterpartName={appointment.doctorName}
                isDoctor={false}
                onEndCall={() => setHasJoinedVideo(false)}
              />
            </div>
          </div>
        ) : (
          /* Pre-Join Waiting Lobby */
          <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 text-center max-w-lg mx-auto shadow-sm space-y-5 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
              <Video className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">
                ₹149 Follow-up Pass Active
              </span>
              <h2 className="text-xl font-black text-gray-900">
                Namaste {appointment.patientName || "Patient"}!
              </h2>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Your follow-up review with <strong>{appointment.doctorName}</strong> is scheduled. Tap below to enter the consultation room.
              </p>
            </div>

            {/* Pre-call checklist cards */}
            <div className="grid grid-cols-2 gap-2.5 text-left py-1">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-900">No App Needed</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Runs in Chrome/Safari</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Private &amp; Safe</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">1-on-1 with Doctor</p>
                </div>
              </div>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={() => setHasJoinedVideo(true)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Video className="w-4 h-4 stroke-[2.5]" />
              <span>Enter Doctor Consultation Room</span>
            </button>
          </div>
        )}

        {/* Bottom Help & Fallback Row */}
        <div className="bg-white rounded-2xl border border-gray-150 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Having camera or audio issues? Our care team is on standby.</span>
          </div>

          <a
            href={`https://wa.me/${coordinatorWhatsAppNumber}?text=${coordinatorHelpText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
            <span>WhatsApp Care Coordinator</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default PatientRoomClient;

