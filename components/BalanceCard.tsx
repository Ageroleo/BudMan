"use client";

import React, { useState, useEffect } from "react";
import { useCurrency, formatCurrency } from "@/lib/format";

interface BalanceCardProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  currentMonthLabel: string;
  accountName?: string;
}

const PRIVACY_KEY = "budman_privacy_masked";

export function BalanceCard({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  currentMonthLabel,
  accountName,
}: BalanceCardProps) {
  const currency = useCurrency();
  const [isMasked, setIsMasked] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(PRIVACY_KEY);
      if (stored === "true") setIsMasked(true);
    }
  }, []);

  const toggleMask = () => {
    const next = !isMasked;
    setIsMasked(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(PRIVACY_KEY, String(next));
    }
  };

  const monthShort = currentMonthLabel.split(" ")[0] || "Month";

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2b3c2e] via-[#233325] to-[#1c291e] text-[#f0f6ef] border border-[#3d5341] shadow-lg shadow-[#1e2920]/25 p-6 sm:p-7 transition-all">
      {/* Background ambient lighting */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#6b8c65]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#354938]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
        {/* Header row: Label + Privacy text toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#c9dec8]">
              {accountName ? `${accountName} Balance` : "Total Balance"}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#82a47b] animate-pulse" />
          </div>

          <button
            type="button"
            onClick={toggleMask}
            aria-label={isMasked ? "Show Balance" : "Hide Balance"}
            title={isMasked ? "Reveal balance" : "Mask balance for privacy"}
            className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-[#354938] hover:bg-[#3d5341] border border-[#4a634e] text-[#f3f7f2] transition-all text-xs font-semibold"
          >
            <span>{isMasked ? "Show" : "Hide"}</span>
          </button>
        </div>

        {/* Big Display Figure */}
        <div className="py-1">
          <div
            className={`text-4xl sm:text-5xl font-black tracking-tight text-[#f3f7f2] tabular-nums transition-all ${
              isMasked ? "privacy-blur select-none" : ""
            }`}
          >
            {isMasked ? `${currency}••••••` : formatCurrency(totalBalance, currency)}
          </div>
        </div>

        {/* Two Pill Badges: Income & Spent */}
        <div className="pt-4 border-t border-[#3d5341]/60 grid grid-cols-2 gap-3">
          {/* Income Pill */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#354938] text-[#c9dec8] border border-[#425a46] hover:border-[#526f57] transition-colors">
            <div className="w-8 h-8 rounded-xl bg-[#283c2c] border border-[#425a46] flex items-center justify-center shrink-0 text-[#82a47b] font-bold text-sm">
              +
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-[#c9dec8] block truncate">
                Income ({monthShort})
              </span>
              <span
                className={`text-sm font-bold text-[#9ece98] tabular-nums block truncate ${
                  isMasked ? "privacy-blur select-none" : ""
                }`}
              >
                {isMasked
                  ? "+••••"
                  : `+${formatCurrency(monthlyIncome, currency)}`}
              </span>
            </div>
          </div>

          {/* Spent Pill */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#354938] text-[#c9dec8] border border-[#425a46] hover:border-[#526f57] transition-colors">
            <div className="w-8 h-8 rounded-xl bg-[#3a2c2c] border border-[#524040] flex items-center justify-center shrink-0 text-[#e89b92] font-bold text-sm">
              -
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-[#c9dec8] block truncate">
                Spent ({monthShort})
              </span>
              <span
                className={`text-sm font-bold text-[#e89b92] tabular-nums block truncate ${
                  isMasked ? "privacy-blur select-none" : ""
                }`}
              >
                {isMasked
                  ? "-••••"
                  : `-${formatCurrency(monthlyExpenses, currency)}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
