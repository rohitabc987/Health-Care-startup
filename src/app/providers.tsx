"use client";

import React from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { PhoneLoginModal } from "./components/PhoneLoginModal";

function GlobalLoginModal() {
  const { isLoginModalOpen, closeLoginModal } = useAuth();
  return <PhoneLoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NavigationProvider>
        {children}
        <GlobalLoginModal />
      </NavigationProvider>
    </AuthProvider>
  );
}
