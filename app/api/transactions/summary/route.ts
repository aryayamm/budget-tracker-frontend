import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allTime, thisMonth, byCategory, monthlyTrend] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['type'],
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: { date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['category', 'type'],
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.$queryRaw<Array<{ month: string; type: string; total: number }>>`
        SELECT
          TO_CHAR(date, 'YYYY-MM') as month,
          type,
          SUM(amount)::float as total
        FROM "Transaction"
        GROUP BY TO_CHAR(date, 'YYYY-MM'), type
        ORDER BY month ASC
      `,
    ]);

    const totalIncome = (allTime.find((r: { type: string; _sum: { amount: number | null } }) => r.type === 'income')?._sum.amount) || 0;
    const totalExpenses = (allTime.find((r: { type: string; _sum: { amount: number | null } }) => r.type === 'expense')?._sum.amount) || 0;
    const monthIncome = (thisMonth.find((r: { type: string; _sum: { amount: number | null } }) => r.type === 'income')?._sum.amount) || 0;
    const monthExpenses = (thisMonth.find((r: { type: string; _sum: { amount: number | null } }) => r.type === 'expense')?._sum.amount) || 0;

    return NextResponse.json({
      allTime: {
        income: totalIncome,
        expenses: totalExpenses,
        balance: totalIncome - totalExpenses,
      },
      thisMonth: {
        income: monthIncome,
        expenses: monthExpenses,
        balance: monthIncome - monthExpenses,
      },
      byCategory,
      monthlyTrend,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}