const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

// Initialize Supabase client
const supabase = createClient(
  'https://djvmoqharkefksvceetu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdm1vcWhhcmtlZmtzdmNlZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDk2MDUsImV4cCI6MjA2NDk4NTYwNX0.3B6g4kgKW-TBCiwtpapuLuTzNdEhbAjP68_K9V2onJA'
);

// String similarity function
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

async function syncBooks() {
  try {
    console.log('🔄 Starting book synchronization...');
    
    // 1. Fetch all books from database
    console.log('📚 Fetching all books from database...');
    const { data: dbBooks, error: dbError } = await supabase
      .from('books')
      .select('id, title, author, file_url')
      .order('title');
    
    if (dbError) {
      console.error('❌ Error fetching database books:', dbError);
      return;
    }
    
    console.log(`✅ Found ${dbBooks.length} books in database`);
    
    // 2. Load CSV books
    console.log('📖 Loading CSV books...');
    const csvBooks = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream('/mnt/d/dev/cursor/course builder/sample/books/book_list.csv')
        .pipe(csv())
        .on('data', (row) => {
          if (row.Name && row.URL && row.Is_Duplicate !== 'TRUE') {
            csvBooks.push({
              name: row.Name.trim(),
              url: row.URL.trim(),
              normalized_name: normalizeTitle(row.Name.trim())
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`✅ Loaded ${csvBooks.length} unique books from CSV`);
    
    // 3. Match and update existing books
    console.log('🔄 Matching and updating existing books...');
    let matchedCount = 0;
    let updatedCount = 0;
    
    for (const dbBook of dbBooks) {
      if (dbBook.file_url) {
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
        matchedCount++;
        console.log(`📝 Updating "${dbBook.title}" -> "${bestMatch.name}" (${Math.round(bestSimilarity * 100)}% match)`);
        
        // Update the book with file_url
        const { error: updateError } = await supabase
          .from('books')
          .update({ file_url: bestMatch.url })
          .eq('id', dbBook.id);
        
        if (updateError) {
          console.error(`❌ Error updating book ${dbBook.id}:`, updateError);
        } else {
          updatedCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Matched ${matchedCount} books, updated ${updatedCount} successfully`);
    
    // 4. Find books in CSV that don't exist in database
    console.log('🔍 Finding new books to insert...');
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
          file_url: csvBook.url
        });
      }
    }
    
    console.log(`📋 Found ${newBooks.length} new books to insert`);
    
    // 5. Insert new books in batches
    if (newBooks.length > 0) {
      console.log('🔄 Inserting new books...');
      const batchSize = 50;
      let insertedCount = 0;
      
      for (let i = 0; i < newBooks.length; i += batchSize) {
        const batch = newBooks.slice(i, i + batchSize);
        
        const { data: insertedBooks, error: insertError } = await supabase
          .from('books')
          .insert(batch)
          .select('id, title');
        
        if (insertError) {
          console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError);
        } else {
          insertedCount += insertedBooks.length;
          console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${insertedBooks.length} books`);
        }
        
        // Delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`✅ Successfully inserted ${insertedCount} new books`);
    }
    
    console.log('\n🎉 Book synchronization completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Database books: ${dbBooks.length}`);
    console.log(`   - CSV books: ${csvBooks.length}`);
    console.log(`   - Updated existing: ${updatedCount}`);
    console.log(`   - Inserted new: ${insertedCount}`);
    
  } catch (error) {
    console.error('❌ Synchronization failed:', error);
  }
}

// Run the synchronization
if (require.main === module) {
  syncBooks();
}

module.exports = { syncBooks };