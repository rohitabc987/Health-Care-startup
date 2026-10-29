import { NextResponse } from "next/server";
import { normalizePhoneNumber, verifyOtpCode } from "@/lib/otpStore";

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

    // Demo default name based on number or default
    const isDefaultDemoUser = normalizedPhone === "+919876543210";
    const name = isDefaultDemoUser ? "Rahul Verma" : `Patient (+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)})`;

    const userProfile = {
      uid,
      phone: normalizedPhone,
      name,
      role: "patient" as const,
      healthId,
      defaultClinic: "Apollo Clinic, Gomti Nagar",
      registeredByGroundTeam: true,
      isNewUser: !isDefaultDemoUser,
      address: isDefaultDemoUser ? {
        houseNo: "Plot 42",
        street: "Viram Khand 5",
        locality: "Gomti Nagar",
        city: "Lucknow",
        state: "Uttar Pradesh",
        pincode: "226010",
      } : undefined,
    };

    return NextResponse.json({
      success: true,
      message: "Phone verified successfully",
      user: userProfile,
    });
  } catch (error: any) {
    console.error("verify-otp error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
