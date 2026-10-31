"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Appointment, updateAppointmentStatus } from "@/lib/firebase";
import { INITIAL_DOCTORS } from "@/lib/mockData";
import { revalidatePatientDataAction } from "@/app/actions/cacheActions";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin,
  CheckCircle2,
  Zap,
  ChevronRight
} from "lucide-react";

export interface BookingCardProps {
  appointment: Appointment;
  onStatusChange?: () => void;
  showDoctorTools?: boolean;
}

export function BookingCard({ appointment, onStatusChange, showDoctorTools }: BookingCardProps) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Doctor consultation & ops tools should ONLY be visible to super_admin/staff or assigned doctor (NOT patient)
  const isAdmin = user?.role === "super_admin" || user?.role === "staff";
  const isAssignedDoctor =
    user?.role === "doctor" &&
    (user.doctorId === appointment.doctorId ||
      user.uid === appointment.doctorId ||
      user.name?.trim().toLowerCase() === appointment.doctorName?.trim().toLowerCase());

  const canAccessDoctorTools =
    showDoctorTools !== undefined ? showDoctorTools : (isAdmin || isAssignedDoctor);

  const handleEscalate = async () => {
    setIsUpdating(true);
    try {
      await updateAppointmentStatus(appointment.id, "Escalated to Physical Visit");
      await revalidatePatientDataAction(appointment.patientUid);
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolve = async () => {
    setIsUpdating(true);
    try {
      await updateAppointmentStatus(appointment.id, "Screening Complete");
      await revalidatePatientDataAction(appointment.patientUid);
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Status Chip Rendering
  const renderStatusBadge = () => {
    switch (appointment.status) {
      case "Pending Screening":
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Pending</span>
          </div>
        );
      case "Escalated to Physical Visit":
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
            <span>Escalated to Physical Visit</span>
          </div>
        );
      case "Screening Complete":
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Screening Complete</span>
          </div>
        );
    }
  };

  // Resolve doctor image and profile link
  const matchedDoctor = INITIAL_DOCTORS.find(
    (d) => d.id === appointment.doctorId || d.name.toLowerCase() === appointment.doctorName?.toLowerCase()
  );
  const doctorImage = appointment.doctorImage || matchedDoctor?.image || "/images/doctor-1.jpg";
  const doctorProfileUrl = `/doctor/${appointment.doctorId || matchedDoctor?.id || "doc-1"}`;

  return (
    <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 shadow-xs hover:border-emerald-300 transition-all duration-200 space-y-3.5">
      {/* 1. Header: Booking ID & Health ID on Left, Status Badge on Right */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            BOOKING ID:
          </span>
          <span className="text-xs font-mono font-bold text-gray-900 block">
            #{appointment.id.replace("apt-", "")}
          </span>
          {(appointment.patientHealthId || user?.healthId) && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                Health ID:
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700">
                {appointment.patientHealthId || user?.healthId}
              </span>
            </div>
          )}
        </div>
        <div className="shrink-0">{renderStatusBadge()}</div>
      </div>

      {/* 2. Below that: Doctor Profile (Photo on Left, Name & Location on Right) */}
      <div className="flex items-center gap-3.5 min-w-0 pt-0.5">
        <Link
          href={doctorProfileUrl}
          className="shrink-0 group/doc block"
          title={`View profile of ${appointment.doctorName}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={doctorImage}
            alt={appointment.doctorName}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover object-top border border-gray-150 shadow-2xs group-hover/doc:ring-2 group-hover/doc:ring-emerald-500 group-hover/doc:scale-105 transition-all"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={doctorProfileUrl}
            className="block group/name"
            title={`View profile of ${appointment.doctorName}`}
          >
            <h3 className="text-base font-bold text-gray-900 group-hover/name:text-emerald-700 transition-colors truncate">
              {appointment.doctorName}
            </h3>
          </Link>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{appointment.clinicName || "Local Partner Clinic"}</span>
          </p>
        </div>
      </div>

      {/* 3. Structured Details Section (Like Profile Card) */}
      <div className="pt-3 border-t border-gray-100 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-medium">Date:</span>
          <span className="font-bold text-gray-900">{appointment.followupDate}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-medium">Time:</span>
          <span className="font-bold text-gray-900">{appointment.timeWindow}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-medium">Consultation Fee:</span>
          <span className="font-bold text-emerald-700">
            {appointment.consultationFee ? `₹${appointment.consultationFee}` : "Free Follow-up"}
          </span>
        </div>

        {/* Notes: If short (<= 25 chars) show inline, if more it goes to next line */}
        {(!appointment.notes || appointment.notes.length <= 25) ? (
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium">Notes:</span>
            <span className="font-semibold text-gray-800 text-right">
              {appointment.notes || "Routine follow-up"}
            </span>
          </div>
        ) : (
          <div className="space-y-1 pt-0.5">
            <span className="text-gray-500 font-medium block">Notes:</span>
            <p className="font-semibold text-gray-800 break-words leading-relaxed pl-0.5 text-xs">
              {appointment.notes}
            </p>
          </div>
        )}
      </div>

      {/* Fast-Track Physical Bypass Alert if Escalated */}
      {appointment.status === "Escalated to Physical Visit" && (
        <div className="bg-indigo-50/90 border border-indigo-200/90 p-3 rounded-2xl space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
              <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" />
              <span>Queue Bypass Activated</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-white text-indigo-900 px-2 py-0.5 rounded border border-indigo-200">
              {appointment.queueBypassCode || "FAST-PASS-492"}
            </span>
          </div>
          <p className="text-[11px] text-indigo-900 leading-snug">
            Show this pass at <span className="font-semibold">{appointment.clinicName}</span> to walk right in without waiting.
          </p>
        </div>
      )}

      {/* 4. Doctor Consultation & Ops Controls - ONLY shown to Admin or Assigned Doctor */}
      {canAccessDoctorTools && (
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors"
          >
            <span>{showDetails ? "Hide Doctor Tools" : "Doctor Consultation & Ops Tools"}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showDetails ? "rotate-90" : ""}`} />
          </button>

          {showDetails && (
            <div className="w-full mt-2 pt-2 border-t border-dashed border-gray-200 flex flex-col sm:flex-row gap-2">
              {appointment.status === "Pending Screening" && (
                <>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={handleEscalate}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Doctor: Escalate to Clinic</span>
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={handleResolve}
                    className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Doctor: Complete Online Consult</span>
                  </button>
                </>
              )}

              {appointment.status === "Escalated to Physical Visit" && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleResolve}
                  className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Clinic Visit Done</span>
                </button>
              )}

              {appointment.status === "Screening Complete" && (
                <p className="text-[11px] text-gray-400 py-1">
                  ✓ Consultation & care concluded successfully. Prescription & records updated.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
