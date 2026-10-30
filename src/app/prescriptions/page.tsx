import { Suspense } from "react";
import { cookies } from "next/headers";
import { getCachedPrescriptions } from "@/lib/firebase";
import { PrescriptionsClient } from "./PrescriptionsClient";

function PrescriptionsSkeleton() {
  return (
    <div className="w-full space-y-5 animate-pulse py-2">
      <div className="h-20 bg-gray-200/70 rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
        <div className="lg:col-span-5 h-64 bg-gray-200/60 rounded-3xl" />
        <div className="lg:col-span-7 h-64 bg-gray-200/60 rounded-3xl" />
      </div>
    </div>
  );
}

async function PrescriptionsData() {
  const cookieStore = await cookies();
  const serverUid = cookieStore.get("pronto_uid")?.value;
  const initialPrescriptions = serverUid ? await getCachedPrescriptions(serverUid) : [];

  return (
    <PrescriptionsClient 
      initialPrescriptions={initialPrescriptions} 
      serverUid={serverUid} 
    />
  );
}

// Next.js Server Component
// Prerenders static shell instantly; streams user session via Suspense
export default function PrescriptionsPage() {
  return (
    <Suspense fallback={<PrescriptionsSkeleton />}>
      <PrescriptionsData />
    </Suspense>
  );
}
