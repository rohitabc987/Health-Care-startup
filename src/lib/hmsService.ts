/**
 * 100ms Video Engine Integration for Pronto Health / LiveSehat
 * - Zero Watermarks
 * - Mumbai & Delhi Edge Relays for Ultra-Low Latency (<30ms) on Indian 4G/5G
 * - Dedicated Host (Doctor) and Guest (Patient) roles with auto display names
 */

export const DEFAULT_HMS_HOST_URL =
  process.env.NEXT_PUBLIC_HMS_HOST_URL ||
  "https://priyanshu-videoconf-2330.app.100ms.live/meeting/aze-ngxq-sqn";

export const DEFAULT_HMS_GUEST_URL =
  process.env.NEXT_PUBLIC_HMS_GUEST_URL ||
  "https://priyanshu-videoconf-2330.app.100ms.live/meeting/vlj-txsr-shb";

export interface HmsRoomOptions {
  isDoctor?: boolean;
  userName?: string;
  skipPreview?: boolean;
  roomUrl?: string;
}

export function getHmsRoomUrl(options: HmsRoomOptions = {}): string {
  const isHost = Boolean(options.isDoctor);
  let baseUrl = options.roomUrl;

  if (!baseUrl || !baseUrl.includes(".100ms.live")) {
    baseUrl = isHost
      ? (process.env.NEXT_PUBLIC_HMS_HOST_URL || DEFAULT_HMS_HOST_URL)
      : (process.env.NEXT_PUBLIC_HMS_GUEST_URL || DEFAULT_HMS_GUEST_URL);
  }

  const cleanBase = baseUrl.split("?")[0];
  const params = new URLSearchParams();

  if (options.userName) {
    params.set("name", options.userName);
  }
  if (options.skipPreview === true) {
    params.set("skip_preview", "true");
  }

  return `${cleanBase}?${params.toString()}`;
}
