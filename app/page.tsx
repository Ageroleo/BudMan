"use client";

import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Wallet,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { db, seedDefaults, type Category } from "@/lib/db";
import { useCurrency } from "@/lib/format";
import { BalanceCard } from "@/components/BalanceCard";
import { TransactionList } from "@/components/TransactionList";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { AccountSelector } from "@/components/AccountSelector";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { BudgetProgress } from "@/components/BudgetProgress";
import { SettingsView } from "@/components/SettingsView";
import { SavingsView } from "@/components/SavingsView";
import { BottomNav, type NavTab } from "@/components/BottomNav";
import { OfflineBadge } from "@/components/OfflineBadge";
import { InstallBanner, HeaderInstallButton } from "@/components/InstallPrompt";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavTab>("transactions");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const currency = useCurrency();

  // Seed default categories and accounts if empty
  useEffect(() => {
    if (typeof window !== "undefined") {
      seedDefaults().catch((err) => console.error("Database seed error:", err));
    }
  }, []);

  // Live Query for Categories (Phase 1 Connectivity verification)
  const categories = useLiveQuery(async () => {
    return await db.categories.toArray();
  }, []);

  // Live Query for Accounts
  const accounts = useLiveQuery(async () => {
    return await db.accounts.toArray();
  }, []);

  // Live Query for Financial Metrics & Summary Card
  const metrics = useLiveQuery(async () => {
    const [transactions, accountsList] = await Promise.all([
      db.transactions.toArray(),
      db.accounts.toArray(),
    ]);
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const relevantAccounts =
      selectedAccountId != null
        ? accountsList.filter((a) => a.id === selectedAccountId)
        : accountsList;

    const initialBalanceSum = relevantAccounts.reduce(
      (sum, a) => sum + (a.initialBalance || 0),
      0
    );

    const relevantTx =
      selectedAccountId != null
        ? transactions.filter((tx) => tx.accountId === selectedAccountId)
        : transactions;

    let totalIncome = 0;
    let totalExpenses = 0;
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    for (const tx of relevantTx) {
      const isCurrentMonth = tx.date.startsWith(currentMonth);
      if (tx.type === "income") {
        totalIncome += tx.amount;
        if (isCurrentMonth) monthlyIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
        if (isCurrentMonth) monthlyExpenses += tx.amount;
      }
    }

    const totalBalance = initialBalanceSum + totalIncome - totalExpenses;

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      transactionCount: relevantTx.length,
    };
  }, [selectedAccountId]);

  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId);

  const currentMonthLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center pb-32 selection:bg-emerald-500/20 transition-colors">
      <main className="w-full max-w-md md:max-w-xl px-4 sm:px-6 pt-safe">
        {/* App Header */}
        <header className="flex items-center justify-between py-4 border-b border-white/[0.06] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-surface rounded-[14px] flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white">
                BudMan
              </h1>
            </div>
          </div>

          {/* Right Header: Theme Toggle, Install Button & Live Offline Status Badge */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HeaderInstallButton />
            <OfflineBadge />
          </div>
        </header>

        {/* PWA Install Banner */}
        <InstallBanner />

        {/* VIEW 1: TRANSACTIONS & DASHBOARD FEED */}
        {activeTab === "transactions" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Premium Balance Hero Card with Privacy Toggle */}
            <section aria-label="Financial Balance Hero">
              <BalanceCard
                totalBalance={metrics?.totalBalance ?? 0}
                monthlyIncome={metrics?.monthlyIncome ?? 0}
                monthlyExpenses={metrics?.monthlyExpenses ?? 0}
                currentMonthLabel={currentMonthLabel}
                accountName={selectedAccount ? selectedAccount.name : undefined}
              />
            </section>

            {/* Account Selector Cards */}
            <section aria-label="Accounts and Balances">
              <AccountSelector
                selectedAccountId={selectedAccountId}
                onSelectAccount={setSelectedAccountId}
              />
            </section>

            {/* Seeded Categories in IndexedDB */}
            <section aria-label="Database Categories">
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Categories ({categories?.length ?? 0})
                </h2>
                <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  IndexedDB
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
                {categories && categories.length > 0 ? (
                  categories.map((cat: Category) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#121215] border border-white/[0.06] shrink-0 hover:border-white/[0.12] transition-colors"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        style={{
                          backgroundColor: `${cat.color}25`,
                          color: cat.color,
                        }}
                      >
                        <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">{cat.name}</div>
                        <div className="text-[10px] text-zinc-500 tabular-nums">
                          {cat.budgetMonthly
                            ? `${currency}${cat.budgetMonthly}/mo`
                            : cat.name.toLowerCase() === "salary"
                            ? "Income"
                            : "No limit"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-zinc-500 py-2">Seeding categories...</div>
                )}
              </div>
            </section>

            {/* Grouped Recent Transactions Feed */}
            <section aria-label="Recent Transactions">
              <div className="flex items-center justify-between mb-3 px-0.5">
                <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Recent Activity
                  {selectedAccount && (
                    <span className="text-xs font-normal text-emerald-400">
                      • {selectedAccount.name}
                    </span>
                  )}
                </h2>
                <span className="text-xs text-zinc-500 tabular-nums">
                  {metrics?.transactionCount ?? 0} records
                </span>
              </div>

              <TransactionList filterAccountId={selectedAccountId} />
            </section>
          </div>
        )}

        {/* VIEW 2: VISUAL ANALYTICS & BUDGET PROGRESS */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Spending Distribution Donut Chart */}
            <section aria-label="Spending Analytics">
              <CategoryBreakdown />
            </section>

            {/* Category Budget Progress Bars & Inline Setting */}
            <section aria-label="Budget Progress">
              <BudgetProgress />
            </section>
          </div>
        )}

        {/* VIEW 3: SAVINGS GOALS & SMART TIMELINE CALCULATOR */}
        {activeTab === "savings" && (
          <section aria-label="Savings Goals and Calculator">
            <SavingsView />
          </section>
        )}

        {/* VIEW 4: SETTINGS & DATA MANAGEMENT */}
        {activeTab === "settings" && (
          <section aria-label="Settings and Backup">
            <SettingsView />
          </section>
        )}

        {/* Floating Action Button & Bottom Sheet Modal */}
        {(activeTab === "transactions" || activeTab === "analytics") && (
          <AddTransactionModal />
        )}

        {/* Floating Frosted Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </main>
    </div>
  );
}
