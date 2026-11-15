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
import { TeleConsultationRoom } from "@/app/components/TeleConsultationRoom";
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
  Check
} from "lucide-react";

interface DoctorConsultationClientProps {
  initialAppointments: Appointment[];
}

export function DoctorConsultationClient({ initialAppointments }: DoctorConsultationClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedOutcome, setSelectedOutcome] = useState<"continued_meds" | "dose_adjusted" | "escalated_to_clinic">("continued_meds");
  const [doctorNotes, setDoctorNotes] = useState<string>("Review complete. Patient is recovering well, continue current medication.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPrescriptionUrl, setPreviewPrescriptionUrl] = useState<string | null>(null);

  // Subscribe to real doctors from Firestore
  useEffect(() => {
    const unsub = subscribeToDoctors((docs) => {
      setDoctors(docs);
      if (docs.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(docs[0].id);
      }
    });
    return () => unsub();
  }, [selectedDoctorId]);

  // Subscribe to live queue updates for this doctor
  useEffect(() => {
    if (!selectedDoctorId) return;
    const unsub = subscribeToDoctorQueue(selectedDoctorId, (list) => {
      setAppointments(list);
    });
    return () => unsub();
  }, [selectedDoctorId]);

  const activeDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

  // Separate currently active patient from the ready queue
  const currentConsulting = appointments.find((a) => a.queueStatus === "in_consultation");
  const readyQueue = appointments.filter((a) => a.queueStatus === "ready_for_doctor");
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

  // Default prescription slip image fallback for preview
  const prescriptionSlip =
    currentConsulting?.prescriptionSlipUrl ||
    "https://res.cloudinary.com/ptq7bun2/image/upload/q_auto:good,f_auto,w_1600,c_limit,e_auto_contrast/prescription_demo.jpg";

  if (doctors.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 text-center space-y-4 shadow-sm animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <Video className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">No Doctors Registered in Database</h2>
          <p className="text-xs text-gray-500 mt-1">
            Please register or add a doctor in the Admin panel to start live video consultations.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
        >
          Open Admin Panel
        </Link>
      </div>
    );
  }

  const doctorInitial = activeDoctor?.name?.replace("Dr. ", "").charAt(0) || "D";

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4 animate-in fade-in duration-200">
      {/* Top Session Bar */}
      <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {doctorInitial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Doctor Hot-Seat Desk
              </span>
              <span className="text-xs text-gray-400 font-medium">High Throughput Mode</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-gray-900 mt-0.5">
              {activeDoctor?.name} • {activeDoctor?.specialty}
            </h1>
          </div>
        </div>

        {/* Doctor Switcher & Queue Badge */}
        <div className="flex items-center gap-3">
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 text-gray-800 focus:outline-emerald-500"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <Link
            href="/admin/queue"
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-2xl transition-colors"
          >
            Open Queue Manager
          </Link>
        </div>
      </div>

      {/* Main Consultation Workplace */}
      {currentConsulting ? (
        <div className="space-y-4">
          {/* Split Screen Layout: Left Video (55%) | Right Medical Record (45%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: Embedded WebRTC Video Stream */}
            <div className="lg:col-span-7 h-[420px] sm:h-[500px]">
              <TeleConsultationRoom
                roomUrl={currentConsulting.meetingRoomUrl || `https://meet.jit.si/livesehat-tele-${currentConsulting.id}`}
                userName={activeDoctor.name}
                counterpartName={currentConsulting.patientName || "Patient"}
                isDoctor={true}
              />
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
                    onClick={() => setPreviewPrescriptionUrl(prescriptionSlip)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Zoom Full Slip</span>
                  </button>
                </div>

                <div
                  onClick={() => setPreviewPrescriptionUrl(prescriptionSlip)}
                  className="relative h-32 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer group shadow-2xs"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prescriptionSlip}
                    alt="Prescription slip"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                    Click to Zoom
                  </div>
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
            <div className="pt-1 flex items-center justify-between gap-4">
              <span className="text-xs text-gray-500 font-medium">
                {readyQueue.length > 0
                  ? `🟢 Next in runway: ${nextPatient?.patientName} (${readyQueue.length} patient${readyQueue.length > 1 ? "s" : ""} waiting)`
                  : "Runway empty: no more pre-verified patients waiting."}
              </span>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCompleteAndNext}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Complete &amp; Call Next Ready Patient</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Idle Hot-Seat Lobby when no consultation is active */
        <div className="bg-white rounded-3xl border border-gray-150 p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm space-y-5 my-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <Video className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full inline-block">
              {readyQueue.length} Patients Ready in Runway
            </span>
            <h2 className="text-xl font-black text-gray-900">
              Ready for Consultation Session
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Care coordinators have verified patient audio and 4G connections. Tap below to start your high-throughput review session.
            </p>
          </div>

          {nextPatient ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleStartConsultation(nextPatient)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Video className="w-4 h-4 stroke-[2.5]" />
              <span>Connect First Patient: {nextPatient.patientName}</span>
            </button>
          ) : (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-500">
              No patients verified in the ready runway yet. Open the{" "}
              <Link href="/admin/queue" className="text-emerald-700 font-bold underline">
                Queue Manager
              </Link>{" "}
              to pre-check patients.
            </div>
          )}
        </div>
      )}

      {/* High-Res Prescription Slip Zoom Modal */}
      {previewPrescriptionUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-xs font-bold text-gray-900">
                Patient Prescription Slip (Cloudinary High-Res)
              </span>
              <button
                type="button"
                onClick={() => setPreviewPrescriptionUrl(null)}
                className="p-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto rounded-2xl bg-gray-950 flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPrescriptionUrl}
                alt="Full Prescription"
                className="max-h-[70vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

