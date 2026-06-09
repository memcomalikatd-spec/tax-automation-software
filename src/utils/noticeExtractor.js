import Tesseract from 'tesseract.js';
import { extractTextFromPDF } from './pdfExtractor.js';

const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp', 'image/tiff', 'image/webp'];
const TEXT_EXTENSIONS = ['.txt'];

export const cleanExtractedNoticeText = (text) => {
  if (!text) return '';
  let cleaned = String(text)
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');

  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  return cleaned.trim();
};

const analyzeNoticeWithAI = async (noticeText) => {
  if (!noticeText || !noticeText.trim()) {
    return null;
  }

  const controller = new AbortController();
  const timeoutMs = 25000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.1',
        prompt: `You are a tax notice analysis expert. Analyze this Pakistani tax notice and extract key information in JSON format:

Notice Text:
${noticeText}

Please provide a JSON response with the following structure:
{
  "confidence": "high/medium/low",
  "keyInsights": ["insight1", "insight2"],
  "actionItems": ["action1", "action2"],
  "riskLevel": "high/medium/low",
  "complianceDeadline": "YYYY-MM-DD or null",
  "amounts": {
    "taxDue": "amount or null",
    "penalty": "amount or null",
    "totalAmount": "amount or null"
  },
  "recommendations": ["recommendation1", "recommendation2"]
}

Focus on:
- Tax amounts and penalties
- Deadlines and compliance requirements
- Risk assessment
- Recommended actions
- Key legal references

Be precise and only include information clearly stated in the notice.`,
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for consistent analysis
          num_predict: 1000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const aiResponse = result.response;

    try {
      const parsedAnalysis = JSON.parse(aiResponse);
      return parsedAnalysis;
    } catch (parseError) {
      return {
        confidence: 'low',
        keyInsights: [aiResponse.substring(0, 200) + '...'],
        actionItems: ['Review notice manually'],
        riskLevel: 'unknown',
        complianceDeadline: null,
        amounts: {
          taxDue: null,
          penalty: null,
          totalAmount: null
        },
        recommendations: ['Consult with tax professional']
      };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('AI analysis timeout:', error);
      return null;
    }
    console.error('AI analysis error:', error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export const identifyNoticeType = (text) => {
  if (!text) return 'unknown';
  const normalized = text.toLowerCase();

  const explicitPatterns = [
    { type: 'demand_notice', regex: /\bdemand notice\b|\bdemand\b/ },
    { type: 'audit_notice', regex: /\baudit notice\b|\btax audit\b|\bfield audit\b|\baudit team\b/ },
    { type: 'penalty_notice', regex: /\bpenalty\b|\bpenal\b|\blate filing\b|\bfine\b/ },
    { type: 'withholding_tax_notice', regex: /\bwithholding tax\b|\bwithheld\b|\bwithholding\b/ },
    { type: 'sales_tax_notice', regex: /\bsales tax\b|\bset\b|\bgoods and services tax\b|\bgst\b/ },
    { type: 'income_tax_notice', regex: /\bincome tax\b|\bint\b|\bsection\s*114\b|\btax return\b|\breturn filing\b/ },
    { type: 'compliance_notice', regex: /\bcompliance notice\b|\bnon[- ]compliance\b|\bcompliance\b/ }
  ];

  for (const item of explicitPatterns) {
    if (item.regex.test(normalized)) {
      return item.type;
    }
  }

  const sectionMatch = normalized.match(/\b([0-9]{1,3}\([0-9A-Za-z]+\))(?:\s*\([^)]*\))?/);
  if (sectionMatch) {
    return `notice_${sectionMatch[1].replace(/[^0-9A-Za-z]/g, '_')}`;
  }

  return 'unknown';
};

export const getNoticeSummary = (text) => {
  if (!text) return '';
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return '';

  const summaryLines = lines.slice(0, 3);
  let summary = summaryLines.join(' ');
  if (summary.length > 250) {
    summary = `${summary.slice(0, 247).trim()}...`;
  }

  return summary;
};

const extractFirstMatch = (text, patterns) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
};

const extractNoticeDueDate = (text) => {
  const dueDatePatterns = [
    // Primary format: DD-MMM-YYYY (e.g., 02-May-2026, 04-May-2026)
    /Due\s*Date\s*:\s*([0-9]{1,2}-[A-Za-z]{3}-[0-9]{4})/i,
    /Due\s*Date\s*[:\-]?\s*([0-9]{1,2}[\-\/][A-Za-z]{3}[\-\/][0-9]{4})/i,
    /Due\s*Date\s*[:\-]?\s*([0-9]{1,2}[\-\/][A-Za-z]{3,9}[\-\/][0-9]{2,4})/i,
    // Other formats
    /Due\s*Date\s*[:\-]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i,
    /Due\s*Date\s*[:\-]?\s*([A-Za-z]{3,9}\s+[0-9]{1,2},?\s+[0-9]{4})/i,
    /Due\s*Date\s*[:\-]?\s*([0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{4})/i,
    /Due\s*[:\-]?\s*([0-9]{1,2}[\-\/][A-Za-z]{3}[\-\/][0-9]{4})/i,
    /Due\s*[:\-]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i,
    /Due\s*[:\-]?\s*([A-Za-z]{3,9}\s+[0-9]{1,2},?\s+[0-9]{4})/i,
    /Payment\s*Due\s*Date\s*[:\-]?\s*([0-9]{1,2}[\-\/][A-Za-z]{3}[\-\/][0-9]{4})/i,
    /Payment\s*Due\s*Date\s*[:\-]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i,
    /Payment\s*Due\s*[:\-]?\s*([A-Za-z]{3,9}\s+[0-9]{1,2},?\s+[0-9]{4})/i
  ];

  const extracted = extractFirstMatch(text, dueDatePatterns);
  if (!extracted) return '';
  return extracted.replace(/\s{2,}/g, ' ').trim();
};

const extractNoticeTitle = (text) => {
  const titlePatterns = [    /^([0-9]{1,3}\([0-9A-Za-z]+\)\s*\([^\)]+\))/m,
    /^([0-9]{1,3}\([0-9A-Za-z]+\))(?:\s*-\s*Notice)?/m,    /^(Notice\s+of\s+[A-Za-z0-9\s&,-]+)/im,
    /^(Demand\s+Notice|Audit\s+Notice|Penalty\s+Notice|Withholding\s+Tax\s+Notice|Income\s+Tax\s+Notice|Compliance\s+Notice)/im,
    /^(Section\s+[0-9]+(?:\([0-9]+\))?(?:\(4\))?.*Notice)/im,
    /^(Notice\s+under\s+Section\s+[0-9]+(?:\([0-9]+\))?)/im,
    /^(Section\s+[0-9]+(?:\([0-9]+\))?)/im,
    /Notice\s+No\.?:?\s*([A-Za-z0-9\s\-/]+)/i
  ];
  return extractFirstMatch(text, titlePatterns);
};

const extractNoticeSection = (text) => {
  const sectionPatterns = [
    /Section\s+([0-9]+(?:\([0-9]+\))?(?:\([0-9]+\))?)/i,
    /under\s+section\s+([0-9]+(?:\([0-9]+\))?)/i,
    /u\/s\.?\s*([0-9]+(?:\([0-9]+\))?)/i,
    /Section\s*:\s*([0-9]+(?:\([0-9]+\))?)/i
  ];
  return extractFirstMatch(text, sectionPatterns);
};

const extractNoticeeName = (text) => {
  // Primary pattern: Name: FULL NAME Registration No.:
  const primaryPattern = /Name\s*:\s*([A-Z][A-Z\s.'&()\/-]+?)(?=\s+Registration\s+No\.?:|\s+Address:|\s+CNIC|\s+NTN|$)/i;
  const primaryMatch = text.match(primaryPattern);
  if (primaryMatch && primaryMatch[1]) {
    const name = primaryMatch[1].trim();
    // Remove any trailing punctuation or extra spaces
    return name.replace(/[:\-,]+$/, '').replace(/\s{2,}/g, ' ').trim();
  }

  // Secondary patterns for other formats
  const namePatterns = [
    /Name\s+of\s+(?:the\s+)?(?:Noticee|Taxpayer|Assessee)\s*[:\-]\s*([A-Z][A-Za-z0-9\s.'&()\/-]{3,100})/i,
    /(?:Noticee|Taxpayer|Assessee)\s*[:\-]\s*([A-Z][A-Za-z0-9\s.'&()\/-]{3,100})/i,
    /Taxpayer\s+Name\s*[:\-]\s*([A-Z][A-Za-z0-9\s.'&()\/-]{3,100})/i,
    /Assessee\s+Name\s*[:\-]\s*([A-Z][A-Za-z0-9\s.'&()\/-]{3,100})/i,
    /Name\s*[:\-]\s*([A-Z][A-Za-z0-9\s.'&()\/-]{3,100})(?=\s+Registration|\s+Address|\n|$)/i
  ];

  const namedResult = extractFirstMatch(text, namePatterns);
  if (namedResult) {
    // Clean up the name by removing address/location parts
    const cleanedName = namedResult
      .split(/\s+(?:MOHALLAH|COLONY|PARA|CHANAR|STREET|ROAD|LANE|HOUSE|BLOCK|SECTOR|AREA|TOWN|CITY|ADDRESS|Registration)/i)[0]
      .replace(/[:\-,]+$/, '')
      .trim();
    if (cleanedName.length > 2) {
      return cleanedName;
    }
  }

  // Fallback: look for an uppercase name line with at least 2 words
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^[A-Z\s.'\-()\/]+$/.test(line) && line.split(/\s+/).length >= 2 && line.length > 5 && !/^(ADDRESS|NAME|REGISTRATION|DOCUMENT|NOTICE|SECTION|TAX|ONLINE|DUE|PERIOD|MEDIUM|YEAR|DATE|DOCUMENT DATE|REGISTRATION STATUS|MOHALLAH|COLONY|PARA|CHANAR)$/i.test(line)) {
      const cleanedName = line
        .split(/\s+(?:MOHALLAH|COLONY|PARA|CHANAR|STREET|ROAD|LANE|HOUSE|BLOCK|SECTOR|AREA|TOWN|CITY|ADDRESS)/i)[0]
        .replace(/\s{2,}/g, ' ')
        .trim();
      if (cleanedName.length > 3) {
        return cleanedName;
      }
    }
  }

  return '';
};

const extractTaxYear = (text) => {
  const yearPatterns = [
    /Assessment\s+Year\s*[:\-]?\s*([0-9]{4}(?:\s*-\s*[0-9]{2,4})?)/i,
    /Tax\s+Year\s*[:\-]?\s*([0-9]{4}(?:\s*-\s*[0-9]{2,4})?)/i,
    /AY\s*[:\-]?\s*([0-9]{4}(?:\s*-\s*[0-9]{2,4})?)/i,
    /Year\s*[:\-]?\s*([0-9]{4}(?:\s*-\s*[0-9]{2,4})?)/i
  ];

  let year = extractFirstMatch(text, yearPatterns);
  if (year) {
    return year;
  }

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const standaloneYear = lines.find((line) => /^[0-9]{4}$/.test(line));
  if (standaloneYear) {
    return standaloneYear;
  }

  const yearNearTaxLabel = text.match(/Tax\s+Year\s*[:\-]?.{0,40}?([0-9]{4}(?:\s*-\s*[0-9]{2,4})?)/i);
  if (yearNearTaxLabel) {
    return yearNearTaxLabel[1].trim();
  }

  return '';
};

const extractReferenceNumber = (text) => {
  const referencePatterns = [
    /Reference\s+No\.?:?\s*([A-Za-z0-9\-\/]+)/i,
    /Notice\s+No\.?:?\s*([A-Za-z0-9\-\/]+)/i,
    /File\s+No\.?:?\s*([A-Za-z0-9\-\/]+)/i
  ];
  return extractFirstMatch(text, referencePatterns);
};

const extractCnicNtn = (text) => {
  const patterns = [
    /(?:Registration\s+No\.?|Registration\s+Number\s*[:\-]?|CNIC\s*No\.?\s*[:\-]?|CNIC\s*[:\-]?|NTN\s*No\.?\s*[:\-]?|NTN\s*[:\-]?)([0-9\-\s]{10,20})/i,
    /([0-9]{5}-[0-9]{7}-[0-9])/,
    /([0-9]{13,15})/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/[^0-9]/g, '');
      if (cleaned.length >= 13 && cleaned.length <= 15) {
        return cleaned;
      }
    }
  }

  return '';
};

const extractNoticeFields = (text) => ({
  noticeTitle: extractNoticeTitle(text),
  noticeSection: extractNoticeSection(text),
  noticeeName: extractNoticeeName(text),
  taxYear: extractTaxYear(text),
  referenceNumber: extractReferenceNumber(text),
  cnicNtn: extractCnicNtn(text),
  dueDate: extractNoticeDueDate(text)
});

export const extractTextFromImage = async (file) => {
  try {
    const worker = await Tesseract.createWorker({
      logger: (m) => console.log('Tesseract OCR:', m)
    });

    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image.');
  }
};

export const parseNoticeText = async (text) => {
  const cleaned = cleanExtractedNoticeText(text);
  const basicFields = extractNoticeFields(cleaned);

  // Try to get AI-enhanced analysis
  let aiAnalysis = null;
  try {
    aiAnalysis = await analyzeNoticeWithAI(cleaned);
  } catch (error) {
    console.warn('AI analysis failed, using basic extraction:', error);
  }

  return {
    extractedText: cleaned,
    noticeType: identifyNoticeType(cleaned),
    summary: getNoticeSummary(cleaned),
    fields: basicFields,
    aiAnalysis: aiAnalysis
  };
};

export const parseNoticeFile = async (file) => {
  if (!file) {
    throw new Error('No file provided for notice extraction.');
  }

  const lowerName = file.name.toLowerCase();
  let rawText = '';

  if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
    rawText = await extractTextFromPDF(file);
  } else if (IMAGE_MIME_TYPES.includes(file.type) || /\.(png|jpe?g|bmp|tiff?|webp)$/i.test(lowerName)) {
    rawText = await extractTextFromImage(file);
  } else if (file.type.startsWith('text/') || TEXT_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
    rawText = await file.text();
  } else {
    throw new Error('Unsupported notice file type. Please upload PDF, image, or text.');
  }

  const cleaned = cleanExtractedNoticeText(rawText);
  const basicFields = extractNoticeFields(cleaned);

  // Try to get AI-enhanced analysis
  let aiAnalysis = null;
  try {
    aiAnalysis = await analyzeNoticeWithAI(cleaned);
  } catch (error) {
    console.warn('AI analysis failed, using basic extraction:', error);
  }

  return {
    extractedText: cleaned,
    noticeType: identifyNoticeType(cleaned),
    summary: getNoticeSummary(cleaned),
    fields: basicFields,
    aiAnalysis: aiAnalysis
  };
};
