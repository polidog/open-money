"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { YearlyLifePlan } from "../lib/lifeplan";

type Props = {
  schedule: YearlyLifePlan[];
  retirementAge: number;
};

export default function LifePlanCharts({ schedule, retirementAge }: Props) {
  const formatMan = (value: number) => `${(value / 10000).toFixed(0)}万`;

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          資産残高の推移
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={schedule}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="age"
              tickFormatter={(v) => `${v}歳`}
              fontSize={12}
            />
            <YAxis tickFormatter={formatMan} fontSize={12} />
            <Tooltip
              formatter={(value) => `${Number(value).toLocaleString()}円`}
              labelFormatter={(label) => `${label}歳`}
            />
            <Legend />
            <ReferenceLine
              x={retirementAge}
              stroke="#666"
              strokeDasharray="3 3"
              label="退職"
            />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="2 2" />
            <Area
              type="monotone"
              dataKey="balance"
              name="資産残高"
              stroke="#8b5cf6"
              fill="#c4b5fd"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          年間支出の内訳
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={schedule}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="age"
              tickFormatter={(v) => `${v}歳`}
              fontSize={12}
            />
            <YAxis tickFormatter={formatMan} fontSize={12} />
            <Tooltip
              formatter={(value) => `${Number(value).toLocaleString()}円`}
              labelFormatter={(label) => `${label}歳`}
            />
            <Legend />
            <ReferenceLine
              x={retirementAge}
              stroke="#666"
              strokeDasharray="3 3"
              label="退職"
            />
            <Bar
              dataKey="livingCost"
              name="生活費"
              stackId="expense"
              fill="#94a3b8"
            />
            <Bar
              dataKey="loanPayment"
              name="住宅ローン"
              stackId="expense"
              fill="#3b82f6"
            />
            <Bar
              dataKey="educationCost"
              name="教育費"
              stackId="expense"
              fill="#22c55e"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
