"use client";

import React, { useState } from "react";
import { X, Landmark } from "lucide-react";
import { db, type AccountType } from "@/lib/db";
import { useCurrency } from "@/lib/format";

export const ACCOUNT_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#06b6d4", // Cyan
  "#ec4899", // Pink
];

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  checking: "Landmark",
  savings: "PiggyBank",
  cash: "Banknote",
  credit: "CreditCard",
  wallet: "Coins",
  other: "Tag",
};

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (accountId: number) => void;
}

export function CreateAccountModal({
  isOpen,
  onClose,
  onCreated,
}: CreateAccountModalProps) {
  const currency = useCurrency();
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);
  const [initialBalance, setInitialBalance] = useState("0");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter an account name");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const parsedBalance = parseFloat(initialBalance) || 0;
      const newId = await db.accounts.add({
        name: name.trim(),
        type,
        color,
        icon: ACCOUNT_TYPE_ICONS[type] || "Landmark",
        initialBalance: parsedBalance,
        createdAt: new Date(),
      });

      // Reset form
      setName("");
      setInitialBalance("0");
      setType("checking");
      setColor(ACCOUNT_COLORS[0]);

      onCreated?.(newId as number);
      onClose();
    } catch (err) {
      console.error("Failed to create account:", err);
      setError("An account with this name may already exist.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-[#121215] border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Landmark className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100">Add Account</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Account Name
            </label>
            <input
              type="text"
              placeholder="e.g. Chase Checking, Cash Wallet, Revolut"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              required
              autoFocus
              className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Account Type
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["checking", "savings", "cash", "credit", "wallet", "other"] as AccountType[]).map(
                (t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-semibold capitalize transition-all ${
                      type === t
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {t}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Accent Color
            </label>
            <div className="flex gap-2">
              {ACCOUNT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-white/50" : "opacity-80 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Starting Balance
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-zinc-500">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 tabular-nums"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              The opening balance of this account before any logged transactions.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-bold text-xs uppercase tracking-wider hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
