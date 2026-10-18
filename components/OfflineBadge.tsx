"use client";

import React, { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

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
          ? "px-2 py-1 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-sm"
          : "px-2.5 py-1 bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300 shadow-sm shadow-amber-500/10"
      }`}
    >
      {isOnline ? (
        <>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold">Offline • Saving locally</span>
        </>
      )}
    </div>
  );
}
