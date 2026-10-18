import {
  db,
  DEFAULT_CATEGORIES,
  type Category,
  type Account,
  type Transaction,
  type SavingsGoal,
} from "./db";

export interface BudManBackup {
  version: number;
  appName: string;
  exportedAt: string;
  accounts?: Account[];
  categories: Category[];
  transactions: Transaction[];
  savingsGoals?: SavingsGoal[];
}

/**
 * Triggers a download of a Blob file in the browser
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports all accounts, categories, transactions, and savings goals to a structured JSON file
 */
export async function exportToJson(): Promise<void> {
  const [categories, accounts, transactions, savingsGoals] = await Promise.all([
    db.categories.toArray(),
    db.accounts.toArray(),
    db.transactions.toArray(),
    db.savingsGoals.toArray(),
  ]);

  const backup: BudManBackup = {
    version: 3,
    appName: "BudMan PWA",
    exportedAt: new Date().toISOString(),
    accounts,
    categories,
    transactions,
    savingsGoals,
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `budman_backup_${dateStr}.json`);
}

/**
 * Exports transactions to a CSV spreadsheet file
 */
export async function exportToCsv(): Promise<void> {
  const [transactions, categories, accounts] = await Promise.all([
    db.transactions.toArray(),
    db.categories.toArray(),
    db.accounts.toArray(),
  ]);

  const categoryMap = new Map<number, string>();
  categories.forEach((cat) => {
    if (cat.id !== undefined) categoryMap.set(cat.id, cat.name);
  });

  const accountMap = new Map<string, string>();
  accounts.forEach((acc) => {
    if (acc.id) accountMap.set(acc.id, acc.name);
  });

  // Sort by date descending
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const headers = ["Date", "Account", "Category", "Type", "Amount", "Note"];
  const rows = sorted.map((tx) => {
    const accountName = (tx.accountId ? accountMap.get(tx.accountId) : "") || "Default";
    const categoryName = categoryMap.get(tx.categoryId) || "Uncategorized";
    const note = (tx.note || "").replace(/"/g, '""');
    return [
      `"${tx.date}"`,
      `"${accountName}"`,
      `"${categoryName}"`,
      `"${tx.type}"`,
      tx.amount.toFixed(2),
      `"${note}"`,
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `budman_transactions_${dateStr}.csv`);
}

/**
 * Imports a JSON backup file, validating schema and merging/restoring data
 */
export async function importFromJson(
  file: File
): Promise<{ transactionsCount: number; categoriesCount: number; accountsCount: number }> {
  const text = await file.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file. Please select a valid BudMan backup file.");
  }

  const backup = parsed as Partial<BudManBackup>;
  if (!backup || (!Array.isArray(backup.transactions) && !Array.isArray(backup.categories))) {
    throw new Error("Backup file is missing required transaction or category data.");
  }

  const newCategories = (backup.categories || []).filter(
    (c): c is Category => typeof c.name === "string" && typeof c.color === "string"
  );
  const newAccounts = (backup.accounts || []).filter(
    (a): a is Account => typeof a.name === "string" && typeof a.type === "string"
  );
  const newTransactions = (backup.transactions || []).filter(
    (t): t is Transaction =>
      typeof t.amount === "number" &&
      (t.type === "expense" || t.type === "income") &&
      typeof t.date === "string"
  );

  await db.transaction("rw", db.categories, db.accounts, db.transactions, db.savingsGoals, async () => {
    // 1. Merge categories by name to prevent primary key collision
    const existingCategories = await db.categories.toArray();
    const existingCatByName = new Map<string, number>();
    existingCategories.forEach((c) => {
      if (c.id !== undefined) existingCatByName.set(c.name.toLowerCase(), c.id);
    });

    const categoryOldToNewId = new Map<number, number>();

    for (const cat of newCategories) {
      const lowerName = cat.name.toLowerCase();
      let targetId = existingCatByName.get(lowerName);

      if (targetId === undefined) {
        const { id, ...catWithoutId } = cat;
        targetId = await db.categories.add(catWithoutId as Category);
        existingCatByName.set(lowerName, targetId);
      } else {
        if (cat.budgetMonthly !== undefined) {
          await db.categories.update(targetId, { budgetMonthly: cat.budgetMonthly });
        }
      }

      if (cat.id !== undefined && targetId !== undefined) {
        categoryOldToNewId.set(cat.id, targetId);
      }
    }

    // 2. Merge accounts by id or name
    const existingAccounts = await db.accounts.toArray();
    const existingAccById = new Map<string, string>();
    existingAccounts.forEach((a) => {
      if (a.id) existingAccById.set(a.id, a.id);
    });

    const accountOldToNewId = new Map<string, string>();

    for (const acc of newAccounts) {
      const accId = String(acc.id || "account");
      let targetId = existingAccById.get(accId);

      if (!targetId) {
        await db.accounts.put({
          ...acc,
          id: accId,
          createdAt: acc.createdAt ? new Date(acc.createdAt) : new Date(),
        });
        existingAccById.set(accId, accId);
        targetId = accId;
      }

      if (acc.id) {
        accountOldToNewId.set(String(acc.id), targetId);
      }
    }

    // 3. Add transactions with remapped categoryIds and accountIds
    for (const tx of newTransactions) {
      const mappedCatId = categoryOldToNewId.get(tx.categoryId) ?? tx.categoryId;
      const mappedAccId = tx.accountId ? accountOldToNewId.get(String(tx.accountId)) ?? String(tx.accountId) : undefined;
      const { id, ...txWithoutId } = tx;
      await db.transactions.add({
        ...txWithoutId,
        categoryId: mappedCatId,
        accountId: mappedAccId,
        createdAt: tx.createdAt ? new Date(tx.createdAt) : new Date(),
      });
    }

    // 4. Add or merge savings goals
    if (backup.savingsGoals && backup.savingsGoals.length > 0) {
      for (const goal of backup.savingsGoals) {
        const { id, ...goalWithoutId } = goal;
        await db.savingsGoals.add({
          ...goalWithoutId,
          createdAt: goal.createdAt ? new Date(goal.createdAt) : new Date(),
        });
      }
    }
  });

  return {
    transactionsCount: newTransactions.length,
    categoriesCount: newCategories.length,
    accountsCount: newAccounts.length,
  };
}

/**
 * Resets database: clears all transactions, accounts, and savings goals, restores default categories
 */
export async function resetDatabase(): Promise<void> {
  await db.transaction("rw", db.transactions, db.categories, db.accounts, db.savingsGoals, async () => {
    await db.transactions.clear();
    await db.categories.clear();
    await db.accounts.clear();
    await db.savingsGoals.clear();
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  });
}
