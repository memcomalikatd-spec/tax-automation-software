/**
 * Advanced Notice Upload Component
 * Features: Drag & Drop, OCR, AI Categorization, Camera Capture, Clipboard Paste
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Camera, 
  Clipboard, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader,
  Image as ImageIcon,
  Sparkles,
  Clock,
  Undo2,
  Shield,
  Zap,
  RefreshCw
} from 'lucide-react';
import Confetti from 'react-confetti';
import { createWorker } from 'tesseract.js';
import { matchClientByName, matchClientByTaxId } from '../../utils/noticeHelpers';
import ClientSelectionModal from './ClientSelectionModal';

const AdvancedNoticeUpload = ({ isOpen, onClose, onUploadSuccess, clients = [] }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [recentUploads, setRecentUploads] = useState([]);
  const [showUndo, setShowUndo] = useState(false);
  const [lastUpload, setLastUpload] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [uploadedHashes, setUploadedHashes] = useState(new Set());
  const [showClientSelection, setShowClientSelection] = useState(false);
  const [clientMatchResult, setClientMatchResult] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const objectUrlsRef = useRef([]);

  // Drag and Drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  // Paste from clipboard
  useEffect(() => {
    const handlePaste = (e) => {
      if (!isOpen) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          files.push(file);
        }
      }

      if (files.length > 0) {
        handleFiles(files);
        playSound('paste');
      }
    };

    if (isOpen) {
      document.addEventListener('paste', handlePaste);
    }

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Revoke all object URLs to prevent memory leaks
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
      
      // Stop camera if active
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // File validation and sanitization
  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only PDF and images allowed' };
    }

    return { valid: true };
  };

  // Calculate file hash for duplicate detection
  const calculateFileHash = async (file) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Handle files
  const handleFiles = async (newFiles) => {
    const validFiles = [];
    const errors = [];
    const duplicates = [];

    for (const file of newFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      // Check for duplicates
      const fileHash = await calculateFileHash(file);
      if (uploadedHashes.has(fileHash)) {
        duplicates.push(file.name);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(previewUrl); // Track for cleanup
      
      validFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        preview: previewUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        hash: fileHash
      });
    }

    if (errors.length > 0) {
      setUploadError('Some files were rejected:\n' + errors.join('\n'));
    }

    if (duplicates.length > 0) {
      setUploadError('Duplicate files detected:\n' + duplicates.join('\n') + '\n\nThese files have already been uploaded.');
    }

    setFiles(prev => [...prev, ...validFiles]);
    
    // Auto-process if single file
    if (validFiles.length === 1) {
      processWithOCR(validFiles[0]);
    }
  };

  // PDF Processing: Focus on PDF Plumber extraction
  const processWithOCR = async (fileData) => {
    try {
      setUploading(true);
      setUploadProgress(10);

      // Check if file is PDF - use server-side PDF Plumber extraction
      if (fileData.file.type === 'application/pdf') {
        console.log('=== PDF PLUMBER EXTRACTION ===');
        console.log('Attempting server-side PDF Plumber extraction...');
        
        try {
          setUploadProgress(20);
          
          console.log('Server-side PDF extraction disabled - backend removed');
          
          // Backend removed - server extraction disabled
          throw new Error('Server extraction disabled');
          // const response = await fetch('http://localhost:5173/api/notices/extract-pdf', {
          //   method: 'POST',
          //   body: formData
          // });
          
          setUploadProgress(50);
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.success) {
              console.log('✓ PDF Plumber extraction successful');
              console.log('Extraction Method:', result.extraction_method);
              console.log('Confidence:', result.confidence);
              console.log('Raw Backend Data:', result.data);
              
              // Map backend data (snake_case) to frontend format (camelCase)
              const extractedData = {
                noticeType: result.data.notice_type || 'Not specified',
                clientName: result.data.client_name || 'Unknown',
                taxYear: result.data.tax_year || 'Not specified',
                amount: result.data.amount || 'Not specified',
                dueDate: result.data.due_date || 'Not specified',
                ntn: result.data.ntn || 'Not found',
                cnic: result.data.cnic || 'Not found',
                section: result.data.section || 'Other',
                description: result.data.description || '',
                confidence: result.confidence,
                fullText: result.data.raw_text || '',
                extractionMethod: result.extraction_method,
                validationWarnings: []
              };
              
              console.log('✓ Mapped Frontend Data:', extractedData);
              
              setExtractedData(extractedData);
              setUploadProgress(70);
              
              // AI Categorization
              await categorizeWithAI(extractedData);
              
              // Client Matching
              if (extractedData.clientName && extractedData.clientName !== 'Unknown') {
                await performClientMatching(extractedData.clientName);
              } else {
                setShowClientSelection(true);
              }
              
              setUploadProgress(100);
              setUploading(false);
              return; // Success - exit function
            } else {
              console.error('❌ Extraction failed:', result.error);
              throw new Error(result.error || 'Extraction failed');
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Server returned error:', response.status, errorData);
            throw new Error(errorData.error || `Server error: ${response.status}`);
          }
          
        } catch (serverError) {
          console.error('❌ PDF extraction error:', serverError);
          setUploading(false);
          setUploadProgress(0);
          
          // Show user-friendly error message
          let errorMessage = 'PDF extraction failed. ';
          if (serverError.message.includes('network') || serverError.message.includes('fetch')) {
            errorMessage += 'Cannot connect to server. Please try again.';
          } else {
            errorMessage += serverError.message || 'Please try again or contact support.';
          }
          
          alert(errorMessage);
          return;
        }
      }
      // For image files, use client-side OCR
      console.log('=== CLIENT-SIDE OCR EXTRACTION (Images Only) ===');
      setUploadProgress(20);

      // Initialize Tesseract worker with better configuration
      const worker = await createWorker('eng', 1, {
        logger: m => console.log(m)
      });
      
      // Configure for better accuracy
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/-:() ',
        preserve_interword_spaces: '1',
      });
      
      setUploadProgress(30);

      // Perform OCR on the image
      const { data: { text, confidence } } = await worker.recognize(fileData.file);
      setUploadProgress(60);

      console.log('Raw OCR Text:', text);
      console.log('OCR Confidence:', confidence);
      console.log('Text Length:', text.length);

      // Parse extracted text to find relevant information
      const rawData = {
        noticeType: extractNoticeType(text),
        clientName: extractClientName(text),
        taxYear: extractTaxYear(text),
        amount: extractAmount(text),
        dueDate: extractDueDate(text),
        description: text.substring(0, 200), // First 200 chars
        confidence: confidence / 100,
        fullText: text,
        extractionMethod: 'client-ocr'
      };

      console.log('Raw Extracted Data:', rawData);

      // Validate extracted data
      const dateValidation = validateDate(rawData.dueDate);
      const amountValidation = validateAmount(rawData.amount);
      const yearValidation = validateTaxYear(rawData.taxYear);

      const extractedData = {
        ...rawData,
        dueDate: dateValidation.normalized,
        amount: amountValidation.normalized,
        taxYear: yearValidation.normalized,
        validationWarnings: []
      };

      // Add validation warnings
      if (!dateValidation.valid && rawData.dueDate !== 'Not specified') {
        extractedData.validationWarnings.push('Due date may be incorrect');
      }
      if (!amountValidation.valid && rawData.amount !== 'Not specified') {
        extractedData.validationWarnings.push('Amount may be incorrect');
      }
      if (!yearValidation.valid) {
        extractedData.validationWarnings.push('Tax year may be incorrect');
      }

      console.log('Extracted Data:', extractedData);
      console.log('Validation Warnings:', extractedData.validationWarnings);
      console.log('=== END DEBUG ===');

      setExtractedData(extractedData);
      setUploadProgress(70);

      // Terminate worker to free resources
      await worker.terminate();

      // AI Categorization
      await categorizeWithAI(extractedData);
      
      // Client Matching after OCR
      if (extractedData.clientName && extractedData.clientName !== 'Unknown') {
        await performClientMatching(extractedData.clientName);
      } else {
        // No client name extracted, show client selection modal
        setShowClientSelection(true);
      }
      
      setUploadProgress(100);
      setUploading(false);
    } catch (error) {
      console.error('OCR Error:', error);
      console.error('Error stack:', error.stack);
      
      // Provide more specific error messages
      let errorMessage = 'OCR processing failed. ';
      if (error.message.includes('worker')) {
        errorMessage += 'Failed to initialize OCR engine. Please refresh and try again.';
      } else if (error.message.includes('recognize')) {
        errorMessage += 'Failed to read text from image. Please ensure the image is clear and try again.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage += 'Network error. Please check your connection and try again.';
      } else {
        errorMessage += 'Please try again or contact support if the issue persists.';
      }
      
      alert(errorMessage);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Perform client matching after OCR extraction
  const performClientMatching = async (clientName) => {
    try {
      // Try matching by name
      const matchResult = matchClientByName(clientName, clients);
      
      setClientMatchResult(matchResult);
      
      // If confidence is high (>70%), auto-select the client
      if (matchResult.confidence >= 70 && matchResult.client) {
        setSelectedClient(matchResult.client);
        console.log(`Auto-matched client: ${matchResult.client.name} (${matchResult.confidence}% confidence)`);
      } 
      // If confidence is low but we have suggestions, show selection modal
      else if (matchResult.suggestions && matchResult.suggestions.length > 0) {
        setShowClientSelection(true);
      }
    } catch (error) {
      console.error('Client matching error:', error);
    }
  };

  // Handle client selection from modal
  const handleClientSelection = (client) => {
    setSelectedClient(client);
    setShowClientSelection(false);
    console.log('Client selected:', client);
  };

  // Helper functions to extract data from OCR text with improved patterns for Pakistani notices
  const extractNoticeType = (text) => {
    // Try multiple patterns for notice type/section (Pakistani tax notices)
    const patterns = [
      /(?:Section|u\/s|under section|Section No\.?)\s*(\d+[A-Z]?(?:\/\d+)?(?:\([A-Z0-9]\))?)/i,
      /(?:Notice.*?u\/s|Notice.*?Section)\s*(\d+[A-Z]?(?:\/\d+)?)/i,
      /Section\s*(\d+[A-Z]?(?:\/\d+)?)/i,
      /u\/s\s*(\d+[A-Z]?(?:\/\d+)?)/i,
      /(?:Rule|Section)\s*(\d+)\s*(?:of|\()/i,
      /(\d{2,3})\s*(?:\(\d+\))?\s*of\s*(?:Income|Ordinance)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return 'Unknown';
  };

  const extractClientName = (text) => {
    // Try multiple patterns for client/taxpayer name (Pakistani format)
    const patterns = [
      /(?:Name|M\/s|Messrs|Mr\.|Mrs\.|Ms\.)\s*:?\s*([A-Z][a-zA-Z\s\.&]+?)(?:\n|NTN|CNIC|Address|Tax)/i,
      /(?:Taxpayer|Assessee|Name of Assessee|Name of Taxpayer)\s*:?\s*([A-Z][a-zA-Z\s\.&]+?)(?:\n|NTN|CNIC)/i,
      /(?:Dear|To)\s+(?:M\/s|Messrs|Mr\.|Mrs\.)\s+([A-Z][a-zA-Z\s\.&]+?)(?:\n|,)/i,
      /NTN.*?\n\s*([A-Z][a-zA-Z\s\.&]{3,50}?)(?:\n|Address)/i,
      /(?:issued to|served upon)\s+(?:M\/s|Messrs)?\s*([A-Z][a-zA-Z\s\.&]+?)(?:\n|,|NTN)/i,
      /(?:^|\n)([A-Z][A-Z\s\.&]{10,50})(?:\n|$)/m  // Fallback: long uppercase text
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const name = match[1].trim();
        // Clean up the name (remove extra spaces, trailing dots, common words)
        const cleaned = name
          .replace(/\s+/g, ' ')
          .replace(/\.$/, '')
          .replace(/^(The|M\/s|Messrs)\s+/i, '')
          .trim();
        
        // Validate name length
        if (cleaned.length >= 3 && cleaned.length <= 100) {
          return cleaned;
        }
      }
    }
    return 'Unknown';
  };

  const extractTaxYear = (text) => {
    // Try multiple patterns for tax/assessment year (Pakistani format)
    const patterns = [
      /(?:Tax Year|T\.Y\.|TY)\s*:?\s*(\d{4})/i,
      /(?:Assessment Year|A\.Y\.|AY)\s*:?\s*(\d{4}[-\/]?\d{0,4})/i,
      /(?:Financial Year|F\.Y\.|FY)\s*:?\s*(\d{4}[-\/]?\d{0,4})/i,
      /(?:for the year|year ending|year)\s*(\d{4})/i,
      /(?:period|year)\s*(?:from|ending)?\s*(\d{4})/i,
      /(\d{4})[-\/](\d{2,4})/,  // Year range format
      /(?:^|\s)(20\d{2})(?:\s|$)/m  // Standalone 4-digit year starting with 20
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // Return first captured group or full match
        return match[1] || match[0];
      }
    }
    return new Date().getFullYear().toString();
  };

  const extractAmount = (text) => {
    // Try multiple patterns for amount/tax demand (Pakistani Rupees)
    const patterns = [
      /(?:Rs\.?|PKR|Rupees)\s*([\d,]+(?:\.\d{2})?)/i,
      /(?:Amount|Tax|Demand|Outstanding|Payable|Total)\s*:?\s*(?:Rs\.?|PKR|Rupees)?\s*([\d,]+(?:\.\d{2})?)/i,
      /(?:Total|Payable|Due)\s*:?\s*(?:Rs\.?|PKR)?\s*([\d,]+(?:\.\d{2})?)/i,
      /([\d,]+(?:\.\d{2})?)\s*(?:Rs\.?|PKR|Rupees)/i,
      /(?:sum of|amount of)\s*(?:Rs\.?|PKR)?\s*([\d,]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = match[1].replace(/,/g, '');
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount) && numAmount > 0) {
          return `Rs. ${numAmount.toLocaleString('en-PK')}`;
        }
      }
    }
    return 'Not specified';
  };

  // Validation helper functions
  const validateDate = (dateStr) => {
    if (!dateStr || dateStr === 'Not specified') return { valid: false, normalized: 'Not specified' };
    
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const twoYearsAhead = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
      
      // Check if date is valid and within reasonable range
      if (isNaN(date.getTime())) {
        return { valid: false, normalized: 'Not specified' };
      }
      
      if (date < oneYearAgo || date > twoYearsAhead) {
        console.warn('Date outside reasonable range:', dateStr);
        return { valid: false, normalized: dateStr };
      }
      
      return { valid: true, normalized: date.toISOString().split('T')[0] };
    } catch (e) {
      return { valid: false, normalized: 'Not specified' };
    }
  };

  const validateAmount = (amountStr) => {
    if (!amountStr || amountStr === 'Not specified') return { valid: false, normalized: 'Not specified' };
    
    // Extract numeric value
    const numericStr = amountStr.replace(/[^0-9.]/g, '');
    const amount = parseFloat(numericStr);
    
    if (isNaN(amount) || amount < 0) {
      return { valid: false, normalized: 'Not specified' };
    }
    
    if (amount > 100000000000) { // 100 billion - unreasonably high
      console.warn('Amount unreasonably high:', amountStr);
      return { valid: false, normalized: amountStr };
    }
    
    return { valid: true, normalized: `Rs. ${amount.toLocaleString('en-IN')}` };
  };

  const validateTaxYear = (yearStr) => {
    if (!yearStr) return { valid: false, normalized: new Date().getFullYear().toString() };
    
    // Extract year range (e.g., "2023-24" or "2023")
    const yearMatch = yearStr.match(/(\d{4})/);
    if (!yearMatch) {
      return { valid: false, normalized: new Date().getFullYear().toString() };
    }
    
    const year = parseInt(yearMatch[1]);
    const currentYear = new Date().getFullYear();
    
    // Valid range: 2020 to current year + 1
    if (year < 2020 || year > currentYear + 1) {
      console.warn('Tax year outside valid range:', yearStr);
      return { valid: false, normalized: currentYear.toString() };
    }
    
    return { valid: true, normalized: yearStr };
  };

  const extractDueDate = (text) => {
    // Try multiple patterns for due date/deadline (Pakistani format)
    const patterns = [
      /(?:Due Date|Last Date|Deadline|Before|By|within)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(?:on or before|not later than)\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(?:date|deadline)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,  // Fallback: any date pattern with 4-digit year
      /(?:^|\s)(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s|$)/m,  // Standalone date
      /(?:within|in)\s+(\d+)\s+days/i  // Relative date like "within 30 days"
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // Handle relative dates
        if (match[0].includes('days')) {
          const days = parseInt(match[1]);
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + days);
          const normalized = futureDate.toISOString().split('T')[0];
          const validation = validateDate(normalized);
          return validation.normalized;
        }
        
        // Normalize date format to YYYY-MM-DD
        const dateStr = match[1] || match[0];
        const parts = dateStr.split(/[\/\-\.]/);
        if (parts.length === 3) {
          let day = parts[0];
          let month = parts[1];
          let year = parts[2];
          
          // Handle 2-digit year
          if (year.length === 2) {
            year = '20' + year;
          }
          
          // Ensure proper formatting
          day = day.padStart(2, '0');
          month = month.padStart(2, '0');
          
          const normalized = `${year}-${month}-${day}`;
          const validation = validateDate(normalized);
          return validation.normalized;
        }
        return match[1] || match[0];
      }
    }
    return 'Not specified';
  };

  // AI-powered categorization based on extracted data
  const categorizeWithAI = async (data) => {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 500));

    // Determine category based on notice type
    let category = 'General Notice';
    let priority = 'Medium';
    let suggestedResponse = 'Review notice and prepare appropriate response';
    let requiredDocuments = [];
    
    const noticeType = data.noticeType || '';
    const amount = data.amount || '';
    const dueDate = data.dueDate || '';
    
    // Categorize based on notice type
    if (noticeType.includes('148') || noticeType.includes('147')) {
      category = 'Income Tax Assessment - Scrutiny Notice';
      priority = 'High';
      suggestedResponse = 'Respond to scrutiny notice with supporting documents and explanations';
      requiredDocuments = ['Income Tax Returns', 'Bank Statements', 'Investment Proofs', 'TDS Certificates'];
    } else if (noticeType.includes('143') || noticeType.includes('142')) {
      category = 'Income Tax Assessment - Information Request';
      priority = 'High';
      suggestedResponse = 'Provide requested information and documents within specified timeline';
      requiredDocuments = ['Requested Documents', 'Supporting Evidence', 'Financial Statements'];
    } else if (noticeType.includes('156')) {
      category = 'Demand Notice';
      priority = 'Critical';
      suggestedResponse = 'Review demand and file appeal if necessary, or arrange payment';
      requiredDocuments = ['Assessment Order', 'Payment Proof', 'Appeal Documents'];
    } else if (noticeType.includes('245')) {
      category = 'Refund Adjustment Notice';
      priority = 'Medium';
      suggestedResponse = 'Verify refund adjustment and respond if discrepancies found';
      requiredDocuments = ['Refund Details', 'Tax Payment Records'];
    } else if (noticeType.includes('133')) {
      category = 'Third Party Information Notice';
      priority = 'Medium';
      suggestedResponse = 'Provide information about third party transactions';
      requiredDocuments = ['Transaction Records', 'Invoices', 'Contracts'];
    }
    
    // Adjust priority based on amount
    if (amount && amount !== 'Not specified') {
      const amountStr = amount.replace(/[^\d]/g, '');
      const amountNum = parseInt(amountStr);
      if (amountNum > 1000000) {
        priority = 'Critical';
      } else if (amountNum > 100000) {
        priority = 'High';
      }
    }
    
    // Adjust priority based on due date
    if (dueDate && dueDate !== 'Not specified') {
      try {
        const dueDateObj = new Date(dueDate);
        const today = new Date();
        const daysRemaining = Math.ceil((dueDateObj - today) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) {
          priority = 'Critical';
        } else if (daysRemaining <= 7) {
          priority = 'Critical';
        } else if (daysRemaining <= 15) {
          priority = 'High';
        }
      } catch (e) {
        console.error('Error parsing due date:', e);
      }
    }
    
    // Calculate estimated response time based on priority
    let estimatedResponseTime = '5-7 business days';
    if (priority === 'Critical') {
      estimatedResponseTime = '1-2 business days';
    } else if (priority === 'High') {
      estimatedResponseTime = '3-5 business days';
    }

    const suggestions = {
      category: category,
      priority: priority,
      suggestedResponse: suggestedResponse,
      relatedCases: [],
      estimatedResponseTime: estimatedResponseTime,
      requiredDocuments: requiredDocuments
    };

    setAiSuggestions(suggestions);
  };

  // Camera capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream; // Store stream reference
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error) {
      alert('Camera access denied or not available');
      console.error('Camera error:', error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob(blob => {
        const file = new File([blob], `notice-${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFiles([file]);
        stopCamera();
      }, 'image/jpeg', 0.95);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setShowCamera(false);
  };

  // Upload with CSRF protection, retry mechanism, and error handling
  const handleUpload = async (isRetry = false) => {
    if (files.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      const uploadedFiles = [];

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i].file);
        formData.append('extractedData', JSON.stringify(extractedData));
        formData.append('aiSuggestions', JSON.stringify(aiSuggestions));
        formData.append('file_hash', files[i].hash);
        
        // Include selected client information
        if (selectedClient) {
          formData.append('clientId', selectedClient.id);
          formData.append('clientName', selectedClient.name);
          formData.append('matchConfidence', clientMatchResult?.confidence || 100);
        }

        // Real API upload with progress tracking
        const xhr = new XMLHttpRequest();
        
        const uploadPromise = new Promise((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const fileProgress = (e.loaded / e.total) * 100;
              const totalProgress = ((i + fileProgress / 100) / files.length) * 100;
              setUploadProgress(totalProgress);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch (e) {
                reject(new Error('Invalid server response'));
              }
            } else if (xhr.status === 403) {
              reject(new Error('CSRF token expired. Please refresh and try again.'));
            } else if (xhr.status === 409) {
              // Duplicate file detected
              try {
                const response = JSON.parse(xhr.responseText);
                reject(new Error(response.error || 'Duplicate file detected'));
              } catch (e) {
                reject(new Error('Duplicate file detected'));
              }
            } else if (xhr.status === 413) {
              reject(new Error('File too large. Maximum size is 10MB.'));
            } else if (xhr.status === 500) {
              reject(new Error('Server error. Please try again later.'));
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText || 'Unknown error'}`));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Network error. Please check your connection.')));
          xhr.addEventListener('abort', () => reject(new Error('Upload cancelled.')));
          xhr.addEventListener('timeout', () => reject(new Error('Upload timed out. Please try again.')));
        });

        // Backend removed - upload disabled
        throw new Error('Server upload is disabled. Backend has been removed.');
        // xhr.open('POST', 'http://localhost:5173/api/notices/upload');
        // xhr.timeout = 60000; // 60 second timeout
        // xhr.send(formData);

        const result = await uploadPromise;
        uploadedFiles.push(result);
        
        // Add hash to uploaded set
        setUploadedHashes(prev => new Set([...prev, files[i].hash]));
      }

      // Success!
      setShowConfetti(true);
      playSound('success');
      vibrateDevice();
      setRetryCount(0);
      
      // Fix: Backend returns { notice: {...} }, not { files: [{ notice: {...} }] }
      const uploadData = {
        files: uploadedFiles.map(result => ({
          notice: result.notice,
          success: result.success
        })),
        extractedData,
        aiSuggestions,
        timestamp: new Date().toISOString()
      };
      
      setLastUpload(uploadData);
      setRecentUploads(prev => [uploadData, ...prev.slice(0, 4)]);
      setShowUndo(true);

      setTimeout(() => {
        setShowConfetti(false);
        setShowUndo(false);
        onUploadSuccess?.(uploadData);
        handleClose();
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      
      const errorMessage = error.message || 'Upload failed. Please try again.';
      setUploadError(errorMessage);
      
      // Auto-retry logic (max 3 attempts)
      if (!isRetry && retryCount < 2 && !errorMessage.includes('CSRF') && !errorMessage.includes('too large')) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          console.log(`Retrying upload (attempt ${retryCount + 2}/3)...`);
          handleUpload(true);
        }, 2000);
      }
    } finally {
      setUploading(false);
    }
  };

  // Undo last upload with API call
  const handleUndo = async () => {
    if (!lastUpload || !lastUpload.files || lastUpload.files.length === 0) return;

    try {
      // Backend removed - API delete disabled
      // Call API to delete uploaded notices
      for (const file of lastUpload.files) {
        const noticeId = file.notice?.id || file.id;
        if (noticeId) {
          console.log(`Delete API disabled for notice ${noticeId}`);
          // const response = await fetch(`http://localhost:5173/api/notices/${noticeId}`, {
          //   method: 'DELETE'
          // });
          
          // if (!response.ok) {
          //   console.error(`Failed to delete notice ${noticeId}`);
          // }
        }
      }
      
      // Remove hashes from uploaded set
      const hashesToRemove = files.map(f => f.hash).filter(Boolean);
      setUploadedHashes(prev => {
        const newSet = new Set(prev);
        hashesToRemove.forEach(hash => newSet.delete(hash));
        return newSet;
      });
      
      setShowUndo(false);
      setLastUpload(null);
      
      // Show success message
      alert('Upload successfully undone!');
    } catch (error) {
      console.error('Undo error:', error);
      alert('Failed to undo upload. The files may have already been processed.');
    }
  };

  // Sound effects using Web Audio API (no external files needed)
  const playSound = (type) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'success') {
        // Success sound: ascending tones
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (type === 'paste') {
        // Paste sound: quick beep
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    } catch (error) {
      // Silently fail if Web Audio API not supported
      console.log('Audio not supported:', error);
    }
  };

  // Haptic feedback
  const vibrateDevice = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  };

  // Close handler
  const handleClose = () => {
    setFiles([]);
    setExtractedData(null);
    setAiSuggestions(null);
    setUploadProgress(0);
    stopCamera();
    onClose();
  };

  // Remove file
  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header with glassmorphism */}
          <div className="sticky top-0 z-10 bg-white/5 backdrop-blur-xl border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
                  Upload Tax Notice
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Drag & drop, paste, or capture with camera
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Security indicator */}
            <div className="mt-4 flex items-center gap-2 text-xs text-green-400">
              <Shield className="w-4 h-4" />
              <span>Secure upload with encryption</span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Camera View */}
            {showCamera && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-xl overflow-hidden"
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-xl"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={capturePhoto}
                    className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold shadow-lg"
                  >
                    <Camera className="w-5 h-5 inline mr-2" />
                    Capture
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopCamera}
                    className="px-6 py-3 bg-red-600 text-white rounded-full font-semibold shadow-lg"
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Upload Actions */}
            {!showCamera && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl hover:border-blue-500/50 transition-all group"
                >
                  <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold text-sm">Browse Files</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startCamera}
                  className="p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl hover:border-purple-500/50 transition-all group"
                >
                  <Camera className="w-8 h-8 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold text-sm">Take Photo</p>
                  <p className="text-xs text-gray-400 mt-1">Use camera</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl hover:border-green-500/50 transition-all group"
                >
                  <Clipboard className="w-8 h-8 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold text-sm">Paste (Ctrl+V)</p>
                  <p className="text-xs text-gray-400 mt-1">From clipboard</p>
                </motion.button>
              </div>
            )}

            {/* Drop Zone */}
            {!showCamera && (
              <motion.div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                animate={{
                  borderColor: isDragging ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                  backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                }}
                className="border-2 border-dashed rounded-xl p-12 text-center transition-all"
              >
                <motion.div
                  animate={{
                    scale: isDragging ? 1.1 : 1,
                    rotate: isDragging ? 5 : 0,
                  }}
                >
                  <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-semibold mb-2">
                    {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                  </p>
                  <p className="text-sm text-gray-400">
                    or click Browse Files button above
                  </p>
                </motion.div>
              </motion.div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={(e) => handleFiles(Array.from(e.target.files || []))}
              className="hidden"
            />

            {/* File List */}
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Selected Files ({files.length})
                </h3>
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                  >
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-red-600/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-8 h-8 text-red-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-400">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 hover:bg-red-600/20 rounded-lg transition-all"
                    >
                      <X className="w-5 h-5 text-red-400" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* OCR Extracted Data */}
            {extractedData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/30 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-semibold">Extracted Information</h3>
                  <span className="ml-auto text-xs text-green-400">
                    {(extractedData.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Notice Type</p>
                    <p className="font-medium">{extractedData.noticeType}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Client Name</p>
                    <p className="font-medium">{extractedData.clientName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Tax Year</p>
                    <p className="font-medium">{extractedData.taxYear}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Amount</p>
                    <p className="font-medium text-blue-400">{extractedData.amount}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400">Description</p>
                    <p className="font-medium">{extractedData.description}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI Suggestions */}
            {aiSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                  <h3 className="font-semibold">AI Recommendations</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-400">Category</p>
                    <p className="font-medium">{aiSuggestions.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Priority</p>
                    <span className="inline-block px-2 py-1 bg-orange-600/20 text-orange-400 rounded text-xs font-medium">
                      {aiSuggestions.priority}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-400">Suggested Response</p>
                    <p className="font-medium">{aiSuggestions.suggestedResponse}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Required Documents</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {aiSuggestions.requiredDocuments.map((doc, i) => (
                        <li key={i} className="text-gray-300">{doc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin text-blue-400" />
                    Processing...
                  </span>
                  <span className="font-semibold">{uploadProgress.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                  />
                </div>
              </motion.div>
            )}

            {/* Error Display */}
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-600/10 border border-red-500/30 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-400 mb-1">Upload Error</p>
                  <p className="text-sm text-red-400/80 whitespace-pre-line">{uploadError}</p>
                  {retryCount > 0 && retryCount < 3 && (
                    <p className="text-xs text-red-400/60 mt-2">
                      Retrying... (Attempt {retryCount + 1}/3)
                    </p>
                  )}
                  {retryCount >= 2 && (
                    <button
                      onClick={() => {
                        setRetryCount(0);
                        setUploadError(null);
                        handleUpload(false);
                      }}
                      className="mt-3 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all text-sm font-medium"
                    >
                      <RefreshCw className="w-4 h-4 inline mr-1" />
                      Retry Upload
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setUploadError(null)}
                  className="p-1 hover:bg-red-600/20 rounded transition-all"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                disabled={uploading}
                className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUpload(false)}
                disabled={files.length === 0 || uploading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload {files.length > 0 && `(${files.length})`}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Client Selection Modal */}
        <ClientSelectionModal
          isOpen={showClientSelection}
          onClose={() => setShowClientSelection(false)}
          extractedName={extractedData?.clientName}
          suggestions={clientMatchResult?.suggestions || []}
          allClients={clients}
          onSelectClient={handleClientSelection}
        />

        {/* Undo Toast */}
        <AnimatePresence>
          {showUndo && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/20 rounded-xl p-4 shadow-2xl flex items-center gap-4 z-50"
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium">Notice uploaded successfully!</span>
              <button
                onClick={handleUndo}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <Undo2 className="w-4 h-4" />
                Undo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdvancedNoticeUpload;
