"use client";

import React, { useState, useEffect } from "react";
import { 
  Appointment, 
  Doctor, 
  getTodayOverallSales, 
  getDoctorDailySales, 
  getAppointments,
  subscribeToDoctors,
  toggleDoctorStatus,
  addDoctor,
  updateAppointmentStatus,
  AppointmentStatus
} from "@/lib/firebase";
import { 
  BarChart3, 
  Stethoscope, 
  ShieldCheck, 
  Filter, 
  CheckCircle2, 
  RefreshCw, 
  Calendar 
} from "lucide-react";
import { AdminKpiCards } from "./components/AdminKpiCards";
import { AdminBookingsTable } from "./components/AdminBookingsTable";
import { AdminDoctorCatalog } from "./components/AdminDoctorCatalog";
import { AddDoctorModal } from "./components/AddDoctorModal";

import { 
  revalidateDoctorsCatalogAction, 
  revalidateTodayAnalyticsAction 
} from "@/app/actions/cacheActions";

interface AdminClientProps {
  initialOverallMetrics: { totalPatients: number; totalRevenue: number };
  initialDoctors: Doctor[];
  initialAppointments: Appointment[];
}

export function AdminClient({
  initialOverallMetrics,
  initialDoctors,
  initialAppointments,
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<"sales" | "doctors">("sales");
  const [todayDate, setTodayDate] = useState<string>("");

  const [overallMetrics, setOverallMetrics] = useState(initialOverallMetrics);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");
  const [doctorMetrics, setDoctorMetrics] = useState<{ doctorPatients: number; doctorRevenue: number } | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  const [doctorsList, setDoctorsList] = useState<Doctor[]>(initialDoctors);
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
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

  const loadMetricsAndAppointments = async (dateStr?: string, docId?: string) => {
    const targetDate = dateStr || todayDate || new Date().toISOString().split("T")[0];
    const targetDoctor = docId !== undefined ? docId : selectedDoctorId;

    setIsLoadingAppointments(true);

    try {
      const overall = await getTodayOverallSales(targetDate);
      setOverallMetrics(overall);

      if (targetDoctor !== "all") {
        const docSales = await getDoctorDailySales(targetDoctor, targetDate);
        setDoctorMetrics(docSales);
      } else {
        setDoctorMetrics(null);
      }

      const list = await getAppointments({
        dateStr: targetDate,
        doctorId: targetDoctor === "all" ? undefined : targetDoctor,
        pageSize: 50,
      });
      setAppointments(list);
    } catch (err) {
      console.error("Error loading admin metrics:", err);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  useEffect(() => {
    if (todayDate) {
      loadMetricsAndAppointments(todayDate, selectedDoctorId);
    }
  }, [todayDate, selectedDoctorId]);

  const showNotice = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleToggleDoctor = async (docId: string, currentStatus?: boolean) => {
    const nextStatus = currentStatus === false ? true : false;
    await toggleDoctorStatus(docId, nextStatus);
    // Purge Vercel Edge Cache on-demand for doctors catalog
    await revalidateDoctorsCatalogAction();
    showNotice(`Doctor visibility updated to: ${nextStatus ? "Active on Home Page" : "Hidden from Home Page"}`);
  };

  const handleStatusChange = async (aptId: string, newStatus: AppointmentStatus) => {
    await updateAppointmentStatus(aptId, newStatus);
    await revalidateTodayAnalyticsAction();
    loadMetricsAndAppointments(todayDate, selectedDoctorId);
    showNotice(`Appointment updated to ${newStatus}`);
  };

  const handleAddDoctor = async (newDocData: Omit<Doctor, "id">) => {
    await addDoctor(newDocData);
    // Purge Vercel Edge Cache on-demand for doctors catalog
    await revalidateDoctorsCatalogAction();
    showNotice("New doctor added successfully and is now live on the Home page!");
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Top Admin Header */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-500 text-slate-950">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Pronto Admin Operations Desk</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
              Live Cloud Aggregation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time daily booking metrics, doctor directory management &amp; zero-queue clinic control.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-2xl self-start sm:self-auto border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab("sales")}
            className={`py-2 px-4 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "sales"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Today&apos;s Sales &amp; Bookings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("doctors")}
            className={`py-2 px-4 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "doctors"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor Catalog ({doctorsList.length})</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {activeTab === "sales" ? (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-150 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Date:</span>
                <input
                  type="date"
                  value={todayDate}
                  onChange={(e) => setTodayDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Filter By Doctor Dropdown */}
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>Doctor Filter:</span>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Doctors (Overall)</option>
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialty.split("&")[0]})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadMetricsAndAppointments(todayDate, selectedDoctorId)}
              className="py-1.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Live Data</span>
            </button>
          </div>

          {/* 3 Metric Summary Cards (Server-Side Aggregations) */}
          <AdminKpiCards
            selectedDoctorId={selectedDoctorId}
            overallMetrics={overallMetrics}
            doctorMetrics={doctorMetrics}
          />

          {/* Today's Bookings Table / Feed */}
          <AdminBookingsTable
            appointments={appointments}
            isLoading={isLoadingAppointments}
            todayDate={todayDate}
            selectedDoctorId={selectedDoctorId}
            onClearDoctorFilter={() => setSelectedDoctorId("all")}
            onStatusChange={handleStatusChange}
          />
        </div>
      ) : (
        <AdminDoctorCatalog
          doctorsList={doctorsList}
          onOpenAddModal={() => setIsAddDoctorModalOpen(true)}
          onToggleDoctor={handleToggleDoctor}
        />
      )}

      {/* Add New Doctor Modal */}
      <AddDoctorModal
        isOpen={isAddDoctorModalOpen}
        onClose={() => setIsAddDoctorModalOpen(false)}
        onAddDoctor={handleAddDoctor}
      />
    </div>
  );
}
