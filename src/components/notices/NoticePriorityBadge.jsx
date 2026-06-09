import React from 'react';

const NoticePriorityBadge = ({ priority }) => {
  const priorityConfig = {
    'High': { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴', label: 'High' },
    'Medium': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🟡', label: 'Medium' },
    'Low': { bg: 'bg-green-100', text: 'text-green-800', icon: '🟢', label: 'Low' },
  };

  const config = priorityConfig[priority] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '⚪', label: priority || 'Medium' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

export default NoticePriorityBadge;
