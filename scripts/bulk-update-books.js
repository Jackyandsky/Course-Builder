const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  'https://djvmoqharkefksvceetu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdm1vcWhhcmtlZmtzdmNlZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDk2MDUsImV4cCI6MjA2NDk4NTYwNX0.3B6g4kgKW-TBCiwtpapuLuTzNdEhbAjP68_K9V2onJA'
);

async function bulkUpdateBooks() {
  try {
    console.log('🔄 Starting bulk book updates...');
    
    // Read the database export and CSV data
    const dbBooks = JSON.parse(fs.readFileSync('/mnt/d/dev/cursor/course builder/sample/books/database_books_export.json', 'utf8'));
    console.log(`📚 Loaded ${dbBooks.length} books from database`);
    
    // Read the CSV data from the sync script that was generated
    const fs2 = require('fs');
    const csv = require('csv-parser');
    
    const csvBooks = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('/mnt/d/dev/cursor/course builder/sample/books/book_list.csv')
        .pipe(csv())
        .on('data', (row) => {
          if (row.Name && row.URL && row.Is_Duplicate !== 'TRUE') {
            csvBooks.push({
              name: row.Name.trim(),
              url: row.URL.trim(),
              normalized_name: row.Name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📖 Loaded ${csvBooks.length} books from CSV`);
    
    // Create similarity function
    function similarity(str1, str2) {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      const editDistance = levenshteinDistance(longer, shorter);
      return (longer.length - editDistance) / longer.length;
    }
    
    function levenshteinDistance(str1, str2) {
      const matrix = [];
      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
      }
      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      return matrix[str2.length][str1.length];
    }
    
    function normalizeTitle(title) {
      return title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Find matches and update
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    console.log('🔄 Processing updates...');
    
    for (const dbBook of dbBooks) {
      if (dbBook.file_url) {
        skippedCount++;
        continue; // Skip books that already have file_url
      }
      
      const dbNormalized = normalizeTitle(dbBook.title);
      let bestMatch = null;
      let bestSimilarity = 0;
      
      for (const csvBook of csvBooks) {
        const sim = similarity(dbNormalized, csvBook.normalized_name);
        const isMatch = sim >= 0.90 || 
                       (dbNormalized.length > 15 && csvBook.normalized_name.length > 15 && sim >= 0.85);
        
        if (isMatch && sim > bestSimilarity) {
          bestMatch = csvBook;
          bestSimilarity = sim;
        }
      }
      
      if (bestMatch && bestSimilarity >= 0.85) {
        try {
          console.log(`📝 Updating "${dbBook.title}" -> "${bestMatch.name}" (${Math.round(bestSimilarity * 100)}% match)`);
          
          const { error } = await supabase
            .from('books')
            .update({ file_url: bestMatch.url })
            .eq('id', dbBook.id);
          
          if (error) {
            console.error(`❌ Error updating ${dbBook.id}:`, error.message);
            errorCount++;
          } else {
            updatedCount++;
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (error) {
          console.error(`❌ Exception updating ${dbBook.id}:`, error.message);
          errorCount++;
        }
      }
    }
    
    console.log(`\n✅ Update phase completed:`);
    console.log(`   - Updated: ${updatedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Skipped (already have file_url): ${skippedCount}`);
    
    // Now handle inserts for books that don't exist in database
    console.log('\n🔄 Processing new book inserts...');
    
    let insertedCount = 0;
    let insertErrorCount = 0;
    const newBooks = [];
    
    for (const csvBook of csvBooks) {
      let found = false;
      
      for (const dbBook of dbBooks) {
        const dbNormalized = normalizeTitle(dbBook.title);
        const sim = similarity(dbNormalized, csvBook.normalized_name);
        
        if (sim >= 0.85) {
          found = true;
          break;
        }
      }
      
      if (!found) {
        newBooks.push({
          title: csvBook.name,
          file_url: csvBook.url,
          content_type: 'pdf',
          language: 'en',
          is_public: false,
          user_id: '4ef526fd-43a0-44fd-82e4-2ab404ef673c' // SHARED_USER_ID
        });
      }
    }
    
    console.log(`📝 Found ${newBooks.length} new books to insert`);
    
    // Insert new books in batches of 50
    const batchSize = 50;
    for (let i = 0; i < newBooks.length; i += batchSize) {
      const batch = newBooks.slice(i, i + batchSize);
      
      try {
        console.log(`📝 Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(newBooks.length/batchSize)} (${batch.length} books)`);
        
        const { data, error } = await supabase
          .from('books')
          .insert(batch);
        
        if (error) {
          console.error(`❌ Error inserting batch:`, error.message);
          insertErrorCount += batch.length;
        } else {
          insertedCount += batch.length;
          console.log(`✅ Successfully inserted ${batch.length} books`);
        }
        
        // Delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Exception inserting batch:`, error.message);
        insertErrorCount += batch.length;
      }
    }
    
    console.log(`\n🎉 Book synchronization completed!`);
    console.log(`📊 Final Summary:`);
    console.log(`   - Database books (original): ${dbBooks.length}`);
    console.log(`   - CSV books: ${csvBooks.length}`);
    console.log(`   - Books updated: ${updatedCount}`);
    console.log(`   - Books inserted: ${insertedCount}`);
    console.log(`   - Update errors: ${errorCount}`);
    console.log(`   - Insert errors: ${insertErrorCount}`);
    console.log(`   - Books skipped (had file_url): ${skippedCount}`);
    
    // Final verification
    const { count: finalTotal } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true });
    
    const { count: booksWithUrl } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .not('file_url', 'is', null);
    
    console.log(`\n📊 Current Database State:`);
    console.log(`   - Total books: ${finalTotal}`);
    console.log(`   - Books with file_url: ${booksWithUrl}`);
    console.log(`   - Books without file_url: ${finalTotal - booksWithUrl}`);
    
  } catch (error) {
    console.error('❌ Bulk update failed:', error);
  }
}

// Run the bulk updates
if (require.main === module) {
  bulkUpdateBooks();
}

module.exports = { bulkUpdateBooks };