#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function applyAllMigrations() {
  const migrationDir = path.join(__dirname, '..', 'database', 'migrations');
  
  console.log('===================================');
  console.log('COURSE IMPORT MIGRATION PROCESS');
  console.log('===================================\n');
  
  console.log('Total courses to import: 187');
  console.log('Split into 10 batches (20 courses each)\n');
  
  console.log('Migration files ready in:');
  console.log(`${migrationDir}\n`);
  
  console.log('Files to apply in order:');
  
  for (let i = 1; i <= 10; i++) {
    const filename = `insert_courses_batch_${i}.sql`;
    const filepath = path.join(migrationDir, filename);
    
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      console.log(`  ${i}. ${filename} (${(stats.size / 1024).toFixed(2)} KB)`);
    }
  }
  
  console.log('\n===================================');
  console.log('IMPORTANT: Apply migrations using one of these methods:');
  console.log('\n1. Supabase Dashboard (Recommended for large batches):');
  console.log('   - Go to your Supabase project SQL editor');
  console.log('   - Copy and paste each batch file content');
  console.log('   - Execute one at a time');
  
  console.log('\n2. Using Supabase CLI:');
  console.log('   supabase db push --db-url "postgresql://..."');
  
  console.log('\n3. Direct PostgreSQL connection:');
  console.log('   psql -h db.djvmoqharkefksvceetu.supabase.co -U postgres -d postgres -f insert_courses_batch_1.sql');
  
  console.log('\n===================================');
  console.log('Batch Summary:');
  console.log('  Batch 1-3: Reading courses (Close Reading category)');
  console.log('  Batch 4-6: Writing courses (Writing Practice, Essays)');
  console.log('  Batch 7-8: Literature & Critical Analysis courses');
  console.log('  Batch 9-10: Mixed categories (Vocabulary, Reading & Writing)');
  console.log('\n===================================');
}

applyAllMigrations().catch(console.error);