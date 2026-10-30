"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Stethoscope, ArrowLeft, LogIn } from "lucide-react";
import { ProfileDropdown } from "./ProfileDropdown";

// The 4 primary bottom-tab root pages where back button should be hidden
const MAIN_TAB_ROUTES = ["/", "/bookings", "/prescriptions", "/profile"];

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  const isMainTab = MAIN_TAB_ROUTES.includes(pathname);
  const showBackButton = !isMainTab;
  const isLoginPage = pathname === "/login";

  const getInitials = (name?: string) => {
    if (!name) return "PT";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-150">
      <div className="max-w-7xl mx-auto px-3.5 py-2.5 flex items-center justify-between">
        {/* Left Section: Back Arrow (on subpages) + Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {showBackButton && (
            <button
              type="button"
              onClick={handleBack}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 hover:text-gray-950 hover:bg-gray-100 active:scale-95 transition-all -ml-1 cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}

          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Stethoscope className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-black text-sm text-gray-950 tracking-tight">PRONTO</span>
              <span className="ml-1 text-[9px] uppercase font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded">
                Health
              </span>
            </div>
          </Link>
        </div>

        {/* Right Section: Profile Avatar or Login Trigger or Skip */}
        {isLoginPage ? (
          <Link
            href="/"
            className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            Skip
          </Link>
        ) : !isAuthenticated ? (
          <Link
            href={`/login${pathname && pathname !== "/" ? `?redirect=${encodeURIComponent(pathname)}` : ""}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <LogIn className="w-3.5 h-3.5 stroke-[2.3]" />
            <span>Login</span>
          </Link>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMobileProfileOpen(!isMobileProfileOpen)}
              className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                isMobileProfileOpen
                  ? "bg-emerald-600 text-white ring-2 ring-emerald-500/30"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
              }`}
              aria-label="Profile and Menu"
            >
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name || "Profile"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(user?.name)
              )}
            </button>

            <ProfileDropdown
              isOpen={isMobileProfileOpen}
              onClose={() => setIsMobileProfileOpen(false)}
            />
          </div>
        )}
      </div>
    </header>
  );
}
