"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  UserProfile, 
  INITIAL_USER, 
  getStoredUserProfile, 
  saveStoredUserProfile, 
  subscribeToUserProfile 
} from "@/lib/firebase";

interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (newUser: UserProfile) => void;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = getStoredUserProfile();
    setUser(stored);

    const unsub = subscribeToUserProfile(stored.uid, (updated) => {
      setUser(updated);
    });

    return () => unsub();
  }, []);

  const login = (newUser: UserProfile) => {
    saveStoredUserProfile(newUser);
    setUser(newUser);
    setIsLoginModalOpen(false);
  };

  const logout = () => {
    // Reset to demo profile or empty
    const demo = {
      ...INITIAL_USER,
      uid: "patient-guest-001",
      name: "Guest Patient",
      phone: "+91 98765 43210",
      role: "patient" as const,
    };
    saveStoredUserProfile(demo);
    setUser(demo);
  };

  const updateUser = (data: Partial<UserProfile>) => {
    const updated = {
      ...user,
      ...data,
      address: {
        ...user.address,
        ...(data.address || {}),
      },
    };
    saveStoredUserProfile(updated);
    setUser(updated);
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: isMounted && Boolean(user?.phone),
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
