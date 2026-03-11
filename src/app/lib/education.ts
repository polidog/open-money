export type SchoolType = "public" | "private";

export type EducationPlan = {
  kindergarten: SchoolType;
  elementary: SchoolType;
  juniorHigh: SchoolType;
  highSchool: SchoolType;
  university: "public" | "private_arts" | "private_science" | "none";
};

// 年間の平均的な教育費（万円）
const ANNUAL_COSTS: Record<string, Record<string, number>> = {
  kindergarten: { public: 17, private: 31 },
  elementary: { public: 35, private: 167 },
  juniorHigh: { public: 54, private: 144 },
  highSchool: { public: 51, private: 105 },
  university: { public: 54, private_arts: 97, private_science: 150 },
};

const DURATIONS: Record<string, number> = {
  kindergarten: 3,
  elementary: 6,
  juniorHigh: 3,
  highSchool: 3,
  university: 4,
};

export type YearlyEducationCost = {
  year: number;
  childAge: number;
  stage: string;
  cost: number;
  cumulative: number;
  savings: number;
};

export type EducationResult = {
  totalCost: number;
  yearlyCosts: YearlyEducationCost[];
  monthlySavingsNeeded: number;
};

export function calculateEducation(
  childAge: number,
  plan: EducationPlan,
  currentSavings: number,
  annualReturn: number,
): EducationResult {
  const stages: { key: string; label: string; type: string; startAge: number }[] = [
    { key: "kindergarten", label: "幼稚園", type: plan.kindergarten, startAge: 3 },
    { key: "elementary", label: "小学校", type: plan.elementary, startAge: 6 },
    { key: "juniorHigh", label: "中学校", type: plan.juniorHigh, startAge: 12 },
    { key: "highSchool", label: "高校", type: plan.highSchool, startAge: 15 },
    { key: "university", label: "大学", type: plan.university, startAge: 18 },
  ];

  const yearlyCosts: YearlyEducationCost[] = [];
  let cumulative = 0;
  let totalCost = 0;

  for (const stage of stages) {
    if (stage.type === "none") continue;
    const duration = DURATIONS[stage.key];
    const annualCost = (ANNUAL_COSTS[stage.key][stage.type] ?? 0) * 10000;

    for (let y = 0; y < duration; y++) {
      const age = stage.startAge + y;
      if (age < childAge) continue;
      cumulative += annualCost;
      totalCost += annualCost;

      yearlyCosts.push({
        year: age - childAge + 1,
        childAge: age,
        stage: stage.label,
        cost: annualCost,
        cumulative,
        savings: 0,
      });
    }
  }

  // 必要な月額積立額を計算（運用利回りを考慮）
  const yearsUntilEnd = yearlyCosts.length > 0
    ? yearlyCosts[yearlyCosts.length - 1].childAge - childAge + 1
    : 0;
  const shortage = Math.max(0, totalCost - currentSavings);
  const monthlyRate = annualReturn / 100 / 12;
  const totalMonths = yearsUntilEnd * 12;

  let monthlySavingsNeeded: number;
  if (totalMonths <= 0) {
    monthlySavingsNeeded = 0;
  } else if (monthlyRate === 0) {
    monthlySavingsNeeded = shortage / totalMonths;
  } else {
    monthlySavingsNeeded =
      (shortage * monthlyRate) / ((1 + monthlyRate) ** totalMonths - 1);
  }

  // 貯蓄残高の推移を計算
  let savings = currentSavings;
  const monthlyReturn = annualReturn / 100 / 12;
  for (const entry of yearlyCosts) {
    for (let m = 0; m < 12; m++) {
      savings = savings * (1 + monthlyReturn) + monthlySavingsNeeded;
    }
    savings -= entry.cost;
    entry.savings = Math.round(Math.max(0, savings));
  }

  return {
    totalCost,
    yearlyCosts,
    monthlySavingsNeeded: Math.round(monthlySavingsNeeded),
  };
}
