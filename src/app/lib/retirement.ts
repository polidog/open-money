export type YearlyRetirement = {
  age: number;
  phase: "積立" | "取崩";
  contribution: number;
  withdrawal: number;
  investment: number;
  balance: number;
};

export type RetirementResult = {
  totalContribution: number;
  totalAtRetirement: number;
  monthlyWithdrawal: number;
  yearsLastAfterRetirement: number;
  schedule: YearlyRetirement[];
};

export function calculateRetirement(
  currentAge: number,
  retirementAge: number,
  lifeExpectancy: number,
  currentSavings: number,
  monthlyContribution: number,
  annualReturn: number,
  pensionMonthly: number,
  monthlyExpense: number,
): RetirementResult {
  const monthlyRate = annualReturn / 100 / 12;
  const schedule: YearlyRetirement[] = [];
  let balance = currentSavings;
  let totalContribution = currentSavings;

  // 積立期間
  for (let age = currentAge; age < retirementAge; age++) {
    let yearlyContribution = 0;
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      yearlyContribution += monthlyContribution;
    }
    totalContribution += yearlyContribution;

    schedule.push({
      age,
      phase: "積立",
      contribution: Math.round(yearlyContribution),
      withdrawal: 0,
      investment: Math.round(balance - totalContribution),
      balance: Math.round(balance),
    });
  }

  const totalAtRetirement = Math.round(balance);

  // 取崩期間
  const monthlyShortfall = Math.max(0, monthlyExpense - pensionMonthly);
  let yearsLastAfterRetirement = 0;

  for (let age = retirementAge; age <= lifeExpectancy; age++) {
    let yearlyWithdrawal = 0;
    let depleted = false;
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate);
      if (balance >= monthlyShortfall) {
        balance -= monthlyShortfall;
        yearlyWithdrawal += monthlyShortfall;
      } else {
        yearlyWithdrawal += balance;
        balance = 0;
        depleted = true;
      }
    }

    if (!depleted) {
      yearsLastAfterRetirement = age - retirementAge + 1;
    }

    schedule.push({
      age,
      phase: "取崩",
      contribution: 0,
      withdrawal: Math.round(yearlyWithdrawal),
      investment: 0,
      balance: Math.round(balance),
    });

    if (balance <= 0 && age < lifeExpectancy) {
      // 資金が尽きた後も残りの年を表示
      for (let a = age + 1; a <= lifeExpectancy; a++) {
        schedule.push({
          age: a,
          phase: "取崩",
          contribution: 0,
          withdrawal: 0,
          investment: 0,
          balance: 0,
        });
      }
      break;
    }
  }

  return {
    totalContribution: Math.round(totalContribution),
    totalAtRetirement,
    monthlyWithdrawal: monthlyShortfall,
    yearsLastAfterRetirement,
    schedule,
  };
}
