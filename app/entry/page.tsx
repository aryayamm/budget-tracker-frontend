'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { parseReceiptWithGemini } from '@/lib/gemini';
import { TransactionType, Category, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';
import { formatCurrency } from '@/lib/utils';

type FormData = {
  type: TransactionType; amount: string; category: Category;
  description: string; date: string;
};

const defaultForm: FormData = {
  type: 'expense', amount: '', category: 'Food',
  description: '', date: new Date().toISOString().split('T')[0],
};

export default function EntryPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(defaultForm);
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [receiptMode, setReceiptMode] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function update(key: keyof FormData, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'type') next.category = value === 'income' ? 'Salary' : 'Food';
      return next;
    });
  }

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true); setError('');
    try {
      const parsed = await parseReceiptWithGemini(file);
      setForm({
        type: parsed.type || 'expense', amount: String(parsed.amount || ''),
        category: (parsed.category as Category) || 'Other',
        description: parsed.description || '',
        date: parsed.date ? parsed.date.split('T')[0] : new Date().toISOString().split('T')[0],
      });
      setReceiptMode(false);
    } catch { setError('Could not read receipt. Please fill in manually.'); }
    finally { setParsing(false); }
  }

  async function handleSubmit() {
    setSubmitting(true); setError('');
    try {
      await api.transactions.create({
        type: form.type, amount: parseFloat(form.amount),
        category: form.category as Category, description: form.description,
        date: new Date(form.date).toISOString(),
      });
      setStep('success');
    } catch { setError('Failed to save. Please try again.'); setStep('form'); }
    finally { setSubmitting(false); }
  }

  const input: React.CSSProperties = {
    width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '0.65rem 0.9rem', color: 'var(--text-primary)',
    fontSize: '0.9rem', outline: 'none',
  };
  const label: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)',
    marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em',
  };
  const card: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '1.75rem',
  };

  if (step === 'success') return (
    <div style={{ maxWidth: '480px', margin: '4rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>Saved!</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        {form.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(form.amount))} · {form.category}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button onClick={() => { setForm(defaultForm); setStep('form'); }} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem 1.25rem', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem' }}>
          Add another
        </button>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'var(--accent)', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
          Dashboard
        </button>
      </div>
    </div>
  );

  if (step === 'confirm') return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Confirm</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>Review before saving</p>
      <div style={{ ...card, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase' }}>{form.type}</div>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: form.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
              {form.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(form.amount))}
            </div>
          </div>
          <div style={{ background: form.type === 'income' ? 'var(--income-dim)' : 'var(--expense-dim)', color: form.type === 'income' ? 'var(--income)' : 'var(--expense)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
            {form.category}
          </div>
        </div>
        {[
          { label: 'Description', value: form.description },
          { label: 'Date', value: new Date(form.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{label}</span>
            <span style={{ fontSize: '0.875rem' }}>{value}</span>
          </div>
        ))}
      </div>
      {error && <div style={{ color: 'var(--expense)', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</div>}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button onClick={() => setStep('form')} style={{ flex: 1, background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.7rem', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem' }}>← Edit</button>
        <button onClick={handleSubmit} disabled={submitting} style={{ flex: 2, background: 'var(--accent)', border: 'none', borderRadius: '8px', padding: '0.7rem', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Saving...' : 'Save transaction'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '4px' }}>New entry</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Record an income or expense</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[false, true].map((isReceipt) => (
          <button key={String(isReceipt)} onClick={() => setReceiptMode(isReceipt)} style={{
            padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer',
            background: receiptMode === isReceipt ? 'var(--accent-dim)' : 'var(--bg-raised)',
            color: receiptMode === isReceipt ? 'var(--accent)' : 'var(--text-secondary)',
            border: receiptMode === isReceipt ? '1px solid var(--accent)' : '1px solid var(--border)',
          }}>
            {isReceipt ? '📎 Upload receipt (AI)' : 'Manual entry'}
          </button>
        ))}
      </div>

      {receiptMode && (
        <div onClick={() => fileRef.current?.click()} style={{
          background: 'var(--bg-card)', border: '2px dashed var(--border-strong)', borderRadius: '12px',
          padding: '2.5rem', textAlign: 'center', marginBottom: '1.5rem', cursor: 'pointer',
        }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleReceiptUpload} />
          {parsing ? (
                <div style={{ color: 'var(--text-secondary)' }}>Reading receipt... this may take a few seconds</div>
          ) : (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧾</div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Click to upload a receipt</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>AI will extract the details automatically</div>
            </>
          )}
        </div>
      )}

      <div style={card}>
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={label}>Type</span>
          <div style={{ display: 'flex', background: 'var(--bg-raised)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <button key={t} onClick={() => update('type', t)} style={{
                flex: 1, padding: '0.45rem', borderRadius: '6px', fontSize: '0.875rem',
                cursor: 'pointer', border: 'none',
                background: form.type === t ? (t === 'income' ? 'var(--income-dim)' : 'var(--expense-dim)') : 'transparent',
                color: form.type === t ? (t === 'income' ? 'var(--income)' : 'var(--expense)') : 'var(--text-secondary)',
                fontWeight: form.type === t ? 500 : 400,
              }}>
                {t === 'income' ? '↑ Income' : '↓ Expense'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <span style={label}>Amount</span>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>$</span>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => update('amount', e.target.value)} style={{ ...input, paddingLeft: '1.75rem' }} />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <span style={label}>Category</span>
          <select value={form.category} onChange={(e) => update('category', e.target.value)} style={{ ...input, cursor: 'pointer' }}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <span style={label}>Description</span>
          <input type="text" placeholder={form.type === 'income' ? 'e.g. Monthly salary' : 'e.g. Lunch at cafe'} value={form.description} onChange={(e) => update('description', e.target.value)} style={input} />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <span style={label}>Date</span>
          <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} style={input} />
        </div>

        {error && <div style={{ color: 'var(--expense)', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</div>}

        <button onClick={() => {
          if (!form.amount || !form.description) { setError('Please fill in all fields'); return; }
          setError(''); setStep('confirm');
        }} style={{ width: '100%', background: 'var(--accent)', border: 'none', borderRadius: '8px', padding: '0.75rem', color: '#fff', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}>
          Review entry →
        </button>
      </div>
    </div>
  );
}