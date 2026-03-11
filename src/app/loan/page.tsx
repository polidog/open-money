"use client";

import Link from "next/link";
import { useState } from "react";
import {
  type LoanResult,
  type Prepayment,
  type RepaymentMethod,
  calculateLoan,
} from "../lib/loan";
import { useLocalStorageState } from "../lib/useLocalStorageState";
import LoanCharts from "../components/LoanCharts";
import LoanTable from "../components/LoanTable";

export default function Home() {
  const [loanAmount, setLoanAmount] = useLocalStorageState("loan_amount", 35000000);
  const [annualRate, setAnnualRate] = useLocalStorageState("loan_rate", 1.5);
  const [years, setYears] = useLocalStorageState("loan_years", 35);
  const [age, setAge] = useLocalStorageState("loan_age", 30);
  const [method, setMethod] = useLocalStorageState<RepaymentMethod>("loan_method", "equal_installment");
  const [prepayments, setPrepayments] = useLocalStorageState<Prepayment[]>("loan_prepayments", []);
  const [result, setResult] = useState<LoanResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = calculateLoan(
      loanAmount,
      annualRate,
      years,
      age,
      method,
      prepayments,
    );
    setResult(r);
  };

  const formatYen = (value: number) => `${value.toLocaleString()}円`;

  const addPrepayment = () => {
    setPrepayments([
      ...prepayments,
      { yearFromStart: 5, amount: 1000000, type: "shorten" },
    ]);
  };

  const removePrepayment = (index: number) => {
    setPrepayments(prepayments.filter((_, i) => i !== index));
  };

  const updatePrepayment = (index: number, field: keyof Prepayment, value: string | number) => {
    const updated = [...prepayments];
    if (field === "type") {
      updated[index] = { ...updated[index], type: value as Prepayment["type"] };
    } else {
      updated[index] = { ...updated[index], [field]: Number(value) };
    }
    setPrepayments(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            &larr; OpenMoney トップへ
          </Link>
        </div>
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-800">
          住宅ローンシミュレーター
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl bg-white p-6 shadow-md"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="loanAmount"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                借入額（円）
              </label>
              <input
                id="loanAmount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                min={0}
                step={1000000}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formatYen(loanAmount)}
              </p>
            </div>
            <div>
              <label
                htmlFor="annualRate"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                金利（年利 %）
              </label>
              <input
                id="annualRate"
                type="number"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                min={0}
                max={20}
                step={0.01}
              />
            </div>
            <div>
              <label
                htmlFor="years"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                支払い期間（年）
              </label>
              <input
                id="years"
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                min={1}
                max={50}
              />
            </div>
            <div>
              <label
                htmlFor="age"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                現在の年齢
              </label>
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                min={18}
                max={80}
              />
            </div>
          </div>
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-gray-700">
              返済方式
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-black cursor-pointer">
                <input
                  type="radio"
                  name="method"
                  value="equal_installment"
                  checked={method === "equal_installment"}
                  onChange={() => setMethod("equal_installment")}
                  className="accent-blue-600"
                />
                元利均等返済
              </label>
              <label className="flex items-center gap-2 text-sm text-black cursor-pointer">
                <input
                  type="radio"
                  name="method"
                  value="equal_principal"
                  checked={method === "equal_principal"}
                  onChange={() => setMethod("equal_principal")}
                  className="accent-blue-600"
                />
                元金均等返済
              </label>
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">繰り上げ返済</p>
              <button
                type="button"
                onClick={addPrepayment}
                className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white shadow transition hover:bg-green-700"
              >
                + 追加
              </button>
            </div>
            {prepayments.length > 0 && (
              <div className="space-y-3">
                {prepayments.map((p, i) => (
                  <div
                    key={`prepayment-${i}-${p.yearFromStart}`}
                    className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">
                        返済開始からの年数
                      </label>
                      <input
                        type="number"
                        value={p.yearFromStart}
                        onChange={(e) =>
                          updatePrepayment(i, "yearFromStart", e.target.value)
                        }
                        className="w-24 rounded border border-gray-300 px-3 py-1.5 text-sm text-black"
                        min={1}
                        max={years}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">
                        繰り上げ額（円）
                      </label>
                      <input
                        type="number"
                        value={p.amount}
                        onChange={(e) =>
                          updatePrepayment(i, "amount", e.target.value)
                        }
                        className="w-40 rounded border border-gray-300 px-3 py-1.5 text-sm text-black"
                        min={0}
                        step={100000}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">
                        タイプ
                      </label>
                      <select
                        value={p.type}
                        onChange={(e) =>
                          updatePrepayment(i, "type", e.target.value)
                        }
                        className="rounded border border-gray-300 px-3 py-1.5 text-sm text-black"
                      >
                        <option value="shorten">期間短縮型</option>
                        <option value="reduce">返済額軽減型</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePrepayment(i)}
                      className="rounded bg-red-100 px-3 py-1.5 text-sm text-red-600 hover:bg-red-200"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-6 text-center">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            >
              シミュレーション実行
            </button>
          </div>
        </form>

        {result && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-6 shadow-md text-center">
                <p className="text-sm text-gray-500">
                  {method === "equal_principal"
                    ? "初回の支払額"
                    : "月々の支払額"}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatYen(result.monthlyPayment)}
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-md text-center">
                <p className="text-sm text-gray-500">総支払額</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatYen(result.totalPayment)}
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-md text-center">
                <p className="text-sm text-gray-500">利息合計</p>
                <p className="text-2xl font-bold text-red-500">
                  {formatYen(result.totalInterest)}
                </p>
              </div>
            </div>

            <LoanCharts result={result} />
            <LoanTable schedule={result.schedule} />
          </>
        )}
      </div>
    </div>
  );
}
