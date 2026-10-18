"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  SlidersHorizontal,
  Pencil,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { db, type Category } from "@/lib/db";
import { useCurrency, formatCurrency } from "@/lib/format";
import { CategoryIcon } from "./CategoryIcon";

export function BudgetProgress() {
  const currency = useCurrency();
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editBudgetValue, setEditBudgetValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

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
      (c) => !c.budgetMonthly || c.budgetMonthly <= 0
    );

    let totalBudgeted = 0;
    let totalSpent = 0;

    const list = budgetedCategories.map((cat) => {
      const spent = spendMap.get(cat.id ?? -1) ?? 0;
      const budget = cat.budgetMonthly ?? 0;
      totalBudgeted += budget;
      totalSpent += spent;

      const percentage = budget > 0 ? (spent / budget) * 100 : spent > 0 ? 100 : 0;
      const remaining = budget - spent;

      let status: "normal" | "warning" | "over" = "normal";
      if (budget > 0) {
        if (percentage > 100) status = "over";
        else if (percentage >= 80) status = "warning";
      }

      return {
        ...cat,
        spent,
        budget,
        percentage,
        remaining,
        status,
      };
    });

    list.sort((a, b) => b.percentage - a.percentage);

    return {
      list,
      unbudgetedCategories,
      totalBudgeted,
      totalSpent,
      totalRemaining: totalBudgeted - totalSpent,
      overallPercentage: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
    };
  }, []);

  const handleStartEdit = (cat: Category) => {
    setEditingCategoryId(cat.id ?? null);
    setEditBudgetValue(cat.budgetMonthly ? String(cat.budgetMonthly) : "");
  };

  const handleSaveBudget = async (categoryId: number) => {
    const parsed = parseFloat(editBudgetValue);
    if (isNaN(parsed) || parsed < 0) return;

    setIsSaving(true);
    try {
      await db.categories.update(categoryId, {
        budgetMonthly: parsed > 0 ? parsed : undefined,
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
      await db.categories.update(categoryId, {
        budgetMonthly: undefined,
      });
    }
  };

  const handleOpenAddBudget = () => {
    if (data?.unbudgetedCategories && data.unbudgetedCategories.length > 0) {
      setSelectedAddCatId(data.unbudgetedCategories[0].id ?? null);
    } else {
      setSelectedAddCatId(null);
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

    const parsed = parseFloat(addBudgetValue);
    if (isNaN(parsed) || parsed <= 0) {
      setAddBudgetError(`Please enter a budget greater than ${currency}0`);
      return;
    }

    setIsSaving(true);
    try {
      await db.categories.update(selectedAddCatId, {
        budgetMonthly: parsed,
      });
      setIsAddBudgetOpen(false);
      setAddBudgetValue("");
      setSelectedAddCatId(null);
    } catch (err) {
      console.error("Failed to set category budget:", err);
      setAddBudgetError("Failed to save budget");
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) {
    return (
      <div className="p-8 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800/80 animate-pulse">
        <div className="h-4 w-36 bg-zinc-800 rounded mx-auto mb-2" />
        <div className="h-3 w-48 bg-zinc-800 rounded mx-auto" />
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
    <div className="space-y-5">
      {/* Overall Budget Overview Card */}
      <div className="p-5 sm:p-6 bg-[#121215] border border-white/[0.08] rounded-[28px] shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Monthly Budget</h3>
              <p className="text-[11px] text-zinc-400">
                {list.length > 0
                  ? `${list.length} category ${list.length === 1 ? "budget" : "budgets"} active`
                  : "No category budgets set"}
              </p>
            </div>
          </div>
          {totalBudgeted > 0 && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border tabular-nums ${
                overallPercentage > 100
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  : overallPercentage >= 80
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {overallPercentage.toFixed(0)}% used
            </span>
          )}
        </div>

        {totalBudgeted > 0 ? (
          <>
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80 p-0.5 mb-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallPercentage > 100
                    ? "bg-rose-500"
                    : overallPercentage >= 80
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-emerald-500 to-teal-400"
                }`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>

            {/* Figures summary */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800/60 text-center">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Budget</span>
                <span className="text-xs font-bold text-zinc-200 tabular-nums">
                  {formatCurrency(totalBudgeted, currency, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Spent</span>
                <span className="text-xs font-bold text-rose-400 tabular-nums">
                  {formatCurrency(totalSpent, currency, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Remaining</span>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    totalRemaining >= 0 ? "text-emerald-400" : "text-rose-400"
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
            <p className="text-xs text-zinc-400">
              Set spending limits for categories below to track and manage your budget.
            </p>
          </div>
        )}
      </div>

      {/* Category Progress List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Category Budgets {list.length > 0 ? `(${list.length})` : ""}
          </h3>
          {unbudgetedCategories.length > 0 && (
            <button
              type="button"
              onClick={handleOpenAddBudget}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Set Budget</span>
            </button>
          )}
        </div>

        {list.length > 0 ? (
          <div className="space-y-2.5">
            {list.map((cat) => {
              const isEditing = editingCategoryId === cat.id;

              // Status color configs
              let progressColor = "bg-emerald-500";
              let badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
              let StatusIcon = CheckCircle2;

              if (cat.status === "warning") {
                progressColor = "bg-amber-500";
                badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                StatusIcon = AlertTriangle;
              } else if (cat.status === "over") {
                progressColor = "bg-rose-500";
                badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse";
                StatusIcon = AlertTriangle;
              }

              return (
                <div
                  key={cat.id}
                  className="p-4 bg-[#121215] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    {/* Category Name & Icon */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${cat.color}20`,
                          borderColor: `${cat.color}40`,
                          color: cat.color,
                        }}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-zinc-200 block truncate">
                          {cat.name}
                        </span>
                        <span className="text-[11px] text-zinc-500 tabular-nums">
                          {formatCurrency(cat.spent, currency)} spent
                        </span>
                      </div>
                    </div>

                    {/* Budget Limit & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-700">
                          <span className="text-xs text-zinc-500 pl-1">{currency}</span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={editBudgetValue}
                            onChange={(e) => setEditBudgetValue(e.target.value)}
                            className="w-16 bg-transparent text-xs font-bold text-zinc-100 outline-none tabular-nums"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => cat.id && handleSaveBudget(cat.id)}
                            disabled={isSaving}
                            className="p-1 rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategoryId(null)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-zinc-400 tabular-nums">
                            / {formatCurrency(cat.budget, currency, { maximumFractionDigits: 0 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
                            title="Edit budget limit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => cat.id && handleRemoveBudget(cat.id)}
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Remove budget limit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800/60 mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    />
                  </div>

                  {/* Status caption */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${badgeClass}`}
                    >
                      <StatusIcon className="w-2.5 h-2.5" />
                      {cat.status === "over"
                        ? `Over budget by ${currency}${Math.abs(cat.remaining).toFixed(0)}`
                        : cat.status === "warning"
                        ? `Approaching limit (${currency}${cat.remaining.toFixed(0)} left)`
                        : `${currency}${cat.remaining.toFixed(0)} remaining`}
                    </span>
                    <span className="text-zinc-500 font-medium tabular-nums">
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State: No Category Budgets Defined Yet */
          <div className="p-6 bg-[#121215] border border-dashed border-white/[0.1] rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-200">No Category Budgets Set</p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">
                You haven&apos;t set spending limits for any categories yet. Add a budget to monitor and control your monthly expenses.
              </p>
            </div>
            {unbudgetedCategories.length > 0 && (
              <button
                type="button"
                onClick={handleOpenAddBudget}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Set a Category Budget</span>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddBudgetOpen(false);
          }}
        >
          <div className="w-full max-w-sm bg-[#121215] border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100">Set Category Budget</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBudgetOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addBudgetError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
                {addBudgetError}
              </div>
            )}

            <form onSubmit={handleCreateCategoryBudget} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Select Category
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {unbudgetedCategories.map((cat) => {
                    const isSelected = selectedAddCatId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedAddCatId(cat.id ?? null)}
                        style={{
                          borderColor: isSelected ? cat.color : undefined,
                          backgroundColor: isSelected ? `${cat.color}25` : undefined,
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? "text-white ring-2 ring-emerald-400/40 shadow-sm"
                            : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs"
                          style={{
                            backgroundColor: `${cat.color}30`,
                            color: cat.color,
                          }}
                        >
                          <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold truncate text-zinc-200">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Monthly Budget Limit
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-zinc-500">
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
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 tabular-nums"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  You will see your spending progress against this limit each month.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-bold text-xs uppercase tracking-wider hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
