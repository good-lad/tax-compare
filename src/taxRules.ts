export const countries = ['Bulgaria', 'Estonia', 'Greece'] as const;
export const profiles = ['Employee', 'Self-Employed', 'Small Business'] as const;

type Profile = typeof profiles[number];
type Country = typeof countries[number];

type TaxBreakdown = {
  tax: number;
  net: number;
  entireExpense: number;
  breakdown: Record<string, number>;
};

type TaxCalc = (income: number, expenses?: number, salaryPayments?: number) => TaxBreakdown;

type TaxRules = {
  [country in Country]: {
    [profile in Profile]: TaxCalc;
  };
};

// 2025 ESTONIA (Employee)
function estoniaEmployee(
  income: number,
  _expenses?: number,
  _salaryPayments: number = 12
): TaxBreakdown {
  const gross = income;
  const pension = gross * 0.02;
  const unemp = gross * 0.016;
  let annualGross = gross * 12;
  let annualTaxFree = 654 * 12;
  if (annualGross > 14400 && annualGross <= 25200) {
    annualTaxFree = 7848 - 7848 * ((annualGross - 14400) / 10800);
  } else if (annualGross > 25200) {
    annualTaxFree = 0;
  }
  const taxFree = annualTaxFree / 12;
  const taxable = gross - pension - unemp - taxFree;
  const incomeTax = Math.max(0, taxable * 0.22);
  const net = gross - pension - unemp - incomeTax;
  const socialTax = gross * 0.33;
  const employerUnemp = gross * 0.008;
  const entireExpense = gross + socialTax + employerUnemp;
  return {
    tax: incomeTax + pension + unemp,
    net,
    entireExpense,
    breakdown: {
      'Gross': gross,
      'Pension (II pillar)': pension,
      'Unemployment (Employee)': unemp,
      'Tax-free Allowance': taxFree,
      'Taxable Income': taxable,
      'Income Tax (22%)': incomeTax,
      'Net Salary': net,
      'Social Tax (Employer)': socialTax,
      'Unemployment (Employer)': employerUnemp,
      'Entire Expense': entireExpense,
    },
  };
}

// 2025 BULGARIA (Employee)
function bulgariaEmployee(
  income: number,
  _expenses?: number,
  _salaryPayments: number = 12
): TaxBreakdown {
  const socSecEmployee = income * 0.1378;
  const taxable = income - socSecEmployee;
  const incomeTax = taxable * 0.10;
  const net = income - socSecEmployee - incomeTax;
  const socSecEmployer = income * 0.1918;
  const entireExpense = income + socSecEmployer;
  return {
    tax: socSecEmployee + incomeTax,
    net,
    entireExpense,
    breakdown: {
      'Gross': income,
      'Employee Social Security (13.78%)': socSecEmployee,
      'Employer Social Security (19.18%)': socSecEmployer,
      'Taxable Income': taxable,
      'Income Tax (10%)': incomeTax,
      'Net Salary': net,
      'Entire Expense': entireExpense,
    },
  };
}

// 2025 GREECE (Employee)
function greeceEmployee(
  income: number,
  _expenses?: number,
  salaryPayments: number = 14
): TaxBreakdown {
  const annualGross = income * salaryPayments;
  const socSecRate = 0.1412;
  const monthlySocSec = income * socSecRate;
  const annualSocSec = monthlySocSec * salaryPayments;
  const annualTaxable = annualGross - annualSocSec;
  let annualIncomeTax = 0;
  if (annualTaxable <= 10000) annualIncomeTax = annualTaxable * 0.09;
  else if (annualTaxable <= 20000) annualIncomeTax = 10000 * 0.09 + (annualTaxable - 10000) * 0.22;
  else if (annualTaxable <= 30000) annualIncomeTax = 10000 * 0.09 + 10000 * 0.22 + (annualTaxable - 20000) * 0.28;
  else if (annualTaxable <= 40000) annualIncomeTax = 10000 * 0.09 + 10000 * 0.22 + 10000 * 0.28 + (annualTaxable - 30000) * 0.36;
  else annualIncomeTax = 10000 * 0.09 + 10000 * 0.22 + 10000 * 0.28 + 10000 * 0.36 + (annualTaxable - 40000) * 0.44;
  let solidarity = 0;
  if (annualTaxable > 12000 && annualTaxable <= 20000) solidarity = (annualTaxable - 12000) * 0.022;
  else if (annualTaxable > 20000 && annualTaxable <= 30000) solidarity = 8000 * 0.022 + (annualTaxable - 20000) * 0.05;
  else if (annualTaxable > 30000 && annualTaxable <= 40000) solidarity = 8000 * 0.022 + 10000 * 0.05 + (annualTaxable - 30000) * 0.06;
  else if (annualTaxable > 40000) solidarity = 8000 * 0.022 + 10000 * 0.05 + 10000 * 0.06 + (annualTaxable - 40000) * 0.08;
  const netAnnual = annualGross - annualSocSec - annualIncomeTax - solidarity;
  const netMonthly = netAnnual / salaryPayments;
  const employerSocSecRate = 0.2229;
  const monthlyEmployerSocSec = income * employerSocSecRate;
  const annualEmployerSocSec = monthlyEmployerSocSec * salaryPayments;
  const entireExpense = annualGross + annualEmployerSocSec;
  return {
    tax: annualSocSec + annualIncomeTax + solidarity,
    net: netMonthly,
    entireExpense: entireExpense / salaryPayments,
    breakdown: {
      'Gross (monthly)': income,
      'Gross (annual)': annualGross,
      'Employee Social Security (monthly)': monthlySocSec,
      'Employee Social Security (annual)': annualSocSec,
      'Employer Social Security (monthly)': monthlyEmployerSocSec,
      'Employer Social Security (annual)': annualEmployerSocSec,
      'Taxable Income (annual)': annualTaxable,
      'Income Tax (annual)': annualIncomeTax,
      'Solidarity Contribution (annual)': solidarity,
      'Net Salary (annual)': netAnnual,
      'Net Salary (monthly)': netMonthly,
      'Entire Expense (annual)': entireExpense,
      'Entire Expense (monthly)': entireExpense / salaryPayments,
    },
  };
}

export const taxRules: TaxRules = {
  Bulgaria: {
    Employee: bulgariaEmployee,
    'Self-Employed': (income, expenses = 0, _salaryPayments = 12) => {
      const taxable = income - expenses;
      const tax = taxable * 0.15;
      const net = taxable * 0.85;
      const entireExpense = income;
      return { tax, net, entireExpense, breakdown: { 'Flat Tax': tax, 'Net': net, 'Entire Expense': entireExpense } };
    },
    'Small Business': (income, expenses = 0, _salaryPayments = 12) => {
      const taxable = income - expenses;
      const tax = taxable * 0.12;
      const net = taxable * 0.88;
      const entireExpense = income;
      return { tax, net, entireExpense, breakdown: { 'Flat Tax': tax, 'Net': net, 'Entire Expense': entireExpense } };
    },
  },
  Estonia: {
    Employee: estoniaEmployee,
    'Self-Employed': (income, expenses = 0, _salaryPayments = 12) => {
      const taxable = income - expenses;
      const tax = taxable * 0.25;
      const net = taxable * 0.75;
      const entireExpense = income;
      return { tax, net, entireExpense, breakdown: { 'Flat Tax': tax, 'Net': net, 'Entire Expense': entireExpense } };
    },
    'Small Business': (income, expenses = 0, _salaryPayments = 12) => {
      const taxable = income - expenses;
      const tax = taxable * 0.2;
      const net = taxable * 0.8;
      const entireExpense = income;
      return { tax, net, entireExpense, breakdown: { 'Flat Tax': tax, 'Net': net, 'Entire Expense': entireExpense } };
    },
  },
  Greece: {
    Employee: greeceEmployee,
    'Self-Employed': (income, expenses = 0, _salaryPayments = 14) => {
      const taxable = income - expenses;
      const tax = taxable * 0.26;
      const net = taxable * 0.74;
      const entireExpense = income;
      return { tax, net, entireExpense, breakdown: { 'Flat Tax': tax, 'Net': net, 'Entire Expense': entireExpense } };
    },
    'Small Business': (income, expenses = 0, _salaryPayments = 14) => {
      const taxable = income - expenses;
      const tax = taxable * 0.24;
      const net = taxable * 0.76;
      const entireExpense = income;
      return { tax, net, entireExpense, breakdown: { 'Flat Tax': tax, 'Net': net, 'Entire Expense': entireExpense } };
    },
  },
};

// --- Inversion utilities ---

function binarySearchGross(
  fn: (gross: number) => number,
  target: number,
  min: number,
  max: number,
  tolerance = 0.01,
  maxIter = 50
): number {
  let low = min;
  let high = max;
  let mid = 0;
  for (let i = 0; i < maxIter; i++) {
    mid = (low + high) / 2;
    const value = fn(mid);
    if (Math.abs(value - target) < tolerance) return mid;
    if (value > target) high = mid;
    else low = mid;
  }
  return mid;
}

// Bulgaria
export function findBulgariaGrossForNet(net: number): number {
  return net / 0.77598;
}
export function findBulgariaGrossForEntireExpense(entire: number): number {
  return entire / 1.1918;
}

// Estonia
export function findEstoniaGrossForNet(net: number): number {
  return binarySearchGross(
    (gross) => {
      const calc = estoniaEmployee(gross);
      return calc.net;
    },
    net,
    net,
    net * 2
  );
}
export function findEstoniaGrossForEntireExpense(entire: number): number {
  return entire / 1.338;
}

// Greece
export function findGreeceGrossForNet(net: number, salaryPayments: number): number {
  return binarySearchGross(
    (gross) => {
      const calc = greeceEmployee(gross, 0, salaryPayments);
      return calc.net;
    },
    net,
    net,
    net * 2
  );
}
export function findGreeceGrossForEntireExpense(entire: number, salaryPayments: number): number {
  return entire / 1.2229;
}

