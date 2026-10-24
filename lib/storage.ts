"use client";

import { useEffect, useState, useCallback } from "react";

export interface StorageInfo {
  isSupported: boolean;
  isPersisted: boolean;
  usageBytes?: number;
  quotaBytes?: number;
  percentageUsed?: number;
  formattedUsage?: string;
  formattedQuota?: string;
}

/**
 * Formats a raw byte count into human-readable B, KB, MB, GB, or TB.
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes <= 0 || isNaN(bytes)) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

/**
 * Checks if the Web Storage API and StorageManager are supported in the environment.
 */
export function isStorageApiSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "storage" in navigator &&
    typeof navigator.storage === "object"
  );
}

/**
 * Checks whether the current origin has already been granted persistent storage.
 */
export async function checkStoragePersistence(): Promise<boolean> {
  if (!isStorageApiSupported() || !navigator.storage.persisted) {
    return false;
  }
  try {
    return await navigator.storage.persisted();
  } catch (err) {
    console.warn("[BudMan Storage] Failed to check persistence:", err);
    return false;
  }
}

/**
 * Automatically or manually requests persistent storage permissions from the browser.
 * In Chromium browsers and PWAs, this changes the origin from "best-effort" (subject to eviction)
 * to "persistent" (exempt from automatic browser purging).
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!isStorageApiSupported() || !navigator.storage.persist) {
    return false;
  }
  try {
    const isAlreadyPersisted = await navigator.storage.persisted();
    if (isAlreadyPersisted) {
      return true;
    }

    const granted = await navigator.storage.persist();
    if (granted) {
      console.log("[BudMan Storage] Persistent storage granted by browser.");
    } else {
      console.log(
        "[BudMan Storage] Storage persistence not granted (origin in best-effort mode). Consider installing the PWA."
      );
    }
    return granted;
  } catch (err) {
    console.warn("[BudMan Storage] Error requesting persistent storage:", err);
    return false;
  }
}

/**
 * Fetches the current storage quota and usage breakdown.
 */
export async function getStorageInfo(): Promise<StorageInfo> {
  if (!isStorageApiSupported()) {
    return { isSupported: false, isPersisted: false };
  }

  try {
    const isPersisted = navigator.storage.persisted
      ? await navigator.storage.persisted()
      : false;

    let usageBytes: number | undefined;
    let quotaBytes: number | undefined;
    let percentageUsed: number | undefined;

    if (navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      usageBytes = estimate.usage;
      quotaBytes = estimate.quota;

      if (usageBytes !== undefined && quotaBytes && quotaBytes > 0) {
        percentageUsed = Math.min(100, Math.max(0, (usageBytes / quotaBytes) * 100));
      }
    }

    return {
      isSupported: true,
      isPersisted,
      usageBytes,
      quotaBytes,
      percentageUsed,
      formattedUsage: usageBytes !== undefined ? formatBytes(usageBytes) : undefined,
      formattedQuota: quotaBytes !== undefined ? formatBytes(quotaBytes) : undefined,
    };
  } catch (err) {
    console.warn("[BudMan Storage] Failed to get storage estimate:", err);
    return { isSupported: true, isPersisted: false };
  }
}

/**
 * React hook to observe and control storage persistence state and quota metrics in UI.
 */
export function useStorageStatus() {
  const [info, setInfo] = useState<StorageInfo>({
    isSupported: true,
    isPersisted: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [requesting, setRequesting] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    const data = await getStorageInfo();
    setInfo(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestPersistence = useCallback(async (): Promise<boolean> => {
    setRequesting(true);
    try {
      const granted = await requestPersistentStorage();
      await refresh();
      return granted;
    } finally {
      setRequesting(false);
    }
  }, [refresh]);

  return {
    ...info,
    loading,
    requesting,
    refresh,
    requestPersistence,
  };
}
