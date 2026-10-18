import Dexie, { type Table } from "dexie";

export type AccountType = "checking" | "savings" | "cash" | "credit" | "wallet" | "other";

export interface Account {
  id?: number;
  name: string;
  type: AccountType;
  color: string;
  icon: string;
  initialBalance: number;
  createdAt: Date;
}

export interface Transaction {
  id?: number;
  amount: number;
  type: "expense" | "income";
  categoryId: number;
  accountId?: number;
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

export class BudManDatabase extends Dexie {
  transactions!: Table<Transaction, number>;
  categories!: Table<Category, number>;
  accounts!: Table<Account, number>;
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

    this.on("populate", () => {
      this.categories.bulkAdd(DEFAULT_CATEGORIES);
    });
  }
}

export const db = new BudManDatabase();

/**
 * Seeder function to ensure default categories exist in the database.
 * Also cleans up previous hardcoded default budgets so user starts with 0 budgets.
 */
export async function seedCategories(): Promise<void> {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  } else {
    // One-time migration: clear previous hardcoded default budgets (500, 300, 150, etc.)
    if (typeof window !== "undefined" && !localStorage.getItem("budman_default_budgets_cleared_v2")) {
      const cats = await db.categories.toArray();
      const oldDefaults: Record<string, number> = {
        Groceries: 500,
        Dining: 300,
        Transit: 150,
        Housing: 1200,
        Utilities: 200,
        Entertainment: 150,
      };
      for (const c of cats) {
        if (c.id !== undefined && (oldDefaults[c.name] === c.budgetMonthly || c.name === "Salary")) {
          await db.categories.update(c.id, { budgetMonthly: undefined });
        }
      }
      localStorage.setItem("budman_default_budgets_cleared_v2", "true");
    }
  }
}

/**
 * Seeds default data (categories only; accounts are purely user-defined).
 */
export async function seedDefaults(): Promise<void> {
  await seedCategories();
}

/**
 * Deletes an account and safely detaches any existing transactions from it.
 */
export async function deleteAccount(accountId: number): Promise<void> {
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
