"use client";

import React, { useState, useEffect, useRef } from "react";
import { Doctor } from "@/lib/firebase";
import {
  X,
  Stethoscope,
  AlertCircle,
  Upload,
  Loader2,
  Clock,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Save,
  Plus
} from "lucide-react";
import { uploadDoctorPhotoToCloudinary } from "@/lib/cloudinary";

interface DoctorFormModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  doctor?: Doctor | null;
  onClose: () => void;
  onSave: (doctorData: Omit<Doctor, "id">, doctorId?: string) => Promise<void> | void;
}

const ALL_WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatTime24to12(time24: string): string {
  if (!time24) return "05:00 PM";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  const hDisplay = h < 10 ? `0${h}` : `${h}`;
  return `${hDisplay}:${m} ${ampm}`;
}

function parseTimeTo24(timeStr?: string): { start: string; end: string } {
  if (!timeStr) return { start: "17:00", end: "20:00" };
  const parts = timeStr.split("-").map((p) => p.trim());
  if (parts.length === 2) {
    return {
      start: single12to24(parts[0], "17:00"),
      end: single12to24(parts[1], "20:00"),
    };
  }
  return { start: "17:00", end: "20:00" };
}

function single12to24(time12: string, fallback: string): string {
  const match = time12.match(/(\d+):?(\d*)\s*(AM|PM)?/i);
  if (!match) return fallback;
  let h = parseInt(match[1], 10);
  const m = match[2] ? match[2].padStart(2, "0") : "00";
  const ampm = match[3] ? match[3].toUpperCase() : (h < 8 ? "PM" : "AM");
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${h < 10 ? `0${h}` : h}:${m}`;
}

export function DoctorFormModal({
  isOpen,
  mode,
  doctor,
  onClose,
  onSave,
}: DoctorFormModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Doctor Identity & Clinic
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("General Physician & Internal Medicine");
  const [clinic, setClinic] = useState("Pronto Health Hub, Gomti Nagar");

  // Step 2: Schedule, Timings & Photo
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Wed", "Fri"]);
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("20:00");
  const [image, setImage] = useState("/images/doctor-1.jpg");

  // Step 3: Pricing & Additional Details
  const [consultationFee, setConsultationFee] = useState(500);
  const [regularFee, setRegularFee] = useState(800);
  const [experienceYears, setExperienceYears] = useState(5);
  const [rating, setRating] = useState(4.9);
  const [reviews, setReviews] = useState(120);
  const [isActive, setIsActive] = useState(true);

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (doctor && mode === "edit") {
      setName(doctor.name || "");
      setPhone(doctor.phone || "");
      setSpecialty(doctor.specialty || "General Physician & Internal Medicine");
      setClinic(doctor.clinic || "Pronto Health Hub, Gomti Nagar");

      const times = parseTimeTo24(doctor.clinicTimings);
      setStartTime(times.start);
      setEndTime(times.end);

      if (doctor.availableDays && doctor.availableDays.length > 0) {
        setSelectedDays(doctor.availableDays);
      } else if (doctor.nextAvailableDay?.includes("Daily") || doctor.nextAvailableDay?.includes("All")) {
        setSelectedDays([...ALL_WEEK_DAYS]);
      } else {
        setSelectedDays(["Mon", "Wed", "Fri"]);
      }

      setImage(doctor.image || "/images/doctor-1.jpg");
      setConsultationFee(doctor.consultationFee ?? 500);
      setRegularFee(doctor.regularFee ?? 800);
      setExperienceYears(doctor.experienceYears ?? 5);
      setRating(doctor.rating ?? 4.9);
      setReviews(doctor.reviews ?? 100);
      setIsActive(doctor.isActive !== false);
    } else {
      setName("");
      setPhone("");
      setSpecialty("General Physician & Internal Medicine");
      setClinic("Pronto Health Hub, Gomti Nagar");
      setSelectedDays(["Mon", "Wed", "Fri"]);
      setStartTime("17:00");
      setEndTime("20:00");
      setImage("/images/doctor-1.jpg");
      setConsultationFee(500);
      setRegularFee(800);
      setExperienceYears(5);
      setRating(4.9);
      setReviews(120);
      setIsActive(true);
    }
    setStep(1);
    setValidationError(null);
    setUploadError(null);
  }, [doctor, mode, isOpen]);

  if (!isOpen) return null;

  // Toggle Day
  const handleToggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Toggle All Days
  const handleToggleAllDays = () => {
    if (selectedDays.length === 7) {
      setSelectedDays([]);
    } else {
      setSelectedDays([...ALL_WEEK_DAYS]);
    }
  };

  const computeDisplaySchedule = (days: string[]): string => {
    if (days.length === 0) return "Not Scheduled";
    if (days.length === 7) return "All Days (Mon-Sun)";
    if (days.length === 6 && !days.includes("Sun")) return "Mon - Sat (Daily)";
    if (days.length === 5 && !days.includes("Sat") && !days.includes("Sun")) return "Mon - Fri";
    return days.join(", ");
  };

  const formattedClinicTimings = `${formatTime24to12(startTime)} - ${formatTime24to12(endTime)}`;

  // Step 1 Validation & Proceed to Step 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedSpecialty = specialty.trim();
    const trimmedClinic = clinic.trim();

    if (!trimmedName) {
      setValidationError("Doctor name is compulsory.");
      return;
    }

    if (!trimmedPhone) {
      setValidationError("Doctor mobile number is compulsory for portal login.");
      return;
    }

    const digits = trimmedPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      setValidationError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!trimmedSpecialty) {
      setValidationError("Specialty is compulsory.");
      return;
    }

    if (!trimmedClinic) {
      setValidationError("Clinic / Hospital name is compulsory.");
      return;
    }

    setStep(2);
  };

  // Step 2 Validation & Proceed to Step 3
  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (selectedDays.length === 0) {
      setValidationError("Please select at least one visiting day for the doctor.");
      return;
    }

    if (!startTime || !endTime) {
      setValidationError("Please set both consultation start time and end time.");
      return;
    }

    setStep(3);
  };

  // Cloudinary Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setUploadError(null);
    try {
      const uploadedUrl = await uploadDoctorPhotoToCloudinary(file);
      setImage(uploadedUrl);
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload photo to Cloudinary.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Final Form Submission from Step 3
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    setIsSubmitting(true);

    try {
      const doctorData: Omit<Doctor, "id"> = {
        name: name.trim(),
        phone: phone.trim(),
        specialty: specialty.trim(),
        clinic: clinic.trim(),
        availableDays: selectedDays,
        clinicTimings: formattedClinicTimings,
        nextAvailableDay: computeDisplaySchedule(selectedDays),
        consultationFee: Number(consultationFee) || 500,
        regularFee: Number(regularFee) || 800,
        experienceYears: Number(experienceYears) || 5,
        rating: Number(rating) || 4.9,
        reviews: Number(reviews) || 10,
        image: image || "/images/doctor-1.jpg",
        isActive,
      };

      await onSave(doctorData, doctor?.id);
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || "Failed to save doctor details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-150 space-y-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header with 3-Step Progress Indicators */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-800 shrink-0">
              <Stethoscope className="w-5 h-5 stroke-[2.5]" />
            </span>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight">
                {mode === "edit" ? "Edit Doctor Profile" : "Add Partnered Doctor"}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-block w-3 h-1.5 rounded-full transition-colors ${step >= 1 ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                  />
                  <span
                    className={`inline-block w-3 h-1.5 rounded-full transition-colors ${step >= 2 ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                  />
                  <span
                    className={`inline-block w-3 h-1.5 rounded-full transition-colors ${step === 3 ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {step === 1 && "Step 1 of 3"}
                  {step === 2 && "Step 2 of 3"}
                  {step === 3 && "Step 3 of 3"}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* ================= PAGE 1: BASIC INFORMATION ================= */}
        {step === 1 && (
          <form onSubmit={handleProceedToStep2} className="space-y-5 text-xs sm:text-sm">
            {/* Doctor Name */}
            <div>
              <label className="font-bold text-gray-800 block mb-2">
                Doctor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Vikram Sethi"
                className="w-full px-3.5 py-3 bg-white rounded-xl border border-gray-200 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            {/* Doctor Mobile */}
            <div>
              <label className="font-bold text-gray-800 block mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3.5 py-3 bg-white rounded-xl border border-gray-200 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            {/* Specialty */}
            <div>
              <label className="font-bold text-gray-800 block mb-2">
                Specialty &amp; Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. General Physician &amp; Internal Medicine"
                className="w-full px-3.5 py-3 bg-white rounded-xl border border-gray-200 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            {/* Clinic Name */}
            <div>
              <label className="font-bold text-gray-800 block mb-2">
                Clinic Name &amp; Area <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={clinic}
                onChange={(e) => setClinic(e.target.value)}
                placeholder="e.g. Pronto Health Hub, Gomti Nagar"
                className="w-full px-3.5 py-3 bg-white rounded-xl border border-gray-200 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            {/* Step 1 Footer Buttons */}
            <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all cursor-pointer text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer text-xs sm:text-sm active:scale-98"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ================= PAGE 2: SCHEDULE, TIMINGS & PHOTO ================= */}
        {step === 2 && (
          <form onSubmit={handleProceedToStep3} className="space-y-6 text-xs sm:text-sm">
            {/* Visiting Days: Standard title, clean inline without border box */}
            <div>
              <label className="font-bold text-gray-800 block mb-2.5 text-xs sm:text-sm">
                Visiting Days <span className="text-red-500">*</span>
              </label>

              {/* Row 1: All Days, Mon, Tue, Wed (4 items) */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                <button
                  type="button"
                  onClick={handleToggleAllDays}
                  className={`py-2.5 text-center rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${selectedDays.length === 7
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40"
                    }`}
                  title="Toggle all 7 days"
                >
                  All Days
                </button>
                {["Mon", "Tue", "Wed"].map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`py-2.5 text-center rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102"
                        : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40"
                        }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Row 2: Thu, Fri, Sat, Sun (4 items) */}
              <div className="grid grid-cols-4 gap-2">
                {["Thu", "Fri", "Sat", "Sun"].map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`py-2.5 text-center rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102"
                        : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40"
                        }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Active schedule: <span className="font-semibold text-emerald-800">{computeDisplaySchedule(selectedDays)}</span> ({selectedDays.length} days selected)
              </p>
            </div>

            {/* Consultation Time: Space-Efficient Start & End Time (NO border box) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-gray-800 block text-xs sm:text-sm">
                  Consultation Time<span className="text-red-500">*</span>
                </label>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60">
                  ⏰ {formattedClinicTimings}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1.5">
                <div>
                  <span className="text-xs font-medium text-gray-500 block mb-1">Start Time</span>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 block mb-1">End Time</span>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Doctor Photo with Cloudinary Upload */}
            <div className="space-y-3">
              <label className="font-bold text-gray-800 block text-xs sm:text-sm">
                Doctor Photo / Avatar
              </label>

              {/* Row 1: Preview Thumbnail & Upload Button */}
              <div className="flex items-center gap-3.5">
                {/* Preview Thumbnail */}
                <div className="relative w-15 h-15 rounded-2xl overflow-hidden border border-emerald-500/30 shrink-0 bg-gray-50 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Doctor" className="w-full h-full object-cover" />
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1 min-w-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? "Uploading..." : "Upload Photo"}</span>
                  </button>
                  <p className="text-[11px] text-gray-400 mt-1">Upload from your camera or local files</p>
                </div>
              </div>

              {/* Row 2: 'or choose from preset avatars:' and full-width dropdown below */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs text-gray-600 font-medium block">
                  or choose from preset avatars:
                </span>
                <select
                  value={image.startsWith("/images/") ? image : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      setImage(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 font-medium text-xs sm:text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-2xs"
                >
                  {!image.startsWith("/images/") && (
                    <option value="">Custom Uploaded Photo (Active)</option>
                  )}
                  <option value="/images/doctor-1.jpg">Avatar 1 (Female Specialist)</option>
                  <option value="/images/doctor-2.jpg">Avatar 2 (Male Senior Physician)</option>
                  <option value="/images/doctor-3.jpg">Avatar 3 (Female Pediatrician)</option>
                  <option value="/images/doctor-4.jpg">Avatar 4 (Male Orthopedic)</option>
                </select>
              </div>

              {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            </div>

            {/* Step 2 Footer Buttons */}
            <div className="pt-4 flex items-center justify-between gap-2.5 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer text-xs sm:text-sm active:scale-98"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ================= PAGE 3: PRICING & ADDITIONAL DETAILS ================= */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-5 text-xs sm:text-sm">
            {/* Fees Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-gray-800 block mb-2">Pronto Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-gray-800 block mb-2">Regular Clinic Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={regularFee}
                  onChange={(e) => setRegularFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Experience in Years */}
            <div>
              <label className="font-bold text-gray-800 block mb-2">Experience (Years)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Rating & Reviews */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-gray-800 block mb-2">Rating (Stars)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-gray-800 block mb-2">Reviews Count</label>
                <input
                  type="number"
                  min={0}
                  value={reviews}
                  onChange={(e) => setReviews(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Visibility on Home Page Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
              <div>
                <p className="font-bold text-gray-800 text-xs sm:text-sm">Active on Home Page</p>
                <p className="text-xs text-gray-500 mt-0.5">Patients can discover</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Step 3 Footer Buttons */}
            <div className="pt-4 flex items-center justify-between gap-2.5 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-xs sm:text-sm active:scale-98"
              >
                {mode === "edit" ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>
                  {isSubmitting
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Publish Doctor Live"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
