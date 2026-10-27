"use client";

import React, { useState } from "react";
import { Appointment, updateAppointmentStatus } from "@/lib/firebase";
import {
  Calendar,
  Clock,
  MapPin,
  PhoneCall,
  AlertCircle,
  CheckCircle2,
  Zap,
  FileText,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";

export interface BookingCardProps {
  appointment: Appointment;
  onStatusChange?: () => void;
}

export function BookingCard({ appointment, onStatusChange }: BookingCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleEscalate = async () => {
    setIsUpdating(true);
    try {
      await updateAppointmentStatus(appointment.id, "Escalated to Physical Visit");
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
            <span>Pending Screening</span>
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

  return (
    <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm hover:shadow-md transition-all duration-200 space-y-3.5">
      {/* Top Meta Row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Booking ID: #{appointment.id.replace("apt-", "")}
          </span>
          <h3 className="text-base font-bold text-gray-900 mt-0.5">
            {appointment.doctorName}
          </h3>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">{appointment.clinicName || "Local Partner Clinic"}</span>
          </p>
          {appointment.consultationFee && (
            <span className="inline-block mt-1 text-[10px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.2 rounded">
              Follow-up Fee: ₹{appointment.consultationFee}
            </span>
          )}
        </div>

        {/* Workflow Status Chip */}
        <div>{renderStatusBadge()}</div>
      </div>

      {/* Date & Time Window Box */}
      <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Follow-up Date</p>
            <p className="font-bold text-gray-800">{appointment.followupDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 font-medium">Follow-up Window</p>
            <p className="font-bold text-gray-800 truncate">{appointment.timeWindow}</p>
          </div>
        </div>
      </div>

      {/* Fast-Track Physical Bypass Alert if Escalated */}
      {appointment.status === "Escalated to Physical Visit" && (
        <div className="bg-indigo-50/90 border border-indigo-200/90 p-3 rounded-xl space-y-1.5 animate-in fade-in duration-200">
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
            Our ops team has scheduled your physical slot with the receptionist at{" "}
            <span className="font-semibold">{appointment.clinicName}</span>. Show this pass at the desk to walk right in.
          </p>
        </div>
      )}

      {/* "What's Next" Informative Guidance Banner */}
      {appointment.status === "Pending Screening" && (
        <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl flex items-start gap-2.5">
          <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-emerald-950 leading-relaxed">
            <span className="font-bold">What happens next:</span> Your doctor will consult with you online during your selected window on{" "}
            <span className="font-semibold">{appointment.followupDate}</span>. Have your physical prescription handy!
          </div>
        </div>
      )}

      {/* Doctor Notes / Reason */}
      {appointment.notes && (
        <p className="text-[11px] text-gray-500 italic px-1">
          Consultation Notes / Reason: &quot;{appointment.notes}&quot;
        </p>
      )}

      {/* Interactive Simulation / Triage Ops Controls */}
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
    </div>
  );
}
