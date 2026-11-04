import { NextResponse } from "next/server";
import { normalizePhoneNumber, verifyOtpCode } from "@/lib/otpStore";
import { getUserProfileServer, generateHealthId } from "@/lib/userService";
import { INITIAL_DOCTORS } from "@/lib/mockData";
import { UserRole, UserProfile } from "@/lib/types";
import { generatePatientKeywords } from "@/lib/searchUtils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone number and 6-digit OTP code are required" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const verification = verifyOtpCode(normalizedPhone, otp);

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.reason || "Invalid OTP code" },
        { status: 400 }
      );
    }

    // Determine user ID and metadata (All-India cluster: #IND-XXXXXXXX non-guessable deterministic token)
    const digitsOnly = normalizedPhone.replace(/\D/g, "").slice(-10);
    const uid = `user-ph-${digitsOnly}`;
    const healthId = generateHealthId(normalizedPhone);

    // Role-Based Access Control resolution:
    const superAdminPhones = (process.env.SUPER_ADMIN_PHONES || "+919455768694,+919876543210")
      .split(",")
      .map((p) => normalizePhoneNumber(p.trim()));
    const isSuperAdmin = superAdminPhones.includes(normalizedPhone);

    // Check if phone matches any registered doctor
    const matchedDoctor = INITIAL_DOCTORS.find(
      (doc) => doc.phone && normalizePhoneNumber(doc.phone) === normalizedPhone
    );

    // Check if user already exists in Firestore database
    const existingUser = await getUserProfileServer(uid);

    let determinedRole: UserRole = "patient";
    let determinedDoctorId: string | undefined = undefined;

    if (isSuperAdmin) {
      determinedRole = "super_admin";
    } else if (matchedDoctor) {
      determinedRole = "doctor";
      determinedDoctorId = matchedDoctor.id;
    } else if (existingUser?.role) {
      determinedRole = existingUser.role;
      determinedDoctorId = existingUser.doctorId;
    }

    let userProfile: UserProfile;

    if (existingUser && existingUser.name && !existingUser.isNewUser && !existingUser.name.startsWith("Patient (+91")) {
      // Existing profile detected - directly log in
      userProfile = {
        ...existingUser,
        phone: normalizedPhone,
        phoneDigits: digitsOnly,
        role: determinedRole,
        doctorId: determinedDoctorId || existingUser.doctorId,
        isNewUser: false,
        searchKeywords: generatePatientKeywords({
          name: existingUser.name,
          phone: normalizedPhone,
          healthId: existingUser.healthId,
          address: existingUser.address,
        }),
      };
    } else {
      const isDefaultDemoUser = normalizedPhone === "+919876543210";
      const name = isSuperAdmin
        ? (existingUser?.name && !existingUser.name.startsWith("Patient") ? existingUser.name : "Super Admin")
        : matchedDoctor
          ? matchedDoctor.name
          : isDefaultDemoUser
            ? "Rahul Verma"
            : (existingUser?.name || `Patient (+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)})`);

      const finalHealthId = existingUser?.healthId || healthId;
      const finalAddress = existingUser?.address || (isDefaultDemoUser ? {
        locality: "Gomti Nagar",
        city: "Kanpur",
      } : undefined);

      userProfile = {
        uid,
        phone: normalizedPhone,
        phoneDigits: digitsOnly,
        name,
        age: existingUser?.age || (isDefaultDemoUser ? 28 : undefined),
        gender: existingUser?.gender || (isDefaultDemoUser ? "male" : undefined),
        role: determinedRole,
        doctorId: determinedDoctorId,
        healthId: finalHealthId,
        isNewUser: isDefaultDemoUser || isSuperAdmin || matchedDoctor ? false : (existingUser?.isNewUser ?? true),
        address: finalAddress,
        searchKeywords: generatePatientKeywords({
          name,
          phone: normalizedPhone,
          healthId: finalHealthId,
          address: finalAddress,
        }),
      };
    }

    const response = NextResponse.json({
      success: true,
      message: "Phone verified successfully",
      user: userProfile,
    });

    const maxAge = 30 * 24 * 60 * 60; // 30 days

    response.cookies.set({
      name: "pronto_uid",
      value: uid,
      path: "/",
      maxAge,
      sameSite: "lax",
    });

    response.cookies.set({
      name: "pronto_role",
      value: determinedRole,
      path: "/",
      maxAge,
      sameSite: "lax",
    });

    // Self-contained session cookie: enables 0-read server-side rendering across all pages
    response.cookies.set({
      name: "pronto_user",
      value: encodeURIComponent(JSON.stringify(userProfile)),
      path: "/",
      maxAge,
      sameSite: "lax",
    });

    if (determinedDoctorId) {
      response.cookies.set({
        name: "pronto_doctor_id",
        value: determinedDoctorId,
        path: "/",
        maxAge,
        sameSite: "lax",
      });
    }

    return response;
  } catch (error: unknown) {
    console.error("verify-otp error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
