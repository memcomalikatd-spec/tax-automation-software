/**
 * Notice Export and Reporting Utilities
 * Handles exporting notices to Excel and generating reports
 */

import * as XLSX from 'xlsx';

/**
 * Export notices to Excel
 * @param {Array} notices - Array of notice objects
 * @param {string} filename - Output filename
 */
export const exportNoticesToExcel = (notices, filename = 'notices-export.xlsx') => {
  if (!notices || notices.length === 0) {
    alert('No notices to export');
    return;
  }

  // Prepare data for export
  const exportData = notices.map(notice => ({
    'Notice ID': notice.id,
    'Client Name': notice.clientName,
    'Linked Client': notice.linkedClient?.name || 'Not Linked',
    'Match Confidence': notice.matchConfidence ? `${notice.matchConfidence}%` : 'N/A',
    'Notice Type': notice.noticeTypeName,
    'Section': notice.noticeType,
    'Status': notice.status,
    'Priority': notice.priority,
    'Tax Year': notice.taxYear,
    'Amount': notice.amount,
    'Due Date': notice.dueDate ? new Date(notice.dueDate).toLocaleDateString() : 'Not specified',
    'Days Until Due': notice.dueDate ? calculateDaysUntilDue(notice.dueDate) : 'N/A',
    'Description': notice.description,
    'Uploaded At': notice.uploadedAt ? new Date(notice.uploadedAt).toLocaleString() : 'N/A',
    'File Name': notice.renamedFileName || 'N/A',
    'Client NTN': notice.linkedClient?.ntn || 'N/A',
    'Client Phone': notice.linkedClient?.phone || 'N/A',
    'Client Email': notice.linkedClient?.email || 'N/A'
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create main sheet
  const ws = XLSX.utils.json_to_sheet(exportData);
  
  // Set column widths
  const colWidths = [
    { wch: 12 }, // Notice ID
    { wch: 25 }, // Client Name
    { wch: 25 }, // Linked Client
    { wch: 15 }, // Match Confidence
    { wch: 30 }, // Notice Type
    { wch: 12 }, // Section
    { wch: 18 }, // Status
    { wch: 12 }, // Priority
    { wch: 12 }, // Tax Year
    { wch: 15 }, // Amount
    { wch: 15 }, // Due Date
    { wch: 15 }, // Days Until Due
    { wch: 50 }, // Description
    { wch: 20 }, // Uploaded At
    { wch: 30 }, // File Name
    { wch: 15 }, // Client NTN
    { wch: 15 }, // Client Phone
    { wch: 25 }  // Client Email
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Notices');

  // Create summary sheet
  const summary = generateNoticeSummary(notices);
  const summaryWs = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Create statistics sheet
  const stats = generateNoticeStatistics(notices);
  const statsWs = XLSX.utils.json_to_sheet(stats);
  XLSX.utils.book_append_sheet(wb, statsWs, 'Statistics');

  // Write file
  XLSX.writeFile(wb, filename);
};

/**
 * Calculate days until due date
 */
const calculateDaysUntilDue = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else {
    return `${diffDays} days`;
  }
};

/**
 * Generate notice summary
 */
const generateNoticeSummary = (notices) => {
  const totalNotices = notices.length;
  const statusCounts = {};
  const priorityCounts = {};
  const linkedCount = notices.filter(n => n.linkedClient).length;
  
  notices.forEach(notice => {
    statusCounts[notice.status] = (statusCounts[notice.status] || 0) + 1;
    priorityCounts[notice.priority] = (priorityCounts[notice.priority] || 0) + 1;
  });

  const overdueCount = notices.filter(n => {
    if (!n.dueDate) return false;
    const daysUntil = Math.ceil((new Date(n.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil < 0;
  }).length;

  const urgentCount = notices.filter(n => {
    if (!n.dueDate) return false;
    const daysUntil = Math.ceil((new Date(n.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 3;
  }).length;

  return [
    { Metric: 'Total Notices', Value: totalNotices },
    { Metric: 'Linked to Clients', Value: linkedCount },
    { Metric: 'Not Linked', Value: totalNotices - linkedCount },
    { Metric: 'Overdue Notices', Value: overdueCount },
    { Metric: 'Urgent (Due in 3 Days)', Value: urgentCount },
    { Metric: '', Value: '' },
    { Metric: 'Status Breakdown', Value: '' },
    ...Object.entries(statusCounts).map(([status, count]) => ({
      Metric: `  ${status}`,
      Value: count
    })),
    { Metric: '', Value: '' },
    { Metric: 'Priority Breakdown', Value: '' },
    ...Object.entries(priorityCounts).map(([priority, count]) => ({
      Metric: `  ${priority}`,
      Value: count
    }))
  ];
};

/**
 * Generate notice statistics
 */
const generateNoticeStatistics = (notices) => {
  const stats = [];

  // Group by status
  const byStatus = {};
  notices.forEach(notice => {
    if (!byStatus[notice.status]) {
      byStatus[notice.status] = [];
    }
    byStatus[notice.status].push(notice);
  });

  Object.entries(byStatus).forEach(([status, noticeList]) => {
    stats.push({
      Category: 'Status',
      Type: status,
      Count: noticeList.length,
      Percentage: `${((noticeList.length / notices.length) * 100).toFixed(1)}%`
    });
  });

  // Group by priority
  const byPriority = {};
  notices.forEach(notice => {
    if (!byPriority[notice.priority]) {
      byPriority[notice.priority] = [];
    }
    byPriority[notice.priority].push(notice);
  });

  Object.entries(byPriority).forEach(([priority, noticeList]) => {
    stats.push({
      Category: 'Priority',
      Type: priority,
      Count: noticeList.length,
      Percentage: `${((noticeList.length / notices.length) * 100).toFixed(1)}%`
    });
  });

  // Group by notice type
  const byType = {};
  notices.forEach(notice => {
    const type = notice.noticeTypeName || 'Unknown';
    if (!byType[type]) {
      byType[type] = [];
    }
    byType[type].push(notice);
  });

  Object.entries(byType).forEach(([type, noticeList]) => {
    stats.push({
      Category: 'Notice Type',
      Type: type,
      Count: noticeList.length,
      Percentage: `${((noticeList.length / notices.length) * 100).toFixed(1)}%`
    });
  });

  return stats;
};

/**
 * Export filtered notices
 */
export const exportFilteredNotices = (notices, filters, filename) => {
  let filtered = [...notices];

  // Apply status filter
  if (filters.status && filters.status !== 'All Status') {
    filtered = filtered.filter(n => n.status === filters.status);
  }

  // Apply priority filter
  if (filters.priority && filters.priority !== 'All Priorities') {
    filtered = filtered.filter(n => n.priority === filters.priority);
  }

  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(n => 
      n.clientName?.toLowerCase().includes(searchLower) ||
      n.noticeTypeName?.toLowerCase().includes(searchLower) ||
      n.description?.toLowerCase().includes(searchLower)
    );
  }

  exportNoticesToExcel(filtered, filename);
};

/**
 * Generate notice report PDF (placeholder for future implementation)
 */
export const generateNoticeReport = (notices) => {
  // TODO: Implement PDF generation using jsPDF or similar library
  console.log('PDF report generation coming soon');
  alert('PDF report generation will be available in the next update');
};

/**
 * Export notice statistics as JSON
 */
export const exportNoticeStatisticsJSON = (notices) => {
  const stats = {
    generatedAt: new Date().toISOString(),
    totalNotices: notices.length,
    byStatus: {},
    byPriority: {},
    byType: {},
    deadlines: {
      overdue: 0,
      urgent: 0,
      thisWeek: 0,
      thisMonth: 0
    },
    clientLinking: {
      linked: 0,
      notLinked: 0,
      averageConfidence: 0
    }
  };

  // Calculate statistics
  notices.forEach(notice => {
    // Status
    stats.byStatus[notice.status] = (stats.byStatus[notice.status] || 0) + 1;
    
    // Priority
    stats.byPriority[notice.priority] = (stats.byPriority[notice.priority] || 0) + 1;
    
    // Type
    const type = notice.noticeTypeName || 'Unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
    
    // Deadlines
    if (notice.dueDate) {
      const daysUntil = Math.ceil((new Date(notice.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) stats.deadlines.overdue++;
      else if (daysUntil <= 3) stats.deadlines.urgent++;
      else if (daysUntil <= 7) stats.deadlines.thisWeek++;
      else if (daysUntil <= 30) stats.deadlines.thisMonth++;
    }
    
    // Client linking
    if (notice.linkedClient) {
      stats.clientLinking.linked++;
      if (notice.matchConfidence) {
        stats.clientLinking.averageConfidence += notice.matchConfidence;
      }
    } else {
      stats.clientLinking.notLinked++;
    }
  });

  // Calculate average confidence
  if (stats.clientLinking.linked > 0) {
    stats.clientLinking.averageConfidence = 
      (stats.clientLinking.averageConfidence / stats.clientLinking.linked).toFixed(1);
  }

  // Download as JSON
  const dataStr = JSON.stringify(stats, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `notice-statistics-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
