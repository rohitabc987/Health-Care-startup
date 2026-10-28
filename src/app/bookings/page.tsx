import { getCachedAppointments } from "@/lib/firebase";
import { BookingsClient } from "./BookingsClient";

// Next.js Server Component
// Uses user-scoped tagged cache for instant loading without redundant reads
export default async function BookingsPage() {
  const initialAppointments = await getCachedAppointments();

  return <BookingsClient initialAppointments={initialAppointments} />;
}
