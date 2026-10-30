"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Doctor } from "@/lib/firebase";
import { Plus, Star, MapPin, ShieldCheck, Stethoscope } from "lucide-react";
import { BookingModal } from "./BookingModal";

export interface DoctorCardProps {
  doctor: Doctor;
  onBookingSuccess?: () => void;
}

export function DoctorCard({ doctor, onBookingSuccess }: DoctorCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatReviewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <>
      <div className="group relative bg-white rounded-2xl border border-gray-150 p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:border-emerald-200/80 hover:-translate-y-0.5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between w-full mb-2">
          {doctor.isNew ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500 text-white shadow-xs">
              NEW
            </span>
          ) : (
            <div className="inline-flex items-center gap-1 bg-amber-50/90 text-amber-900 border border-amber-200/60 px-2 py-0.5 rounded-full text-[11px] font-semibold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              <span>{doctor.rating.toFixed(1)}</span>
              <span className="text-gray-400 font-normal">({formatReviewCount(doctor.reviews)})</span>
            </div>
          )}

          {/* Guaranteed slot badge */}
          {/* <span className="text-[10px] text-emerald-700 bg-emerald-50 font-medium px-1.5 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Verified
          </span> */}
        </div>

        {/* Center Doctor Image Presentation */}
        <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 my-1 flex items-center justify-center">
          <Link href={`/doctor/${doctor.id}`} className="w-full h-full block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </Link>

          {/* Pronto-style Floating Green '+' Action Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label={`Book appointment with ${doctor.name}`}
            className="absolute bottom-2 right-2 w-6 h-6 md:w-8 md:h-8 rounded-full bg-white text-emerald-600 border border-emerald-500/30 shadow-md flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
          >
            <Plus className="w-3 h-3 md:w-5 md:h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Doctor Information Block */}
        <div className="mt-2.5 flex-1 flex flex-col justify-between">
          <div>
            <Link href={`/doctor/${doctor.id}`}>
              <h3 className="font-bold text-gray-900 text-sm leading-snug truncate group-hover:text-emerald-700 transition-colors">
                {doctor.name}
              </h3>
            </Link>

            <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5 flex items-center gap-1">
              <Stethoscope className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{doctor.specialty}</span>
            </p>

            <p className="text-[10px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
              <span className="truncate">{doctor.clinic}</span>
            </p>
          </div>

          {/* Pricing: Doctor Consultation Fee */}
          <div className="pt-2 mt-2 border-t border-gray-100 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-gray-900">₹{doctor.consultationFee}</span>
              <span className="text-[11px] line-through text-gray-400">₹{doctor.regularFee}</span>
              {/* <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                Follow-up Fee
              </span> */}
            </div>
          </div>

          {/* Primary High-Contrast "Book Follow-up" Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-2.5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <span>Book Follow-up</span>
          </button>
        </div>
      </div>

      {/* Booking Flow Modal */}
      <BookingModal
        doctor={doctor}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          if (onBookingSuccess) {
            onBookingSuccess();
          }
        }}
      />
    </>
  );
}
