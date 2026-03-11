export type RepaymentMethod = "equal_installment" | "equal_principal";
export type PrepaymentType = "shorten" | "reduce";

export type Prepayment = {
  yearFromStart: number;
  amount: number;
  type: PrepaymentType;
};

export type MonthlyPayment = {
  month: number;
  year: number;
  age: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  prepayment: number;
};

export type LoanResult = {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: MonthlyPayment[];
};

export function calculateLoan(
  loanAmount: number,
  annualRate: number,
  years: number,
  startAge: number,
  method: RepaymentMethod = "equal_installment",
  prepayments: Prepayment[] = [],
): LoanResult {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;

  const prepaymentMap = new Map<number, Prepayment>();
  for (const p of prepayments) {
    if (p.amount > 0) {
      prepaymentMap.set(p.yearFromStart * 12, p);
    }
  }

  const schedule: MonthlyPayment[] = [];
  let remaining = loanAmount;
  let currentMonthlyPayment = calcInitialMonthlyPayment(
    loanAmount,
    monthlyRate,
    totalMonths,
    method,
  );
  let remainingMonths = totalMonths;
  let monthlyPrincipal =
    method === "equal_principal" ? loanAmount / totalMonths : 0;

  for (let i = 1; i <= totalMonths; i++) {
    if (remaining <= 0) break;

    const interestPayment = remaining * monthlyRate;
    let principalPayment: number;
    let payment: number;

    if (method === "equal_principal") {
      principalPayment = Math.min(monthlyPrincipal, remaining);
      payment = principalPayment + interestPayment;
    } else {
      payment = Math.min(currentMonthlyPayment, remaining + interestPayment);
      principalPayment = payment - interestPayment;
    }

    remaining = Math.max(0, remaining - principalPayment);

    let prepaymentAmount = 0;
    const prepayment = prepaymentMap.get(i);
    if (prepayment && remaining > 0) {
      prepaymentAmount = Math.min(prepayment.amount, remaining);
      remaining = Math.max(0, remaining - prepaymentAmount);

      if (remaining > 0) {
        const monthsLeft = totalMonths - i;
        if (prepayment.type === "shorten") {
          if (method === "equal_principal" && monthsLeft > 0) {
            remainingMonths = Math.ceil(remaining / monthlyPrincipal);
          }
        } else {
          if (method === "equal_installment") {
            const newRemaining = remaining;
            const newMonths = totalMonths - i;
            if (newMonths > 0 && monthlyRate > 0) {
              currentMonthlyPayment =
                (newRemaining * monthlyRate * (1 + monthlyRate) ** newMonths) /
                ((1 + monthlyRate) ** newMonths - 1);
            } else if (newMonths > 0) {
              currentMonthlyPayment = newRemaining / newMonths;
            }
          } else {
            const newMonths = totalMonths - i;
            if (newMonths > 0) {
              monthlyPrincipal = remaining / newMonths;
            }
          }
        }
      }
    }

    schedule.push({
      month: i,
      year: Math.ceil(i / 12),
      age: startAge + Math.floor((i - 1) / 12),
      payment: Math.round(payment),
      principal: Math.round(principalPayment),
      interest: Math.round(interestPayment),
      remainingBalance: Math.round(remaining),
      prepayment: Math.round(prepaymentAmount),
    });

    if (remaining <= 0) break;
  }

  const totalPrepayment = schedule.reduce((s, m) => s + m.prepayment, 0);
  const totalPayment =
    schedule.reduce((s, m) => s + m.payment, 0) + totalPrepayment;
  const totalInterest = totalPayment - loanAmount;

  return {
    monthlyPayment: schedule[0].payment,
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    schedule,
  };
}

export function calcInitialMonthlyPayment(
  loanAmount: number,
  monthlyRate: number,
  totalMonths: number,
  method: RepaymentMethod,
): number {
  if (method === "equal_principal") {
    const monthlyPrincipal = loanAmount / totalMonths;
    return monthlyPrincipal + loanAmount * monthlyRate;
  }
  if (monthlyRate === 0) {
    return loanAmount / totalMonths;
  }
  return (
    (loanAmount * monthlyRate * (1 + monthlyRate) ** totalMonths) /
    ((1 + monthlyRate) ** totalMonths - 1)
  );
}
