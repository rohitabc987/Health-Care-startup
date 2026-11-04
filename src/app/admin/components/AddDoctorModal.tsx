"use client";

import React, { useState } from "react";
import { Doctor } from "@/lib/firebase";
import { Plus } from "lucide-react";

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDoctor: (doctor: Omit<Doctor, "id">) => void;
}

export function AddDoctorModal({ isOpen, onClose, onAddDoctor }: AddDoctorModalProps) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    specialty: "General Physician & Internal Medicine",
    clinic: "Pronto Health Hub, Gomti Nagar",
    consultationFee: 500,
    regularFee: 800,
    experienceYears: "",
    rating: 4.9,
    reviews: 120,
    image: "/images/doctor-1.jpg",
    schedule: "Mon, Wed, Fri",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const daysMap: Record<string, string[]> = {
      "Mon, Wed, Fri": ["Mon", "Wed", "Fri"],
      "Tue, Thu, Sat": ["Tue", "Thu", "Sat"],
      "Mon-Sat (Daily)": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    };

    onAddDoctor({
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      specialty: form.specialty.trim(),
      clinic: form.clinic.trim(),
      consultationFee: form.consultationFee,
      regularFee: form.regularFee,
      experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
      rating: form.rating,
      reviews: form.reviews,
      image: form.image,
      isActive: true,
      availableDays: daysMap[form.schedule] || ["Mon", "Wed", "Fri"],
      nextAvailableDay: form.schedule,
    });

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-gray-150 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-gray-900">Add New Partnered Doctor</h3>
            <p className="text-xs text-gray-400">Doctor will be immediately visible on Home page</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Doctor Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Dr. Vikram Sethi"
              className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Doctor Mobile Number (Optional)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="e.g. +91 98765 00005"
              className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Specialty &amp; Sub-specialty</label>
            <input
              type="text"
              required
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              placeholder="e.g. Dermatology & Skin Care"
              className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Clinic Name &amp; Area</label>
            <input
              type="text"
              required
              value={form.clinic}
              onChange={(e) => setForm({ ...form, clinic: e.target.value })}
              placeholder="e.g. SkinWellness Clinic, Gomti Nagar"
              className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Pronto Fee (₹)</label>
              <input
                type="number"
                required
                value={form.consultationFee}
                onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Regular Fee (₹)</label>
              <input
                type="number"
                required
                value={form.regularFee}
                onChange={(e) => setForm({ ...form, regularFee: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Experience (Optional)</label>
              <input
                type="number"
                value={form.experienceYears}
                onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                placeholder="e.g. 10"
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Visiting Schedule</label>
              <select
                value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Mon, Wed, Fri">Mon, Wed, Fri</option>
                <option value="Tue, Thu, Sat">Tue, Thu, Sat</option>
                <option value="Mon-Sat (Daily)">Mon-Sat (Daily)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Doctor Photo</label>
            <select
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="/images/doctor-1.jpg">Avatar 1 (Female Specialist)</option>
              <option value="/images/doctor-2.jpg">Avatar 2 (Male Senior Physician)</option>
              <option value="/images/doctor-3.jpg">Avatar 3 (Female Pediatrician)</option>
              <option value="/images/doctor-4.jpg">Avatar 4 (Male Orthopedic)</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Doctor Live</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
