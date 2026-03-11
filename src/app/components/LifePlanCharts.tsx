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
  const fmtYenToMan = (v: number) => `${(v / 10000).toFixed(0)}万円`;

  return (
    <div className="space-y-16">
      <div>
        <h3 className="mb-2 text-2xl font-medium tracking-tight text-neutral-900">資産残高の推移</h3>
        <p className="mb-8 text-xs uppercase tracking-widest text-neutral-400">Asset Balance Over Time</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={schedule}>
            <CartesianGrid stroke="#f5f5f5" strokeDasharray="none" />
            <XAxis
              dataKey="age"
              tickFormatter={(v) => `${v}`}
              fontSize={11}
              stroke="#a3a3a3"
              tickLine={false}
              axisLine={{ stroke: "#e5e5e5" }}
            />
            <YAxis
              tickFormatter={formatMan}
              fontSize={11}
              stroke="#a3a3a3"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString()}円`, "資産残高"]}
              labelFormatter={(label) => `${label}歳`}
              contentStyle={{
                border: "1px solid #e5e5e5",
                borderRadius: 0,
                fontSize: 12,
                boxShadow: "none",
              }}
            />
            <ReferenceLine
              x={retirementAge}
              stroke="#a3a3a3"
              strokeDasharray="4 4"
              label={{ value: "退職", position: "top", fontSize: 11, fill: "#a3a3a3" }}
            />
            <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="2 2" strokeOpacity={0.5} />
            <Area
              type="monotone"
              dataKey="balance"
              name="資産残高"
              stroke="#0a0a0a"
              fill="#f5f5f5"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="mb-2 text-2xl font-medium tracking-tight text-neutral-900">年間支出の内訳</h3>
        <p className="mb-8 text-xs uppercase tracking-widest text-neutral-400">Annual Expense Breakdown</p>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={schedule}>
            <CartesianGrid stroke="#f5f5f5" strokeDasharray="none" />
            <XAxis
              dataKey="age"
              tickFormatter={(v) => `${v}`}
              fontSize={11}
              stroke="#a3a3a3"
              tickLine={false}
              axisLine={{ stroke: "#e5e5e5" }}
            />
            <YAxis
              tickFormatter={formatMan}
              fontSize={11}
              stroke="#a3a3a3"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value, name) => [`${Number(value).toLocaleString()}円`, name]}
              labelFormatter={(label) => `${label}歳`}
              contentStyle={{
                border: "1px solid #e5e5e5",
                borderRadius: 0,
                fontSize: 12,
                boxShadow: "none",
              }}
            />
            <Legend
              iconType="square"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: "#737373" }}
            />
            <ReferenceLine
              x={retirementAge}
              stroke="#a3a3a3"
              strokeDasharray="4 4"
              label={{ value: "退職", position: "top", fontSize: 11, fill: "#a3a3a3" }}
            />
            <Bar dataKey="livingCost" name="生活費" stackId="expense" fill="#d4d4d4" />
            <Bar dataKey="loanPayment" name="住宅ローン" stackId="expense" fill="#737373" />
            <Bar dataKey="educationCost" name="教育費" stackId="expense" fill="#0a0a0a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
