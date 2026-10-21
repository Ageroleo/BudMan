"use client";

import React, { useState } from "react";
import { db, type Category } from "@/lib/db";
import { useCurrency } from "@/lib/format";
import {
  Tag,
  ShoppingBag,
  Utensils,
  Coffee,
  Car,
  Home,
  Zap,
  Film,
  Heart,
  BookOpen,
  Briefcase,
  Gift,
  Sparkles,
  Music,
  Dumbbell,
  Plane,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Tag,
  ShoppingBag,
  Utensils,
  Coffee,
  Car,
  Home,
  Zap,
  Film,
  Heart,
  BookOpen,
  Briefcase,
  Gift,
  Sparkles,
  Music,
  Dumbbell,
  Plane,
};

export const CATEGORY_COLOR_PRESETS = [
  "#10b981", // Emerald
  "#059669", // Dark Emerald
  "#3b82f6", // Blue
  "#2563eb", // Royal Blue
  "#8b5cf6", // Violet
  "#7c3aed", // Deep Purple
  "#ec4899", // Pink
  "#db2777", // Rose
  "#f59e0b", // Amber
  "#d97706", // Dark Amber
  "#06b6d4", // Cyan
  "#0891b2", // Teal
  "#ef4444", // Red
  "#f97316", // Orange
  "#84cc16", // Lime
  "#64748b", // Slate
];

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (categoryId: number) => void;
}

export function CreateCategoryModal({
  isOpen,
  onClose,
  onCreated,
}: CreateCategoryModalProps) {
  const currency = useCurrency();
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#10b981");
  const [selectedIcon, setSelectedIcon] = useState("Tag");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Category name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Check for duplicate name (case-insensitive)
      const existing = await db.categories
        .filter((c) => c.name.toLowerCase() === trimmedName.toLowerCase())
        .first();

      if (existing) {
        setError(`A category named "${trimmedName}" already exists.`);
        setIsSaving(false);
        return;
      }

      let parsedBudget: number | undefined = undefined;
      if (monthlyBudget.trim()) {
        const val = parseFloat(monthlyBudget);
        if (isNaN(val) || val < 0) {
          setError("Please enter a valid monthly budget amount.");
          setIsSaving(false);
          return;
        }
        if (val > 0) {
          parsedBudget = val;
        }
      }

      const newCategory: Omit<Category, "id"> = {
        name: trimmedName,
        color: selectedColor,
        icon: selectedIcon,
        budgetMonthly: parsedBudget,
      };

      const newId = await db.categories.add(newCategory as Category);

      // Reset
      setName("");
      setSelectedColor("#10b981");
      setSelectedIcon("Tag");
      setMonthlyBudget("");

      onCreated?.(Number(newId));
      onClose();
    } catch (err: unknown) {
      console.error("Failed to create category:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to create category: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const SelectedIconComponent = CATEGORY_ICON_MAP[selectedIcon] || Tag;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-[#162218]/40 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-[#e5efe3] dark:bg-[#1a291e] border border-[#c1d5bf] dark:border-[#2f4835] rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c1d5bf] dark:border-[#2f4835]">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: selectedColor }}
            >
              <SelectedIconComponent className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-[#213123] dark:text-white">
              Add New Category
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5c755f] hover:text-[#213123] hover:bg-[#d6e5d4] dark:hover:bg-[#25392b] transition-colors"
          >
            Close
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Category Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2] mb-1">
              Category Name
            </label>
            <input
              type="text"
              placeholder="e.g. Subscriptions, Healthcare, Pets"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              required
              autoFocus
              className="w-full bg-[#dbe8da] dark:bg-[#233527] border border-[#c1d5bf] dark:border-[#324a37] rounded-xl px-3.5 py-2.5 text-xs text-[#213123] dark:text-white placeholder-[#8ea890] focus:outline-none focus:border-[#5e7d59]"
            />
          </div>

          {/* Color Palette Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2] mb-1.5">
              Theme Color
            </label>
            <div className="grid grid-cols-8 gap-1.5">
              {CATEGORY_COLOR_PRESETS.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center ${
                      isSelected
                        ? "scale-110 ring-2 ring-offset-2 ring-[#54734e] shadow-sm"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2] mb-1.5">
              Select Icon
            </label>
            <div className="grid grid-cols-8 gap-1.5 p-2 rounded-2xl bg-[#dbe8da]/70 dark:bg-[#233527]/70 border border-[#c1d5bf] dark:border-[#324a37]">
              {Object.keys(CATEGORY_ICON_MAP).map((iconKey) => {
                const IconComponent = CATEGORY_ICON_MAP[iconKey];
                const isSelected = selectedIcon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setSelectedIcon(iconKey)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#54734e] text-white shadow-xs"
                        : "text-[#4f6852] dark:text-[#a0bea2] hover:bg-[#c6daca] dark:hover:bg-[#2a4030]"
                    }`}
                    title={iconKey}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly Budget Limit (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f6852] dark:text-[#a0bea2]">
                Monthly Budget (Optional)
              </label>
              <span className="text-[10px] text-[#5e7d59] dark:text-[#9bb897]">
                Leave empty for no limit
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-[#5c755f] dark:text-[#8ea890]">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 5000"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="w-full bg-[#dbe8da] dark:bg-[#233527] border border-[#c1d5bf] dark:border-[#324a37] rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-[#213123] dark:text-white placeholder-[#8ea890] focus:outline-none focus:border-[#5e7d59] tabular-nums"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-2xl bg-[#54734e] hover:bg-[#466141] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#54734e]/30 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? "Creating Category..." : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
