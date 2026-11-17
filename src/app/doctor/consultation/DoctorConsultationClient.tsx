"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Appointment,
  subscribeToDoctorQueue,
  updateAppointmentQueueStatus,
  subscribeToDoctors,
  Doctor
} from "@/lib/firebase";
import { UserRole } from "@/lib/types";
import { TeleConsultationRoom } from "@/app/components/TeleConsultationRoom";
import { getCleanVideoRoomUrl, isAppointmentForDate } from "@/lib/appointmentsService";
import {
  Video,
  CheckCircle2,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
  User,
  FileText,
  Eye,
  X,
  AlertTriangle,
  RotateCcw,
  Check,
  ExternalLink,
  Calendar
} from "lucide-react";

interface DoctorConsultationClientProps {
  initialDoctors: Doctor[];
  initialAppointments: Appointment[];
  userRole: UserRole;
  userDoctorId?: string;
}

export function DoctorConsultationClient({
  initialDoctors,
  initialAppointments,
  userRole,
  userDoctorId,
}: DoctorConsultationClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);

  // Authoritative default: lock to doctor's assigned doctorId if doctor role; otherwise default to first doctor
  const initialDoctorId =
    userDoctorId && initialDoctors.some((d) => d.id === userDoctorId)
      ? userDoctorId
      : initialDoctors[0]?.id || "";

  const todayIso = new Date().toISOString().split("T")[0];
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId);
  const [dateFilterMode, setDateFilterMode] = useState<"today" | "all" | "custom">("today");
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [selectedOutcome, setSelectedOutcome] = useState<"continued_meds" | "dose_adjusted" | "escalated_to_clinic">("continued_meds");
  const [doctorNotes, setDoctorNotes] = useState<string>("Review complete. Patient is recovering well, continue current medication.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPrescriptionUrl, setPreviewPrescriptionUrl] = useState<string | null>(null);
  const [prescriptionLoadFailed, setPrescriptionLoadFailed] = useState(false);

  // Subscribe to real doctors from Firestore in background
  useEffect(() => {
    const unsub = subscribeToDoctors((docs) => {
      if (docs && docs.length > 0) {
        setDoctors(docs);
        if (!selectedDoctorId) {
          const defaultId =
            userDoctorId && docs.some((d) => d.id === userDoctorId)
              ? userDoctorId
              : docs[0].id;
          setSelectedDoctorId(defaultId);
        }
      }
    });
    return () => unsub();
  }, [selectedDoctorId, userDoctorId]);

  // Subscribe to live queue updates for this doctor
  useEffect(() => {
    if (!selectedDoctorId) return;
    const unsub = subscribeToDoctorQueue(selectedDoctorId, (list) => {
      setAppointments(list);
    });
    return () => unsub();
  }, [selectedDoctorId]);

  const activeDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

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

  // Filter appointments for the selected date
  const dateFilteredAppointments = uniqueAppointments.filter((a) => {
    return isAppointmentForDate(a, selectedDate);
  });

  // Separate currently active patient from the ready queue
  const currentConsulting = dateFilteredAppointments.find((a) => a.queueStatus === "in_consultation");
  const readyQueue = dateFilteredAppointments.filter((a) => a.queueStatus === "ready_for_doctor");
  const nextPatient = readyQueue[0];

  // Start consultation with the first ready patient
  const handleStartConsultation = async (patient: Appointment) => {
    setIsSubmitting(true);
    try {
      await updateAppointmentQueueStatus(patient.id, "in_consultation");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete current patient and pull next ready patient immediately
  const handleCompleteAndNext = async () => {
    if (!currentConsulting) return;
    setIsSubmitting(true);
    try {
      const nextStatus = selectedOutcome === "escalated_to_clinic" ? "escalated" : "completed";
      await updateAppointmentQueueStatus(currentConsulting.id, nextStatus, {
        consultationOutcome: selectedOutcome,
        consultationNotes: doctorNotes,
      });

      // Auto-bridge next ready patient if one exists
      if (nextPatient) {
        await updateAppointmentQueueStatus(nextPatient.id, "in_consultation");
      }

      // Reset default notes
      setSelectedOutcome("continued_meds");
      setDoctorNotes("Review complete. Patient is recovering well, continue current medication.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset prescription error when patient changes
  useEffect(() => {
    setPrescriptionLoadFailed(false);
  }, [currentConsulting?.id]);

  const prescriptionSlip = currentConsulting?.prescriptionSlipUrl || null;

  if (doctors.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <Video className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">No Doctors Registered in Catalog</h2>
          <p className="text-xs text-gray-500 mt-1">
            Doctors must be onboarded in the Admin Operations Desk to start live video consultations.
          </p>
        </div>
        {userRole === "super_admin" && (
          <Link
            href="/admin/doctor"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
          >
            Open Doctor Directory
          </Link>
        )}
      </div>
    );
  }

  const doctorInitial = activeDoctor?.name?.replace("Dr. ", "").charAt(0) || "D";

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4">
      {/* Top Session Bar */}
      <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {doctorInitial}
          </div>
          <div>
            {/* <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Doctor Consultation Desk
              </span>
              <span className="text-xs text-gray-400 font-medium">High Throughput Mode</span>
            </div> */}
            <h1 className="text-base sm:text-lg font-black text-gray-900 mt-0.5">
              {activeDoctor?.name} • {activeDoctor?.specialty}
            </h1>
          </div>
        </div>

        {/* Date Filter & Doctor Switcher (Super Admin & Doctor) */}
        <div className="flex flex-wrap items-center gap-2.5">
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
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500 animate-in fade-in duration-150">
              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                type="date"
                value={selectedDate === "all" ? todayIso : selectedDate}
                onChange={(e) => setSelectedDate(e.target.value || todayIso)}
                className="text-xs sm:text-sm font-semibold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
                title="Filter consultations by date"
              />
            </div>
          )}

          {userRole === "super_admin" && doctors.length > 1 && (
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 text-gray-800 focus:outline-emerald-500 cursor-pointer"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {userRole === "super_admin" && (
            <Link
              href="/admin/queue"
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-2xl transition-colors"
            >
              Open Queue Manager
            </Link>
          )}
        </div>
      </div>

      {/* Main Consultation Workplace */}
      {currentConsulting ? (
        <div className="space-y-4">
          {/* Split Screen Layout: Left Video (55%) | Right Medical Record (45%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: Embedded WebRTC Video Stream & Direct Link */}
            <div className="lg:col-span-7 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Video Consultation</span>
                </span>

                <a
                  href={`/room/${currentConsulting.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Open direct video room in full browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Direct Room Link (New Tab)</span>
                </a>
              </div>

              <div className="h-[420px] sm:h-[500px]">
                <TeleConsultationRoom
                  roomUrl={getCleanVideoRoomUrl(currentConsulting.meetingRoomUrl, currentConsulting.id)}
                  userName={activeDoctor.name || "Dr. Consulting Doctor"}
                  counterpartName={currentConsulting.patientName || "Patient"}
                  isDoctor={true}
                />
              </div>
            </div>

            {/* Right Column: Patient Clinical Record & Cloudinary Slip */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 shadow-xs space-y-3.5 max-h-[500px] overflow-y-auto">
              {/* Patient Header */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-base font-bold text-gray-900">
                      {currentConsulting.patientName}
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {currentConsulting.patientPhone} • {currentConsulting.patientAddress || "Lucknow"}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Health ID</span>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {currentConsulting.patientHealthId || "#IND-XXXXXX"}
                  </span>
                </div>
              </div>

              {/* Chief Complaint / Notes */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Chief Complaint / Follow-Up Reason:
                </span>
                <p className="text-xs text-gray-800 bg-gray-50 p-2.5 rounded-2xl border border-gray-100 leading-relaxed font-medium">
                  {currentConsulting.notes || "Post-OPD follow-up review after 5 days of medication."}
                </p>
              </div>

              {/* Pre-Check Verification Tag */}
              {currentConsulting.preCheckNotes && (
                <div className="bg-emerald-50/80 p-2.5 rounded-2xl border border-emerald-100 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{currentConsulting.preCheckNotes}</span>
                </div>
              )}

              {/* Previous Prescription Slip Viewer */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Previous Paper Prescription:
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewPrescriptionUrl(prescriptionSlip || "record_preview")}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Zoom Full Slip</span>
                  </button>
                </div>

                <div
                  onClick={() => setPreviewPrescriptionUrl(prescriptionSlip || "record_preview")}
                  className="relative h-32 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 cursor-pointer group shadow-2xs"
                >
                  {prescriptionSlip && !prescriptionLoadFailed ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prescriptionSlip}
                        alt="Prescription slip"
                        onError={() => setPrescriptionLoadFailed(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                        Click to Zoom
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-emerald-50/50 hover:bg-emerald-50/80 transition-colors flex flex-col items-center justify-center p-3 text-center">
                      <div className="w-8 h-8 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-xs mb-1 border border-emerald-200">
                        <FileText className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="text-xs font-bold text-gray-800">
                        Paper Prescription On Record
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {currentConsulting.patientHealthId || "#IND-ONLINE"} • Verified Follow-Up
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold mt-1 bg-white/90 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                        Click to Expand Slip Details
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Clinical Action Bar */}
          <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  Select Consultation Outcome:
                </span>
                <p className="text-[11px] text-gray-400">
                  Select outcome before auto-advancing to the next ready patient.
                </p>
              </div>

              {/* 3 Outcome Radio Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOutcome("continued_meds");
                    setDoctorNotes("Patient is asymptomatic and recovering well. Continue prescribed medicines.");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${selectedOutcome === "continued_meds"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Continue Same Meds</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedOutcome("dose_adjusted");
                    setDoctorNotes("Reduced dosage as symptoms subsided. Monitor for 3 more days.");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${selectedOutcome === "dose_adjusted"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Dose Adjusted</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedOutcome("escalated_to_clinic");
                    setDoctorNotes("Persistent high fever & wheezing. Fast-track physical examination required.");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${selectedOutcome === "escalated_to_clinic"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Escalate to Physical Visit</span>
                </button>
              </div>
            </div>

            {/* Quick Notes Input */}
            <input
              type="text"
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Doctor's clinical note (optional)"
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 text-gray-800 focus:outline-emerald-500"
            />

            {/* The Big Action Button: Complete & Next */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-gray-500 font-medium">
                {readyQueue.length > 0
                  ? `🟢 Next in runway: ${nextPatient?.patientName || "Patient"} (${readyQueue.length} patient${readyQueue.length > 1 ? "s" : ""} waiting)`
                  : "Runway empty: no more pre-verified patients waiting today."}
              </span>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCompleteAndNext}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Complete &amp; Call Next Ready Patient</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Ready Queue Preview while in call */}
            {readyQueue.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Upcoming in Runway Today ({readyQueue.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {readyQueue.map((apt, idx) => (
                    <div
                      key={apt.id || `preview-${idx}`}
                      className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="font-bold text-gray-900 truncate">{apt.patientName || "Patient"}</p>
                          <p className="text-[10px] text-gray-500 truncate">{apt.patientPhone || apt.patientHealthId}</p>
                        </div>
                      </div>

                      <a
                        href={`/room/${apt.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-emerald-700 hover:underline shrink-0 flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Room</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Idle Consultation Workplace when no consultation is active */
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                  <Video className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    Live Consultation Queue Desk
                  </h2>
                  <p className="text-xs text-gray-500">
                    Patients marked ready by coordinators for {selectedDate === "all" ? "all dates" : selectedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{readyQueue.length} Patient{readyQueue.length !== 1 ? "s" : ""} Waiting</span>
                </span>
              </div>
            </div>

            {readyQueue.length === 0 ? (
              <div className="p-8 text-center space-y-2 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm font-bold text-gray-700">No patients waiting in ready runway</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Care coordinators verify patient 4G and audio before placing them here.
                  {userRole === "super_admin" && (
                    <>
                      {" "}Check the{" "}
                      <Link href="/admin/queue" className="text-emerald-700 font-bold underline">
                        Queue Manager
                      </Link>{" "}
                      to pre-verify patients.
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Ready Patients in Runway ({readyQueue.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {readyQueue.map((apt, idx) => (
                    <div
                      key={apt.id || `runway-${idx}`}
                      className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-3 hover:border-emerald-400 transition-all text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{apt.patientName || "Patient"}</h4>
                            <p className="text-[11px] text-gray-500">{apt.patientPhone || "No Phone"}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            Verified ✅
                          </span>
                          <span className="text-[9px] font-mono text-gray-400">
                            {apt.patientHealthId || "#IND-XXXXXX"}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-600 text-[11px] bg-gray-50 p-2.5 rounded-xl border border-gray-100 italic">
                        &quot;{apt.notes || "Routine follow-up review"}&quot;
                      </p>

                      {apt.preCheckNotes && (
                        <p className="text-[10px] text-emerald-700 font-semibold bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-100">
                          {apt.preCheckNotes}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleStartConsultation(apt)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer text-xs"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Start Video Call</span>
                        </button>

                        <a
                          href={`/room/${apt.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs"
                          title="Open direct video room in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                          <span>Room (New Tab)</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* High-Res Prescription Slip Zoom Modal */}
      {previewPrescriptionUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-gray-900">
                  Patient Prescription Slip & Medical Record
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPrescriptionUrl(null)}
                className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {previewPrescriptionUrl !== "record_preview" && !prescriptionLoadFailed ? (
              <div className="max-h-[75vh] overflow-auto rounded-2xl bg-gray-950 flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewPrescriptionUrl}
                  alt="Full Prescription"
                  onError={() => setPrescriptionLoadFailed(true)}
                  className="max-h-[70vh] object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {currentConsulting?.patientName || "Patient"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Phone: {currentConsulting?.patientPhone} • {currentConsulting?.patientAddress || "Lucknow"}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                    {currentConsulting?.patientHealthId || "#IND-ONLINE"}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block">Follow-Up Reason:</span>
                    <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 mt-1 font-medium">
                      {currentConsulting?.notes || "Review medication & blood pressure progress"}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block">Prescribing Doctor & Clinic:</span>
                    <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 mt-1 font-medium">
                      {activeDoctor.name} • {currentConsulting?.clinicName || "Pronto Health Partner Clinic"}
                    </p>
                  </div>

                  {currentConsulting?.preCheckNotes && (
                    <div>
                      <span className="font-bold text-slate-700 block">Coordinator Pre-Check Notes:</span>
                      <p className="text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 mt-1 font-medium">
                        {currentConsulting.preCheckNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

