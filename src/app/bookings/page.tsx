import { Suspense } from "react";
import { cookies } from "next/headers";
import { getCachedAppointments } from "@/lib/firebase";
import { BookingsClient } from "./BookingsClient";

function BookingsSkeleton() {
  return (
    <div className="w-full space-y-5 animate-pulse py-2">
      <div className="h-24 bg-gray-200/70 rounded-3xl" />
      <div className="space-y-3 pt-2">
        <div className="h-28 bg-gray-200/60 rounded-3xl" />
        <div className="h-28 bg-gray-200/60 rounded-3xl" />
      </div>
    </div>
  );
}

async function BookingsData() {
  const cookieStore = await cookies();
  const serverUid = cookieStore.get("pronto_uid")?.value;
  const initialAppointments = serverUid ? await getCachedAppointments(serverUid) : [];

  return (
    <BookingsClient 
      initialAppointments={initialAppointments} 
      serverUid={serverUid} 
    />
  );
}

// Next.js Server Component
// Prerenders static shell instantly; streams user session via Suspense
export default function BookingsPage() {
  return (
    <Suspense fallback={<BookingsSkeleton />}>
      <BookingsData />
    </Suspense>
  );
}
