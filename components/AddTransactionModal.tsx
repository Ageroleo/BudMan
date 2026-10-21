"use client";

import React, { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, seedCategories, type Account } from "@/lib/db";
import { useCurrency, formatCurrency, getLocalTimeString } from "@/lib/format";
import { CreateAccountModal } from "./CreateAccountModal";
import { CreateCategoryModal } from "./CreateCategoryModal";

export function AddTransactionModal() {
  const currency = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState<string>("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(() => getLocalTimeString());
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

  // Live query for user accounts
  const accounts = useLiveQuery(async () => {
    return await db.accounts.toArray();
  }, []);

  // Pre-select first account if available and none selected
  useEffect(() => {
    if (accounts && accounts.length > 0 && accountId === null) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const handleOpen = () => {
    setIsOpen(true);
    setErrorMessage(null);
    if (!date) {
      setDate(new Date().toISOString().slice(0, 10));
    }
    setTime(getLocalTimeString());
    if (accounts && accounts.length > 0 && accountId === null) {
      setAccountId(accounts[0].id ?? null);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setAmount("");
    setCategoryId(null);
    setNote("");
    setErrorMessage(null);
    setDate(new Date().toISOString().slice(0, 10));
    setTime(getLocalTimeString());
    if (accounts && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
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

    setIsSubmitting(true);
    try {
      await db.transaction("rw", db.transactions, db.accounts, async () => {
        // Add the transaction record
        await db.transactions.add({
          amount: parsedAmount,
          type,
          categoryId,
          accountId: accountId ?? undefined,
          date,
          time: time || undefined,
          note: note.trim() || undefined,
          createdAt: new Date(),
        });

        // Deduct from or add to account balance if an account was linked
        if (accountId) {
          const acc = await db.accounts.get(accountId);
          if (acc) {
            const currentBal = acc.balance || 0;
            const updatedBal = type === "expense" ? currentBal - parsedAmount : currentBal + parsedAmount;
            await db.accounts.update(accountId, { balance: updatedBal });
          }
        }
      });

      handleClose();
    } catch (error) {
      console.error("Failed to add transaction:", error);
      setErrorMessage("Failed to save transaction to database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 right-4 sm:bottom-22 sm:right-8 z-40">
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Add transaction"
          className="w-14 h-14 rounded-full bg-[#54734e] hover:bg-[#466141] text-white flex items-center justify-center shadow-lg shadow-[#54734e]/40 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-[#82a47b]/40 font-bold text-2xl"
        >
          +
        </button>
      </div>

      {/* Bottom Sheet Backdrop & Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm bg-[#162218]/40 transition-opacity animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="w-full sm:max-w-md bg-[#e5efe3] border-t sm:border border-[#c1d5bf] rounded-t-[32px] sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Drag handle pill */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-[#b0c7ae]" />
            </div>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pb-3 pt-1 border-b border-[#c1d5bf]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#6b8c65] animate-pulse" />
                <h2 className="text-base font-bold text-[#213123] tracking-tight">
                  New Transaction
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5c755f] hover:text-[#213123] hover:bg-[#d6e5d4] transition-colors"
                aria-label="Close modal"
              >
                Close
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {errorMessage}
                </div>
              )}

              {/* Type Toggle: Segmented Control */}
              <div className="grid grid-cols-2 p-1 bg-[#d3e3d1] border border-[#c1d5bf] rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    type === "expense"
                      ? "bg-[#263728] text-white shadow-sm"
                      : "text-[#4f6852] hover:text-[#213123]"
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
                      : "text-[#4f6852] hover:text-[#213123]"
                  }`}
                >
                  Income
                </button>
              </div>

              {/* Amount Input */}
              <div className="p-4 bg-[#dbe8da] border border-[#c1d5bf] rounded-2xl focus-within:border-[#5e7d59] focus-within:ring-2 focus-within:ring-[#82a47b]/20 transition-all">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] mb-1">
                  Amount
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#5c755f]">
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
                    className="w-full bg-transparent text-3xl sm:text-4xl font-black text-[#213123] placeholder-[#8ea890] outline-none tabular-nums"
                  />
                </div>
              </div>

              {/* Account Selector Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852]">
                    {type === "expense" ? "Pay From Account" : "Deposit To Account"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddAccountOpen(true)}
                    className="text-[11px] font-semibold text-[#54734e] hover:text-[#384e34] transition-colors"
                  >
                    + New Account
                  </button>
                </div>

                {accounts && accounts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {accounts.map((acc: Account) => {
                      const isSelected = accountId === acc.id;
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
                      const badge = badgeMap[acc.cardTheme] || { bg: "bg-[#54734e]", text: "text-white", label: "AC" };

                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setAccountId(acc.id)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all active:scale-95 ${
                            isSelected
                              ? "bg-[#54734e] text-white border-[#54734e] shadow-md shadow-[#54734e]/20"
                              : "bg-[#d6e5d4] text-[#223324] border-[#c1d5bf] hover:bg-[#cadfc8]"
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
                ) : (
                  <div className="p-3 rounded-2xl bg-[#d8e7d6] border border-dashed border-[#b3cbb0] flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-[#213123]">No accounts created</p>
                    <button
                      type="button"
                      onClick={() => setIsAddAccountOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#54734e] hover:bg-[#466141] text-white text-xs font-bold active:scale-95 transition-all shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                )}
              </div>

              {/* Category Chips */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852]">
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
                  {categories && categories.length > 0 ? (
                    categories.map((cat) => {
                      const isSelected = categoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryId(cat.id ?? null)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${
                            isSelected
                              ? "bg-[#5f8059] text-white border-[#5e7d59] ring-2 ring-[#5e7d59]/40 shadow-sm"
                              : "bg-[#d6e5d4] text-[#223324] border-[#c1d5bf] hover:bg-[#c6daca]"
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: isSelected ? "#ffffff" : cat.color }}
                          />
                          <span>{cat.name}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-xs text-[#5c755f]">Loading categories...</div>
                  )}
                </div>
              </div>

              {/* Date & Time Inputs */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-[#dbe8da] border border-[#c1d5bf] rounded-xl px-3 py-2 text-xs text-[#213123] focus:outline-none focus:border-[#5e7d59] focus:ring-2 focus:ring-[#82a47b]/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#dbe8da] border border-[#c1d5bf] rounded-xl px-3 py-2 text-xs text-[#213123] focus:outline-none focus:border-[#5e7d59] focus:ring-2 focus:ring-[#82a47b]/20"
                  />
                </div>
              </div>

              {/* Note / Description Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] mb-1">
                  Note <span className="text-[#7d9680] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly grocery run"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={120}
                  className="w-full bg-[#dbe8da] border border-[#c1d5bf] rounded-xl px-3.5 py-2 text-xs text-[#213123] placeholder-[#8ea890] focus:outline-none focus:border-[#5e7d59] focus:ring-2 focus:ring-[#82a47b]/20"
                />
              </div>

              {/* Save Button */}
              <div className="pt-2 pb-safe">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider bg-[#54734e] hover:bg-[#466141] text-white active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-[#54734e]/30"
                >
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

      {/* Modal to create a category directly from the transaction flow */}
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
