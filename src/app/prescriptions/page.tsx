import { getPrescriptionsServer } from "@/lib/firebase";
import { PrescriptionsClient } from "./PrescriptionsClient";

// Next.js Server Component
export default async function PrescriptionsPage() {
  const initialPrescriptions = await getPrescriptionsServer();

  return <PrescriptionsClient initialPrescriptions={initialPrescriptions} />;
}
