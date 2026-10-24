"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type SavingsGoal, type SavingFrequency } from "@/lib/db";
import { useCurrency, formatCurrency } from "@/lib/format";

const GOAL_COLORS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f43f5e", // Rose
];

export function SavingsView() {
  const currency = useCurrency();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Form states for Goal creation / edit
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [durationMonths, setDurationMonths] = useState(6);
  const [frequency, setFrequency] = useState<SavingFrequency>("monthly");
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Quick Deposit modal state
  const [depositGoalId, setDepositGoalId] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositError, setDepositError] = useState<string | null>(null);

  // Live Query for all goals
  const goals = useLiveQuery(async () => {
    return await db.savingsGoals.toArray();
  }, []);

  // Compute aggregate totals
  const totalTarget = goals?.reduce((sum, g) => sum + (g.targetAmount || 0), 0) ?? 0;
  const totalSaved = goals?.reduce((sum, g) => sum + (g.currentAmount || 0), 0) ?? 0;
  const overallProgress = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingGoal(null);
    setName("");
    setTargetAmount("");
    setCurrentAmount("0");
    setDurationMonths(6);
    setFrequency("monthly");
    setColor(GOAL_COLORS[0]);
    setFormError(null);
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setCurrentAmount(String(goal.currentAmount || 0));
    setDurationMonths(goal.durationMonths || 6);
    setFrequency(goal.frequency || "monthly");
    setColor(goal.color || GOAL_COLORS[0]);
    setFormError(null);
    setIsCreateOpen(true);
  };

  // Submit Goal form (Create or Update)
  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Please enter a goal title");
      return;
    }

    const parsedTarget = parseFloat(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setFormError(`Please enter a valid target amount greater than ${currency}0`);
      return;
    }

    const parsedCurrent = parseFloat(currentAmount) || 0;
    const months = Math.max(1, Number(durationMonths) || 1);

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingGoal && editingGoal.id !== undefined) {
        await db.savingsGoals.update(editingGoal.id, {
          name: name.trim(),
          targetAmount: parsedTarget,
          currentAmount: parsedCurrent,
          durationMonths: months,
          frequency,
          color,
        });
      } else {
        await db.savingsGoals.add({
          name: name.trim(),
          targetAmount: parsedTarget,
          currentAmount: parsedCurrent,
          durationMonths: months,
          frequency,
          color,
          createdAt: new Date(),
        });
      }
      setIsCreateOpen(false);
    } catch (err) {
      console.error("Failed to save savings goal:", err);
      setFormError("Failed to save goal to database");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id: number) => {
    if (confirm("Are you sure you want to delete this savings goal?")) {
      await db.savingsGoals.delete(id);
    }
  };

  // Deposit funds towards a goal
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;

    const parsed = parseFloat(depositAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setDepositError(`Please enter an amount greater than ${currency}0`);
      return;
    }

    const goal = goals?.find((g) => g.id === depositGoalId);
    if (!goal) return;

    try {
      await db.savingsGoals.update(depositGoalId, {
        currentAmount: (goal.currentAmount || 0) + parsed,
      });
      setDepositGoalId(null);
      setDepositAmount("");
      setDepositError(null);
    } catch (err) {
      console.error("Failed to deposit funds:", err);
      setDepositError("Failed to add funds");
    }
  };

  // Calculations for preview in modal
  const previewTarget = parseFloat(targetAmount) || 0;
  const previewCurrent = parseFloat(currentAmount) || 0;
  const previewRemaining = Math.max(0, previewTarget - previewCurrent);
  const previewMonths = Math.max(1, Number(durationMonths) || 1);

  const previewPerMonth = previewRemaining / previewMonths;
  const previewPerWeek = previewRemaining / ((previewMonths * 52) / 12);
  const previewPerDay = previewRemaining / (previewMonths * 30.417);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Overview Card */}
      <section aria-label="Savings Goals Overview">
        <div className="relative p-5 sm:p-6 bg-[#e2ede1] dark:bg-[#1c291e] border border-[#c4d7c2] dark:border-[#384e3b] rounded-[28px] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img
                src="/mascot/savings.png"
                alt="BudMan Savings"
                className="w-12 h-12 object-contain shrink-0 drop-shadow-xs"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#213123] dark:text-[#f0f6ef] tracking-tight">
                    Savings Goals
                  </h2>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#d6e5d4] text-[#213123] border border-[#c4d7c2] dark:bg-[#2e4331] dark:text-[#c9dec8] dark:border-[#3d5341]">
                    {goals?.length ?? 0} active
                  </span>
                </div>
                <p className="text-[11px] text-[#5e7d59] dark:text-[#9bb897] font-medium mt-0.5">
                  Timeline savings planner & calculator
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 rounded-xl bg-[#54734e] hover:bg-[#466141] text-white text-xs font-bold shadow-md shadow-[#54734e]/30 hover:scale-105 active:scale-95 transition-all"
            >
              + New Goal
            </button>
          </div>

          {/* Aggregate Progress Bar */}
          <div className="w-full h-2.5 bg-[#d3e3d1] dark:bg-[#162218] rounded-full overflow-hidden border border-[#c4d7c2] dark:border-[#384e3b] p-0.5 mb-3">
            <div
              className="h-full bg-[#54734e] rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Key Stat Cards */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-2xl bg-[#dbe8da] dark:bg-[#263728] border border-[#c1d5bf] dark:border-[#384e3b]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897] block">
                Total Saved
              </span>
              <span className="text-xs sm:text-sm font-black text-[#1f3d23] dark:text-[#82a47b] tabular-nums">
                {formatCurrency(totalSaved, currency, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#dbe8da] dark:bg-[#263728] border border-[#c1d5bf] dark:border-[#384e3b]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897] block">
                Target Total
              </span>
              <span className="text-xs sm:text-sm font-black text-[#213123] dark:text-[#f0f6ef] tabular-nums">
                {formatCurrency(totalTarget, currency, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#dbe8da] dark:bg-[#263728] border border-[#c1d5bf] dark:border-[#384e3b]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897] block">
                Completed
              </span>
              <span className="text-xs sm:text-sm font-black text-[#54734e] dark:text-[#a3c99f] tabular-nums">
                {overallProgress.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Goal Cards List */}
      <section className="space-y-3.5" aria-label="Individual Savings Goals">
        {goals && goals.length > 0 ? (
          goals.map((goal) => {
            const current = goal.currentAmount || 0;
            const target = goal.targetAmount || 1;
            const percentage = Math.min(100, (current / target) * 100);
            const remaining = Math.max(0, target - current);
            const months = Math.max(1, goal.durationMonths || 1);
            const isCompleted = current >= target;

            // Calculations per day, week, month
            const perMonth = remaining / months;
            const perWeek = remaining / ((months * 52) / 12);
            const perDay = remaining / (months * 30.417);

            let planAmount = perMonth;
            if (goal.frequency === "daily") {
              planAmount = perDay;
            } else if (goal.frequency === "weekly") {
              planAmount = perWeek;
            } else {
              planAmount = perMonth;
            }

            const initialLetter = (goal.name || "G").charAt(0).toUpperCase();

            return (
              <div
                key={goal.id}
                className="p-5 bg-[#e2ede1] dark:bg-[#1c291e] border border-[#c8dbc6] dark:border-[#384e3b] hover:bg-[#d9e7d8] dark:hover:bg-[#223325] rounded-3xl transition-all shadow-sm space-y-4"
              >
                {/* Card Top: Initials, Name, Target, & Menu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border font-extrabold text-sm shadow-sm"
                      style={{
                        backgroundColor: `${goal.color}20`,
                        borderColor: `${goal.color}40`,
                        color: goal.color,
                      }}
                    >
                      {initialLetter}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef] truncate">{goal.name}</h3>
                        {isCompleted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#cde0cb] text-[#213123] border border-[#b8d2b6] dark:bg-[#263728] dark:text-[#c9dec8]">
                            Completed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#5e7d59] dark:text-[#9bb897] mt-0.5">
                        <span>
                          {goal.durationMonths} {goal.durationMonths === 1 ? "month" : "months"} plan
                        </span>
                        <span>•</span>
                        <span className="capitalize text-[#5e7d59] dark:text-[#9bb897]">Save {goal.frequency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(goal)}
                      className="px-2 py-1 rounded-lg text-xs font-semibold text-[#5e7d59] hover:text-[#213123] hover:bg-[#d6e5d4] dark:hover:bg-[#263728] transition-colors"
                    >
                      Edit
                    </button>
                    {goal.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal.id as number)}
                        className="px-2 py-1 rounded-lg text-xs font-semibold text-[#b34033] hover:bg-[#b34033]/10 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Amounts */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-base sm:text-lg font-black text-[#213123] dark:text-[#f0f6ef] tabular-nums">
                        {formatCurrency(current, currency)}
                      </span>
                      <span className="text-xs text-[#5e7d59] dark:text-[#9bb897] font-medium ml-1">
                        of {formatCurrency(target, currency)}
                      </span>
                    </div>
                    <span className="text-xs font-black text-[#54734e] dark:text-[#a3c99f] tabular-nums">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>

                  <div className="w-full h-3 bg-[#d3e3d1] dark:bg-[#162218] rounded-full overflow-hidden border border-[#c4d7c2] dark:border-[#384e3b] p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: goal.color,
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-semibold text-[#5e7d59] dark:text-[#9bb897] pt-0.5">
                    <span>
                      {percentage.toFixed(0)}% reached
                    </span>
                    <span className="tabular-nums">
                      {remaining > 0
                        ? `${formatCurrency(remaining, currency)} left to save`
                        : "Fully Funded"}
                    </span>
                  </div>
                </div>

                {/* Calculated Savings Breakdown Box */}
                {isCompleted ? (
                  <div className="p-3 bg-[#cde0cb] dark:bg-[#1f3823] border border-[#b8d2b6] dark:border-[#2e5233] rounded-2xl flex items-center gap-3">
                    <img
                      src="/mascot/cheer.png"
                      alt="Goal Achieved"
                      className="w-10 h-10 object-contain shrink-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#1f3d23] dark:text-[#a1e5ab] block">
                        🎉 Goal Reached!
                      </span>
                      <span className="text-[11px] text-[#38593c] dark:text-[#c4e3c9]">
                        Target of {formatCurrency(target, currency)} completed!
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-[#dbe8da] dark:bg-[#162218]/70 border border-[#c1d5bf] dark:border-[#384e3b] rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#213123] dark:text-[#f0f6ef] font-semibold">
                        Recommended Savings Rate:
                      </span>
                      <span className="text-xs font-extrabold text-[#1f3d23] dark:text-[#c9dec8] tabular-nums bg-[#cde0cb] dark:bg-[#263728] border border-[#b8d2b6] dark:border-[#3d5341] px-2.5 py-0.5 rounded-full">
                        {formatCurrency(planAmount, currency)} / {goal.frequency === "daily" ? "day" : goal.frequency === "weekly" ? "week" : "month"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#c1d5bf]/60 dark:border-[#384e3b]/60 text-center">
                      <div className={`p-1.5 rounded-xl ${goal.frequency === "daily" ? "bg-[#cde0cb]/70 dark:bg-[#263728]/70 border border-[#b8d2b6] dark:border-[#3d5341]" : ""}`}>
                        <span className="text-[10px] text-[#5e7d59] dark:text-[#9bb897] block uppercase font-medium">Daily</span>
                        <span className="text-xs font-bold text-[#213123] dark:text-[#f0f6ef] tabular-nums">
                          {formatCurrency(perDay, currency, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className={`p-1.5 rounded-xl ${goal.frequency === "weekly" ? "bg-[#cde0cb]/70 dark:bg-[#263728]/70 border border-[#b8d2b6] dark:border-[#3d5341]" : ""}`}>
                        <span className="text-[10px] text-[#5e7d59] dark:text-[#9bb897] block uppercase font-medium">Weekly</span>
                        <span className="text-xs font-bold text-[#213123] dark:text-[#f0f6ef] tabular-nums">
                          {formatCurrency(perWeek, currency, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className={`p-1.5 rounded-xl ${goal.frequency === "monthly" ? "bg-[#cde0cb]/70 dark:bg-[#263728]/70 border border-[#b8d2b6] dark:border-[#3d5341]" : ""}`}>
                        <span className="text-[10px] text-[#5e7d59] dark:text-[#9bb897] block uppercase font-medium">Monthly</span>
                        <span className="text-xs font-bold text-[#213123] dark:text-[#f0f6ef] tabular-nums">
                          {formatCurrency(perMonth, currency, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Deposit Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDepositGoalId(goal.id ?? null);
                      setDepositAmount("");
                      setDepositError(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#d6e5d4] hover:bg-[#c6daca] dark:bg-[#263728] dark:hover:bg-[#2e4331] border border-[#c4d7c2] dark:border-[#384e3b] text-[#213123] dark:text-[#c9dec8] text-xs font-bold flex items-center justify-center transition-all active:scale-95"
                  >
                    + Add Funds to Goal
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          <div className="p-8 bg-[#e2ede1] dark:bg-[#1c291e] border border-dashed border-[#c4d7c2] dark:border-[#384e3b] rounded-[32px] text-center flex flex-col items-center space-y-3">
            <img
              src="/mascot/savings.png"
              alt="BudMan Savings"
              className="w-24 h-auto object-contain drop-shadow-sm mb-1"
            />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#213123] dark:text-[#f0f6ef]">Start a Savings Goal</h3>
              <p className="text-xs text-[#5e7d59] dark:text-[#9bb897] max-w-sm mx-auto leading-relaxed">
                Plan for a vacation, new gadgets, or an emergency fund. Set your target amount and timeline, and we&apos;ll calculate how much to save per day, week, and month.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center px-5 py-2.5 rounded-2xl bg-[#54734e] hover:bg-[#466141] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#54734e]/30 hover:scale-105 active:scale-95 transition-all"
              >
                + Create Your First Goal
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Create / Edit Goal Modal */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#162218]/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-[#e5efe3] dark:bg-[#1c291e] border border-[#c1d5bf] dark:border-[#384e3b] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#c1d5bf]/60 dark:border-[#384e3b]/60">
              <h3 className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef]">
                {editingGoal ? "Edit Savings Goal" : "New Savings Goal"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5e7d59] hover:text-[#213123] hover:bg-[#d6e5d4] dark:hover:bg-[#263728] transition-colors"
              >
                Close
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-[#b34033]/10 border border-[#b34033]/30 text-[#b34033] text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitGoal} className="space-y-4">
              {/* Goal Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897] mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Fund, New Laptop, Japan Trip"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  required
                  autoFocus
                  className="w-full bg-[#edf4eb] dark:bg-[#162218] border border-[#c1d5bf] dark:border-[#384e3b] rounded-xl px-3.5 py-2.5 text-xs text-[#213123] dark:text-[#f0f6ef] placeholder-[#82a47b] focus:outline-none focus:border-[#54734e]"
                />
              </div>

              {/* Target & Current Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897] mb-1">
                    Target Goal
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-[#5e7d59]">
                      {currency}
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="50000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      required
                      className="w-full bg-[#edf4eb] dark:bg-[#162218] border border-[#c1d5bf] dark:border-[#384e3b] rounded-xl pl-7 pr-3 py-2 text-xs text-[#213123] dark:text-[#f0f6ef] placeholder-[#82a47b] focus:outline-none focus:border-[#54734e] tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897] mb-1">
                    Already Saved
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-[#5e7d59]">
                      {currency}
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className="w-full bg-[#edf4eb] dark:bg-[#162218] border border-[#c1d5bf] dark:border-[#384e3b] rounded-xl pl-7 pr-3 py-2 text-xs text-[#213123] dark:text-[#f0f6ef] placeholder-[#82a47b] focus:outline-none focus:border-[#54734e] tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Duration in Months */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897]">
                    Timeline (Months to Save)
                  </label>
                  <span className="text-xs font-bold text-[#1f3d23] dark:text-[#82a47b] tabular-nums">
                    {durationMonths} {durationMonths === 1 ? "month" : "months"}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[1, 3, 6, 12, 24].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMonths(m)}
                      className={`py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                        durationMonths === m
                          ? "bg-[#54734e] text-white border-[#54734e] shadow-sm"
                          : "bg-[#d6e5d4] dark:bg-[#263728] border-[#c4d7c2] dark:border-[#384e3b] text-[#213123] dark:text-[#c9dec8] hover:bg-[#c6daca]"
                      }`}
                    >
                      {m} mo{m > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="1"
                  max="48"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full accent-[#54734e] bg-[#c4d7c2] dark:bg-[#384e3b] rounded-lg h-2 cursor-pointer"
                />
              </div>

              {/* Savings Frequency Mode */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897] mb-1.5">
                  How will you save?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["daily", "weekly", "monthly"] as SavingFrequency[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                        frequency === f
                          ? "bg-[#54734e] text-white border-[#54734e] shadow-sm"
                          : "bg-[#d6e5d4] dark:bg-[#263728] border-[#c4d7c2] dark:border-[#384e3b] text-[#213123] dark:text-[#c9dec8] hover:bg-[#c6daca]"
                      }`}
                    >
                      Per {f === "daily" ? "Day" : f === "weekly" ? "Week" : "Month"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Live Calculator Box */}
              {previewTarget > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#dbe8da] dark:bg-[#162218]/80 border border-[#c1d5bf] dark:border-[#384e3b] space-y-2">
                  <div className="text-xs font-bold text-[#213123] dark:text-[#f0f6ef]">
                    Calculated Savings Plan:
                  </div>

                  <div className="text-sm font-extrabold text-[#213123] dark:text-[#f0f6ef]">
                    Save{" "}
                    <span className="text-[#1f3d23] dark:text-[#82a47b] tabular-nums">
                      {formatCurrency(
                        frequency === "daily"
                          ? previewPerDay
                          : frequency === "weekly"
                          ? previewPerWeek
                          : previewPerMonth,
                        currency
                      )}
                    </span>{" "}
                    per {frequency === "daily" ? "day" : frequency === "weekly" ? "week" : "month"} for {previewMonths} months.
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#c1d5bf]/60 dark:border-[#384e3b]/60 text-[11px] text-[#5e7d59] dark:text-[#9bb897] text-center">
                    <div>
                      <span className="block text-[10px] text-[#5e7d59] dark:text-[#9bb897]">Daily</span>
                      <span className="font-bold text-[#213123] dark:text-[#f0f6ef] tabular-nums">
                        {formatCurrency(previewPerDay, currency, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#5e7d59] dark:text-[#9bb897]">Weekly</span>
                      <span className="font-bold text-[#213123] dark:text-[#f0f6ef] tabular-nums">
                        {formatCurrency(previewPerWeek, currency, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#5e7d59] dark:text-[#9bb897]">Monthly</span>
                      <span className="font-bold text-[#213123] dark:text-[#f0f6ef] tabular-nums">
                        {formatCurrency(previewPerMonth, currency, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Color Picker */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5e7d59] dark:text-[#9bb897]">
                  Color Theme
                </label>
                <div className="flex gap-2 py-1">
                  {GOAL_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? "scale-125 ring-2 ring-[#213123]/60 dark:ring-white/60" : "opacity-80 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3.5 rounded-2xl bg-[#54734e] hover:bg-[#466141] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#54734e]/40 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingGoal ? "Update Goal" : "Create Savings Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Deposit Modal */}
      {depositGoalId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#162218]/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDepositGoalId(null);
          }}
        >
          <div className="w-full max-w-sm bg-[#e5efe3] dark:bg-[#1c291e] border border-[#c1d5bf] dark:border-[#384e3b] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#c1d5bf]/60 dark:border-[#384e3b]/60">
              <h3 className="text-sm font-bold text-[#213123] dark:text-[#f0f6ef]">Add Funds to Goal</h3>
              <button
                type="button"
                onClick={() => setDepositGoalId(null)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5e7d59] hover:text-[#213123] hover:bg-[#d6e5d4] dark:hover:bg-[#263728]"
              >
                Close
              </button>
            </div>

            {depositError && (
              <div className="p-2.5 rounded-xl bg-[#b34033]/10 border border-[#b34033]/30 text-[#b34033] text-xs font-semibold">
                {depositError}
              </div>
            )}

            <form onSubmit={handleDepositSubmit} className="space-y-4">
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
                    step="1"
                    min="1"
                    placeholder="1000"
                    value={depositAmount}
                    onChange={(e) => {
                      setDepositAmount(e.target.value);
                      if (depositError) setDepositError(null);
                    }}
                    required
                    autoFocus
                    className="w-full bg-[#edf4eb] dark:bg-[#162218] border border-[#c1d5bf] dark:border-[#384e3b] rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-[#213123] dark:text-[#f0f6ef] placeholder-[#82a47b] focus:outline-none focus:border-[#54734e] tabular-nums"
                  />
                </div>
              </div>

              {/* Quick deposit presets */}
              <div className="grid grid-cols-4 gap-1.5">
                {[100, 500, 1000, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmount(String(val))}
                    className="py-1.5 rounded-xl border border-[#c4d7c2] dark:border-[#384e3b] bg-[#d6e5d4] dark:bg-[#263728] hover:bg-[#c6daca] dark:hover:bg-[#2e4331] text-[#213123] dark:text-[#c9dec8] text-[11px] font-bold tabular-nums transition-colors"
                  >
                    +{currency}{val}
                  </button>
                ))}
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
    </div>
  );
}
