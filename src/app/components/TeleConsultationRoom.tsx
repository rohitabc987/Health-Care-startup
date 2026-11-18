"use client";

import React, { useRef } from "react";
import { getHmsRoomUrl } from "@/lib/hmsService";

interface TeleConsultationRoomProps {
  roomUrl?: string;
  userName: string;
  counterpartName: string;
  isDoctor?: boolean;
  onEndCall?: () => void;
  showHeader?: boolean;
}

export function TeleConsultationRoom({
  roomUrl,
  userName,
  counterpartName,
  isDoctor = false,
  showHeader = false,
}: TeleConsultationRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Clean formatted names
  const targetName =
    counterpartName && counterpartName !== "undefined"
      ? counterpartName
      : isDoctor
      ? "Patient"
      : "Doctor";
  const cleanCounterpartName = isDoctor
    ? targetName
    : targetName.startsWith("Dr.")
    ? targetName
    : `Dr. ${targetName}`;

  const autoDisplayName =
    userName && userName !== "undefined"
      ? userName
      : isDoctor
      ? "Consulting Doctor"
      : "Patient";

  // Get 100ms white-label room URL (Host for Doctor, Guest for Patient)
  const hmsIframeUrl = getHmsRoomUrl({
    roomUrl,
    isDoctor,
    userName: autoDisplayName,
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[360px] bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col select-none"
    >
      {/* Optional Top Status Bar */}
      {showHeader && (
        <div className="shrink-0 bg-slate-900/90 border-b border-white/10 p-3 flex items-center justify-between text-white z-20">
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

      {/* Main Stream Area - 100% Full Height */}
      <div className="relative flex-1 w-full h-full min-h-0 bg-slate-950 overflow-hidden">
        {/* 100ms Enterprise Zero-Watermark Iframe */}
        <iframe
          src={hmsIframeUrl}
          allow="camera *; microphone *; display-capture *; autoplay *; clipboard-write *; fullscreen *; camera; microphone; display-capture; autoplay; fullscreen"
          className="w-full h-full border-0 absolute inset-0 z-10"
          title="Tele-consultation Video Stream"
        />
      </div>
    </div>
  );
}

export default TeleConsultationRoom;
