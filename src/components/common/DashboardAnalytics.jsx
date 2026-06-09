import React, { useMemo } from 'react';

export default function DashboardAnalytics({ returns = [] }) {
  // Client Portfolio Overview Stats
  const portfolioStats = useMemo(() => {
    const safeReturns = returns || [];
    const uniqueClients = new Set(safeReturns.map(r => r.cnic_ntn || r.cnicNtn || r.cnic || r.ntn)).size;
    const totalReturns = safeReturns.length;
    
    // Count by status
    const filedCount = safeReturns.filter(r => r.status === 'Filed').length;
    const processedCount = safeReturns.filter(r => r.status === 'Processed').length;
    const pendingCount = safeReturns.filter(r => r.status === 'Pending').length;
    const rejectedCount = safeReturns.filter(r => r.status === 'Rejected').length;
    
    // Count by year
    const currentYear = new Date().getFullYear();
    const currentYearReturns = safeReturns.filter(r => parseInt(r.tax_year || r.taxYear) === currentYear).length;
    
    // Count by return type
    const voluntaryReturns = safeReturns.filter(r => (r.return_type || r.returnType || '').includes('114(1)')).length;
    const noticeReturns = safeReturns.filter(r => (r.return_type || r.returnType || '').includes('114(4)')).length;
    const amendedReturns = safeReturns.filter(r => (r.return_type || r.returnType || '').includes('120')).length;

    return {
      uniqueClients,
      totalReturns,
      filedCount,
      processedCount,
      pendingCount,
      rejectedCount,
      currentYearReturns,
      voluntaryReturns,
      noticeReturns,
      amendedReturns,
      completionRate: totalReturns > 0 ? ((filedCount + processedCount) / totalReturns * 100) : 0
    };
  }, [returns]);

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Clients</p>
              <p className="text-3xl font-bold mt-2">{portfolioStats.uniqueClients}</p>
            </div>
            <svg className="w-12 h-12 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Returns</p>
              <p className="text-3xl font-bold mt-2">{portfolioStats.totalReturns}</p>
            </div>
            <svg className="w-12 h-12 text-green-200" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Filed Returns</p>
              <p className="text-3xl font-bold mt-2">{portfolioStats.filedCount}</p>
            </div>
            <svg className="w-12 h-12 text-orange-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Completion Rate</p>
              <p className="text-3xl font-bold mt-2">{(portfolioStats.completionRate || 0).toFixed(1)}%</p>
            </div>
            <svg className="w-12 h-12 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
