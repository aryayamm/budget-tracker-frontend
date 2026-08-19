'use client';
import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { api } from '@/lib/api';
import { getSpendingInsights } from '@/lib/gemini';
import { Summary, TransactionType, CATEGORY_COLORS } from '@/types';
import { formatCurrency, formatMonth } from '@/lib/utils';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [activeType, setActiveType] = useState<TransactionType | 'all'>('expense');

  const loadSummary = useCallback(async () => {
    try {
      const s = await api.transactions.summary();
      setSummary(s); return s;
    } catch (e) { console.error(e); return null; }
    finally { setLoading(false); }
  }, []);

  async function loadInsights(s: Summary) {
    setInsightsLoading(true);
    try { setInsights(await getSpendingInsights(s)); }
    catch { setInsights([]); }
    finally { setInsightsLoading(false); }
  }

  useEffect(() => { loadSummary().then((s) => { if (s) loadInsights(s); }); }, [loadSummary]);

  const card: React.CSSProperties = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' };
  const sectionLabel: React.CSSProperties = { fontSize: '0.72rem', color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.25rem' };
  const tt = { contentStyle: { background: 'var(--bg-raised)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.8rem' } };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: 'var(--text-tertiary)' }}>Crunching numbers...</div>
    </div>
  );

  if (!summary) return <div style={{ color: 'var(--text-tertiary)' }}>No data available.</div>;

  const categoryData = summary.byCategory
    .filter((c) => activeType === 'all' || c.type === activeType)
    .map((c) => ({ name: c.category, amount: c._sum.amount, fill: CATEGORY_COLORS[c.category] || '#888' }))
    .sort((a, b) => b.amount - a.amount).slice(0, 8);

  const months = [...new Set(summary.monthlyTrend.map((r) => r.month))].sort();
  const trendData = months.map((month) => ({
    month: formatMonth(month),
    income: summary.monthlyTrend.find((r) => r.month === month && r.type === 'income')?.total || 0,
    expense: summary.monthlyTrend.find((r) => r.month === month && r.type === 'expense')?.total || 0,
  }));

  const pieData = summary.byCategory
    .filter((c) => c.type === 'expense')
    .map((c) => ({ name: c.category, value: c._sum.amount, fill: CATEGORY_COLORS[c.category] || '#888' }))
    .sort((a, b) => b.value - a.value).slice(0, 6);

  const totalExpenses = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '4px' }}>Analytics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Last 6 months</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['all', 'expense', 'income'] as const).map((t) => (
          <button key={t} onClick={() => setActiveType(t)} style={{
            padding: '0.4rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer',
            background: activeType === t ? 'var(--accent-dim)' : 'var(--bg-raised)',
            color: activeType === t ? 'var(--accent)' : 'var(--text-secondary)',
            border: activeType === t ? '1px solid var(--accent)' : '1px solid var(--border)',
          }}>
            {t === 'all' ? 'All' : t === 'expense' ? '↓ Expenses' : '↑ Income'}
          </button>
        ))}
      </div>

      {(insights.length > 0 || insightsLoading) && (
        <div style={{ ...card, marginBottom: '1.5rem', background: 'var(--accent-dim)', borderColor: 'rgba(108,143,255,0.2)' }}>
          <div style={{ ...sectionLabel, color: 'var(--accent)' }}>AI Insights</div>
          {insightsLoading ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Generating insights...</div>
          ) : insights.map((insight, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 500, fontSize: '0.8rem', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{insight}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={card}>
          <div style={sectionLabel}>Category breakdown</div>
          {categoryData.length === 0 ? <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem 0' }}>No data</div> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" tickFormatter={(v: number) => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} tick={{ fill: '#545b6e', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#8b92a8', fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip {...tt} formatter={(v: unknown) => [formatCurrency(v as number), 'Amount']} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {categoryData.map((e, i) => <Cell key={i} fill={e.fill} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={card}>
          <div style={sectionLabel}>Expense distribution</div>
          {pieData.length === 0 ? <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem 0' }}>No data</div> : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.fill} fillOpacity={0.9} />)}
                  </Pie>
                  <Tooltip {...tt} formatter={(v: unknown) => [formatCurrency(v as number), '']} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {pieData.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: d.fill, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                    <span style={{ fontWeight: 500 }}>{totalExpenses > 0 ? Math.round((d.value / totalExpenses) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={card}>
        <div style={sectionLabel}>Monthly trend</div>
        {trendData.length === 0 ? <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem 0' }}>No data yet</div> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#8b92a8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v: number) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} tick={{ fill: '#545b6e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tt} formatter={(v: unknown, name: unknown) => [formatCurrency(v as number), name as string]} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#8b92a8' }} />
              <Line type="monotone" dataKey="income" stroke="#4ade80" strokeWidth={2} dot={{ fill: '#4ade80', r: 3 }} />
              <Line type="monotone" dataKey="expense" stroke="#f87171" strokeWidth={2} dot={{ fill: '#f87171', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {trendData.length > 1 && (
        <div style={{ ...card, marginTop: '1rem' }}>
          <div style={sectionLabel}>Monthly comparison</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr>{['Month','Income','Expenses','Net'].map((h) => (
                <th key={h} style={{ textAlign: h === 'Month' ? 'left' : 'right', padding: '0.5rem 0.75rem', color: 'var(--text-tertiary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {trendData.map((row) => {
                const net = row.income - row.expense;
                return (
                  <tr key={row.month} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>{row.month}</td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: 'var(--income)' }}>{formatCurrency(row.income)}</td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: 'var(--expense)' }}>{formatCurrency(row.expense)}</td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 500, color: net >= 0 ? 'var(--income)' : 'var(--expense)' }}>{net >= 0 ? '+' : ''}{formatCurrency(net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}