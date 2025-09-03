const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  'https://djvmoqharkefksvceetu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdm1vcWhhcmtlZmtzdmNlZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDk2MDUsImV4cCI6MjA2NDk4NTYwNX0.3B6g4kgKW-TBCiwtpapuLuTzNdEhbAjP68_K9V2onJA'
);

// Levenshtein distance algorithm
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

// Calculate similarity percentage
function similarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Normalize title for comparison
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Add is_duplicate column if it doesn't exist
async function ensureDuplicateColumn() {
  try {
    console.log('🔧 Ensuring is_duplicate column exists...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'books' AND column_name = 'is_duplicate'
          ) THEN
            ALTER TABLE books ADD COLUMN is_duplicate BOOLEAN DEFAULT FALSE;
          END IF;
        END $$;
      `
    });

    if (error) {
      // Try alternative method
      const { error: alterError } = await supabase.from('books').select('is_duplicate').limit(1);
      if (alterError && alterError.message.includes('does not exist')) {
        console.log('📝 Adding is_duplicate column...');
        // We'll need to add it via migration instead
        throw new Error('Need to add is_duplicate column via migration');
      }
    }
    
    console.log('✅ is_duplicate column is ready');
  } catch (error) {
    console.log('⚠️  Warning: Could not add is_duplicate column:', error.message);
    console.log('💡 Please add this column manually: ALTER TABLE books ADD COLUMN is_duplicate BOOLEAN DEFAULT FALSE;');
  }
}

async function findAndMarkDuplicates() {
  try {
    console.log('🔍 Starting duplicate detection...');
    
    // First ensure the duplicate column exists
    await ensureDuplicateColumn();
    
    // Get all books
    console.log('📚 Fetching all books...');
    let allBooks = [];
    let from = 0;
    const batchSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author, file_url, created_at')
        .order('created_at', { ascending: true })
        .range(from, from + batchSize - 1);
      
      if (error) throw error;
      if (!data || data.length === 0) break;
      
      allBooks = allBooks.concat(data);
      from += batchSize;
      
      console.log(`📖 Loaded ${allBooks.length} books so far...`);
    }
    
    console.log(`📊 Total books loaded: ${allBooks.length}`);
    
    // Group books for duplicate detection
    const duplicateGroups = [];
    const processed = new Set();
    
    console.log('🔍 Analyzing for duplicates...');
    
    for (let i = 0; i < allBooks.length; i++) {
      if (processed.has(allBooks[i].id)) continue;
      
      const currentBook = allBooks[i];
      const currentNormalized = normalizeTitle(currentBook.title);
      const duplicates = [currentBook];
      
      // Find all similar books
      for (let j = i + 1; j < allBooks.length; j++) {
        if (processed.has(allBooks[j].id)) continue;
        
        const compareBook = allBooks[j];
        const compareNormalized = normalizeTitle(compareBook.title);
        
        // Check for exact match or high similarity
        const sim = similarity(currentNormalized, compareNormalized);
        const isExactMatch = currentNormalized === compareNormalized;
        const isFuzzyMatch = sim >= 0.95; // Very high threshold for duplicates
        
        // Also check if one title contains the other (for cases like "Book Title" vs "Book Title (Author)")
        const isContainedMatch = currentNormalized.includes(compareNormalized) || 
                                compareNormalized.includes(currentNormalized);
        
        if (isExactMatch || isFuzzyMatch || (isContainedMatch && sim >= 0.85)) {
          duplicates.push(compareBook);
          processed.add(compareBook.id);
        }
      }
      
      if (duplicates.length > 1) {
        // Sort by creation date to keep the earliest one
        duplicates.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        duplicateGroups.push(duplicates);
      }
      
      processed.add(currentBook.id);
      
      if (i % 100 === 0) {
        console.log(`🔍 Processed ${i}/${allBooks.length} books...`);
      }
    }
    
    console.log(`\n📊 Found ${duplicateGroups.length} groups of duplicates`);
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      totalBooks: allBooks.length,
      duplicateGroups: duplicateGroups.length,
      totalDuplicates: duplicateGroups.reduce((sum, group) => sum + (group.length - 1), 0),
      groups: duplicateGroups.map((group, index) => ({
        groupId: index + 1,
        title: group[0].title,
        count: group.length,
        books: group.map((book, idx) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          hasUrl: !!book.file_url,
          createdAt: book.created_at,
          keepThis: idx === 0, // Keep the first one (earliest)
          markAsDuplicate: idx > 0
        }))
      }))
    };
    
    // Write report to file
    const reportPath = '/mnt/d/dev/cursor/course builder/sample/books/duplicate_report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
    
    // Mark duplicates in database
    console.log('\n🏷️  Marking duplicates in database...');
    let markedCount = 0;
    let errorCount = 0;
    
    for (const group of duplicateGroups) {
      // Skip the first book (keep it), mark the rest as duplicates
      for (let i = 1; i < group.length; i++) {
        try {
          const { error } = await supabase
            .from('books')
            .update({ is_duplicate: true })
            .eq('id', group[i].id);
          
          if (error) {
            console.error(`❌ Error marking ${group[i].id} as duplicate:`, error.message);
            errorCount++;
          } else {
            markedCount++;
            console.log(`✅ Marked "${group[i].title}" as duplicate`);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (error) {
          console.error(`❌ Exception marking ${group[i].id}:`, error.message);
          errorCount++;
        }
      }
    }
    
    console.log(`\n🎉 Duplicate detection completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total books analyzed: ${allBooks.length}`);
    console.log(`   - Duplicate groups found: ${duplicateGroups.length}`);
    console.log(`   - Total duplicates: ${duplicateGroups.reduce((sum, group) => sum + (group.length - 1), 0)}`);
    console.log(`   - Books marked as duplicate: ${markedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Books to keep: ${duplicateGroups.length}`);
    
    // Show top duplicate groups
    console.log(`\n📋 Top 10 duplicate groups:`);
    duplicateGroups
      .sort((a, b) => b.length - a.length)
      .slice(0, 10)
      .forEach((group, index) => {
        console.log(`   ${index + 1}. "${group[0].title}" (${group.length} copies)`);
      });
    
    return report;
    
  } catch (error) {
    console.error('❌ Duplicate detection failed:', error);
    throw error;
  }
}

// Run the duplicate detection
if (require.main === module) {
  findAndMarkDuplicates()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { findAndMarkDuplicates };