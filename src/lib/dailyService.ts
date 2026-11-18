/**
 * Daily.co Telemedicine Video Integration for Pronto Health / LiveSehat
 * Produces clean, 100% white-label WebRTC video consultation rooms with zero watermarks.
 */

export function getDailyDomain(): string {
  let domain = process.env.DAILY_DOMAIN || process.env.NEXT_PUBLIC_DAILY_DOMAIN || "healthcaretest.daily.co";
  domain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!domain.includes(".daily.co")) {
    domain = `${domain}.daily.co`;
  }
  return domain;
}

export function sanitizeDailyRoomName(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
  return clean.startsWith("apt-") ? clean : `apt-${clean}`;
}

export function getDailyRoomUrl(appointmentId: string): string {
  const domain = getDailyDomain();
  const roomName = sanitizeDailyRoomName(appointmentId);
  return `https://${domain}/${roomName}`;
}

/**
 * Creates or ensures the Daily.co room exists on the Daily dashboard.
 * Invoked on the server whenever an appointment room is initialized or visited.
 */
export async function createDailyRoomServer(appointmentId: string): Promise<string> {
  const apiKey = process.env.DAILY_API_KEY;
  const domain = getDailyDomain();
  const roomName = sanitizeDailyRoomName(appointmentId);
  const fallbackUrl = `https://${domain}/${roomName}`;

  if (!apiKey) {
    return fallbackUrl;
  }

  try {
    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: "public",
        properties: {
          enable_screenshare: true,
          enable_chat: false,
          enable_knocking: false,
          enable_prejoin_ui: false,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days retention
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.url || fallbackUrl;
    }

    // Room already exists (HTTP 400) or other non-fatal code
    return fallbackUrl;
  } catch (err) {
    console.warn("Daily.co API call failed, using direct room URL:", err);
    return fallbackUrl;
  }
}

