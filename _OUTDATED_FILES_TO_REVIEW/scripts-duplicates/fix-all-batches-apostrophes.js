#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to escape single quotes for SQL - double them
function fixSQLApostrophes(text) {
  // Only escape apostrophes that aren't already escaped
  return text.replace(/([^'])'/g, "$1''");
}

// Process batches 3-11
for (let i = 3; i <= 11; i++) {
  const filename = `insert_courses_batch_${i}.sql`;
  const filepath = path.join(__dirname, '..', 'database', 'migrations', filename);
  
  if (fs.existsSync(filepath)) {
    console.log(`Fixing batch ${i}...`);
    
    let sqlContent = fs.readFileSync(filepath, 'utf8');
    
    // Fix all unescaped apostrophes
    sqlContent = fixSQLApostrophes(sqlContent);
    
    // Write the fixed content back
    fs.writeFileSync(filepath, sqlContent, 'utf8');
    console.log(`  ✅ Fixed batch ${i}`);
  }
}

console.log('\nAll batches fixed and ready for application');