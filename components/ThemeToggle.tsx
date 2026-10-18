"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme, isMounted } = useTheme();

  // Until mounted on client, render a placeholder button with matching dimensions
  if (!isMounted) {
    return (
      <div
        className={`w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] ${className}`}
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
      className={`relative inline-flex items-center justify-center p-2 rounded-full border transition-all duration-200 active:scale-95 group ${
        isDark
          ? "bg-zinc-900/90 border-white/[0.08] text-amber-300 hover:bg-zinc-800 hover:border-amber-400/40 hover:text-amber-200 shadow-sm"
          : "bg-white border-zinc-200 text-amber-500 hover:bg-zinc-50 hover:border-amber-500/40 shadow-sm shadow-zinc-900/5"
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-zinc-700 transition-transform duration-300 group-hover:-rotate-12" />
      )}

      {showLabel && (
        <span className="ml-2 text-xs font-semibold">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
