"use client";

import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, seedDefaults, type Category } from "@/lib/db";
import { useCurrency } from "@/lib/format";
import { useActiveAvatar } from "@/lib/avatar";
import { CardCarousel } from "@/components/CardCarousel";
import { TransactionList } from "@/components/TransactionList";
import { AddTransactionModal } from "@/components/AddTransactionModal";
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
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const currency = useCurrency();
  const { avatar, setAvatar, allAvatars } = useActiveAvatar();

  const handleNextAvatar = () => {
    const currentIndex = allAvatars.findIndex((a) => a.id === avatar.id);
    const nextIdx = (currentIndex + 1) % allAvatars.length;
    setAvatar(allAvatars[nextIdx].id);
  };

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
    const transactions = await db.transactions.toArray();
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const relevantTx =
      selectedAccountId != null
        ? transactions.filter((tx) => tx.accountId === selectedAccountId)
        : transactions;

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    for (const tx of relevantTx) {
      const isCurrentMonth = tx.date.startsWith(currentMonth);
      if (tx.type === "income") {
        if (isCurrentMonth) monthlyIncome += tx.amount;
      } else {
        if (isCurrentMonth) monthlyExpenses += tx.amount;
      }
    }

    return {
      monthlyIncome,
      monthlyExpenses,
      transactionCount: relevantTx.length,
    };
  }, [selectedAccountId]);

  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId);

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center pb-32 selection:bg-[#c4d7c2] selection:text-[#213123] transition-colors">
      <main className="w-full max-w-md md:max-w-xl px-4 sm:px-6 pt-safe">
        {/* App Header */}
        <header className="flex items-center justify-between py-4 border-b border-[#c4d7c2] dark:border-[#384e3b] mb-5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleNextAvatar}
              title={`BudMan Mascot: ${avatar.name} (${avatar.mood}) — Click to switch mood!`}
              className="relative group transition-transform active:scale-90 focus:outline-none"
            >
              <img
                src={avatar.src}
                alt={`BudMan Mascot - ${avatar.name}`}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full shadow-xs object-cover border-2 border-[#54734e]/50 dark:border-[#a3c99f]/50 group-hover:border-[#54734e] transition-all"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#54734e] text-white text-[8px] font-bold flex items-center justify-center border-2 border-background">
                ★
              </span>
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#213123] dark:text-white leading-none">
                BudMan
              </h1>
              <span className="text-[10px] text-[#5e7d59] dark:text-[#9bb897] font-semibold">
                {avatar.mood}
              </span>
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
            {/* Realistic Digital Debit/Wallet Card Carousel Hero */}
            <section aria-label="Digital Cards & Accounts">
              <CardCarousel
                accounts={accounts || []}
                selectedAccountId={selectedAccountId}
                onSelectAccount={setSelectedAccountId}
              />
            </section>

            {/* Seeded Categories in IndexedDB */}
            <section aria-label="Database Categories">
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#9bb897]">
                  Categories ({categories?.length ?? 0})
                </h2>
                <span className="text-[10px] font-semibold text-[#2e4331] dark:text-[#c9dec8] bg-[#dce9da] dark:bg-[#263728] border border-[#c4d7c2] dark:border-[#384e3b] px-2 py-0.5 rounded-full">
                  IndexedDB
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
                {categories && categories.length > 0 ? (
                  categories.map((cat: Category) => (
                    <div
                      key={cat.id}
                      className="px-3.5 py-2 rounded-2xl bg-[#e2ede1] dark:bg-[#1e2c20] border border-[#c4d7c2] dark:border-[#2d4231] shrink-0 hover:border-[#a8c3a5] dark:hover:border-[#3d5a42] hover:bg-[#d9e7d8] dark:hover:bg-[#253628] transition-all shadow-xs"
                    >
                      <div className="text-xs font-bold text-[#213123] dark:text-white">{cat.name}</div>
                      <div className="text-[10px] text-[#5e7d59] dark:text-[#9bb897] tabular-nums font-medium">
                        {cat.budgetMonthly
                          ? `${currency}${cat.budgetMonthly}/mo`
                          : cat.name.toLowerCase() === "salary"
                            ? "Income"
                            : "No limit"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#5c755f] dark:text-[#9bb897] py-2">Seeding categories...</div>
                )}
              </div>
            </section>

            {/* Grouped Recent Transactions Feed */}
            <section aria-label="Recent Transactions">
              <div className="flex items-center justify-between mb-3 px-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#213123] dark:text-white">
                    Recent Activity
                  </h2>
                  {selectedAccount ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#d6e5d4] dark:bg-[#263728] border border-[#c4d7c2] dark:border-[#384e3b] text-xs font-semibold text-[#213123] dark:text-[#c9dec8]">
                      <span>{selectedAccount.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedAccountId(null)}
                        className="hover:text-rose-500 font-bold ml-0.5"
                        title="Show all accounts"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897]">
                      • All Cards
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#5c755f] dark:text-[#9bb897] tabular-nums">
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
