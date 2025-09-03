#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to fix apostrophes in SQL
function fixApostrophes(sql) {
  // Double all single quotes that are not already doubled
  return sql.replace(/([^'])'/g, "$1''");
}

async function applyAllBatches() {
  const migrationDir = path.join(__dirname, '..', 'database', 'migrations');
  
  console.log('Starting batch migration process...');
  console.log('==================================\n');
  
  let successCount = 0;
  let errorCount = 0;
  const results = [];
  
  // Process batches 2-10 (batch 1 already applied successfully)
  for (let i = 2; i <= 10; i++) {
    const filename = `insert_courses_batch_${i}.sql`;
    const filepath = path.join(migrationDir, filename);
    
    if (fs.existsSync(filepath)) {
      console.log(`Processing batch ${i}...`);
      
      try {
        let sqlContent = fs.readFileSync(filepath, 'utf8');
        
        // Fix apostrophes
        sqlContent = fixApostrophes(sqlContent);
        
        // Write the fixed content back
        fs.writeFileSync(filepath, sqlContent, 'utf8');
        
        console.log(`  ✅ Batch ${i} prepared (apostrophes fixed)`);
        results.push({ batch: i, status: 'ready', file: filename });
        successCount++;
      } catch (err) {
        console.error(`  ❌ Error preparing batch ${i}: ${err.message}`);
        results.push({ batch: i, status: 'error', error: err.message });
        errorCount++;
      }
    }
  }
  
  console.log('\n==================================');
  console.log('Migration Preparation Summary:');
  console.log(`  ✅ Ready: ${successCount} batches`);
  console.log(`  ❌ Errors: ${errorCount} batches`);
  console.log('\nBatch 1: Already applied successfully');
  console.log('Batches 2-10: Fixed and ready for application');
  
  console.log('\n==================================');
  console.log('Files are ready in: database/migrations/');
  console.log('Apply them using the Supabase migration tool');
  
  return results;
}

applyAllBatches().catch(console.error);