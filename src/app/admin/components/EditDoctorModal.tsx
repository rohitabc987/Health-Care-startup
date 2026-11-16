"use client";

import React from "react";
import { Doctor } from "@/lib/firebase";
import { DoctorFormModal } from "./DoctorFormModal";

interface EditDoctorModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveDoctor: (id: string, updates: Partial<Doctor>) => Promise<void>;
}

/**
 * EditDoctorModal delegates to the centralized DoctorFormModal component
 */
export function EditDoctorModal({
  doctor,
  isOpen,
  onClose,
  onSaveDoctor,
}: EditDoctorModalProps) {
  return (
    <DoctorFormModal
      isOpen={isOpen}
      mode="edit"
      doctor={doctor}
      onClose={onClose}
      onSave={(updates, doctorId) => {
        if (doctorId) {
          return onSaveDoctor(doctorId, updates);
        }
      }}
    />
  );
}
