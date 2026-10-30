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

    let dispatchSent = false;
    let dispatchChannel: "whatsapp" | "sms" | "dev" = "dev";
    const smsApiKey = process.env.SMS_GATEWAY_API_KEY;
    const whatsappPhoneId = process.env.FAST2SMS_WHATSAPP_PHONE_NUMBER_ID;
    const whatsappMessageId = process.env.FAST2SMS_WHATSAPP_MESSAGE_ID;
    const isTestNumber = normalizedPhone === "+919876543210" || normalizedPhone === "+919999999999";

    // 1. Try Fast2SMS Official WhatsApp Business API (No DLT Required)
    if (smsApiKey && whatsappPhoneId && whatsappMessageId && !isTestNumber) {
      try {
        const queryParams = new URLSearchParams({
          message_id: whatsappMessageId.trim(),
          phone_number_id: whatsappPhoneId.trim(),
          numbers: digitsOnly.slice(-10),
          variables_values: otp,
        });

        const waRes = await fetch(`https://www.fast2sms.com/dev/whatsapp?${queryParams.toString()}`, {
          method: "GET",
          headers: {
            authorization: smsApiKey.trim(),
          },
        });

        const waJson = await waRes.json().catch(() => null);
        if (waJson?.return === true || waJson?.status_code === 200) {
          dispatchSent = true;
          dispatchChannel = "whatsapp";
          console.log(`[Fast2SMS WhatsApp] OTP successfully dispatched to ${normalizedPhone}`);
        } else {
          console.warn("[Fast2SMS WhatsApp warning]:", waJson?.message || "WhatsApp gateway returned error", waJson);
        }
      } catch (waErr) {
        console.warn("Fast2SMS WhatsApp dispatch exception:", waErr);
      }
    }

    // 2. Fallback to Traditional SMS Gateway if WhatsApp not configured or failed
    if (!dispatchSent && smsApiKey && !isTestNumber) {
      try {
        const smsRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: smsApiKey.trim(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "otp",
            variables_values: otp,
            numbers: digitsOnly.slice(-10),
          }),
        });
        const smsJson = await smsRes.json().catch(() => null);
        if (smsJson?.return === true) {
          dispatchSent = true;
          dispatchChannel = "sms";
        } else {
          console.warn("[Fast2SMS SMS notice]:", smsJson?.message || "Gateway response not OK");
        }
      } catch (smsErr) {
        console.warn("SMS Gateway dispatch warning:", smsErr);
      }
    }

    console.log(`[Zero-Captcha Auth] OTP for ${normalizedPhone}: ${otp} (channel: ${dispatchChannel})`);

    const message = dispatchSent
      ? dispatchChannel === "whatsapp"
        ? "6-digit verification code sent to your WhatsApp"
        : "6-digit OTP sent successfully via SMS"
      : "Verification code generated";

    return NextResponse.json({
      success: true,
      channel: dispatchChannel,
      message,
      phone: normalizedPhone,
      // Provide devOtp so users and clinic staff are never locked out during setup
      devOtp: otp,
    });
  } catch (error: unknown) {
    console.error("send-otp error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch OTP. Please check phone number and try again." },
      { status: 500 }
    );
  }
}
