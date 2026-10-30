import { Suspense } from "react";
import { cookies } from "next/headers";
import { getCachedUserProfile } from "@/lib/firebase";
import { ProfileClient } from "./ProfileClient";

function ProfileSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse py-2">
      <div className="h-32 bg-gray-200/70 rounded-3xl" />
      <div className="h-44 bg-gray-200/60 rounded-3xl" />
    </div>
  );
}

async function ProfileData() {
  const cookieStore = await cookies();
  const serverUid = cookieStore.get("pronto_uid")?.value;
  const initialUser = serverUid ? await getCachedUserProfile(serverUid) : null;

  return (
    <ProfileClient 
      initialUser={initialUser} 
      serverUid={serverUid} 
    />
  );
}

// Next.js Server Component
// Prerenders static shell instantly; streams user session via Suspense
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileData />
    </Suspense>
  );
}
