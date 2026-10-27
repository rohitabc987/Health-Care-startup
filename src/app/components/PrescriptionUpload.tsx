"use client";

import React, { useState, useRef, useEffect } from "react";
import { uploadPrescriptionPhoto, PrescriptionRecord, INITIAL_DOCTORS } from "@/lib/firebase";
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  User, 
  X, 
  AlertCircle,
  Eye,
  Sparkles,
  ShieldCheck
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
  const [chiefComplaint, setChiefComplaint] = useState("Doctor consultation & prescription record");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    setVisitDate(new Date().toISOString().split("T")[0]);
  }, []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setUploadSuccess(false);
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
        chiefComplaint,
      });

      setIsUploading(false);
      setUploadSuccess(true);
      onUploadSuccess(record);

      // Reset after a brief moment
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadSuccess(false);
      }, 2500);
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
    <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">
              Upload Prescription / Medical Slip
            </h3>
            <p className="text-[11px] text-gray-400">Ground Team & Patient Quick Upload</p>
          </div>
        </div>
        <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-100">
          Camera Ready
        </span>
      </div>

      {/* Hidden file inputs for direct camera vs gallery */}
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
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {!previewUrl ? (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-gray-200 hover:border-emerald-400 rounded-2xl p-5 text-center transition-all bg-gray-50/50">
            <div className="w-12 h-12 bg-white rounded-full shadow-xs flex items-center justify-center mx-auto text-emerald-600 mb-2.5">
              <Upload className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-gray-800">
              Take a photo or choose from files
            </h4>
            <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto">
              Upload your prescription slip, diagnostic report, or clinic slip so your doctor has your complete health records.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-4">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Open Phone Camera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Upload From Gallery</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Encrypted & stored in compliant Firebase Storage vault</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUploadSubmit} className="space-y-3.5 animate-in fade-in duration-200">
          {/* Preview Image Slot */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 max-h-56 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Prescription Preview"
              className="w-full h-52 object-contain bg-slate-900/5"
            />
            <button
              type="button"
              onClick={clearSelection}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 bg-emerald-900/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs font-mono">
              Ready to submit
            </div>
          </div>

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Consulting Doctor
              </label>
              <select
                value={doctorName}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-medium text-gray-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {INITIAL_DOCTORS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.specialty})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Check-up Date
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-medium text-gray-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              Consultation Reason / Diagnosis / Symptoms
            </label>
            <input
              type="text"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Online consultation, fever & cough, antibiotics check"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-medium text-gray-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={clearSelection}
              disabled={isUploading}
              className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold rounded-xl shadow-sm text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Uploading to Vault...
                </span>
              ) : uploadSuccess ? (
                <span className="flex items-center gap-1.5 text-white">
                  <CheckCircle2 className="w-4 h-4" />
                  Record Saved!
                </span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Save to Health Vault
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
