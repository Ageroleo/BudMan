"use client";

import { useEffect } from "react";
import { requestPersistentStorage } from "@/lib/storage";

export function PWARegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Automatic Persistent Storage Request
    // Asks the browser to exempt the origin from automatic eviction/purging
    requestPersistentStorage().catch((err) => {
      console.warn("[BudMan PWA] Persistent storage request encountered an issue:", err);
    });

    // Register Serwist Service Worker in production
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[BudMan PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.error("[BudMan PWA] Service Worker registration failed:", err);
        });
    }
  }, []);

  return null;
}
