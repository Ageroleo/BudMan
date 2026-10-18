import Dexie, { type Table } from "dexie";

export type CardTheme = "seabank" | "gcash" | "bpi" | "maya" | "landbank" | "shopee" | "tiktok";
export type AccountCategoryType = "bank" | "wallet" | "ecommerce";

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

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: "seabank",
    name: "SeaBank Debit",
    type: "bank",
    cardTheme: "seabank",
    balance: 25450,
    accountNumberMasked: "•••• 4892",
    expiryDate: "05/29",
    cardholderName: "JUAN DELA CRUZ",
    createdAt: new Date(),
  },
  {
    id: "gcash",
    name: "GCash Wallet",
    type: "wallet",
    cardTheme: "gcash",
    balance: 8320,
    accountNumberMasked: "•••• 0918",
    expiryDate: "08/28",
    cardholderName: "JUAN DELA CRUZ",
    createdAt: new Date(),
  },
  {
    id: "bpi",
    name: "BPI Debit",
    type: "bank",
    cardTheme: "bpi",
    balance: 41200,
    accountNumberMasked: "•••• 3140",
    expiryDate: "03/30",
    cardholderName: "JUAN DELA CRUZ",
    createdAt: new Date(),
  },
  {
    id: "maya",
    name: "Maya Savings",
    type: "wallet",
    cardTheme: "maya",
    balance: 15600,
    accountNumberMasked: "•••• 7721",
    expiryDate: "11/29",
    cardholderName: "JUAN DELA CRUZ",
    createdAt: new Date(),
  },
  {
    id: "landbank",
    name: "Landbank Debit",
    type: "bank",
    cardTheme: "landbank",
    balance: 32000,
    accountNumberMasked: "•••• 5519",
    expiryDate: "09/27",
    cardholderName: "JUAN DELA CRUZ",
    createdAt: new Date(),
  },
  {
    id: "shopee",
    name: "ShopeePay",
    type: "ecommerce",
    cardTheme: "shopee",
    balance: 4250,
    accountNumberMasked: "•••• 6204",
    expiryDate: "01/28",
    cardholderName: "JUAN DELA CRUZ",
    createdAt: new Date(),
  },
  {
    id: "tiktok",
    name: "TikTok Pay",
    type: "ecommerce",
    cardTheme: "tiktok",
    balance: 1850,
    accountNumberMasked: "•••• 9033",
    expiryDate: "06/28",
    cardholderName: "JUAN DELA CRUZ",
    createdAt: new Date(),
  },
];

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
    }).upgrade(async (tx) => {
      await tx.table("accounts").bulkPut(DEFAULT_ACCOUNTS);
    });

    this.on("populate", () => {
      this.categories.bulkAdd(DEFAULT_CATEGORIES);
      this.accounts.bulkPut(DEFAULT_ACCOUNTS);
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

/**
 * Seeder function to ensure default bank & wallet accounts exist in the database.
 */
export async function seedAccounts(): Promise<void> {
  try {
    const isInitialized = typeof window !== "undefined" ? localStorage.getItem("budman_accounts_initialized") : null;
    const count = await db.accounts.count();
    if (count === 0 && !isInitialized) {
      await db.accounts.bulkPut(DEFAULT_ACCOUNTS);
      if (typeof window !== "undefined") {
        localStorage.setItem("budman_accounts_initialized", "true");
      }
    } else if (count > 0 && !isInitialized) {
      if (typeof window !== "undefined") {
        localStorage.setItem("budman_accounts_initialized", "true");
      }
    }
  } catch (err) {
    console.error("Failed to seed accounts:", err);
  }
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
