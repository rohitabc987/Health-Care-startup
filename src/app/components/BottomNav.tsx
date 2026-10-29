"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/context/NavigationContext";
import { Home, CalendarCheck, FileText, User, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function BottomNav() {
  const pathname = usePathname();
  const { activeBookingsCount } = useNavigation();
  const { isAuthenticated } = useAuth();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/bookings", label: "Bookings", icon: CalendarCheck, count: activeBookingsCount },
    { href: "/prescriptions", label: "Prescriptions", icon: FileText },
    isAuthenticated
      ? { href: "/profile", label: "Profile", icon: User }
      : { href: "/login", label: "Login", icon: LogIn },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 py-1.5 px-2 shadow-lg"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-150 ${isActive
                  ? "text-emerald-700"
                  : "text-gray-500 hover:text-gray-900"
                }`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-emerald-100/70 text-emerald-800" : ""
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform ${isActive ? "scale-105 stroke-[2.4]" : "stroke-[1.8]"
                      }`}
                  />
                </div>

                {/* Follow-ups Notification Badge */}
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-emerald-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                    {item.count}
                  </span>
                )}
              </div>

              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? "font-bold text-emerald-800" : "font-medium text-gray-500"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
