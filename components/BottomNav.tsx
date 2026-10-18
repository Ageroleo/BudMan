"use client";

import React from "react";

export type NavTab = "transactions" | "analytics" | "savings" | "settings";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "transactions" as NavTab, label: "Feed" },
    { id: "analytics" as NavTab, label: "Analytics" },
    { id: "savings" as NavTab, label: "Savings" },
    { id: "settings" as NavTab, label: "Settings" },
  ];

  return (
    <nav
      aria-label="Floating Navigation Bar"
      className="fixed bottom-3 sm:bottom-4 inset-x-0 z-30 pointer-events-none flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="pointer-events-auto backdrop-blur-md bg-[#243426]/95 border border-[#384e3b] shadow-xl shadow-[#172219]/30 text-[#d0e2cf] rounded-full max-w-xs sm:max-w-sm w-full p-1.5 flex items-center justify-around gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 flex items-center justify-center py-2 px-3 rounded-full text-xs transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-[#3a523d] text-white font-bold shadow-inner"
                  : "text-[#98b896] hover:text-[#eef5ed] hover:bg-[#2e4231]/60 font-medium"
              }`}
            >
              <span className="tracking-wide uppercase text-[11px]">{tab.label}</span>

              {/* Glowing active pip */}
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#82a47b] shadow-xs shadow-[#82a47b] animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
