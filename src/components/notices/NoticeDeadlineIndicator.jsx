import React from 'react';

const NoticeDeadlineIndicator = ({ dueDate }) => {
  if (!dueDate) {
    return <span className="text-gray-400 text-sm">No deadline</span>;
  }

  const today = new Date();
  const deadline = new Date(dueDate);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let colorClass = 'text-gray-600';
  let bgClass = 'bg-gray-100';
  let label = '';

  if (diffDays < 0) {
    colorClass = 'text-red-700';
    bgClass = 'bg-red-100';
    label = `Overdue by ${Math.abs(diffDays)} days`;
  } else if (diffDays === 0) {
    colorClass = 'text-red-700';
    bgClass = 'bg-red-100';
    label = 'Due today';
  } else if (diffDays <= 7) {
    colorClass = 'text-red-600';
    bgClass = 'bg-red-50';
    label = `${diffDays} days left`;
  } else if (diffDays <= 14) {
    colorClass = 'text-yellow-600';
    bgClass = 'bg-yellow-50';
    label = `${diffDays} days left`;
  } else {
    colorClass = 'text-green-600';
    bgClass = 'bg-green-50';
    label = `${diffDays} days left`;
  }

  return (
    <div className="flex flex-col">
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${bgClass} ${colorClass}`}>
        {label}
      </span>
      <span className="text-xs text-gray-500 mt-1">
        {deadline.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
};

export default NoticeDeadlineIndicator;
