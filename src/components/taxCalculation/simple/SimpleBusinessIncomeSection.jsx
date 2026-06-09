import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const SimpleBusinessIncomeSection = ({ data, onUpdate }) => {
  const addEntry = () => {
    onUpdate({
      ...data,
      entries: [
        ...data.entries,
        {
          id: Date.now(),
          grossReceipts: '',
          expenses: '',
          netProfit: ''
        }
      ]
    });
  };

  const removeEntry = (id) => {
    onUpdate({
      ...data,
      entries: data.entries.filter(entry => entry.id !== id)
    });
  };

  const updateEntry = (id, field, value) => {
    const numValue = parseFloat(value) || 0;
    let updatedEntry = { ...value };

    // Find the entry being updated
    const entryToUpdate = data.entries.find(e => e.id === id);
    if (!entryToUpdate) return;

    updatedEntry = { ...entryToUpdate, [field]: value };

    // Auto-calculate net profit
    const gross = parseFloat(updatedEntry.grossReceipts) || 0;
    const expenses = parseFloat(updatedEntry.expenses) || 0;
    updatedEntry.netProfit = Math.max(0, gross - expenses).toString();

    onUpdate({
      ...data,
      entries: data.entries.map(entry =>
        entry.id === id ? updatedEntry : entry
      )
    });
  };

  if (!data.hasIncome) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        Enable this income type to add entries.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.entries.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          No business entries added yet. Click "Add Entry" below.
        </div>
      ) : (
        <div className="space-y-3">
          {data.entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1 grid grid-cols-3 gap-3">
                {/* Gross Receipts */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Gross Receipts <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs.</span>
                    <input
                      type="number"
                      value={entry.grossReceipts}
                      onChange={(e) => updateEntry(entry.id, 'grossReceipts', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Expenses */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Expenses
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs.</span>
                    <input
                      type="number"
                      value={entry.expenses}
                      onChange={(e) => updateEntry(entry.id, 'expenses', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Net Profit (Read-only) */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Net Profit
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs.</span>
                    <input
                      type="number"
                      value={entry.netProfit}
                      readOnly
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeEntry(entry.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-5"
                title="Remove entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Entry Button */}
      <button
        type="button"
        onClick={addEntry}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Entry
      </button>
    </div>
  );
};

export default SimpleBusinessIncomeSection;
