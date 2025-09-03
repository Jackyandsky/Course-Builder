#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to properly escape apostrophes in SQL strings
function fixSQLApostrophes(sql) {
  // Find all string values and escape apostrophes within them
  return sql.replace(/'([^']*)'/g, (match, content) => {
    // Escape single quotes inside the content
    const escaped = content.replace(/'/g, "''");
    return `'${escaped}'`;
  });
}

// Process batches 2-10
for (let i = 2; i <= 10; i++) {
  const filename = `insert_courses_batch_${i}.sql`;
  const filepath = path.join(__dirname, '..', 'database', 'migrations', filename);
  
  if (fs.existsSync(filepath)) {
    console.log(`Fixing batch ${i}...`);
    
    // Read the original generated file from backup if exists, otherwise current
    const backupPath = filepath + '.backup';
    let sqlContent;
    
    if (fs.existsSync(backupPath)) {
      sqlContent = fs.readFileSync(backupPath, 'utf8');
    } else {
      // Read current and create backup
      sqlContent = fs.readFileSync(filepath, 'utf8');
      fs.writeFileSync(backupPath, sqlContent, 'utf8');
    }
    
    // Fix apostrophes properly
    const fixed = fixSQLApostrophes(sqlContent);
    
    // Write the fixed content
    fs.writeFileSync(filepath, fixed, 'utf8');
    console.log(`  ✅ Fixed batch ${i}`);
  }
}

console.log('\nAll batches fixed and ready for application');