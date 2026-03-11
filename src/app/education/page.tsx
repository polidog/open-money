"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type EducationPlan,
  type EducationResult,
  type SchoolType,
  calculateEducation,
} from "../lib/education";
import { useLocalStorageState } from "../lib/useLocalStorageState";

export default function EducationPage() {
  const [childAge, setChildAge] = useLocalStorageState("edu_childAge", 0);
  const [currentSavings, setCurrentSavings] = useLocalStorageState("edu_currentSavings", 0);
  const [annualReturn, setAnnualReturn] = useLocalStorageState("edu_annualReturn", 1.0);
  const [plan, setPlan] = useLocalStorageState<EducationPlan>("edu_plan", {
    kindergarten: "public",
    elementary: "public",
    juniorHigh: "public",
    highSchool: "public",
    university: "public",
  });
  const [result, setResult] = useState<EducationResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(calculateEducation(childAge, plan, currentSavings, annualReturn));
  };

  const formatMan = (value: number) => `${(value / 10000).toFixed(0)}万円`;

  const updatePlan = (key: keyof EducationPlan, value: string) => {
    setPlan({ ...plan, [key]: value });
  };

  const schoolSelect = (
    label: string,
    key: keyof EducationPlan,
    options: { value: string; label: string }[],
  ) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        value={plan[key]}
        onChange={(e) => updatePlan(key, e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            &larr; OpenMoney トップへ
          </Link>
        </div>
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-800">
          教育資金シミュレーター
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl bg-white p-6 shadow-md"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label
                htmlFor="childAge"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                子どもの現在の年齢
              </label>
              <input
                id="childAge"
                type="number"
                value={childAge}
                onChange={(e) => setChildAge(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black"
                min={0}
                max={18}
              />
            </div>
            <div>
              <label
                htmlFor="currentSavings"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                現在の教育資金貯蓄（円）
              </label>
              <input
                id="currentSavings"
                type="number"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black"
                min={0}
                step={100000}
              />
            </div>
            <div>
              <label
                htmlFor="annualReturn"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                想定運用利回り（%）
              </label>
              <input
                id="annualReturn"
                type="number"
                value={annualReturn}
                onChange={(e) => setAnnualReturn(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black"
                min={0}
                max={10}
                step={0.1}
              />
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-gray-700">
              進学プラン
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {schoolSelect("幼稚園", "kindergarten", [
                { value: "public", label: "公立" },
                { value: "private", label: "私立" },
              ])}
              {schoolSelect("小学校", "elementary", [
                { value: "public", label: "公立" },
                { value: "private", label: "私立" },
              ])}
              {schoolSelect("中学校", "juniorHigh", [
                { value: "public", label: "公立" },
                { value: "private", label: "私立" },
              ])}
              {schoolSelect("高校", "highSchool", [
                { value: "public", label: "公立" },
                { value: "private", label: "私立" },
              ])}
              {schoolSelect("大学", "university", [
                { value: "public", label: "国公立" },
                { value: "private_arts", label: "私立文系" },
                { value: "private_science", label: "私立理系" },
                { value: "none", label: "進学しない" },
              ])}
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-8 py-3 font-semibold text-white shadow transition hover:bg-green-700"
            >
              シミュレーション実行
            </button>
          </div>
        </form>

        {result && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-6 shadow-md text-center">
                <p className="text-sm text-gray-500">教育費総額</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatMan(result.totalCost)}
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-md text-center">
                <p className="text-sm text-gray-500">必要な月額積立額</p>
                <p className="text-2xl font-bold text-blue-600">
                  {result.monthlySavingsNeeded.toLocaleString()}円
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-md text-center">
                <p className="text-sm text-gray-500">積立期間</p>
                <p className="text-2xl font-bold text-gray-800">
                  {result.yearlyCosts.length > 0
                    ? `${result.yearlyCosts[result.yearlyCosts.length - 1].childAge - childAge + 1}年間`
                    : "-"}
                </p>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-lg font-bold text-gray-800">
                  年間教育費
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={result.yearlyCosts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="childAge"
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
                    <Bar dataKey="cost" name="教育費" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-lg font-bold text-gray-800">
                  累計教育費と貯蓄残高
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={result.yearlyCosts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="childAge"
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
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      name="累計教育費"
                      stroke="#ef4444"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      name="貯蓄残高"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-bold text-gray-800">
                年間教育費の内訳
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-black">
                  <thead>
                    <tr className="border-b-2 border-gray-200 text-left text-black">
                      <th className="px-3 py-2">年齢</th>
                      <th className="px-3 py-2">進学先</th>
                      <th className="px-3 py-2 text-right">年間教育費</th>
                      <th className="px-3 py-2 text-right">累計</th>
                      <th className="px-3 py-2 text-right">貯蓄残高</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearlyCosts.map((row) => (
                      <tr
                        key={`${row.childAge}-${row.stage}`}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">{row.childAge}歳</td>
                        <td className="px-3 py-2">{row.stage}</td>
                        <td className="px-3 py-2 text-right">
                          {formatMan(row.cost)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatMan(row.cumulative)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatMan(row.savings)}
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
