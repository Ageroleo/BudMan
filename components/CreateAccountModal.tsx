"use client";

import React, { useState } from "react";
import { db, type CardTheme, type AccountCategoryType, type Account } from "@/lib/db";
import { useCurrency } from "@/lib/format";

export const CARD_THEME_OPTIONS: { id: CardTheme; name: string; type: AccountCategoryType; color: string }[] = [
  { id: "cash", name: "Cash", type: "cash", color: "#10b981" },
  { id: "seabank", name: "SeaBank", type: "bank", color: "#f35325" },
  { id: "gcash", name: "GCash", type: "wallet", color: "#0052cc" },
  { id: "bpi", name: "BPI", type: "bank", color: "#850b18" },
  { id: "maya", name: "Maya", type: "wallet", color: "#161b17" },
  { id: "landbank", name: "Landbank", type: "bank", color: "#094625" },
  { id: "shopee", name: "ShopeePay", type: "ecommerce", color: "#ee4d2d" },
  { id: "tiktok", name: "TikTok Shop", type: "ecommerce", color: "#0b0e14" },
];

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (accountId: string) => void;
}

export function CreateAccountModal({
  isOpen,
  onClose,
  onCreated,
}: CreateAccountModalProps) {
  const currency = useCurrency();
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>("cash");
  const [name, setName] = useState("Cash");
  const [type, setType] = useState<AccountCategoryType>("cash");
  const [initialBalance, setInitialBalance] = useState("0");
  const [lastDigits, setLastDigits] = useState("");
  const [cardholder, setCardholder] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCash = selectedTheme === "cash";

  const handleThemeChange = (themeId: CardTheme) => {
    setSelectedTheme(themeId);
    const preset = CARD_THEME_OPTIONS.find((t) => t.id === themeId);
    if (preset) {
      setType(preset.type);
      if (!name || CARD_THEME_OPTIONS.some((t) => name.toLowerCase().includes(t.name.toLowerCase()) || name.toLowerCase().includes(t.id))) {
        setName(themeId === "cash" ? "Cash" : `${preset.name} Account`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (isCash ? "Cash" : `${CARD_THEME_OPTIONS.find((t) => t.id === selectedTheme)?.name || "New"} Account`);

    setIsSaving(true);
    setError(null);
    try {
      const parsedBalance = parseFloat(initialBalance) || 0;
      const digits = isCash
        ? lastDigits.trim().toUpperCase()
        : (lastDigits.trim().replace(/\D/g, "") || "8888").slice(-4);
      const uniqueId = `${selectedTheme}_${Date.now()}`;

      const newAccount: Account = {
        id: uniqueId,
        name: finalName,
        type,
        cardTheme: selectedTheme,
        balance: parsedBalance,
        accountNumberMasked: isCash ? digits : `•••• ${digits}`,
        expiryDate: isCash ? undefined : "12/28",
        cardholderName: cardholder.trim().toUpperCase() || (isCash ? "" : "CARDHOLDER"),
        createdAt: new Date(),
      };

      await db.accounts.put(newAccount);

      // Reset form
      setName("Cash");
      setSelectedTheme("cash");
      setType("cash");
      setInitialBalance("0");
      setLastDigits("");
      setCardholder("");

      onCreated?.(newAccount.id);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to create account:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to create account: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-[#162218]/40 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-[#e5efe3] dark:bg-[#1a291e] border border-[#c1d5bf] dark:border-[#2f4835] rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c1d5bf] dark:border-[#2f4835]">
          <h3 className="text-sm font-bold text-[#213123] dark:text-white">
            {isCash ? "Add Cash Account" : "Add Card / Account"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5c755f] hover:text-[#213123] hover:bg-[#d6e5d4] dark:hover:bg-[#25392b] transition-colors"
          >
            Close
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Style & Skin Theme Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2] mb-1.5">
              Select Account Style
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CARD_THEME_OPTIONS.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleThemeChange(theme.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-[#54734e] text-white border-[#54734e] shadow-sm"
                        : "bg-[#d6e5d4] dark:bg-[#233527] border-[#c1d5bf] dark:border-[#324a37] text-[#223324] dark:text-[#d3e5d0] hover:bg-[#c6daca]"
                    }`}
                  >
                    {theme.id === "cash" ? (
                      <span className="text-xs">💵</span>
                    ) : (
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                        style={{ backgroundColor: theme.color }}
                      />
                    )}
                    <span className="truncate">{theme.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2] mb-1">
              Account Label
            </label>
            <input
              type="text"
              placeholder={isCash ? "e.g. Wallet, Emergency Fund, Cash" : "e.g. SeaBank Primary, Maya Savings"}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              required
              className="w-full bg-[#dbe8da] dark:bg-[#233527] border border-[#c1d5bf] dark:border-[#324a37] rounded-xl px-3.5 py-2.5 text-xs text-[#213123] dark:text-white placeholder-[#8ea890] focus:outline-none focus:border-[#5e7d59]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2] mb-1">
                {isCash ? "Tag (Optional)" : "Last 4 Digits"}
              </label>
              <input
                type="text"
                maxLength={isCash ? 10 : 4}
                placeholder={isCash ? "e.g. WALLET" : "8821"}
                value={lastDigits}
                onChange={(e) => setLastDigits(e.target.value)}
                className="w-full bg-[#dbe8da] dark:bg-[#233527] border border-[#c1d5bf] dark:border-[#324a37] rounded-xl px-3 py-2 text-xs text-[#213123] dark:text-white placeholder-[#8ea890] focus:outline-none focus:border-[#5e7d59] font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2] mb-1">
                {isCash ? "Owner (Optional)" : "Cardholder"}
              </label>
              <input
                type="text"
                placeholder={isCash ? "Optional" : "YOUR NAME"}
                value={cardholder}
                onChange={(e) => setCardholder(e.target.value)}
                className="w-full bg-[#dbe8da] dark:bg-[#233527] border border-[#c1d5bf] dark:border-[#324a37] rounded-xl px-3 py-2 text-xs text-[#213123] dark:text-white placeholder-[#8ea890] focus:outline-none focus:border-[#5e7d59] uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2] mb-1">
              Starting Balance
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-[#5c755f] dark:text-[#8ea890]">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-[#dbe8da] dark:bg-[#233527] border border-[#c1d5bf] dark:border-[#324a37] rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-[#213123] dark:text-white placeholder-[#8ea890] focus:outline-none focus:border-[#5e7d59] tabular-nums"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-2xl bg-[#54734e] hover:bg-[#466141] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#54734e]/30 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : isCash ? "Add Cash Account" : "Add Account to Carousel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
