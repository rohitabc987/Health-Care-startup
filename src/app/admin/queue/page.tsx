import { Suspense } from "react";
import { connection } from "next/server";
import { requireAdminRole } from "@/lib/adminAuthGuard";
import { getAppointmentsServer } from "@/lib/appointmentsService";
import { QueueManagerClient } from "./QueueManagerClient";

export const instant = false;

async function QueueData() {
  await connection();
  // Virtual queue runway is strictly for Super Admin operations staff.
  // Doctors and patients attempting to access it are redirected to /unauthorized.
  await requireAdminRole("/admin/queue", ["super_admin"]);
  const initialAppointments = await getAppointmentsServer();
  const plainAppointments = JSON.parse(JSON.stringify(initialAppointments));
  return <QueueManagerClient initialAppointments={plainAppointments} />;
}

export default function AdminQueuePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500 animate-pulse">Loading Live Runway Queue...</div>}>
      <QueueData />
    </Suspense>
  );
}

