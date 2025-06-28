import * as React from 'react';
import './App.css';
import { countries, taxRules } from './taxRules';
import {
  findBulgariaGrossForNet,
  findBulgariaGrossForEntireExpense,
  findEstoniaGrossForNet,
  findEstoniaGrossForEntireExpense,
  findGreeceGrossForNet,
  findGreeceGrossForEntireExpense,
} from './taxRules';

const inputOptions = [
  { value: 'net', label: 'Net Salary' },
  { value: 'gross', label: 'Gross Salary' },
  { value: 'entire', label: 'Entire Expense' },
];

function App() {
  const [inputType, setInputType] = React.useState('gross');
  const [inputValue, setInputValue] = React.useState('');
  const [salaryPayments, setSalaryPayments] = React.useState(14); // Default to 14 for Greece
  const [results, setResults] = React.useState<any[]>([]);
  const [showDetails, setShowDetails] = React.useState<{ [country: string]: boolean }>({});

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) return;
    const value = Number(inputValue);
    const newResults = countries.map(country => {
      const payments = country === 'Greece' ? salaryPayments : 12;
      let gross = 0;
      if (inputType === 'gross') {
        gross = value;
      } else if (inputType === 'net') {
        if (country === 'Bulgaria') gross = findBulgariaGrossForNet(value);
        else if (country === 'Estonia') gross = findEstoniaGrossForNet(value);
        else if (country === 'Greece') gross = findGreeceGrossForNet(value, payments);
      } else if (inputType === 'entire') {
        if (country === 'Bulgaria') gross = findBulgariaGrossForEntireExpense(value);
        else if (country === 'Estonia') gross = findEstoniaGrossForEntireExpense(value);
        else if (country === 'Greece') gross = findGreeceGrossForEntireExpense(value, payments);
      }
      const calc = taxRules[country]['Employee'](gross, 0, payments);
      return {
        country,
        gross: gross,
        net: calc.net,
        entireExpense: calc.entireExpense,
        breakdown: calc.breakdown,
      };
    });
    setResults(newResults);
    setShowDetails({});
  };

  const inputLabel = inputType === 'net' ? 'Net Monthly Salary'
    : inputType === 'gross' ? 'Gross Monthly Salary'
    : 'Entire Monthly Expense';

  return (
    <div className="container">
      <h1>Tax Comparison Tool</h1>
      <form onSubmit={handleCompare}>
        <div className="form-group">
          <label htmlFor="inputType">I want to enter:</label>
          <select
            id="inputType"
            value={inputType}
            onChange={e => setInputType(e.target.value)}
          >
            {inputOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="inputValue">{inputLabel}</label>
          <input
            id="inputValue"
            type="number"
            placeholder={`Enter ${inputLabel.toLowerCase()}`}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="salaryPayments">Number of salary payments per year (Greece only)</label>
          <select
            id="salaryPayments"
            value={salaryPayments}
            onChange={e => setSalaryPayments(Number(e.target.value))}
          >
            <option value={12}>12</option>
            <option value={14}>14</option>
          </select>
        </div>
        <button type="submit" disabled={!inputValue} className="compare-btn">
          Compare
        </button>
      </form>

      {results.length > 0 && (
        <div className="results">
          <h2>Comparison</h2>
          <table>
            <thead>
              <tr>
                <th>Country</th>
                <th>Gross Salary</th>
                <th>Net Salary</th>
                <th>Entire Expense</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <React.Fragment key={r.country}>
                  <tr>
                    <td>{r.country}</td>
                    <td>{r.gross?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>{r.net?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>{r.entireExpense?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>
                      <button type="button" className="details-btn" onClick={() => setShowDetails(prev => ({ ...prev, [r.country]: !prev[r.country] }))}>
                        {showDetails[r.country] ? 'Hide' : 'Show'} details
                      </button>
                    </td>
                  </tr>
                  {showDetails[r.country] && (
                    <tr>
                      <td colSpan={5}>
                        <div className="breakdown">
                          <strong>Breakdown:</strong>
                          <ul>
                            {Object.entries(r.breakdown).map(([k, v]) => (
                              <li key={k}>{k}: {typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(v)}</li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
