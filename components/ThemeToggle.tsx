"use client";

import React from "react";
import { useTheme } from "@/lib/theme";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme, isMounted } = useTheme();

  if (!isMounted) {
    return (
      <div
        className={`h-7 w-14 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex items-center justify-center px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 ${
        isDark
          ? "bg-[#243426] border-[#384e3b] text-[#c9dec8] hover:bg-[#2b3c2e] shadow-xs"
          : "bg-[#e2ede1] border-[#c4d7c2] text-[#213123] hover:bg-[#d5e5d3] shadow-xs"
      } ${className}`}
    >
      <span>{isDark ? "Dark" : "Light"}</span>
      {showLabel && (
        <span className="ml-1 text-[10px] font-normal opacity-70">
          mode
        </span>
      )}
    </button>
  );
}
