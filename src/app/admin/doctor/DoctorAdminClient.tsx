"use client";

import React, { useState, useEffect } from "react";
import { Doctor, subscribeToDoctors } from "@/lib/firebase";
import { 
  addDoctorServerAction, 
  toggleDoctorStatusServerAction, 
  updateDoctorServerAction 
} from "@/app/actions/doctorActions";
import { AdminNavHeader } from "../components/AdminNavHeader";
import { AdminDoctorCatalog } from "../components/AdminDoctorCatalog";
import { AddDoctorModal } from "../components/AddDoctorModal";
import { EditDoctorModal } from "../components/EditDoctorModal";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { UserRole } from "@/lib/types";

interface DoctorAdminClientProps {
  initialDoctors: Doctor[];
  userRole?: UserRole;
  currentDoctorId?: string;
}

export function DoctorAdminClient({
  initialDoctors,
  userRole = "super_admin",
  currentDoctorId,
}: DoctorAdminClientProps) {
  const isDoctor = userRole === "doctor";
  const [doctorsList, setDoctorsList] = useState<Doctor[]>(initialDoctors);
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToDoctors((docs) => {
      setDoctorsList(docs);
    });
    return () => unsub();
  }, []);

  const showNotice = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handleToggleDoctor = async (docId: string, currentStatus?: boolean) => {
    const nextStatus = currentStatus === false ? true : false;
    const res = await toggleDoctorStatusServerAction(docId, nextStatus);
    if (!res.success) {
      showError(res.error || "Failed to update doctor visibility.");
      return;
    }
    showNotice(
      `Doctor visibility updated to: ${nextStatus ? "Active on Patient Home" : "Hidden from Patient Home"}`
    );
  };

  const handleAddDoctor = async (newDocData: Omit<Doctor, "id">) => {
    const res = await addDoctorServerAction(newDocData);
    if (!res.success) {
      showError(res.error || "Failed to add doctor.");
      throw new Error(res.error || "Failed to add doctor.");
    }
    showNotice("New doctor successfully registered and published live to Pronto Health!");
  };

  const handleUpdateDoctor = async (id: string, updates: Partial<Doctor>) => {
    const res = await updateDoctorServerAction(id, updates);
    if (!res.success) {
      showError(res.error || "Failed to update doctor.");
      throw new Error(res.error || "Failed to update doctor.");
    }
    showNotice("Doctor profile and schedule updated successfully!");
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

      {/* Success Notification Banner */}
      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Doctors Catalog Component */}
      <AdminDoctorCatalog
        doctorsList={doctorsList}
        onOpenAddModal={() => setIsAddDoctorModalOpen(true)}
        onEditDoctor={(doc) => setEditingDoctor(doc)}
        onToggleDoctor={handleToggleDoctor}
      />

      {/* Add Doctor Centralized Modal */}
      <AddDoctorModal
        isOpen={isAddDoctorModalOpen}
        onClose={() => setIsAddDoctorModalOpen(false)}
        onAddDoctor={handleAddDoctor}
      />

      {/* Edit Doctor Centralized Modal */}
      <EditDoctorModal
        isOpen={!!editingDoctor}
        doctor={editingDoctor}
        onClose={() => setEditingDoctor(null)}
        onSaveDoctor={handleUpdateDoctor}
      />
    </div>
  );
}
