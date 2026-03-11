"use client";

import { useState, useEffect } from "react";
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
import {
  type MinimumIncomeResult,
  calculateMinimumIncome,
} from "./lib/reverse-income";
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
  {
    key: "kindergarten",
    label: "幼稚園",
    choices: [
      { value: "public", label: "公立" },
      { value: "private", label: "私立" },
    ],
  },
  {
    key: "elementary",
    label: "小学校",
    choices: [
      { value: "public", label: "公立" },
      { value: "private", label: "私立" },
    ],
  },
  {
    key: "juniorHigh",
    label: "中学校",
    choices: [
      { value: "public", label: "公立" },
      { value: "private", label: "私立" },
    ],
  },
  {
    key: "highSchool",
    label: "高校",
    choices: [
      { value: "public", label: "公立" },
      { value: "private", label: "私立" },
    ],
  },
  {
    key: "university",
    label: "大学",
    choices: [
      { value: "public", label: "国公立" },
      { value: "private_arts", label: "私立文系" },
      { value: "private_science", label: "私立理系" },
      { value: "none", label: "進学しない" },
    ],
  },
];

const TOTAL_STEPS = 7;

type ModelCase = {
  name: string;
  description: string;
  person1: Person;
  hasPartner: boolean;
  person2: Person;
  lifeExpectancy: number;
  monthlyLiving: number;
  hasLoan: boolean;
  loanAmount: number;
  loanRate: number;
  loanYears: number;
  loanStartAge: number;
  loanMethod: RepaymentMethod;
  loanPrepayments: {
    yearFromStart: number;
    amount: number;
    type: "shorten" | "reduce";
  }[];
  hasChildren: boolean;
  children: Child[];
  currentSavings: number;
  monthlySavings: number;
  annualReturn: number;
  retirementMonthlyExpense: number;
  inflationRate: number;
};

const modelCases: ModelCase[] = [
  {
    name: "共働き夫婦+子ども2人",
    description:
      "30代共働き夫婦。子ども2人、住宅ローンあり。典型的なファミリー世帯。",
    person1: {
      age: 35,
      retirementAge: 65,
      monthlyIncome: 30,
      pensionMonthly: 15,
    },
    hasPartner: true,
    person2: {
      age: 33,
      retirementAge: 65,
      monthlyIncome: 20,
      pensionMonthly: 10,
    },
    lifeExpectancy: 90,
    monthlyLiving: 28,
    hasLoan: true,
    loanAmount: 4500,
    loanRate: 1.2,
    loanYears: 35,
    loanStartAge: 33,
    loanMethod: "equal_installment",
    loanPrepayments: [],
    hasChildren: true,
    children: [
      {
        name: "第1子",
        age: 7,
        plan: {
          kindergarten: "public",
          elementary: "public",
          juniorHigh: "public",
          highSchool: "public",
          university: "public",
        },
      },
      {
        name: "第2子",
        age: 3,
        plan: {
          kindergarten: "public",
          elementary: "public",
          juniorHigh: "public",
          highSchool: "public",
          university: "private_arts",
        },
      },
    ],
    currentSavings: 500,
    monthlySavings: 5,
    annualReturn: 3.0,
    retirementMonthlyExpense: 25,
    inflationRate: 1.0,
  },
  {
    name: "DINKS",
    description:
      "30代共働き夫婦。子どもなし。収入に余裕があり、積極的に資産運用。",
    person1: {
      age: 32,
      retirementAge: 65,
      monthlyIncome: 35,
      pensionMonthly: 16,
    },
    hasPartner: true,
    person2: {
      age: 30,
      retirementAge: 65,
      monthlyIncome: 30,
      pensionMonthly: 13,
    },
    lifeExpectancy: 90,
    monthlyLiving: 25,
    hasLoan: true,
    loanAmount: 5000,
    loanRate: 1.0,
    loanYears: 35,
    loanStartAge: 32,
    loanMethod: "equal_installment",
    loanPrepayments: [{ yearFromStart: 10, amount: 500, type: "shorten" }],
    hasChildren: false,
    children: [],
    currentSavings: 800,
    monthlySavings: 10,
    annualReturn: 4.0,
    retirementMonthlyExpense: 28,
    inflationRate: 1.0,
  },
  {
    name: "独身会社員",
    description:
      "30歳独身。マンション購入済み。堅実に貯蓄しながら老後に備える。",
    person1: {
      age: 30,
      retirementAge: 65,
      monthlyIncome: 28,
      pensionMonthly: 14,
    },
    hasPartner: false,
    person2: {
      age: 28,
      retirementAge: 65,
      monthlyIncome: 0,
      pensionMonthly: 0,
    },
    lifeExpectancy: 90,
    monthlyLiving: 15,
    hasLoan: true,
    loanAmount: 3000,
    loanRate: 1.5,
    loanYears: 35,
    loanStartAge: 30,
    loanMethod: "equal_installment",
    loanPrepayments: [],
    hasChildren: false,
    children: [],
    currentSavings: 400,
    monthlySavings: 5,
    annualReturn: 3.0,
    retirementMonthlyExpense: 18,
    inflationRate: 1.0,
  },
  {
    name: "片働き夫婦+子ども1人",
    description: "40代片働き世帯。子ども1人。教育費のピークに備える。",
    person1: {
      age: 42,
      retirementAge: 65,
      monthlyIncome: 40,
      pensionMonthly: 18,
    },
    hasPartner: true,
    person2: {
      age: 40,
      retirementAge: 65,
      monthlyIncome: 0,
      pensionMonthly: 6,
    },
    lifeExpectancy: 90,
    monthlyLiving: 25,
    hasLoan: true,
    loanAmount: 4000,
    loanRate: 1.3,
    loanYears: 35,
    loanStartAge: 35,
    loanMethod: "equal_installment",
    loanPrepayments: [],
    hasChildren: true,
    children: [
      {
        name: "子ども",
        age: 13,
        plan: {
          kindergarten: "public",
          elementary: "public",
          juniorHigh: "public",
          highSchool: "private",
          university: "private_science",
        },
      },
    ],
    currentSavings: 1000,
    monthlySavings: 5,
    annualReturn: 3.0,
    retirementMonthlyExpense: 22,
    inflationRate: 1.0,
  },
  {
    name: "退職間近の夫婦",
    description:
      "55歳夫婦。子どもは独立済み。ローン残りわずか。老後資金の最終確認。",
    person1: {
      age: 55,
      retirementAge: 65,
      monthlyIncome: 45,
      pensionMonthly: 18,
    },
    hasPartner: true,
    person2: {
      age: 53,
      retirementAge: 60,
      monthlyIncome: 15,
      pensionMonthly: 8,
    },
    lifeExpectancy: 90,
    monthlyLiving: 30,
    hasLoan: true,
    loanAmount: 3500,
    loanRate: 1.8,
    loanYears: 30,
    loanStartAge: 35,
    loanMethod: "equal_installment",
    loanPrepayments: [],
    hasChildren: false,
    children: [],
    currentSavings: 2500,
    monthlySavings: 8,
    annualReturn: 2.0,
    retirementMonthlyExpense: 25,
    inflationRate: 1.0,
  },
];

type ShareData = {
  p1: Person;
  hp: boolean;
  p2: Person;
  le: number;
  ml: number;
  hl: boolean;
  la: number;
  lr: number;
  ly: number;
  lsa: number;
  lm: RepaymentMethod;
  lpp: { y: number; a: number; t: "shorten" | "reduce" }[];
  hc: boolean;
  ch: Child[];
  cs: number;
  ms: number;
  ar: number;
  re: number;
  ir?: number;
};

function encodeShareData(d: ShareData): string {
  const json = JSON.stringify(d);
  return btoa(unescape(encodeURIComponent(json)));
}

function decodeShareData(hash: string): ShareData | null {
  try {
    const json = decodeURIComponent(escape(atob(hash)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const inputCls =
  "w-full border-b border-neutral-300 bg-transparent px-0 py-3 text-base text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none transition-colors";
const selectCls =
  "w-full border-b border-neutral-300 bg-transparent px-0 py-3 text-base text-neutral-900 focus:border-neutral-900 focus:outline-none transition-colors appearance-none cursor-pointer";

function QuestionCard({
  question,
  sub,
  children: content,
}: {
  question: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="py-8">
        <h2 className="mb-2 text-3xl font-medium tracking-tight text-neutral-900">
          {question}
        </h2>
        {sub && <p className="mb-8 text-sm text-neutral-500">{sub}</p>}
        {!sub && <div className="mb-8" />}
        {content}
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  step: s,
  min,
  max,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div className="mb-6">
      <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-neutral-500">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputCls}
        step={s}
        min={min}
        max={max}
      />
      {suffix && <p className="mt-1 text-xs text-neutral-400">{suffix}</p>}
    </div>
  );
}

function YesNo({
  value,
  onChange,
  yesLabel,
  noLabel,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 border py-4 text-center text-sm font-medium uppercase tracking-wider transition-all ${value ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-500 hover:border-neutral-400"}`}
      >
        {yesLabel ?? "はい"}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 border py-4 text-center text-sm font-medium uppercase tracking-wider transition-all ${!value ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-500 hover:border-neutral-400"}`}
      >
        {noLabel ?? "いいえ"}
      </button>
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState(-1);

  const [person1, setPerson1] = useLocalStorageState<Person>("lp_person1", {
    age: 30,
    retirementAge: 65,
    monthlyIncome: 30,
    pensionMonthly: 15,
  });
  const [hasPartner, setHasPartner] = useLocalStorageState(
    "lp_hasPartner",
    false,
  );
  const [person2, setPerson2] = useLocalStorageState<Person>("lp_person2", {
    age: 28,
    retirementAge: 65,
    monthlyIncome: 25,
    pensionMonthly: 10,
  });
  const [lifeExpectancy, setLifeExpectancy] = useLocalStorageState(
    "lp_lifeExpectancy",
    90,
  );
  const [monthlyLiving, setMonthlyLiving] = useLocalStorageState(
    "lp_monthlyLiving",
    20,
  );

  const [hasLoan, setHasLoan] = useLocalStorageState("lp_hasLoan", true);
  const [loanAmount, setLoanAmount] = useLocalStorageState(
    "lp_loanAmount",
    3500,
  );
  const [loanRate, setLoanRate] = useLocalStorageState("lp_loanRate", 1.5);
  const [loanYears, setLoanYears] = useLocalStorageState("lp_loanYears", 35);
  const [loanStartAge, setLoanStartAge] = useLocalStorageState(
    "lp_loanStartAge",
    30,
  );
  const [loanMethod, setLoanMethod] = useLocalStorageState<RepaymentMethod>(
    "lp_loanMethod",
    "equal_installment",
  );
  const [loanPrepayments, setLoanPrepayments] = useLocalStorageState<
    { yearFromStart: number; amount: number; type: "shorten" | "reduce" }[]
  >("lp_loanPrepayments", []);

  const [hasChildren, setHasChildren] = useLocalStorageState(
    "lp_hasChildren",
    false,
  );
  const [children, setChildren] = useLocalStorageState<Child[]>(
    "lp_children",
    [],
  );

  const [currentSavings, setCurrentSavings] = useLocalStorageState(
    "lp_currentSavings",
    300,
  );
  const [monthlySavings, setMonthlySavings] = useLocalStorageState(
    "lp_monthlySavings",
    3,
  );
  const [annualReturn, setAnnualReturn] = useLocalStorageState(
    "lp_annualReturn",
    3.0,
  );
  const [retirementMonthlyExpense, setRetirementMonthlyExpense] =
    useLocalStorageState("lp_retirementExpense", 25);
  const [inflationRate, setInflationRate] = useLocalStorageState(
    "lp_inflationRate",
    1.0,
  );

  const [result, setResult] = useState<LifePlanResult | null>(null);
  const [resultNoInflation, setResultNoInflation] =
    useState<LifePlanResult | null>(null);
  const [minimumIncome, setMinimumIncome] =
    useState<MinimumIncomeResult | null>(null);
  const [hasPreviousSession, setHasPreviousSession] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHasPreviousSession(localStorage.getItem("lp_person1") !== null);

    // Restore from URL hash
    const hash = window.location.hash.slice(1);
    if (hash) {
      const data = decodeShareData(hash);
      if (data) {
        setPerson1(data.p1);
        setHasPartner(data.hp);
        setPerson2(data.p2);
        setLifeExpectancy(data.le);
        setMonthlyLiving(data.ml);
        setHasLoan(data.hl);
        setLoanAmount(data.la);
        setLoanRate(data.lr);
        setLoanYears(data.ly);
        setLoanStartAge(data.lsa);
        setLoanMethod(data.lm);
        setLoanPrepayments(
          data.lpp.map((p) => ({ yearFromStart: p.y, amount: p.a, type: p.t })),
        );
        setHasChildren(data.hc);
        setChildren(data.ch);
        setCurrentSavings(data.cs);
        setMonthlySavings(data.ms);
        setAnnualReturn(data.ar);
        setRetirementMonthlyExpense(data.re);
        setInflationRate(data.ir ?? 1.0);
        // Auto-run simulation after a tick
        setTimeout(() => {
          setStep(-2); // trigger auto-run
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-run when loaded from URL
  useEffect(() => {
    if (step === -2) {
      runSimulationFromCurrentState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const fmtMan = (v: number) => `${v.toLocaleString()}万円`;
  const fmtYenToMan = (v: number) => `${(v / 10000).toFixed(0)}万円`;
  const fmtYen = (v: number) => `${v.toLocaleString()}円`;
  const toYen = (man: number) => man * 10000;

  const updatePerson1 = (field: keyof Person, value: number) =>
    setPerson1({ ...person1, [field]: value });
  const updatePerson2 = (field: keyof Person, value: number) =>
    setPerson2({ ...person2, [field]: value });

  const addChild = () =>
    setChildren([
      ...children,
      {
        name: `子ども${children.length + 1}`,
        age: 0,
        plan: { ...defaultPlan },
      },
    ]);
  const removeChild = (i: number) =>
    setChildren(children.filter((_, idx) => idx !== i));
  const updateChild = (
    i: number,
    field: keyof Child,
    value: string | number,
  ) => {
    const updated = [...children];
    if (field === "plan") return;
    updated[i] = {
      ...updated[i],
      [field]: field === "age" ? Number(value) : value,
    };
    setChildren(updated);
  };
  const updateChildPlan = (
    i: number,
    key: keyof EducationPlan,
    value: string,
  ) => {
    const updated = [...children];
    updated[i] = { ...updated[i], plan: { ...updated[i].plan, [key]: value } };
    setChildren(updated);
  };

  const applyModelCase = (mc: ModelCase) => {
    setPerson1(mc.person1);
    setHasPartner(mc.hasPartner);
    setPerson2(mc.person2);
    setLifeExpectancy(mc.lifeExpectancy);
    setMonthlyLiving(mc.monthlyLiving);
    setHasLoan(mc.hasLoan);
    setLoanAmount(mc.loanAmount);
    setLoanRate(mc.loanRate);
    setLoanYears(mc.loanYears);
    setLoanStartAge(mc.loanStartAge);
    setLoanMethod(mc.loanMethod);
    setLoanPrepayments(mc.loanPrepayments);
    setHasChildren(mc.hasChildren);
    setChildren(mc.children);
    setCurrentSavings(mc.currentSavings);
    setMonthlySavings(mc.monthlySavings);
    setAnnualReturn(mc.annualReturn);
    setRetirementMonthlyExpense(mc.retirementMonthlyExpense);
    setInflationRate(mc.inflationRate);
    setStep(0);
  };

  const addPrepayment = () =>
    setLoanPrepayments([
      ...loanPrepayments,
      { yearFromStart: 5, amount: 100, type: "shorten" },
    ]);
  const removePrepayment = (i: number) =>
    setLoanPrepayments(loanPrepayments.filter((_, idx) => idx !== i));
  const updatePrepayment = (
    i: number,
    field: keyof Prepayment,
    value: string | number,
  ) => {
    const updated = [...loanPrepayments];
    if (field === "type") {
      updated[i] = { ...updated[i], type: value as Prepayment["type"] };
    } else {
      updated[i] = { ...updated[i], [field]: Number(value) };
    }
    setLoanPrepayments(updated);
  };

  const buildShareUrl = () => {
    const data: ShareData = {
      p1: person1,
      hp: hasPartner,
      p2: person2,
      le: lifeExpectancy,
      ml: monthlyLiving,
      hl: hasLoan,
      la: loanAmount,
      lr: loanRate,
      ly: loanYears,
      lsa: loanStartAge,
      lm: loanMethod,
      lpp: loanPrepayments.map((p) => ({
        y: p.yearFromStart,
        a: p.amount,
        t: p.type,
      })),
      hc: hasChildren,
      ch: hasChildren ? children : [],
      cs: currentSavings,
      ms: monthlySavings,
      ar: annualReturn,
      re: retirementMonthlyExpense,
      ir: inflationRate,
    };
    const hash = encodeShareData(data);
    return `${window.location.origin}${window.location.pathname}#${hash}`;
  };

  const handleShare = async () => {
    const url = buildShareUrl();
    window.history.replaceState(null, "", url);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareX = () => {
    const url = buildShareUrl();
    window.history.replaceState(null, "", url);
    const r = result;
    const text = r
      ? `OpenMoneyでライフプランをシミュレーション\n住宅ローン: ${fmtYenToMan(r.totalLoanPayment)} / 教育費: ${fmtYenToMan(r.totalEducationCost)} / 資産寿命: ${r.assetDepletionAge === null ? `${lifeExpectancy}歳まで安心` : `${r.assetDepletionAge}歳で枯渇`}`
      : "OpenMoneyでライフプランをシミュレーション";
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
    );
  };

  const runSimulationFromCurrentState = () => {
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
      loanStartAge,
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
      inflationRate,
    };
    setResult(calculateLifePlan(input));
    if (input.inflationRate > 0) {
      setResultNoInflation(
        calculateLifePlan({ ...input, inflationRate: 0 }),
      );
    } else {
      setResultNoInflation(null);
    }
    setMinimumIncome(calculateMinimumIncome(input));
    setStep(TOTAL_STEPS);
  };

  const runSimulation = () => {
    runSimulationFromCurrentState();
  };

  const next = () => {
    if (step === 0 && !hasPartner) {
      setStep(2);
    } else if (step === 3 && !hasChildren) {
      setStep(5);
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
    if (step === 0) {
      setStep(-1);
    } else if (step === 2 && !hasPartner) {
      setStep(0);
    } else if (step === 5 && !hasChildren) {
      setStep(3);
    } else if (step === 6 && !hasLoan) {
      setStep(4);
    } else {
      setStep(step - 1);
    }
  };

  const progress =
    step < 0
      ? 0
      : step < TOTAL_STEPS
        ? Math.round((step / TOTAL_STEPS) * 100)
        : 100;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <QuestionCard question="あなたについて">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <NumberInput
                label="年齢"
                value={person1.age}
                onChange={(v) => updatePerson1("age", v)}
                min={18}
                max={80}
              />
              <NumberInput
                label="退職予定年齢"
                value={person1.retirementAge}
                onChange={(v) => updatePerson1("retirementAge", v)}
                min={50}
                max={80}
              />
              <NumberInput
                label="月収・手取り（万円）"
                value={person1.monthlyIncome}
                onChange={(v) => updatePerson1("monthlyIncome", v)}
                step={1}
                min={0}
                suffix={fmtMan(person1.monthlyIncome)}
              />
              <NumberInput
                label="年金月額（万円）"
                value={person1.pensionMonthly}
                onChange={(v) => updatePerson1("pensionMonthly", v)}
                step={1}
                min={0}
                suffix={fmtMan(person1.pensionMonthly)}
              />
            </div>
            <div className="mt-2">
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
                配偶者
              </p>
              <YesNo
                value={hasPartner}
                onChange={setHasPartner}
                yesLabel="いる"
                noLabel="いない"
              />
            </div>
          </QuestionCard>
        );

      case 1:
        return (
          <QuestionCard question="配偶者について">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <NumberInput
                label="年齢"
                value={person2.age}
                onChange={(v) => updatePerson2("age", v)}
                min={18}
                max={80}
              />
              <NumberInput
                label="退職予定年齢"
                value={person2.retirementAge}
                onChange={(v) => updatePerson2("retirementAge", v)}
                min={50}
                max={80}
              />
              <NumberInput
                label="月収・手取り（万円）"
                value={person2.monthlyIncome}
                onChange={(v) => updatePerson2("monthlyIncome", v)}
                step={1}
                min={0}
                suffix={fmtMan(person2.monthlyIncome)}
              />
              <NumberInput
                label="年金月額（万円）"
                value={person2.pensionMonthly}
                onChange={(v) => updatePerson2("pensionMonthly", v)}
                step={1}
                min={0}
                suffix={fmtMan(person2.pensionMonthly)}
              />
            </div>
          </QuestionCard>
        );

      case 2:
        return (
          <QuestionCard question="世帯の生活">
            <NumberInput
              label="月間生活費（万円）"
              value={monthlyLiving}
              onChange={setMonthlyLiving}
              step={1}
              min={0}
              suffix={fmtMan(monthlyLiving)}
            />
            <NumberInput
              label="想定寿命"
              value={lifeExpectancy}
              onChange={setLifeExpectancy}
              min={70}
              max={110}
            />
          </QuestionCard>
        );

      case 3:
        return (
          <QuestionCard question="お子さまについて">
            <YesNo
              value={hasChildren}
              onChange={(v) => {
                setHasChildren(v);
                if (v && children.length === 0) addChild();
              }}
              yesLabel="いる"
              noLabel="いない"
            />
            {hasChildren && children.length > 0 && (
              <div className="mt-8 space-y-6">
                {children.map((child, i) => (
                  <div
                    key={`child-${i}`}
                    className="border border-neutral-900 p-6"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => updateChild(i, "name", e.target.value)}
                        className="border-b border-neutral-300 bg-transparent px-0 py-1 text-sm font-medium text-neutral-900 focus:border-neutral-900 focus:outline-none w-28"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          removeChild(i);
                          if (children.length <= 1) setHasChildren(false);
                        }}
                        className="text-xs uppercase tracking-wider text-neutral-400 hover:text-neutral-900 transition-colors"
                      >
                        削除
                      </button>
                    </div>
                    <div className="mb-4">
                      <NumberInput
                        label="年齢"
                        value={child.age}
                        onChange={(v) => updateChild(i, "age", v)}
                        min={0}
                        max={22}
                      />
                    </div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
                      進学プラン
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
                      {schoolOptions.map((opt) => (
                        <div key={opt.key}>
                          <label className="mb-1 block text-xs text-neutral-400">
                            {opt.label}
                          </label>
                          <select
                            value={child.plan[opt.key]}
                            onChange={(e) =>
                              updateChildPlan(i, opt.key, e.target.value)
                            }
                            className="w-full border-b border-neutral-300 bg-transparent px-0 py-1.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                          >
                            {opt.choices.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addChild}
                  className="w-full border border-dashed border-neutral-300 py-3 text-xs uppercase tracking-wider text-neutral-400 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
                >
                  + もう1人追加
                </button>
              </div>
            )}
          </QuestionCard>
        );

      case 4:
        return (
          <QuestionCard question="住宅ローン">
            <YesNo
              value={hasLoan}
              onChange={setHasLoan}
              yesLabel="あり"
              noLabel="なし"
            />
            {hasLoan && (
              <div className="mt-8">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <NumberInput
                    label="借入額（万円）"
                    value={loanAmount}
                    onChange={setLoanAmount}
                    step={100}
                    min={0}
                    suffix={fmtMan(loanAmount)}
                  />
                  <NumberInput
                    label="金利（%）"
                    value={loanRate}
                    onChange={setLoanRate}
                    step={0.01}
                    min={0}
                    max={20}
                  />
                  <NumberInput
                    label="返済期間（年）"
                    value={loanYears}
                    onChange={setLoanYears}
                    min={1}
                    max={50}
                  />
                  <NumberInput
                    label="借入時の年齢"
                    value={loanStartAge}
                    onChange={setLoanStartAge}
                    min={18}
                    max={80}
                  />
                  <div className="mb-6">
                    <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-neutral-500">
                      返済方式
                    </label>
                    <select
                      value={loanMethod}
                      onChange={(e) =>
                        setLoanMethod(e.target.value as RepaymentMethod)
                      }
                      className={selectCls}
                    >
                      <option value="equal_installment">元利均等返済</option>
                      <option value="equal_principal">元金均等返済</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                      繰り上げ返済
                    </p>
                    <button
                      type="button"
                      onClick={addPrepayment}
                      className="text-xs uppercase tracking-wider text-neutral-400 hover:text-neutral-900 transition-colors"
                    >
                      + 追加
                    </button>
                  </div>
                  {loanPrepayments.map((p, i) => (
                    <div
                      key={`pp-${i}`}
                      className="mb-3 flex flex-wrap items-end gap-6 border border-neutral-300 p-4"
                    >
                      <div>
                        <label className="mb-1 block text-xs text-neutral-400">
                          年数
                        </label>
                        <input
                          type="number"
                          value={p.yearFromStart}
                          onChange={(e) =>
                            updatePrepayment(i, "yearFromStart", e.target.value)
                          }
                          className="w-20 border-b border-neutral-300 bg-transparent px-0 py-1.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-neutral-400">
                          金額（万円）
                        </label>
                        <input
                          type="number"
                          value={p.amount}
                          onChange={(e) =>
                            updatePrepayment(i, "amount", e.target.value)
                          }
                          className="w-32 border-b border-neutral-300 bg-transparent px-0 py-1.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                          min={0}
                          step={10}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-neutral-400">
                          タイプ
                        </label>
                        <select
                          value={p.type}
                          onChange={(e) =>
                            updatePrepayment(i, "type", e.target.value)
                          }
                          className="border-b border-neutral-300 bg-transparent px-0 py-1.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                        >
                          <option value="shorten">期間短縮型</option>
                          <option value="reduce">返済額軽減型</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePrepayment(i)}
                        className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors pb-2"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </QuestionCard>
        );

      case 5:
        return (
          <QuestionCard question="貯蓄と資産運用">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <NumberInput
                label="現在の貯蓄額（万円）"
                value={currentSavings}
                onChange={setCurrentSavings}
                step={10}
                min={0}
                suffix={fmtMan(currentSavings)}
              />
              <NumberInput
                label="毎月の積立額（万円）"
                value={monthlySavings}
                onChange={setMonthlySavings}
                step={1}
                min={0}
                suffix={fmtMan(monthlySavings)}
              />
            </div>
            <NumberInput
              label="想定運用利回り（%）"
              value={annualReturn}
              onChange={setAnnualReturn}
              step={0.1}
              min={0}
              max={15}
            />
            <NumberInput
              label="物価上昇率（%）"
              value={inflationRate}
              onChange={setInflationRate}
              step={0.1}
              min={0}
              max={10}
            />
          </QuestionCard>
        );

      case 6:
        return (
          <QuestionCard
            question="老後の生活費"
            sub="年金以外に必要な月々の生活費"
          >
            <NumberInput
              label="月間生活費（万円）"
              value={retirementMonthlyExpense}
              onChange={setRetirementMonthlyExpense}
              step={1}
              min={0}
              suffix={fmtMan(retirementMonthlyExpense)}
            />
          </QuestionCard>
        );

      default:
        return null;
    }
  };

  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    ...(result?.loanResult ? [{ id: "loan", label: "Loan" }] : []),
    ...(result?.educationSummary.yearlyDetails.length
      ? [{ id: "education", label: "Education" }]
      : []),
    { id: "table", label: "Table" },
  ];

  const TabBar = () => (
    <div className="mb-8 sm:mb-12 flex gap-1 border-b border-neutral-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-medium uppercase tracking-widest transition-colors ${
            activeTab === tab.id
              ? "border-b-2 border-neutral-900 text-neutral-900"
              : "text-neutral-400 hover:text-neutral-600"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  // Results screen
  if (step === TOTAL_STEPS && result) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-6 sm:py-4">
            <h1
              className="text-lg sm:text-2xl font-bold uppercase tracking-[0.2em] text-neutral-900 cursor-pointer"
              onClick={() => {
                window.location.hash = "";
                setStep(-1);
                setResult(null);
              }}
            >
              OpenMoney
            </h1>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleShare}
                className="text-xs uppercase tracking-wider text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                {copied ? "Copied!" : "Share"}
              </button>
              <button
                type="button"
                onClick={handleShareX}
                className="text-xs uppercase tracking-wider text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                Post to X
              </button>
              <button
                type="button"
                onClick={prev}
                className="text-xs uppercase tracking-wider text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-3 pt-20 pb-12 sm:px-6 sm:pt-24 sm:pb-20">
          {/* Hero */}
          <div className="mb-8 sm:mb-16">
            <p className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
              Your Life Plan
            </p>
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-neutral-900 md:text-6xl">
              シミュレーション結果
            </h2>
          </div>

          {/* Summary cards */}
          <div className="mb-8 sm:mb-16 grid grid-cols-2 gap-px bg-neutral-200 lg:grid-cols-5">
            <div className="bg-white p-4 sm:p-8">
              <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400">
                住宅ローン総額
              </p>
              <p className="text-base sm:text-2xl font-medium tracking-tight text-neutral-900">
                {fmtYenToMan(result.totalLoanPayment)}
              </p>
            </div>
            <div className="bg-white p-4 sm:p-8">
              <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400">
                教育費総額
              </p>
              <p className="text-base sm:text-2xl font-medium tracking-tight text-neutral-900">
                {fmtYenToMan(result.totalEducationCost)}
              </p>
            </div>
            <div className="bg-white p-4 sm:p-8">
              <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400">
                退職時の資産
              </p>
              <p className="text-base sm:text-2xl font-medium tracking-tight text-neutral-900">
                {fmtYenToMan(result.balanceAtRetirement)}
              </p>
            </div>
            <div className="bg-white p-4 sm:p-8">
              <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400">
                資産寿命
              </p>
              <p
                className={`text-base sm:text-2xl font-medium tracking-tight ${result.assetDepletionAge === null ? "text-neutral-900" : "text-red-600"}`}
              >
                {result.assetDepletionAge === null
                  ? `${lifeExpectancy}歳まで安心`
                  : `${result.assetDepletionAge}歳で枯渇`}
              </p>
            </div>
            {inflationRate > 0 && (
              <div className="bg-white p-4 sm:p-8">
                <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400">
                  物価上昇率
                </p>
                <p className="text-base sm:text-2xl font-medium tracking-tight text-neutral-900">
                  年{inflationRate}%
                </p>
                {resultNoInflation && (
                  <p className="mt-1 text-[10px] sm:text-xs text-neutral-500">
                    インフレなし比較: 資産残高{" "}
                    {fmtYenToMan(
                      result.retirementBalance -
                        resultNoInflation.retirementBalance,
                    )}
                    {result.retirementBalance -
                      resultNoInflation.retirementBalance <=
                    0
                      ? ""
                      : "増"}
                  </p>
                )}
              </div>
            )}
            {minimumIncome &&
              (() => {
                const currentMonthlyYen =
                  (person1.monthlyIncome +
                    (hasPartner ? person2.monthlyIncome : 0)) *
                  10000;
                const shortage =
                  minimumIncome.minimumMonthlyIncome - currentMonthlyYen;
                const isSufficient = shortage <= 0;
                return (
                  <div className="bg-white p-4 sm:p-8">
                    <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400">
                      最低必要世帯月収
                    </p>
                    <p
                      className={`text-base sm:text-2xl font-medium tracking-tight ${isSufficient ? "text-neutral-900" : "text-red-600"}`}
                    >
                      {fmtYenToMan(minimumIncome.minimumMonthlyIncome)}
                    </p>
                    {isSufficient ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        年収 {fmtYenToMan(minimumIncome.minimumAnnualIncome)} —
                        月{fmtYenToMan(Math.abs(shortage))}の余裕あり
                      </p>
                    ) : (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-red-600">
                          月{fmtYenToMan(shortage)}不足（年
                          {fmtYenToMan(shortage * 12)}）
                        </p>
                        <p className="text-xs leading-relaxed text-neutral-500">
                          収入を月{fmtYenToMan(shortage)}
                          増やすか、生活費・ローン・教育費の見直しを検討しましょう
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>

          <TabBar />

          {activeTab === "overview" && (
            <LifePlanCharts
              schedule={result.schedule}
              retirementAge={person1.retirementAge}
            />
          )}

          {activeTab === "loan" && result.loanResult && (
            <div className="space-y-12">
              <div className="grid grid-cols-3 gap-px bg-neutral-200">
                <div className="bg-white p-4 sm:p-8">
                  <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400">
                    {loanMethod === "equal_principal"
                      ? "初回の支払額"
                      : "月々の支払額"}
                  </p>
                  <p className="text-base sm:text-2xl font-medium tracking-tight text-neutral-900">
                    {fmtYen(result.loanResult.monthlyPayment)}
                  </p>
                </div>
                <div className="bg-white p-4 sm:p-8">
                  <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400">
                    総支払額
                  </p>
                  <p className="text-base sm:text-2xl font-medium tracking-tight text-neutral-900">
                    {fmtYen(result.loanResult.totalPayment)}
                  </p>
                </div>
                <div className="bg-white p-4 sm:p-8">
                  <p className="mb-1 sm:mb-2 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400">
                    利息合計
                  </p>
                  <p className="text-base sm:text-2xl font-medium tracking-tight text-neutral-900">
                    {fmtYen(result.loanResult.totalInterest)}
                  </p>
                </div>
              </div>
              <LoanCharts result={result.loanResult} />
              <LoanTable schedule={result.loanResult.schedule} />
            </div>
          )}

          {activeTab === "education" &&
            result.educationSummary.yearlyDetails.length > 0 && (
              <div>
                <div className="mb-6 sm:mb-8">
                  <h3 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-medium tracking-tight text-neutral-900">
                    教育費の詳細
                  </h3>
                  {result.educationSummary.perChildTotal.length > 0 && (
                    <div className="mb-8 flex flex-wrap gap-px bg-neutral-200 w-fit">
                      {result.educationSummary.perChildTotal.map((child) => (
                        <div key={child.name} className="bg-white px-8 py-5">
                          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-neutral-400">
                            {child.name}
                          </p>
                          <p className="text-lg font-medium tracking-tight text-neutral-900">
                            {fmtYenToMan(child.total)}
                          </p>
                        </div>
                      ))}
                      {result.educationSummary.perChildTotal.length > 1 && (
                        <div className="bg-neutral-50 px-8 py-5">
                          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-neutral-400">
                            合計
                          </p>
                          <p className="text-lg font-medium tracking-tight text-neutral-900">
                            {fmtYenToMan(result.educationSummary.grandTotal)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-900 text-left">
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
                          年齢
                        </th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
                          子ども
                        </th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
                          年齢
                        </th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
                          学校
                        </th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
                          種別
                        </th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-neutral-400 text-right">
                          年間費用
                        </th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-neutral-400 text-right">
                          年合計
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.educationSummary.yearlyDetails.map((year) =>
                        year.children.map((child, ci) => (
                          <tr
                            key={`${year.parentAge}-${child.childName}`}
                            className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                          >
                            {ci === 0 && (
                              <td
                                className="px-4 py-3 font-medium text-neutral-900"
                                rowSpan={year.children.length}
                              >
                                {year.parentAge}歳
                              </td>
                            )}
                            <td className="px-4 py-3 text-neutral-600">
                              {child.childName}
                            </td>
                            <td className="px-4 py-3 text-neutral-600">
                              {child.childAge}歳
                            </td>
                            <td className="px-4 py-3 text-neutral-600">
                              {child.stage}
                            </td>
                            <td className="px-4 py-3 text-neutral-600">
                              {child.schoolType}
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-600">
                              {fmtYenToMan(child.cost)}
                            </td>
                            {ci === 0 && (
                              <td
                                className="px-4 py-3 text-right font-medium text-neutral-900"
                                rowSpan={year.children.length}
                              >
                                {fmtYenToMan(year.totalCost)}
                              </td>
                            )}
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {activeTab === "table" && (
            <div>
              <h3 className="mb-2 text-xl sm:text-2xl font-medium tracking-tight text-neutral-900">
                資産推移テーブル
              </h3>
              <p className="mb-6 sm:mb-8 text-[10px] sm:text-xs uppercase tracking-widest text-neutral-400">
                Asset Transition Table
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-neutral-900 text-left">
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400">
                        年齢
                      </th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400">
                        区分
                      </th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400 text-right">
                        年収入
                      </th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400 text-right">
                        生活費
                      </th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400 text-right">
                        ローン
                      </th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400 text-right">
                        教育費
                      </th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400 text-right">
                        年間収支
                      </th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400 text-right">
                        資産残高
                      </th>
                      {resultNoInflation && (
                        <th className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-neutral-400 text-right">
                          インフレ影響
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {result.schedule.map((row) => (
                      <tr
                        key={row.age}
                        className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${row.age === person1.retirementAge ? "bg-neutral-50" : ""} ${row.balance < 0 ? "bg-red-50/50" : ""}`}
                      >
                        <td className="px-2 py-2 sm:px-4 sm:py-3 font-medium text-neutral-900">
                          {row.age}歳
                        </td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 text-neutral-500">
                          {row.phase}
                        </td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 text-right text-neutral-600">
                          {fmtYenToMan(row.income)}
                        </td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 text-right text-neutral-600">
                          {fmtYenToMan(row.livingCost)}
                        </td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 text-right text-neutral-600">
                          {row.loanPayment > 0
                            ? fmtYenToMan(row.loanPayment)
                            : "-"}
                        </td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 text-right text-neutral-600">
                          {row.educationCost > 0
                            ? fmtYenToMan(row.educationCost)
                            : "-"}
                        </td>
                        <td
                          className={`px-2 py-2 sm:px-4 sm:py-3 text-right font-medium ${row.savings >= 0 ? "text-neutral-900" : "text-red-600"}`}
                        >
                          {row.savings >= 0 ? "+" : ""}
                          {fmtYenToMan(row.savings)}
                        </td>
                        <td
                          className={`px-2 py-2 sm:px-4 sm:py-3 text-right font-medium ${row.balance >= 0 ? "text-neutral-900" : "text-red-600"}`}
                        >
                          {fmtYenToMan(row.balance)}
                        </td>
                        {resultNoInflation && (() => {
                          const noInflRow = resultNoInflation.schedule.find(
                            (r) => r.age === row.age,
                          );
                          const diff = noInflRow
                            ? row.balance - noInflRow.balance
                            : 0;
                          return (
                            <td
                              className={`px-2 py-2 sm:px-4 sm:py-3 text-right text-xs ${diff < 0 ? "text-red-500" : "text-neutral-400"}`}
                            >
                              {diff === 0
                                ? "-"
                                : `${diff > 0 ? "+" : ""}${fmtYenToMan(diff)}`}
                            </td>
                          );
                        })()}
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

  // Model case selection
  if (step === -1) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="flex-1 px-6 py-20">
          {/* Hero */}
          <div className="mx-auto max-w-5xl mb-20">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
              Life Plan Simulator
            </p>
            <h1 className="text-6xl font-medium uppercase tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl">
              OPEN
              <br />
              <span className="bg-neutral-900 text-white px-3 inline-block">
                MONEY
              </span>
            </h1>
          </div>

          <div className="mx-auto max-w-5xl">
            {hasPreviousSession && (
              <div className="mb-16">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="group w-full border border-neutral-900 bg-neutral-900 p-8 text-left transition-colors hover:bg-neutral-800"
                >
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
                    Continue
                  </p>
                  <h3 className="text-xl font-medium tracking-tight text-white">
                    前回の続きから
                  </h3>
                  <p className="mt-2 text-sm text-neutral-400">
                    前回入力したデータが保存されています
                  </p>
                </button>
              </div>
            )}

            <div className="mb-12">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
                Model Cases
              </p>
              <div className="mt-1 h-px bg-neutral-200" />
            </div>

            <div className="grid grid-cols-1 gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
              {modelCases.map((mc) => (
                <button
                  key={mc.name}
                  type="button"
                  onClick={() => applyModelCase(mc)}
                  className="group bg-white p-8 text-left transition-colors hover:bg-neutral-50"
                >
                  <h3 className="mb-3 text-lg font-medium tracking-tight text-neutral-900 group-hover:underline underline-offset-4">
                    {mc.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-500">
                    {mc.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-16 flex flex-col items-center gap-6">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="border border-neutral-900 px-10 py-4 text-xs font-medium uppercase tracking-[0.15em] text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                ゼロから始める
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-neutral-200 px-6 py-6">
          <div className="mx-auto max-w-5xl flex items-center justify-between">
            <p className="text-xs text-neutral-400">OpenMoney</p>
            <p className="text-xs text-neutral-400">Life Plan Simulator</p>
          </div>
        </footer>
      </div>
    );
  }

  // Question screen
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {renderStep()}

        {/* Step progress + nav */}
        <div className="mx-auto mt-12 w-full max-w-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex flex-1 gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={`step-${i}`}
                  className={`h-1.5 flex-1 transition-colors duration-300 ${i <= step ? "bg-neutral-900" : "bg-neutral-200"}`}
                />
              ))}
            </div>
            <span className="text-xs font-mono text-neutral-400 shrink-0">
              {step + 1} / {TOTAL_STEPS}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prev}
              className="text-xs uppercase tracking-wider text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              {step === 0 ? "Back to Cases" : "Back"}
            </button>
            <button
              type="button"
              onClick={next}
              className="border border-neutral-900 px-10 py-3 text-xs font-medium uppercase tracking-[0.15em] text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
            >
              {step === TOTAL_STEPS - 1 ? "結果を見る" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
