"use client";

import Card from "@/components/ui/Card";
import { prepareChartData } from "@/lib/project-stats";
import { ProjectStats, Transaction } from "@/types/project";
import { memo, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ProjectDashboardProps {
  stats: ProjectStats;
  transactions: Transaction[];
  insights: string[];
}

function ProjectDashboard({
  stats,
  transactions,
  insights,
}: ProjectDashboardProps) {
  const chartData = useMemo(
    () => prepareChartData(transactions),
    [transactions],
  );

  return (
    <div className="space-y-6" role="region" aria-label="لوحة تحكم المشروع">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.total_income.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">إجمالي الدخل</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.total_expenses.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">إجمالي المصروفات</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${stats.net_profit >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {stats.net_profit.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">صافي الربح</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.transaction_count}
            </div>
            <div className="text-sm text-gray-600">عدد المعاملات</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div role="region" aria-label="الرسم البياني للأرباح والخسائر">
          <Card>
            <h3 className="text-lg font-heading font-bold mb-4">
              الأرباح والخسائر الشهرية
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [
                      typeof value === "number"
                        ? `${value.toFixed(2)} ريال`
                        : `${value} ريال`,
                      "",
                    ]}
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Bar dataKey="income" fill="#10b981" name="الدخل" />
                  <Bar dataKey="expenses" fill="#ef4444" name="المصروفات" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div role="region" aria-label="الرسم البياني لصافي التدفق النقدي">
          <Card>
            <h3 className="text-lg font-heading font-bold mb-4">
              صافي التدفق النقدي
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [
                      typeof value === "number"
                        ? `${value.toFixed(2)} ريال`
                        : `${value} ريال`,
                      "صافي الربح",
                    ]}
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Insights */}
      <Card role="region" aria-label="رؤى ذكية">
        <h3 className="text-lg font-heading font-bold mb-4">رؤى ذكية</h3>
        <div className="space-y-2" role="list">
          {insights.map((insight, index) => (
            <div
              key={index}
              role="listitem"
              className="p-3 bg-blue-50 rounded-md"
            >
              <p className="text-sm text-blue-800">{insight}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <h3 className="text-lg font-heading font-bold mb-4">
          المعاملات الأخيرة
        </h3>
        <div className="space-y-2">
          {transactions.slice(0, 5).map((transaction) => (
            <div
              key={transaction.id}
              className="flex justify-between items-center p-3 border border-gray-200 rounded-md"
            >
              <div>
                <div className="font-medium">
                  {transaction.merchant || "معاملة"}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(transaction.date).toLocaleDateString("ar-SA")}
                </div>
              </div>
              <div
                className={`font-bold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {transaction.amount > 0 ? "+" : ""}
                {transaction.amount.toFixed(2)} {transaction.currency}
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              لا توجد معاملات بعد
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default memo(ProjectDashboard);
