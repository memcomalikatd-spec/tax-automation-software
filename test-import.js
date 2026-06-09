/**
 * Test script to verify template import functionality
 */

const XLSX = require('xlsx');
const fs = require('fs');

// Template configuration
const TEMPLATE_SHEET_NAME = 'Client Data';
const TEMPLATE_HEADERS = [
  'FILE NO',
  'NEW NTN',
  'TITLE OF THE CASE *',
  'NIC NO (CNIC)',
  'PIN (IRIS)',
  'PASSWORD (IRIS)',
  'MAIL',
  'PASSWORD (MAIL)',
  'PHONE',
  'ADDRESS',
  'CITY',
  'PERSON',
  'SOURCE OF INCOME',
  'BUSINESS CLASSIFICATION',
  'STATUS',
  'TAX YEAR'
];

// Simulate the import function
function testImport(filePath) {
  console.log('========================================');
  console.log('TESTING TEMPLATE IMPORT');
  console.log('========================================\n');
  
  try {
    console.log('📂 Reading file:', filePath);
    const workbook = XLSX.readFile(filePath);
    
    console.log('✅ File read successfully\n');
    
    // Check sheets
    console.log('📋 Available sheets:', workbook.SheetNames.join(', '));
    
    if (!workbook.SheetNames.includes(TEMPLATE_SHEET_NAME)) {
      console.error(`\n❌ ERROR: Sheet "${TEMPLATE_SHEET_NAME}" not found!`);
      console.log(`Available sheets: ${workbook.SheetNames.join(', ')}`);
      return;
    }
    
    console.log(`✅ "${TEMPLATE_SHEET_NAME}" sheet found\n`);
    
    // Read data
    const worksheet = workbook.Sheets[TEMPLATE_SHEET_NAME];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    console.log(`📊 Total rows: ${jsonData.length}\n`);
    
    if (jsonData.length === 0) {
      console.error('❌ ERROR: No data found in Client Data sheet');
      return;
    }
    
    // Check headers
    const firstRow = jsonData[0];
    const fileHeaders = Object.keys(firstRow).filter(h => h && !h.startsWith('__'));
    
    console.log('📋 Column headers found:');
    fileHeaders.forEach(h => console.log(`   • ${h}`));
    console.log('');
    
    // Validate headers
    const missingHeaders = TEMPLATE_HEADERS.filter(h => 
      !fileHeaders.some(fh => fh.toUpperCase().includes(h.split(' ')[0]))
    );
    
    if (missingHeaders.length > 0) {
      console.warn('⚠️  Missing headers:', missingHeaders.join(', '));
    } else {
      console.log('✅ All required headers present\n');
    }
    
    // Process rows
    console.log('========================================');
    console.log('PROCESSING ROWS');
    console.log('========================================\n');
    
    let validCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    
    jsonData.forEach((row, index) => {
      const rowNumber = index + 2;
      const name = row['TITLE OF THE CASE *'] || row['TITLE OF THE CASE'] || '';
      const ntn = row['NEW NTN'] || '';
      const cnic = row['NIC NO (CNIC)'] || '';
      
      // Check if empty
      if (!name && !ntn && !cnic) {
        console.log(`Row ${rowNumber}: ⚠️  Empty row - skipped`);
        warningCount++;
        return;
      }
      
      // Validate required field
      if (!name || name.trim() === '') {
        console.log(`Row ${rowNumber}: ❌ ERROR - Missing client name (TITLE OF THE CASE)`);
        errorCount++;
        return;
      }
      
      // Validate CNIC format if provided
      if (cnic && cnic.trim() !== '') {
        const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;
        if (!cnicPattern.test(cnic)) {
          console.log(`Row ${rowNumber}: ⚠️  WARNING - Invalid CNIC format: ${cnic}`);
          warningCount++;
        }
      }
      
      console.log(`Row ${rowNumber}: ✅ Valid - ${name}`);
      validCount++;
    });
    
    // Summary
    console.log('\n========================================');
    console.log('IMPORT SUMMARY');
    console.log('========================================\n');
    console.log(`Total Rows:     ${jsonData.length}`);
    console.log(`✅ Valid:       ${validCount}`);
    console.log(`❌ Errors:      ${errorCount}`);
    console.log(`⚠️  Warnings:    ${warningCount}`);
    console.log(`📊 Success Rate: ${((validCount / jsonData.length) * 100).toFixed(1)}%\n`);
    
    if (validCount > 0) {
      console.log('🎉 Import would succeed with', validCount, 'client(s)!\n');
    } else {
      console.log('❌ Import would fail - no valid clients found\n');
    }
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
  }
}

// Run test
const templatePath = 'templete/client_import_template_validated (1).xlsx';
testImport(templatePath);
