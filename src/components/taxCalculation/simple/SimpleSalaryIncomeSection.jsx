import React, { useEffect } from 'react';

const SimpleSalaryIncomeSection = ({ data, onUpdate }) => {
  const salaryHeads = [
    { code: '1009', label: 'Pay, Wages or Other Remuneration (including Arrears of Salary)' },
    { code: '1049', label: 'Allowances' },
    { code: '1008', label: 'Pension / Annuity u/s 12(2)(f)' },
    { code: '1059', label: 'Expenditure Reimbursement' },
    { code: '1089', label: 'Value of Perquisites (including Transport Monetization for Government Servants)' },
    { code: '1099', label: 'Profits in Lieu of or in Addition to Pay, Wages or Other Remuneration (including Employment Termination Benefits)' }
  ];

  // Initialize fields if not present
  useEffect(() => {
    let updated = false;
    const newData = { ...data };

    salaryHeads.forEach(head => {
      if (!newData[head.code]) {
        newData[head.code] = { total: '', exempt: '', normal: '' };
        updated = true;
      }
    });

    if (updated) {
      onUpdate(newData);
    }
  }, [data]);

  const handleChange = (code, field, value) => {
    const headData = data[code] || { total: '', exempt: '', normal: '' };
    onUpdate({
      ...data,
      [code]: {
        ...headData,
        [field]: value
      }
    });
  };

  const getVal = (code, field) => {
    return data[code]?.[field] || '';
  };

  const calculateSum = (field) => {
    return salaryHeads.reduce((sum, head) => {
      return sum + (parseFloat(data[head.code]?.[field]) || 0);
    }, 0);
  };

  if (!data.hasIncome) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p className="text-sm">Enable this income type to add salary details.</p>
      </div>
    );
  }

  const totalSalary = calculateSum('total');
  const totalExempt = calculateSum('exempt');
  const totalNormal = calculateSum('normal');

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
        <table className="w-full text-sm bg-white border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white border-b border-gray-300">
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-center font-semibold w-24 text-xs uppercase tracking-wider">Code</th>
              <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Total Amount</th>
              <th className="px-4 py-3 text-right font-semibold w-48 text-xs uppercase tracking-wider">Amount Exempt from Tax / Subject to Fixed / Final Tax</th>
              <th className="px-4 py-3 text-right font-semibold w-40 text-xs uppercase tracking-wider">Amount Subject to Normal Tax</th>
            </tr>
          </thead>
          <tbody>
            {/* Income from Salary - READ ONLY Header Row (Code 1000) */}
            <tr className="bg-blue-100 border-b border-gray-300">
              <td className="px-4 py-4 font-bold text-gray-900">
                Income from Salary
              </td>
              <td className="px-4 py-4 text-center">
                <span className="inline-block px-3 py-1 bg-blue-200 text-blue-900 font-bold rounded text-xs">
                  1000
                </span>
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {totalSalary.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {totalExempt.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {totalNormal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
            </tr>

            {/* Permanent Salary Head Rows */}
            {salaryHeads.map((head) => (
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                {/* Description */}
                <td className="px-4 py-3 text-gray-800 font-medium">
                  {head.label}
                </td>

                {/* Code */}
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded text-xs border border-gray-300">
                    {head.code}
                  </span>
                </td>

                {/* Total Amount Input */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'total')}
                      onChange={(e) => handleChange(head.code, 'total', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2 text-xs text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-colors hover:border-gray-400"
                    />
                  </div>
                </td>

                {/* Exempt Amount Input */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'exempt')}
                      onChange={(e) => handleChange(head.code, 'exempt', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2 text-xs text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-colors hover:border-gray-400"
                    />
                  </div>
                </td>

                {/* Normal Tax Amount Input */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      value={getVal(head.code, 'normal')}
                      onChange={(e) => handleChange(head.code, 'normal', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2 text-xs text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 font-semibold transition-colors hover:border-gray-400"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-xs text-blue-900">
        <p>
          <strong>FBR IRIS Integration:</strong> All salary codes from 1009 to 1099 are shown permanently. The header row 1000 displays the aggregate values automatically.
        </p>
      </div>
    </div>
  );
};

export default SimpleSalaryIncomeSection;
