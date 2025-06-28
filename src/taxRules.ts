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

// 2025 ESTONIA (Employee):
// Source: https://www.kalkulaator.ee/ru/kalkulyator-zarplaty
// - Employee pays: Unemployment insurance 1.6%, Funded pension (II pillar) 2% (if enrolled), Income tax 20% on (gross - unemp - pension - non-taxable min)
// - Non-taxable minimum: €654/month (up to €14,400/year), phased out between €14,400 and €25,200, zero above €25,200
// - Employer pays: Social tax 33%, Unemployment insurance 0.8% (not deducted from net)
function estoniaEmployee(
  income: number,
  _expenses?: number,
  _salaryPayments: number = 12
): TaxBreakdown {
  // 1. Gross salary (monthly)
  const gross = income;
  // 2. Funded pension (2%)
  const pension = gross * 0.02;
  // 3. Employee unemployment insurance (1.6%)
  const unemp = gross * 0.016;
  // 4. Monthly tax-free allowance (phase-out logic)
  let annualGross = gross * 12;
  let annualTaxFree = 654 * 12;
  if (annualGross > 14400 && annualGross <= 25200) {
    annualTaxFree = 7848 - 7848 * ((annualGross - 14400) / 10800);
  } else if (annualGross > 25200) {
    annualTaxFree = 0;
  }
  const taxFree = annualTaxFree / 12;
  // 5. Taxable income
  const taxable = gross - pension - unemp - taxFree;
  // 6. Income tax (22%)
  const incomeTax = Math.max(0, taxable * 0.22);
  // 7. Net salary
  const net = gross - pension - unemp - incomeTax;
  // Employer-side (not deducted from net)
  const socialTax = gross * 0.33;
  const employerUnemp = gross * 0.008;
  const entireExpense = gross + socialTax + employerUnemp;
  // Debug log
  console.log('[ESTONIA DEBUG]', {
    gross,
    pension,
    unemp,
    taxFree,
    taxable,
    incomeTax,
    net,
    socialTax,
    employerUnemp
  });
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

// 2025 BULGARIA (Employee):
// Source: https://kik-info.com/trz/zaplata.php
// - Social security (employee): pension 8.78%, health 3.2%, unemployment 1%, total 12.98% (employee)
// - Social security (employer): pension 13.78%, health 4.8%, unemployment 0.6%, total 19.18% (employer)
// - Income tax: 10% on taxable income (after social security)
// - No non-taxable minimum
// - Minimum and maximum insurance thresholds apply (2025: min 933 BGN, max 3750 BGN)
function bulgariaEmployee(
  income: number,
  _expenses?: number,
  _salaryPayments: number = 12 // Not used, but for signature compatibility
): TaxBreakdown {
  // 1. Employee social security (flat 13.78% of gross)
  const socSecEmployee = income * 0.1378;

  // 2. Taxable income
  const taxable = income - socSecEmployee;

  // 3. Income tax (10%)
  const incomeTax = taxable * 0.10;

  // 4. Net salary
  const net = income - socSecEmployee - incomeTax;

  // Employer social security (19.18% of gross)
  const socSecEmployer = income * 0.1918;
  const entireExpense = income + socSecEmployer;

  // Debug log
  console.log('[BULGARIA DEBUG]', {
    income,
    socSecEmployee,
    taxable,
    incomeTax,
    net
  });

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

// 2025 GREECE (Employee):
// Sources: gov.gr, PwC, KPMG, Deloitte
// - Social security (employee): 14.12% (IKA/EFKA)
// - Social security (employer): 22.29%
// - Income tax: 9% up to €10,000, 22% for €10,001–20,000, 28% for €20,001–30,000, 36% for €30,001–40,000, 44% above €40,000
// - Solidarity tax abolished for employment income
// - No non-taxable minimum for employees, but tax-free threshold via tax credit (up to €777 for singles)
function greeceEmployee(
  income: number,
  _expenses?: number,
  salaryPayments: number = 14 // Default to 14 if not provided
): TaxBreakdown {
  // 1. Annualization
  const annualGross = income * salaryPayments;

  // 2. Social Security (employee, 14.12% of gross monthly)
  const socSecRate = 0.1412;
  const monthlySocSec = income * socSecRate;
  const annualSocSec = monthlySocSec * salaryPayments;

  // 3. Taxable income (annual)
  const annualTaxable = annualGross - annualSocSec;

  // 4. Income tax (progressive, annual)
  let annualIncomeTax = 0;
  if (annualTaxable <= 10000) annualIncomeTax = annualTaxable * 0.09;
  else if (annualTaxable <= 20000) annualIncomeTax = 10000 * 0.09 + (annualTaxable - 10000) * 0.22;
  else if (annualTaxable <= 30000) annualIncomeTax = 10000 * 0.09 + 10000 * 0.22 + (annualTaxable - 20000) * 0.28;
  else if (annualTaxable <= 40000) annualIncomeTax = 10000 * 0.09 + 10000 * 0.22 + 10000 * 0.28 + (annualTaxable - 30000) * 0.36;
  else annualIncomeTax = 10000 * 0.09 + 10000 * 0.22 + 10000 * 0.28 + 10000 * 0.36 + (annualTaxable - 40000) * 0.44;

  // 5. Solidarity contribution (progressive, annual)
  let solidarity = 0;
  if (annualTaxable > 12000 && annualTaxable <= 20000) solidarity = (annualTaxable - 12000) * 0.022;
  else if (annualTaxable > 20000 && annualTaxable <= 30000) solidarity = 8000 * 0.022 + (annualTaxable - 20000) * 0.05;
  else if (annualTaxable > 30000 && annualTaxable <= 40000) solidarity = 8000 * 0.022 + 10000 * 0.05 + (annualTaxable - 30000) * 0.06;
  else if (annualTaxable > 40000) solidarity = 8000 * 0.022 + 10000 * 0.05 + 10000 * 0.06 + (annualTaxable - 40000) * 0.08;

  // 6. Net annual salary
  const netAnnual = annualGross - annualSocSec - annualIncomeTax - solidarity;
  // 7. Net monthly salary
  const netMonthly = netAnnual / salaryPayments;

  // Employer social security (22.29% of gross monthly)
  const employerSocSecRate = 0.2229;
  const monthlyEmployerSocSec = income * employerSocSecRate;
  const annualEmployerSocSec = monthlyEmployerSocSec * salaryPayments;
  const entireExpense = annualGross + annualEmployerSocSec;

  // Debug log
  console.log('[GREECE DEBUG]', {
    income,
    salaryPayments,
    annualGross,
    monthlySocSec,
    annualSocSec,
    annualTaxable,
    annualIncomeTax,
    solidarity,
    netAnnual,
    netMonthly
  });

  return {
    tax: annualSocSec + annualIncomeTax + solidarity,
    net: netMonthly,
    entireExpense: entireExpense / salaryPayments, // monthly entire expense
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

// TODO: Add detailed logic for Self-Employed and Small Business for each country

export const taxRules: TaxRules = {
  Bulgaria: {
    Employee: bulgariaEmployee,
    'Self-Employed': (income, expenses = 0, _salaryPayments = 12) => {
      // Placeholder: flat 15% tax on (income - expenses)
      const taxable = income - expenses;
      const tax = taxable * 0.15;
      const net = taxable * 0.85;
      const entireExpense = income; // No employer contributions in placeholder
      return { tax, net, entireExpense, breakdown: { 'Flat Tax': tax, 'Net': net, 'Entire Expense': entireExpense } };
    },
    'Small Business': (income, expenses = 0, _salaryPayments = 12) => {
      // Placeholder: flat 12% tax on (income - expenses)
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
      // Placeholder: flat 25% tax on (income - expenses)
      const taxable = income - expenses;
      const tax = taxable * 0.25;
      const net = taxable * 0.75;
      const entireExpense = income;
      return { tax, net, entireExpense, breakdown: { 'Flat Tax': tax, 'Net': net, 'Entire Expense': entireExpense } };
    },
    'Small Business': (income, expenses = 0, _salaryPayments = 12) => {
      // Placeholder: flat 20% tax on (income - expenses)
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
      // Placeholder: flat 26% tax on (income - expenses)
      const taxable = income - expenses;
      const tax = taxable * 0.26;
      const net = taxable * 0.74;
      const entireExpense = income;
      return { tax, net, entireExpense, breakdown: { 'Flat Tax': tax, 'Net': net, 'Entire Expense': entireExpense } };
    },
    'Small Business': (income, expenses = 0, _salaryPayments = 14) => {
      // Placeholder: flat 24% tax on (income - expenses)
      const taxable = income - expenses;
      const tax = taxable * 0.24;
      const net = taxable * 0.76;
      const entireExpense = income;
      return { tax, net, entireExpense, breakdown: { 'Flat Tax': tax, 'Net': net, 'Entire Expense': entireExpense } };
    },
  },
};

// --- Inversion utilities ---

// Generic binary search for monotonic functions
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
  // net = gross - 0.1378*gross - 0.10*(gross-0.1378*gross)
  // net = gross - 0.1378*gross - 0.10*(gross*0.8622)
  // net = gross - 0.1378*gross - 0.08622*gross
  // net = gross * (1 - 0.1378 - 0.08622)
  // net = gross * 0.77598
  // gross = net / 0.77598
  return net / 0.77598;
}
export function findBulgariaGrossForEntireExpense(entire: number): number {
  // entire = gross + 0.1918*gross = gross*1.1918
  return entire / 1.1918;
}

// Estonia
export function findEstoniaGrossForNet(net: number): number {
  // Use binary search since tax-free allowance is phased out
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
  // entire = gross + 0.33*gross + 0.008*gross = gross*1.338
  return entire / 1.338;
}

// Greece
export function findGreeceGrossForNet(net: number, salaryPayments: number): number {
  // Use binary search due to progressive tax
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
  // entire = annualGross + annualEmployerSocSec
  // annualGross = gross * salaryPayments
  // annualEmployerSocSec = gross * 0.2229 * salaryPayments
  // entire = gross * salaryPayments * (1 + 0.2229) = gross * salaryPayments * 1.2229
  // entire (monthly) = gross * 1.2229
  return entire / 1.2229;
} 
