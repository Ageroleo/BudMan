"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trash2, Landmark } from "lucide-react";
import { db, deleteAccount } from "@/lib/db";
import { useCurrency, formatCurrency } from "@/lib/format";
import { CategoryIcon } from "./CategoryIcon";
import { CreateAccountModal } from "./CreateAccountModal";

interface AccountSelectorProps {
  selectedAccountId: number | null;
  onSelectAccount: (accountId: number | null) => void;
}

export function AccountSelector({
  selectedAccountId,
  onSelectAccount,
}: AccountSelectorProps) {
  const currency = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null);

  // Live Query accounts and compute real-time balances purely from user's data
  const accountsWithBalances = useLiveQuery(async () => {
    const accounts = await db.accounts.toArray();
    const transactions = await db.transactions.toArray();

    return accounts.map((acc) => {
      // Net balance = initialBalance + sum(income) - sum(expense)
      const accTxs = transactions.filter((tx) => tx.accountId === acc.id);
      let currentBalance = acc.initialBalance || 0;
      for (const tx of accTxs) {
        if (tx.type === "income") currentBalance += tx.amount;
        else currentBalance -= tx.amount;
      }

      return {
        ...acc,
        currentBalance,
      };
    });
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this account? Transactions will be preserved.")) {
      await deleteAccount(id);
      if (selectedAccountId === id) {
        onSelectAccount(null);
      }
    }
  };

  const hasAccounts = accountsWithBalances && accountsWithBalances.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-emerald-400" />
          Accounts {hasAccounts ? `(${accountsWithBalances.length})` : ""}
        </span>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Account</span>
        </button>
      </div>

      {/* If No Accounts Added Yet: Prominent Invitation Banner */}
      {!hasAccounts ? (
        <div className="p-4 rounded-2xl bg-[#121215] border border-dashed border-white/[0.12] hover:border-emerald-500/30 transition-all flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-200">No accounts created yet</p>
              <p className="text-[11px] text-zinc-500">
                Add an account (e.g. Bank, Cash, Card) to organize income & expenses.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold shrink-0 transition-colors active:scale-95 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>
      ) : (
        /* Horizontal Carousel of User Accounts */
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar items-center">
          {/* All Accounts Pill */}
          <button
            type="button"
            onClick={() => onSelectAccount(null)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold shrink-0 transition-all active:scale-95 ${
              selectedAccountId === null
                ? "bg-white/[0.1] text-emerald-400 border-emerald-500/40 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                : "bg-[#121215] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12]"
            }`}
          >
            <span>All Accounts</span>
          </button>

          {/* User's Created Accounts */}
          {accountsWithBalances.map((acc) => {
            const isSelected = selectedAccountId === acc.id;
            return (
              <div
                key={acc.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectAccount(acc.id ?? null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelectAccount(acc.id ?? null);
                  }
                }}
                style={{
                  borderColor: isSelected ? acc.color : undefined,
                  backgroundColor: isSelected ? `${acc.color}20` : undefined,
                }}
                className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-2xl border text-xs shrink-0 transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? "text-white ring-1 shadow-md"
                    : "bg-[#121215] border-white/[0.06] text-zinc-300 hover:border-white/[0.12]"
                }`}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs"
                  style={{
                    backgroundColor: `${acc.color}25`,
                    color: acc.color,
                  }}
                >
                  <CategoryIcon name={acc.icon} className="w-3.5 h-3.5" />
                </div>

                <div className="text-left">
                  <span className="font-semibold block text-zinc-200 truncate max-w-[110px]">
                    {acc.name}
                  </span>
                  <span
                    className={`text-[11px] font-bold tabular-nums block ${
                      acc.currentBalance >= 0 ? "text-zinc-400" : "text-rose-400"
                    }`}
                  >
                    {formatCurrency(acc.currentBalance, currency)}
                  </span>
                </div>

                {/* Delete button (accessible on hover or when selected) */}
                {acc.id !== undefined && (
                  <button
                    type="button"
                    title="Delete Account"
                    onClick={(e) => handleDelete(e, acc.id as number)}
                    className="ml-1 p-1 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Quick Add Pill at end of Carousel */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-dashed border-white/[0.1] bg-[#121215]/50 hover:bg-[#121215] text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 text-xs font-semibold shrink-0 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      )}

      {/* Reusable Create Account Modal */}
      <CreateAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(newId) => {
          onSelectAccount(newId);
        }}
      />
    </div>
  );
}
