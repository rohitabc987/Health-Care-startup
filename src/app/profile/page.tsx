import { getUserProfileServer } from "@/lib/firebase";
import { ProfileClient } from "./ProfileClient";

// Next.js Server Component
export default async function ProfilePage() {
  const initialUser = await getUserProfileServer();

  return <ProfileClient initialUser={initialUser} />;
}
