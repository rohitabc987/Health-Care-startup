"use client";

import React, { useState } from "react";
import {
  Video,
  PhoneOff,
  Signal,
  Wifi,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { getCleanVideoRoomUrl } from "@/lib/appointmentsService";

interface TeleConsultationRoomProps {
  roomUrl: string;
  userName: string;
  counterpartName: string;
  isDoctor?: boolean;
  onEndCall?: () => void;
  audioOnlyDefault?: boolean;
  showHeader?: boolean;
}

export function TeleConsultationRoom({
  roomUrl,
  userName,
  counterpartName,
  isDoctor = false,
  onEndCall,
  audioOnlyDefault = false,
  showHeader = false,
}: TeleConsultationRoomProps) {
  const [isAudioOnly, setIsAudioOnly] = useState(audioOnlyDefault);
  const [iframeKey, setIframeKey] = useState(1);

  // Automatic clean name assignment (never "undefined" or blank)
  const targetName = counterpartName && counterpartName !== "undefined"
    ? counterpartName
    : (isDoctor ? "Patient" : "Doctor");
  const cleanCounterpartName = isDoctor
    ? targetName
    : (targetName.startsWith("Dr.") ? targetName : `Dr. ${targetName}`);

  const autoDisplayName = userName && userName !== "undefined"
    ? userName
    : (isDoctor ? "Consulting Doctor" : "Patient");

  // Open zero-auth WebRTC room instance
  const sanitizedUrl = getCleanVideoRoomUrl(roomUrl);
  const cleanRoomBase = sanitizedUrl.split("#")[0];

  // Parameters to:
  // 1. Auto-assign display name without prompts (readOnlyName=true, requireDisplayName=false)
  // 2. Hide all 3rd party watermarks, icons, and logos
  // 3. Keep Doctor/Admin as moderator while locking down guest permissions for patient
  const jitsiConfigParams = [
    `userInfo.displayName=${encodeURIComponent(JSON.stringify(autoDisplayName))}`,
    `config.defaultLocalDisplayName=${encodeURIComponent(JSON.stringify(autoDisplayName))}`,
    `config.prejoinConfig.displayName=${encodeURIComponent(JSON.stringify(autoDisplayName))}`,
    "config.prejoinConfig.enabled=false",
    "config.prejoinPageEnabled=false",
    "config.requireDisplayName=false",
    "config.readOnlyName=true",
    "config.disableDeepLinking=true",
    "config.hideConferenceSubject=true",
    "config.hideConferenceTimer=false",
    "config.hideWatermark=true",
    "config.branding.displayLogo=false",
    "config.branding.logoImageUrl=''",
    "config.branding.logoClickUrl=''",
    "config.dynamicBrandingUrl=''",
    "config.brandingRoom=''",
    "interfaceConfig.SHOW_JITSI_WATERMARK=false",
    "interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false",
    "interfaceConfig.SHOW_BRAND_WATERMARK=false",
    "interfaceConfig.SHOW_POWERED_BY=false",
    "interfaceConfig.DEFAULT_LOGO_URL=''",
    "interfaceConfig.DEFAULT_WELCOME_PAGE_LOGO_URL=''",
    "interfaceConfig.JITSI_WATERMARK_LINK=''",
    "interfaceConfig.BRAND_WATERMARK_LINK=''",
    "interfaceConfig.APP_NAME='LiveSehat Tele'",
    "interfaceConfig.SETTINGS_SECTIONS=[]",
    "interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true",
    `config.toolbarButtons=${encodeURIComponent(JSON.stringify(["microphone", "camera"]))}`,
    `interfaceConfig.TOOLBAR_BUTTONS=${encodeURIComponent(JSON.stringify(["microphone", "camera"]))}`,
    isAudioOnly ? "config.startAudioOnly=true" : "config.startAudioOnly=false",
    // Moderator controls: doctor/admin can manage call, patient is restricted guest
    isDoctor ? "config.disableRemoteMute=false" : "config.disableRemoteMute=true",
    isDoctor ? "config.disableKick=false" : "config.disableKick=true",
    !isDoctor ? "config.disableInviteFunctions=true" : "config.disableInviteFunctions=false",
    !isDoctor ? "config.disableProfile=true" : "",
  ].filter(Boolean).join("&");

  const fullIframeSrc = `${cleanRoomBase}#${jitsiConfigParams}`;

  const handleRefreshConnection = () => {
    setIframeKey((prev) => prev + 1);
  };

  const toggleAudioOnly = () => {
    setIsAudioOnly((prev) => !prev);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-full min-h-[360px] bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col">
      {/* Optional Top Status Bar */}
      {showHeader && (
        <div className="shrink-0 bg-slate-900/90 border-b border-white/10 p-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 border border-emerald-400/30 flex items-center justify-center font-bold text-xs text-white shrink-0">
              {cleanCounterpartName.replace("Dr. ", "").charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs sm:text-sm font-bold tracking-tight">
                  {cleanCounterpartName}
                </span>
              </div>
              <span className="text-[10px] text-gray-300 font-medium block -mt-0.5">
                {isDoctor ? "Patient Consultation" : "Live Doctor Video Call"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Stream Area */}
      <div className="relative flex-1 w-full min-h-0 bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Live WebRTC Iframe */}
        <iframe
          key={iframeKey}
          src={fullIframeSrc}
          allow="camera *; microphone *; fullscreen; display-capture; autoplay"
          className={`w-full h-full border-0 absolute inset-0 z-0 ${isAudioOnly ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          title="Tele-consultation Video Stream"
        />

        {/* LiveSehat Clinic Shield & Brand Overlay (Rendered above iframe with z-30 to completely conceal any 3rd party watermark) */}
        <div className="absolute top-2.5 left-2.5 z-30 pointer-events-none px-3 py-1.5 bg-slate-950/95 backdrop-blur-md rounded-xl border border-white/15 flex items-center gap-2 shadow-xl min-w-[175px] h-[34px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-xs font-bold text-white tracking-tight">LiveSehat Consultation</span>
        </div>

        {isAudioOnly && (
          /* Low-Bandwidth Audio Mode Screen */
          <div className="text-center p-6 space-y-4 max-w-xs animate-in fade-in duration-200 z-20">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30 animate-pulse">
              <span className="text-2xl font-bold">{cleanCounterpartName.charAt(0)}</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{cleanCounterpartName}</h3>
              <p className="text-xs text-emerald-400 font-medium mt-0.5 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Audio-Only Mode (Saves 90% Data)</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Bottom Control Strip */}
      <div className="shrink-0 bg-slate-900 border-t border-white/10 px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2 z-10">
        {/* Left: Signal Indicator & Stream Refresh */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">4G Fast</span>
          </div>

          <button
            type="button"
            onClick={handleRefreshConnection}
            title="Reconnect video stream"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Audio-only Mode & WhatsApp-Style End Call */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAudioOnly}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isAudioOnly
                ? "bg-amber-500 text-black shadow-xs font-bold"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            }`}
            title="Toggle between Video and Audio-only mode"
          >
            {isAudioOnly ? <Signal className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAudioOnly ? "Video Mode" : "Audio-Only (Weak 4G)"}</span>
          </button>

          {onEndCall && (
            <button
              type="button"
              onClick={onEndCall}
              className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30 cursor-pointer"
              title="Leave consultation room"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Leave Call</span>
            </button>
          )}
        </div>

        {/* Right: Fullscreen / Direct Tab Popout */}
        <a
          href={cleanRoomBase}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-gray-200 hover:text-white flex items-center gap-1.5 transition-colors"
          title="Open video room in full browser tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Fullscreen</span>
        </a>
      </div>
    </div>
  );
}
export default TeleConsultationRoom;
