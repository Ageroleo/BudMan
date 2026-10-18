"use client";

import React, { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, X, Calendar, FileText, Check, Landmark } from "lucide-react";
import { db, seedCategories, type Account } from "@/lib/db";
import { useCurrency } from "@/lib/format";
import { CategoryIcon } from "./CategoryIcon";
import { CreateAccountModal } from "./CreateAccountModal";

export function AddTransactionModal() {
  const currency = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState<string>("");
  const [accountId, setAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live query for categories
  const categories = useLiveQuery(async () => {
    const list = await db.categories.toArray();
    if (list.length === 0) {
      await seedCategories();
      return await db.categories.toArray();
    }
    return list;
  }, []);

  // Live query for user accounts (purely user-defined, no auto-seed)
  const accounts = useLiveQuery(async () => {
    return await db.accounts.toArray();
  }, []);

  // Pre-select first account if available and none selected
  useEffect(() => {
    if (accounts && accounts.length > 0 && accountId === null) {
      setAccountId(accounts[0].id ?? null);
    }
  }, [accounts, accountId]);

  const handleOpen = () => {
    setIsOpen(true);
    setErrorMessage(null);
    if (!date) {
      setDate(new Date().toISOString().slice(0, 10));
    }
    if (accounts && accounts.length > 0 && accountId === null) {
      setAccountId(accounts[0].id ?? null);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setType("expense");
    setAmount("");
    setCategoryId(null);
    if (accounts && accounts.length > 0) {
      setAccountId(accounts[0].id ?? null);
    } else {
      setAccountId(null);
    }
    setDate(new Date().toISOString().slice(0, 10));
    setNote("");
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage(`Please enter a valid amount greater than ${currency}0.00`);
      return;
    }

    if (!accountId) {
      if (!accounts || accounts.length === 0) {
        setIsAddAccountOpen(true);
        setErrorMessage("Please create an account first to log your transaction");
      } else {
        setErrorMessage("Please select an account for this transaction");
      }
      return;
    }

    if (!categoryId) {
      setErrorMessage("Please select a category for this transaction");
      return;
    }

    if (!date) {
      setErrorMessage("Please select a date");
      return;
    }

    setIsSubmitting(true);
    try {
      await db.transactions.add({
        amount: parsedAmount,
        type,
        categoryId,
        accountId,
        date,
        note: note.trim() || undefined,
        createdAt: new Date(),
      });

      handleClose();
    } catch (err) {
      console.error("Failed to add transaction:", err);
      setErrorMessage("Failed to save transaction to database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Add Transaction"
        className="fixed bottom-24 right-5 sm:bottom-24 sm:right-8 z-30 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-semibold shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/40 border border-emerald-300/30"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Bottom Sheet Backdrop & Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="w-full sm:max-w-md bg-[#121215] border-t sm:border border-white/[0.1] rounded-t-[32px] sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Drag handle pill */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-zinc-700/60" />
            </div>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pb-3 pt-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-base font-bold text-zinc-100 tracking-tight">
                  New Transaction
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  {errorMessage}
                </div>
              )}

              {/* Type Toggle: Segmented Control */}
              <div className="grid grid-cols-2 p-1 bg-black/40 border border-white/[0.08] rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    type === "expense"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    type === "income"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Income
                </button>
              </div>

              {/* Amount Input (Hero Financial Field) */}
              <div className="p-4 bg-black/30 border border-white/[0.08] rounded-2xl focus-within:border-emerald-500/50 transition-colors">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Amount
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-zinc-500">
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
                    autoFocus
                    className="w-full bg-transparent text-3xl sm:text-4xl font-black text-white placeholder-zinc-700 outline-none tabular-nums"
                  />
                </div>
              </div>

              {/* Account Selector Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    {type === "expense" ? "Pay From Account" : "Deposit To Account"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddAccountOpen(true)}
                    className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 transition-colors"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>New Account</span>
                  </button>
                </div>

                {accounts && accounts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {accounts.map((acc: Account) => {
                      const isSelected = accountId === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setAccountId(acc.id ?? null)}
                          style={{
                            borderColor: isSelected ? acc.color : undefined,
                            backgroundColor: isSelected ? `${acc.color}20` : undefined,
                          }}
                          className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all active:scale-95 ${
                            isSelected
                              ? "text-white ring-2 ring-emerald-400/30 shadow-md shadow-emerald-500/10"
                              : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${acc.color}30`,
                              color: acc.color,
                            }}
                          >
                            <CategoryIcon name={acc.icon} className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate text-zinc-200">
                              {acc.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block truncate">
                              {acc.type}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.12] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Landmark className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-200">No accounts created</p>
                        <p className="text-[10px] text-zinc-500 truncate">
                          Add an account to assign this {type}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddAccountOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Category Chips (Rounded-full pills with glowing selection) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Category
                  </label>
                  <span className="text-[10px] text-zinc-500">
                    {categories?.length ?? 0} available
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {categories && categories.length > 0 ? (
                    categories.map((cat) => {
                      const isSelected = categoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryId(cat.id ?? null)}
                          style={{
                            borderColor: isSelected ? cat.color : undefined,
                            backgroundColor: isSelected ? `${cat.color}25` : undefined,
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${
                            isSelected
                              ? "text-white ring-2 ring-emerald-400/40 shadow-md shadow-emerald-500/10"
                              : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${cat.color}35`,
                              color: cat.color,
                            }}
                          >
                            <CategoryIcon name={cat.icon} className="w-2.5 h-2.5" />
                          </div>
                          <span>{cat.name}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-xs text-zinc-500">Loading categories...</div>
                  )}
                </div>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Date
                </label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Note / Description Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Note <span className="text-zinc-600 font-normal">(Optional)</span>
                </label>
                <div className="relative flex items-center">
                  <FileText className="absolute left-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. Weekly grocery run"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={120}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 pb-safe">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  {isSubmitting ? "Saving..." : "Add Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal to create an account directly from the transaction flow */}
      <CreateAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onCreated={(newId) => {
          setAccountId(newId);
          setIsAddAccountOpen(false);
          setErrorMessage(null);
        }}
      />
    </>
  );
}
