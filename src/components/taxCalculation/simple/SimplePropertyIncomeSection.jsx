import React, { useEffect } from 'react';

const SimplePropertyIncomeSection = ({ data, onUpdate }) => {
  // Receipts sections (2029 sub-items)
  const receiptHeads = [
    { code: '2001', label: 'Rent Received or Receivable' },
    { code: '2002', label: '1/10th of Amount not Adjustable against Rent' },
    { code: '2003', label: 'Forfeited Deposit under a Contract for Sale of Property' },
    { code: '2004', label: 'Recovery of Unpaid Irrecoverable Rent allowed as deduction' },
    { code: '2005', label: 'Unpaid Liabilities exceeding three Years' }
  ];

  // Deductions sections (2099 sub-items)
  const deductionHeads = [
    { code: '2031', label: '1/5th of Rent of Building for Repairs' },
    { code: '2032', label: 'Insurance Premium' },
    { code: '2033', label: 'Local Rate / Tax / Charge / Cess' },
    { code: '2034', label: 'Ground Rent' },
    { code: '2035', label: 'Profit on Capital borrowed for Investment in Property' },
    { code: '2036', label: 'Share in Rental Income Paid to HBFC / Banks' },
    { code: '2037', label: 'Rent Collection Expenditure' },
    { code: '2038', label: 'Legal Service Charges' },
    { code: '2039', label: 'Amount claimed as Irrecoverable Rent' },
    { code: '2097', label: 'Payment of Liabilities treated as Income' },
    { code: '2098', label: 'Other Deductions against Rent' }
  ];

  const allHeads = [...receiptHeads, ...deductionHeads];

  // Initialize fields if not present
  useEffect(() => {
    let updated = false;
    const newData = { ...data };

    allHeads.forEach(head => {
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

  const calculateSum = (heads, field) => {
    return heads.reduce((sum, head) => {
      return sum + (parseFloat(data[head.code]?.[field]) || 0);
    }, 0);
  };

  if (!data.hasIncome) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p className="text-sm">Enable this income type to add property details.</p>
      </div>
    );
  }

  // Calculate sum of receipts (2029)
  const totalReceiptsTotal = calculateSum(receiptHeads, 'total');
  const totalReceiptsExempt = calculateSum(receiptHeads, 'exempt');
  const totalReceiptsNormal = calculateSum(receiptHeads, 'normal');

  // Calculate sum of deductions (2099)
  const totalDeductionsTotal = calculateSum(deductionHeads, 'total');
  const totalDeductionsExempt = calculateSum(deductionHeads, 'exempt');
  const totalDeductionsNormal = calculateSum(deductionHeads, 'normal');

  // Calculate net income (2000) = Receipts - Deductions
  const netPropertyTotal = Math.max(0, totalReceiptsTotal - totalDeductionsTotal);
  const netPropertyExempt = Math.max(0, totalReceiptsExempt - totalDeductionsExempt);
  const netPropertyNormal = Math.max(0, totalReceiptsNormal - totalDeductionsNormal);

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
            {/* Income / (Loss) from Property - READ ONLY Header Row (Code 2000) */}
            <tr className="bg-amber-100 border-b-2 border-amber-200">
              <td className="px-4 py-4 font-bold text-gray-900">
                Income / (Loss) from Property
              </td>
              <td className="px-4 py-4 text-center">
                <span className="inline-block px-3 py-1 bg-amber-200 text-amber-900 font-bold rounded text-xs">
                  2000
                </span>
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {netPropertyTotal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900">
                Rs. {netPropertyExempt.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-4 text-right font-bold text-gray-900 text-amber-900">
                Rs. {netPropertyNormal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
            </tr>

            {/* Total Receipts from Property - READ ONLY Section Row (Code 2029) */}
            <tr className="bg-gray-100 border-b border-gray-300">
              <td className="px-4 py-3 font-semibold text-gray-800 pl-6">
                Total Receipts from Property
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-semibold text-gray-800 text-xs">2029</span>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-800">
                Rs. {totalReceiptsTotal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-800">
                Rs. {totalReceiptsExempt.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-800">
                Rs. {totalReceiptsNormal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
            </tr>

            {/* Editable Receipt Rows */}
            {receiptHeads.map((head) => (
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700 font-medium pl-10">
                  {head.label}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-55 text-gray-600 font-semibold rounded text-xs border border-gray-200">
                    {head.code}
                  </span>
                </td>
                {/* Total */}
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
                {/* Exempt */}
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
                {/* Normal */}
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

            {/* Total Deductions from Property - READ ONLY Section Row (Code 2099) */}
            <tr className="bg-gray-100 border-b border-gray-300">
              <td className="px-4 py-3 font-semibold text-gray-800 pl-6">
                Total Deductions from Property
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-semibold text-gray-800 text-xs">2099</span>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-800">
                Rs. {totalDeductionsTotal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-800">
                Rs. {totalDeductionsExempt.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-800">
                Rs. {totalDeductionsNormal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </td>
            </tr>

            {/* Editable Deduction Rows */}
            {deductionHeads.map((head) => (
              <tr key={head.code} className="border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700 font-medium pl-10">
                  {head.label}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-gray-55 text-gray-600 font-semibold rounded text-xs border border-gray-200">
                    {head.code}
                  </span>
                </td>
                {/* Total */}
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
                {/* Exempt */}
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
                {/* Normal */}
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
      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 text-xs text-amber-900">
        <p>
          <strong>Property Income (2000):</strong> Calculated as Total Receipts from Property (2029) minus Total Deductions from Property (2099). All fields are editable per FBR IRIS code specifications.
        </p>
      </div>
    </div>
  );
};

export default SimplePropertyIncomeSection;
