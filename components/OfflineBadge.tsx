"use client";

import React, { useEffect, useState } from "react";

export function OfflineBadge() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  if (!isMounted) return null;

  return (
    <div
      aria-label={isOnline ? "Online" : "Offline • Saving locally"}
      title={isOnline ? "Online" : "Offline • Saving locally"}
      className={`inline-flex items-center gap-1.5 text-xs rounded-full border transition-all duration-300 ${
        isOnline
          ? "px-2.5 py-1 bg-[#e2ede1] dark:bg-[#1f2d21] border-[#c4d7c2] dark:border-[#384e3b] text-[#213123] dark:text-[#d0e2cf] shadow-xs"
          : "px-2.5 py-1 bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 shadow-xs shadow-amber-500/10"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline ? "bg-[#54734e] animate-pulse" : "bg-amber-400 animate-ping"
        }`}
      />
      {!isOnline && <span className="font-semibold text-[11px]">Offline</span>}
    </div>
  );
}
