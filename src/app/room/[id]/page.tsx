import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getAppointmentById } from "@/lib/appointmentsService";
import { PatientRoomClient } from "@/app/room/components/PatientRoomClient";

export const instant = false;

interface PatientRoomPageProps {
  params: Promise<{ id: string }>;
}

async function PatientRoomData({ params }: PatientRoomPageProps) {
  await connection();
  const { id } = await params;
  const appointment = await getAppointmentById(id);

  if (!appointment) {
    notFound();
  }

  return <PatientRoomClient appointment={appointment} />;
}

export default function PatientRoomPage({ params }: PatientRoomPageProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500 animate-pulse">Connecting to LiveSehat Room...</div>}>
      <PatientRoomData params={params} />
    </Suspense>
  );
}

