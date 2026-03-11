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
      label: `${lastMonth.age}`,
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

  const tooltipStyle = {
    border: "1px solid #e5e5e5",
    borderRadius: 0,
    fontSize: 12,
    boxShadow: "none",
  };

  return (
    <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
      <div>
        <h3 className="mb-2 text-lg font-medium tracking-tight text-neutral-900">年間支払い内訳</h3>
        <p className="mb-8 text-xs uppercase tracking-widest text-neutral-400">Principal & Interest</p>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={yearlyData}>
            <CartesianGrid stroke="#f5f5f5" strokeDasharray="none" />
            <XAxis
              dataKey="label"
              fontSize={11}
              stroke="#a3a3a3"
              tickLine={false}
              axisLine={{ stroke: "#e5e5e5" }}
            />
            <YAxis
              tickFormatter={formatYen}
              fontSize={11}
              stroke="#a3a3a3"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value, name) => [`${Number(value).toLocaleString()}円`, name]}
              labelFormatter={(label) => `${label}歳`}
              contentStyle={tooltipStyle}
            />
            <Legend
              iconType="square"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: "#737373" }}
            />
            <Bar dataKey="principal" name="元金" stackId="a" fill="#0a0a0a" />
            <Bar dataKey="interest" name="利息" stackId="a" fill="#d4d4d4" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-medium tracking-tight text-neutral-900">ローン残高の推移</h3>
        <p className="mb-8 text-xs uppercase tracking-widest text-neutral-400">Remaining Balance</p>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={yearlyData}>
            <CartesianGrid stroke="#f5f5f5" strokeDasharray="none" />
            <XAxis
              dataKey="label"
              fontSize={11}
              stroke="#a3a3a3"
              tickLine={false}
              axisLine={{ stroke: "#e5e5e5" }}
            />
            <YAxis
              tickFormatter={formatYen}
              fontSize={11}
              stroke="#a3a3a3"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString()}円`, "残高"]}
              labelFormatter={(label) => `${label}歳`}
              contentStyle={tooltipStyle}
            />
            <Area
              type="monotone"
              dataKey="remainingBalance"
              name="残高"
              stroke="#0a0a0a"
              fill="#f5f5f5"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
