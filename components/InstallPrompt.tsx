"use client";

import React, { useEffect, useState } from "react";

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
    <div className="mb-4 p-3.5 bg-[#e2ede1] dark:bg-[#1c291e] border border-[#c4d7c2] dark:border-[#384e3b] rounded-2xl flex items-center justify-between gap-3 shadow-md shadow-[#54734e]/10 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src="/mascot/hero.png"
          alt="BudMan Mascot"
          className="w-11 h-14 object-contain shrink-0 drop-shadow-xs"
        />
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-[#213123] dark:text-[#f0f6ef] flex items-center gap-1.5">
            Install BudMan App
            <span className="text-[10px] text-[#54734e] dark:text-[#82a47b] font-medium">Offline Ready</span>
          </h4>
          <p className="text-[11px] text-[#5e7d59] dark:text-[#9bb897] truncate">
            {isIOS ? "Tap Share then Add to Home Screen" : "Install on your home screen for instant access"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {canInstall && (
          <button
            type="button"
            onClick={triggerInstall}
            className="py-1.5 px-3 rounded-xl bg-[#54734e] hover:bg-[#466141] active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-[#54734e]/30"
          >
            Install
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="px-2 py-1 rounded-lg text-xs font-semibold text-[#5e7d59] hover:text-[#213123] transition-colors"
          aria-label="Dismiss banner"
        >
          ✕
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
      className="inline-flex items-center text-xs font-bold py-1 px-2.5 rounded-full bg-[#dce9da] hover:bg-[#d0e3ce] dark:bg-[#263728] dark:hover:bg-[#2e4331] border border-[#c4d7c2] dark:border-[#384e3b] text-[#213123] dark:text-[#c9dec8] transition-all active:scale-95 shadow-xs"
      title="Install BudMan PWA"
    >
      <span>Install</span>
    </button>
  );
}
