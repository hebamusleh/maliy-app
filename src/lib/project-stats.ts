import { ProjectStats, Transaction } from "@/types/project";

export function calculateProjectStats(
  transactions: Transaction[],
): ProjectStats {
  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = Math.abs(
    transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0),
  );

  const netProfit = income - expenses;
  const transactionCount = transactions.length;

  return {
    total_income: income,
    total_expenses: expenses,
    net_profit: netProfit,
    transaction_count: transactionCount,
  };
}

export function generateProjectInsights(
  stats: ProjectStats,
  transactions: Transaction[],
): string[] {
  const insights: string[] = [];

  if (stats.transaction_count === 0) {
    insights.push("لا توجد معاملات بعد. ابدأ بإضافة معاملاتك الأولى.");
    return insights;
  }

  if (stats.net_profit > 0) {
    insights.push(`المشروع مربح بقيمة ${stats.net_profit} ريال`);
  } else if (stats.net_profit < 0) {
    insights.push(`المشروع خاسر بقيمة ${Math.abs(stats.net_profit)} ريال`);
  } else {
    insights.push("المشروع متوازن (الدخل = المصروفات)");
  }

  const avgTransaction =
    (stats.total_income + stats.total_expenses) / stats.transaction_count;
  insights.push(`متوسط قيمة المعاملة: ${avgTransaction.toFixed(2)} ريال`);

  // Simple cash flow insight
  const recentTransactions = transactions.slice(-5);
  const recentIncome = recentTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const recentExpenses = Math.abs(
    recentTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0),
  );

  if (recentIncome > recentExpenses) {
    insights.push("التدفق النقدي إيجابي في المعاملات الأخيرة");
  } else {
    insights.push("انتبه للتدفق النقدي - المصروفات أعلى من الدخل مؤخراً");
  }

  return insights;
}

export function prepareChartData(transactions: Transaction[]) {
  // Group by month for P&L chart
  const monthlyData: { [key: string]: { income: number; expenses: number } } =
    {};

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }

    if (transaction.amount > 0) {
      monthlyData[monthKey].income += transaction.amount;
    } else {
      monthlyData[monthKey].expenses += Math.abs(transaction.amount);
    }
  });

  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }));
}
