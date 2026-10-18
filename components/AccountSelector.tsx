"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, deleteAccount, type Account } from "@/lib/db";
import { useCurrency, formatCurrency } from "@/lib/format";
import { CreateAccountModal } from "./CreateAccountModal";

interface AccountSelectorProps {
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string | null) => void;
}

export function AccountSelector({
  selectedAccountId,
  onSelectAccount,
}: AccountSelectorProps) {
  const currency = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Live Query accounts
  const accounts = useLiveQuery(async () => {
    return await db.accounts.toArray();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this account? Transactions will be preserved.")) {
      await deleteAccount(id);
      if (selectedAccountId === id) {
        onSelectAccount(null);
      }
    }
  };

  const hasAccounts = accounts && accounts.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#4f6852]">
          Accounts
        </span>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-semibold text-[#54734e] hover:text-[#384e34] transition-colors"
        >
          + Add Account
        </button>
      </div>

      {/* Pill Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {/* All Accounts Pill */}
        <button
          type="button"
          onClick={() => onSelectAccount(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border ${
            selectedAccountId === null
              ? "bg-[#54734e] text-white border-[#54734e] shadow-sm"
              : "bg-[#dce9da] border-[#c4d7c2] text-[#223324] hover:bg-[#cfdec8]"
          }`}
        >
          <span>All Accounts</span>
        </button>

        {/* Individual Accounts */}
        {hasAccounts &&
          accounts.map((acc: Account) => {
            const isSelected = selectedAccountId === acc.id;

            return (
              <div key={acc.id} className="relative group shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectAccount(acc.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    isSelected
                      ? "bg-[#54734e] text-white border-[#54734e] shadow-sm"
                      : "bg-[#dce9da] border-[#c4d7c2] text-[#223324] hover:bg-[#cfdec8]"
                  }`}
                >
                  <span className="truncate max-w-[120px]">{acc.name}</span>
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      isSelected
                        ? "text-white"
                        : acc.balance >= 0
                        ? "text-[#2e472a]"
                        : "text-[#872d25]"
                    }`}
                  >
                    {formatCurrency(acc.balance, currency)}
                  </span>
                </button>

                {/* Delete button on hover for non-all pills */}
                <button
                  type="button"
                  aria-label={`Delete ${acc.name}`}
                  onClick={(e) => handleDelete(e, acc.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110"
                >
                  ✕
                </button>
              </div>
            );
          })}
      </div>

      <CreateAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(newId) => {
          onSelectAccount(newId);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
