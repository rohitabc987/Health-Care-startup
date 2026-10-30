import { NextResponse } from "next/server";
import { normalizePhoneNumber, verifyOtpCode } from "@/lib/otpStore";
import { getUserProfileServer } from "@/lib/userService";

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

    // Determine user ID and metadata
    const digitsOnly = normalizedPhone.replace(/\D/g, "").slice(-10);
    const uid = `user-ph-${digitsOnly}`;
    const healthId = `#PRN-${digitsOnly.slice(-4)}-LKO`;

    // Check if user already exists in Firestore database
    const existingUser = await getUserProfileServer(uid);

    let userProfile;

    if (existingUser && existingUser.name && !existingUser.isNewUser && !existingUser.name.startsWith("Patient (+91")) {
      // Existing profile detected - directly log in
      userProfile = {
        ...existingUser,
        phone: normalizedPhone,
        isNewUser: false,
      };
    } else {
      const isDefaultDemoUser = normalizedPhone === "+919876543210";
      const name = isDefaultDemoUser ? "Rahul Verma" : (existingUser?.name || `Patient (+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)})`);

      userProfile = {
        uid,
        phone: normalizedPhone,
        name,
        age: existingUser?.age || (isDefaultDemoUser ? 28 : undefined),
        gender: existingUser?.gender || (isDefaultDemoUser ? "male" : undefined),
        role: "patient" as const,
        healthId: existingUser?.healthId || healthId,
        defaultClinic: existingUser?.defaultClinic || "Apollo Clinic, Gomti Nagar",
        registeredByGroundTeam: true,
        isNewUser: isDefaultDemoUser ? false : (existingUser?.isNewUser ?? true),
        address: existingUser?.address || (isDefaultDemoUser ? {
          houseNo: "Plot 42",
          street: "Viram Khand 5",
          locality: "Gomti Nagar",
          city: "Lucknow",
          state: "Uttar Pradesh",
          pincode: "226010",
        } : undefined),
      };
    }

    const response = NextResponse.json({
      success: true,
      message: "Phone verified successfully",
      user: userProfile,
    });

    response.cookies.set({
      name: "pronto_uid",
      value: uid,
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    console.error("verify-otp error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
