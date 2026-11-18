import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { getAppointmentById } from "@/lib/appointmentsService";
import { getUserProfileServer } from "@/lib/userService";
import { UserRole } from "@/lib/types";
import { PatientRoomClient } from "@/app/room/components/PatientRoomClient";
import { create100msRoomServer } from "@/lib/hmsServerService";

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

  // Pre-initialize 100ms room on server
  await create100msRoomServer(appointment.id);

  // Direct Secure Consultation Room Access:
  // - Patients joining via WhatsApp appointment link can join smoothly with zero-friction
  // - Doctors and Admins are recognized via their session credentials
  const cookieStore = await cookies();
  const uid = cookieStore.get("pronto_uid")?.value;

  let currentUserRole: "patient" | "doctor" | "super_admin" = "patient";
  let currentUserName = appointment.patientName || "Patient";

  if (uid) {
    let role = (cookieStore.get("pronto_role")?.value as UserRole) || "patient";
    const user = await getUserProfileServer(uid);
    if (user?.role) {
      role = user.role as UserRole;
    }

    const isSuperAdmin = role === "super_admin";
    const isDoctor = role === "doctor" && (!user?.doctorId || user.doctorId === appointment.doctorId);

    if (isSuperAdmin) {
      currentUserRole = "super_admin";
      currentUserName = "Pronto Clinic Coordinator";
    } else if (isDoctor) {
      currentUserRole = "doctor";
      currentUserName = user?.name || appointment.doctorName || "Doctor";
    } else {
      currentUserRole = "patient";
      currentUserName = appointment.patientName || user?.name || "Patient";
    }
  }

  return (
    <PatientRoomClient
      appointment={appointment}
      currentUserRole={currentUserRole}
      currentUserName={currentUserName}
    />
  );
}

export default function PatientRoomPage({ params }: PatientRoomPageProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500 animate-pulse">Connecting to Secure Consultation Room...</div>}>
      <PatientRoomData params={params} />
    </Suspense>
  );
}
