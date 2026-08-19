export type TransactionType = 'income' | 'expense';

export type Category =
  | 'Food' | 'Transport' | 'Shopping' | 'Entertainment'
  | 'Health' | 'Housing' | 'Education' | 'Utilities'
  | 'Salary' | 'Freelance' | 'Investment' | 'Other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: Category;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface Summary {
  allTime: { income: number; expenses: number; balance: number };
  thisMonth: { income: number; expenses: number; balance: number };
  byCategory: Array<{ category: string; type: string; _sum: { amount: number } }>;
  monthlyTrend: Array<{ month: string; type: string; total: number }>;
}

export interface ParsedReceipt {
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  date: string | null;
}

export const EXPENSE_CATEGORIES: Category[] = [
  'Food','Transport','Shopping','Entertainment',
  'Health','Housing','Education','Utilities','Other',
];

export const INCOME_CATEGORIES: Category[] = [
  'Salary','Freelance','Investment','Other',
];

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#E8593C', Transport: '#3B8BD4', Shopping: '#9B59B6',
  Entertainment: '#F39C12', Health: '#27AE60', Housing: '#E74C3C',
  Education: '#1ABC9C', Utilities: '#95A5A6', Salary: '#2ECC71',
  Freelance: '#3498DB', Investment: '#F1C40F', Other: '#BDC3C7',
};