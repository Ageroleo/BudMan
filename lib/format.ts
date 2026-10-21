"use client";

import { useEffect, useState } from "react";

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: "USD", symbol: "$", name: "US Dollar ($)" },
  { code: "EUR", symbol: "€", name: "Euro (€)" },
  { code: "GBP", symbol: "£", name: "British Pound (£)" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso (₱)" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen (¥)" },
  { code: "INR", symbol: "₹", name: "Indian Rupee (₹)" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar (CA$)" },
  { code: "AUD", symbol: "AU$", name: "Australian Dollar (AU$)" },
];

const STORAGE_KEY = "budman_currency_symbol";
const DEFAULT_SYMBOL = "$";
const CURRENCY_CHANGE_EVENT = "budman-currency-change";

export function getStoredCurrency(): string {
  if (typeof window === "undefined") return DEFAULT_SYMBOL;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_SYMBOL;
}

export function setStoredCurrency(symbol: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, symbol);
  window.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT, { detail: symbol }));
}

export function useCurrency(): string {
  const [symbol, setSymbol] = useState<string>(DEFAULT_SYMBOL);

  useEffect(() => {
    setSymbol(getStoredCurrency());

    const handleCurrencyChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setSymbol(customEvent.detail);
      } else {
        setSymbol(getStoredCurrency());
      }
    };

    window.addEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
    window.addEventListener("storage", handleCurrencyChange);

    return () => {
      window.removeEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
      window.removeEventListener("storage", handleCurrencyChange);
    };
  }, []);

  return symbol;
}

export function formatCurrency(
  amount: number,
  symbol: string = DEFAULT_SYMBOL,
  options: {
    showSign?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const { showSign = false } = options;

  let maxDigits = options.maximumFractionDigits ?? 2;
  let minDigits = options.minimumFractionDigits ?? 2;

  // Prevent RangeError: minimumFractionDigits must not be greater than maximumFractionDigits
  if (minDigits > maxDigits) {
    minDigits = maxDigits;
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formattedNum = absAmount.toLocaleString("en-US", {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  });

  const sign = showSign ? (amount > 0 ? "+" : isNegative ? "-" : "") : isNegative ? "-" : "";

  return `${sign}${symbol}${formattedNum}`;
}

/**
 * Returns current local time in 24-hour "HH:mm" format for <input type="time" />
 */
export function getLocalTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Formats "HH:mm" 24-hour string to friendly 12-hour display string (e.g. "9:30 AM")
 */
export function formatTime(timeStr?: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHours = h % 12 || 12;
  const displayMinutes = String(m).padStart(2, "0");
  return `${displayHours}:${displayMinutes} ${ampm}`;
}
