#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Summary of what we're applying
console.log('====================================');
console.log('FINAL COURSE IMPORT SUMMARY');
console.log('====================================\n');
console.log('Total courses to import: 194');
console.log('Already imported in batch 1: 20 courses');
console.log('Already imported in batch 2: 20 courses');  
console.log('Remaining to import (batches 3-11): 154 courses\n');

console.log('Batch Status:');
console.log('  ✅ Batch 1: Applied (20 courses)');
console.log('  ✅ Batch 2: Applied (20 courses)');

// Check remaining batches
for (let i = 3; i <= 11; i++) {
  const filename = `insert_courses_batch_${i}.sql`;
  const filepath = path.join(__dirname, '..', 'database', 'migrations', filename);
  
  if (fs.existsSync(filepath)) {
    const content = fs.readFileSync(filepath, 'utf8');
    // Count number of INSERT value sets (count commas between value sets + 1)
    const matches = content.match(/\),\s*\(/g);
    const courseCount = matches ? matches.length + 1 : 1;
    console.log(`  📋 Batch ${i}: Ready (${courseCount} courses)`);
  }
}

console.log('\n====================================');
console.log('Next Steps:');
console.log('1. Apply batches 3-11 using mcp__supabase__apply_migration');
console.log('2. Verify all courses imported successfully');
console.log('3. Check category distribution');
console.log('====================================');

// Output the file paths for easy reference
console.log('\nFile paths:');
for (let i = 3; i <= 11; i++) {
  console.log(`./database/migrations/insert_courses_batch_${i}.sql`);
}