import { Suspense } from "react";
import { connection } from "next/server";
import { getAppointmentsServer } from "@/lib/appointmentsService";
import { DoctorConsultationClient } from "./DoctorConsultationClient";

export const instant = false;

async function DoctorConsultationData() {
  await connection();
  const initialAppointments = await getAppointmentsServer();
  return <DoctorConsultationClient initialAppointments={initialAppointments} />;
}

export default function DoctorConsultationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500 animate-pulse">Loading Doctor Consultation Desk...</div>}>
      <DoctorConsultationData />
    </Suspense>
  );
}

