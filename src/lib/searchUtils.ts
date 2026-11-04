import type { UserAddress } from "./types";

/**
 * Extracts pure 10-digit Indian phone number
 * e.g. "+91 98765 43210" -> "9876543210"
 */
export function normalizePhoneDigits(phone?: string): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "").slice(-10);
}

/**
 * Strips common doctor honorifics
 */
export function stripDoctorPrefix(name?: string): string {
  if (!name) return "";
  return name.replace(/^(dr\.?|doctor)\s+/i, "").trim();
}

/**
 * Normalizes any query input into a standard lowercase token
 * Converts extra spaces, hyphens, and removes leading "#" or "Dr."
 */
export function normalizeSearchQuery(input?: string): string {
  if (!input) return "";
  return input
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/^(dr\.?|doctor)\s+/i, "")
    .trim();
}

/**
 * Generates an array of search tokens for a Patient
 * Handles:
 * - First name, Last name, Full name ("aman", "sharma", "aman sharma", "aman_sharma")
 * - 10-digit phone number & last 5 digits ("9876543210", "43210")
 * - Health ID with and without prefix ("37141300", "ind-37141300")
 * - City and locality ("lucknow", "gomti nagar")
 */
export function generatePatientKeywords(params: {
  name?: string;
  phone?: string;
  healthId?: string;
  address?: UserAddress;
}): string[] {
  const tokenSet = new Set<string>();

  // 1. Name tokens
  if (params.name) {
    const rawName = params.name.trim().toLowerCase();
    const cleanName = stripDoctorPrefix(rawName).toLowerCase();

    // Full name variants
    if (cleanName) {
      tokenSet.add(cleanName);
      tokenSet.add(cleanName.replace(/\s+/g, "_"));
    }

    // Individual words
    const words = cleanName.split(/[\s,.\-_/&()]+/);
    words.forEach((w) => {
      const trimmed = w.trim();
      if (trimmed.length >= 2 && !["patient", "mr", "mrs", "ms"].includes(trimmed)) {
        tokenSet.add(trimmed);
      }
    });
  }

  // 2. Phone tokens (10 digits + last 5 digits)
  if (params.phone) {
    const digits = normalizePhoneDigits(params.phone);
    if (digits.length === 10) {
      tokenSet.add(digits);
      tokenSet.add(digits.slice(-5));
    }
  }

  // 3. Health ID tokens (e.g. "#IND-37141300" -> "37141300", "ind-37141300")
  if (params.healthId) {
    const raw = params.healthId.toLowerCase().trim();
    // Full clean without hash: "ind-37141300"
    const withoutHash = raw.replace(/^#/, "");
    tokenSet.add(withoutHash);

    // Pure digits: "37141300"
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 6) {
      tokenSet.add(digits);
    }
  }

  // 4. Address tokens
  if (params.address?.city) {
    const city = params.address.city.toLowerCase().trim();
    if (city.length >= 2) tokenSet.add(city);
  }
  if (params.address?.locality) {
    const locality = params.address.locality.toLowerCase().trim();
    if (locality.length >= 2) {
      tokenSet.add(locality);
      locality.split(/\s+/).forEach((w) => {
        if (w.length >= 3) tokenSet.add(w);
      });
    }
  }

  return Array.from(tokenSet);
}

/**
 * Generates an array of search tokens for a Doctor
 * Handles:
 * - Doctor name with/without "Dr." ("ananya", "sharma", "ananya sharma", "ananya_sharma")
 * - Specialty words ("cardiology", "internal", "medicine")
 * - Clinic name & area ("apollo", "gomti", "gomti nagar")
 * - Phone digits (if doctor phone is registered)
 */
export function generateDoctorKeywords(doctor: {
  name?: string;
  phone?: string;
  specialty?: string;
  clinic?: string;
}): string[] {
  const tokenSet = new Set<string>();

  // 1. Doctor name tokens
  if (doctor.name) {
    const cleanName = stripDoctorPrefix(doctor.name).toLowerCase();
    if (cleanName) {
      tokenSet.add(cleanName);
      tokenSet.add(cleanName.replace(/\s+/g, "_"));
    }
    const words = cleanName.split(/[\s,.\-_/&()]+/);
    words.forEach((w) => {
      const trimmed = w.trim();
      if (trimmed.length >= 2) tokenSet.add(trimmed);
    });
  }

  // 2. Specialty tokens
  if (doctor.specialty) {
    const spec = doctor.specialty.toLowerCase();
    tokenSet.add(spec);
    spec.split(/[\s,.\-_/&()]+/).forEach((w) => {
      const trimmed = w.trim();
      if (trimmed.length >= 3 && !["and", "the", "care"].includes(trimmed)) {
        tokenSet.add(trimmed);
      }
    });
  }

  // 3. Clinic tokens
  if (doctor.clinic) {
    const clinic = doctor.clinic.toLowerCase();
    tokenSet.add(clinic);
    clinic.split(/[\s,.\-_/&()]+/).forEach((w) => {
      const trimmed = w.trim();
      if (trimmed.length >= 3 && !["and", "the", "clinic", "hub", "hospital"].includes(trimmed)) {
        tokenSet.add(trimmed);
      }
    });
  }

  // 4. Phone tokens
  if (doctor.phone) {
    const digits = normalizePhoneDigits(doctor.phone);
    if (digits.length === 10) {
      tokenSet.add(digits);
      tokenSet.add(digits.slice(-5));
    }
  }

  return Array.from(tokenSet);
}

/**
 * Generates search tokens for an Appointment booking record
 */
export function generateAppointmentKeywords(apt: {
  patientName?: string;
  patientPhone?: string;
  patientHealthId?: string;
  doctorName?: string;
  queueBypassCode?: string;
}): string[] {
  const tokenSet = new Set<string>();

  if (apt.patientName) {
    const clean = stripDoctorPrefix(apt.patientName).toLowerCase();
    tokenSet.add(clean);
    clean.split(/[\s,.\-_/&()]+/).forEach((w) => {
      if (w.length >= 2) tokenSet.add(w);
    });
  }

  if (apt.patientPhone) {
    const digits = normalizePhoneDigits(apt.patientPhone);
    if (digits.length === 10) {
      tokenSet.add(digits);
      tokenSet.add(digits.slice(-5));
    }
  }

  if (apt.patientHealthId) {
    const raw = apt.patientHealthId.toLowerCase().trim();
    tokenSet.add(raw.replace(/^#/, ""));
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 6) tokenSet.add(digits);
  }

  if (apt.doctorName) {
    const clean = stripDoctorPrefix(apt.doctorName).toLowerCase();
    tokenSet.add(clean);
    clean.split(/[\s,.\-_/&()]+/).forEach((w) => {
      if (w.length >= 2) tokenSet.add(w);
    });
  }

  if (apt.queueBypassCode) {
    const code = apt.queueBypassCode.toLowerCase();
    tokenSet.add(code);
    const digits = code.replace(/\D/g, "");
    if (digits) tokenSet.add(digits);
  }

  return Array.from(tokenSet);
}

