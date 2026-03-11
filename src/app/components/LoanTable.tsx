"use client";

import { useState } from "react";
import type { MonthlyPayment } from "../lib/loan";

type Props = {
  schedule: MonthlyPayment[];
};

export default function LoanTable({ schedule }: Props) {
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("yearly");

  const formatYen = (value: number) => `${value.toLocaleString()}円`;

  const hasPrepayments = schedule.some((s) => s.prepayment > 0);

  type YearlyRow = {
    year: number;
    age: number;
    totalPayment: number;
    totalPrincipal: number;
    totalInterest: number;
    totalPrepayment: number;
    remainingBalance: number;
  };

  const yearlyRows: YearlyRow[] = [];
  if (viewMode === "yearly") {
    const years = schedule[schedule.length - 1].year;
    for (let y = 1; y <= years; y++) {
      const months = schedule.filter((s) => s.year === y);
      const lastMonth = months[months.length - 1];
      yearlyRows.push({
        year: y,
        age: lastMonth.age,
        totalPayment: months.reduce((s, m) => s + m.payment, 0),
        totalPrincipal: months.reduce((s, m) => s + m.principal, 0),
        totalInterest: months.reduce((s, m) => s + m.interest, 0),
        totalPrepayment: months.reduce((s, m) => s + m.prepayment, 0),
        remainingBalance: lastMonth.remainingBalance,
      });
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">返済スケジュール</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode("yearly")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              viewMode === "yearly"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            年単位
          </button>
          <button
            type="button"
            onClick={() => setViewMode("monthly")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              viewMode === "monthly"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            月単位
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-black">
          <thead>
            <tr className="border-b-2 border-gray-200 text-left text-black">
              <th className="px-3 py-2">
                {viewMode === "monthly" ? "月" : "年"}
              </th>
              <th className="px-3 py-2">年齢</th>
              <th className="px-3 py-2 text-right">支払額</th>
              <th className="px-3 py-2 text-right">元金</th>
              <th className="px-3 py-2 text-right">利息</th>
              {hasPrepayments && (
                <th className="px-3 py-2 text-right">繰り上げ</th>
              )}
              <th className="px-3 py-2 text-right">残高</th>
            </tr>
          </thead>
          <tbody>
            {viewMode === "monthly"
              ? schedule.map((row) => (
                  <tr
                    key={row.month}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      row.prepayment > 0 ? "bg-green-50" : ""
                    }`}
                  >
                    <td className="px-3 py-2">{row.month}</td>
                    <td className="px-3 py-2">{row.age}歳</td>
                    <td className="px-3 py-2 text-right">
                      {formatYen(row.payment)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatYen(row.principal)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatYen(row.interest)}
                    </td>
                    {hasPrepayments && (
                      <td className="px-3 py-2 text-right text-green-600 font-medium">
                        {row.prepayment > 0 ? formatYen(row.prepayment) : "-"}
                      </td>
                    )}
                    <td className="px-3 py-2 text-right">
                      {formatYen(row.remainingBalance)}
                    </td>
                  </tr>
                ))
              : yearlyRows.map((row) => (
                  <tr
                    key={row.year}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      row.totalPrepayment > 0 ? "bg-green-50" : ""
                    }`}
                  >
                    <td className="px-3 py-2">{row.year}年目</td>
                    <td className="px-3 py-2">{row.age}歳</td>
                    <td className="px-3 py-2 text-right">
                      {formatYen(row.totalPayment)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatYen(row.totalPrincipal)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatYen(row.totalInterest)}
                    </td>
                    {hasPrepayments && (
                      <td className="px-3 py-2 text-right text-green-600 font-medium">
                        {row.totalPrepayment > 0
                          ? formatYen(row.totalPrepayment)
                          : "-"}
                      </td>
                    )}
                    <td className="px-3 py-2 text-right">
                      {formatYen(row.remainingBalance)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
