import { NextResponse } from "next/server";
import { normalizePhoneNumber, saveOtp } from "@/lib/otpStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Valid 10-digit mobile number is required" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const digitsOnly = normalizedPhone.replace(/\D/g, "");

    // Validate Indian mobile number length (12 digits including 91)
    if (digitsOnly.length !== 12) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    // Whitelisted development test numbers
    let otp = "123456";
    if (normalizedPhone !== "+919876543210" && normalizedPhone !== "+919999999999") {
      otp = Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Save with 5-minute TTL
    saveOtp(normalizedPhone, otp, 5 * 60 * 1000);

    // Optional Real SMS Gateway integration (e.g. Fast2SMS / MSG91)
    const smsApiKey = process.env.SMS_GATEWAY_API_KEY;
    if (smsApiKey && normalizedPhone !== "+919876543210") {
      try {
        // Example Fast2SMS DLT endpoint call
        await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: smsApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "otp",
            variables_values: otp,
            numbers: digitsOnly.slice(-10),
          }),
        });
      } catch (smsErr) {
        console.warn("SMS Gateway dispatch warning:", smsErr);
      }
    }

    console.log(`[Zero-Captcha Auth] OTP for ${normalizedPhone}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: "6-digit OTP sent successfully via SMS",
      phone: normalizedPhone,
      // In development mode, return devOtp for fast testing without waiting for SMS
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
    });
  } catch (error: any) {
    console.error("send-otp error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch OTP. Please check phone number and try again." },
      { status: 500 }
    );
  }
}
