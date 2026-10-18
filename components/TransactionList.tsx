"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Trash2, ReceiptText, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { db, type Category, type Account, type Transaction } from "@/lib/db";
import { useCurrency, formatCurrency } from "@/lib/format";
import { CategoryIcon } from "./CategoryIcon";

interface TransactionListProps {
  filterAccountId?: number | null;
}

export function TransactionList({ filterAccountId }: TransactionListProps) {
  const currency = useCurrency();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const data = useLiveQuery(async () => {
    const [transactions, categories, accounts] = await Promise.all([
      db.transactions.toArray(),
      db.categories.toArray(),
      db.accounts.toArray(),
    ]);

    const categoryMap = new Map<number, Category>();
    categories.forEach((cat) => {
      if (cat.id !== undefined) categoryMap.set(cat.id, cat);
    });

    const accountMap = new Map<number, Account>();
    accounts.forEach((acc) => {
      if (acc.id !== undefined) accountMap.set(acc.id, acc);
    });

    // Filter by account if specified
    const filtered = filterAccountId
      ? transactions.filter((tx) => tx.accountId === filterAccountId)
      : transactions;

    // Sort by date descending, then id descending
    const sorted = [...filtered].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.id ?? 0) - (a.id ?? 0);
    });

    return {
      transactions: sorted,
      categoryMap,
      accountMap,
    };
  }, [filterAccountId]);

  const handleDelete = async (id?: number) => {
    if (id === undefined) return;
    setDeletingId(id);
    try {
      await db.transactions.delete(id);
    } catch (err) {
      console.error("Failed to delete transaction:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    if (!data?.transactions) return [];

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    const groups: {
      dateKey: string;
      label: string;
      totalDayAmount: number;
      items: Transaction[];
    }[] = [];

    const groupMap = new Map<string, Transaction[]>();

    data.transactions.forEach((tx) => {
      const list = groupMap.get(tx.date) || [];
      list.push(tx);
      groupMap.set(tx.date, list);
    });

    groupMap.forEach((items, dateKey) => {
      let label = dateKey;
      if (dateKey === todayStr) {
        label = "Today";
      } else if (dateKey === yesterdayStr) {
        label = "Yesterday";
      } else {
        try {
          const [year, month, day] = dateKey.split("-").map(Number);
          const d = new Date(year, month - 1, day);
          label = d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
        } catch {
          label = dateKey;
        }
      }

      // Net daily change
      const totalDayAmount = items.reduce((acc, tx) => {
        return tx.type === "income" ? acc + tx.amount : acc - tx.amount;
      }, 0);

      groups.push({
        dateKey,
        label,
        totalDayAmount,
        items,
      });
    });

    return groups;
  }, [data?.transactions]);

  if (!data) {
    return (
      <div className="p-8 text-center bg-[#121215] rounded-3xl border border-white/[0.08] animate-pulse">
        <div className="w-8 h-8 mx-auto rounded-full bg-zinc-800 mb-2" />
        <div className="h-4 w-32 bg-zinc-800 rounded mx-auto" />
      </div>
    );
  }

  const { transactions, categoryMap, accountMap } = data;

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center rounded-[28px] bg-[#121215] border border-white/[0.08] shadow-xl">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3.5 text-emerald-400">
          <ReceiptText className="w-8 h-8 stroke-[1.75]" />
        </div>
        <h3 className="text-base font-bold text-zinc-100 mb-1">No Transactions Recorded</h3>
        <p className="text-xs text-zinc-400 max-w-xs mb-4 leading-relaxed">
          {filterAccountId
            ? "No activity recorded for this specific account yet."
            : "Tap the + button below to log your first income or expense record."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groupedTransactions.map((group) => (
        <div key={group.dateKey} className="space-y-2">
          {/* Sticky Section Header */}
          <div className="sticky top-0 z-10 py-1.5 px-3 rounded-xl bg-zinc-950/90 backdrop-blur-md border border-white/[0.05] text-xs font-semibold text-zinc-400 flex items-center justify-between shadow-sm">
            <span className="text-zinc-200 font-bold tracking-tight">{group.label}</span>
            <span
              className={`text-[11px] font-bold tabular-nums ${
                group.totalDayAmount >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {group.totalDayAmount >= 0 ? "+" : ""}
              {formatCurrency(group.totalDayAmount, currency)}
            </span>
          </div>

          {/* Group Items */}
          <div className="space-y-2">
            {group.items.map((tx) => {
              const category = categoryMap.get(tx.categoryId);
              const account = tx.accountId ? accountMap.get(tx.accountId) : undefined;
              const isExpense = tx.type === "expense";
              const isDeleting = deletingId === tx.id;

              return (
                <div
                  key={tx.id}
                  className={`group relative flex items-center justify-between p-3.5 bg-[#121215] hover:bg-[#18181d] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl transition-all shadow-sm ${
                    isDeleting ? "opacity-40 scale-95" : ""
                  }`}
                >
                  {/* Left: Category Icon & Info */}
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: category?.color ? `${category.color}18` : "#18181c",
                        borderColor: category?.color ? `${category.color}35` : "#27272a",
                        color: category?.color || "#a1a1aa",
                      }}
                    >
                      <CategoryIcon name={category?.icon || "Tag"} className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-zinc-100 truncate">
                        {tx.note || category?.name || "Transaction"}
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-500 flex-wrap">
                        <span className="font-medium text-zinc-400 truncate max-w-[100px]">
                          {category?.name || "Uncategorized"}
                        </span>

                        {/* Account Badge */}
                        {account && (
                          <>
                            <span className="text-zinc-700">•</span>
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[10px] font-semibold border"
                              style={{
                                color: account.color,
                                backgroundColor: `${account.color}15`,
                                borderColor: `${account.color}30`,
                              }}
                            >
                              <CategoryIcon name={account.icon} className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[80px]">{account.name}</span>
                            </span>
                          </>
                        )}

                        <span className="text-zinc-700">•</span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                            isExpense
                              ? "text-rose-400 bg-rose-500/10"
                              : "text-emerald-400 bg-emerald-500/10"
                          }`}
                        >
                          {isExpense ? "Expense" : "Income"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Delete Button */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`text-sm sm:text-base font-extrabold tabular-nums tracking-tight ${
                        isExpense ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {isExpense ? "-" : "+"}
                      {formatCurrency(tx.amount, currency)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDelete(tx.id)}
                      disabled={isDeleting}
                      aria-label="Delete transaction"
                      className="p-1.5 rounded-xl text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all opacity-80 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
