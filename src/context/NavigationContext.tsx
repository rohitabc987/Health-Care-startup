"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Appointment, subscribeToAppointments, INITIAL_USER } from "@/lib/firebase";

export type TabType = "home" | "bookings" | "records";

interface NavigationContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeBookingsCount: number;
  appointments: Appointment[];
  refreshAppointments: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToAppointments(INITIAL_USER.uid, (data) => {
      setAppointments(data);
    });
    return () => unsubscribe();
  }, []);

  const activeBookingsCount = appointments.filter(
    (a) => a.status === "Pending Screening" || a.status === "Escalated to Physical Visit"
  ).length;

  const refreshAppointments = () => {
    // triggers subscriber notification
  };

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeBookingsCount,
        appointments,
        refreshAppointments,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
