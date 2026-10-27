"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/context/NavigationContext";
import { Stethoscope, HelpCircle } from "lucide-react";
import { ProfileDropdown } from "./ProfileDropdown";

export function DesktopHeader() {
  const pathname = usePathname();
  const { activeBookingsCount } = useNavigation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "My Bookings", href: "/bookings", count: activeBookingsCount },
    { label: "Prescription Vault", href: "/prescriptions" },
  ];

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-gray-900 tracking-tight">PRONTO</span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  Health
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium leading-none">
                Zero-Queue Clinic Follow-ups
              </p>
            </div>
          </Link>

          {/* Center: Clean Nav Bar (Text links, not enclosed in individual boxes) */}
          <nav className="flex items-center gap-8">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative py-5 text-sm transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "text-emerald-700 font-bold"
                      : "text-gray-600 hover:text-gray-900 font-medium"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {item.count}
                    </span>
                  )}
                  {/* Subtle active indicator bar */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                  )}
                </Link>
              );
            })}

            {/* Support Link */}
            <button
              type="button"
              onClick={() => alert("Pronto 24/7 Operations Helpline: 1800-PRONTO-CARE (Mon-Sun 8 AM - 10 PM)")}
              className="py-5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <span>Support</span>
            </button>
          </nav>

          {/* Right: Profile Icon ONLY (No name box in header, opens popover when clicked) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center transition-all ${
                isProfileOpen
                  ? "bg-emerald-600 text-white ring-4 ring-emerald-500/20 shadow-md"
                  : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300"
              }`}
              aria-label="Patient Profile and Menu"
            >
              RV
            </button>

            {/* Dropdown Popover (Shows Name, Phone, Bookings, Support, etc.) */}
            <ProfileDropdown
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
