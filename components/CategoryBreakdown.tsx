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
import { db, type Category } from "@/lib/db";
import { useCurrency, formatCurrency } from "@/lib/format";

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
      <div className="bg-[#e5efe3]/95 border border-[#c1d5bf] p-2.5 rounded-xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.payload.color }}
          />
          <span className="text-xs font-bold text-[#213123]">{item.name}</span>
        </div>
        <div className="text-xs text-[#213123] font-semibold tabular-nums">
          {formatCurrency(item.value, currencySymbol)}
          <span className="text-[#5c755f] font-normal ml-1.5">
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
  const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 2, 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month, 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const formattedMonthLabel = useMemo(() => {
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      const date = new Date(year, month - 1, 1);
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  // Aggregate Category Expense Data
  const data = useLiveQuery(async () => {
    const [transactions, categories] = await Promise.all([
      db.transactions.toArray(),
      db.categories.toArray(),
    ]);

    const categoryMap = new Map<number, Category>();
    categories.forEach((cat) => {
      if (cat.id !== undefined) categoryMap.set(cat.id, cat);
    });

    const categoryTotals = new Map<number, number>();
    let totalSpend = 0;

    transactions.forEach((tx) => {
      if (tx.type === "expense" && tx.date.startsWith(selectedMonth)) {
        totalSpend += tx.amount;
        const current = categoryTotals.get(tx.categoryId) ?? 0;
        categoryTotals.set(tx.categoryId, current + tx.amount);
      }
    });

    const items: Array<{
      id: number;
      name: string;
      color: string;
      amount: number;
      percentage: number;
    }> = [];

    categoryTotals.forEach((amount, catId) => {
      const cat = categoryMap.get(catId);
      const percentage = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;

      items.push({
        id: catId,
        name: cat?.name ?? "Uncategorized",
        color: cat?.color ?? "#94a3b8",
        amount,
        percentage,
      });
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
      <div className="flex items-center justify-between p-2.5 bg-[#e2ede1] border border-[#c4d7c2] rounded-2xl shadow-sm">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="px-3 py-1.5 rounded-xl text-sm font-bold text-[#4f6852] hover:text-[#213123] hover:bg-[#d5e5d3] transition-colors"
          aria-label="Previous Month"
        >
          ←
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#213123] tracking-tight">
            {formattedMonthLabel}
          </span>
          {selectedMonth !== currentMonthKey && (
            <button
              type="button"
              onClick={() => setSelectedMonth(currentMonthKey)}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#d5e5d3] text-[#54734e] hover:text-[#384e34] transition-colors"
              title="Reset to current month"
            >
              Current
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="px-3 py-1.5 rounded-xl text-sm font-bold text-[#4f6852] hover:text-[#213123] hover:bg-[#d5e5d3] transition-colors"
          aria-label="Next Month"
        >
          →
        </button>
      </div>

      {/* Donut Chart & Center Metric */}
      <div className="relative p-5 sm:p-6 bg-[#e2ede1] border border-[#c4d7c2] rounded-[28px] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#4f6852]">
            Spending Distribution
          </h3>
          <span className="text-xs font-semibold text-[#213123] tabular-nums">
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
                  stroke="#e2ede1"
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
              <span className="text-[11px] font-medium text-[#5c755f]">Total Spent</span>
              <span className="text-lg font-extrabold text-[#213123] tabular-nums tracking-tight">
                {formatCurrency(totalSpend, currency, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-[#7d9680]">{items.length} categories</span>
            </div>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <p className="text-sm font-semibold text-[#213123]">No Expenses Recorded</p>
            <p className="text-xs text-[#5c755f] max-w-xs mt-0.5">
              No expense records found for {formattedMonthLabel}.
            </p>
          </div>
        )}
      </div>

      {/* Itemized Category List */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="px-1 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4f6852]">
              Breakdown by Category
            </span>
            <span className="text-xs text-[#5c755f]">{items.length} active</span>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-[#e2ede1] border border-[#c8dbc6] hover:bg-[#d9e7d8] rounded-2xl transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-semibold text-[#213123] truncate">
                      {item.name}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-[#213123] tabular-nums">
                      {formatCurrency(item.amount, currency)}
                    </span>
                    <span className="text-xs text-[#5c755f] font-medium ml-2 tabular-nums">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Proportion bar */}
                <div className="w-full h-1.5 bg-[#d3e3d1] rounded-full overflow-hidden">
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
