"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  PieChart as PieIcon,
  RotateCcw,
} from "lucide-react";
import { db, type Category } from "@/lib/db";
import { useCurrency, formatCurrency } from "@/lib/format";
import { CategoryIcon } from "./CategoryIcon";
import { useTheme } from "@/lib/theme";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      color: string;
      percentage: number;
    };
  }>;
  currencySymbol: string;
}

const CustomTooltip = ({ active, payload, currencySymbol }: TooltipProps) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-zinc-900/95 dark:bg-zinc-900/95 border border-zinc-700/80 p-2.5 rounded-xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.payload.color }}
          />
          <span className="text-xs font-bold text-zinc-100">{item.name}</span>
        </div>
        <div className="text-xs text-zinc-300 font-semibold tabular-nums">
          {formatCurrency(item.value, currencySymbol)}
          <span className="text-zinc-400 font-normal ml-1.5">
            ({item.payload.percentage.toFixed(1)}%)
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function CategoryBreakdown() {
  const currency = useCurrency();
  const { isDark } = useTheme();

  // Current month in YYYY-MM
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 2, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const formattedMonthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  // Reactive Dexie queries
  const data = useLiveQuery(async () => {
    const [transactions, categories] = await Promise.all([
      db.transactions.toArray(),
      db.categories.toArray(),
    ]);

    const categoryMap = new Map<number, Category>();
    categories.forEach((cat) => {
      if (cat.id !== undefined) categoryMap.set(cat.id, cat);
    });

    // Filter transactions for this month and type === expense
    const monthExpenses = transactions.filter(
      (tx) => tx.type === "expense" && tx.date.startsWith(selectedMonth)
    );

    const spendByCategory = new Map<number, number>();
    let totalSpend = 0;

    for (const tx of monthExpenses) {
      const current = spendByCategory.get(tx.categoryId) ?? 0;
      spendByCategory.set(tx.categoryId, current + tx.amount);
      totalSpend += tx.amount;
    }

    const items = Array.from(spendByCategory.entries()).map(([catId, amount]) => {
      const cat = categoryMap.get(catId);
      const percentage = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
      return {
        id: catId,
        name: cat?.name ?? "Other",
        color: cat?.color ?? "#a1a1aa",
        icon: cat?.icon ?? "Tag",
        amount,
        percentage,
      };
    });

    items.sort((a, b) => b.amount - a.amount);

    return {
      items,
      totalSpend,
    };
  }, [selectedMonth]);

  const items = data?.items ?? [];
  const totalSpend = data?.totalSpend ?? 0;

  return (
    <div className="space-y-5">
      {/* Period Selector Card */}
      <div className="flex items-center justify-between p-2.5 bg-[#121215] border border-white/[0.08] rounded-2xl shadow-sm">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Previous Month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-zinc-100 tracking-tight">
            {formattedMonthLabel}
          </span>
          {selectedMonth !== currentMonthKey && (
            <button
              type="button"
              onClick={() => setSelectedMonth(currentMonthKey)}
              className="p-1 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
              title="Reset to current month"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Next Month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Donut Chart & Center Metric */}
      <div className="relative p-5 sm:p-6 bg-[#121215] border border-white/[0.08] rounded-[28px] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <PieIcon className="w-3.5 h-3.5 text-emerald-400" />
            Spending Distribution
          </h3>
          <span className="text-xs font-semibold text-zinc-300 tabular-nums">
            Total: {formatCurrency(totalSpend, currency)}
          </span>
        </div>

        {items.length > 0 ? (
          <div className="relative w-full h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip currencySymbol={currency} />} />
                <Pie
                  data={items}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={96}
                  paddingAngle={3}
                  cornerRadius={4}
                  stroke={isDark ? "#121215" : "#ffffff"}
                  strokeWidth={2}
                >
                  {items.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[11px] font-medium text-zinc-400">Total Spent</span>
              <span className="text-lg font-extrabold text-white tabular-nums tracking-tight">
                {formatCurrency(totalSpend, currency, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-zinc-500">{items.length} categories</span>
            </div>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mb-2.5 text-zinc-500">
              <PieIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-300">No Expenses Recorded</p>
            <p className="text-xs text-zinc-500 max-w-xs mt-0.5">
              No expense records found for {formattedMonthLabel}.
            </p>
          </div>
        )}
      </div>

      {/* Itemized Category List */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="px-1 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Breakdown by Category
            </span>
            <span className="text-xs text-zinc-500">{items.length} active</span>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-[#121215] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl transition-colors shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 border"
                      style={{
                        backgroundColor: `${item.color}20`,
                        borderColor: `${item.color}40`,
                        color: item.color,
                      }}
                    >
                      <CategoryIcon name={item.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-200 truncate">
                      {item.name}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-zinc-100 tabular-nums">
                      {formatCurrency(item.amount, currency)}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium ml-2 tabular-nums">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Proportion bar */}
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(item.percentage, 100)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
