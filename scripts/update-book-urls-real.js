const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  'https://djvmoqharkefksvceetu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdm1vcWhhcmtlZmtzdmNlZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDk2MDUsImV4cCI6MjA2NDk4NTYwNX0.3B6g4kgKW-TBCiwtpapuLuTzNdEhbAjP68_K9V2onJA'
);

// Calculate similarity between two strings
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  str1 = str1.toLowerCase().trim();
  str2 = str2.toLowerCase().trim();
  
  if (str1 === str2) return 1.0;
  
  // Remove common words for better matching
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
  const words1 = str1.split(/\s+/).filter(w => !stopWords.includes(w));
  const words2 = str2.split(/\s+/).filter(w => !stopWords.includes(w));
  
  // Count matching words
  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || 
          (word1.length > 3 && word2.length > 3 && 
           (word1.includes(word2) || word2.includes(word1)))) {
        matches++;
        break;
      }
    }
  }
  
  // Calculate similarity score
  const totalWords = Math.max(words1.length, words2.length);
  if (totalWords === 0) return 0;
  
  return matches / totalWords;
}

// Function to clean book title for search
function cleanTitle(title) {
  if (!title) return '';
  
  // Remove edition info, series info, etc.
  let cleaned = title
    .replace(/\([^)]*\)/g, '')  // Remove parentheses
    .replace(/\[[^\]]*\]/g, '')  // Remove brackets
    .replace(/\d+(st|nd|rd|th)\s+edition/gi, '') // Remove edition
    .replace(/volume\s+\d+/gi, '') // Remove volume
    .replace(/book\s+\d+/gi, '')   // Remove book number
    .replace(/[–—-]/g, ' ')        // Replace dashes
    .replace(/[:;,\.!?'"]/g, '')  // Remove punctuation
    .replace(/\s+/g, ' ')          // Normalize spaces
    .trim();
  
  return cleaned;
}

// Function to search for book URL using fetch
async function searchIGPSLibrary(bookTitle, bookAuthor = '') {
  try {
    const cleanedTitle = cleanTitle(bookTitle);
    
    // Try different search strategies
    const searchQueries = [
      cleanedTitle,
      cleanedTitle.split(' ').slice(0, 4).join(' '), // First 4 words
      bookAuthor ? `${cleanedTitle} ${bookAuthor}` : cleanedTitle, // With author
    ];
    
    for (const query of searchQueries) {
      if (!query) continue;
      
      const searchUrl = `https://share.igpsedu.com/Library?search=${encodeURIComponent(query)}`;
      console.log(`   🔍 Trying: ${query.substring(0, 50)}...`);
      
      try {
        // Make HTTP request to search
        const response = await fetch(searchUrl);
        
        if (response.ok) {
          const html = await response.text();
          
          // Parse the HTML to find book links
          // Look for patterns like href="/Library/..." or similar
          const linkPattern = /href="(\/Library\/[^"]+)"/g;
          const matches = [...html.matchAll(linkPattern)];
          
          if (matches.length > 0) {
            // Find best match based on title similarity
            let bestMatch = null;
            let bestScore = 0;
            
            for (const match of matches) {
              const url = match[1];
              // Extract title from URL or nearby text if possible
              const urlParts = url.split('/');
              const urlTitle = urlParts[urlParts.length - 1]
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .replace(/\.\w+$/, ''); // Remove file extension
              
              const similarity = calculateSimilarity(cleanedTitle, urlTitle);
              
              if (similarity >= 0.8 && similarity > bestScore) {
                bestScore = similarity;
                bestMatch = `https://share.igpsedu.com${url}`;
              }
            }
            
            if (bestMatch) {
              console.log(`   ✅ Found match (${(bestScore * 100).toFixed(0)}% similar)`);
              return bestMatch;
            }
          }
        }
      } catch (fetchError) {
        console.log(`   ⚠️  Fetch error: ${fetchError.message}`);
      }
    }
    
    return null;
    
  } catch (error) {
    console.log(`   ❌ Search error: ${error.message}`);
    return null;
  }
}

// Main update function
async function updateBookUrls(options = {}) {
  const {
    limit = 10,
    dryRun = false,
    startFrom = 0,
    minSimilarity = 0.8
  } = options;
  
  try {
    console.log('🚀 Starting book URL update with 80% match threshold...');
    console.log(`📋 Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
    console.log(`🎯 Minimum similarity: ${(minSimilarity * 100).toFixed(0)}%\n`);
    
    // Get total count
    const { count: totalCount } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .or('file_url.is.null,file_url.eq.');
    
    console.log(`📊 Total books without URLs: ${totalCount}`);
    
    // Get batch of books
    const { data: booksWithoutUrl, error } = await supabase
      .from('books')
      .select('id, title, author')
      .or('file_url.is.null,file_url.eq.')
      .order('title')
      .range(startFrom, startFrom + limit - 1);
    
    if (error) throw error;
    
    console.log(`📚 Processing batch: ${startFrom + 1} to ${startFrom + booksWithoutUrl.length}\n`);
    
    const results = {
      updated: [],
      notFound: [],
      errors: []
    };
    
    for (let i = 0; i < booksWithoutUrl.length; i++) {
      const book = booksWithoutUrl[i];
      const bookNum = startFrom + i + 1;
      
      console.log(`📖 [${bookNum}/${totalCount}] "${book.title}"`);
      if (book.author && book.author !== 'nan') {
        console.log(`   Author: ${book.author}`);
      }
      
      // Search for the book
      const foundUrl = await searchIGPSLibrary(book.title, book.author);
      
      if (foundUrl) {
        if (!dryRun) {
          // Update in database
          const { error: updateError } = await supabase
            .from('books')
            .update({ 
              file_url: foundUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', book.id);
          
          if (updateError) {
            console.log(`   ❌ Update failed: ${updateError.message}`);
            results.errors.push({ book, error: updateError.message });
          } else {
            console.log(`   ✅ Updated: ${foundUrl}`);
            results.updated.push({ ...book, url: foundUrl });
          }
        } else {
          console.log(`   🔄 Would update: ${foundUrl}`);
          results.updated.push({ ...book, url: foundUrl });
        }
      } else {
        console.log(`   ❌ No match found (< 80% similarity)`);
        results.notFound.push(book);
      }
      
      console.log('');
      
      // Delay between searches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Save report
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const reportPath = `/mnt/d/dev/cursor/course builder/sample/books/url_update_${timestamp}.json`;
    
    const report = {
      timestamp: new Date().toISOString(),
      mode: dryRun ? 'dry_run' : 'live',
      batch: {
        start: startFrom + 1,
        end: startFrom + booksWithoutUrl.length,
        total: totalCount
      },
      statistics: {
        processed: booksWithoutUrl.length,
        updated: results.updated.length,
        notFound: results.notFound.length,
        errors: results.errors.length,
        successRate: ((results.updated.length / booksWithoutUrl.length) * 100).toFixed(1) + '%'
      },
      results
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Batch Summary:');
    console.log(`   ✅ ${dryRun ? 'Would update' : 'Updated'}: ${results.updated.length}`);
    console.log(`   ❌ Not found: ${results.notFound.length}`);
    console.log(`   ⚠️  Errors: ${results.errors.length}`);
    console.log(`   📈 Success rate: ${report.statistics.successRate}`);
    console.log(`\n📄 Report saved: ${reportPath}`);
    
    // Suggest next batch
    if (startFrom + limit < totalCount) {
      console.log(`\n💡 To continue with next batch, run:`);
      console.log(`   node update-book-urls-real.js --start ${startFrom + limit} --limit ${limit}${dryRun ? ' --dry-run' : ''}`);
    }
    
    return report;
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    limit: 10,
    startFrom: 0,
    dryRun: false
  };
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--start' && args[i + 1]) {
      options.startFrom = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--dry-run') {
      options.dryRun = true;
    }
  }
  
  console.log('📝 Usage: node update-book-urls-real.js [options]');
  console.log('   Options:');
  console.log('     --limit <n>    Number of books to process (default: 10)');
  console.log('     --start <n>    Start from book number (default: 0)');
  console.log('     --dry-run      Test without updating database\n');
  
  updateBookUrls(options)
    .then(() => {
      console.log('\n✨ Batch completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateBookUrls, searchIGPSLibrary };