// In-memory OTP Store for Zero-Captcha Mobile Authentication
// Supports 5-minute TTL and developer whitelisted bypass numbers

interface OtpEntry {
  otp: string;
  expiresAt: number;
}

const globalForOtp = globalThis as unknown as {
  otpMap?: Map<string, OtpEntry>;
  otpCleanInterval?: NodeJS.Timeout;
};

const otpMap = globalForOtp.otpMap ?? new Map<string, OtpEntry>();
if (process.env.NODE_ENV !== "production") {
  globalForOtp.otpMap = otpMap;
}

// Clean expired OTPs periodically
if (typeof setInterval !== "undefined" && !globalForOtp.otpCleanInterval) {
  globalForOtp.otpCleanInterval = setInterval(() => {
    const now = Date.now();
    for (const [phone, entry] of otpMap.entries()) {
      if (entry.expiresAt < now) {
        otpMap.delete(phone);
      }
    }
  }, 60000);
}

export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  if (phone.startsWith("+")) {
    return phone.replace(/\s+/g, "");
  }
  return `+91${digits.slice(-10)}`;
}

export function saveOtp(phone: string, otp: string, ttlMs: number = 300000): void {
  const normalized = normalizePhoneNumber(phone);
  otpMap.set(normalized, {
    otp,
    expiresAt: Date.now() + ttlMs,
  });
}

export function verifyOtpCode(phone: string, code: string): { valid: boolean; reason?: string } {
  const normalized = normalizePhoneNumber(phone);

  // Whitelisted test credentials for instant development & QA testing
  if (
    (normalized === "+919876543210" || normalized === "+919999999999") &&
    code === "123456"
  ) {
    return { valid: true };
  }

  const entry = otpMap.get(normalized);
  if (!entry) {
    return { valid: false, reason: "No OTP found or code expired. Please request a new code." };
  }

  if (Date.now() > entry.expiresAt) {
    otpMap.delete(normalized);
    return { valid: false, reason: "OTP has expired. Please request a new code." };
  }

  if (entry.otp !== code.trim()) {
    return { valid: false, reason: "Invalid 6-digit code. Please check and retry." };
  }

  // Code verified; delete to prevent replay
  otpMap.delete(normalized);
  return { valid: true };
}
