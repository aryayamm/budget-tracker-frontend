'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Transaction, TransactionType, Category, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

type EditForm = {
  type: TransactionType;
  amount: string;
  category: Category;
  description: string;
  date: string;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  async function load(p = 0) {
    setLoading(true);
    try {
      const res = await api.transactions.list({ limit, offset: p * limit });
      setTransactions(res.transactions);
      setTotal(res.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(page); }, [page]);

  function startEdit(tx: Transaction) {
    setEditingId(tx.id);
    setEditForm({
      type: tx.type,
      amount: String(tx.amount),
      category: tx.category,
      description: tx.description,
      date: tx.date.split('T')[0],
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveEdit(id: string) {
    if (!editForm) return;
    setSaving(true);
    try {
      const updated = await api.transactions.update(id, {
        type: editForm.type,
        amount: parseFloat(editForm.amount),
        category: editForm.category,
        description: editForm.description,
        date: new Date(editForm.date).toISOString(),
      });
      setTransactions((prev) => prev.map((tx) => tx.id === id ? updated : tx));
      setEditingId(null);
      setEditForm(null);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function deleteTransaction(id: string) {
    setDeletingId(id);
    try {
      await api.transactions.delete(id);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      setTotal((t) => t - 1);
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  }

  const input: React.CSSProperties = {
    background: 'var(--bg-raised)', border: '1px solid var(--border)',
    borderRadius: '6px', padding: '0.35rem 0.6rem', color: 'var(--text-primary)',
    fontSize: '0.8rem', outline: 'none', width: '100%',
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '4px' }}>Transactions</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{total} total transactions</p>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No transactions yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date', 'Description', 'Category', 'Type', 'Amount', 'Actions'].map((h) => (
                    <th key={h} style={{
                      padding: '0.75rem 1rem', textAlign: h === 'Amount' ? 'right' : 'left',
                      color: 'var(--text-tertiary)', fontWeight: 500, fontSize: '0.75rem',
                      textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isEditing = editingId === tx.id;
                  const categories = editForm?.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)', background: isEditing ? 'var(--bg-raised)' : 'transparent' }}>
                      {isEditing && editForm ? (
                        <>
                          <td style={{ padding: '0.6rem 1rem' }}>
                            <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} style={input} />
                          </td>
                          <td style={{ padding: '0.6rem 1rem' }}>
                            <input type="text" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} style={input} />
                          </td>
                          <td style={{ padding: '0.6rem 1rem' }}>
                            <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Category })} style={input}>
                              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '0.6rem 1rem' }}>
                            <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value as TransactionType, category: e.target.value === 'income' ? 'Salary' : 'Food' })} style={input}>
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                            </select>
                          </td>
                          <td style={{ padding: '0.6rem 1rem' }}>
                            <input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} style={{ ...input, textAlign: 'right' }} />
                          </td>
                          <td style={{ padding: '0.6rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => saveEdit(tx.id)} disabled={saving} style={{ background: 'var(--accent)', border: 'none', borderRadius: '6px', padding: '0.35rem 0.75rem', color: '#fff', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500 }}>
                                {saving ? '...' : 'Save'}
                              </button>
                              <button onClick={cancelEdit} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.35rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(tx.date)}</td>
                          <td style={{ padding: '0.75rem 1rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ background: 'var(--bg-raised)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {tx.category}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              background: tx.type === 'income' ? 'var(--income-dim)' : 'var(--expense-dim)',
                              color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)',
                              padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem',
                            }}>
                              {tx.type === 'income' ? '↑ Income' : '↓ Expense'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 500, color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)', whiteSpace: 'nowrap' }}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => startEdit(tx)} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.3rem 0.65rem', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer' }}>
                                Edit
                              </button>
                              <button onClick={() => deleteTransaction(tx.id)} disabled={deletingId === tx.id} style={{ background: 'var(--expense-dim)', border: '1px solid transparent', borderRadius: '6px', padding: '0.3rem 0.65rem', color: 'var(--expense)', fontSize: '0.75rem', cursor: 'pointer', opacity: deletingId === tx.id ? 0.5 : 1 }}>
                                {deletingId === tx.id ? '...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              Page {page + 1} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 0} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.4rem 0.9rem', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', opacity: page === 0 ? 0.4 : 1 }}>
                ← Prev
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.4rem 0.9rem', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}