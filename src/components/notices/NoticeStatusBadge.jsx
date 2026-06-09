import React from 'react';

const NoticeStatusBadge = ({ status }) => {
  const statusConfig = {
    'Received': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Received' },
    'Under Review': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Under Review' },
    'Response Drafted': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Response Drafted' },
    'Responded': { bg: 'bg-green-100', text: 'text-green-800', label: 'Responded' },
    'Closed': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' },
    'Deleted': { bg: 'bg-red-100', text: 'text-red-800', label: 'Deleted' },
  };

  const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'Unknown' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

export default NoticeStatusBadge;
