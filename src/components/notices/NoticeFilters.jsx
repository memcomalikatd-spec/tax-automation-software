import React, { useState, useMemo } from 'react';
import { Search, Filter, X, Calendar, AlertCircle, Link as LinkIcon } from 'lucide-react';

const NoticeFilters = ({ 
  filters = {},
  onFilterChange,
  onClearFilters,
  noticeStats
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const {
    search: searchTerm = '',
    status: statusFilter = 'All',
    priority: priorityFilter = 'All',
    noticeType: noticeTypeFilter = 'All',
    linkStatus: linkStatusFilter = 'All',
    dateFrom = '',
    dateTo = ''
  } = filters;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'All') count++;
    if (priorityFilter !== 'All') count++;
    if (noticeTypeFilter !== 'All') count++;
    if (linkStatusFilter !== 'All') count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [searchTerm, statusFilter, priorityFilter, noticeTypeFilter, linkStatusFilter, dateFrom, dateTo]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
      {/* Main Filter Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by client, CNIC/NTN, notice type..."
              value={searchTerm}
              onChange={(e) => onFilterChange?.('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => onFilterChange?.('search', '')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onFilterChange?.('status', e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="All">All Status</option>
          <option value="Received">Received</option>
          <option value="Under Review">Under Review</option>
          <option value="Response Drafted">Response Drafted</option>
          <option value="Responded">Responded</option>
          <option value="Closed">Closed</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => onFilterChange?.('priority', e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="All">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>

        {/* Link Status Filter */}
        <select
          value={linkStatusFilter}
          onChange={(e) => onFilterChange?.('linkStatus', e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="All">All Notices</option>
          <option value="Linked">Linked to Client</option>
          <option value="Unlinked">Unlinked</option>
        </select>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
        >
          <Filter className="w-4 h-4" />
          Advanced
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Notice Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notice Type
              </label>
              <select
                value={noticeTypeFilter}
                onChange={(e) => onFilterChange?.('noticeType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="All">All Types</option>
                <option value="demand">Demand Notice</option>
                <option value="audit">Audit Notice</option>
                <option value="penalty">Penalty Notice</option>
                <option value="withholding">Withholding Tax</option>
                <option value="sales_tax">Sales Tax</option>
                <option value="income_tax">Income Tax</option>
                <option value="compliance">Compliance</option>
                <option value="assessment">Assessment</option>
                <option value="refund">Refund</option>
                <option value="appeal">Appeal</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Uploaded From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onFilterChange?.('dateFrom', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Uploaded To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onFilterChange?.('dateTo', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {noticeStats && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {noticeStats.total}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Notices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {noticeStats.overdue}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {noticeStats.dueThisWeek}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Due This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {noticeStats.linked}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Linked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {noticeStats.unlinked}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Unlinked</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeFilters;
