import { getCachedUserProfile } from "@/lib/firebase";
import { ProfileClient } from "./ProfileClient";

// Next.js Server Component
// Uses user-scoped tagged cache for profile and address
export default async function ProfilePage() {
  const initialUser = await getCachedUserProfile();

  return <ProfileClient initialUser={initialUser} />;
}
