"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Appointment, 
  subscribeToAppointments, 
  INITIAL_USER 
} from "@/lib/firebase";
import { BookingCard } from "../components/BookingCard";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { 
  Stethoscope, 
  HelpCircle, 
  CheckCircle, 
  CalendarCheck,
  ArrowRight
} from "lucide-react";

export default function BookingsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bookingsFilter, setBookingsFilter] = useState<"upcoming" | "previous">("upcoming");
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAppointments(INITIAL_USER.uid, (data) => {
      setAppointments(data);
    });
    return () => unsub();
  }, []);

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "Pending Screening" || a.status === "Escalated to Physical Visit"
  );
  const previousAppointments = appointments.filter(
    (a) => a.status === "Screening Complete"
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Mobile Top Brand Bar */}
      <div className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3 pt-3 pb-2.5 -mx-3 border-b border-gray-150 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
            <Stethoscope className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-black text-sm text-gray-950 tracking-tight">PRONTO</span>
            <span className="ml-1 text-[9px] uppercase font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded">
              Health
            </span>
          </div>
        </Link>

        {/* Profile Avatar trigger */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => setIsMobileProfileOpen(!isMobileProfileOpen)}
            className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
              isMobileProfileOpen
                ? "bg-emerald-600 text-white ring-2 ring-emerald-500/30"
                : "bg-emerald-100 text-emerald-800 border border-emerald-300"
            }`}
            aria-label="Profile and Menu"
          >
            RV
          </button>

          <ProfileDropdown
            isOpen={isMobileProfileOpen}
            onClose={() => setIsMobileProfileOpen(false)}
          />
        </div>
      </div>

      {/* Bookings Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">My Bookings & Triage</h1>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track your upcoming follow-up screenings and fast-tracked physical clinic passes.
          </p>
        </div>

        {/* Upcoming vs Previous Tabs */}
        <div className="p-1 bg-gray-100 rounded-2xl flex gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setBookingsFilter("upcoming")}
            className={`py-2 px-5 text-xs font-bold rounded-xl transition-all ${
              bookingsFilter === "upcoming"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Upcoming ({upcomingAppointments.length})
          </button>
          <button
            type="button"
            onClick={() => setBookingsFilter("previous")}
            className={`py-2 px-5 text-xs font-bold rounded-xl transition-all ${
              bookingsFilter === "previous"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Previous ({previousAppointments.length})
          </button>
        </div>
      </div>

      {/* Feed or Empty State */}
      {bookingsFilter === "upcoming" ? (
        upcomingAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
            {upcomingAppointments.map((apt) => (
              <BookingCard key={apt.id} appointment={apt} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-14 text-center flex flex-col items-center justify-center shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/calendar-empty.jpg"
              alt="No bookings found"
              className="w-44 h-44 sm:w-56 sm:h-56 object-contain rounded-2xl drop-shadow-sm mb-4"
            />
            <h3 className="text-base sm:text-lg font-bold text-gray-800">
              No bookings found
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-sm">
              You have no active follow-up triage appointments scheduled. Book a follow-up with any of our partnered clinic doctors.
            </p>
            <Link
              href="/"
              className="mt-6 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-md transition-all active:scale-95"
            >
              Explore Partnered Doctors →
            </Link>
          </div>
        )
      ) : previousAppointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          {previousAppointments.map((apt) => (
            <BookingCard key={apt.id} appointment={apt} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center flex flex-col items-center justify-center">
          <CheckCircle className="w-12 h-12 text-gray-300 mb-2" />
          <h3 className="text-sm font-bold text-gray-700">No past bookings yet</h3>
          <p className="text-xs text-gray-400 mt-1">
            Completed triage check-ups will be archived here for your health history.
          </p>
        </div>
      )}
    </div>
  );
}
