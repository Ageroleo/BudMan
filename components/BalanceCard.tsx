"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Shield } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#18181d] via-[#121215] to-[#0c0c0e] border border-white/[0.08] shadow-2xl p-6 sm:p-7 fintech-card-glow transition-all">
      {/* Background ambient lighting */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
        {/* Header row: Label + Privacy Eye toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Total Balance
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <button
            type="button"
            onClick={toggleMask}
            aria-label={isMasked ? "Show Balance" : "Hide Balance"}
            title={isMasked ? "Reveal balance" : "Mask balance for privacy"}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 transition-all text-xs"
          >
            {isMasked ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] font-medium">Hidden</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-medium">Visible</span>
              </>
            )}
          </button>
        </div>

        {/* Big Display Figure */}
        <div className="py-1">
          <div
            className={`text-4xl sm:text-5xl font-black tracking-tight text-white tabular-nums transition-all ${
              isMasked ? "privacy-blur select-none" : ""
            }`}
          >
            {isMasked ? `${currency}••••••` : formatCurrency(totalBalance, currency)}
          </div>
        </div>

        {/* Two Pill Badges: Income & Spent */}
        <div className="pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3">
          {/* Income Pill */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/20 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-zinc-400 block truncate">
                Income ({monthShort})
              </span>
              <span
                className={`text-sm font-bold text-emerald-400 tabular-nums block truncate ${
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
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-rose-500/20 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 text-rose-400">
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-zinc-400 block truncate">
                Spent ({monthShort})
              </span>
              <span
                className={`text-sm font-bold text-rose-400 tabular-nums block truncate ${
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
