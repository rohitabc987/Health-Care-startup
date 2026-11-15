import { Suspense } from "react";
import { connection } from "next/server";
import { getAppointmentsServer } from "@/lib/appointmentsService";
import { QueueManagerClient } from "./QueueManagerClient";

export const instant = false;

async function QueueData() {
  await connection();
  const initialAppointments = await getAppointmentsServer();
  return <QueueManagerClient initialAppointments={initialAppointments} />;
}

export default function AdminQueuePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500 animate-pulse">Loading Live Runway Queue...</div>}>
      <QueueData />
    </Suspense>
  );
}

