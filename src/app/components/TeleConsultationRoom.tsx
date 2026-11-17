"use client";

import React, { useState } from "react";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Signal,
  Wifi,
  Sparkles,
  RefreshCw,
  ExternalLink
} from "lucide-react";

interface TeleConsultationRoomProps {
  roomUrl: string;
  userName: string;
  counterpartName: string;
  isDoctor?: boolean;
  onEndCall?: () => void;
  audioOnlyDefault?: boolean;
}

export function TeleConsultationRoom({
  roomUrl,
  userName,
  counterpartName,
  isDoctor = false,
  onEndCall,
  audioOnlyDefault = false,
}: TeleConsultationRoomProps) {
  const [isAudioOnly, setIsAudioOnly] = useState(audioOnlyDefault);
  const [networkQuality, setNetworkQuality] = useState<"good" | "fair" | "poor">("good");
  const [iframeKey, setIframeKey] = useState(1);

  // Guarantee clean name display (never "undefined")
  const targetName = counterpartName && counterpartName !== "undefined"
    ? counterpartName
    : (isDoctor ? "Patient" : "Doctor");
  const cleanCounterpartName = isDoctor
    ? targetName
    : (targetName.startsWith("Dr.") ? targetName : `Dr. ${targetName}`);

  // Construct Jitsi room URL with pre-configured parameters to streamline entry like WhatsApp
  // Prejoin page is completely bypassed; unnecessary buttons (invite, blur, settings) are stripped
  const cleanRoomBase = roomUrl.split("#")[0];
  const jitsiConfigHash = [
    `userInfo.displayName=${encodeURIComponent(userName || (isDoctor ? "Doctor" : "Patient"))}`,
    "config.prejoinConfig.enabled=false",
    "config.prejoinPageEnabled=false",
    "config.requireDisplayName=false",
    "config.disableDeepLinking=true",
    "config.hideConferenceSubject=true",
    "config.hideConferenceTimer=false",
    "config.disableInviteFunctions=true",
    "config.disableProfile=true",
    "config.enableWelcomePage=false",
    "config.enableClosePage=false",
    'config.toolbarButtons=["microphone","camera","hangup","toggle-camera"]',
    'interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","hangup","toggle-camera"]',
    "interfaceConfig.SHOW_JITSI_WATERMARK=false",
    "interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false",
    "interfaceConfig.SHOW_BRAND_WATERMARK=false",
    "interfaceConfig.SETTINGS_SECTIONS=[]",
    "interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true",
    isAudioOnly ? "config.startAudioOnly=true" : "config.startAudioOnly=false",
  ].join("&");

  const fullIframeSrc = `${cleanRoomBase}#${jitsiConfigHash}`;

  const handleRefreshConnection = () => {
    setIframeKey((prev) => prev + 1);
  };

  const toggleAudioOnly = () => {
    setIsAudioOnly((prev) => !prev);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-full min-h-[420px] sm:min-h-[500px] bg-slate-950 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col">
      {/* Top Status Bar - Minimal WhatsApp Video Call Style */}
      <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/85 via-black/40 to-transparent p-3 sm:p-4 flex items-center justify-between text-white pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="w-8 h-8 rounded-full bg-emerald-600/90 border border-emerald-400/30 flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0">
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

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* 4G Network Pill */}
          <div className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
            <Wifi className="w-3 h-3 stroke-[2.5]" />
            <span className="hidden sm:inline">4G Fast</span>
          </div>

          <button
            type="button"
            onClick={handleRefreshConnection}
            title="Reconnect video stream"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="relative flex-1 w-full h-full bg-slate-950 flex items-center justify-center">
        {isAudioOnly && (
          /* Low-Bandwidth Audio Mode Overlay */
          <div className="text-center p-6 space-y-4 max-w-xs animate-in fade-in duration-200 z-10">
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

        {/* Live Jitsi WebRTC Iframe with Direct Audio/Video */}
        <iframe
          key={iframeKey}
          src={fullIframeSrc}
          allow="camera *; microphone *; fullscreen; display-capture; autoplay"
          className={`w-full h-full border-0 absolute inset-0 ${isAudioOnly ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          title="Tele-consultation Video Stream"
        />
      </div>

      {/* Floating Bottom Quick Controls - Familiar Round WhatsApp Buttons */}
      <div className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center gap-3 px-4 pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-white/15 p-2 rounded-2xl flex items-center gap-2.5 shadow-2xl">
          {/* Low Bandwidth Audio Toggle */}
          <button
            type="button"
            onClick={toggleAudioOnly}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isAudioOnly
                ? "bg-amber-500 text-black shadow-xs font-bold"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            title="Toggle between Video and Audio-only"
          >
            {isAudioOnly ? <Signal className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAudioOnly ? "Video Mode" : "Audio-Only (Weak Signal)"}</span>
          </button>

          {/* External Browser Tab Popout */}
          <a
            href={cleanRoomBase}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Open in Full Browser Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* End Call / Leave - Distinct Red WhatsApp Call Button */}
          {onEndCall && (
            <button
              type="button"
              onClick={onEndCall}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30 cursor-pointer"
              title="Leave consultation room"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Leave Call</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

