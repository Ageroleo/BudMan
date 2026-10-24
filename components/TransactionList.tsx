"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, deleteTransaction, type Category, type Account, type Transaction } from "@/lib/db";
import { useCurrency, formatCurrency, formatTime } from "@/lib/format";
import { EditTransactionModal } from "./EditTransactionModal";

interface TransactionListProps {
  filterAccountId?: string | null;
}

export function TransactionList({ filterAccountId }: TransactionListProps) {
  const currency = useCurrency();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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

    const accountMap = new Map<string, Account>();
    accounts.forEach((acc) => {
      if (acc.id) accountMap.set(acc.id, acc);
    });

    // Filter by account if specified
    const filtered = filterAccountId
      ? transactions.filter((tx) => tx.accountId === filterAccountId)
      : transactions;

    // Sort by date descending, then time descending, then id descending
    const sorted = [...filtered].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      if (b.time && a.time) {
        const timeDiff = b.time.localeCompare(a.time);
        if (timeDiff !== 0) return timeDiff;
      } else if (b.time && !a.time) {
        return -1;
      } else if (!b.time && a.time) {
        return 1;
      }
      return (b.id ?? 0) - (a.id ?? 0);
    });

    return {
      transactions: sorted,
      categoryMap,
      accountMap,
    };
  }, [filterAccountId]);

  const handleDelete = async (e: React.MouseEvent, id?: number) => {
    e.stopPropagation();
    if (id === undefined) return;
    if (!confirm("Are you sure you want to delete this transaction? Account balance will be adjusted.")) return;
    setDeletingId(id);
    try {
      await deleteTransaction(id);
    } catch (err) {
      console.error("Failed to delete transaction:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    if (!data?.transactions) return [];

    const groups: {
      dateKey: string;
      label: string;
      totalDayAmount: number;
      items: Transaction[];
    }[] = [];

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    data.transactions.forEach((tx) => {
      const txDate = tx.date;
      let existingGroup = groups.find((g) => g.dateKey === txDate);

      if (!existingGroup) {
        let label = txDate;
        if (txDate === todayStr) {
          label = "Today";
        } else if (txDate === yesterdayStr) {
          label = "Yesterday";
        } else {
          try {
            const d = new Date(txDate + "T00:00:00");
            label = d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          } catch {
            label = txDate;
          }
        }

        existingGroup = {
          dateKey: txDate,
          label,
          totalDayAmount: 0,
          items: [],
        };
        groups.push(existingGroup);
      }

      existingGroup.items.push(tx);
      if (tx.type === "income") {
        existingGroup.totalDayAmount += tx.amount;
      } else {
        existingGroup.totalDayAmount -= tx.amount;
      }
    });

    return groups;
  }, [data?.transactions]);

  if (!data) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-[#dbe8da]/70 border border-[#c1d5bf] animate-pulse"
          />
        ))}
      </div>
    );
  }

  const { transactions, categoryMap, accountMap } = data;

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-[28px] bg-[#e2ede1] dark:bg-[#1c291e] border border-[#c4d7c2] dark:border-[#384e3b] shadow-sm">
        <img
          src="/mascot/thinking.png"
          alt="BudMan Mascot Thinking"
          className="w-24 h-auto object-contain mb-3 drop-shadow-sm"
        />
        <h3 className="text-base font-bold text-[#213123] dark:text-[#f0f6ef] mb-1">
          No Transactions Recorded
        </h3>
        <p className="text-xs text-[#4f6852] dark:text-[#9bb897] max-w-xs leading-relaxed">
          {filterAccountId
            ? "No activity recorded for this specific account yet."
            : "BudMan is ready! Tap the + button below to log your first income or expense record."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groupedTransactions.map((group) => (
        <div key={group.dateKey} className="space-y-2">
          {/* Sticky Section Header */}
          <div className="sticky top-0 z-10 py-1.5 px-3 rounded-xl bg-[#e2ede1]/95 backdrop-blur-md border border-[#c4d7c2] text-xs font-semibold text-[#4f6852] flex items-center justify-between shadow-xs">
            <span className="text-[#213123] font-bold tracking-tight">{group.label}</span>
            <span
              className={`text-[11px] font-bold tabular-nums ${
                group.totalDayAmount >= 0 ? "text-[#1f3d23]" : "text-[#b34033]"
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
                  onClick={() => setEditingTransaction(tx)}
                  className={`group relative flex items-center justify-between p-3.5 bg-[#e2ede1] hover:bg-[#d9e7d8] border border-[#c8dbc6] rounded-2xl transition-all shadow-sm cursor-pointer ${
                    isDeleting ? "opacity-40 scale-95" : ""
                  }`}
                >
                  {/* Left: Direction indicator & Info */}
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border font-black text-xs ${
                        isExpense
                          ? "bg-[#eadad8] border-[#ddc3c0] text-[#8e3228]"
                          : "bg-[#cde0cb] border-[#b8d2b6] text-[#263828]"
                      }`}
                    >
                      {isExpense ? "-" : "+"}
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-[#213123] truncate">
                        {tx.note || category?.name || "Transaction"}
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#5c755f] flex-wrap">
                        <span className="font-medium text-[#4f6852] truncate max-w-[100px]">
                          {category?.name || "Uncategorized"}
                        </span>

                        {/* Account Badge */}
                        {account && (
                          <>
                            <span className="text-[#8ba78e]">•</span>
                            <span
                              className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-semibold border"
                              style={{
                                color: "#213123",
                                backgroundColor: "#d0e3cf",
                                borderColor: "#b8d2b6",
                              }}
                            >
                              <span className="truncate max-w-[80px]">{account.name}</span>
                            </span>
                          </>
                        )}

                        {/* Time Badge */}
                        {tx.time && (
                          <>
                            <span className="text-[#8ba78e]">•</span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#486345] tabular-nums">
                              <svg className="w-2.5 h-2.5 opacity-75" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <span>{formatTime(tx.time)}</span>
                            </span>
                          </>
                        )}

                        <span className="text-[#8ba78e]">•</span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                            isExpense
                              ? "text-[#b34033] bg-[#b34033]/10"
                              : "text-[#1f3d23] bg-[#1f3d23]/10"
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
                        isExpense ? "text-[#b34033]" : "text-[#1f3d23]"
                      }`}
                    >
                      {isExpense ? "-" : "+"}
                      {formatCurrency(tx.amount, currency)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTransaction(tx);
                        }}
                        aria-label="Edit transaction"
                        title="Edit transaction"
                        className="p-1.5 rounded-lg text-xs font-semibold text-[#5c755f] hover:text-[#213123] hover:bg-[#c8dbc6] active:scale-95 transition-all opacity-80 group-hover:opacity-100"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, tx.id)}
                        disabled={isDeleting}
                        aria-label="Delete transaction"
                        title="Delete transaction"
                        className="px-2 py-1 rounded-lg text-xs font-semibold text-[#7d9680] hover:text-[#b34033] hover:bg-[#b34033]/10 active:scale-95 transition-all opacity-80 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={editingTransaction !== null}
        onClose={() => setEditingTransaction(null)}
      />
    </div>
  );
}
