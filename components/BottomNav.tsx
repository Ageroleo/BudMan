"use client";

import React from "react";
import { ReceiptText, PieChart, PiggyBank, Settings } from "lucide-react";

export type NavTab = "transactions" | "analytics" | "savings" | "settings";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "transactions" as NavTab, label: "Feed", icon: ReceiptText },
    { id: "analytics" as NavTab, label: "Analytics", icon: PieChart },
    { id: "savings" as NavTab, label: "Savings", icon: PiggyBank },
    { id: "settings" as NavTab, label: "Settings", icon: Settings },
  ];

  return (
    <nav
      aria-label="Floating Navigation Bar"
      className="fixed bottom-3 sm:bottom-4 inset-x-0 z-30 pointer-events-none flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="pointer-events-auto backdrop-blur-xl bg-zinc-900/85 border border-white/10 shadow-2xl shadow-black/80 rounded-full max-w-xs sm:max-w-sm w-full p-1.5 flex items-center justify-around gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-2.5 rounded-full transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-white/[0.08] text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10 font-bold"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] font-medium"
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>

              {/* Glowing active pip */}
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
