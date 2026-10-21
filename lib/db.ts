import Dexie, { type Table } from "dexie";

export type CardTheme = "seabank" | "gcash" | "bpi" | "maya" | "landbank" | "shopee" | "tiktok" | "cash";
export type AccountCategoryType = "bank" | "wallet" | "ecommerce" | "cash";

export interface Account {
  id: string; // e.g., 'gcash', 'maya', 'bpi', 'seabank', 'landbank', 'shopee', 'tiktok'
  name: string; // e.g., 'GCash Wallet', 'Maya Savings', 'BPI Debit'
  type: AccountCategoryType;
  cardTheme: CardTheme;
  balance: number;
  accountNumberMasked: string; // e.g., '•••• 8821'
  expiryDate?: string;
  cardholderName?: string;
  createdAt?: Date;
}

export interface Transaction {
  id?: number;
  amount: number;
  type: "expense" | "income";
  categoryId: number;
  accountId?: string;
  date: string;
  time?: string;
  note?: string;
  createdAt: Date;
}

export interface Category {
  id?: number;
  name: string;
  color: string;
  icon: string;
  budgetMonthly?: number;
}

export type SavingFrequency = "daily" | "weekly" | "monthly";

export interface SavingsGoal {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  durationMonths: number;
  frequency: SavingFrequency;
  color: string;
  icon?: string;
  targetDate?: string;
  createdAt: Date;
}

export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Groceries", color: "#10b981", icon: "ShoppingCart" },
  { name: "Dining", color: "#f59e0b", icon: "Utensils" },
  { name: "Transit", color: "#3b82f6", icon: "Car" },
  { name: "Housing", color: "#8b5cf6", icon: "Home" },
  { name: "Utilities", color: "#06b6d4", icon: "Zap" },
  { name: "Entertainment", color: "#ec4899", icon: "Film" },
  { name: "Salary", color: "#22c55e", icon: "Wallet" },
];

export const DEFAULT_ACCOUNTS: Account[] = [];

export class BudManDatabase extends Dexie {
  transactions!: Table<Transaction, number>;
  categories!: Table<Category, number>;
  accounts!: Table<Account, string>;
  savingsGoals!: Table<SavingsGoal, number>;

  constructor() {
    super("BudManDB");
    this.version(1).stores({
      transactions: "++id, type, categoryId, date, createdAt",
      categories: "++id, &name",
    });

    this.version(2).stores({
      transactions: "++id, type, categoryId, accountId, date, createdAt",
      categories: "++id, &name",
      accounts: "++id, &name, type",
    });

    this.version(3).stores({
      transactions: "++id, type, categoryId, accountId, date, createdAt",
      categories: "++id, &name",
      accounts: "++id, &name, type",
      savingsGoals: "++id, name, targetAmount, currentAmount, createdAt",
    });

    this.version(4).stores({
      transactions: "++id, type, categoryId, accountId, date, createdAt",
      categories: "++id, &name",
      accounts: "++id, &name, type",
      savingsGoals: "++id, name, targetAmount, currentAmount, createdAt",
    });

    // Version 5 drops the old autoIncrement-keyed accounts table
    this.version(5).stores({
      accounts: null,
    });

    // Version 6 creates the clean accounts table with string primary key "id"
    this.version(6).stores({
      transactions: "++id, type, categoryId, accountId, date, createdAt",
      categories: "++id, &name",
      accounts: "id, cardTheme, type",
      savingsGoals: "++id, name, targetAmount, currentAmount, createdAt",
    });

    this.on("populate", () => {
      this.categories.bulkAdd(DEFAULT_CATEGORIES);
    });
  }
}

export type ExpenseTrackerDB = BudManDatabase;
export const db = new BudManDatabase();

/**
 * Seeder function to ensure default categories exist in the database.
 */
export async function seedCategories(): Promise<void> {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }
}

const PLACEHOLDER_ACCOUNT_IDS = [
  "seabank",
  "gcash",
  "bpi",
  "maya",
  "landbank",
  "shopee",
  "tiktok",
];

/**
 * Cleans up legacy default/placeholder accounts if present in existing IndexedDB storage.
 */
export async function cleanupPlaceholderAccounts(): Promise<void> {
  try {
    const cleanedKey = "budman_placeholder_accounts_cleaned_v2";
    if (typeof window !== "undefined" && !localStorage.getItem(cleanedKey)) {
      for (const id of PLACEHOLDER_ACCOUNT_IDS) {
        const acc = await db.accounts.get(id);
        if (acc && (!acc.cardholderName || acc.cardholderName === "JUAN DELA CRUZ")) {
          await deleteAccount(id);
        }
      }
      localStorage.setItem(cleanedKey, "true");
      localStorage.setItem("budman_accounts_initialized", "true");
    }
  } catch (err) {
    console.error("Failed to clean up placeholder accounts:", err);
  }
}

/**
 * Ensures placeholder accounts are not seeded and cleans up existing placeholders.
 */
export async function seedAccounts(): Promise<void> {
  await cleanupPlaceholderAccounts();
}

/**
 * Seeds default data (both categories and digital accounts).
 */
export async function seedDefaults(): Promise<void> {
  await seedCategories();
  await seedAccounts();
}

/**
 * Deletes an account and safely detaches any existing transactions from it.
 */
export async function deleteAccount(accountId: string): Promise<void> {
  await db.transaction("rw", db.accounts, db.transactions, async () => {
    await db.accounts.delete(accountId);
    const txs = await db.transactions.where("accountId").equals(accountId).toArray();
    for (const tx of txs) {
      if (tx.id !== undefined) {
        await db.transactions.update(tx.id, { accountId: undefined });
      }
    }
  });
}

/**
 * Deletes a category and safely detaches transactions associated with it.
 */
export async function deleteCategory(categoryId: number): Promise<void> {
  await db.transaction("rw", db.categories, db.transactions, async () => {
    await db.categories.delete(categoryId);
  });
}

/**
 * Safely updates an existing transaction and reconciles account balances.
 */
export async function updateTransaction(
  txId: number,
  updatedData: {
    amount: number;
    type: "expense" | "income";
    categoryId: number;
    accountId?: string;
    date: string;
    time?: string;
    note?: string;
  }
): Promise<void> {
  await db.transaction("rw", db.transactions, db.accounts, async () => {
    const oldTx = await db.transactions.get(txId);
    if (!oldTx) throw new Error("Transaction not found");

    // 1. Revert previous impact on account balance if an account was linked
    if (oldTx.accountId) {
      const oldAcc = await db.accounts.get(oldTx.accountId);
      if (oldAcc) {
        const revertedBal =
          oldTx.type === "expense"
            ? (oldAcc.balance || 0) + oldTx.amount
            : (oldAcc.balance || 0) - oldTx.amount;
        await db.accounts.update(oldTx.accountId, { balance: revertedBal });
      }
    }

    // 2. Apply new impact on account balance if an account is linked
    if (updatedData.accountId) {
      const newAcc = await db.accounts.get(updatedData.accountId);
      if (newAcc) {
        const newBal =
          updatedData.type === "expense"
            ? (newAcc.balance || 0) - updatedData.amount
            : (newAcc.balance || 0) + updatedData.amount;
        await db.accounts.update(updatedData.accountId, { balance: newBal });
      }
    }

    // 3. Update transaction record
    await db.transactions.update(txId, {
      amount: updatedData.amount,
      type: updatedData.type,
      categoryId: updatedData.categoryId,
      accountId: updatedData.accountId,
      date: updatedData.date,
      time: updatedData.time || undefined,
      note: updatedData.note?.trim() || undefined,
    });
  });
}

/**
 * Safely deletes a transaction and reconciles the associated account's balance.
 */
export async function deleteTransaction(txId: number): Promise<void> {
  await db.transaction("rw", db.transactions, db.accounts, async () => {
    const tx = await db.transactions.get(txId);
    if (tx) {
      if (tx.accountId) {
        const acc = await db.accounts.get(tx.accountId);
        if (acc) {
          const revertedBal =
            tx.type === "expense"
              ? (acc.balance || 0) + tx.amount
              : (acc.balance || 0) - tx.amount;
          await db.accounts.update(tx.accountId, { balance: revertedBal });
        }
      }
      await db.transactions.delete(txId);
    }
  });
}
