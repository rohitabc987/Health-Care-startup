import { 
  getCachedTodaySales, 
  getCachedActiveDoctors, 
  getAppointments 
} from "@/lib/firebase";
import { AdminClient } from "./AdminClient";

// Next.js Server Component
// Micro-caches aggregate metrics and doctor catalog for fast dashboard loads
export default async function AdminPage() {
  const todayStr = new Date().toISOString().split("T")[0];

  const [initialOverallMetrics, initialDoctors, initialAppointments] = await Promise.all([
    getCachedTodaySales(todayStr),
    getCachedActiveDoctors(),
    getAppointments({ dateStr: todayStr, pageSize: 50 }),
  ]);

  return (
    <AdminClient
      initialOverallMetrics={initialOverallMetrics}
      initialDoctors={initialDoctors}
      initialAppointments={initialAppointments}
    />
  );
}
