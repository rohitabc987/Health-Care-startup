"use client";

import React, { useState } from "react";
import { UserAddress, UserProfile } from "@/lib/firebase";
import { MapPin, Edit3, X, Check } from "lucide-react";

interface AddressEditorCardProps {
  user: UserProfile;
  onUpdateAddress: (address: UserAddress) => void;
}

export function AddressEditorCard({ user, onUpdateAddress }: AddressEditorCardProps) {
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [addressForm, setAddressForm] = useState<UserAddress>({
    locality: user.address?.locality || "Gomti Nagar",
    city: user.address?.city || "Kanpur",
    houseNo: user.address?.houseNo || "",
    street: user.address?.street || "",
    state: user.address?.state || "",
    pincode: user.address?.pincode || "",
  });

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAddress({
      locality: addressForm.locality?.trim() || "Gomti Nagar",
      city: addressForm.city?.trim() || "Kanpur",
      houseNo: addressForm.houseNo?.trim() || undefined,
      street: addressForm.street?.trim() || undefined,
      state: addressForm.state?.trim() || undefined,
      pincode: addressForm.pincode?.trim() || undefined,
    });
    setIsEditingAddress(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-150 p-4 sm:p-5 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 leading-tight">Patient Location</h3>
            <p className="text-[11px] text-gray-400">Locality &amp; City used for clinic references &amp; screening</p>
          </div>
        </div>

        {!isEditingAddress ? (
          <button
            type="button"
            onClick={() => setIsEditingAddress(true)}
            className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingAddress(false)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Location updated successfully!</span>
        </div>
      )}

      {!isEditingAddress ? (
        <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-150 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Locality / Area:</span>
            <span className="font-semibold text-gray-900">{user?.address?.locality || "Gomti Nagar"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">City:</span>
            <span className="font-semibold text-gray-900">{user?.address?.city || "Kanpur"}</span>
          </div>
          {(user?.address?.houseNo || user?.address?.street) && (
            <div className="flex justify-between pt-1 border-t border-gray-200/60 text-gray-400">
              <span>Street / Flat (Optional):</span>
              <span className="text-gray-600 truncate max-w-[60%]">
                {[user?.address?.houseNo, user?.address?.street].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSaveAddress} className="space-y-3 pt-1 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                House / Flat / Plot #
              </label>
              <input
                type="text"
                value={addressForm.houseNo}
                onChange={(e) => setAddressForm({ ...addressForm, houseNo: e.target.value })}
                placeholder="e.g. Plot 42"
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Street / Road
              </label>
              <input
                type="text"
                value={addressForm.street}
                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                placeholder="e.g. Viram Khand 5"
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Locality / Area
              </label>
              <input
                type="text"
                value={addressForm.locality}
                onChange={(e) => setAddressForm({ ...addressForm, locality: e.target.value })}
                placeholder="e.g. Gomti Nagar"
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={addressForm.pincode}
                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                placeholder="e.g. 226010"
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                City
              </label>
              <input
                type="text"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                placeholder="e.g. Kanpur"
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                State
              </label>
              <input
                type="text"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                placeholder="e.g. Uttar Pradesh"
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditingAddress(false)}
              className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Save Address</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
