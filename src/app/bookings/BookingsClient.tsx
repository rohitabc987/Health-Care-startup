"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Appointment, subscribeToAppointments } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { BookingCard } from "../components/BookingCard";
import { 
  CheckCircle, 
  CalendarCheck,
  LogIn
} from "lucide-react";

interface BookingsClientProps {
  initialAppointments: Appointment[];
}

export function BookingsClient({ initialAppointments }: BookingsClientProps) {
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>(user ? initialAppointments : []);
  const [bookingsFilter, setBookingsFilter] = useState<"upcoming" | "previous">("upcoming");

  useEffect(() => {
    if (!user?.uid) {
      setAppointments([]);
      return;
    }
    const unsub = subscribeToAppointments(user.uid, (data) => {
      setAppointments(data);
    });
    return () => unsub();
  }, [user?.uid]);

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "Pending Screening" || a.status === "Escalated to Physical Visit"
  );
  const previousAppointments = appointments.filter(
    (a) => a.status === "Screening Complete"
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">

      {!isAuthenticated ? (
        /* Unauthenticated Centered Hero Card */
        <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-6 my-4 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
            <CalendarCheck className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Appointments
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
              Sign In to View Your Follow-ups
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Your zero-queue clinic passes, doctor consultations, and appointment slips are securely linked to your mobile account.
            </p>
          </div>

          {/* Quick Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <span className="text-base block mb-1">⚡</span>
              <p className="text-xs font-bold text-gray-900">Zero-Queue Pass</p>
              <p className="text-[11px] text-gray-500">Fast clinic check-in slip</p>
            </div>
            <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100">
              <span className="text-base block mb-1">📅</span>
              <p className="text-xs font-bold text-gray-900">Live Booking Feed</p>
              <p className="text-[11px] text-gray-500">Track doctor visit status</p>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
              <span className="text-base block mb-1">🔒</span>
              <p className="text-xs font-bold text-gray-900">Private Records</p>
              <p className="text-[11px] text-gray-500">Protected patient medical vault</p>
            </div>
          </div>

          <div className="pt-2 space-y-2.5">
            <Link
              href="/login?redirect=/bookings"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold rounded-2xl shadow-md shadow-emerald-600/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <LogIn className="w-4 h-4 stroke-[2.3]" />
              <span>Login with Mobile Number</span>
            </Link>

            <button
              type="button"
              onClick={openLoginModal}
              className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-2xl text-xs transition-colors"
            >
              Open Quick Login Modal
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Bookings Header Card */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">My Follow-ups</h1>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  Live Passes
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Track your upcoming doctor follow-ups and zero-queue clinic passes.
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
                Past Follow-ups ({previousAppointments.length})
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
              alt="No follow-ups found"
              className="w-44 h-44 sm:w-56 sm:h-56 object-contain rounded-2xl drop-shadow-sm mb-4"
            />
            <h3 className="text-base sm:text-lg font-bold text-gray-800">
              No follow-ups scheduled
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-sm">
              You have no active doctor follow-ups scheduled. Select a doctor to book your zero-queue follow-up consultation.
            </p>
            <Link
              href="/"
              className="mt-6 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-md transition-all active:scale-95"
            >
              Book a Follow-up Now →
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
          <h3 className="text-sm font-bold text-gray-700">No past follow-ups yet</h3>
          <p className="text-xs text-gray-400 mt-1">
            Completed follow-up consultations will be archived here in your health record.
          </p>
        </div>
      )}
        </>
      )}
    </div>
  );
}
