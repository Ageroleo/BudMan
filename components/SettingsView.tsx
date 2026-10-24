"use client";

import React, { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, deleteAccount, deleteCategory, type Account, type Category } from "@/lib/db";
import {
  exportToJson,
  exportToCsv,
  importFromJson,
  resetDatabase,
} from "@/lib/backup";
import {
  SUPPORTED_CURRENCIES,
  useCurrency,
  setStoredCurrency,
  formatCurrency,
} from "@/lib/format";
import { useInstallPrompt } from "./InstallPrompt";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { useStorageStatus } from "@/lib/storage";
import { useActiveAvatar } from "@/lib/avatar";
import { CreateAccountModal } from "./CreateAccountModal";
import { CreateCategoryModal } from "./CreateCategoryModal";
import {
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export function SettingsView() {
  const currentCurrency = useCurrency();
  const { canInstall, isStandalone, triggerInstall } = useInstallPrompt();
  const { theme, setTheme } = useTheme();
  const { avatar, setAvatar, allAvatars } = useActiveAvatar();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Storage persistence state & quota metrics
  const {
    isSupported: isStorageSupported,
    isPersisted,
    formattedUsage,
    formattedQuota,
    percentageUsed,
    loading: isStorageLoading,
    requesting: isRequestingPersistence,
    refresh: refreshStorage,
    requestPersistence,
  } = useStorageStatus();
  const [showStorageExplanation, setShowStorageExplanation] = useState(false);

  const handleRequestPersistence = async () => {
    setStatusMessage(null);
    const granted = await requestPersistence();
    if (granted) {
      setStatusMessage({
        type: "success",
        text: "Persistent Storage successfully granted! Your records are now exempt from automatic browser eviction.",
      });
    } else {
      setStatusMessage({
        type: "error",
        text: "The browser did not grant persistent mode automatically. Installing BudMan as a PWA and creating JSON backups ensures your data remains secure.",
      });
    }
  };

  // Accounts management states
  const [accountToDeleteId, setAccountToDeleteId] = useState<string | null>(null);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);

  // Category management states
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<number | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const categories = useLiveQuery(() => db.categories.toArray(), []);

  const handleConfirmDeleteCategory = async (id: number) => {
    try {
      await deleteCategory(id);
      setCategoryToDeleteId(null);
      setStatusMessage({
        type: "success",
        text: "Category successfully removed.",
      });
    } catch (err) {
      console.error("Failed to delete category:", err);
      setStatusMessage({
        type: "error",
        text: "Failed to remove category.",
      });
    }
  };

  const handleConfirmDeleteAccount = async (id: string) => {
    try {
      await deleteAccount(id);
      setAccountToDeleteId(null);
      setStatusMessage({
        type: "success",
        text: "Card account successfully removed.",
      });
    } catch (err) {
      console.error("Failed to delete account:", err);
      setStatusMessage({
        type: "error",
        text: "Failed to remove card account.",
      });
    }
  };

  // Live Query stats
  const stats = useLiveQuery(async () => {
    const [txCount, catCount, accCount, goalCount] = await Promise.all([
      db.transactions.count(),
      db.categories.count(),
      db.accounts.count(),
      db.savingsGoals.count(),
    ]);
    return { txCount, catCount, accCount, goalCount };
  }, []);

  const handleJsonExport = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      await exportToJson();
      setStatusMessage({
        type: "success",
        text: "Database backup (JSON) successfully created and downloaded.",
      });
    } catch (err) {
      console.error("Export error:", err);
      setStatusMessage({
        type: "error",
        text: "Failed to export JSON backup.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCsvExport = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      await exportToCsv();
      setStatusMessage({
        type: "success",
        text: "Spreadsheet (CSV) file successfully generated and downloaded.",
      });
    } catch (err) {
      console.error("Export error:", err);
      setStatusMessage({
        type: "error",
        text: "Failed to export CSV file.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatusMessage(null);
    try {
      const result = await importFromJson(file);
      setStatusMessage({
        type: "success",
        text: `Restored ${result.transactionsCount} transactions, ${result.categoriesCount} categories, and ${result.accountsCount} accounts.`,
      });
    } catch (err) {
      console.error("Import error:", err);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to parse and import backup file.",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleResetConfirm = async () => {
    setIsResetting(true);
    setStatusMessage(null);
    try {
      await resetDatabase();
      setShowResetConfirm(false);
      setStatusMessage({
        type: "success",
        text: "Database cleared and re-seeded with default categories and accounts.",
      });
    } catch (err) {
      console.error("Reset error:", err);
      setStatusMessage({
        type: "error",
        text: "Failed to reset database.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
            statusMessage.type === "success"
              ? "bg-[#cde0cb] border-[#b8d2b6] text-[#1f3d23] shadow-xs"
              : "bg-[#b34033]/10 border-[#b34033]/30 text-[#b34033] shadow-xs"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* SECTION: BudMan Mascot Companion */}
      <section className="p-5 sm:p-6 bg-[#e2ede1] dark:bg-[#1c291e] border border-[#c4d7c2] dark:border-[#384e3b] rounded-[28px] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#54734e]/15 dark:bg-[#54734e]/30 flex items-center justify-center p-1 border border-[#54734e]/30 shrink-0">
              <img
                src={avatar.src}
                alt={avatar.name}
                className="w-10 h-10 object-contain rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef]">
                  BudMan Companion Mood
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#54734e] text-white">
                  {avatar.name}
                </span>
              </div>
              <p className="text-[11px] text-[#5e7d59] dark:text-[#9bb897]">
                &ldquo;{avatar.mood}&rdquo; • Tap to switch your companion mascot mood
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {allAvatars.map((item) => {
            const isSelected = item.id === avatar.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setAvatar(item.id)}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                  isSelected
                    ? "bg-[#54734e] text-white border-[#54734e] shadow-sm ring-2 ring-[#54734e]/40"
                    : "bg-[#edf4eb] dark:bg-[#162218] border-[#c4d7c2] dark:border-[#384e3b] text-[#213123] dark:text-[#c9dec8] hover:bg-[#d6e5d4] dark:hover:bg-[#263728]"
                }`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 p-0.5 border border-white/30">
                  <img
                    src={item.src}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span
                    className={`text-xs font-bold block ${
                      isSelected ? "text-white" : "text-[#213123] dark:text-[#f0f6ef]"
                    }`}
                  >
                    {item.name}
                  </span>
                  <span
                    className={`text-[10px] block mt-0.5 ${
                      isSelected ? "text-white/80" : "text-[#5e7d59] dark:text-[#9bb897]"
                    }`}
                  >
                    {item.mood}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION: Theme & Appearance */}
      <section className="p-5 sm:p-6 bg-[#e2ede1] dark:bg-[#1c291e] border border-[#c4d7c2] dark:border-[#384e3b] rounded-[28px] shadow-sm">
        <div className="mb-3.5">
          <h3 className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef]">Appearance & Theme</h3>
          <p className="text-[11px] text-[#5e7d59] dark:text-[#9bb897]">Switch between dark, light, or system mode</p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {[
            {
              id: "dark" as ThemeMode,
              label: "Dark",
              desc: "Deep dark mode",
            },
            {
              id: "light" as ThemeMode,
              label: "Light",
              desc: "Matcha green",
            },
            {
              id: "system" as ThemeMode,
              label: "System",
              desc: "Match device",
            },
          ].map((mode) => {
            const isSelected = theme === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setTheme(mode.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#54734e] text-white border-[#54734e] shadow-sm ring-1 ring-[#54734e]/40"
                    : "bg-[#edf4eb] dark:bg-[#162218] border-[#c4d7c2] dark:border-[#384e3b] text-[#5e7d59] dark:text-[#9bb897] hover:bg-[#d6e5d4] dark:hover:bg-[#263728]"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                    Mode
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </div>
                <div>
                  <span
                    className={`text-sm font-bold block ${
                      isSelected ? "text-white" : "text-[#213123] dark:text-[#f0f6ef]"
                    }`}
                  >
                    {mode.label}
                  </span>
                  <span className={`text-[10px] block mt-0.5 ${isSelected ? "text-white/80" : "text-[#5e7d59] dark:text-[#9bb897]"}`}>
                    {mode.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 1: Currency Preference */}
      <section className="p-5 sm:p-6 bg-[#e2ede1] dark:bg-[#1c291e] border border-[#c4d7c2] dark:border-[#384e3b] rounded-[28px] shadow-sm">
        <div className="mb-3.5">
          <h3 className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef]">Preferred Currency</h3>
          <p className="text-[11px] text-[#5e7d59] dark:text-[#9bb897]">Choose your display currency symbol</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {SUPPORTED_CURRENCIES.map((curr) => {
            const isSelected = currentCurrency === curr.symbol;
            return (
              <button
                key={curr.code}
                type="button"
                onClick={() => setStoredCurrency(curr.symbol)}
                className={`py-2 px-3 rounded-2xl border text-xs font-semibold transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-[#54734e] text-white border-[#54734e] shadow-sm ring-1 ring-[#54734e]/40"
                    : "bg-[#edf4eb] dark:bg-[#162218] border-[#c4d7c2] dark:border-[#384e3b] text-[#213123] dark:text-[#c9dec8] hover:bg-[#d6e5d4] dark:hover:bg-[#263728]"
                }`}
              >
                <span className="truncate">{curr.name}</span>
                <span className={`font-black text-sm ml-1 ${isSelected ? "text-white" : "text-[#213123] dark:text-[#f0f6ef]"}`}>
                  {curr.symbol}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION: Connected Cards & Accounts */}
      <section className="p-5 sm:p-6 bg-[#e2ede1] dark:bg-[#1c291e] border border-[#c4d7c2] dark:border-[#384e3b] rounded-[28px] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef]">Accounts & Cards</h3>
            <p className="text-[11px] text-[#5e7d59] dark:text-[#9bb897]">
              Manage your connected cards, wallets & cash accounts ({accounts?.length ?? 0} active)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddAccountOpen(true)}
            className="px-3 py-1.5 rounded-full bg-[#54734e] hover:bg-[#435e3e] text-white text-xs font-bold transition-all shadow-xs"
          >
            + Add Account
          </button>
        </div>

        {accounts && accounts.length > 0 ? (
          <div className="space-y-2 pt-1">
            {accounts.map((acc: Account) => {
              const isDeletingThis = accountToDeleteId === acc.id;
              return (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#edf4eb] dark:bg-[#162218] border border-[#c4d7c2] dark:border-[#384e3b]"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#213123] dark:text-[#f0f6ef] truncate">
                        {acc.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#dce9da] dark:bg-[#253628] text-[#5e7d59] dark:text-[#9bb897]">
                        {acc.accountNumberMasked}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-[#5e7d59] dark:text-[#9bb897] block mt-0.5">
                      {formatCurrency(acc.balance, currentCurrency)}
                    </span>
                  </div>

                  {isDeletingThis ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAccountToDeleteId(null)}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold text-[#5e7d59] hover:bg-[#dce9da] dark:hover:bg-[#253628]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmDeleteAccount(acc.id)}
                        className="px-2.5 py-1 rounded-xl bg-[#b34033] hover:bg-[#993429] text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                      >
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAccountToDeleteId(acc.id)}
                      className="px-2.5 py-1 rounded-xl border border-[#b34033]/40 text-[#b34033] dark:text-[#f87171] hover:bg-[#b34033]/10 text-xs font-bold transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#edf4eb] dark:bg-[#162218] border border-dashed border-[#c4d7c2] dark:border-[#384e3b] text-center">
            <p className="text-xs text-[#5e7d59] dark:text-[#9bb897]">
              No card accounts currently connected.
            </p>
          </div>
        )}
      </section>

      {/* SECTION: Categories Management */}
      <section className="p-5 sm:p-6 bg-[#e2ede1] dark:bg-[#1c291e] border border-[#c4d7c2] dark:border-[#384e3b] rounded-[28px] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef]">Categories</h3>
            <p className="text-[11px] text-[#5e7d59] dark:text-[#9bb897]">
              Manage expense & income categories ({categories?.length ?? 0} active)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddCategoryOpen(true)}
            className="px-3 py-1.5 rounded-full bg-[#54734e] hover:bg-[#435e3e] text-white text-xs font-bold transition-all shadow-xs"
          >
            + Add Category
          </button>
        </div>

        {categories && categories.length > 0 ? (
          <div className="space-y-2 pt-1 max-h-72 overflow-y-auto pr-1">
            {categories.map((cat: Category) => {
              const isDeletingThis = categoryToDeleteId === cat.id;
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#edf4eb] dark:bg-[#162218] border border-[#c4d7c2] dark:border-[#384e3b]"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#213123] dark:text-[#f0f6ef] truncate block">
                        {cat.name}
                      </span>
                      {cat.budgetMonthly && cat.budgetMonthly > 0 ? (
                        <span className="text-[10px] text-[#5e7d59] dark:text-[#9bb897] block">
                          Budget: {formatCurrency(cat.budgetMonthly, currentCurrency)}/mo
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#5e7d59]/70 dark:text-[#9bb897]/70 block">
                          No monthly budget limit
                        </span>
                      )}
                    </div>
                  </div>

                  {isDeletingThis ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCategoryToDeleteId(null)}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold text-[#5e7d59] hover:bg-[#dce9da] dark:hover:bg-[#253628]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => cat.id !== undefined && handleConfirmDeleteCategory(cat.id)}
                        className="px-2.5 py-1 rounded-xl bg-[#b34033] hover:bg-[#993429] text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                      >
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCategoryToDeleteId(cat.id ?? null)}
                      className="px-2.5 py-1 rounded-xl border border-[#b34033]/40 text-[#b34033] dark:text-[#f87171] hover:bg-[#b34033]/10 text-xs font-bold transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#edf4eb] dark:bg-[#162218] border border-dashed border-[#c4d7c2] dark:border-[#384e3b] text-center">
            <p className="text-xs text-[#5e7d59] dark:text-[#9bb897]">No categories created.</p>
          </div>
        )}
      </section>

      {/* SECTION: Storage Protection & Health */}
      <section className="p-5 sm:p-6 bg-[#e2ede1] dark:bg-[#1c291e] border border-[#c4d7c2] dark:border-[#384e3b] rounded-[28px] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef] flex items-center gap-2">
              Storage Health & Protection
              {isPersisted ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#cde0cb] text-[#1f3d23] dark:bg-[#264429] dark:text-[#a1e5ab]">
                  <ShieldCheck className="w-3 h-3" />
                  Protected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fef3c7] text-[#92400e] dark:bg-[#452b12] dark:text-[#fde68a]">
                  <ShieldAlert className="w-3 h-3" />
                  Best-Effort
                </span>
              )}
            </h3>
            <p className="text-[11px] text-[#5e7d59] dark:text-[#9bb897]">
              Prevents the browser from auto-clearing local data after 2–3 days
            </p>
          </div>

          <button
            type="button"
            onClick={refreshStorage}
            disabled={isStorageLoading}
            title="Refresh storage metrics"
            className="p-2 rounded-xl text-[#5e7d59] dark:text-[#9bb897] hover:bg-[#d6e5d4] dark:hover:bg-[#263728] active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isStorageLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Protection Status Card */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isPersisted
              ? "bg-[#edf4eb]/90 dark:bg-[#152217] border-[#b8d2b6] dark:border-[#2e4632]"
              : "bg-amber-500/10 border-amber-500/25 dark:bg-amber-500/5 dark:border-amber-500/20"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isPersisted
                  ? "bg-[#54734e]/15 text-[#3b5336] dark:text-[#95c590]"
                  : "bg-amber-500/20 text-amber-700 dark:text-amber-400"
              }`}
            >
              {isPersisted ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#213123] dark:text-[#f0f6ef]">
                  {isPersisted
                    ? "Persistent Storage Active"
                    : "Standard Storage (Eviction Risk)"}
                </span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                    isPersisted
                      ? "bg-[#54734e] text-white"
                      : "bg-amber-600 text-white dark:bg-amber-500"
                  }`}
                >
                  {isPersisted ? "Safe" : "Temporary"}
                </span>
              </div>

              <p className="text-[11px] text-[#5e7d59] dark:text-[#9bb897] mt-1 leading-relaxed">
                {isPersisted
                  ? "Your database is marked as Persistent. The browser is instructed never to auto-purge your accounts and transactions during storage cleanup routines."
                  : "Browser storage is currently in transient ('best-effort') mode. Mobile browsers (especially iOS Safari) may delete local data after 2–3 days if device storage runs low or during background cleanup."}
              </p>

              {!isPersisted && isStorageSupported && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRequestPersistence}
                    disabled={isRequestingPersistence}
                    className="py-2 px-3.5 rounded-xl bg-[#54734e] hover:bg-[#445e3f] active:scale-[0.98] text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isRequestingPersistence ? "Requesting..." : "Enable Storage Protection"}
                  </button>
                  <span className="text-[10px] text-[#5e7d59] dark:text-[#9bb897]">
                    Requests browser eviction exemption
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quota & Usage Bar */}
        {formattedUsage && (
          <div className="p-3.5 bg-[#edf4eb] dark:bg-[#162218] rounded-2xl border border-[#c4d7c2] dark:border-[#384e3b] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#5e7d59] dark:text-[#9bb897] flex items-center gap-1.5 font-medium">
                <HardDrive className="w-3.5 h-3.5" />
                Browser Storage Used
              </span>
              <span className="font-bold text-[#213123] dark:text-[#f0f6ef]">
                {formattedUsage}
                {formattedQuota ? ` / ${formattedQuota}` : ""}
              </span>
            </div>

            {percentageUsed !== undefined && (
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-[#d6e5d4] dark:bg-[#263728] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#54734e] transition-all duration-500"
                    style={{ width: `${Math.max(percentageUsed, 0.5)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#5e7d59] dark:text-[#9bb897]">
                  <span>Dexie (IndexedDB) & Cache</span>
                  <span>{percentageUsed < 0.01 ? "< 0.01%" : `${percentageUsed.toFixed(2)}%`} of quota</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Educational Accordion: Why does local data disappear? */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowStorageExplanation(!showStorageExplanation)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#d6e5d4]/60 dark:hover:bg-[#263728]/60 text-xs font-semibold text-[#3b5336] dark:text-[#9bb897] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#54734e]" />
              Why do browsers clear local data after 2–3 days?
            </span>
            {showStorageExplanation ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showStorageExplanation && (
            <div className="mt-2 p-3.5 rounded-2xl bg-[#edf4eb] dark:bg-[#162218] border border-[#c4d7c2] dark:border-[#384e3b] text-[11px] text-[#5e7d59] dark:text-[#9bb897] space-y-2 animate-in fade-in duration-200">
              <div className="space-y-2">
                <p>
                  <strong className="text-[#213123] dark:text-[#f0f6ef]">1. In-App WebViews:</strong> If you open links from Instagram, Messenger, TikTok, or Facebook, the app uses a temporary sandbox that is wiped every 2–3 days. Always open BudMan in your primary browser (Safari or Chrome).
                </p>
                <p>
                  <strong className="text-[#213123] dark:text-[#f0f6ef]">2. iOS / Safari 7-Day Purge:</strong> Apple WebKit deletes client storage after 7 days of inactivity, or sooner if free disk space is limited.
                </p>
                <p>
                  <strong className="text-[#213123] dark:text-[#f0f6ef]">3. Add to Home Screen (PWA):</strong> Installing BudMan to your Home Screen grants it higher browser trust and storage eviction protection.
                </p>
                <p>
                  <strong className="text-[#213123] dark:text-[#f0f6ef]">4. Regular JSON Backups:</strong> Use the <em>Backup (JSON)</em> button below to download an offline copy of all transactions.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: Data Backup & Management */}
      <section className="p-5 sm:p-6 bg-[#e2ede1] dark:bg-[#1c291e] border border-[#c4d7c2] dark:border-[#384e3b] rounded-[28px] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef]">Data & Backup</h3>
            <p className="text-[11px] text-[#5e7d59] dark:text-[#9bb897]">
              {stats?.txCount ?? 0} transactions saved locally
            </p>
          </div>
          <img
            src="/mascot/laptop.png"
            alt="BudMan Backup Manager"
            className="w-14 h-14 object-contain drop-shadow-sm"
          />
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* JSON Export */}
          <button
            type="button"
            onClick={handleJsonExport}
            disabled={isExporting}
            className="p-3.5 rounded-2xl bg-[#edf4eb] dark:bg-[#162218] border border-[#c4d7c2] dark:border-[#384e3b] hover:bg-[#dce9da] dark:hover:bg-[#263728] active:scale-[0.99] transition-all text-left"
          >
            <span className="text-xs font-bold text-[#213123] dark:text-[#f0f6ef] block">Backup (JSON)</span>
            <span className="text-[10px] text-[#5e7d59] dark:text-[#9bb897]">Export full database backup</span>
          </button>

          {/* CSV Export */}
          <button
            type="button"
            onClick={handleCsvExport}
            disabled={isExporting}
            className="p-3.5 rounded-2xl bg-[#edf4eb] dark:bg-[#162218] border border-[#c4d7c2] dark:border-[#384e3b] hover:bg-[#dce9da] dark:hover:bg-[#263728] active:scale-[0.99] transition-all text-left"
          >
            <span className="text-xs font-bold text-[#213123] dark:text-[#f0f6ef] block">Export Spreadsheet</span>
            <span className="text-[10px] text-[#5e7d59] dark:text-[#9bb897]">CSV for Excel / Sheets</span>
          </button>

          {/* JSON Import */}
          <div className="sm:col-span-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full py-3 px-4 rounded-2xl bg-[#d6e5d4] hover:bg-[#c6daca] dark:bg-[#263728] dark:hover:bg-[#2e4331] border border-[#c4d7c2] dark:border-[#384e3b] active:scale-[0.99] text-xs font-bold text-[#213123] dark:text-[#c9dec8] transition-all"
            >
              {isImporting ? "Restoring backup..." : "Restore Backup from JSON"}
            </button>
          </div>
        </div>

        {/* Reset Database */}
        <div className="pt-3 border-t border-[#c4d7c2]/60 dark:border-[#384e3b]/60">
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-[#b34033] hover:text-[#962f23] hover:bg-[#b34033]/10 transition-colors"
            >
              Reset Database to Defaults
            </button>
          ) : (
            <div className="p-3.5 bg-[#b34033]/10 border border-[#b34033]/30 rounded-2xl space-y-2">
              <p className="text-xs text-[#b34033] font-semibold text-center">
                Are you sure? This will permanently delete all {stats?.txCount ?? 0} transactions!
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetConfirm}
                  disabled={isResetting}
                  className="flex-1 py-2 rounded-xl bg-[#b34033] hover:bg-[#962f23] text-white font-bold text-xs transition-colors"
                >
                  {isResetting ? "Resetting..." : "Yes, Clear Data"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-[#d6e5d4] dark:bg-[#263728] hover:bg-[#c6daca] text-[#213123] dark:text-[#c9dec8] font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: PWA & Application Info */}
      <section className="p-5 sm:p-6 bg-[#e2ede1] dark:bg-[#1c291e] border border-[#c4d7c2] dark:border-[#384e3b] rounded-[28px] shadow-sm space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef]">About BudMan PWA</h3>
            <p className="text-[11px] text-[#5e7d59] dark:text-[#9bb897]">Version 1.0 • Offline First Companion</p>
          </div>
          <img
            src="/mascot/hero.png"
            alt="BudMan Mascot"
            className="w-10 h-14 object-contain drop-shadow-sm"
          />
        </div>

        {canInstall && !isStandalone && (
          <div className="p-3 bg-[#dce9da] dark:bg-[#263728] border border-[#c4d7c2] dark:border-[#3d5341] rounded-2xl flex items-center justify-between">
            <span className="text-xs text-[#213123] dark:text-[#f0f6ef] font-medium">Install to Home Screen</span>
            <button
              type="button"
              onClick={triggerInstall}
              className="py-1 px-3 rounded-lg bg-[#54734e] hover:bg-[#466141] text-white font-bold text-xs transition-colors"
            >
              Install
            </button>
          </div>
        )}

        <div className="space-y-1.5 text-xs text-[#5e7d59] dark:text-[#9bb897] pt-1">
          <div className="flex justify-between py-1 border-b border-[#c4d7c2]/60 dark:border-[#384e3b]/60">
            <span>Storage Engine</span>
            <span className="text-[#213123] dark:text-[#f0f6ef] font-medium">Dexie.js (IndexedDB)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#c4d7c2]/60 dark:border-[#384e3b]/60">
            <span>Service Worker</span>
            <span className="text-[#1f3d23] dark:text-[#82a47b] font-medium">Serwist PWA Cache</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#c4d7c2]/60 dark:border-[#384e3b]/60">
            <span>Display Mode</span>
            <span className="text-[#213123] dark:text-[#f0f6ef] font-medium">
              {isStandalone ? "Standalone PWA" : "Web Browser"}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#c4d7c2]/60 dark:border-[#384e3b]/60">
            <span>Storage Protection</span>
            <span
              className={`font-semibold ${
                isPersisted
                  ? "text-[#2e7d32] dark:text-[#81c784]"
                  : "text-amber-700 dark:text-amber-400"
              }`}
            >
              {isPersisted ? "Persistent (Eviction-Proof)" : "Best-Effort (Standard)"}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span>Data Privacy</span>
            <span className="text-[#213123] dark:text-[#f0f6ef] font-medium">
              100% Local Device
            </span>
          </div>
        </div>
      </section>

      <CreateAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onCreated={() => {
          setIsAddAccountOpen(false);
          setStatusMessage({
            type: "success",
            text: "Account added successfully.",
          });
        }}
      />

      <CreateCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onCreated={() => {
          setIsAddCategoryOpen(false);
          setStatusMessage({
            type: "success",
            text: "Category added successfully.",
          });
        }}
      />
    </div>
  );
}
