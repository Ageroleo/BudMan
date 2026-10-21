"use client";

import React from "react";
import { type Account } from "@/lib/db";
import { useCurrency, formatCurrency } from "@/lib/format";

interface AccountCardProps {
  account: Account;
  isMasked?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

// Metallic Gold EMV Chip
function GoldChip() {
  return (
    <svg className="w-10 h-7 rounded-[4px] shadow-sm shrink-0" viewBox="0 0 40 28" fill="none">
      <defs>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fae084" />
          <stop offset="35%" stopColor="#d4af37" />
          <stop offset="70%" stopColor="#aa820a" />
          <stop offset="100%" stopColor="#f5d77f" />
        </linearGradient>
      </defs>
      <rect width="40" height="28" rx="4" fill="url(#gold-grad)" />
      <rect x="1" y="1" width="38" height="26" rx="3" stroke="#876605" strokeWidth="0.75" />
      <path d="M0 14h40M14 0v28M26 0v28M14 9h12M14 19h12" stroke="#684e03" strokeWidth="0.75" opacity="0.65" />
      <rect x="16" y="10" width="8" height="8" rx="1.5" fill="#fdf0be" stroke="#876605" strokeWidth="0.5" />
    </svg>
  );
}

// Metallic Silver EMV Chip
function SilverChip() {
  return (
    <svg className="w-10 h-7 rounded-[4px] shadow-sm shrink-0" viewBox="0 0 40 28" fill="none">
      <defs>
        <linearGradient id="silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f9fafb" />
          <stop offset="40%" stopColor="#d1d5db" />
          <stop offset="75%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#e5e7eb" />
        </linearGradient>
      </defs>
      <rect width="40" height="28" rx="4" fill="url(#silver-grad)" />
      <rect x="1" y="1" width="38" height="26" rx="3" stroke="#6b7280" strokeWidth="0.75" />
      <path d="M0 14h40M14 0v28M26 0v28M14 9h12M14 19h12" stroke="#4b5563" strokeWidth="0.75" opacity="0.65" />
      <rect x="16" y="10" width="8" height="8" rx="1.5" fill="#ffffff" stroke="#6b7280" strokeWidth="0.5" />
    </svg>
  );
}

// Contactless Wireless Wave Indicator
function ContactlessWave({ className = "w-5 h-5 text-white/70" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M7 16a5 5 0 0 1 0-8" opacity="0.45" />
      <path d="M11 19a9 9 0 0 1 0-14" opacity="0.75" />
      <path d="M15 22a13 13 0 0 1 0-20" />
    </svg>
  );
}

// Mastercard Interlocking Circles
function MastercardLogo({ className = "h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 30" fill="none">
      <circle cx="16" cy="15" r="14" fill="#eb001b" />
      <circle cx="32" cy="15" r="14" fill="#f79e1b" fillOpacity="0.95" />
      <path d="M24 5.3a14 14 0 0 0 0 19.4 14 14 0 0 0 0-19.4z" fill="#ff5f00" />
    </svg>
  );
}

// Visa Wordmark
function VisaLogo({ className = "h-5 text-white" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 54 18" fill="currentColor">
      <path d="M20.9 1.2L13.8 17h-4.4L5.1 4.5C4.9 3.7 4.7 3.3 4.1 3c-1-.5-2.6-1-4.1-1.3l.1-.5h7.2c.9 0 1.8.6 2 1.7l1.7 9.1L20.4 1.2h4.5zM25.3 1.2h4.2l-3.3 15.8h-4.2L25.3 1.2zm11 11.2c0-3.3-4.5-3.5-4.5-5 0-.5.5-1.1 1.6-1.2.5 0 2 .1 3.6.8l.6-2.9c-.9-.3-2.1-.6-3.6-.6-3.8 0-6.4 2-6.5 4.8 0 2.1 1.9 3.3 3.3 4 1.5.7 2 1.2 2 1.8 0 1-.9 1.4-1.8 1.4-1.5 0-3-.5-3.9-1l-.7 3.1c.9.4 2.5.8 4.2.8 4.4 0 7.2-2.1 7.3-5.2zm17.5 4.6l-3.4-15.8h-3.9c-.8 0-1.5.5-1.8 1.2l-6.2 14.6h4.5l.9-2.5h5.5l.5 2.5h4.4zm-7.6-6l2.3-6.2 1.3 6.2h-3.6z" />
    </svg>
  );
}

// Banknote Currency Emblem
function BanknoteEmblem() {
  return (
    <svg className="w-10 h-7 rounded-[4px] shadow-sm shrink-0" viewBox="0 0 40 28" fill="none">
      <defs>
        <linearGradient id="cash-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect width="40" height="28" rx="4" fill="url(#cash-grad)" stroke="#34d399" strokeWidth="0.8" />
      <circle cx="20" cy="14" r="8" stroke="#a7f3d0" strokeWidth="0.8" strokeDasharray="1.5 1.5" fill="#065f46" />
      <circle cx="20" cy="14" r="5" fill="#10b981" />
      <path d="M18 14h4M20 11v6" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="5" cy="6" r="1.5" fill="#a7f3d0" opacity="0.8" />
      <circle cx="35" cy="6" r="1.5" fill="#a7f3d0" opacity="0.8" />
      <circle cx="5" cy="22" r="1.5" fill="#a7f3d0" opacity="0.8" />
      <circle cx="35" cy="22" r="1.5" fill="#a7f3d0" opacity="0.8" />
    </svg>
  );
}

// Cash Mint Badge
function CashMintBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shadow-sm ${className}`}
      title="Cash"
    >
      <svg className="w-3.5 h-3.5 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    </div>
  );
}

export function AccountCard({
  account,
  isMasked = false,
  isActive = false,
  onClick,
  className = "",
}: AccountCardProps) {
  const currency = useCurrency();
  const theme = account.cardTheme || "seabank";

  // Card themes configuration
  switch (theme) {
    case "seabank":
      return (
        <div
          onClick={onClick}
          className={`aspect-[1.586/1] w-full rounded-2xl overflow-hidden p-5 relative shadow-xl text-white select-none transition-all duration-300 ${
            isActive ? "ring-2 ring-[#f35325] scale-[1.01]" : "hover:scale-[1.005]"
          } bg-gradient-to-br from-[#ff6835] via-[#f35325] to-[#d63b12] shadow-[#f35325]/25 ${className}`}
        >
          {/* SeaBank smile doodle accents */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/[0.08] pointer-events-none" />
          <svg className="absolute -bottom-6 right-10 w-36 h-24 pointer-events-none opacity-20" viewBox="0 0 100 60" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round">
            <path d="M 10 20 Q 50 60 90 20" />
          </svg>

          {/* Card Top: SeaBank logo & Contactless */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight flex items-center">
                Sea<span className="text-white">Bank</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded ml-1">
                Debit
              </span>
            </div>
            <ContactlessWave />
          </div>

          {/* Card Middle: Chip & Balance */}
          <div className="relative z-10 mt-3 flex items-center justify-between">
            <GoldChip />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-white/70 block tracking-wider">
                Available Balance
              </span>
              <span className="text-lg sm:text-xl font-black tabular-nums tracking-tight text-white">
                {isMasked ? `${currency}••••••` : formatCurrency(account.balance, currency)}
              </span>
            </div>
          </div>

          {/* Card Bottom: Number, Holder & Network */}
          <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between">
            <div>
              <div className="font-mono text-sm sm:text-base font-bold tracking-widest text-white/95 drop-shadow-sm">
                {account.accountNumberMasked || "••••  ••••  ••••  4892"}
              </div>
              <div className="flex items-center gap-4 text-[10px] font-semibold text-white/80 uppercase tracking-wider mt-1">
                <span className="truncate max-w-[130px]">{account.cardholderName || account.name}</span>
                <span>EXP {account.expiryDate || "05/29"}</span>
              </div>
            </div>
            <MastercardLogo className="h-6 sm:h-7" />
          </div>
        </div>
      );

    case "gcash":
      return (
        <div
          onClick={onClick}
          className={`aspect-[1.586/1] w-full rounded-2xl overflow-hidden p-5 relative shadow-xl text-white select-none transition-all duration-300 ${
            isActive ? "ring-2 ring-[#0070f3] scale-[1.01]" : "hover:scale-[1.005]"
          } bg-gradient-to-br from-[#0c4ecf] via-[#003fb3] to-[#00247d] shadow-[#003fb3]/30 ${className}`}
        >
          {/* GCash Concentric Radar Glow Rings */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full border border-sky-300/15 pointer-events-none" />
          <div className="absolute right-2 bottom-2 w-32 h-32 rounded-full border border-sky-300/20 bg-sky-400/10 blur-sm pointer-events-none" />

          {/* Card Top: GCash "G" Emblem & Contactless */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center font-black text-[#003fb3] text-sm shadow-sm">
                G
              </div>
              <span className="text-lg font-black tracking-tight">GCash</span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded ml-1">
                Visa Card
              </span>
            </div>
            <ContactlessWave />
          </div>

          {/* Card Middle: Chip & Balance */}
          <div className="relative z-10 mt-3 flex items-center justify-between">
            <SilverChip />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-sky-200/80 block tracking-wider">
                Wallet Balance
              </span>
              <span className="text-lg sm:text-xl font-black tabular-nums tracking-tight text-white">
                {isMasked ? `${currency}••••••` : formatCurrency(account.balance, currency)}
              </span>
            </div>
          </div>

          {/* Card Bottom: Number, Holder & Network */}
          <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between">
            <div>
              <div className="font-mono text-sm sm:text-base font-bold tracking-widest text-white/95 drop-shadow-sm">
                {account.accountNumberMasked || "••••  ••••  ••••  0918"}
              </div>
              <div className="flex items-center gap-4 text-[10px] font-semibold text-sky-100/80 uppercase tracking-wider mt-1">
                <span className="truncate max-w-[130px]">{account.cardholderName || account.name}</span>
                <span>EXP {account.expiryDate || "08/28"}</span>
              </div>
            </div>
            <VisaLogo className="h-4 sm:h-5 text-white" />
          </div>
        </div>
      );

    case "bpi":
      return (
        <div
          onClick={onClick}
          className={`aspect-[1.586/1] w-full rounded-2xl overflow-hidden p-5 relative shadow-xl text-white select-none transition-all duration-300 ${
            isActive ? "ring-2 ring-[#c01828] scale-[1.01]" : "hover:scale-[1.005]"
          } bg-gradient-to-br from-[#9b111e] via-[#7d0d18] to-[#4d070f] shadow-[#7d0d18]/30 ${className}`}
        >
          {/* BPI Woven angled ribbon texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#f7d070_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-52 h-52 bg-gradient-to-b from-[#e63946]/20 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Card Top: BPI crest & Contactless */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#fae084] text-[#7d0d18] font-black text-xs flex items-center justify-center border border-[#876605]/40 shadow-sm">
                BPI
              </div>
              <span className="text-xl font-black tracking-tight">BPI</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#fae084] italic">
                debit
              </span>
            </div>
            <ContactlessWave />
          </div>

          {/* Card Middle: Chip & Balance */}
          <div className="relative z-10 mt-3 flex items-center justify-between">
            <GoldChip />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#fae084]/80 block tracking-wider">
                Available Funds
              </span>
              <span className="text-lg sm:text-xl font-black tabular-nums tracking-tight text-white">
                {isMasked ? `${currency}••••••` : formatCurrency(account.balance, currency)}
              </span>
            </div>
          </div>

          {/* Card Bottom: Number, Holder & Network */}
          <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between">
            <div>
              <div className="font-mono text-sm sm:text-base font-bold tracking-widest text-[#fae084] drop-shadow-sm">
                {account.accountNumberMasked || "••••  ••••  ••••  3140"}
              </div>
              <div className="flex items-center gap-4 text-[10px] font-semibold text-white/80 uppercase tracking-wider mt-1">
                <span className="truncate max-w-[130px]">{account.cardholderName || account.name}</span>
                <span>EXP {account.expiryDate || "03/30"}</span>
              </div>
            </div>
            <MastercardLogo className="h-6 sm:h-7" />
          </div>
        </div>
      );

    case "maya":
      return (
        <div
          onClick={onClick}
          className={`aspect-[1.586/1] w-full rounded-2xl overflow-hidden p-5 relative select-none transition-all duration-300 ${
            isActive ? "ring-2 ring-[#22c55e] scale-[1.01]" : "hover:scale-[1.005]"
          } bg-gradient-to-br from-[#16181b] via-[#0d0e10] to-[#040405] text-white border border-[#22c55e]/35 shadow-[0_0_20px_rgba(34,197,94,0.22)] ${className}`}
        >
          {/* Maya neon-green gradient edge highlight */}
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#22c55e]/15 rounded-full blur-2xl pointer-events-none" />
          <span className="absolute -bottom-6 -right-2 text-8xl font-black text-white/[0.03] select-none pointer-events-none">
            m
          </span>

          {/* Card Top: maya logo & Contactless */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black lowercase tracking-tighter text-[#22c55e]">
                maya
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#22c55e]/80 border border-[#22c55e]/30 px-1.5 py-0.5 rounded-full ml-1">
                Savings
              </span>
            </div>
            <ContactlessWave className="w-5 h-5 text-[#22c55e]/80" />
          </div>

          {/* Card Middle: Chip & Balance */}
          <div className="relative z-10 mt-3 flex items-center justify-between">
            <SilverChip />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#22c55e]/80 block tracking-wider">
                Total Savings
              </span>
              <span className="text-lg sm:text-xl font-black tabular-nums tracking-tight text-white">
                {isMasked ? `${currency}••••••` : formatCurrency(account.balance, currency)}
              </span>
            </div>
          </div>

          {/* Card Bottom: Number, Holder & Network */}
          <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between">
            <div>
              <div className="font-mono text-sm sm:text-base font-bold tracking-widest text-zinc-300 drop-shadow-sm">
                {account.accountNumberMasked || "••••  ••••  ••••  7721"}
              </div>
              <div className="flex items-center gap-4 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mt-1">
                <span className="truncate max-w-[130px]">{account.cardholderName || account.name}</span>
                <span>EXP {account.expiryDate || "11/29"}</span>
              </div>
            </div>
            <VisaLogo className="h-4 sm:h-5 text-white" />
          </div>
        </div>
      );

    case "landbank":
      return (
        <div
          onClick={onClick}
          className={`aspect-[1.586/1] w-full rounded-2xl overflow-hidden p-5 relative shadow-xl text-white select-none transition-all duration-300 ${
            isActive ? "ring-2 ring-[#84cc16] scale-[1.01]" : "hover:scale-[1.005]"
          } bg-gradient-to-br from-[#0e5c32] via-[#094625] to-[#042814] shadow-[#094625]/30 ${className}`}
        >
          {/* Flowing lime-green leaf petal curves */}
          <svg className="absolute -right-8 -bottom-8 w-52 h-52 pointer-events-none opacity-20" viewBox="0 0 100 100" fill="none">
            <path d="M0 100 C 50 100, 100 50, 100 0 C 100 50, 50 100, 0 100 Z" fill="#84cc16" />
            <path d="M20 100 C 60 100, 100 60, 100 20 C 100 60, 60 100, 20 100 Z" fill="#22c55e" />
          </svg>

          {/* Card Top: Landbank gear/sprout & Contactless */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#84cc16] text-[#042814] flex items-center justify-center font-bold text-[10px] shadow-sm">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.5 2 2 6.5 2 12c0 3.8 2.1 7.1 5.2 8.8L12 15l4.8 5.8c3.1-1.7 5.2-5 5.2-8.8 0-5.5-4.5-10-10-10z" />
                </svg>
              </div>
              <span className="text-base sm:text-lg font-black tracking-wide">LANDBANK</span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded ml-1">
                Debit
              </span>
            </div>
            <ContactlessWave />
          </div>

          {/* Card Middle: Chip & Balance */}
          <div className="relative z-10 mt-3 flex items-center justify-between">
            <SilverChip />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-lime-200/80 block tracking-wider">
                Current Balance
              </span>
              <span className="text-lg sm:text-xl font-black tabular-nums tracking-tight text-white">
                {isMasked ? `${currency}••••••` : formatCurrency(account.balance, currency)}
              </span>
            </div>
          </div>

          {/* Card Bottom: Number, Holder & Network */}
          <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between">
            <div>
              <div className="font-mono text-sm sm:text-base font-bold tracking-widest text-lime-100 drop-shadow-sm">
                {account.accountNumberMasked || "••••  ••••  ••••  5519"}
              </div>
              <div className="flex items-center gap-4 text-[10px] font-semibold text-lime-200/80 uppercase tracking-wider mt-1">
                <span className="truncate max-w-[130px]">{account.cardholderName || account.name}</span>
                <span>EXP {account.expiryDate || "09/27"}</span>
              </div>
            </div>
            <MastercardLogo className="h-6 sm:h-7" />
          </div>
        </div>
      );

    case "shopee":
      return (
        <div
          onClick={onClick}
          className={`aspect-[1.586/1] w-full rounded-2xl overflow-hidden p-5 relative shadow-xl text-white select-none transition-all duration-300 ${
            isActive ? "ring-2 ring-[#ee4d2d] scale-[1.01]" : "hover:scale-[1.005]"
          } bg-gradient-to-br from-[#f2532e] via-[#ee4d2d] to-[#d43719] shadow-[#ee4d2d]/30 ${className}`}
        >
          {/* Shopping bag watermark */}
          <svg className="absolute -bottom-8 -right-8 w-44 h-44 text-white/[0.08] pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1zm-9-1a2 2 0 0 1 4 0v1h-4V6z" />
          </svg>

          {/* Card Top: Shopee bag & Contactless */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white text-[#ee4d2d] flex items-center justify-center font-bold text-xs shadow-sm">
                S
              </div>
              <span className="text-lg font-black tracking-tight">ShopeePay</span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded ml-1">
                Wallet
              </span>
            </div>
            <ContactlessWave />
          </div>

          {/* Card Middle: Chip & Balance */}
          <div className="relative z-10 mt-3 flex items-center justify-between">
            <SilverChip />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-white/70 block tracking-wider">
                ShopeePay Balance
              </span>
              <span className="text-lg sm:text-xl font-black tabular-nums tracking-tight text-white">
                {isMasked ? `${currency}••••••` : formatCurrency(account.balance, currency)}
              </span>
            </div>
          </div>

          {/* Card Bottom: Number, Holder & Network */}
          <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between">
            <div>
              <div className="font-mono text-sm sm:text-base font-bold tracking-widest text-white drop-shadow-sm">
                {account.accountNumberMasked || "••••  ••••  ••••  6204"}
              </div>
              <div className="flex items-center gap-4 text-[10px] font-semibold text-white/80 uppercase tracking-wider mt-1">
                <span className="truncate max-w-[130px]">{account.cardholderName || account.name}</span>
                <span>EXP {account.expiryDate || "01/28"}</span>
              </div>
            </div>
            <MastercardLogo className="h-6 sm:h-7" />
          </div>
        </div>
      );

    case "tiktok":
      return (
        <div
          onClick={onClick}
          className={`aspect-[1.586/1] w-full rounded-2xl overflow-hidden p-5 relative select-none transition-all duration-300 ${
            isActive ? "ring-2 ring-[#00f2fe] scale-[1.01]" : "hover:scale-[1.005]"
          } bg-gradient-to-br from-[#121214] via-[#09090b] to-[#000000] text-white border border-white/10 shadow-[0_0_20px_rgba(0,242,254,0.15)] ${className}`}
        >
          {/* TikTok Cyan & Red chromatic accents */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00f2fe]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#fe2c55]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top: TikTok Note Emblem & Contactless */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 flex items-center justify-center">
                {/* 3D chromatic offset note */}
                <span className="absolute font-black text-sm text-[#00f2fe] -translate-x-0.5">♪</span>
                <span className="absolute font-black text-sm text-[#fe2c55] translate-x-0.5">♪</span>
                <span className="relative font-black text-sm text-white">♪</span>
              </div>
              <span className="text-lg font-black tracking-tight">TikTok Pay</span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-white/10 text-[#00f2fe] border border-[#00f2fe]/30 px-1.5 py-0.5 rounded ml-1">
                Digital
              </span>
            </div>
            <ContactlessWave className="w-5 h-5 text-white/70" />
          </div>

          {/* Card Middle: Chip & Balance */}
          <div className="relative z-10 mt-3 flex items-center justify-between">
            <SilverChip />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                TikTok Shop Wallet
              </span>
              <span className="text-lg sm:text-xl font-black tabular-nums tracking-tight text-white">
                {isMasked ? `${currency}••••••` : formatCurrency(account.balance, currency)}
              </span>
            </div>
          </div>

          {/* Card Bottom: Number, Holder & Network */}
          <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between">
            <div>
              <div className="font-mono text-sm sm:text-base font-bold tracking-widest text-zinc-200 drop-shadow-sm">
                {account.accountNumberMasked || "••••  ••••  ••••  9033"}
              </div>
              <div className="flex items-center gap-4 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mt-1">
                <span className="truncate max-w-[130px]">{account.cardholderName || account.name}</span>
                <span>EXP {account.expiryDate || "06/28"}</span>
              </div>
            </div>
            <MastercardLogo className="h-6 sm:h-7" />
          </div>
        </div>
      );

    case "cash":
    default:
      return (
        <div
          onClick={onClick}
          className={`aspect-[1.586/1] w-full rounded-2xl overflow-hidden p-5 relative shadow-xl text-white select-none transition-all duration-300 ${
            isActive ? "ring-2 ring-emerald-400 scale-[1.01]" : "hover:scale-[1.005]"
          } bg-gradient-to-br from-[#0c5031] via-[#083822] to-[#031d11] border border-emerald-500/25 shadow-[#083822]/35 ${className}`}
        >
          {/* Guilloché / Banknote geometric watermark & currency grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-52 h-52 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
          <svg className="absolute -bottom-10 -right-10 w-48 h-48 pointer-events-none opacity-10 text-emerald-300" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <circle cx="50" cy="50" r="45" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="35" strokeWidth="1" />
            <circle cx="50" cy="50" r="25" strokeWidth="1.5" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="15" strokeWidth="1" />
          </svg>

          {/* Vertical holographic security foil strip */}
          <div className="absolute top-0 bottom-0 left-[26%] w-7 pointer-events-none overflow-hidden opacity-30 flex flex-col items-center justify-around select-none">
            <div className="w-full h-full bg-gradient-to-b from-transparent via-emerald-400/20 to-transparent flex flex-col justify-around items-center py-2 text-[8px] font-black font-mono text-emerald-200">
              <span>₱</span>
              <span>•</span>
              <span>₱</span>
              <span>•</span>
              <span>₱</span>
            </div>
          </div>

          {/* Card Top: Cash label */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center font-black text-sm shadow-sm">
                💵
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                {account.name || "Cash"}
              </span>
            </div>
          </div>

          {/* Card Middle: Banknote Emblem & Balance */}
          <div className="relative z-10 mt-3 flex items-center justify-between">
            <BanknoteEmblem />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-200/80 block tracking-wider">
                Available Balance
              </span>
              <span className="text-lg sm:text-xl font-black tabular-nums tracking-tight text-white drop-shadow-sm">
                {isMasked ? `${currency}••••••` : formatCurrency(account.balance, currency)}
              </span>
            </div>
          </div>

          {/* Card Bottom: Number, Holder & Network */}
          <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between">
            <div>
              {account.accountNumberMasked &&
                account.accountNumberMasked !== "CASH" &&
                account.accountNumberMasked !== "PHYSICAL CASH" && (
                  <div className="font-mono text-xs sm:text-sm font-bold tracking-widest text-emerald-200/90 drop-shadow-sm uppercase">
                    {account.accountNumberMasked}
                  </div>
                )}
              {account.cardholderName &&
                account.cardholderName !== "CASH ON HAND" &&
                account.cardholderName !== "CASH" && (
                  <div className="text-[10px] font-semibold text-emerald-100/75 uppercase tracking-wider mt-1">
                    <span className="truncate max-w-[140px]">{account.cardholderName}</span>
                  </div>
                )}
            </div>
            <CashMintBadge />
          </div>
        </div>
      );
  }
}
