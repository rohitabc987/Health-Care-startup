import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { UserProfile } from "./types";
import { INITIAL_USER } from "./mockData";
import { db, isLiveFirebaseConfigured } from "@/lib/firebaseConfig";

const LOCAL_STORAGE_KEY_USER_PROFILE = "pronto_user_profile";
const userSubscribers: Array<(user: UserProfile) => void> = [];

export function getStoredUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_USER_PROFILE);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed && parsed.uid ? parsed : null;
  } catch {
    return null;
  }
}

export function clearStoredUserProfile(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY_USER_PROFILE);
    } catch (e) {
      console.error(e);
    }
  }
  userSubscribers.forEach((cb) => cb(null as any));
}

export function saveStoredUserProfile(user: UserProfile) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_USER_PROFILE, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  }
  userSubscribers.forEach((cb) => cb(user));
}

/**
 * Server-Side Fetcher for Server Components (e.g. /profile page.tsx)
 */
export async function getUserProfileServer(uid?: string): Promise<UserProfile | null> {
  if (!uid) return null;
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (err) {
      console.warn("getUserProfileServer error, fallback:", err);
    }
  }
  return null;
}

export function subscribeToUserProfile(
  uid: string | undefined,
  callback: (user: UserProfile | null) => void
): () => void {
  if (!uid) {
    callback(null);
    return () => {};
  }
  if (isLiveFirebaseConfigured && db) {
    try {
      const userDocRef = doc(db, "users", uid);
      const unsubscribe = onSnapshot(userDocRef, (snap) => {
        if (snap.exists()) {
          callback(snap.data() as UserProfile);
        } else {
          callback(getStoredUserProfile());
        }
      });
      return unsubscribe;
    } catch (err) {
      console.warn("User profile onSnapshot error, fallback to local:", err);
    }
  }

  userSubscribers.push(callback as any);
  callback(getStoredUserProfile());

  return () => {
    const idx = userSubscribers.indexOf(callback as any);
    if (idx > -1) userSubscribers.splice(idx, 1);
  };
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  const current = getStoredUserProfile() || {
    uid,
    name: data.name || "Patient",
    phone: data.phone || "",
    role: "patient" as const,
  };
  const updated: UserProfile = {
    ...current,
    ...data,
    address: {
      ...(current.address || {}),
      ...(data.address || {}),
    },
  };

  if (isLiveFirebaseConfigured && db) {
    try {
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, updated, { merge: true });
    } catch (err) {
      console.warn("Error updating user profile in Firestore:", err);
    }
  }

  saveStoredUserProfile(updated);
  return updated;
}
