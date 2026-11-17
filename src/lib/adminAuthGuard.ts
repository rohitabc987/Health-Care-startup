import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserProfileServer } from "@/lib/userService";
import { UserRole } from "@/lib/types";

export interface AdminAuthSession {
  uid: string;
  role: UserRole;
  doctorId?: string;
  isSuperAdmin: boolean;
  isDoctor: boolean;
}

/**
 * Server-Side Admin Access Guard
 * Enforces role-based permissions strictly on the server before rendering or executing database reads.
 */
export async function requireAdminRole(
  currentPath: string,
  allowedRoles: Array<"super_admin" | "doctor"> = ["super_admin"]
): Promise<AdminAuthSession> {
  const cookieStore = await cookies();
  const uid = cookieStore.get("pronto_uid")?.value;
  let role = (cookieStore.get("pronto_role")?.value as UserRole) || "patient";
  const doctorId = cookieStore.get("pronto_doctor_id")?.value;

  // 1. Unauthenticated visitors are sent to login with return redirect
  if (!uid) {
    redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  // 2. Authoritative database verification
  const dbUser = await getUserProfileServer(uid);
  if (dbUser?.role === "super_admin") {
    role = "super_admin";
  } else if (dbUser?.role === "doctor") {
    role = "doctor";
  } else if (dbUser?.role) {
    role = dbUser.role as UserRole;
  }

  const isSuperAdmin = role === "super_admin";
  const isDoctor = role === "doctor";

  // 3. Doctor routing rule: If doctor tries to access /admin (main hub), route directly to /admin/booking
  if (isDoctor && currentPath === "/admin") {
    redirect("/admin/booking");
  }

  // 4. Role authorization check: If user's role is not allowed, reject with unauthorized
  if (!allowedRoles.includes(role as "super_admin" | "doctor")) {
    redirect("/unauthorized");
  }

  return {
    uid,
    role,
    doctorId,
    isSuperAdmin,
    isDoctor,
  };
}

