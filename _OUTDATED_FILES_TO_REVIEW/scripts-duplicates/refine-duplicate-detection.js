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

function similarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Improved normalization that preserves volume/part numbers
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s\d]/g, ' ') // Keep numbers, convert punctuation to spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Check if titles are series/volume variations
function areSeriesVariations(title1, title2) {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);
  
  // Remove common volume/part indicators
  const removeVolumeIndicators = (str) => {
    return str
      .replace(/\b(vol|volume|part|book|chapter|episode|issue)\s*\d+/gi, '')
      .replace(/\b\d+\s*(of|\/)\s*\d+/gi, '') // "01 of 10", "1/10"
      .replace(/\b(no|number)\s*\d+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const base1 = removeVolumeIndicators(norm1);
  const base2 = removeVolumeIndicators(norm2);
  
  // If the base titles are very similar, they might be series
  const baseSimilarity = similarity(base1, base2);
  
  // Check for volume numbers in the original titles
  const hasVolumeNumbers1 = /\b(\d+\s*(of|\/)\s*\d+|\d{2,}|\bvol\s*\d+|\bpart\s*\d+|\bissue\s*\d+)\b/i.test(norm1);
  const hasVolumeNumbers2 = /\b(\d+\s*(of|\/)\s*\d+|\d{2,}|\bvol\s*\d+|\bpart\s*\d+|\bissue\s*\d+)\b/i.test(norm2);
  
  // If base titles are very similar AND both have volume indicators, they're series variations
  return baseSimilarity > 0.8 && hasVolumeNumbers1 && hasVolumeNumbers2;
}

async function refineDuplicateDetection() {
  try {
    console.log('🔍 Starting refined duplicate detection...');
    
    // First, reset all incorrectly marked duplicates
    console.log('🔄 Resetting is_duplicate flags...');
    const { error: resetError } = await supabase
      .from('books')
      .update({ is_duplicate: false })
      .eq('is_duplicate', true);
    
    if (resetError) throw resetError;
    
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
    }
    
    console.log(`📊 Total books loaded: ${allBooks.length}`);
    
    // Group books for duplicate detection with refined logic
    const duplicateGroups = [];
    const processed = new Set();
    
    console.log('🔍 Analyzing for duplicates with improved logic...');
    
    for (let i = 0; i < allBooks.length; i++) {
      if (processed.has(allBooks[i].id)) continue;
      
      const currentBook = allBooks[i];
      const currentNormalized = normalizeTitle(currentBook.title);
      const duplicates = [currentBook];
      
      // Find truly duplicate books (not series variations)
      for (let j = i + 1; j < allBooks.length; j++) {
        if (processed.has(allBooks[j].id)) continue;
        
        const compareBook = allBooks[j];
        const compareNormalized = normalizeTitle(compareBook.title);
        
        // Skip if these are series variations
        if (areSeriesVariations(currentBook.title, compareBook.title)) {
          continue;
        }
        
        // Check for true duplicates
        const sim = similarity(currentNormalized, compareNormalized);
        const isExactMatch = currentNormalized === compareNormalized;
        const isVeryHighSimilarity = sim >= 0.98; // Very high threshold
        
        // Check if one title fully contains the other for simple case variations
        const isFullContainment = (
          currentNormalized.includes(compareNormalized) || 
          compareNormalized.includes(currentNormalized)
        ) && sim >= 0.90;
        
        if (isExactMatch || isVeryHighSimilarity || isFullContainment) {
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
    
    console.log(`\n📊 Found ${duplicateGroups.length} groups of true duplicates`);
    
    // Save refined report
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
          keepThis: idx === 0,
          markAsDuplicate: idx > 0
        }))
      }))
    };
    
    // Write refined report
    const reportPath = '/mnt/d/dev/cursor/course builder/sample/books/refined_duplicate_report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Refined report saved to: ${reportPath}`);
    
    // Mark true duplicates in database
    console.log('\n🏷️  Marking true duplicates in database...');
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
          
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (error) {
          console.error(`❌ Exception marking ${group[i].id}:`, error.message);
          errorCount++;
        }
      }
    }
    
    console.log(`\n🎉 Refined duplicate detection completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total books analyzed: ${allBooks.length}`);
    console.log(`   - True duplicate groups found: ${duplicateGroups.length}`);
    console.log(`   - Total duplicates: ${duplicateGroups.reduce((sum, group) => sum + (group.length - 1), 0)}`);
    console.log(`   - Books marked as duplicate: ${markedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Unique books: ${allBooks.length - markedCount}`);
    
    // Show duplicate groups
    if (duplicateGroups.length > 0) {
      console.log(`\n📋 Duplicate groups found:`);
      duplicateGroups.forEach((group, index) => {
        console.log(`   ${index + 1}. "${group[0].title}" (${group.length} copies)`);
      });
    } else {
      console.log(`\n✨ No true duplicates found after refinement!`);
    }
    
    return report;
    
  } catch (error) {
    console.error('❌ Refined duplicate detection failed:', error);
    throw error;
  }
}

// Run the refined duplicate detection
if (require.main === module) {
  refineDuplicateDetection()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { refineDuplicateDetection };