"use client";

import React, { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Upload,
  FileSpreadsheet,
  FileJson,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Coins,
  HardDrive,
  Info,
  ShieldCheck,
  Smartphone,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { db } from "@/lib/db";
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
} from "@/lib/format";
import { useInstallPrompt } from "./InstallPrompt";
import { useTheme, type ThemeMode } from "@/lib/theme";

export function SettingsView() {
  const currentCurrency = useCurrency();
  const { canInstall, isStandalone, triggerInstall } = useInstallPrompt();
  const { theme, setTheme } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Stats query
  const stats = useLiveQuery(async () => {
    const [txCount, catCount] = await Promise.all([
      db.transactions.count(),
      db.categories.count(),
    ]);
    return { txCount, catCount };
  }, []);

  const handleJsonExport = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      await exportToJson();
      setStatusMessage({ type: "success", text: "JSON backup exported successfully!" });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Failed to export JSON backup." });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCsvExport = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      await exportToCsv();
      setStatusMessage({ type: "success", text: "CSV spreadsheet exported successfully!" });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Failed to export CSV file." });
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
        text: `Restored ${result.transactionsCount} transactions and merged ${result.categoriesCount} categories!`,
      });
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to import backup file.",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
        text: "Database reset to defaults. All transactions cleared.",
      });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Failed to reset database." });
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
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-sm"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* SECTION: Theme & Appearance */}
      <section className="p-5 sm:p-6 bg-[#121215] border border-white/[0.08] rounded-[28px] shadow-xl">
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Appearance & Theme</h3>
            <p className="text-[11px] text-zinc-400">Switch between dark, light, or system mode</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {[
            {
              id: "dark" as ThemeMode,
              label: "Dark",
              desc: "Deep OLED dark",
              icon: Moon,
            },
            {
              id: "light" as ThemeMode,
              label: "Light",
              desc: "Crisp daytime",
              icon: Sun,
            },
            {
              id: "system" as ThemeMode,
              label: "System",
              desc: "Match OS",
              icon: Laptop,
            },
          ].map((mode) => {
            const isSelected = theme === mode.id;
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setTheme(mode.id)}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm ring-1 ring-emerald-500/30"
                    : "bg-black/40 border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/[0.04] text-zinc-400"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <div>
                  <span
                    className={`text-xs font-bold block ${
                      isSelected ? "text-emerald-300" : "text-zinc-200"
                    }`}
                  >
                    {mode.label}
                  </span>
                  <span className="text-[10px] text-zinc-400 block">{mode.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 1: Currency Preference */}
      <section className="p-5 sm:p-6 bg-[#121215] border border-white/[0.08] rounded-[28px] shadow-xl">
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Preferred Currency</h3>
            <p className="text-[11px] text-zinc-400">Choose your display currency symbol</p>
          </div>
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
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30"
                    : "bg-black/40 border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                <span className="truncate">{curr.name}</span>
                <span className="font-black text-sm ml-1 text-white">{curr.symbol}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: Data Backup & Management */}
      <section className="p-5 sm:p-6 bg-[#121215] border border-white/[0.08] rounded-[28px] shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Data & Backup</h3>
            <p className="text-[11px] text-zinc-400">
              {stats?.txCount ?? 0} transactions saved locally
            </p>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* JSON Export */}
          <button
            type="button"
            onClick={handleJsonExport}
            disabled={isExporting}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] active:scale-[0.99] transition-all text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-100 block">Backup (JSON)</span>
              <span className="text-[10px] text-zinc-400">Export full database backup</span>
            </div>
          </button>

          {/* CSV Export */}
          <button
            type="button"
            onClick={handleCsvExport}
            disabled={isExporting}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] active:scale-[0.99] transition-all text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-100 block">Export Spreadsheet</span>
              <span className="text-[10px] text-zinc-400">CSV for Excel / Sheets</span>
            </div>
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
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] active:scale-[0.99] text-xs font-bold text-zinc-200 transition-all"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              {isImporting ? "Restoring backup..." : "Restore Backup from JSON"}
            </button>
          </div>
        </div>

        {/* Reset Database */}
        <div className="pt-3 border-t border-white/[0.06]">
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Database to Defaults
            </button>
          ) : (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2">
              <p className="text-xs text-rose-300 font-semibold text-center">
                Are you sure? This will permanently delete all {stats?.txCount ?? 0} transactions!
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetConfirm}
                  disabled={isResetting}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
                >
                  {isResetting ? "Resetting..." : "Yes, Clear Data"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: PWA & Application Info */}
      <section className="p-5 sm:p-6 bg-[#121215] border border-white/[0.08] rounded-[28px] shadow-xl space-y-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">About BudMan PWA</h3>
            <p className="text-[11px] text-zinc-400">Version 1.0 • Offline First</p>
          </div>
        </div>

        {canInstall && !isStandalone && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-zinc-200 font-medium">Install to Home Screen</span>
            </div>
            <button
              type="button"
              onClick={triggerInstall}
              className="py-1 px-3 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
            >
              Install
            </button>
          </div>
        )}

        <div className="space-y-1.5 text-xs text-zinc-400 pt-1">
          <div className="flex justify-between py-1 border-b border-white/[0.04]">
            <span>Storage Engine</span>
            <span className="text-zinc-200 font-medium">Dexie.js (IndexedDB)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/[0.04]">
            <span>Service Worker</span>
            <span className="text-emerald-400 font-medium">Serwist PWA Cache</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/[0.04]">
            <span>Display Mode</span>
            <span className="text-zinc-200 font-medium">
              {isStandalone ? "Standalone PWA" : "Web Browser"}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span>Data Privacy</span>
            <span className="text-zinc-200 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local Device
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
