"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LoanResult } from "../lib/loan";

type Props = {
  result: LoanResult;
};

type YearlyData = {
  label: string;
  principal: number;
  interest: number;
  remainingBalance: number;
};

export default function LoanCharts({ result }: Props) {
  const yearlyData: YearlyData[] = [];
  const { schedule } = result;

  const years = schedule[schedule.length - 1].year;
  for (let y = 1; y <= years; y++) {
    const monthsInYear = schedule.filter((s) => s.year === y);
    const totalPrincipal = monthsInYear.reduce((sum, m) => sum + m.principal, 0);
    const totalInterest = monthsInYear.reduce((sum, m) => sum + m.interest, 0);
    const lastMonth = monthsInYear[monthsInYear.length - 1];
    yearlyData.push({
      label: `${lastMonth.age}歳`,
      principal: Math.round(totalPrincipal),
      interest: Math.round(totalInterest),
      remainingBalance: lastMonth.remainingBalance,
    });
  }

  const formatYen = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}万`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          年間支払い内訳（元金・利息）
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={yearlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" fontSize={12} />
            <YAxis tickFormatter={formatYen} fontSize={12} />
            <Tooltip
              formatter={(value) => `${Number(value).toLocaleString()}円`}
            />
            <Legend />
            <Bar
              dataKey="principal"
              name="元金"
              stackId="a"
              fill="#3b82f6"
            />
            <Bar
              dataKey="interest"
              name="利息"
              stackId="a"
              fill="#ef4444"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          ローン残高の推移
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={yearlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" fontSize={12} />
            <YAxis tickFormatter={formatYen} fontSize={12} />
            <Tooltip
              formatter={(value) => `${Number(value).toLocaleString()}円`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="remainingBalance"
              name="残高"
              stroke="#8b5cf6"
              fill="#c4b5fd"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
