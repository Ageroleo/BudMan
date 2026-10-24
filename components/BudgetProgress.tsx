"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Category } from "@/lib/db";
import { useCurrency, formatCurrency } from "@/lib/format";
import { CreateCategoryModal } from "./CreateCategoryModal";

export function BudgetProgress() {
  const currency = useCurrency();
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editBudgetValue, setEditBudgetValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // State for Category creation
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

  // State for "Add Category Budget" Modal
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [selectedAddCatId, setSelectedAddCatId] = useState<number | null>(null);
  const [addBudgetValue, setAddBudgetValue] = useState<string>("");
  const [addBudgetError, setAddBudgetError] = useState<string | null>(null);

  // Current month key "YYYY-MM"
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  // Live Query categories and current month expenses
  const data = useLiveQuery(async () => {
    const [categories, transactions] = await Promise.all([
      db.categories.toArray(),
      db.transactions.toArray(),
    ]);

    // Current month expenses
    const monthExpenses = transactions.filter(
      (tx) => tx.type === "expense" && tx.date.startsWith(currentMonthKey)
    );

    const spendMap = new Map<number, number>();
    for (const tx of monthExpenses) {
      const current = spendMap.get(tx.categoryId) ?? 0;
      spendMap.set(tx.categoryId, current + tx.amount);
    }

    // Exclude Salary or categories intended purely for income
    const expenseCategories = categories.filter((c) => c.name.toLowerCase() !== "salary");

    // Only categories that the user explicitly gave a budget to
    const budgetedCategories = expenseCategories.filter(
      (c) => c.budgetMonthly !== undefined && c.budgetMonthly > 0
    );

    // Unbudgeted categories for the "Add Budget" selector
    const unbudgetedCategories = expenseCategories.filter(
      (c) => c.budgetMonthly === undefined || c.budgetMonthly <= 0
    );

    let totalBudgeted = 0;
    let totalSpent = 0;

    const list = budgetedCategories.map((cat) => {
      const budget = cat.budgetMonthly ?? 0;
      const spent = spendMap.get(cat.id ?? 0) ?? 0;
      const remaining = budget - spent;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;

      totalBudgeted += budget;
      totalSpent += spent;

      // Status indicator
      let status: "ok" | "warning" | "over" = "ok";
      if (percentage >= 100) status = "over";
      else if (percentage >= 80) status = "warning";

      return {
        ...cat,
        budget,
        spent,
        remaining,
        percentage,
        status,
      };
    });

    // Sort: over budget first, then highest percentage
    list.sort((a, b) => b.percentage - a.percentage);

    const overallPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    const totalRemaining = totalBudgeted - totalSpent;

    return {
      list,
      unbudgetedCategories,
      totalBudgeted,
      totalSpent,
      totalRemaining,
      overallPercentage,
    };
  }, [currentMonthKey]);

  const handleStartEdit = (cat: Category & { budget: number }) => {
    setEditingCategoryId(cat.id ?? null);
    setEditBudgetValue(String(cat.budget));
  };

  const handleSaveBudget = async (categoryId: number) => {
    const val = parseFloat(editBudgetValue);
    if (isNaN(val) || val < 0) return;

    setIsSaving(true);
    try {
      await db.categories.update(categoryId, {
        budgetMonthly: val === 0 ? undefined : val,
      });
      setEditingCategoryId(null);
    } catch (err) {
      console.error("Failed to update budget:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveBudget = async (categoryId: number) => {
    if (confirm("Remove budget limit for this category?")) {
      try {
        await db.categories.update(categoryId, {
          budgetMonthly: undefined,
        });
      } catch (err) {
        console.error("Failed to remove budget:", err);
      }
    }
  };

  const handleOpenAddBudget = () => {
    if (data?.unbudgetedCategories && data.unbudgetedCategories.length > 0) {
      setSelectedAddCatId(data.unbudgetedCategories[0].id ?? null);
    }
    setAddBudgetValue("");
    setAddBudgetError(null);
    setIsAddBudgetOpen(true);
  };

  const handleCreateCategoryBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddCatId) {
      setAddBudgetError("Please select a category");
      return;
    }

    const val = parseFloat(addBudgetValue);
    if (isNaN(val) || val <= 0) {
      setAddBudgetError("Please enter a valid monthly limit");
      return;
    }

    setIsSaving(true);
    try {
      await db.categories.update(selectedAddCatId, {
        budgetMonthly: val,
      });
      setIsAddBudgetOpen(false);
      setAddBudgetValue("");
    } catch (err) {
      console.error("Failed to set category budget:", err);
      setAddBudgetError("Failed to save budget limit");
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) {
    return (
      <div className="space-y-3">
        <div className="h-28 rounded-3xl bg-[#dbe8da]/70 border border-[#c1d5bf] animate-pulse" />
      </div>
    );
  }

  const {
    list,
    unbudgetedCategories,
    totalBudgeted,
    totalSpent,
    totalRemaining,
    overallPercentage,
  } = data;

  return (
    <div className="space-y-4">
      {/* Overview Banner Card */}
      <div className="p-5 bg-[#e2ede1] border border-[#c4d7c2] rounded-[28px] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#213123]">Monthly Budget</h3>
            <p className="text-[11px] text-[#4f6852]">
              {list.length > 0
                ? `${list.length} category ${list.length === 1 ? "budget" : "budgets"} active`
                : "No category budgets set"}
            </p>
          </div>
          {totalBudgeted > 0 && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border tabular-nums ${
                overallPercentage > 100
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : overallPercentage >= 80
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-[#dce9da] text-[#263828] border-[#c4d7c2]"
              }`}
            >
              {overallPercentage.toFixed(0)}% used
            </span>
          )}
        </div>

        {totalBudgeted > 0 ? (
          <>
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-[#d3e3d1] rounded-full overflow-hidden border border-[#c4d7c2] p-0.5 mb-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallPercentage > 100
                    ? "bg-[#b34033]"
                    : overallPercentage >= 80
                    ? "bg-[#d97706]"
                    : "bg-[#54734e]"
                }`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>

            {/* Figures summary */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#c4d7c2] text-center">
              <div>
                <span className="text-[10px] text-[#5c755f] uppercase tracking-wider block">Budget</span>
                <span className="text-xs font-bold text-[#213123] tabular-nums">
                  {formatCurrency(totalBudgeted, currency, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#5c755f] uppercase tracking-wider block">Spent</span>
                <span className="text-xs font-bold text-[#b34033] tabular-nums">
                  {formatCurrency(totalSpent, currency, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#5c755f] uppercase tracking-wider block">Remaining</span>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    totalRemaining >= 0 ? "text-[#1f3d23]" : "text-[#b34033]"
                  }`}
                >
                  {totalRemaining >= 0
                    ? formatCurrency(totalRemaining, currency, { maximumFractionDigits: 0 })
                    : `-${currency}${Math.abs(totalRemaining).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="pt-2 text-center py-2">
            <p className="text-xs text-[#5c755f]">
              Set spending limits for categories below to track and manage your budget.
            </p>
          </div>
        )}
      </div>

      {/* Category Progress List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#4f6852]">
            Category Budgets {list.length > 0 ? `(${list.length})` : ""}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreateCategoryOpen(true)}
              className="text-xs font-semibold text-[#54734e] hover:text-[#384e34] transition-colors"
            >
              + New Category
            </button>
            {unbudgetedCategories.length > 0 && (
              <button
                type="button"
                onClick={handleOpenAddBudget}
                className="text-xs font-semibold text-[#54734e] hover:text-[#384e34] transition-colors"
              >
                + Set Budget
              </button>
            )}
          </div>
        </div>

        {list.length > 0 ? (
          <div className="space-y-2.5">
            {list.map((cat) => {
              const isEditing = editingCategoryId === cat.id;

              // Status color configs
              let progressColor = "bg-[#54734e]";
              let badgeClass = "bg-[#dce9da] text-[#263828] border-[#c4d7c2]";

              if (cat.status === "warning") {
                progressColor = "bg-[#d97706]";
                badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
              } else if (cat.status === "over") {
                progressColor = "bg-[#b34033]";
                badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
              }

              return (
                <div
                  key={cat.id}
                  className="p-4 bg-[#e2ede1] border border-[#c8dbc6] hover:bg-[#d9e7d8] rounded-2xl transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    {/* Category Name & Color Indicator */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div>
                        <span className="text-sm font-semibold text-[#213123] block truncate">
                          {cat.name}
                        </span>
                        <span className="text-[11px] text-[#5c755f] tabular-nums">
                          {formatCurrency(cat.spent, currency)} spent
                        </span>
                      </div>
                    </div>

                    {/* Budget Limit & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 bg-[#dbe8da] p-1 rounded-xl border border-[#c1d5bf]">
                          <span className="text-xs text-[#5c755f] pl-1">{currency}</span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={editBudgetValue}
                            onChange={(e) => setEditBudgetValue(e.target.value)}
                            className="w-16 bg-transparent text-xs font-bold text-[#213123] outline-none tabular-nums"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => cat.id && handleSaveBudget(cat.id)}
                            disabled={isSaving}
                            className="px-2 py-0.5 rounded-lg bg-[#54734e] text-white text-xs font-bold hover:bg-[#466141] transition-colors"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategoryId(null)}
                            className="px-1.5 py-0.5 rounded-lg text-xs font-semibold text-[#5c755f] hover:text-[#213123] transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#4f6852] tabular-nums">
                            / {formatCurrency(cat.budget, currency, { maximumFractionDigits: 0 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold text-[#5c755f] hover:text-[#213123] hover:bg-[#d6e5d4] transition-colors"
                            title="Edit budget limit"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => cat.id && handleRemoveBudget(cat.id)}
                            className="px-1.5 py-1 rounded-lg text-xs font-semibold text-[#7d9680] hover:text-[#b34033] hover:bg-[#b34033]/10 transition-colors"
                            title="Remove budget limit"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-[#d3e3d1] rounded-full overflow-hidden p-0.5 border border-[#c4d7c2] mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    />
                  </div>

                  {/* Status caption */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${badgeClass}`}
                    >
                      {cat.status === "over"
                        ? `Over budget by ${currency}${Math.abs(cat.remaining).toFixed(0)}`
                        : cat.status === "warning"
                        ? `Approaching limit (${currency}${cat.remaining.toFixed(0)} left)`
                        : `${currency}${cat.remaining.toFixed(0)} remaining`}
                    </span>
                    <span className="text-[#5c755f] font-medium tabular-nums">
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="p-6 bg-[#e2ede1] border border-dashed border-[#b8d2b6] rounded-3xl text-center space-y-3">
            <div className="flex justify-center">
              <img
                src="/mascot/backpack.png"
                alt="BudMan Budget Companion"
                className="w-20 h-20 object-contain drop-shadow-sm"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-[#213123]">No Category Budgets Set</p>
              <p className="text-xs text-[#5c755f] max-w-xs mx-auto mt-1">
                You haven&apos;t set spending limits for any categories yet. Add a budget to monitor and control your monthly expenses with BudMan.
              </p>
            </div>
            {unbudgetedCategories.length > 0 && (
              <button
                type="button"
                onClick={handleOpenAddBudget}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-[#54734e] hover:bg-[#466141] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#54734e]/30 active:scale-95 transition-all"
              >
                + Set a Category Budget
              </button>
            )}
          </div>
        )}
      </div>

      {/* Set Category Budget Modal */}
      {isAddBudgetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-[#162218]/40 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddBudgetOpen(false);
          }}
        >
          <div className="w-full max-w-sm bg-[#e5efe3] border border-[#c1d5bf] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#c1d5bf]">
              <h3 className="text-sm font-bold text-[#213123]">Set Category Budget</h3>
              <button
                type="button"
                onClick={() => setIsAddBudgetOpen(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5c755f] hover:text-[#213123] hover:bg-[#d6e5d4] transition-colors"
              >
                Close
              </button>
            </div>

            {addBudgetError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {addBudgetError}
              </div>
            )}

            <form onSubmit={handleCreateCategoryBudget} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852]">
                    Select Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreateCategoryOpen(true)}
                    className="text-[11px] font-semibold text-[#54734e] hover:text-[#384e34] transition-colors"
                  >
                    + New Category
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {unbudgetedCategories.map((cat) => {
                    const isSelected = selectedAddCatId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedAddCatId(cat.id ?? null)}
                        style={{
                          borderColor: isSelected ? "#5e7d59" : undefined,
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? "bg-[#5f8059] text-white border-[#5e7d59] shadow-sm ring-2 ring-[#5e7d59]/40"
                            : "border-[#c1d5bf] bg-[#d6e5d4] text-[#223324] hover:bg-[#c6daca]"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: isSelected ? "#ffffff" : cat.color }}
                        />
                        <span className="text-xs font-bold truncate">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] mb-1">
                  Monthly Budget Limit
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-[#5c755f]">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="10"
                    min="1"
                    placeholder="e.g. 500"
                    value={addBudgetValue}
                    onChange={(e) => {
                      setAddBudgetValue(e.target.value);
                      if (addBudgetError) setAddBudgetError(null);
                    }}
                    required
                    autoFocus
                    className="w-full bg-[#dbe8da] border border-[#c1d5bf] rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-[#213123] placeholder-[#8ea890] focus:outline-none focus:border-[#5e7d59] focus:ring-2 focus:ring-[#82a47b]/20 tabular-nums"
                  />
                </div>
                <p className="text-[10px] text-[#5c755f] mt-1">
                  You will see your spending progress against this limit each month.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 rounded-2xl bg-[#54734e] hover:bg-[#466141] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#54734e]/30 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      <CreateCategoryModal
        isOpen={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
        onCreated={(newCatId) => {
          setSelectedAddCatId(newCatId);
          setIsCreateCategoryOpen(false);
        }}
      />
    </div>
  );
}
