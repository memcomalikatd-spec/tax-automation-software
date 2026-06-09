// Notice Helper Functions

/**
 * Calculate priority based on due date
 * @param {string} dueDate - Due date in ISO format
 * @returns {string} Priority level: 'High', 'Medium', or 'Low'
 */
export const calculatePriority = (dueDate) => {
  if (!dueDate) return 'Medium';
  
  const today = new Date();
  const deadline = new Date(dueDate);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'High'; // Overdue
  if (diffDays <= 7) return 'High'; // Due within 7 days
  if (diffDays <= 14) return 'Medium'; // Due within 14 days
  return 'Low'; // More than 14 days
};

/**
 * Format notice type for display
 * @param {string} noticeType - Raw notice type
 * @returns {string} Formatted notice type
 */
export const formatNoticeType = (noticeType) => {
  if (!noticeType || noticeType === 'unknown') return 'General Notice';
  
  const typeMap = {
    'demand': 'Demand Notice',
    'audit': 'Audit Notice',
    'penalty': 'Penalty Notice',
    'withholding': 'Withholding Tax Notice',
    'sales_tax': 'Sales Tax Notice',
    'income_tax': 'Income Tax Notice',
    'compliance': 'Compliance Notice',
    'assessment': 'Assessment Notice',
    'refund': 'Refund Notice',
    'appeal': 'Appeal Notice'
  };
  
  return typeMap[noticeType.toLowerCase()] || noticeType;
};

/**
 * Get notice type category for folder organization
 * @param {string} noticeType - Raw notice type
 * @returns {string} Category name for folder
 */
export const getNoticeCategory = (noticeType) => {
  if (!noticeType || noticeType === 'unknown') return 'General';
  
  const categoryMap = {
    'demand': 'Demand',
    'audit': 'Audit',
    'penalty': 'Penalty',
    'withholding': 'Withholding',
    'sales_tax': 'SalesTax',
    'income_tax': 'IncomeTax',
    'compliance': 'Compliance',
    'assessment': 'Assessment',
    'refund': 'Refund',
    'appeal': 'Appeal'
  };
  
  return categoryMap[noticeType.toLowerCase()] || 'General';
};

/**
 * Sanitize filename component
 * @param {string} value - Value to sanitize
 * @returns {string} Sanitized value
 */
export const sanitizeFileName = (value) => {
  if (!value || typeof value !== 'string') return 'unknown';
  
  // Remove special characters, keep only alphanumeric and basic punctuation
  const cleaned = value
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .trim();
  
  return cleaned || 'unknown';
};

/**
 * Generate notice filename
 * @param {object} noticeData - Notice data object
 * @returns {string} Generated filename
 */
export const generateNoticeFileName = (noticeData) => {
  const clientName = sanitizeFileName(noticeData.clientName || 'Unknown');
  const cnicNtn = sanitizeFileName(noticeData.cnicNtn || 'Unknown');
  const noticeType = sanitizeFileName(getNoticeCategory(noticeData.noticeType));
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  return `${clientName}_${cnicNtn}_${noticeType}_${date}.pdf`;
};

/**
 * Check if notice is overdue
 * @param {string} dueDate - Due date in ISO format
 * @returns {boolean} True if overdue
 */
export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dueDate);
  deadline.setHours(0, 0, 0, 0);
  
  return deadline < today;
};

/**
 * Get days until due date
 * @param {string} dueDate - Due date in ISO format
 * @returns {number} Days until due (negative if overdue)
 */
export const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dueDate);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Format date for display
 * @param {string} dateString - Date in ISO format
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Get status color class
 * @param {string} status - Notice status
 * @returns {object} Color classes for bg and text
 */
export const getStatusColor = (status) => {
  const colorMap = {
    'Received': { bg: 'bg-blue-100', text: 'text-blue-800' },
    'Under Review': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'Response Drafted': { bg: 'bg-purple-100', text: 'text-purple-800' },
    'Responded': { bg: 'bg-green-100', text: 'text-green-800' },
    'Closed': { bg: 'bg-gray-100', text: 'text-gray-800' },
    'Deleted': { bg: 'bg-red-100', text: 'text-red-800' }
  };
  
  return colorMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
};

/**
 * Validate notice data
 * @param {object} noticeData - Notice data to validate
 * @returns {object} Validation result with errors
 */
export const validateNoticeData = (noticeData) => {
  const errors = {};
  
  if (!noticeData.clientName || noticeData.clientName === 'Unknown') {
    errors.clientName = 'Client name is required';
  }
  
  if (!noticeData.noticeType || noticeData.noticeType === 'unknown') {
    errors.noticeType = 'Notice type is required';
  }
  
  if (noticeData.dueDate) {
    const dueDate = new Date(noticeData.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.dueDate = 'Invalid due date format';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Search notices by query
 * @param {array} notices - Array of notice objects
 * @param {string} query - Search query
 * @returns {array} Filtered notices
 */
export const searchNotices = (notices, query) => {
  if (!query || !query.trim()) return notices;
  
  const searchLower = query.toLowerCase().trim();
  
  return notices.filter(notice => {
    return (
      notice.clientName?.toLowerCase().includes(searchLower) ||
      notice.cnicNtn?.toLowerCase().includes(searchLower) ||
      notice.noticeType?.toLowerCase().includes(searchLower) ||
      notice.noticeTypeName?.toLowerCase().includes(searchLower) ||
      notice.taxYear?.toLowerCase().includes(searchLower) ||
      notice.description?.toLowerCase().includes(searchLower) ||
      notice.category?.toLowerCase().includes(searchLower)
    );
  });
};

/**
 * Filter notices by criteria
 * @param {array} notices - Array of notice objects
 * @param {object} filters - Filter criteria
 * @returns {array} Filtered notices
 */
export const filterNotices = (notices, filters) => {
  let filtered = [...notices];
  
  // Filter by status
  if (filters.status && filters.status !== 'All Status') {
    filtered = filtered.filter(n => n.status === filters.status);
  }
  
  // Filter by priority
  if (filters.priority && filters.priority !== 'All Priorities') {
    filtered = filtered.filter(n => n.priority === filters.priority);
  }
  
  // Filter by notice type
  if (filters.noticeType && filters.noticeType !== 'All Types') {
    filtered = filtered.filter(n => n.noticeType === filters.noticeType);
  }
  
  // Filter by linked/unlinked
  if (filters.linkStatus === 'Linked') {
    filtered = filtered.filter(n => n.clientId !== null);
  } else if (filters.linkStatus === 'Unlinked') {
    filtered = filtered.filter(n => n.clientId === null);
  }
  
  // Filter by date range
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filtered = filtered.filter(n => {
      const uploadDate = new Date(n.uploaded_at);
      return uploadDate >= fromDate;
    });
  }
  
  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    filtered = filtered.filter(n => {
      const uploadDate = new Date(n.uploaded_at);
      return uploadDate <= toDate;
    });
  }
  
  return filtered;
};

/**
 * Sort notices by criteria
 * @param {array} notices - Array of notice objects
 * @param {string} sortBy - Sort criteria
 * @returns {array} Sorted notices
 */
export const sortNotices = (notices, sortBy) => {
  const sorted = [...notices];
  
  switch (sortBy) {
    case 'date-desc':
      return sorted.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
    case 'date-asc':
      return sorted.sort((a, b) => new Date(a.uploaded_at) - new Date(b.uploaded_at));
    case 'due-date-asc':
      return sorted.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    case 'due-date-desc':
      return sorted.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate) - new Date(a.dueDate);
      });
    case 'client-asc':
      return sorted.sort((a, b) => (a.clientName || '').localeCompare(b.clientName || ''));
    case 'client-desc':
      return sorted.sort((a, b) => (b.clientName || '').localeCompare(a.clientName || ''));
    case 'priority-desc':
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return sorted.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
    default:
      return sorted;
  }
};

/**
 * Get notice statistics
 * @param {array} notices - Array of notice objects
 * @returns {object} Statistics object
 */
export const getNoticeStatistics = (notices) => {
  const total = notices.length;
  const byStatus = {};
  const byPriority = {};
  const byType = {};
  let overdue = 0;
  let dueThisWeek = 0;
  let unlinked = 0;
  
  notices.forEach(notice => {
    // Count by status
    byStatus[notice.status] = (byStatus[notice.status] || 0) + 1;
    
    // Count by priority
    byPriority[notice.priority] = (byPriority[notice.priority] || 0) + 1;
    
    // Count by type
    const type = formatNoticeType(notice.noticeType);
    byType[type] = (byType[type] || 0) + 1;
    
    // Count overdue
    if (isOverdue(notice.dueDate)) {
      overdue++;
    }
    
    // Count due this week
    const daysUntil = getDaysUntilDue(notice.dueDate);
    if (daysUntil !== null && daysUntil >= 0 && daysUntil <= 7) {
      dueThisWeek++;
    }
    
    // Count unlinked
    if (!notice.clientId) {
      unlinked++;
    }
  });
  
  return {
    total,
    byStatus,
    byPriority,
    byType,
    overdue,
    dueThisWeek,
    unlinked,
    linked: total - unlinked
  };
};

/**
 * Export notices to CSV
 * @param {array} notices - Array of notice objects
 * @returns {string} CSV string
 */
export const exportNoticesCSV = (notices) => {
  const headers = [
    'Client Name',
    'CNIC/NTN',
    'Notice Type',
    'Tax Year',
    'Due Date',
    'Status',
    'Priority',
    'Upload Date',
    'Description'
  ];
  
  const rows = notices.map(notice => [
    notice.clientName || '',
    notice.cnicNtn || '',
    formatNoticeType(notice.noticeType),
    notice.taxYear || '',
    notice.dueDate || '',
    notice.status || '',
    notice.priority || '',
    formatDate(notice.uploaded_at),
    notice.description || ''
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV content
 * @param {string} filename - Filename
 */
export const downloadCSV = (csvContent, filename = 'notices_export.csv') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
