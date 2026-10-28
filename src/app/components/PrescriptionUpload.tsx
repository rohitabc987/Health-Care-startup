"use client";

import React, { useState, useRef, useEffect } from "react";
import { uploadPrescriptionPhoto, PrescriptionRecord, INITIAL_DOCTORS } from "@/lib/firebase";
import { revalidatePatientDataAction } from "@/app/actions/cacheActions";
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  X, 
  ShieldCheck,
  Calendar,
  User,
  FileText
} from "lucide-react";

interface PrescriptionUploadProps {
  patientUid: string;
  onUploadSuccess: (record: PrescriptionRecord) => void;
}

export function PrescriptionUpload({ patientUid, onUploadSuccess }: PrescriptionUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState(INITIAL_DOCTORS[0].name);
  const [clinicName, setClinicName] = useState(INITIAL_DOCTORS[0].clinic);
  const [visitDate, setVisitDate] = useState("2026-10-25");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setVisitDate(new Date().toISOString().split("T")[0]);
  }, []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleIncomingFile = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadSuccess(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleIncomingFile(file);
    }
  };

  const handleDoctorChange = (docName: string) => {
    setDoctorName(docName);
    const found = INITIAL_DOCTORS.find((d) => d.name === docName);
    if (found) {
      setClinicName(found.clinic);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const record = await uploadPrescriptionPhoto(selectedFile, patientUid, {
        doctorName,
        clinicName,
        visitDate,
        chiefComplaint: chiefComplaint.trim() || "Consultation prescription",
      });

      setIsUploading(false);
      setUploadSuccess(true);
      // On-demand purge cached patient prescriptions & bookings
      await revalidatePatientDataAction(patientUid);
      onUploadSuccess(record);

      setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadSuccess(false);
        setChiefComplaint("");
      }, 2000);
    } catch (err) {
      console.error("Prescription upload error:", err);
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Camera className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 leading-tight">
            Upload Prescription
          </h3>
          <p className="text-[11px] text-gray-400">Add a new clinic slip to your profile</p>
        </div>
      </div>

      {/* Hidden inputs for camera vs gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {!previewUrl ? (
        <div className="space-y-3">
          {/* Dashed Drag-and-Drop Zone */}
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) {
                handleIncomingFile(file);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all ${
              isDragging
                ? "border-emerald-500 bg-emerald-50/80 scale-[1.01]"
                : "border-gray-200 hover:border-emerald-400 bg-gray-50/50"
            }`}
          >
            <div className="w-10 h-10 bg-white rounded-full shadow-xs flex items-center justify-center mx-auto text-emerald-600 mb-2">
              <Upload className="w-5 h-5" />
            </div>

            <h4 className="text-xs font-bold text-gray-800">
              {isDragging ? "Drop your prescription here" : "Snapshot paper prescription"}
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs mx-auto">
              Take a photo of your slip, drag &amp; drop files, or choose from phone
            </p>

            {/* Two Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3.5">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 bg-white border border-gray-300 hover:bg-gray-50 active:scale-95 text-gray-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs"
              >
                <Upload className="w-4 h-4 text-gray-500" />
                <span>From Files</span>
              </button>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Private & securely stored with your consulting doctors</span>
          </p>
        </div>
      ) : (
        <form onSubmit={handleUploadSubmit} className="space-y-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-bold text-gray-800">Review &amp; Save Slip</span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Change</span>
            </button>
          </div>

          {/* Photo Thumbnail Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 h-40 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Prescription preview"
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              onClick={clearSelection}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
              aria-label="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Consulting Doctor
              </label>
              <select
                value={doctorName}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {INITIAL_DOCTORS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.specialty})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Visit Date
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g. Fever, Follow-up"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={clearSelection}
              disabled={isUploading}
              className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
            >
              {isUploading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Saving Slip...
                </span>
              ) : uploadSuccess ? (
                <span className="flex items-center gap-1 text-white">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Prescription Saved!
                </span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save Prescription
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


