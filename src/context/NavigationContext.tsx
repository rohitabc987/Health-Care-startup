"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Appointment, subscribeToAppointments } from "@/lib/firebase";
import { useAuth } from "./AuthContext";

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setAppointments([]);
      return;
    }

    const unsubscribe = subscribeToAppointments(user.uid, (data) => {
      setAppointments(data);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const activeBookingsCount = user?.uid
    ? appointments.filter(
        (a) => a.status === "Pending Screening" || a.status === "Escalated to Physical Visit"
      ).length
    : 0;

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
