"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type RetirementResult,
  calculateRetirement,
} from "../lib/retirement";
import { useLocalStorageState } from "../lib/useLocalStorageState";

export default function RetirementPage() {
  const [currentAge, setCurrentAge] = useLocalStorageState("ret_currentAge", 30);
  const [retirementAge, setRetirementAge] = useLocalStorageState("ret_retirementAge", 65);
  const [lifeExpectancy, setLifeExpectancy] = useLocalStorageState("ret_lifeExpectancy", 90);
  const [currentSavings, setCurrentSavings] = useLocalStorageState("ret_currentSavings", 1000000);
  const [monthlyContribution, setMonthlyContribution] = useLocalStorageState("ret_monthlyContribution", 30000);
  const [annualReturn, setAnnualReturn] = useLocalStorageState("ret_annualReturn", 3.0);
  const [pensionMonthly, setPensionMonthly] = useLocalStorageState("ret_pensionMonthly", 150000);
  const [monthlyExpense, setMonthlyExpense] = useLocalStorageState("ret_monthlyExpense", 250000);
  const [result, setResult] = useState<RetirementResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(
      calculateRetirement(
        currentAge,
        retirementAge,
        lifeExpectancy,
        currentSavings,
        monthlyContribution,
        annualReturn,
        pensionMonthly,
        monthlyExpense,
      ),
    );
  };

  const formatMan = (value: number) => `${(value / 10000).toFixed(0)}万円`;

  const inputField = (
    id: string,
    label: string,
    value: number,
    onChange: (v: number) => void,
    opts: { min?: number; max?: number; step?: number; suffix?: string } = {},
  ) => (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black text-sm"
        min={opts.min}
        max={opts.max}
        step={opts.step}
      />
      {opts.suffix && (
        <p className="mt-1 text-xs text-gray-500">{opts.suffix}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            &larr; OpenMoney トップへ
          </Link>
        </div>
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-800">
          老後資金シミュレーター
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl bg-white p-6 shadow-md"
        >
          <p className="mb-3 text-sm font-medium text-gray-700">基本情報</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {inputField("currentAge", "現在の年齢", currentAge, setCurrentAge, {
              min: 18,
              max: 80,
            })}
            {inputField(
              "retirementAge",
              "退職予定年齢",
              retirementAge,
              setRetirementAge,
              { min: 50, max: 80 },
            )}
            {inputField(
              "lifeExpectancy",
              "想定寿命",
              lifeExpectancy,
              setLifeExpectancy,
              { min: 70, max: 110 },
            )}
            {inputField(
              "annualReturn",
              "想定運用利回り（%）",
              annualReturn,
              setAnnualReturn,
              { min: 0, max: 15, step: 0.1 },
            )}
          </div>

          <p className="mt-6 mb-3 text-sm font-medium text-gray-700">
            積立・資産
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {inputField(
              "currentSavings",
              "現在の貯蓄額（円）",
              currentSavings,
              setCurrentSavings,
              { min: 0, step: 100000, suffix: formatMan(currentSavings) },
            )}
            {inputField(
              "monthlyContribution",
              "毎月の積立額（円）",
              monthlyContribution,
              setMonthlyContribution,
              { min: 0, step: 10000 },
            )}
            {inputField(
              "pensionMonthly",
              "年金受給額（月額・円）",
              pensionMonthly,
              setPensionMonthly,
              { min: 0, step: 10000 },
            )}
            {inputField(
              "monthlyExpense",
              "老後の月額生活費（円）",
              monthlyExpense,
              setMonthlyExpense,
              { min: 0, step: 10000 },
            )}
          </div>

          <div className="mt-6 text-center">
            <button
              type="submit"
              className="rounded-lg bg-purple-600 px-8 py-3 font-semibold text-white shadow transition hover:bg-purple-700"
            >
              シミュレーション実行
            </button>
          </div>
        </form>

        {result && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-white p-6 shadow-md text-center">
                <p className="text-sm text-gray-500">退職時の資産</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatMan(result.totalAtRetirement)}
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-md text-center">
                <p className="text-sm text-gray-500">積立総額</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatMan(result.totalContribution)}
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-md text-center">
                <p className="text-sm text-gray-500">毎月の取崩額</p>
                <p className="text-2xl font-bold text-blue-600">
                  {result.monthlyWithdrawal.toLocaleString()}円
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  生活費 - 年金
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-md text-center">
                <p className="text-sm text-gray-500">資産寿命</p>
                <p
                  className={`text-2xl font-bold ${
                    result.schedule[result.schedule.length - 1].balance > 0
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {result.schedule[result.schedule.length - 1].balance > 0
                    ? `${lifeExpectancy}歳まで安心`
                    : `${retirementAge + result.yearsLastAfterRetirement}歳で枯渇`}
                </p>
              </div>
            </div>

            <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-bold text-gray-800">
                資産残高の推移
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={result.schedule}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="age"
                    tickFormatter={(v) => `${v}歳`}
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`}
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value) =>
                      `${Number(value).toLocaleString()}円`
                    }
                    labelFormatter={(label) => `${label}歳`}
                  />
                  <Legend />
                  <ReferenceLine
                    x={retirementAge}
                    stroke="#666"
                    strokeDasharray="3 3"
                    label="退職"
                  />
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
                年別スケジュール
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-black">
                  <thead>
                    <tr className="border-b-2 border-gray-200 text-left text-black">
                      <th className="px-3 py-2">年齢</th>
                      <th className="px-3 py-2">区分</th>
                      <th className="px-3 py-2 text-right">年間積立</th>
                      <th className="px-3 py-2 text-right">年間取崩</th>
                      <th className="px-3 py-2 text-right">資産残高</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.schedule.map((row) => (
                      <tr
                        key={row.age}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          row.age === retirementAge ? "bg-purple-50" : ""
                        } ${row.balance === 0 && row.phase === "取崩" ? "bg-red-50" : ""}`}
                      >
                        <td className="px-3 py-2">{row.age}歳</td>
                        <td className="px-3 py-2">{row.phase}</td>
                        <td className="px-3 py-2 text-right">
                          {row.contribution > 0
                            ? formatMan(row.contribution)
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.withdrawal > 0
                            ? formatMan(row.withdrawal)
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatMan(row.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
