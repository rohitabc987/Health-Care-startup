"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/context/NavigationContext";
import { Home, CalendarCheck, FileText, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const { activeBookingsCount } = useNavigation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/bookings", label: "Bookings", icon: CalendarCheck, count: activeBookingsCount },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-150 py-2 shadow-lg"
    >
      <div className="max-w-md mx-auto px-4 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative transition-all duration-200 flex items-center gap-1.5 py-2 px-3.5 rounded-2xl ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 font-bold shadow-2xs"
                  : "text-gray-500 hover:text-gray-900 font-medium"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-105 stroke-[2.4]" : "stroke-[1.8]"}`} />
                
                {/* Bookings Notification Badge */}
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {item.count}
                  </span>
                )}
              </div>

              <span className="text-xs">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
