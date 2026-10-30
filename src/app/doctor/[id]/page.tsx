import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getDoctorByIdServer } from "@/lib/doctorsService";
import { DoctorProfileClient } from "./DoctorProfileClient";

export const instant = false;

interface DoctorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DoctorPageProps): Promise<Metadata> {
  const { id } = await params;
  const doctor = await getDoctorByIdServer(id);
  if (!doctor) {
    return { title: "Doctor Not Found | Pronto Health" };
  }
  return {
    title: `${doctor.name} - ${doctor.specialty} | Pronto Health`,
    description: `Book consultation with ${doctor.name} at ${doctor.clinic}.`,
  };
}

export default async function DoctorPage({ params }: DoctorPageProps) {
  await connection();
  const { id } = await params;
  const doctor = await getDoctorByIdServer(id);

  if (!doctor) {
    notFound();
  }

  return <DoctorProfileClient doctor={doctor} />;
}
