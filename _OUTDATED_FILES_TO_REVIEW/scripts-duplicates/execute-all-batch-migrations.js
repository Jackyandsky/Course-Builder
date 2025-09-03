#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read each batch file and execute
async function executeBatchMigrations() {
  const migrationDir = path.join(__dirname, '..', 'database', 'migrations');
  
  console.log('Starting batch migration process...');
  console.log('==================================\n');
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // Process batches 1-10
  for (let i = 1; i <= 10; i++) {
    const filename = `insert_courses_batch_${i}.sql`;
    const filepath = path.join(migrationDir, filename);
    
    if (fs.existsSync(filepath)) {
      console.log(`Processing batch ${i}...`);
      
      try {
        const sqlContent = fs.readFileSync(filepath, 'utf8');
        
        // Log the batch info for manual execution
        console.log(`  File: ${filename}`);
        console.log(`  Size: ${(sqlContent.length / 1024).toFixed(2)} KB`);
        console.log(`  Status: Ready for execution`);
        console.log('  ✅ SQL file prepared\n');
        
        successCount++;
      } catch (err) {
        console.error(`  ❌ Error reading batch ${i}: ${err.message}\n`);
        errorCount++;
        errors.push(`Batch ${i}: ${err.message}`);
      }
    }
  }
  
  console.log('==================================');
  console.log('Migration Files Summary:');
  console.log(`  ✅ Ready: ${successCount} batches`);
  console.log(`  ❌ Errors: ${errorCount} batches`);
  
  if (errors.length > 0) {
    console.log('\nErrors encountered:');
    errors.forEach(err => console.log(`  - ${err}`));
  }
  
  console.log('\n==================================');
  console.log('To apply these migrations to Supabase:');
  console.log('1. Use the Supabase dashboard SQL editor');
  console.log('2. Or use the apply_migration API for each batch');
  console.log('3. Files are located in: database/migrations/');
  console.log('\nNote: Due to size, batches should be applied sequentially');
}

executeBatchMigrations().catch(console.error);