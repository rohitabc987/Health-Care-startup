import { getActiveDoctorsServer } from "@/lib/firebase";
import { HomeClient } from "./HomeClient";

// Next.js Server Component
// Executes on server: fetches active doctors before rendering HTML for optimal SEO & zero client load
export default async function HomePage() {
  const initialDoctors = await getActiveDoctorsServer();

  return <HomeClient initialDoctors={initialDoctors} />;
}
