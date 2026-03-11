"use client";

import { useState } from "react";
import type { EducationPlan } from "./lib/education";
import type { Prepayment, RepaymentMethod } from "./lib/loan";
import {
  type Child,
  type LifePlanInput,
  type LifePlanResult,
  type Person,
  calculateLifePlan,
} from "./lib/lifeplan";
import { useLocalStorageState } from "./lib/useLocalStorageState";
import LoanCharts from "./components/LoanCharts";
import LoanTable from "./components/LoanTable";
import LifePlanCharts from "./components/LifePlanCharts";

const defaultPlan: EducationPlan = {
  kindergarten: "public",
  elementary: "public",
  juniorHigh: "public",
  highSchool: "public",
  university: "public",
};

const schoolOptions: {
  key: keyof EducationPlan;
  label: string;
  choices: { value: string; label: string }[];
}[] = [
  { key: "kindergarten", label: "幼稚園", choices: [{ value: "public", label: "公立" }, { value: "private", label: "私立" }] },
  { key: "elementary", label: "小学校", choices: [{ value: "public", label: "公立" }, { value: "private", label: "私立" }] },
  { key: "juniorHigh", label: "中学校", choices: [{ value: "public", label: "公立" }, { value: "private", label: "私立" }] },
  { key: "highSchool", label: "高校", choices: [{ value: "public", label: "公立" }, { value: "private", label: "私立" }] },
  { key: "university", label: "大学", choices: [{ value: "public", label: "国公立" }, { value: "private_arts", label: "私立文系" }, { value: "private_science", label: "私立理系" }, { value: "none", label: "進学しない" }] },
];

const TOTAL_STEPS = 7;

export default function Home() {
  const [step, setStep] = useState(0);

  // 基本情報（金額は万円単位で管理）
  const [person1, setPerson1] = useLocalStorageState<Person>("lp_person1", {
    age: 30, retirementAge: 65, monthlyIncome: 30, pensionMonthly: 15,
  });
  const [hasPartner, setHasPartner] = useLocalStorageState("lp_hasPartner", false);
  const [person2, setPerson2] = useLocalStorageState<Person>("lp_person2", {
    age: 28, retirementAge: 65, monthlyIncome: 25, pensionMonthly: 10,
  });
  const [lifeExpectancy, setLifeExpectancy] = useLocalStorageState("lp_lifeExpectancy", 90);
  const [monthlyLiving, setMonthlyLiving] = useLocalStorageState("lp_monthlyLiving", 20);

  // 住宅ローン（万円単位）
  const [hasLoan, setHasLoan] = useLocalStorageState("lp_hasLoan", true);
  const [loanAmount, setLoanAmount] = useLocalStorageState("lp_loanAmount", 3500);
  const [loanRate, setLoanRate] = useLocalStorageState("lp_loanRate", 1.5);
  const [loanYears, setLoanYears] = useLocalStorageState("lp_loanYears", 35);
  const [loanMethod, setLoanMethod] = useLocalStorageState<RepaymentMethod>("lp_loanMethod", "equal_installment");
  const [loanPrepayments, setLoanPrepayments] = useLocalStorageState<{ yearFromStart: number; amount: number; type: "shorten" | "reduce" }[]>("lp_loanPrepayments", []);

  // 教育
  const [hasChildren, setHasChildren] = useLocalStorageState("lp_hasChildren", false);
  const [children, setChildren] = useLocalStorageState<Child[]>("lp_children", []);

  // 老後（万円単位）
  const [currentSavings, setCurrentSavings] = useLocalStorageState("lp_currentSavings", 300);
  const [monthlySavings, setMonthlySavings] = useLocalStorageState("lp_monthlySavings", 3);
  const [annualReturn, setAnnualReturn] = useLocalStorageState("lp_annualReturn", 3.0);
  const [retirementMonthlyExpense, setRetirementMonthlyExpense] = useLocalStorageState("lp_retirementExpense", 25);

  const [result, setResult] = useState<LifePlanResult | null>(null);

  // 万円単位の表示（入力値用）
  const fmtMan = (v: number) => `${v.toLocaleString()}万円`;
  // 円単位の表示（計算結果用）
  const fmtYenToMan = (v: number) => `${(v / 10000).toFixed(0)}万円`;
  const fmtYen = (v: number) => `${v.toLocaleString()}円`;
  // 万円→円変換
  const toYen = (man: number) => man * 10000;

  const updatePerson1 = (field: keyof Person, value: number) => setPerson1({ ...person1, [field]: value });
  const updatePerson2 = (field: keyof Person, value: number) => setPerson2({ ...person2, [field]: value });

  const addChild = () => setChildren([...children, { name: `子ども${children.length + 1}`, age: 0, plan: { ...defaultPlan } }]);
  const removeChild = (i: number) => setChildren(children.filter((_, idx) => idx !== i));
  const updateChild = (i: number, field: keyof Child, value: string | number) => {
    const updated = [...children];
    if (field === "plan") return;
    updated[i] = { ...updated[i], [field]: field === "age" ? Number(value) : value };
    setChildren(updated);
  };
  const updateChildPlan = (i: number, key: keyof EducationPlan, value: string) => {
    const updated = [...children];
    updated[i] = { ...updated[i], plan: { ...updated[i].plan, [key]: value } };
    setChildren(updated);
  };

  const addPrepayment = () => setLoanPrepayments([...loanPrepayments, { yearFromStart: 5, amount: 100, type: "shorten" }]);
  const removePrepayment = (i: number) => setLoanPrepayments(loanPrepayments.filter((_, idx) => idx !== i));
  const updatePrepayment = (i: number, field: keyof Prepayment, value: string | number) => {
    const updated = [...loanPrepayments];
    if (field === "type") {
      updated[i] = { ...updated[i], type: value as Prepayment["type"] };
    } else {
      updated[i] = { ...updated[i], [field]: Number(value) };
    }
    setLoanPrepayments(updated);
  };

  const runSimulation = () => {
    const input: LifePlanInput = {
      person1: {
        ...person1,
        monthlyIncome: toYen(person1.monthlyIncome),
        pensionMonthly: toYen(person1.pensionMonthly),
      },
      hasPartner,
      person2: {
        ...person2,
        monthlyIncome: toYen(person2.monthlyIncome),
        pensionMonthly: toYen(person2.pensionMonthly),
      },
      lifeExpectancy,
      monthlyLiving: toYen(monthlyLiving),
      hasLoan,
      loanAmount: toYen(loanAmount),
      loanRate,
      loanYears,
      loanMethod,
      loanPrepayments: loanPrepayments.map((p) => ({
        ...p,
        amount: toYen(p.amount),
      })),
      children: hasChildren ? children : [],
      currentSavings: toYen(currentSavings),
      monthlySavings: toYen(monthlySavings),
      annualReturn,
      retirementMonthlyExpense: toYen(retirementMonthlyExpense),
    };
    setResult(calculateLifePlan(input));
    setStep(TOTAL_STEPS);
  };

  const next = () => {
    // 配偶者ステップをスキップ
    if (step === 0 && !hasPartner) {
      setStep(2);
    // 子ども詳細ステップをスキップ
    } else if (step === 3 && !hasChildren) {
      setStep(5);
    // ローン詳細ステップをスキップ
    } else if (step === 4 && !hasLoan) {
      setStep(6);
    } else if (step === TOTAL_STEPS - 1) {
      runSimulation();
    } else {
      setStep(step + 1);
    }
  };

  const prev = () => {
    if (step === TOTAL_STEPS) {
      setStep(TOTAL_STEPS - 1);
      return;
    }
    if (step === 2 && !hasPartner) {
      setStep(0);
    } else if (step === 5 && !hasChildren) {
      setStep(3);
    } else if (step === 6 && !hasLoan) {
      setStep(4);
    } else {
      setStep(step - 1);
    }
  };

  const inputCls = "w-full rounded-lg border border-gray-300 px-4 py-3 text-black text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none";
  const btnPrimary = "rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow transition hover:bg-blue-700";
  const btnSecondary = "rounded-lg border border-gray-300 px-8 py-3 font-semibold text-gray-700 transition hover:bg-gray-100";

  // 質問カードのラッパー
  const QuestionCard = ({ question, sub, children: content }: { question: string; sub?: string; children: React.ReactNode }) => (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">{question}</h2>
        {sub && <p className="mb-6 text-sm text-gray-500">{sub}</p>}
        {!sub && <div className="mb-6" />}
        {content}
      </div>
    </div>
  );

  const NumberInput = ({ label, value, onChange, step: s, min, max, suffix }: {
    label: string; value: number; onChange: (v: number) => void;
    step?: number; min?: number; max?: number; suffix?: string;
  }) => (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-gray-600">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className={inputCls} step={s} min={min} max={max} />
      {suffix && <p className="mt-1 text-xs text-gray-400">{suffix}</p>}
    </div>
  );

  const YesNo = ({ value, onChange, yesLabel, noLabel }: {
    value: boolean; onChange: (v: boolean) => void; yesLabel?: string; noLabel?: string;
  }) => (
    <div className="flex gap-3">
      <button type="button" onClick={() => onChange(true)}
        className={`flex-1 rounded-lg border-2 py-4 text-center font-semibold transition ${value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
      >{yesLabel ?? "はい"}</button>
      <button type="button" onClick={() => onChange(false)}
        className={`flex-1 rounded-lg border-2 py-4 text-center font-semibold transition ${!value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
      >{noLabel ?? "いいえ"}</button>
    </div>
  );

  const progress = step < TOTAL_STEPS ? Math.round((step / TOTAL_STEPS) * 100) : 100;

  const renderStep = () => {
    switch (step) {
      // Step 0: あなたについて
      case 0:
        return (
          <QuestionCard question="まずはあなたについて教えてください">
            <div className="grid grid-cols-2 gap-4">
              <NumberInput label="現在の年齢" value={person1.age} onChange={(v) => updatePerson1("age", v)} min={18} max={80} />
              <NumberInput label="退職予定年齢" value={person1.retirementAge} onChange={(v) => updatePerson1("retirementAge", v)} min={50} max={80} />
              <NumberInput label="月収・手取り（万円）" value={person1.monthlyIncome} onChange={(v) => updatePerson1("monthlyIncome", v)} step={1} min={0} suffix={fmtMan(person1.monthlyIncome)} />
              <NumberInput label="将来の年金月額（万円）" value={person1.pensionMonthly} onChange={(v) => updatePerson1("pensionMonthly", v)} step={1} min={0} suffix={fmtMan(person1.pensionMonthly)} />
            </div>
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-600">配偶者はいますか？</p>
              <YesNo value={hasPartner} onChange={setHasPartner} />
            </div>
          </QuestionCard>
        );

      // Step 1: 配偶者について
      case 1:
        return (
          <QuestionCard question="配偶者について教えてください">
            <div className="grid grid-cols-2 gap-4">
              <NumberInput label="現在の年齢" value={person2.age} onChange={(v) => updatePerson2("age", v)} min={18} max={80} />
              <NumberInput label="退職予定年齢" value={person2.retirementAge} onChange={(v) => updatePerson2("retirementAge", v)} min={50} max={80} />
              <NumberInput label="月収・手取り（万円）" value={person2.monthlyIncome} onChange={(v) => updatePerson2("monthlyIncome", v)} step={1} min={0} suffix={fmtMan(person2.monthlyIncome)} />
              <NumberInput label="将来の年金月額（万円）" value={person2.pensionMonthly} onChange={(v) => updatePerson2("pensionMonthly", v)} step={1} min={0} suffix={fmtMan(person2.pensionMonthly)} />
            </div>
          </QuestionCard>
        );

      // Step 2: 世帯の生活費
      case 2:
        return (
          <QuestionCard question="世帯の生活について教えてください">
            <NumberInput label="世帯の月間生活費（万円）" value={monthlyLiving} onChange={setMonthlyLiving} step={1} min={0} suffix={fmtMan(monthlyLiving)} />
            <NumberInput label="想定寿命" value={lifeExpectancy} onChange={setLifeExpectancy} min={70} max={110} />
          </QuestionCard>
        );

      // Step 3: 子どもの有無
      case 3:
        return (
          <QuestionCard question="お子さんはいますか？（予定含む）">
            <YesNo value={hasChildren} onChange={(v) => {
              setHasChildren(v);
              if (v && children.length === 0) addChild();
            }} />
            {hasChildren && children.length > 0 && (
              <div className="mt-6 space-y-4">
                {children.map((child, i) => (
                  <div key={`child-${i}-${child.name}`} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <input type="text" value={child.name} onChange={(e) => updateChild(i, "name", e.target.value)}
                        className="rounded border border-gray-300 px-3 py-1 text-sm text-black font-medium w-32" />
                      <button type="button" onClick={() => {
                        removeChild(i);
                        if (children.length <= 1) setHasChildren(false);
                      }} className="text-sm text-red-500 hover:text-red-700">削除</button>
                    </div>
                    <div className="mb-3">
                      <NumberInput label="年齢" value={child.age} onChange={(v) => updateChild(i, "age", v)} min={0} max={22} />
                    </div>
                    <p className="mb-2 text-xs font-medium text-gray-500">進学プラン</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                      {schoolOptions.map((opt) => (
                        <div key={opt.key}>
                          <label className="mb-1 block text-xs text-gray-500">{opt.label}</label>
                          <select value={child.plan[opt.key]} onChange={(e) => updateChildPlan(i, opt.key, e.target.value)}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs text-black">
                            {opt.choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addChild} className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition">
                  + もう1人追加
                </button>
              </div>
            )}
          </QuestionCard>
        );

      // Step 4: 住宅ローン
      case 4:
        return (
          <QuestionCard question="住宅ローンはありますか？">
            <YesNo value={hasLoan} onChange={setHasLoan} yesLabel="ローンあり" noLabel="ローンなし" />
            {hasLoan && (
              <div className="mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label="借入額（万円）" value={loanAmount} onChange={setLoanAmount} step={100} min={0} suffix={fmtMan(loanAmount)} />
                  <NumberInput label="金利（年利 %）" value={loanRate} onChange={setLoanRate} step={0.01} min={0} max={20} />
                  <NumberInput label="返済期間（年）" value={loanYears} onChange={setLoanYears} min={1} max={50} />
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-gray-600">返済方式</label>
                    <select value={loanMethod} onChange={(e) => setLoanMethod(e.target.value as RepaymentMethod)} className={inputCls}>
                      <option value="equal_installment">元利均等返済</option>
                      <option value="equal_principal">元金均等返済</option>
                    </select>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">繰り上げ返済</p>
                    <button type="button" onClick={addPrepayment} className="text-sm text-blue-600 hover:text-blue-800">+ 追加</button>
                  </div>
                  {loanPrepayments.map((p, i) => (
                    <div key={`pp-${i}-${p.yearFromStart}`} className="mb-2 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">年数</label>
                        <input type="number" value={p.yearFromStart} onChange={(e) => updatePrepayment(i, "yearFromStart", e.target.value)} className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm text-black" min={1} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">金額（万円）</label>
                        <input type="number" value={p.amount} onChange={(e) => updatePrepayment(i, "amount", e.target.value)} className="w-36 rounded border border-gray-300 px-2 py-1.5 text-sm text-black" min={0} step={10} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">タイプ</label>
                        <select value={p.type} onChange={(e) => updatePrepayment(i, "type", e.target.value)} className="rounded border border-gray-300 px-2 py-1.5 text-sm text-black">
                          <option value="shorten">期間短縮型</option>
                          <option value="reduce">返済額軽減型</option>
                        </select>
                      </div>
                      <button type="button" onClick={() => removePrepayment(i)} className="text-sm text-red-500 hover:text-red-700">削除</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </QuestionCard>
        );

      // Step 5: 貯蓄・資産運用
      case 5:
        return (
          <QuestionCard question="貯蓄と資産運用について教えてください">
            <div className="grid grid-cols-2 gap-4">
              <NumberInput label="現在の貯蓄額（万円）" value={currentSavings} onChange={setCurrentSavings} step={10} min={0} suffix={fmtMan(currentSavings)} />
              <NumberInput label="毎月の積立額（万円）" value={monthlySavings} onChange={setMonthlySavings} step={1} min={0} suffix={fmtMan(monthlySavings)} />
            </div>
            <NumberInput label="想定運用利回り（%）" value={annualReturn} onChange={setAnnualReturn} step={0.1} min={0} max={15} />
          </QuestionCard>
        );

      // Step 6: 老後の生活費
      case 6:
        return (
          <QuestionCard question="老後の生活費はどのくらいを想定していますか？" sub="年金以外に必要な月々の生活費を入力してください">
            <NumberInput label="老後の月間生活費（万円）" value={retirementMonthlyExpense} onChange={setRetirementMonthlyExpense} step={1} min={0} suffix={fmtMan(retirementMonthlyExpense)} />
          </QuestionCard>
        );

      default:
        return null;
    }
  };

  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "総合ライフプラン" },
    ...(result?.loanResult ? [{ id: "loan", label: "住宅ローン" }] : []),
    ...(result?.educationSummary.yearlyDetails.length ? [{ id: "education", label: "教育費" }] : []),
    { id: "yearly", label: "年別一覧" },
  ];

  const TabBar = () => (
    <div className="mb-8 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeTab === tab.id
              ? "bg-white text-gray-800 shadow"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  // 結果画面
  if (step === TOTAL_STEPS && result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800">OpenMoney</h1>
            <p className="mt-2 text-gray-600">あなたのライフプラン</p>
          </div>

          <div className="mb-6 text-center">
            <button type="button" onClick={prev} className={btnSecondary}>
              入力内容を修正する
            </button>
          </div>

          {/* サマリー */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow-md text-center">
              <p className="text-sm text-gray-500">住宅ローン総額</p>
              <p className="text-2xl font-bold text-blue-600">{fmtYenToMan(result.totalLoanPayment)}</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-md text-center">
              <p className="text-sm text-gray-500">教育費総額</p>
              <p className="text-2xl font-bold text-green-600">{fmtYenToMan(result.totalEducationCost)}</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-md text-center">
              <p className="text-sm text-gray-500">退職時の資産</p>
              <p className="text-2xl font-bold text-purple-600">{fmtYenToMan(result.balanceAtRetirement)}</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-md text-center">
              <p className="text-sm text-gray-500">資産寿命</p>
              <p className={`text-2xl font-bold ${result.assetDepletionAge === null ? "text-green-600" : "text-red-500"}`}>
                {result.assetDepletionAge === null ? `${lifeExpectancy}歳まで安心` : `${result.assetDepletionAge}歳で枯渇`}
              </p>
            </div>
          </div>

          <TabBar />

          {/* 総合ライフプラン */}
          {activeTab === "overview" && (
            <LifePlanCharts schedule={result.schedule} retirementAge={person1.retirementAge} />
          )}

          {/* 住宅ローン */}
          {activeTab === "loan" && result.loanResult && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-6 shadow-md text-center">
                  <p className="text-sm text-gray-500">{loanMethod === "equal_principal" ? "初回の支払額" : "月々の支払額"}</p>
                  <p className="text-2xl font-bold text-blue-600">{fmtYen(result.loanResult.monthlyPayment)}</p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-md text-center">
                  <p className="text-sm text-gray-500">総支払額</p>
                  <p className="text-2xl font-bold text-gray-800">{fmtYen(result.loanResult.totalPayment)}</p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-md text-center">
                  <p className="text-sm text-gray-500">利息合計</p>
                  <p className="text-2xl font-bold text-red-500">{fmtYen(result.loanResult.totalInterest)}</p>
                </div>
              </div>
              <LoanCharts result={result.loanResult} />
              <LoanTable schedule={result.loanResult.schedule} />
            </div>
          )}

          {/* 教育費 */}
          {activeTab === "education" && result.educationSummary.yearlyDetails.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-bold text-gray-800">教育費の詳細</h2>
              {result.educationSummary.perChildTotal.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-4">
                  {result.educationSummary.perChildTotal.map((child) => (
                    <div key={child.name} className="rounded-lg border border-green-200 bg-green-50 px-5 py-3 text-center">
                      <p className="text-sm text-gray-600">{child.name}</p>
                      <p className="text-lg font-bold text-green-700">{fmtYenToMan(child.total)}</p>
                    </div>
                  ))}
                  {result.educationSummary.perChildTotal.length > 1 && (
                    <div className="rounded-lg border border-green-300 bg-green-100 px-5 py-3 text-center">
                      <p className="text-sm text-gray-600">合計</p>
                      <p className="text-lg font-bold text-green-800">{fmtYenToMan(result.educationSummary.grandTotal)}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-black">
                  <thead>
                    <tr className="border-b-2 border-gray-200 text-left text-black">
                      <th className="px-3 py-2">あなたの年齢</th>
                      <th className="px-3 py-2">子ども</th>
                      <th className="px-3 py-2">年齢</th>
                      <th className="px-3 py-2">学校</th>
                      <th className="px-3 py-2">種別</th>
                      <th className="px-3 py-2 text-right">年間費用</th>
                      <th className="px-3 py-2 text-right">年合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.educationSummary.yearlyDetails.map((year) =>
                      year.children.map((child, ci) => (
                        <tr key={`${year.parentAge}-${child.childName}`} className="border-b border-gray-100 hover:bg-gray-50">
                          {ci === 0 && <td className="px-3 py-2 font-medium" rowSpan={year.children.length}>{year.parentAge}歳</td>}
                          <td className="px-3 py-2">{child.childName}</td>
                          <td className="px-3 py-2">{child.childAge}歳</td>
                          <td className="px-3 py-2">{child.stage}</td>
                          <td className="px-3 py-2">{child.schoolType}</td>
                          <td className="px-3 py-2 text-right">{fmtYenToMan(child.cost)}</td>
                          {ci === 0 && <td className="px-3 py-2 text-right font-bold text-green-700" rowSpan={year.children.length}>{fmtYenToMan(year.totalCost)}</td>}
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 年別一覧 */}
          {activeTab === "yearly" && (
            <div className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-bold text-gray-800">年別ライフプラン</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-black">
                  <thead>
                    <tr className="border-b-2 border-gray-200 text-left text-black">
                      <th className="px-3 py-2">年齢</th>
                      <th className="px-3 py-2">区分</th>
                      <th className="px-3 py-2 text-right">年収入</th>
                      <th className="px-3 py-2 text-right">生活費</th>
                      <th className="px-3 py-2 text-right">住宅ローン</th>
                      <th className="px-3 py-2 text-right">教育費</th>
                      <th className="px-3 py-2 text-right">年間収支</th>
                      <th className="px-3 py-2 text-right">資産残高</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.schedule.map((row) => (
                      <tr key={row.age} className={`border-b border-gray-100 hover:bg-gray-50 ${row.age === person1.retirementAge ? "bg-purple-50" : ""} ${row.balance < 0 ? "bg-red-50" : ""}`}>
                        <td className="px-3 py-2">{row.age}歳</td>
                        <td className="px-3 py-2">{row.phase}</td>
                        <td className="px-3 py-2 text-right">{fmtYenToMan(row.income)}</td>
                        <td className="px-3 py-2 text-right">{fmtYenToMan(row.livingCost)}</td>
                        <td className="px-3 py-2 text-right">{row.loanPayment > 0 ? fmtYenToMan(row.loanPayment) : "-"}</td>
                        <td className="px-3 py-2 text-right">{row.educationCost > 0 ? fmtYenToMan(row.educationCost) : "-"}</td>
                        <td className={`px-3 py-2 text-right font-medium ${row.savings >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {row.savings >= 0 ? "+" : ""}{fmtYenToMan(row.savings)}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${row.balance >= 0 ? "" : "text-red-500"}`}>
                          {fmtYenToMan(row.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 質問画面
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex-1 flex flex-col justify-center py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800">OpenMoney</h1>
          <p className="mt-2 text-sm text-gray-500">ライフプランシミュレーター</p>
        </div>

        {/* プログレスバー */}
        <div className="mx-auto mb-8 w-full max-w-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">ステップ {step + 1} / {TOTAL_STEPS}</span>
            <span className="text-xs text-gray-500">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div className="h-2 rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {renderStep()}

        {/* ナビゲーションボタン */}
        <div className="mx-auto mt-8 flex w-full max-w-2xl justify-between">
          {step > 0 ? (
            <button type="button" onClick={prev} className={btnSecondary}>戻る</button>
          ) : <div />}
          <button type="button" onClick={next} className={btnPrimary}>
            {step === TOTAL_STEPS - 1 ? "結果を見る" : "次へ"}
          </button>
        </div>
      </div>
    </div>
  );
}
