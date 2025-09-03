const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  'https://djvmoqharkefksvceetu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdm1vcWhhcmtlZmtzdmNlZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDk2MDUsImV4cCI6MjA2NDk4NTYwNX0.3B6g4kgKW-TBCiwtpapuLuTzNdEhbAjP68_K9V2onJA'
);

async function executeBookUpdates() {
  try {
    console.log('🔄 Starting bulk book updates...');
    
    // Read the final SQL files
    const updateSQL = fs.readFileSync('/mnt/d/dev/cursor/course builder/sample/books/final_updates.sql', 'utf8');
    const insertSQL = fs.readFileSync('/mnt/d/dev/cursor/course builder/sample/books/final_inserts.sql', 'utf8');
    
    // Extract individual UPDATE statements from the file
    const updateStatements = updateSQL
      .split('\n')
      .filter(line => line.trim().startsWith('UPDATE books'))
      .map(line => line.trim().replace(/;$/, ''));
    
    console.log(`📝 Found ${updateStatements.length} UPDATE statements`);
    
    // Execute updates in batches
    const batchSize = 10;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < updateStatements.length; i += batchSize) {
      const batch = updateStatements.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(updateStatements.length/batchSize)}`);
      
      for (const statement of batch) {
        try {
          await supabase.rpc('execute_sql', { sql_statement: statement });
          updatedCount++;
        } catch (error) {
          console.warn(`⚠️  Update failed: ${error.message}`);
          errorCount++;
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`✅ Updates completed: ${updatedCount} successful, ${errorCount} failed`);
    
    // Now handle inserts
    console.log('\n🔄 Starting bulk inserts...');
    
    // Extract INSERT statements
    const insertStatements = insertSQL
      .split('\n')
      .filter(line => line.trim().startsWith('INSERT INTO books'))
      .map(line => line.trim().replace(/;$/, ''));
    
    console.log(`📝 Found ${insertStatements.length} INSERT statements`);
    
    let insertedCount = 0;
    let insertErrorCount = 0;
    
    for (let i = 0; i < insertStatements.length; i += batchSize) {
      const batch = insertStatements.slice(i, i + batchSize);
      console.log(`🔄 Processing insert batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(insertStatements.length/batchSize)}`);
      
      for (const statement of batch) {
        try {
          await supabase.rpc('execute_sql', { sql_statement: statement });
          insertedCount++;
        } catch (error) {
          console.warn(`⚠️  Insert failed: ${error.message}`);
          insertErrorCount++;
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`✅ Inserts completed: ${insertedCount} successful, ${insertErrorCount} failed`);
    
    // Final verification
    console.log('\n📊 Final verification...');
    const { count: totalBooks } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true });
    
    const { count: booksWithUrl } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .not('file_url', 'is', null);
    
    console.log(`\n🎉 Book synchronization completed!`);
    console.log(`📊 Final Statistics:`);
    console.log(`   - Total books in database: ${totalBooks}`);
    console.log(`   - Books with file_url: ${booksWithUrl}`);
    console.log(`   - Books without file_url: ${totalBooks - booksWithUrl}`);
    console.log(`   - Updated in this run: ${updatedCount}`);
    console.log(`   - Inserted in this run: ${insertedCount}`);
    console.log(`   - Update errors: ${errorCount}`);
    console.log(`   - Insert errors: ${insertErrorCount}`);
    
  } catch (error) {
    console.error('❌ Bulk update failed:', error);
  }
}

// Run the bulk updates
if (require.main === module) {
  executeBookUpdates();
}

module.exports = { executeBookUpdates };