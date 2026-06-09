/**
 * Advanced search and filtering utilities for tax returns
 */

/**
 * Filter returns by date range
 * @param {Array} returns - Array of tax return objects
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} dateField - Field to filter by ('processedDate', 'filingDate', 'deadline')
 * @returns {Array} - Filtered returns
 */
export function filterByDateRange(returns, startDate, endDate, dateField = 'processedDate') {
  if (!returns || !Array.isArray(returns)) return [];
  if (!startDate && !endDate) return returns;

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  return returns.filter(ret => {
    const date = new Date(ret[dateField]);
    if (isNaN(date.getTime())) return false;

    if (start && date < start) return false;
    if (end && date > end) return false;

    return true;
  });
}

/**
 * Filter returns by tax year range
 * @param {Array} returns - Array of tax return objects
 * @param {number} startYear - Start year
 * @param {number} endYear - End year
 * @returns {Array} - Filtered returns
 */
export function filterByTaxYearRange(returns, startYear, endYear) {
  if (!returns || !Array.isArray(returns)) return [];
  if (!startYear && !endYear) return returns;

  return returns.filter(ret => {
    const year = parseInt(ret.taxYear);
    if (isNaN(year)) return false;

    if (startYear && year < startYear) return false;
    if (endYear && year > endYear) return false;

    return true;
  });
}

/**
 * Filter returns by income bracket
 * @param {Array} returns - Array of tax return objects
 * @param {number} minIncome - Minimum income
 * @param {number} maxIncome - Maximum income
 * @returns {Array} - Filtered returns
 */
export function filterByIncomeBracket(returns, minIncome, maxIncome) {
  if (!returns || !Array.isArray(returns)) return [];
  if (!minIncome && !maxIncome) return returns;

  return returns.filter(ret => {
    const income = parseFloat(ret.incomeAmount);
    if (isNaN(income)) return false;

    if (minIncome && income < minIncome) return false;
    if (maxIncome && income > maxIncome) return false;

    return true;
  });
}

/**
 * Filter returns by status
 * @param {Array} returns - Array of tax return objects
 * @param {Array} statuses - Array of status strings to include
 * @returns {Array} - Filtered returns
 */
export function filterByStatus(returns, statuses) {
  if (!returns || !Array.isArray(returns)) return [];
  if (!statuses || statuses.length === 0) return returns;

  return returns.filter(ret => {
    const status = ret.status || 'Pending';
    return statuses.includes(status);
  });
}

/**
 * Filter returns by tax paid range
 * @param {Array} returns - Array of tax return objects
 * @param {number} minTax - Minimum tax paid
 * @param {number} maxTax - Maximum tax paid
 * @returns {Array} - Filtered returns
 */
export function filterByTaxPaid(returns, minTax, maxTax) {
  if (!returns || !Array.isArray(returns)) return [];
  if (!minTax && !maxTax) return returns;

  return returns.filter(ret => {
    const tax = parseFloat(ret.taxPaid);
    if (isNaN(tax)) return false;

    if (minTax && tax < minTax) return false;
    if (maxTax && tax > maxTax) return false;

    return true;
  });
}

/**
 * Filter returns by refund amount range
 * @param {Array} returns - Array of tax return objects
 * @param {number} minRefund - Minimum refund
 * @param {number} maxRefund - Maximum refund
 * @returns {Array} - Filtered returns
 */
export function filterByRefund(returns, minRefund, maxRefund) {
  if (!returns || !Array.isArray(returns)) return [];
  if (!minRefund && !maxRefund) return returns;

  return returns.filter(ret => {
    const refund = parseFloat(ret.refundAmount);
    if (isNaN(refund)) return false;

    if (minRefund && refund < minRefund) return false;
    if (maxRefund && refund > maxRefund) return false;

    return true;
  });
}

/**
 * Get high-value returns (above threshold)
 * @param {Array} returns - Array of tax return objects
 * @param {number} threshold - Income threshold (default: 1000000)
 * @returns {Array} - High-value returns
 */
export function getHighValueReturns(returns, threshold = 1000000) {
  if (!returns || !Array.isArray(returns)) return [];
  return returns.filter(ret => {
    const income = parseFloat(ret.incomeAmount);
    return !isNaN(income) && income >= threshold;
  });
}

/**
 * Get returns with urgent deadlines (within days)
 * @param {Array} returns - Array of tax return objects
 * @param {number} daysThreshold - Number of days (default: 7)
 * @returns {Array} - Returns with urgent deadlines
 */
export function getUrgentDeadlines(returns, daysThreshold = 7) {
  if (!returns || !Array.isArray(returns)) return [];
  const now = new Date();
  const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  return returns.filter(ret => {
    if (!ret.deadline) return false;
    
    const deadline = new Date(ret.deadline);
    if (isNaN(deadline.getTime())) return false;

    return deadline >= now && deadline <= thresholdDate;
  });
}

/**
 * Get overdue returns (past deadline)
 * @param {Array} returns - Array of tax return objects
 * @returns {Array} - Overdue returns
 */
export function getOverdueReturns(returns) {
  if (!returns || !Array.isArray(returns)) return [];
  const now = new Date();

  return returns.filter(ret => {
    if (!ret.deadline) return false;
    
    const deadline = new Date(ret.deadline);
    if (isNaN(deadline.getTime())) return false;

    const status = ret.status || 'Pending';
    return deadline < now && status !== 'Filed' && status !== 'Completed';
  });
}

/**
 * Search returns by text query (name, CNIC/NTN, notes)
 * @param {Array} returns - Array of tax return objects
 * @param {string} query - Search query
 * @returns {Array} - Matching returns
 */
export function searchReturns(returns, query) {
  if (!returns || !Array.isArray(returns)) return [];
  if (!query || query.trim() === '') return returns;

  const lowerQuery = query.toLowerCase().trim();

  return returns.filter(ret => {
    const searchableFields = [
      ret.name,
      ret.cnicNtn,
      ret.taxYear,
      ret.status,
      ret.email,
      ret.phone,
      ret.notes,
      ret.address
    ];

    return searchableFields.some(field => 
      field && field.toString().toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Apply multiple filters to returns
 * @param {Array} returns - Array of tax return objects
 * @param {Object} filters - Filter configuration object
 * @returns {Array} - Filtered returns
 */
export function applyAdvancedFilters(returns, filters) {
  if (!returns || !Array.isArray(returns)) return [];
  let filtered = [...returns];

  // Text search
  if (filters.searchQuery) {
    filtered = searchReturns(filtered, filters.searchQuery);
  }

  // Date range
  if (filters.startDate || filters.endDate) {
    filtered = filterByDateRange(
      filtered, 
      filters.startDate, 
      filters.endDate, 
      filters.dateField || 'processedDate'
    );
  }

  // Tax year range
  if (filters.startYear || filters.endYear) {
    filtered = filterByTaxYearRange(filtered, filters.startYear, filters.endYear);
  }

  // Income bracket
  if (filters.minIncome || filters.maxIncome) {
    filtered = filterByIncomeBracket(filtered, filters.minIncome, filters.maxIncome);
  }

  // Status
  if (filters.statuses && filters.statuses.length > 0) {
    filtered = filterByStatus(filtered, filters.statuses);
  }

  // Tax paid range
  if (filters.minTax || filters.maxTax) {
    filtered = filterByTaxPaid(filtered, filters.minTax, filters.maxTax);
  }

  // Refund range
  if (filters.minRefund || filters.maxRefund) {
    filtered = filterByRefund(filtered, filters.minRefund, filters.maxRefund);
  }

  // Quick filters
  if (filters.highValueOnly) {
    filtered = getHighValueReturns(filtered, filters.highValueThreshold);
  }

  if (filters.urgentOnly) {
    filtered = getUrgentDeadlines(filtered, filters.urgentDaysThreshold);
  }

  if (filters.overdueOnly) {
    filtered = getOverdueReturns(filtered);
  }

  return filtered;
}

/**
 * Sort returns by field
 * @param {Array} returns - Array of tax return objects
 * @param {string} field - Field to sort by
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} - Sorted returns
 */
export function sortReturns(returns, field, order = 'asc') {
  if (!returns || !Array.isArray(returns)) return [];
  const sorted = [...returns].sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];

    // Handle numeric fields
    if (['incomeAmount', 'taxPaid', 'refundAmount', 'taxYear'].includes(field)) {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    }

    // Handle date fields
    if (['processedDate', 'filingDate', 'deadline'].includes(field)) {
      aVal = new Date(aVal).getTime() || 0;
      bVal = new Date(bVal).getTime() || 0;
    }

    // Handle string fields
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Get predefined income brackets
 * @returns {Array} - Array of income bracket objects
 */
export function getIncomeBrackets() {
  return [
    { label: 'Under 400,000', min: 0, max: 400000 },
    { label: '400,000 - 800,000', min: 400000, max: 800000 },
    { label: '800,000 - 1,200,000', min: 800000, max: 1200000 },
    { label: '1,200,000 - 2,400,000', min: 1200000, max: 2400000 },
    { label: '2,400,000 - 4,800,000', min: 2400000, max: 4800000 },
    { label: 'Above 4,800,000', min: 4800000, max: null }
  ];
}

/**
 * Get available status options
 * @returns {Array} - Array of status strings
 */
export function getStatusOptions() {
  return [
    'Pending',
    'In Progress',
    'Filed',
    'Completed',
    'Refund Received',
    'Under Review',
    'Rejected',
    'Amended'
  ];
}
