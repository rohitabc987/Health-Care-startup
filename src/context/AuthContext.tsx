"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  UserProfile, 
  getStoredUserProfile, 
  saveStoredUserProfile, 
  clearStoredUserProfile,
  subscribeToUserProfile,
  updateUserProfile 
} from "@/lib/firebase";

interface AuthContextType {
  user: UserProfile | null;
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = getStoredUserProfile();
    setUser(stored);

    // Cross-tab synchronization for long-term & concurrent tab sessions
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pronto_user_profile") {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    let unsubUser: (() => void) | undefined = undefined;
    if (stored?.uid) {
      unsubUser = subscribeToUserProfile(stored.uid, (updated) => {
        if (updated) {
          setUser(updated);
        }
      });
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      if (unsubUser) unsubUser();
    };
  }, []);

  const login = (newUser: UserProfile) => {
    saveStoredUserProfile(newUser);
    setUser(newUser);
    setIsLoginModalOpen(false);
    updateUserProfile(newUser.uid, newUser).catch((err) => {
      console.warn("Could not sync user profile to Firestore:", err);
    });
  };

  const logout = () => {
    clearStoredUserProfile();
    setUser(null);
  };

  const updateUser = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      ...data,
      address: {
        ...(user.address || {}),
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
        isAuthenticated: isMounted && Boolean(user && user.phone),
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
