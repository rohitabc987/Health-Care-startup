import { getAppointmentsServer } from "@/lib/firebase";
import { BookingsClient } from "./BookingsClient";

// Next.js Server Component
export default async function BookingsPage() {
  const initialAppointments = await getAppointmentsServer();

  return <BookingsClient initialAppointments={initialAppointments} />;
}
