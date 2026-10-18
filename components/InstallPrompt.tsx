"use client";

import React, { useEffect, useState } from "react";
import { Download, Sparkles, X, Smartphone, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// Global reference so any component can trigger the prompt
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const INSTALL_PROMPT_CHANGE_EVENT = "budman-install-prompt-change";

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (deferredPrompt && !standalone) {
      setCanInstall(true);
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
      window.dispatchEvent(new Event(INSTALL_PROMPT_CHANGE_EVENT));
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
      setCanInstall(false);
      setIsStandalone(true);
      window.dispatchEvent(new Event(INSTALL_PROMPT_CHANGE_EVENT));
    };

    const handlePromptChange = () => {
      setCanInstall(!!deferredPrompt);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener(INSTALL_PROMPT_CHANGE_EVENT, handlePromptChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener(INSTALL_PROMPT_CHANGE_EVENT, handlePromptChange);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setCanInstall(false);
        deferredPrompt = null;
      }
    } catch (err) {
      console.error("Install prompt error:", err);
    }
  };

  return { canInstall, isStandalone, isIOS, triggerInstall };
}

export function InstallBanner() {
  const { canInstall, isStandalone, isIOS, triggerInstall } = useInstallPrompt();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isStandalone || isDismissed) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <div className="mb-4 p-3.5 bg-gradient-to-r from-emerald-950/60 to-zinc-900 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/5 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
            Install BudMan App
            <span className="text-[10px] text-emerald-400 font-normal">Offline Ready</span>
          </h4>
          <p className="text-[11px] text-zinc-400 truncate">
            {isIOS ? "Tap Share then Add to Home Screen" : "Install on your home screen for instant access"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {canInstall && (
          <button
            type="button"
            onClick={triggerInstall}
            className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 text-xs font-bold flex items-center gap-1 transition-all shadow-md shadow-emerald-500/20"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            Install
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function HeaderInstallButton() {
  const { canInstall, isStandalone, triggerInstall } = useInstallPrompt();

  if (isStandalone || !canInstall) return null;

  return (
    <button
      type="button"
      onClick={triggerInstall}
      className="inline-flex items-center gap-1.5 text-xs font-bold py-1 px-2.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-all active:scale-95 shadow-sm"
      title="Install BudMan PWA"
    >
      <Download className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
      <span>Install</span>
    </button>
  );
}
