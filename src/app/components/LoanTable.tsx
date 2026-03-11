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
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium tracking-tight text-neutral-900">返済スケジュール</h3>
          <p className="mt-1 text-xs uppercase tracking-widest text-neutral-400">Repayment Schedule</p>
        </div>
        <div className="flex">
          <button
            type="button"
            onClick={() => setViewMode("yearly")}
            className={`px-5 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
              viewMode === "yearly"
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-400 hover:text-neutral-900"
            }`}
          >
            年単位
          </button>
          <button
            type="button"
            onClick={() => setViewMode("monthly")}
            className={`px-5 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
              viewMode === "monthly"
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-400 hover:text-neutral-900"
            }`}
          >
            月単位
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-900 text-left">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
                {viewMode === "monthly" ? "月" : "年"}
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-neutral-400">年齢</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-neutral-400 text-right">支払額</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-neutral-400 text-right">元金</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-neutral-400 text-right">利息</th>
              {hasPrepayments && (
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-neutral-400 text-right">繰り上げ</th>
              )}
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-neutral-400 text-right">残高</th>
            </tr>
          </thead>
          <tbody>
            {viewMode === "monthly"
              ? schedule.map((row) => (
                  <tr
                    key={row.month}
                    className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                      row.prepayment > 0 ? "bg-neutral-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-neutral-600">{row.month}</td>
                    <td className="px-4 py-3 text-neutral-600">{row.age}歳</td>
                    <td className="px-4 py-3 text-right text-neutral-900">{formatYen(row.payment)}</td>
                    <td className="px-4 py-3 text-right text-neutral-600">{formatYen(row.principal)}</td>
                    <td className="px-4 py-3 text-right text-neutral-400">{formatYen(row.interest)}</td>
                    {hasPrepayments && (
                      <td className="px-4 py-3 text-right font-medium text-neutral-900">
                        {row.prepayment > 0 ? formatYen(row.prepayment) : "-"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right font-medium text-neutral-900">{formatYen(row.remainingBalance)}</td>
                  </tr>
                ))
              : yearlyRows.map((row) => (
                  <tr
                    key={row.year}
                    className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                      row.totalPrepayment > 0 ? "bg-neutral-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-neutral-600">{row.year}年目</td>
                    <td className="px-4 py-3 text-neutral-600">{row.age}歳</td>
                    <td className="px-4 py-3 text-right text-neutral-900">{formatYen(row.totalPayment)}</td>
                    <td className="px-4 py-3 text-right text-neutral-600">{formatYen(row.totalPrincipal)}</td>
                    <td className="px-4 py-3 text-right text-neutral-400">{formatYen(row.totalInterest)}</td>
                    {hasPrepayments && (
                      <td className="px-4 py-3 text-right font-medium text-neutral-900">
                        {row.totalPrepayment > 0 ? formatYen(row.totalPrepayment) : "-"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right font-medium text-neutral-900">{formatYen(row.remainingBalance)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
