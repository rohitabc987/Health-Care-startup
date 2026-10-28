import { getCachedActiveDoctors } from "@/lib/firebase";
import { HomeClient } from "./HomeClient";

// Next.js Server Component
// Served directly from Vercel Edge Cache with 0 database reads (Revalidated on-demand when Admin edits doctors)
export default async function HomePage() {
  const initialDoctors = await getCachedActiveDoctors();

  return <HomeClient initialDoctors={initialDoctors} />;
}
