import { Transaction, TransactionFilters, Summary } from '@/types';

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  transactions: {
    list: (filters?: TransactionFilters) => {
      const params = new URLSearchParams();
      if (filters?.type) params.set('type', filters.type);
      if (filters?.category) params.set('category', filters.category);
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      if (filters?.limit) params.set('limit', String(filters.limit));
      if (filters?.offset) params.set('offset', String(filters.offset));
      const qs = params.toString();
      return fetchAPI<{ transactions: Transaction[]; total: number }>(
        `/api/transactions${qs ? `?${qs}` : ''}`
      );
    },
    summary: () => fetchAPI<Summary>('/api/transactions/summary'),
    create: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) =>
      fetchAPI<Transaction>('/api/transactions', {
        method: 'POST', body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Transaction>) =>
      fetchAPI<Transaction>(`/api/transactions/${id}`, {
        method: 'PUT', body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetch(`/api/transactions/${id}`, { method: 'DELETE' }),
  },
};