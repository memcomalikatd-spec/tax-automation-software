import React from 'react';

const SimpleWealthStatementSection = ({ data, onUpdate }) => {
  if (!data.hasIncome) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Enable this section to add wealth statement details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <p className="text-sm text-blue-800">
          <strong>Wealth Statement Section</strong>
        </p>
        <p className="text-xs text-gray-600 mt-2">
          This section will contain asset and liability details for wealth reconciliation.
        </p>
        <p className="text-xs text-gray-500 mt-4 italic">
          Coming soon...
        </p>
      </div>
    </div>
  );
};

export default SimpleWealthStatementSection;
