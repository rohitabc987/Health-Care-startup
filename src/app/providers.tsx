"use client";

import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { PhoneLoginModal } from "./components/PhoneLoginModal";

function GlobalLoginModal() {
  const { isLoginModalOpen, closeLoginModal, loginModalOptions } = useAuth();
  return (
    <PhoneLoginModal 
      isOpen={isLoginModalOpen} 
      onClose={closeLoginModal} 
      allowSkip={loginModalOptions?.allowSkip}
      isBookingFlow={loginModalOptions?.isBookingFlow}
    />
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      // Benign navigation prefetch cancellations from Next.js router
      const reasonStr = String(event.reason?.message || event.reason || "");
      if (
        event.reason?.name === "AbortError" ||
        reasonStr.includes("AbortError") ||
        reasonStr.includes("aborted") ||
        reasonStr.includes("signal is aborted")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    };
    window.addEventListener("unhandledrejection", handleRejection, { capture: true });
    return () => window.removeEventListener("unhandledrejection", handleRejection, { capture: true });
  }, []);

  return (
    <AuthProvider>
      <NavigationProvider>
        {children}
        <GlobalLoginModal />
      </NavigationProvider>
    </AuthProvider>
  );
}
