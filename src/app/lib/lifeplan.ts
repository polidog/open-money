import type { EducationPlan } from "./education";
import { type LoanResult, type Prepayment, type RepaymentMethod, calculateLoan } from "./loan";

export type Child = {
  name: string;
  age: number;
  plan: EducationPlan;
};

export type Person = {
  age: number;
  retirementAge: number;
  monthlyIncome: number;
  pensionMonthly: number;
};

export type LifePlanInput = {
  person1: Person;
  hasPartner: boolean;
  person2: Person;
  lifeExpectancy: number;
  monthlyLiving: number;

  // 住宅ローン
  hasLoan: boolean;
  loanAmount: number;
  loanRate: number;
  loanYears: number;
  loanMethod: RepaymentMethod;
  loanPrepayments: Prepayment[];

  // 教育
  children: Child[];

  // 老後
  currentSavings: number;
  monthlySavings: number;
  annualReturn: number;
  retirementMonthlyExpense: number;
};

export type YearlyLifePlan = {
  age: number;
  phase: string;
  income: number;
  loanPayment: number;
  educationCost: number;
  livingCost: number;
  savings: number;
  balance: number;
};

export type LifePlanResult = {
  schedule: YearlyLifePlan[];
  totalLoanPayment: number;
  totalEducationCost: number;
  retirementBalance: number;
  balanceAtRetirement: number;
  assetDepletionAge: number | null;
  educationSummary: EducationSummary;
  loanResult: LoanResult | null;
};

const ANNUAL_COSTS: Record<string, Record<string, number>> = {
  kindergarten: { public: 17, private: 31 },
  elementary: { public: 35, private: 167 },
  juniorHigh: { public: 54, private: 144 },
  highSchool: { public: 51, private: 105 },
  university: { public: 54, private_arts: 97, private_science: 150 },
};

const STAGE_LABELS: Record<string, string> = {
  kindergarten: "幼稚園",
  elementary: "小学校",
  juniorHigh: "中学校",
  highSchool: "高校",
  university: "大学",
};

const TYPE_LABELS: Record<string, string> = {
  public: "公立",
  private: "私立",
  private_arts: "私立文系",
  private_science: "私立理系",
};

function getEducationStageForAge(
  childAge: number,
): { stageKey: string; label: string } | null {
  if (childAge >= 3 && childAge <= 5) return { stageKey: "kindergarten", label: STAGE_LABELS.kindergarten };
  if (childAge >= 6 && childAge <= 11) return { stageKey: "elementary", label: STAGE_LABELS.elementary };
  if (childAge >= 12 && childAge <= 14) return { stageKey: "juniorHigh", label: STAGE_LABELS.juniorHigh };
  if (childAge >= 15 && childAge <= 17) return { stageKey: "highSchool", label: STAGE_LABELS.highSchool };
  if (childAge >= 18 && childAge <= 21) return { stageKey: "university", label: STAGE_LABELS.university };
  return null;
}

function getEducationCostForAge(childAge: number, plan: EducationPlan): number {
  const stage = getEducationStageForAge(childAge);
  if (!stage) return 0;
  const planType = plan[stage.stageKey as keyof EducationPlan];
  if (planType === "none") return 0;
  return (ANNUAL_COSTS[stage.stageKey]?.[planType] ?? 0) * 10000;
}

export type ChildEducationDetail = {
  childName: string;
  childAge: number;
  stage: string;
  schoolType: string;
  cost: number;
};

export type YearlyEducationDetail = {
  parentAge: number;
  children: ChildEducationDetail[];
  totalCost: number;
};

export type EducationSummary = {
  yearlyDetails: YearlyEducationDetail[];
  perChildTotal: { name: string; total: number }[];
  grandTotal: number;
};

export function calculateLifePlan(input: LifePlanInput): LifePlanResult {
  const schedule: YearlyLifePlan[] = [];
  let balance = input.currentSavings;
  const monthlyRate = input.annualReturn / 100 / 12;

  // ローン月額計算
  let loanMonthlyPayment = 0;
  let loanRemaining = 0;
  let loanMonthlyPrincipal = 0;
  const loanTotalMonths = input.loanYears * 12;
  const loanMonthlyRate = input.loanRate / 100 / 12;

  if (input.hasLoan && input.loanAmount > 0) {
    loanRemaining = input.loanAmount;
    if (input.loanMethod === "equal_principal") {
      loanMonthlyPrincipal = input.loanAmount / loanTotalMonths;
    } else {
      if (loanMonthlyRate === 0) {
        loanMonthlyPayment = input.loanAmount / loanTotalMonths;
      } else {
        loanMonthlyPayment =
          (input.loanAmount *
            loanMonthlyRate *
            (1 + loanMonthlyRate) ** loanTotalMonths) /
          ((1 + loanMonthlyRate) ** loanTotalMonths - 1);
      }
    }
  }

  const prepaymentMap = new Map<number, Prepayment>();
  for (const p of input.loanPrepayments) {
    if (p.amount > 0) prepaymentMap.set(p.yearFromStart, p);
  }

  let totalLoanPayment = 0;
  let totalEducationCost = 0;
  let loanYearCount = 0;
  let balanceAtRetirement = 0;
  let assetDepletionAge: number | null = null;

  const educationYearlyDetails: YearlyEducationDetail[] = [];
  const perChildTotals = new Map<string, number>();
  for (const child of input.children) {
    perChildTotals.set(child.name, 0);
  }

  for (let age = input.person1.age; age <= input.lifeExpectancy; age++) {
    const yearOffset = age - input.person1.age;
    const p1Working = age < input.person1.retirementAge;
    const p2Age = input.hasPartner ? input.person2.age + yearOffset : 0;
    const p2Working = input.hasPartner && p2Age < input.person2.retirementAge;
    const anyoneWorking = p1Working || p2Working;
    const phase = anyoneWorking ? "就労" : "老後";

    // 年間収入（本人 + 配偶者）
    const p1Income = p1Working
      ? input.person1.monthlyIncome * 12
      : input.person1.pensionMonthly * 12;
    const p2Income = input.hasPartner
      ? (p2Working
          ? input.person2.monthlyIncome * 12
          : input.person2.pensionMonthly * 12)
      : 0;
    const annualIncome = p1Income + p2Income;

    // 年間生活費
    const annualLiving = anyoneWorking
      ? input.monthlyLiving * 12
      : input.retirementMonthlyExpense * 12;

    // ローン支払い（年間）
    let annualLoanPayment = 0;
    if (input.hasLoan && loanRemaining > 0) {
      loanYearCount++;
      for (let m = 0; m < 12; m++) {
        if (loanRemaining <= 0) break;
        const interest = loanRemaining * loanMonthlyRate;
        let principal: number;
        let payment: number;

        if (input.loanMethod === "equal_principal") {
          principal = Math.min(loanMonthlyPrincipal, loanRemaining);
          payment = principal + interest;
        } else {
          payment = Math.min(loanMonthlyPayment, loanRemaining + interest);
          principal = payment - interest;
        }

        loanRemaining = Math.max(0, loanRemaining - principal);
        annualLoanPayment += payment;
      }

      // 繰り上げ返済
      const prepayment = prepaymentMap.get(loanYearCount);
      if (prepayment && loanRemaining > 0) {
        const amount = Math.min(prepayment.amount, loanRemaining);
        loanRemaining -= amount;
        annualLoanPayment += amount;

        if (loanRemaining > 0 && prepayment.type === "reduce") {
          const remainingMonths = (input.loanYears - loanYearCount) * 12;
          if (input.loanMethod === "equal_installment" && remainingMonths > 0) {
            if (loanMonthlyRate > 0) {
              loanMonthlyPayment =
                (loanRemaining *
                  loanMonthlyRate *
                  (1 + loanMonthlyRate) ** remainingMonths) /
                ((1 + loanMonthlyRate) ** remainingMonths - 1);
            } else {
              loanMonthlyPayment = loanRemaining / remainingMonths;
            }
          } else if (
            input.loanMethod === "equal_principal" &&
            remainingMonths > 0
          ) {
            loanMonthlyPrincipal = loanRemaining / remainingMonths;
          }
        }
      }
    }

    // 教育費（年間）
    let annualEducation = 0;
    const childrenDetails: ChildEducationDetail[] = [];
    for (const child of input.children) {
      const childCurrentAge = child.age + yearOffset;
      const cost = getEducationCostForAge(childCurrentAge, child.plan);
      annualEducation += cost;

      if (cost > 0) {
        const stage = getEducationStageForAge(childCurrentAge);
        const planType = stage
          ? child.plan[stage.stageKey as keyof EducationPlan]
          : "";
        childrenDetails.push({
          childName: child.name,
          childAge: childCurrentAge,
          stage: stage?.label ?? "",
          schoolType: TYPE_LABELS[planType] ?? planType,
          cost,
        });
        perChildTotals.set(
          child.name,
          (perChildTotals.get(child.name) ?? 0) + cost,
        );
      }
    }
    if (childrenDetails.length > 0) {
      educationYearlyDetails.push({
        parentAge: age,
        children: childrenDetails,
        totalCost: annualEducation,
      });
    }

    totalLoanPayment += annualLoanPayment;
    totalEducationCost += annualEducation;

    // 年間貯蓄
    const annualSavings = anyoneWorking ? input.monthlySavings * 12 : 0;

    // 資産残高の更新
    // 収入 - 生活費 - ローン - 教育費 + 積立 を反映
    const netCashFlow =
      annualIncome - annualLiving - annualLoanPayment - annualEducation;

    // 運用益
    balance = balance * (1 + input.annualReturn / 100);
    // 現金フローを反映（積立は収入から出るので別計上しない）
    balance += netCashFlow;

    if (age === input.person1.retirementAge) {
      balanceAtRetirement = Math.round(balance);
    }

    if (balance < 0 && assetDepletionAge === null) {
      assetDepletionAge = age;
    }

    schedule.push({
      age,
      phase,
      income: Math.round(annualIncome),
      loanPayment: Math.round(annualLoanPayment),
      educationCost: Math.round(annualEducation),
      livingCost: Math.round(annualLiving),
      savings: Math.round(netCashFlow),
      balance: Math.round(balance),
    });
  }

  const lastEntry = schedule[schedule.length - 1];

  const educationSummary: EducationSummary = {
    yearlyDetails: educationYearlyDetails,
    perChildTotal: Array.from(perChildTotals.entries()).map(([name, total]) => ({
      name,
      total,
    })),
    grandTotal: Math.round(totalEducationCost),
  };

  // ローン詳細結果を別途計算
  let loanResult: LoanResult | null = null;
  if (input.hasLoan && input.loanAmount > 0) {
    loanResult = calculateLoan(
      input.loanAmount,
      input.loanRate,
      input.loanYears,
      input.person1.age,
      input.loanMethod,
      input.loanPrepayments,
    );
  }

  return {
    schedule,
    totalLoanPayment: Math.round(totalLoanPayment),
    totalEducationCost: Math.round(totalEducationCost),
    retirementBalance: lastEntry.balance,
    balanceAtRetirement,
    assetDepletionAge,
    educationSummary,
    loanResult,
  };
}
