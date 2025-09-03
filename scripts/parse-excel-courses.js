#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Read the Excel file
const filePath = path.join(__dirname, '..', 'sample', 'course_list', 'i-GPS Comprehensive Courselist.xlsx');

try {
  // Read the workbook
  const workbook = XLSX.readFile(filePath);
  
  // Get the first sheet name
  const sheetName = workbook.SheetNames[0];
  console.log('Sheet name:', sheetName);
  
  // Get the worksheet
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Display first few rows to understand structure
  console.log('\nFirst 10 rows of data:');
  data.slice(0, 10).forEach((row, index) => {
    console.log(`Row ${index}:`, row);
  });
  
  // Also show column headers if they exist
  if (data.length > 0) {
    console.log('\nPossible column headers:', data[0]);
    console.log('\nTotal rows:', data.length);
  }
  
  // Save to JSON for inspection
  const outputPath = path.join(__dirname, 'excel-courses-raw.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log('\nRaw data saved to:', outputPath);
  
} catch (error) {
  console.error('Error reading Excel file:', error.message);
}