#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://djvmoqharkefksvceetu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigrations() {
  const migrationDir = path.join(__dirname, '..', 'database', 'migrations');
  
  // Get all batch migration files
  const batchFiles = [];
  for (let i = 1; i <= 10; i++) {
    const filename = `insert_courses_batch_${i}.sql`;
    const filepath = path.join(migrationDir, filename);
    if (fs.existsSync(filepath)) {
      batchFiles.push({ name: filename, path: filepath, batch: i });
    }
  }
  
  console.log(`Found ${batchFiles.length} migration files to apply\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const file of batchFiles) {
    console.log(`Applying batch ${file.batch}...`);
    
    try {
      const sql = fs.readFileSync(file.path, 'utf8');
      
      // Execute the SQL
      const { error } = await supabase.rpc('exec', { sql });
      
      if (error) {
        console.error(`  ❌ Error in batch ${file.batch}:`, error.message);
        errorCount++;
      } else {
        console.log(`  ✅ Batch ${file.batch} applied successfully`);
        successCount++;
      }
      
      // Add a small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      console.error(`  ❌ Error reading/applying batch ${file.batch}:`, err.message);
      errorCount++;
    }
  }
  
  console.log(`\n=== Migration Summary ===`);
  console.log(`✅ Successful: ${successCount} batches`);
  console.log(`❌ Failed: ${errorCount} batches`);
  
  if (successCount === batchFiles.length) {
    console.log('\n🎉 All migrations applied successfully!');
  } else if (errorCount > 0) {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.');
  }
}

// Run the migrations
applyMigrations().catch(console.error);