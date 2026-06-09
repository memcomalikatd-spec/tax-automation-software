// Folder Management for Notice Organization

import fs from 'fs';
import path from 'path';

/**
 * Sanitize folder name
 * @param {string} name - Name to sanitize
 * @returns {string} Sanitized name
 */
export const sanitizeFolderName = (name) => {
  if (!name || typeof name !== 'string') return 'Unknown';
  
  // Remove invalid characters for folder names
  return name
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .trim() || 'Unknown';
};

/**
 * Get client folder path
 * @param {string} baseDir - Base directory for notices
 * @param {string} clientName - Client name
 * @param {string} noticeType - Notice type/category
 * @returns {string} Full folder path
 */
export const getClientFolderPath = (baseDir, clientName, noticeType) => {
  const sanitizedClient = sanitizeFolderName(clientName);
  const sanitizedType = sanitizeFolderName(noticeType);
  
  return path.join(baseDir, sanitizedClient, sanitizedType);
};

/**
 * Get unlinked folder path
 * @param {string} baseDir - Base directory for notices
 * @returns {string} Unlinked folder path
 */
export const getUnlinkedFolderPath = (baseDir) => {
  return path.join(baseDir, 'Unlinked');
};

/**
 * Create folder if it doesn't exist
 * @param {string} folderPath - Path to create
 * @returns {Promise<object>} Result object
 */
export const createFolderIfNotExists = async (folderPath) => {
  try {
    // Check if running in Node.js environment
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Use Electron API
      return await window.electronAPI.createFolder(folderPath);
    }
    
    // Server-side Node.js
    if (typeof fs !== 'undefined' && fs.promises) {
      await fs.promises.mkdir(folderPath, { recursive: true });
      return { success: true, path: folderPath };
    }
    
    // Fallback - cannot create folders in browser
    return { 
      success: false, 
      error: 'Folder creation not available in browser environment' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Move file to new location
 * @param {string} sourcePath - Source file path
 * @param {string} destPath - Destination file path
 * @returns {Promise<object>} Result object
 */
export const moveFile = async (sourcePath, destPath) => {
  try {
    // Check if running in Electron
    if (typeof window !== 'undefined' && window.electronAPI) {
      return await window.electronAPI.moveFile(sourcePath, destPath);
    }
    
    // Server-side Node.js
    if (typeof fs !== 'undefined' && fs.promises) {
      await fs.promises.rename(sourcePath, destPath);
      return { success: true, newPath: destPath };
    }
    
    return { 
      success: false, 
      error: 'File operations not available in browser environment' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Copy file to new location (preserves original)
 * @param {string} sourcePath - Source file path
 * @param {string} destPath - Destination file path
 * @returns {Promise<object>} Result object
 */
export const copyFile = async (sourcePath, destPath) => {
  try {
    // Check if running in Electron
    if (typeof window !== 'undefined' && window.electronAPI) {
      return await window.electronAPI.copyFile(sourcePath, destPath);
    }
    
    // Server-side Node.js
    if (typeof fs !== 'undefined' && fs.promises) {
      await fs.promises.copyFile(sourcePath, destPath);
      return { success: true, newPath: destPath };
    }
    
    return { 
      success: false, 
      error: 'File operations not available in browser environment' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Organize notice file into client folder
 * @param {object} notice - Notice object
 * @param {object} client - Client object (null if unlinked)
 * @param {string} baseDir - Base directory for notices
 * @param {boolean} preserveOriginal - Whether to copy instead of move
 * @returns {Promise<object>} Result object with new path
 */
export const organizeNoticeFile = async (notice, client, baseDir, preserveOriginal = false) => {
  try {
    const currentPath = notice.file_path;
    if (!currentPath) {
      return { 
        success: false, 
        error: 'Notice file path not found' 
      };
    }
    
    // Determine destination folder
    let destFolder;
    if (client) {
      const noticeCategory = getNoticeCategory(notice.noticeType);
      destFolder = getClientFolderPath(baseDir, client.name, noticeCategory);
    } else {
      destFolder = getUnlinkedFolderPath(baseDir);
    }
    
    // Create destination folder
    const folderResult = await createFolderIfNotExists(destFolder);
    if (!folderResult.success) {
      return folderResult;
    }
    
    // Generate new filename
    const fileName = path.basename(currentPath);
    const destPath = path.join(destFolder, fileName);
    
    // Move or copy file
    const fileResult = preserveOriginal 
      ? await copyFile(currentPath, destPath)
      : await moveFile(currentPath, destPath);
    
    if (fileResult.success) {
      return {
        success: true,
        newPath: destPath,
        folder: destFolder
      };
    }
    
    return fileResult;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get notice category from notice type
 * @param {string} noticeType - Notice type
 * @returns {string} Category name
 */
const getNoticeCategory = (noticeType) => {
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
 * Batch organize multiple notices
 * @param {array} notices - Array of notice objects
 * @param {array} clients - Array of client objects
 * @param {string} baseDir - Base directory for notices
 * @param {boolean} preserveOriginal - Whether to copy instead of move
 * @returns {Promise<object>} Batch result
 */
export const batchOrganizeNotices = async (notices, clients, baseDir, preserveOriginal = false) => {
  const results = {
    success: [],
    failed: [],
    total: notices.length
  };
  
  for (const notice of notices) {
    // Find linked client
    const client = notice.clientId 
      ? clients.find(c => c.id === notice.clientId)
      : null;
    
    const result = await organizeNoticeFile(notice, client, baseDir, preserveOriginal);
    
    if (result.success) {
      results.success.push({
        noticeId: notice.id,
        oldPath: notice.file_path,
        newPath: result.newPath,
        folder: result.folder
      });
    } else {
      results.failed.push({
        noticeId: notice.id,
        error: result.error
      });
    }
  }
  
  return results;
};

/**
 * Get folder structure for client
 * @param {string} baseDir - Base directory for notices
 * @param {string} clientName - Client name
 * @returns {object} Folder structure
 */
export const getClientFolderStructure = (baseDir, clientName) => {
  const sanitizedClient = sanitizeFolderName(clientName);
  const clientFolder = path.join(baseDir, sanitizedClient);
  
  const noticeTypes = [
    'Demand',
    'Audit',
    'Penalty',
    'Withholding',
    'SalesTax',
    'IncomeTax',
    'Compliance',
    'Assessment',
    'Refund',
    'Appeal',
    'General'
  ];
  
  return {
    clientFolder,
    subfolders: noticeTypes.map(type => ({
      name: type,
      path: path.join(clientFolder, type)
    }))
  };
};

/**
 * Create complete folder structure for client
 * @param {string} baseDir - Base directory for notices
 * @param {string} clientName - Client name
 * @returns {Promise<object>} Result object
 */
export const createClientFolderStructure = async (baseDir, clientName) => {
  const structure = getClientFolderStructure(baseDir, clientName);
  const results = {
    created: [],
    failed: []
  };
  
  // Create main client folder
  const mainResult = await createFolderIfNotExists(structure.clientFolder);
  if (mainResult.success) {
    results.created.push(structure.clientFolder);
  } else {
    results.failed.push({ path: structure.clientFolder, error: mainResult.error });
  }
  
  // Create subfolders
  for (const subfolder of structure.subfolders) {
    const result = await createFolderIfNotExists(subfolder.path);
    if (result.success) {
      results.created.push(subfolder.path);
    } else {
      results.failed.push({ path: subfolder.path, error: result.error });
    }
  }
  
  return {
    success: results.failed.length === 0,
    created: results.created,
    failed: results.failed
  };
};

/**
 * Validate folder path
 * @param {string} folderPath - Path to validate
 * @returns {object} Validation result
 */
export const validateFolderPath = (folderPath) => {
  const errors = [];
  
  if (!folderPath) {
    errors.push('Folder path is required');
  }
  
  if (folderPath && folderPath.length > 260) {
    errors.push('Folder path is too long (max 260 characters)');
  }
  
  // Check for invalid characters
  const invalidChars = /[<>"|?*]/;
  if (folderPath && invalidChars.test(folderPath)) {
    errors.push('Folder path contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get relative path from base directory
 * @param {string} fullPath - Full file path
 * @param {string} baseDir - Base directory
 * @returns {string} Relative path
 */
export const getRelativePath = (fullPath, baseDir) => {
  if (!fullPath || !baseDir) return fullPath;
  
  try {
    return path.relative(baseDir, fullPath);
  } catch (error) {
    return fullPath;
  }
};

/**
 * Check if file exists
 * @param {string} filePath - File path to check
 * @returns {Promise<boolean>} True if exists
 */
export const fileExists = async (filePath) => {
  try {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const result = await window.electronAPI.fileExists(filePath);
      return result.exists;
    }
    
    if (typeof fs !== 'undefined' && fs.promises) {
      await fs.promises.access(filePath);
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
};
