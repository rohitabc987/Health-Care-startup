"use client";

import React, { useState, useEffect } from "react";
import { 
  Appointment, 
  Doctor, 
  getTodayOverallSales, 
  getDoctorDailySales, 
  getAppointments, 
  subscribeToDoctors, 
  updateAppointmentStatus, 
  AppointmentStatus 
} from "@/lib/firebase";
import { 
  BarChart3, 
  Filter, 
  RefreshCw, 
  Calendar,
  CheckCircle2
} from "lucide-react";
import { AdminNavHeader } from "../components/AdminNavHeader";
import { AdminKpiCards } from "../components/AdminKpiCards";
import { AdminBookingsTable } from "../components/AdminBookingsTable";
import { revalidateTodayAnalyticsAction } from "@/app/actions/cacheActions";
import { UserRole } from "@/lib/types";

interface BookingAdminClientProps {
  initialOverallMetrics: { totalPatients: number; totalRevenue: number };
  initialDoctors: Doctor[];
  initialAppointments: Appointment[];
  userRole?: UserRole;
  currentDoctorId?: string;
}

export function BookingAdminClient({
  initialOverallMetrics,
  initialDoctors,
  initialAppointments,
  userRole = "super_admin",
  currentDoctorId,
}: BookingAdminClientProps) {
  const isDoctor = userRole === "doctor";

  const [todayDate, setTodayDate] = useState<string>("");
  const [overallMetrics, setOverallMetrics] = useState(initialOverallMetrics);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    isDoctor && currentDoctorId ? currentDoctorId : "all"
  );
  const [doctorMetrics, setDoctorMetrics] = useState<{ doctorPatients: number; doctorRevenue: number } | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>(initialDoctors);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    setTodayDate(todayStr);
  }, []);

  useEffect(() => {
    const unsub = subscribeToDoctors((docs) => {
      setDoctorsList(docs);
    });
    return () => unsub();
  }, []);

  const showNotice = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const loadMetricsAndAppointments = async (dateStr?: string, docId?: string) => {
    const targetDate = dateStr || todayDate || new Date().toISOString().split("T")[0];
    const targetDoctor = isDoctor && currentDoctorId ? currentDoctorId : (docId !== undefined ? docId : selectedDoctorId);

    setIsLoadingAppointments(true);

    try {
      if (isDoctor && currentDoctorId) {
        // Doctor only loads their own sales
        const docSales = await getDoctorDailySales(currentDoctorId, targetDate);
        setDoctorMetrics(docSales);
        setOverallMetrics({
          totalPatients: docSales.doctorPatients,
          totalRevenue: docSales.doctorRevenue,
        });
      } else {
        const overall = await getTodayOverallSales(targetDate);
        setOverallMetrics(overall);

        if (targetDoctor !== "all") {
          const docSales = await getDoctorDailySales(targetDoctor, targetDate);
          setDoctorMetrics(docSales);
        } else {
          setDoctorMetrics(null);
        }
      }

      const list = await getAppointments({
        dateStr: targetDate,
        doctorId: targetDoctor === "all" ? undefined : targetDoctor,
        pageSize: 50,
      });
      setAppointments(list);
    } catch (err) {
      console.error("Error loading bookings & metrics:", err);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  useEffect(() => {
    if (todayDate) {
      loadMetricsAndAppointments(todayDate, selectedDoctorId);
    }
  }, [todayDate, selectedDoctorId]);

  const handleStatusChange = async (aptId: string, newStatus: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(aptId, newStatus);
      await revalidateTodayAnalyticsAction();
      loadMetricsAndAppointments(todayDate, selectedDoctorId);
      showNotice(`Appointment triage status updated to "${newStatus}"`);
    } catch (err: any) {
      showNotice(err?.message || "Failed to update appointment status.");
    }
  };

  const currentDoctorObj = isDoctor && currentDoctorId ? doctorsList.find((d) => d.id === currentDoctorId) : null;

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Top Admin Navigation Header */}
      <AdminNavHeader
        userRole={userRole}
        currentDoctorName={currentDoctorObj?.name}
        doctorCount={doctorsList.length}
      />

      {/* Real-time Notice Toast */}
      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Date & Doctor Filter Controls Bar */}
      <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-gray-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full min-w-0 max-w-full flex-1">
          {/* Top Row on Mobile: Date Picker + Refresh Button */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto min-w-0">
            {/* Date Picker */}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-200 min-w-0 flex-1 sm:flex-initial">
              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                type="date"
                value={todayDate}
                onChange={(e) => setTodayDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer w-full sm:w-auto min-w-0"
              />
            </div>

            {/* Mobile-Only Refresh Button */}
            <button
              type="button"
              onClick={() => loadMetricsAndAppointments(todayDate, selectedDoctorId)}
              disabled={isLoadingAppointments}
              className="sm:hidden py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAppointments ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Doctor Filter (Hidden if logged in as Doctor) */}
          {!isDoctor && (
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-200 w-full min-w-0 max-w-full sm:max-w-xs overflow-hidden flex-1">
              <Filter className="w-4 h-4 text-gray-500 shrink-0" />
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer w-full min-w-0 max-w-full truncate pr-1"
              >
                <option value="all">All Doctors</option>
                {doctorsList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Desktop-Only Refresh Button */}
        <button
          type="button"
          onClick={() => loadMetricsAndAppointments(todayDate, selectedDoctorId)}
          disabled={isLoadingAppointments}
          className="hidden sm:flex py-2 px-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-2xl transition-all items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAppointments ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Financial & Volume KPI Cards */}
      <AdminKpiCards
        selectedDoctorId={selectedDoctorId}
        overallMetrics={overallMetrics}
        doctorMetrics={doctorMetrics}
      />

      {/* Bookings Table with Search & Triage Controls */}
      <AdminBookingsTable
        appointments={appointments}
        isLoading={isLoadingAppointments}
        todayDate={todayDate}
        selectedDoctorId={selectedDoctorId}
        canClearDoctorFilter={!isDoctor && selectedDoctorId !== "all"}
        onClearDoctorFilter={() => setSelectedDoctorId("all")}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

