import { type LifePlanInput, calculateLifePlan } from "./lifeplan";

export type MinimumIncomeResult = {
  minimumMonthlyIncome: number; // 世帯月収（円）
  minimumAnnualIncome: number; // 世帯年収（円）
  person1MonthlyIncome: number; // 円
  person2MonthlyIncome: number; // 円
};

export function calculateMinimumIncome(
  baseInput: LifePlanInput,
): MinimumIncomeResult {
  // person1/person2 の収入比率を算出
  const totalIncome =
    baseInput.person1.monthlyIncome + baseInput.person2.monthlyIncome;
  const ratio =
    totalIncome > 0 ? baseInput.person1.monthlyIncome / totalIncome : 1;

  // 世帯合計月収を 0〜2000万円（円単位）で二分探索
  let lo = 0;
  let hi = 20_000_000;

  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const input: LifePlanInput = {
      ...baseInput,
      person1: {
        ...baseInput.person1,
        monthlyIncome: mid * ratio,
      },
      person2: {
        ...baseInput.person2,
        monthlyIncome: baseInput.hasPartner ? mid * (1 - ratio) : 0,
      },
    };
    const result = calculateLifePlan(input);
    const lastBalance =
      result.schedule[result.schedule.length - 1]?.balance ?? 0;
    if (result.assetDepletionAge === null && lastBalance >= 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  const minimumMonthlyIncome = Math.ceil(hi);

  return {
    minimumMonthlyIncome,
    minimumAnnualIncome: minimumMonthlyIncome * 12,
    person1MonthlyIncome: Math.ceil(minimumMonthlyIncome * ratio),
    person2MonthlyIncome: baseInput.hasPartner
      ? Math.ceil(minimumMonthlyIncome * (1 - ratio))
      : 0,
  };
}
