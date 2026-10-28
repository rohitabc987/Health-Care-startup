import { 
  getTodayOverallSales, 
  getActiveDoctorsServer, 
  getAppointments 
} from "@/lib/firebase";
import { AdminClient } from "./AdminClient";

// Next.js Server Component
export default async function AdminPage() {
  const todayStr = new Date().toISOString().split("T")[0];

  // Parallel server fetches for instant first paint
  const [initialOverallMetrics, initialDoctors, initialAppointments] = await Promise.all([
    getTodayOverallSales(todayStr),
    getActiveDoctorsServer(),
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
