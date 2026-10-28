import { getCachedPrescriptions } from "@/lib/firebase";
import { PrescriptionsClient } from "./PrescriptionsClient";

// Next.js Server Component
// Uses user-scoped tagged cache for paper slips and prescriptions
export default async function PrescriptionsPage() {
  const initialPrescriptions = await getCachedPrescriptions();

  return <PrescriptionsClient initialPrescriptions={initialPrescriptions} />;
}
