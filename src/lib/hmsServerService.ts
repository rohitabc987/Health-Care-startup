import crypto from "crypto";

const DEFAULT_SUBDOMAIN = process.env.HMS_APP_SUBDOMAIN || "priyanshu-videoconf-2330";
const DEFAULT_HOST_URL =
  process.env.NEXT_PUBLIC_HMS_HOST_URL ||
  `https://${DEFAULT_SUBDOMAIN}.app.100ms.live/meeting/aze-ngxq-sqn`;
const DEFAULT_GUEST_URL =
  process.env.NEXT_PUBLIC_HMS_GUEST_URL ||
  `https://${DEFAULT_SUBDOMAIN}.app.100ms.live/meeting/vlj-txsr-shb`;

function base64Url(obj: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function generate100msManagementToken(): string | null {
  const accessKey = process.env.HMS_APP_ACCESS_KEY;
  const secret = process.env.HMS_APP_SECRET;

  if (!accessKey || !secret) {
    return null;
  }

  const header = { typ: "JWT", alg: "HS256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    access_key: accessKey,
    type: "management",
    version: 2,
    jti: crypto.randomUUID(),
    iat: now,
    nbf: now,
    exp: now + 24 * 3600, // 24 hours
  };

  const encodedHeader = base64Url(header);
  const encodedPayload = base64Url(payload);
  const signInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signInput)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signInput}.${signature}`;
}

export interface HmsRoomDetails {
  roomId: string;
  hostUrl: string;
  guestUrl: string;
}

/**
 * Creates or gets a 100ms room dynamically for an appointment.
 * Gracefully falls back to default zero-watermark room URLs if credentials are missing or API fails.
 */
export async function create100msRoomServer(appointmentId: string): Promise<HmsRoomDetails> {
  const fallback: HmsRoomDetails = {
    roomId: "default-room",
    hostUrl: DEFAULT_HOST_URL,
    guestUrl: DEFAULT_GUEST_URL,
  };

  const token = generate100msManagementToken();
  if (!token) {
    return fallback;
  }

  const subdomain = process.env.HMS_APP_SUBDOMAIN || DEFAULT_SUBDOMAIN;
  const templateId = process.env.HMS_TEMPLATE_ID || "6afc963e8485531b71b7dd09";

  try {
    const cleanId = appointmentId.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
    const roomRes = await fetch("https://api.100ms.live/v2/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `pronto-${cleanId}-${Date.now().toString(36)}`,
        description: `LiveSehat Teleconsultation for ${appointmentId}`,
        template_id: templateId,
        region: "in", // Mumbai/Delhi local Indian relays
      }),
    });

    if (!roomRes.ok) {
      console.warn("100ms room creation returned non-200, using default room URLs");
      return fallback;
    }

    const roomData = await roomRes.json();
    const roomId = roomData.id;

    // Fetch or generate room codes for host and guest
    const codesRes = await fetch(`https://api.100ms.live/v2/room-codes/room/${roomId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!codesRes.ok) {
      return fallback;
    }

    const codesData = await codesRes.json();
    const codes: Array<{ code: string; role: string }> = codesData.data || [];

    const hostCode = codes.find((c) => c.role === "host")?.code;
    const guestCode = codes.find((c) => c.role === "guest")?.code;

    const hostUrl = hostCode
      ? `https://${subdomain}.app.100ms.live/meeting/${hostCode}`
      : DEFAULT_HOST_URL;
    const guestUrl = guestCode
      ? `https://${subdomain}.app.100ms.live/meeting/${guestCode}`
      : DEFAULT_GUEST_URL;

    return {
      roomId,
      hostUrl,
      guestUrl,
    };
  } catch (err) {
    console.warn("100ms API failed, falling back to default room:", err);
    return fallback;
  }
}

