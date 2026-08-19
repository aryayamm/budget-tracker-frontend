'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Summary, Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, t] = await Promise.all([
          api.transactions.summary(),
          api.transactions.list({ limit: 8 }),
        ]);
        setSummary(s);
        setTransactions(t.transactions);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
    </div>
  );

  const balance = summary?.allTime.balance ?? 0;
  const income = summary?.allTime.income ?? 0;
  const expenses = summary?.allTime.expenses ?? 0;

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '4px' }}>Overview</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())}
          </p>
        </div>
        <Link href="/entry" style={{
          background: 'var(--accent)', color: '#fff', padding: '0.6rem 1.25rem',
          borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
        }}>+ Add Entry</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Net Balance', value: balance, color: balance >= 0 ? 'var(--income)' : 'var(--expense)' },
          { label: 'Total Income', value: income, color: 'var(--income)' },
          { label: 'Total Expenses', value: expenses, color: 'var(--expense)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 600, color }}>{formatCurrency(value)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Month</div>
          {[
            { label: 'Income', value: summary?.thisMonth.income ?? 0, color: 'var(--income)' },
            { label: 'Expenses', value: summary?.thisMonth.expenses ?? 0, color: 'var(--expense)' },
            { label: 'Net', value: summary?.thisMonth.balance ?? 0, color: (summary?.thisMonth.balance ?? 0) >= 0 ? 'var(--income)' : 'var(--expense)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontWeight: 500, color }}>{formatCurrency(value)}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Transactions</div>
            <Link href="/analytics" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem 0', fontSize: '0.875rem' }}>
              No transactions yet. <Link href="/entry" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Add one →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {transactions.map((tx) => (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 0.5rem', gap: '0.75rem' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                    background: tx.type === 'income' ? 'var(--income-dim)' : 'var(--expense-dim)',
                    color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                  }}>{tx.type === 'income' ? '↑' : '↓'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>{tx.category} · {formatDate(tx.date)}</div>
                  </div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', flexShrink: 0, color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}