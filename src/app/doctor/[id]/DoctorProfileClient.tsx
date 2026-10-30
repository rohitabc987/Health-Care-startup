"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Doctor } from "@/lib/firebase";
import { BookingModal } from "@/app/components/BookingModal";
import {
  ArrowLeft,
  Star,
  MapPin,
  Stethoscope,
  Award,
  ShieldCheck,
  Calendar,
  CheckCircle2
} from "lucide-react";

interface DoctorProfileClientProps {
  doctor: Doctor;
}

export function DoctorProfileClient({ doctor }: DoctorProfileClientProps) {
  const router = useRouter();
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-5 animate-in fade-in duration-200 pb-10">
      {/* Desktop Back Navigation */}
      <div className="hidden md:flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white px-3 py-2 rounded-2xl border border-gray-200 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Doctor Hero Card */}
      <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
          {/* Doctor Image */}
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover object-top border-2 border-emerald-500/20 shadow-md"
            />
            <div className="absolute -bottom-2 -right-1 bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <Star className="w-3 h-3 fill-white" />
              <span>{doctor.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Doctor Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-gray-950 leading-tight">
                {doctor.name}
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified Doctor
              </span>
            </div>

            <p className="text-xs sm:text-sm text-emerald-800 font-semibold mt-1 flex items-center justify-center sm:justify-start gap-1">
              <Stethoscope className="w-4 h-4 shrink-0" />
              <span>{doctor.specialty}</span>
            </p>

            <p className="text-xs text-gray-500 mt-1 flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{doctor.clinic}</span>
            </p>

            {doctor.experienceYears && (
              <p className="text-xs text-gray-400 mt-1 flex items-center justify-center sm:justify-start gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{doctor.experienceYears} Years Clinical Experience</span>
              </p>
            )}
          </div>
        </div>

        {/* Pricing and Slots Row */}
        <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
            <span className="text-[10px] text-gray-500 font-medium block">Consultation Fee</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base sm:text-lg font-black text-emerald-900">
                ₹{doctor.consultationFee}
              </span>
              <span className="text-xs text-gray-400 line-through">₹{doctor.regularFee}</span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-150 rounded-2xl">
            <span className="text-[10px] text-gray-500 font-medium block">Next Available</span>
            <span className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 block">
              {doctor.nextAvailableDay || "In 7 Days"}
            </span>
          </div>
        </div>

        {/* Primary Booking Trigger */}
        <button
          type="button"
          onClick={() => setIsBookingOpen(true)}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-md shadow-emerald-600/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Follow-up Consultation</span>
        </button>
      </div>

      {/* Clinical Highlights & About Card */}
      <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>About Doctor &amp; Clinical Services</span>
        </h3>

        <p className="text-xs text-gray-600 leading-relaxed">
          {doctor.name} specializes in {doctor.specialty} at {doctor.clinic}. Partnered with Pronto Health to provide streamlined, zero-queue physical follow-ups and verified digital prescription consults.
        </p>

        <div className="pt-2 border-t border-gray-100 space-y-2 text-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span>Consultation Mode:</span>
            <span className="font-bold text-gray-900">In-Clinic + Digital Follow-up Pass</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Clinic Timings:</span>
            <span className="font-bold text-gray-900">Morning (9 AM - 1 PM) &amp; Evening (5 PM - 8 PM)</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Verified Partner:</span>
            <span className="font-semibold text-emerald-700">Apollo Health Network</span>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingOpen && (
        <BookingModal
          isOpen={isBookingOpen}
          doctor={doctor}
          onClose={() => setIsBookingOpen(false)}
          onSuccess={() => {
            setIsBookingOpen(false);
            router.push("/bookings");
          }}
        />
      )}
    </div>
  );
}
