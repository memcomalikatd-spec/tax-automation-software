// Client Matching Engine for Notices

/**
 * Find client by CNIC or NTN
 * @param {string} cnicOrNtn - CNIC or NTN to search for
 * @param {array} clients - Array of client objects
 * @returns {object|null} Matched client or null
 */
export const findClientByCnicOrNtn = (cnicOrNtn, clients) => {
  if (!cnicOrNtn || !clients || clients.length === 0) return null;
  
  const normalized = cnicOrNtn.trim().replace(/\s+/g, '');
  
  // Try exact match first
  const exactMatch = clients.find(client => {
    const clientCnic = (client.cnic || '').trim().replace(/\s+/g, '');
    const clientNtn = (client.ntn || '').trim().replace(/\s+/g, '');
    
    return clientCnic === normalized || clientNtn === normalized;
  });
  
  if (exactMatch) {
    return {
      client: exactMatch,
      confidence: 100,
      matchType: 'exact',
      matchField: exactMatch.cnic === normalized ? 'cnic' : 'ntn'
    };
  }
  
  // Try partial match (for cases with formatting differences)
  const partialMatch = clients.find(client => {
    const clientCnic = (client.cnic || '').replace(/[-\s]/g, '');
    const clientNtn = (client.ntn || '').replace(/[-\s]/g, '');
    const searchValue = normalized.replace(/[-\s]/g, '');
    
    return clientCnic === searchValue || clientNtn === searchValue;
  });
  
  if (partialMatch) {
    return {
      client: partialMatch,
      confidence: 95,
      matchType: 'partial',
      matchField: partialMatch.cnic ? 'cnic' : 'ntn'
    };
  }
  
  return null;
};

/**
 * Find client by name using fuzzy matching
 * @param {string} name - Name to search for
 * @param {array} clients - Array of client objects
 * @returns {array} Array of potential matches with confidence scores
 */
export const findClientByName = (name, clients) => {
  if (!name || !clients || clients.length === 0) return [];
  
  const searchName = name.toLowerCase().trim();
  const matches = [];
  
  clients.forEach(client => {
    const clientName = (client.name || '').toLowerCase().trim();
    const businessName = (client.businessName || '').toLowerCase().trim();
    
    // Exact match
    if (clientName === searchName || businessName === searchName) {
      matches.push({
        client,
        confidence: 90,
        matchType: 'exact-name',
        matchField: clientName === searchName ? 'name' : 'businessName'
      });
      return;
    }
    
    // Contains match
    if (clientName.includes(searchName) || searchName.includes(clientName)) {
      const confidence = Math.round((Math.min(searchName.length, clientName.length) / Math.max(searchName.length, clientName.length)) * 80);
      matches.push({
        client,
        confidence,
        matchType: 'contains',
        matchField: 'name'
      });
      return;
    }
    
    // Word match (all words in search appear in client name)
    const searchWords = searchName.split(/\s+/);
    const clientWords = clientName.split(/\s+/);
    const matchingWords = searchWords.filter(word => 
      clientWords.some(cWord => cWord.includes(word) || word.includes(cWord))
    );
    
    if (matchingWords.length > 0) {
      const confidence = Math.round((matchingWords.length / searchWords.length) * 70);
      if (confidence >= 50) {
        matches.push({
          client,
          confidence,
          matchType: 'word-match',
          matchField: 'name'
        });
      }
    }
  });
  
  // Sort by confidence (highest first)
  return matches.sort((a, b) => b.confidence - a.confidence);
};

/**
 * Match notice to client using all available data
 * @param {object} noticeData - Notice data object
 * @param {array} clients - Array of client objects
 * @returns {object} Match result with client and confidence
 */
export const matchNoticeToClient = (noticeData, clients) => {
  if (!noticeData || !clients || clients.length === 0) {
    return {
      matched: false,
      client: null,
      confidence: 0,
      matchType: 'none',
      suggestions: []
    };
  }
  
  // Strategy 1: Try CNIC/NTN match (highest confidence)
  if (noticeData.cnicNtn) {
    const cnicMatch = findClientByCnicOrNtn(noticeData.cnicNtn, clients);
    if (cnicMatch && cnicMatch.confidence >= 90) {
      return {
        matched: true,
        client: cnicMatch.client,
        confidence: cnicMatch.confidence,
        matchType: cnicMatch.matchType,
        matchField: cnicMatch.matchField,
        suggestions: []
      };
    }
  }
  
  // Strategy 2: Try name match (medium confidence)
  if (noticeData.clientName && noticeData.clientName !== 'Unknown') {
    const nameMatches = findClientByName(noticeData.clientName, clients);
    
    if (nameMatches.length > 0) {
      const bestMatch = nameMatches[0];
      
      // If confidence is high enough, return as matched
      if (bestMatch.confidence >= 90) {
        return {
          matched: true,
          client: bestMatch.client,
          confidence: bestMatch.confidence,
          matchType: bestMatch.matchType,
          matchField: bestMatch.matchField,
          suggestions: nameMatches.slice(1, 4) // Include other suggestions
        };
      }
      
      // Otherwise, return as suggestions
      return {
        matched: false,
        client: null,
        confidence: 0,
        matchType: 'none',
        suggestions: nameMatches.slice(0, 5) // Top 5 suggestions
      };
    }
  }
  
  // No match found
  return {
    matched: false,
    client: null,
    confidence: 0,
    matchType: 'none',
    suggestions: []
  };
};

/**
 * Validate client match
 * @param {object} notice - Notice object
 * @param {object} client - Client object
 * @returns {object} Validation result
 */
export const validateClientMatch = (notice, client) => {
  const warnings = [];
  const errors = [];
  
  // Check CNIC/NTN consistency
  if (notice.cnicNtn && client.cnic && notice.cnicNtn !== client.cnic) {
    warnings.push('CNIC/NTN in notice does not match client CNIC');
  }
  
  if (notice.cnicNtn && client.ntn && notice.cnicNtn !== client.ntn) {
    warnings.push('CNIC/NTN in notice does not match client NTN');
  }
  
  // Check name similarity
  if (notice.clientName && client.name) {
    const noticeName = notice.clientName.toLowerCase();
    const clientName = client.name.toLowerCase();
    
    if (!noticeName.includes(clientName) && !clientName.includes(noticeName)) {
      warnings.push('Client name in notice differs significantly from client record');
    }
  }
  
  // Check if client is active
  if (client.status !== 'Active') {
    warnings.push(`Client status is ${client.status}`);
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
};

/**
 * Link notice to client
 * @param {object} notice - Notice object
 * @param {object} client - Client object
 * @param {number} confidence - Match confidence score
 * @returns {object} Updated notice object
 */
export const linkNoticeToClient = (notice, client, confidence = 100) => {
  return {
    ...notice,
    clientId: client.id,
    clientName: client.name,
    linkedClient: {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      cnic: client.cnic,
      ntn: client.ntn
    },
    matchConfidence: confidence,
    linkedAt: new Date().toISOString()
  };
};

/**
 * Unlink notice from client
 * @param {object} notice - Notice object
 * @returns {object} Updated notice object
 */
export const unlinkNoticeFromClient = (notice) => {
  return {
    ...notice,
    clientId: null,
    linkedClient: null,
    matchConfidence: null,
    linkedAt: null
  };
};

/**
 * Get unlinked notices
 * @param {array} notices - Array of notice objects
 * @returns {array} Unlinked notices
 */
export const getUnlinkedNotices = (notices) => {
  return notices.filter(notice => !notice.clientId);
};

/**
 * Get notices for client
 * @param {number} clientId - Client ID
 * @param {array} notices - Array of notice objects
 * @returns {array} Client's notices
 */
export const getNoticesForClient = (clientId, notices) => {
  return notices.filter(notice => notice.clientId === clientId);
};

/**
 * Suggest client creation from notice data
 * @param {object} noticeData - Notice data object
 * @returns {object} Suggested client data
 */
export const suggestClientFromNotice = (noticeData) => {
  return {
    name: noticeData.clientName || '',
    cnic: noticeData.cnicNtn || '',
    ntn: noticeData.cnicNtn || '',
    businessType: 'Individual',
    status: 'Active',
    email: '',
    phone: '',
    address: '',
    notes: `Created from notice: ${noticeData.noticeTypeName || 'Unknown'} uploaded on ${new Date().toLocaleDateString()}`,
    source: 'notice',
    sourceNoticeId: noticeData.id
  };
};

/**
 * Batch match notices to clients
 * @param {array} notices - Array of notice objects
 * @param {array} clients - Array of client objects
 * @returns {object} Batch match results
 */
export const batchMatchNotices = (notices, clients) => {
  const results = {
    matched: [],
    unmatched: [],
    suggestions: [],
    total: notices.length
  };
  
  notices.forEach(notice => {
    const matchResult = matchNoticeToClient(notice, clients);
    
    if (matchResult.matched) {
      results.matched.push({
        notice,
        client: matchResult.client,
        confidence: matchResult.confidence
      });
    } else if (matchResult.suggestions.length > 0) {
      results.suggestions.push({
        notice,
        suggestions: matchResult.suggestions
      });
    } else {
      results.unmatched.push(notice);
    }
  });
  
  return results;
};

/**
 * Calculate match statistics
 * @param {object} matchResults - Results from batchMatchNotices
 * @returns {object} Statistics
 */
export const getMatchStatistics = (matchResults) => {
  const total = matchResults.total;
  const matched = matchResults.matched.length;
  const unmatched = matchResults.unmatched.length;
  const needsReview = matchResults.suggestions.length;
  
  return {
    total,
    matched,
    unmatched,
    needsReview,
    matchRate: total > 0 ? Math.round((matched / total) * 100) : 0,
    avgConfidence: matched > 0 
      ? Math.round(matchResults.matched.reduce((sum, m) => sum + m.confidence, 0) / matched)
      : 0
  };
};
