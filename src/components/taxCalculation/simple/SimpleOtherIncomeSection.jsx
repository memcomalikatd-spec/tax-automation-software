import React from 'react';
import { Plus, Trash2, DollarSign } from 'lucide-react';

const SimpleOtherIncomeSection = ({ data, onUpdate }) => {
  const addEntry = () => {
    onUpdate({
      ...data,
      entries: [
        ...data.entries,
        { id: Date.now(), amount: '' }
      ]
    });
  };

  const removeEntry = (id) => {
    onUpdate({
      ...data,
      entries: data.entries.filter(entry => entry.id !== id)
    });
  };

  const updateEntry = (id, value) => {
    onUpdate({
      ...data,
      entries: data.entries.map(entry =>
        entry.id === id ? { ...entry, amount: value } : entry
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
          No other income entries added yet. Click "Add Entry" below.
        </div>
      ) : (
        <div className="space-y-3">
          {data.entries.map(entry => (
            <div key={entry.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs.</span>
                <input
                  type="number"
                  value={entry.amount}
                  onChange={(e) => updateEntry(entry.id, e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => removeEntry(entry.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

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

export default SimpleOtherIncomeSection;
