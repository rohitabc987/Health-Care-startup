"use client";

import React from "react";
import { Doctor } from "@/lib/firebase";
import { DoctorFormModal } from "./DoctorFormModal";

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDoctor: (doctor: Omit<Doctor, "id">) => void;
}

/**
 * AddDoctorModal delegates to the centralized DoctorFormModal component
 */
export function AddDoctorModal({ isOpen, onClose, onAddDoctor }: AddDoctorModalProps) {
  return (
    <DoctorFormModal
      isOpen={isOpen}
      mode="add"
      onClose={onClose}
      onSave={(doctorData) => onAddDoctor(doctorData)}
    />
  );
}
