"use client";

import React, { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  updateTransaction,
  deleteTransaction,
  type Transaction,
  type Account,
  type Category,
} from "@/lib/db";
import { useCurrency, formatCurrency } from "@/lib/format";
import { CreateCategoryModal } from "./CreateCategoryModal";
import { CreateAccountModal } from "./CreateAccountModal";

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

export function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: EditTransactionModalProps) {
  const currency = useCurrency();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState<string>("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sub-modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  // Live query for categories & accounts
  const categories = useLiveQuery(async () => {
    return await db.categories.toArray();
  }, []);

  const accounts = useLiveQuery(async () => {
    return await db.accounts.toArray();
  }, []);

  // Prepopulate form when transaction changes
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setCategoryId(transaction.categoryId);
      setAccountId(transaction.accountId ?? null);
      setDate(transaction.date);
      setTime(transaction.time || "");
      setNote(transaction.note || "");
      setErrorMessage(null);
      setShowDeleteConfirm(false);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Please enter an amount greater than 0");
      return;
    }

    if (!categoryId) {
      setErrorMessage("Please select a category");
      return;
    }

    if (!date) {
      setErrorMessage("Please select a transaction date");
      return;
    }

    if (transaction.id === undefined) {
      setErrorMessage("Transaction ID missing");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTransaction(transaction.id, {
        amount: parsedAmount,
        type,
        categoryId,
        accountId: accountId ?? undefined,
        date,
        time: time || undefined,
        note: note.trim() || undefined,
      });

      onUpdated?.();
      onClose();
    } catch (error) {
      console.error("Failed to update transaction:", error);
      setErrorMessage("Failed to update transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (transaction.id === undefined) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(transaction.id);
      onDeleted?.();
      onClose();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      setErrorMessage("Failed to delete transaction.");
    } finally {
      setIsDeleting(false);
    }
  };

  const badgeMap: Record<string, { bg: string; text: string; label: string }> = {
    seabank: { bg: "bg-[#f35325]", text: "text-white", label: "SB" },
    gcash: { bg: "bg-[#0052cc]", text: "text-white", label: "GC" },
    bpi: { bg: "bg-[#850b18]", text: "text-[#fae084]", label: "BPI" },
    maya: { bg: "bg-[#090a0b] border border-[#22c55e]/50", text: "text-[#22c55e]", label: "MY" },
    landbank: { bg: "bg-[#094625]", text: "text-lime-200", label: "LB" },
    shopee: { bg: "bg-[#ee4d2d]", text: "text-white", label: "SP" },
    tiktok: { bg: "bg-[#000000] border border-[#00f2fe]/40", text: "text-white", label: "TT" },
    cash: { bg: "bg-[#094625] border border-emerald-400/50", text: "text-emerald-300", label: "💵" },
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-[#162218]/40 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="w-full max-w-md bg-[#e5efe3] dark:bg-[#1a291e] border border-[#c1d5bf] dark:border-[#2f4835] rounded-3xl p-6 shadow-2xl space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#c1d5bf] dark:border-[#2f4835]">
            <h3 className="text-sm font-bold text-[#213123] dark:text-white">
              Edit Transaction
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5c755f] hover:text-[#213123] hover:bg-[#d6e5d4] dark:hover:bg-[#25392b] transition-colors"
            >
              Close
            </button>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Type Toggle: Segmented Control */}
            <div className="grid grid-cols-2 p-1 bg-[#d3e3d1] dark:bg-[#233527] border border-[#c1d5bf] dark:border-[#324a37] rounded-2xl">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  type === "expense"
                    ? "bg-[#263728] text-white shadow-sm"
                    : "text-[#4f6852] dark:text-[#a0bea2] hover:text-[#213123]"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  type === "income"
                    ? "bg-[#263728] text-white shadow-sm"
                    : "text-[#4f6852] dark:text-[#a0bea2] hover:text-[#213123]"
                }`}
              >
                Income
              </button>
            </div>

            {/* Amount Input */}
            <div className="p-4 bg-[#dbe8da] dark:bg-[#233527] border border-[#c1d5bf] dark:border-[#324a37] rounded-2xl focus-within:border-[#5e7d59] transition-all">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2] mb-1">
                Amount
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#5c755f] dark:text-[#8ea890]">
                  {currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full bg-transparent text-3xl sm:text-4xl font-black text-[#213123] dark:text-white placeholder-[#8ea890] outline-none tabular-nums"
                />
              </div>
            </div>

            {/* Account Selector Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2]">
                  {type === "expense" ? "Payment Account" : "Deposit Account"}
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(true)}
                  className="text-[11px] font-semibold text-[#54734e] hover:text-[#384e34] transition-colors"
                >
                  + New Account
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {/* No Account / Unlinked Option */}
                <button
                  type="button"
                  onClick={() => setAccountId(null)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all ${
                    accountId === null
                      ? "bg-[#54734e] text-white border-[#54734e] shadow-md shadow-[#54734e]/20"
                      : "bg-[#d6e5d4] dark:bg-[#233527] text-[#223324] dark:text-[#d3e5d0] border-[#c1d5bf] dark:border-[#324a37] hover:bg-[#cadfc8]"
                  }`}
                >
                  <span className="w-7 h-7 rounded-lg bg-[#8ea890]/40 text-[#213123] dark:text-white text-xs font-black flex items-center justify-center shrink-0">
                    —
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">No Account</p>
                    <p className={`text-[10px] ${accountId === null ? "text-white/80" : "text-[#5c755f]"}`}>
                      Unlinked
                    </p>
                  </div>
                </button>

                {accounts &&
                  accounts.map((acc: Account) => {
                    const isSelected = accountId === acc.id;
                    const badge = badgeMap[acc.cardTheme] || {
                      bg: "bg-[#54734e]",
                      text: "text-white",
                      label: "AC",
                    };

                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setAccountId(acc.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? "bg-[#54734e] text-white border-[#54734e] shadow-md shadow-[#54734e]/20"
                            : "bg-[#d6e5d4] dark:bg-[#233527] text-[#223324] dark:text-[#d3e5d0] border-[#c1d5bf] dark:border-[#324a37] hover:bg-[#cadfc8]"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg ${badge.bg} ${badge.text} text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs`}
                        >
                          {badge.label}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate leading-tight">
                            {acc.name}
                          </p>
                          <p
                            className={`text-[10px] font-mono tabular-nums leading-tight mt-0.5 ${
                              isSelected ? "text-white/80" : "text-[#5c755f]"
                            }`}
                          >
                            {formatCurrency(acc.balance, currency)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Category Chips */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2]">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="text-[11px] font-semibold text-[#54734e] hover:text-[#384e34] transition-colors"
                >
                  + New Category
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                {categories &&
                  categories.map((cat: Category) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id ?? null)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${
                          isSelected
                            ? "bg-[#5f8059] text-white border-[#5e7d59] ring-2 ring-[#5e7d59]/40 shadow-sm"
                            : "bg-[#d6e5d4] dark:bg-[#233527] text-[#223324] dark:text-[#d3e5d0] border-[#c1d5bf] dark:border-[#324a37] hover:bg-[#c6daca]"
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: isSelected ? "#ffffff" : cat.color }}
                        />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Date & Time Inputs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-[#dbe8da] dark:bg-[#233527] border border-[#c1d5bf] dark:border-[#324a37] rounded-xl px-3.5 py-2.5 text-xs text-[#213123] dark:text-white focus:outline-none focus:border-[#5e7d59]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2] mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#dbe8da] dark:bg-[#233527] border border-[#c1d5bf] dark:border-[#324a37] rounded-xl px-3.5 py-2.5 text-xs text-[#213123] dark:text-white focus:outline-none focus:border-[#5e7d59]"
                />
              </div>
            </div>

            {/* Description / Note */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2] mb-1">
                Description / Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Lunch with team, monthly utility"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#dbe8da] dark:bg-[#233527] border border-[#c1d5bf] dark:border-[#324a37] rounded-xl px-3.5 py-2.5 text-xs text-[#213123] dark:text-white placeholder-[#8ea890] focus:outline-none focus:border-[#5e7d59]"
              />
            </div>

            {/* Delete Confirmation prompt */}
            {showDeleteConfirm ? (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-center space-y-2 animate-in fade-in duration-150">
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                  Delete this transaction?
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                  Account balance will be automatically adjusted.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 rounded-xl bg-[#dce9da] dark:bg-[#253628] text-xs font-bold text-[#213123] dark:text-white hover:bg-[#cfdec8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 py-2 rounded-xl bg-[#b34033] hover:bg-[#993429] text-white text-xs font-bold shadow-xs active:scale-95"
                  >
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Submit & Delete buttons */}
            <div className="flex items-center gap-2 pt-2">
              {!showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-3 rounded-2xl border border-rose-300 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-all"
                >
                  Delete
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl bg-[#54734e] hover:bg-[#466141] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#54734e]/30 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CreateAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onCreated={(newId) => {
          setAccountId(newId);
          setIsAddAccountOpen(false);
        }}
      />

      <CreateCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onCreated={(newCatId) => {
          setCategoryId(newCatId);
          setIsAddCategoryOpen(false);
        }}
      />
    </>
  );
}
