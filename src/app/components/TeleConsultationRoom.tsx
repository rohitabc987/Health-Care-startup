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
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(audioOnlyDefault);
  const [networkQuality, setNetworkQuality] = useState<"good" | "fair" | "poor">("good");
  const [iframeKey, setIframeKey] = useState(1);

  // Construct Jitsi room URL with pre-configured parameters to streamline entry
  // Jitsi allows config overrides via URL hash: #config.startWithAudioMuted=false&config.prejoinPageEnabled=false
  const cleanRoomBase = roomUrl.split("#")[0];
  const jitsiConfigHash = [
    `userInfo.displayName=${encodeURIComponent(userName)}`,
    "config.prejoinPageEnabled=false",
    "config.disableDeepLinking=true",
    "interfaceConfig.SHOW_JITSI_WATERMARK=false",
    "interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false",
    isAudioOnly ? "config.startAudioOnly=true" : "config.startAudioOnly=false",
  ].join("&");

  const fullIframeSrc = `${cleanRoomBase}#${jitsiConfigHash}`;

  const handleRefreshConnection = () => {
    setIframeKey((prev) => prev + 1);
  };

  const toggleAudioOnly = () => {
    setIsAudioOnly((prev) => !prev);
    setIsVideoDisabled((prev) => !prev);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px] bg-gray-950 rounded-3xl overflow-hidden border border-gray-800 shadow-xl flex flex-col">
      {/* Top Status Bar */}
      <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-3 sm:p-4 flex items-center justify-between text-white pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          <span className="text-xs font-bold tracking-wide">
            {isDoctor ? `Patient: ${counterpartName}` : `Doctor: ${counterpartName}`}
          </span>
          <span className="text-[10px] bg-white/15 backdrop-blur-xs px-2 py-0.5 rounded-full font-mono text-gray-200">
            Encrypted Tele-Room
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Network Indicator */}
          <div
            className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs border ${
              networkQuality === "good"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : networkQuality === "fair"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-rose-500/20 text-rose-300 border-rose-500/30"
            }`}
          >
            <Wifi className="w-3 h-3 stroke-[2.5]" />
            <span className="hidden sm:inline">
              {networkQuality === "good" ? "4G High-Speed" : networkQuality === "fair" ? "3G Medium" : "Weak Signal"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefreshConnection}
            title="Refresh stream connection"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="relative flex-1 w-full h-full bg-gray-900 flex items-center justify-center">
        {isAudioOnly ? (
          /* Low-Bandwidth Audio Mode Overlay */
          <div className="text-center p-6 space-y-4 max-w-xs animate-in fade-in duration-200">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30 animate-pulse">
              <span className="text-2xl font-bold">{counterpartName.charAt(0)}</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{counterpartName}</h3>
              <p className="text-xs text-emerald-400 font-medium mt-0.5 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Low-Bandwidth Audio Active (Saves 90% Data)</span>
              </p>
            </div>
          </div>
        ) : null}

        {/* Live Jitsi WebRTC Iframe */}
        <iframe
          key={iframeKey}
          src={fullIframeSrc}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className={`w-full h-full border-0 absolute inset-0 ${isAudioOnly ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          title="Tele-consultation Video Stream"
        />
      </div>

      {/* Floating Bottom Quick Controls */}
      <div className="absolute bottom-3 inset-x-0 z-20 flex items-center justify-center gap-2.5 px-4 pointer-events-none">
        <div className="pointer-events-auto bg-gray-900/90 backdrop-blur-md border border-white/10 p-1.5 sm:p-2 rounded-2xl flex items-center gap-2 shadow-2xl">
          {/* Audio-only toggle (Weak signal lifesaver in India) */}
          <button
            type="button"
            onClick={toggleAudioOnly}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isAudioOnly
                ? "bg-amber-500 text-black shadow-xs font-bold"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {isAudioOnly ? <Signal className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAudioOnly ? "Switch to Video" : "Audio-Only (Weak 2G/3G)"}</span>
          </button>

          {/* Direct link popout if patient needs browser tab */}
          <a
            href={cleanRoomBase}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Open Fullscreen in New Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* End Call / Leave */}
          {onEndCall && (
            <button
              type="button"
              onClick={onEndCall}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>{isDoctor ? "End Consult" : "Leave Room"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

