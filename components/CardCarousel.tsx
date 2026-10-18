"use client";

import React, { useState, useRef, useEffect } from "react";
import { db, deleteAccount, type Account, type Transaction } from "@/lib/db";
import { useCurrency, formatCurrency } from "@/lib/format";
import { AccountCard } from "./AccountCard";
import { CreateAccountModal } from "./CreateAccountModal";

interface CardCarouselProps {
  accounts: Account[];
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string | null) => void;
  className?: string;
}

const PRIVACY_KEY = "budman_privacy_masked";

export function CardCarousel({
  accounts,
  selectedAccountId,
  onSelectAccount,
  className = "",
}: CardCarouselProps) {
  const currency = useCurrency();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMasked, setIsMasked] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Quick Action Modal states
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);

  // Form states for Add Funds
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // Form states for Transfer
  const [transferTargetId, setTransferTargetId] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");

  // Account Deletion states
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load privacy state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(PRIVACY_KEY);
      if (stored === "true") setIsMasked(true);
    }
  }, []);

  const toggleMask = () => {
    const next = !isMasked;
    setIsMasked(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(PRIVACY_KEY, String(next));
    }
  };

  // Sync active card index with selectedAccountId
  useEffect(() => {
    if (selectedAccountId && accounts.length > 0) {
      const idx = accounts.findIndex((a) => a.id === selectedAccountId);
      if (idx !== -1 && idx !== activeIndex) {
        setActiveIndex(idx);
        scrollToIndex(idx);
      }
    }
  }, [selectedAccountId, accounts]);

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardElement = container.children[index] as HTMLElement;
    if (cardElement) {
      container.scrollTo({
        left: cardElement.offsetLeft - container.offsetLeft,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.clientWidth * 0.88;
    const newIndex = Math.round(scrollLeft / cardWidth);
    if (newIndex >= 0 && newIndex < accounts.length && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      onSelectAccount(accounts[newIndex].id);
    }
  };

  const currentAccount = accounts[activeIndex] || accounts[0];
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  // Handle Quick Deposit / Add Funds
  const handleAddFundsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setActionError("Please enter a valid deposit amount");
      return;
    }

    try {
      const targetAcc = accounts.find((a) => a.id === currentAccount.id);
      if (targetAcc) {
        // Update account balance
        const newBal = (targetAcc.balance || 0) + amt;
        await db.accounts.update(targetAcc.id, { balance: newBal });

        // Record income transaction in database
        await db.transactions.add({
          amount: amt,
          type: "income",
          categoryId: 7, // Salary / Deposit
          accountId: targetAcc.id,
          date: new Date().toISOString().slice(0, 10),
          note: depositNote.trim() || `Deposit to ${targetAcc.name}`,
          createdAt: new Date(),
        });

        setIsAddFundsOpen(false);
        setDepositAmount("");
        setDepositNote("");
      }
    } catch (err) {
      console.error("Deposit error:", err);
      setActionError("Failed to add funds");
    }
  };

  // Handle Quick Transfer Between Cards
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setActionError("Please enter a valid transfer amount");
      return;
    }

    if (!transferTargetId || transferTargetId === currentAccount.id) {
      setActionError("Please select a different destination account");
      return;
    }

    const fromAcc = accounts.find((a) => a.id === currentAccount.id);
    const toAcc = accounts.find((a) => a.id === transferTargetId);

    if (!fromAcc || !toAcc) {
      setActionError("Accounts not found");
      return;
    }

    if (fromAcc.balance < amt) {
      setActionError(`Insufficient balance in ${fromAcc.name}`);
      return;
    }

    try {
      await db.transaction("rw", db.accounts, db.transactions, async () => {
        // Deduct from sender
        await db.accounts.update(fromAcc.id, { balance: fromAcc.balance - amt });
        // Add to receiver
        await db.accounts.update(toAcc.id, { balance: toAcc.balance + amt });

        // Record transfer transactions
        const today = new Date().toISOString().slice(0, 10);
        await db.transactions.add({
          amount: amt,
          type: "expense",
          categoryId: 5, // Transfer / Utilities
          accountId: fromAcc.id,
          date: today,
          note: transferNote.trim() || `Transfer to ${toAcc.name}`,
          createdAt: new Date(),
        });

        await db.transactions.add({
          amount: amt,
          type: "income",
          categoryId: 7, // Income / Deposit
          accountId: toAcc.id,
          date: today,
          note: transferNote.trim() || `Transfer from ${fromAcc.name}`,
          createdAt: new Date(),
        });
      });

      setIsTransferOpen(false);
      setTransferAmount("");
      setTransferNote("");
      setTransferTargetId("");
    } catch (err) {
      console.error("Transfer error:", err);
      setActionError("Failed to complete transfer");
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentAccount) return;
    setIsDeleting(true);
    try {
      const accountToDeleteId = currentAccount.id;
      await deleteAccount(accountToDeleteId);

      const remainingAccounts = accounts.filter((a) => a.id !== accountToDeleteId);
      if (remainingAccounts.length > 0) {
        const nextIdx = Math.min(activeIndex, remainingAccounts.length - 1);
        setActiveIndex(nextIdx);
        onSelectAccount(remainingAccounts[nextIdx].id);
      } else {
        setActiveIndex(0);
        onSelectAccount(null);
      }

      setIsConfirmingDelete(false);
      setIsSettingsOpen(false);
    } catch (err) {
      console.error("Failed to delete account:", err);
      setActionError("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!accounts || accounts.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Empty Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897] block">
              My Cards & Accounts
            </span>
            <h2 className="text-xl font-black text-[#213123] dark:text-[#f0f6ef]">
              {formatCurrency(0, currency)}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateAccountOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#54734e] hover:bg-[#435e3e] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <span>+ Add Card</span>
          </button>
        </div>

        {/* Empty State Banner */}
        <div className="p-7 rounded-3xl bg-[#e2ede1]/70 dark:bg-[#1c291e]/70 border-2 border-dashed border-[#c4d7c2] dark:border-[#384e3b] text-center space-y-3">
          <p className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef]">
            No card accounts active
          </p>
          <p className="text-xs text-[#5e7d59] dark:text-[#9bb897] max-w-xs mx-auto leading-relaxed">
            All card accounts have been removed. Add your digital bank or wallet card (GCash, Maya, SeaBank, BPI, Landbank) to manage balances.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsCreateAccountOpen(true)}
              className="px-4 py-2 rounded-2xl bg-[#54734e] hover:bg-[#435e3e] text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              + Add New Card
            </button>
          </div>
        </div>

        <CreateAccountModal
          isOpen={isCreateAccountOpen}
          onClose={() => setIsCreateAccountOpen(false)}
          onCreated={(newId) => {
            onSelectAccount(newId);
            setIsCreateAccountOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Header: Total Aggregate Portfolio & Privacy Eye Toggle */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897] block">
            {selectedAccountId ? `${currentAccount.name} Balance` : "Total Portfolio Balance"}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl sm:text-3xl font-black text-[#213123] dark:text-white tabular-nums tracking-tight ${
                isMasked ? "privacy-blur select-none" : ""
              }`}
            >
              {isMasked
                ? `${currency}••••••`
                : formatCurrency(
                    selectedAccountId ? currentAccount.balance : totalBalance,
                    currency
                  )}
            </span>
            {selectedAccountId && (
              <button
                type="button"
                onClick={() => onSelectAccount(null)}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#d6e5d4] dark:bg-[#263728] text-[#213123] dark:text-[#c9dec8] hover:bg-[#c4d7c2] transition-colors"
                title="View All Accounts"
              >
                Show All
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsCreateAccountOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#d6e5d4] dark:bg-[#25392b] border border-[#c1d5bf] dark:border-[#38533e] text-[11px] font-bold text-[#263828] dark:text-[#cde0cb] hover:bg-[#c8dec5] transition-all shadow-xs"
            title="Add Card Account"
          >
            <span>+ Card</span>
          </button>

          {/* Privacy eye toggle */}
          <button
            type="button"
            onClick={toggleMask}
            aria-label={isMasked ? "Show Balance" : "Hide Balance"}
            title={isMasked ? "Reveal balance" : "Mask balance"}
            className="px-2.5 py-1.5 rounded-full bg-[#e2ede1] dark:bg-[#1e2c20] border border-[#c4d7c2] dark:border-[#384e3b] text-[11px] font-bold text-[#213123] dark:text-white hover:bg-[#d6e5d4] transition-all shadow-xs"
          >
            <span>{isMasked ? "Show" : "Hide"}</span>
          </button>
        </div>
      </div>

      {/* Swipeable Snap Card Carousel */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-2 no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {accounts.map((acc, index) => {
          const isCurrentActive = selectedAccountId ? selectedAccountId === acc.id : index === activeIndex;
          return (
            <div
              key={acc.id}
              className="snap-center shrink-0 w-[88%] sm:w-[360px] cursor-pointer"
              onClick={() => {
                setActiveIndex(index);
                onSelectAccount(acc.id);
                scrollToIndex(index);
              }}
            >
              <AccountCard
                account={acc}
                isMasked={isMasked}
                isActive={isCurrentActive}
              />
            </div>
          );
        })}
      </div>

      {/* Card Indicators (Dots / Active Account Pill) */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-1.5">
          {accounts.map((acc, idx) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => {
                setActiveIndex(idx);
                onSelectAccount(acc.id);
                scrollToIndex(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? "w-6 bg-[#54734e] shadow-xs"
                  : "w-2 bg-[#c4d7c2] dark:bg-[#384e3b] hover:bg-[#a8c3a5]"
              }`}
              title={acc.name}
            />
          ))}
        </div>

        <span className="text-[11px] font-bold text-[#5e7d59] dark:text-[#9bb897] capitalize">
          {currentAccount.name} ({activeIndex + 1}/{accounts.length})
        </span>
      </div>

      {/* Quick Action Bar below active card */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {/* Add Funds Button */}
        <button
          type="button"
          onClick={() => {
            setActionError(null);
            setIsAddFundsOpen(true);
          }}
          className="flex items-center justify-center py-2.5 px-2 rounded-2xl bg-[#e2ede1] dark:bg-[#1e2c20] hover:bg-[#d6e5d4] dark:hover:bg-[#253628] border border-[#c4d7c2] dark:border-[#384e3b] text-[#213123] dark:text-[#f0f6ef] text-xs font-bold transition-all active:scale-95 shadow-xs"
        >
          <span>+ Add Funds</span>
        </button>

        {/* Transfer Button */}
        <button
          type="button"
          onClick={() => {
            setActionError(null);
            const otherAcc = accounts.find((a) => a.id !== currentAccount.id);
            setTransferTargetId(otherAcc ? otherAcc.id : "");
            setIsTransferOpen(true);
          }}
          className="flex items-center justify-center py-2.5 px-2 rounded-2xl bg-[#e2ede1] dark:bg-[#1e2c20] hover:bg-[#d6e5d4] dark:hover:bg-[#253628] border border-[#c4d7c2] dark:border-[#384e3b] text-[#213123] dark:text-[#f0f6ef] text-xs font-bold transition-all active:scale-95 shadow-xs"
        >
          <span>Transfer</span>
        </button>

        {/* Card Settings / Manage */}
        <button
          type="button"
          onClick={() => {
            setIsSettingsOpen(true);
          }}
          className="flex items-center justify-center py-2.5 px-2 rounded-2xl bg-[#e2ede1] dark:bg-[#1e2c20] hover:bg-[#d6e5d4] dark:hover:bg-[#253628] border border-[#c4d7c2] dark:border-[#384e3b] text-[#213123] dark:text-[#f0f6ef] text-xs font-bold transition-all active:scale-95 shadow-xs"
        >
          <span>Card Info</span>
        </button>
      </div>

      {/* QUICK MODAL 1: ADD FUNDS */}
      {isAddFundsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#162218]/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddFundsOpen(false);
          }}
        >
          <div className="w-full max-w-sm bg-[#e5efe3] dark:bg-[#1c291e] border border-[#c1d5bf] dark:border-[#384e3b] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#c1d5bf]/60 dark:border-[#384e3b]/60">
              <div>
                <h3 className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef]">
                  Add Funds to {currentAccount.name}
                </h3>
                <p className="text-[10px] text-[#5e7d59] dark:text-[#9bb897]">
                  Current: {formatCurrency(currentAccount.balance, currency)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFundsOpen(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5e7d59] hover:text-[#213123] hover:bg-[#d6e5d4]"
              >
                Close
              </button>
            </div>

            {actionError && (
              <div className="p-2.5 rounded-xl bg-[#b34033]/10 border border-[#b34033]/30 text-[#b34033] text-xs font-semibold">
                {actionError}
              </div>
            )}

            <form onSubmit={handleAddFundsSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897] mb-1">
                  Deposit Amount
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-[#5e7d59]">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="1000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-[#edf4eb] dark:bg-[#162218] border border-[#c1d5bf] dark:border-[#384e3b] rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-[#213123] dark:text-[#f0f6ef] placeholder-[#82a47b] focus:outline-none focus:border-[#54734e] tabular-nums"
                  />
                </div>
              </div>

              {/* Quick deposit presets */}
              <div className="grid grid-cols-4 gap-1.5">
                {[500, 1000, 2500, 5000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmount(String(val))}
                    className="py-1.5 rounded-xl border border-[#c4d7c2] dark:border-[#384e3b] bg-[#d6e5d4] dark:bg-[#263728] hover:bg-[#c6daca] text-[#213123] dark:text-[#c9dec8] text-[11px] font-bold tabular-nums transition-colors"
                  >
                    +{val}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897] mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Payroll, Savings Top-up"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  className="w-full bg-[#edf4eb] dark:bg-[#162218] border border-[#c1d5bf] dark:border-[#384e3b] rounded-xl px-3.5 py-2 text-xs text-[#213123] dark:text-[#f0f6ef] placeholder-[#82a47b] focus:outline-none focus:border-[#54734e]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#54734e] hover:bg-[#466141] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#54734e]/40 active:scale-95"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK MODAL 2: TRANSFER BETWEEN ACCOUNTS */}
      {isTransferOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#162218]/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTransferOpen(false);
          }}
        >
          <div className="w-full max-w-sm bg-[#e5efe3] dark:bg-[#1c291e] border border-[#c1d5bf] dark:border-[#384e3b] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#c1d5bf]/60 dark:border-[#384e3b]/60">
              <div>
                <h3 className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef]">
                  Transfer from {currentAccount.name}
                </h3>
                <p className="text-[10px] text-[#5e7d59] dark:text-[#9bb897]">
                  Available: {formatCurrency(currentAccount.balance, currency)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferOpen(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5e7d59] hover:text-[#213123] hover:bg-[#d6e5d4]"
              >
                Close
              </button>
            </div>

            {actionError && (
              <div className="p-2.5 rounded-xl bg-[#b34033]/10 border border-[#b34033]/30 text-[#b34033] text-xs font-semibold">
                {actionError}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897] mb-1">
                  Destination Account
                </label>
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  required
                  className="w-full bg-[#edf4eb] dark:bg-[#162218] border border-[#c1d5bf] dark:border-[#384e3b] rounded-xl px-3.5 py-2.5 text-xs text-[#213123] dark:text-[#f0f6ef] focus:outline-none focus:border-[#54734e]"
                >
                  <option value="">Select Destination Card</option>
                  {accounts
                    .filter((a) => a.id !== currentAccount.id)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.balance, currency)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897] mb-1">
                  Transfer Amount
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-[#5e7d59]">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={currentAccount.balance}
                    placeholder="500"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    required
                    className="w-full bg-[#edf4eb] dark:bg-[#162218] border border-[#c1d5bf] dark:border-[#384e3b] rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-[#213123] dark:text-[#f0f6ef] placeholder-[#82a47b] focus:outline-none focus:border-[#54734e] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897] mb-1">
                  Transfer Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Budget reallocation, wallet reload"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full bg-[#edf4eb] dark:bg-[#162218] border border-[#c1d5bf] dark:border-[#384e3b] rounded-xl px-3.5 py-2 text-xs text-[#213123] dark:text-[#f0f6ef] placeholder-[#82a47b] focus:outline-none focus:border-[#54734e]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#54734e] hover:bg-[#466141] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#54734e]/40 active:scale-95"
                >
                  Send Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK MODAL 3: CARD INFO & DETAILS */}
      {isSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#162218]/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSettingsOpen(false);
          }}
        >
          <div className="w-full max-w-sm bg-[#e5efe3] dark:bg-[#1c291e] border border-[#c1d5bf] dark:border-[#384e3b] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#c1d5bf]/60 dark:border-[#384e3b]/60">
              <h3 className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef]">
                {currentAccount.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5e7d59] hover:text-[#213123] hover:bg-[#d6e5d4]"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#213123] dark:text-[#f0f6ef]">
              <div className="flex justify-between py-1 border-b border-[#c1d5bf]/50 dark:border-[#384e3b]/50">
                <span className="text-[#5e7d59] dark:text-[#9bb897]">Cardholder</span>
                <span className="font-bold">{currentAccount.cardholderName || "JUAN DELA CRUZ"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#c1d5bf]/50 dark:border-[#384e3b]/50">
                <span className="text-[#5e7d59] dark:text-[#9bb897]">Card Number</span>
                <span className="font-mono font-bold">{currentAccount.accountNumberMasked}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#c1d5bf]/50 dark:border-[#384e3b]/50">
                <span className="text-[#5e7d59] dark:text-[#9bb897]">Card Type</span>
                <span className="capitalize font-bold">{currentAccount.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#c1d5bf]/50 dark:border-[#384e3b]/50">
                <span className="text-[#5e7d59] dark:text-[#9bb897]">Expires</span>
                <span className="font-mono font-bold">{currentAccount.expiryDate || "12/28"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#5e7d59] dark:text-[#9bb897]">Current Balance</span>
                <span className="font-bold text-[#1f3d23] dark:text-[#82a47b]">
                  {formatCurrency(currentAccount.balance, currency)}
                </span>
              </div>
            </div>

            {/* Remove / Delete Confirmation block */}
            {isConfirmingDelete ? (
              <div className="space-y-3 p-3.5 rounded-2xl bg-[#b34033]/10 border border-[#b34033]/30 text-center animate-in fade-in duration-150">
                <p className="text-xs font-bold text-[#b34033] dark:text-[#f87171]">
                  Remove {currentAccount.name}?
                </p>
                <p className="text-[11px] text-[#5e7d59] dark:text-[#9bb897] leading-relaxed">
                  This card account will be permanently removed. Your past transactions will remain safely in your history, but will no longer be linked to this card.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="flex-1 py-2 rounded-xl bg-[#dce9da] dark:bg-[#253628] text-xs font-bold text-[#213123] dark:text-[#f0f6ef] hover:bg-[#cfdec8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="flex-1 py-2 rounded-xl bg-[#b34033] text-white text-xs font-bold hover:bg-[#993429] transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {isDeleting ? "Removing..." : "Yes, Remove"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="w-full py-2.5 rounded-2xl border border-[#b34033]/40 text-[#b34033] dark:text-[#f87171] hover:bg-[#b34033]/10 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Remove Card Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsConfirmingDelete(false);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-[#54734e] hover:bg-[#466141] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
        onCreated={(newId) => {
          onSelectAccount(newId);
          setIsCreateAccountOpen(false);
        }}
      />
    </div>
  );
}
