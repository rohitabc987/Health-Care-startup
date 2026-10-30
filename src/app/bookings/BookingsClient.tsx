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
  serverUid?: string;
}

export function BookingsClient({ initialAppointments, serverUid }: BookingsClientProps) {
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const isUserAuthenticated = Boolean(serverUid || isAuthenticated || user?.uid);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [bookingsFilter, setBookingsFilter] = useState<"upcoming" | "previous">("upcoming");

  const effectiveUid = user?.uid || serverUid;

  useEffect(() => {
    if (!effectiveUid) {
      setAppointments([]);
      return;
    }
    const unsub = subscribeToAppointments(effectiveUid, (data) => {
      setAppointments(data);
    });
    return () => unsub();
  }, [effectiveUid]);

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "Pending Screening" || a.status === "Escalated to Physical Visit"
  );
  const previousAppointments = appointments.filter(
    (a) => a.status === "Screening Complete"
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">

      {!isUserAuthenticated ? (
        /* Unauthenticated Centered Hero Card */
        <div className="bg-white rounded-3xl border border-gray-150 p-5 sm:p-8 text-center max-w-md mx-auto shadow-sm space-y-4 sm:space-y-5 my-2 sm:my-4 animate-in fade-in zoom-in-95">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
            <CalendarCheck className="w-7 h-7 stroke-[2.2]" />
          </div>

          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Appointments
            </span>
            <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-1.5 leading-snug">
              Sign In to View Your Bookings
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Your zero-queue clinic passes and doctor consultations are securely linked to your mobile account.
            </p>
          </div>

          {/* Quick Value Props: 2 in row, 3rd centered, with centered content */}
          <div className="space-y-2 sm:space-y-2.5 py-2">
            {/* Top Row: 2 Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              <div className="p-2.5 sm:p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
                <span className="text-lg block mb-1">⚡</span>
                <p className="text-xs font-bold text-gray-900 leading-tight">Zero-Queue Pass</p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-tight">Fast clinic slip</p>
              </div>

              <div className="p-2.5 sm:p-3 bg-teal-50/70 rounded-2xl border border-teal-100 flex flex-col items-center text-center">
                <span className="text-lg block mb-1">📅</span>
                <p className="text-xs font-bold text-gray-900 leading-tight">Live Booking Feed</p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-tight">Track visit status</p>
              </div>
            </div>

            {/* Bottom Row: 3rd Card Centered with identical width */}
            <div className="flex justify-center">
              <div className="w-[calc(50%-4px)] sm:w-[calc(50%-5px)] p-2.5 sm:p-3 bg-amber-50/70 rounded-2xl border border-amber-100 flex flex-col items-center text-center">
                <span className="text-lg block mb-1">🔒</span>
                <p className="text-xs font-bold text-gray-900 leading-tight">Private Records</p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-tight">Medical protection</p>
              </div>
            </div>
          </div>

          <div className="pt-1 space-y-2">
            <Link
              href="/login?redirect=/bookings"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold rounded-2xl shadow-md shadow-emerald-600/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <LogIn className="w-4 h-4 stroke-[2.3]" />
              <span>Login with Mobile Number</span>
            </Link>

            <button
              type="button"
              onClick={openLoginModal}
              className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-2xl text-xs transition-colors"
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
                className={`py-2 px-5 text-xs font-bold rounded-xl transition-all ${bookingsFilter === "upcoming"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                Upcoming ({upcomingAppointments.length})
              </button>
              <button
                type="button"
                onClick={() => setBookingsFilter("previous")}
                className={`py-2 px-5 text-xs font-bold rounded-xl transition-all ${bookingsFilter === "previous"
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
