"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Target,
  PiggyBank,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  ArrowUpRight,
  X,
  Check,
  CheckCircle2,
  Plane,
  Laptop,
  Home,
  Car,
  Gift,
  ShieldCheck,
  Coins,
} from "lucide-react";
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

const GOAL_ICONS: Record<string, React.ElementType> = {
  Target,
  PiggyBank,
  Plane,
  Laptop,
  Home,
  Car,
  Gift,
  ShieldCheck,
  Coins,
};

export function SavingsView() {
  const currency = useCurrency();

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [frequency, setFrequency] = useState<SavingFrequency>("monthly");
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [icon, setIcon] = useState("Target");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Deposit modal state
  const [depositGoalId, setDepositGoalId] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositError, setDepositError] = useState<string | null>(null);

  // Live Query goals
  const goals = useLiveQuery(async () => {
    return await db.savingsGoals.toArray();
  }, []);

  const totalSaved = goals?.reduce((sum, g) => sum + (g.currentAmount || 0), 0) ?? 0;
  const totalTarget = goals?.reduce((sum, g) => sum + (g.targetAmount || 0), 0) ?? 0;
  const overallPercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingGoal(null);
    setName("");
    setTargetAmount("");
    setCurrentAmount("0");
    setDurationMonths(6);
    setFrequency("monthly");
    setColor(GOAL_COLORS[0]);
    setIcon("Target");
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
    setIcon(goal.icon || "Target");
    setFormError(null);
    setIsCreateOpen(true);
  };

  // Submit Goal Form (Create / Update)
  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Please enter a goal name");
      return;
    }

    const parsedTarget = parseFloat(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setFormError(`Please enter a valid target amount greater than ${currency}0`);
      return;
    }

    const parsedCurrent = parseFloat(currentAmount) || 0;
    if (parsedCurrent < 0) {
      setFormError("Current saved amount cannot be negative");
      return;
    }

    const months = Number(durationMonths);
    if (isNaN(months) || months < 1) {
      setFormError("Duration must be at least 1 month");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      if (editingGoal?.id) {
        await db.savingsGoals.update(editingGoal.id, {
          name: name.trim(),
          targetAmount: parsedTarget,
          currentAmount: parsedCurrent,
          durationMonths: months,
          frequency,
          color,
          icon,
        });
      } else {
        await db.savingsGoals.add({
          name: name.trim(),
          targetAmount: parsedTarget,
          currentAmount: parsedCurrent,
          durationMonths: months,
          frequency,
          color,
          icon,
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
        <div className="relative p-5 sm:p-6 bg-[#121215] border border-white/[0.08] rounded-[28px] shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-[#09090b] rounded-[14px] flex items-center justify-center">
                  <PiggyBank className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  Savings Goals
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {goals?.length ?? 0} active
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400 font-medium">
                  Smart timeline savings calculator
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Goal</span>
            </button>
          </div>

          {/* Aggregate Progress Bar */}
          <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80 p-0.5 mb-3">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-teal-400"
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800/60 text-center">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Total Saved</span>
              <span className="text-xs font-bold text-emerald-400 tabular-nums">
                {formatCurrency(totalSaved, currency, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Target Pool</span>
              <span className="text-xs font-bold text-zinc-200 tabular-nums">
                {formatCurrency(totalTarget, currency, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Overall</span>
              <span className="text-xs font-bold text-zinc-300 tabular-nums">
                {overallPercentage.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Goals List */}
      <section aria-label="Savings Goals List" className="space-y-3">
        {goals && goals.length > 0 ? (
          goals.map((goal) => {
            const IconComponent = GOAL_ICONS[goal.icon || "Target"] || Target;
            const remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));
            const percentage =
              goal.targetAmount > 0 ? ((goal.currentAmount || 0) / goal.targetAmount) * 100 : 0;
            const isCompleted = (goal.currentAmount || 0) >= goal.targetAmount;

            // Calculations per day, week, month
            const months = Math.max(1, goal.durationMonths || 1);
            const perMonth = remaining / months;
            const perWeek = remaining / ((months * 52) / 12);
            const perDay = remaining / (months * 30.417);

            // Highlighted plan text based on user's frequency preference
            let planText = "";
            let planAmount = 0;
            if (goal.frequency === "daily") {
              planText = "per day";
              planAmount = perDay;
            } else if (goal.frequency === "weekly") {
              planText = "per week";
              planAmount = perWeek;
            } else {
              planText = "per month";
              planAmount = perMonth;
            }

            return (
              <div
                key={goal.id}
                className="p-5 bg-[#121215] border border-white/[0.08] hover:border-white/[0.12] rounded-3xl transition-all shadow-md space-y-4"
              >
                {/* Card Top: Icon, Name, Target, & Menu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm"
                      style={{
                        backgroundColor: `${goal.color}20`,
                        borderColor: `${goal.color}40`,
                        color: goal.color,
                      }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-zinc-100 truncate">{goal.name}</h3>
                        {isCompleted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Completed 🎉
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {goal.durationMonths} {goal.durationMonths === 1 ? "month" : "months"} plan
                        </span>
                        <span>•</span>
                        <span className="capitalize text-zinc-400">Save {goal.frequency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(goal)}
                      className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
                      title="Edit Goal"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {goal.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal.id as number)}
                        className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Saved Figures */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-400">
                      Saved:{" "}
                      <strong className="text-white tabular-nums">
                        {formatCurrency(goal.currentAmount || 0, currency)}
                      </strong>
                    </span>
                    <span className="text-zinc-400">
                      Goal:{" "}
                      <strong className="text-zinc-200 tabular-nums">
                        {formatCurrency(goal.targetAmount, currency)}
                      </strong>
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800/80">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: goal.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-1.5">
                    <span className="font-semibold tabular-nums text-emerald-400">
                      {percentage.toFixed(0)}% reached
                    </span>
                    <span className="tabular-nums">
                      {remaining > 0
                        ? `${formatCurrency(remaining, currency)} left to save`
                        : "Fully Funded!"}
                    </span>
                  </div>
                </div>

                {/* Calculated Savings Breakdown Box */}
                {!isCompleted && (
                  <div className="p-3.5 bg-black/40 border border-white/[0.06] rounded-2xl space-y-2.5">
                    {/* Primary Highlighted Plan */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Recommended Savings Rate:</span>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-400 tabular-nums bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        {formatCurrency(planAmount, currency)} / {goal.frequency === "daily" ? "day" : goal.frequency === "weekly" ? "week" : "month"}
                      </span>
                    </div>

                    {/* 3-way breakdown: Day / Week / Month */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.04] text-center">
                      <div className={`p-1.5 rounded-xl ${goal.frequency === "daily" ? "bg-white/[0.06] border border-white/[0.1]" : ""}`}>
                        <span className="text-[10px] text-zinc-500 block uppercase font-medium">Daily</span>
                        <span className="text-xs font-bold text-zinc-200 tabular-nums">
                          {formatCurrency(perDay, currency, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className={`p-1.5 rounded-xl ${goal.frequency === "weekly" ? "bg-white/[0.06] border border-white/[0.1]" : ""}`}>
                        <span className="text-[10px] text-zinc-500 block uppercase font-medium">Weekly</span>
                        <span className="text-xs font-bold text-zinc-200 tabular-nums">
                          {formatCurrency(perWeek, currency, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className={`p-1.5 rounded-xl ${goal.frequency === "monthly" ? "bg-white/[0.06] border border-white/[0.1]" : ""}`}>
                        <span className="text-[10px] text-zinc-500 block uppercase font-medium">Monthly</span>
                        <span className="text-xs font-bold text-zinc-200 tabular-nums">
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
                    className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-emerald-500/30 text-zinc-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                    <span>Add Funds to Goal</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          <div className="p-8 bg-[#121215] border border-dashed border-white/[0.12] rounded-[32px] text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
              <PiggyBank className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-100">Start a Savings Goal</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Plan for a vacation, new gadgets, or an emergency fund. Set your target amount and timeline, and we&apos;ll calculate how much to save per day, week, and month.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 text-xs font-bold uppercase tracking-wider shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create Your First Goal</span>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-[#121215] border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100">
                  {editingGoal ? "Edit Savings Goal" : "New Savings Goal"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitGoal} className="space-y-4">
              {/* Goal Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
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
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Target & Current Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Target Goal
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-zinc-500">
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
                      className="w-full bg-black/40 border border-white/[0.08] rounded-xl pl-7 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Already Saved
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-zinc-500">
                      {currency}
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.08] rounded-xl pl-7 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Duration in Months */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Timeline (Months to Save)
                  </label>
                  <span className="text-xs font-bold text-emerald-400 tabular-nums">
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
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-zinc-200"
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
                  className="w-full accent-emerald-500 bg-zinc-800 rounded-lg h-2 cursor-pointer"
                />
              </div>

              {/* Savings Frequency Mode (How you will save) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
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
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                          : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Per {f === "daily" ? "Day" : f === "weekly" ? "Week" : "Month"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Live Calculator Box */}
              {previewTarget > 0 && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Calculated Savings Plan:</span>
                  </div>

                  <div className="text-sm font-extrabold text-white">
                    Save{" "}
                    <span className="text-emerald-400 tabular-nums">
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

                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-emerald-500/15 text-[11px] text-zinc-400 text-center">
                    <div>
                      <span className="block text-[10px] text-zinc-500">Day</span>
                      <span className="font-bold text-zinc-200 tabular-nums">
                        {formatCurrency(previewPerDay, currency, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-zinc-500">Week</span>
                      <span className="font-bold text-zinc-200 tabular-nums">
                        {formatCurrency(previewPerWeek, currency, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-zinc-500">Month</span>
                      <span className="font-bold text-zinc-200 tabular-nums">
                        {formatCurrency(previewPerMonth, currency, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Icon & Color Pickers */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Icon & Color
                </label>
                <div className="flex items-center justify-between gap-3">
                  {/* Icons */}
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {Object.keys(GOAL_ICONS).map((iconKey) => {
                      const IconComp = GOAL_ICONS[iconKey];
                      return (
                        <button
                          key={iconKey}
                          type="button"
                          onClick={() => setIcon(iconKey)}
                          className={`p-2 rounded-xl border transition-all ${
                            icon === iconKey
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                              : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Colors */}
                  <div className="flex gap-1.5 shrink-0">
                    {GOAL_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full transition-transform ${
                          color === c ? "scale-125 ring-2 ring-white/60" : "opacity-80 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-bold text-xs uppercase tracking-wider hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDepositGoalId(null);
          }}
        >
          <div className="w-full max-w-sm bg-[#121215] border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100">Add Funds to Goal</h3>
              </div>
              <button
                type="button"
                onClick={() => setDepositGoalId(null)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {depositError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
                {depositError}
              </div>
            )}

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Deposit Amount
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-zinc-500">
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
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 tabular-nums"
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
                    className="py-1.5 rounded-xl border border-white/[0.06] bg-black/30 hover:bg-white/[0.06] text-zinc-300 text-[11px] font-bold tabular-nums transition-colors"
                  >
                    +{currency}{val}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-bold text-xs uppercase tracking-wider hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
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
