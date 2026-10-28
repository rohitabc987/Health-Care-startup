"use client";

import React, { useState } from "react";
import { Doctor, bookAppointment, getStoredUserProfile } from "@/lib/firebase";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  PhoneCall,
  AlertCircle
} from "lucide-react";

interface BookingModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingModal({ doctor, isOpen, onClose, onSuccess }: BookingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(7);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<string>("Evening (5:00 PM - 7:00 PM)");
  const [patientNotes, setPatientNotes] = useState<string>("Review medication & blood pressure progress");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmedId, setBookingConfirmedId] = useState<string | null>(null);

  if (!isOpen || !doctor) return null;

  // Calculate target date based on offset days
  const calculateTargetDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      formatted: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      iso: d.toISOString().split("T")[0],
    };
  };

  const targetDateInfo = calculateTargetDate(selectedDayOffset);

  const timeWindows = [
    { id: "morning", label: "Morning Window", hours: "9:00 AM - 11:30 AM", icon: "🌅" },
    { id: "afternoon", label: "Afternoon Window", hours: "1:30 PM - 3:30 PM", icon: "☀️" },
    { id: "evening", label: "Evening Window", hours: "5:00 PM - 7:00 PM", icon: "🌙", recommended: true },
  ];

  const dateOptions = [
    { days: 5, label: "5 Days Out", desc: calculateTargetDate(5).formatted, recommended: false },
    { days: 7, label: "7 Days (Recommended)", desc: calculateTargetDate(7).formatted, recommended: true },
    { days: 10, label: "10 Days Out", desc: calculateTargetDate(10).formatted, recommended: false },
  ];

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    try {
      const user = getStoredUserProfile();
      const addrString = user.address
        ? [user.address.houseNo, user.address.street, user.address.locality, user.address.city, user.address.pincode].filter(Boolean).join(", ")
        : "";

      const aptId = await bookAppointment({
        patientUid: user.uid,
        patientName: user.name,
        patientPhone: user.phone,
        patientHealthId: user.healthId || "#PRN-8821-LKO",
        patientAddress: addrString,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        clinicName: doctor.clinic,
        bookingDate: new Date().toISOString().split("T")[0],
        followupDate: targetDateInfo.formatted,
        timeWindow: selectedTimeWindow,
        prescriptionUrl: "/images/prescription-demo.jpg",
        consultationFee: doctor.consultationFee,
        notes: patientNotes,
      });

      setBookingConfirmedId(aptId);
      setIsSubmitting(false);
      setStep(3); // Confirmation step
    } catch (err) {
      console.error("Booking error:", err);
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setStep(1);
    setBookingConfirmedId(null);
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between bg-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              Rx
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base leading-tight">Book Doctor Follow-up</h3>
              <p className="text-xs text-emerald-700 font-medium">Zero-Queue Clinic Follow-up • {doctor.clinic}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Doctor Brief Banner */}
          <div className="flex items-center gap-3.5 bg-gray-50 p-3 rounded-2xl border border-gray-150">
            {/* Doctor Avatar */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={doctor.image} 
              alt={doctor.name} 
              className="w-13 h-13 rounded-2xl object-cover border border-emerald-500/20 shadow-xs" 
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm truncate">{doctor.name}</span>
                <span className="text-[11px] bg-amber-50 text-amber-800 font-semibold px-1.5 py-0.5 rounded-md border border-amber-200">
                  ★ {doctor.rating}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{doctor.specialty}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Clinic Wait Guarantee</span>
              </div>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Select Follow-up Date
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Step 1 of 2
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setSelectedDayOffset(opt.days)}
                    className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      selectedDayOffset === opt.days
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-600/20 shadow-xs"
                        : "border-gray-200 bg-white hover:border-emerald-300 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold">{opt.label}</span>
                      {opt.recommended && (
                        <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full uppercase">
                          Best
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold mt-2 text-gray-900">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {/* Time Window Selection */}
              <div className="pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 mb-2.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Choose Consultation Window
                </label>
                <div className="space-y-2">
                  {timeWindows.map((tw) => (
                    <button
                      key={tw.id}
                      type="button"
                      onClick={() => setSelectedTimeWindow(`${tw.label} (${tw.hours})`)}
                      className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between text-left ${
                        selectedTimeWindow.includes(tw.label)
                          ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-600/20"
                          : "border-gray-200 bg-white hover:border-emerald-200 text-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{tw.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{tw.label}</span>
                            {tw.recommended && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-100/70 font-semibold px-2 py-0.5 rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{tw.hours}</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedTimeWindow.includes(tw.label)
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-gray-300"
                      }`}>
                        {selectedTimeWindow.includes(tw.label) && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Value Proposition Micro-Banner */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 leading-snug">
                  <span className="font-bold">Seamless Doctor-Patient Care:</span> Consult your doctor online or visit the clinic with zero queue wait. All your medical history and prescriptions are accessible to the doctor during consultation!
                </p>
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                Continue to Review
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Confirm Booking Details
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Step 2 of 2
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Scheduled Date:</span>
                  <span className="font-bold text-gray-900">{targetDateInfo.formatted}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Time Window:</span>
                  <span className="font-bold text-gray-900">{selectedTimeWindow}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Consulting Doctor:</span>
                  <span className="font-bold text-gray-900">{doctor.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Primary Clinic:</span>
                  <span className="font-bold text-gray-900">{doctor.clinic}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-gray-500 block">Consultation Fee:</span>
                    <span className="text-[10px] text-gray-400">Doctor consultation rate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="line-through text-gray-400">₹{doctor.regularFee}</span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ₹{doctor.consultationFee}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Reason / Symptoms / Chief Complaint (Optional)
                </label>
                <input
                  type="text"
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  placeholder="e.g. Online consultation for fever & cough, blood test review, or follow-up"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-2xl text-xs transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={isSubmitting}
                  className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold rounded-2xl shadow-md shadow-emerald-600/20 text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Saving to Firebase...
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm & Save Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900">Follow-up Confirmed!</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Your follow-up with <span className="font-semibold text-gray-800">{doctor.name}</span> has been confirmed. All your medical history and prescription records will be available for the doctor.
                </p>
              </div>

              {bookingConfirmedId && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl max-w-xs mx-auto">
                  <span className="text-[10px] text-emerald-800 uppercase tracking-widest font-bold">Fast-Track Pass ID</span>
                  <p className="font-mono font-bold text-sm text-emerald-950 mt-0.5">{bookingConfirmedId}</p>
                </div>
              )}

              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-left text-xs text-gray-600 space-y-2">
                <div className="flex items-center gap-2 text-gray-900 font-semibold">
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  What happens next?
                </div>
                <p className="text-[11px] leading-relaxed">
                  Your doctor will review your medical records and connect with you online during your selected window on <span className="font-semibold text-gray-800">{targetDateInfo.formatted}</span>. If an in-person clinic visit is needed, your slot is already fast-tracked.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-md text-xs transition-colors"
              >
                View in My Follow-ups
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
