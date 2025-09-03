const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  'https://djvmoqharkefksvceetu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdm1vcWhhcmtlZmtzdmNlZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDk2MDUsImV4cCI6MjA2NDk4NTYwNX0.3B6g4kgKW-TBCiwtpapuLuTzNdEhbAjP68_K9V2onJA'
);

// Clean title for comparison
function cleanTitle(title) {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')  // Remove parentheses
    .replace(/\[[^\]]*\]/g, '')  // Remove brackets
    .replace(/\d+(st|nd|rd|th)\s+edition/gi, '') // Remove edition
    .replace(/volume\s+\d+/gi, '') // Remove volume
    .replace(/book\s+\d+/gi, '')   // Remove book number
    .replace(/part\s+\d+/gi, '')   // Remove part number
    .replace(/[–—-]/g, ' ')        // Replace dashes
    .replace(/[:;,\.!?'"]/g, '')  // Remove punctuation
    .replace(/\s+/g, ' ')          // Normalize spaces
    .trim();
}

// Calculate similarity between two strings
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const clean1 = cleanTitle(str1);
  const clean2 = cleanTitle(str2);
  
  if (clean1 === clean2) return 1.0;
  
  // Split into words and count matches
  const words1 = clean1.split(' ').filter(w => w.length > 2);
  const words2 = clean2.split(' ').filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
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
  
  return matches / Math.max(words1.length, words2.length);
}

// Sample IGPS library catalog (extracted from the browser)
const igpsLibraryCatalog = [
  { title: "ARS POETICA - HORACE - Latin in Translation - PDF.pdf", url: "https://share.igpsedu.com/Library/ARS%20POETICA%20-%20HORACE%20-%20Latin%20in%20Translation%20-%20PDF.pdf" },
  { title: "Beginning Latin Poetry Reader 70 Passages from Classical Roman Verse and Drama.pdf", url: "https://share.igpsedu.com/Library/Beginning%20Latin%20Poetry%20Reader%2070%20Passages%20from%20Classical%20Roman%20Verse%20and%20Drama.pdf" },
  { title: "Cambridge Latin 3.pdf", url: "https://share.igpsedu.com/Library/Cambridge%20Latin%203.pdf" },
  { title: "Cambridge Latin Book.pdf", url: "https://share.igpsedu.com/Library/Cambridge%20Latin%20Book.pdf" },
  { title: "Cambridge Latin II.pdf", url: "https://share.igpsedu.com/Library/Cambridge%20Latin%20II.pdf" },
  { title: "Confessiones of Augustine - Latin - PDF.pdf", url: "https://share.igpsedu.com/Library/Confessiones%20of%20Augustine%20-%20Latin%20-%20PDF.pdf" },
  { title: "De Vulgari Eloquentia - Latin to Italian.pdf", url: "https://share.igpsedu.com/Library/De%20Vulgari%20Eloquentia%20-%20Latin%20to%20Italian.pdf" },
  { title: "Latin Poetry.pdf", url: "https://share.igpsedu.com/Library/Latin%20Poetry.pdf" },
  { title: "Latin_Basic.pdf", url: "https://share.igpsedu.com/Library/Latin_Basic.pdf" },
  { title: "Oxford Latin Course Part 1.pdf", url: "https://share.igpsedu.com/Library/Oxford%20Latin%20Course%20Part%201.pdf" },
  { title: "Oxford Latin Course Part 2.pdf", url: "https://share.igpsedu.com/Library/Oxford%20Latin%20Course%20Part%202.pdf" },
  { title: "Oxford Latin Course Part 3.pdf", url: "https://share.igpsedu.com/Library/Oxford%20Latin%20Course%20Part%203.pdf" },
  { title: "Practice Makes Perfect Basic Latin.pdf", url: "https://share.igpsedu.com/Library/Practice%20Makes%20Perfect%20Basic%20Latin.pdf" },
  { title: "The Apologia by Augustine of Hippo - Latin - in translation .pdf", url: "https://share.igpsedu.com/Library/The%20Apologia%20by%20Augustine%20of%20Hippo%20-%20Latin%20-%20in%20translation%20.pdf" },
  { title: "The Ars Poetica by Horace - Latin & English - PDF.pdf", url: "https://share.igpsedu.com/Library/The%20Ars%20Poetica%20by%20Horace%20-%20Latin%20%26%20English%20-%20PDF.pdf" }
];

// Find matching URL from IGPS catalog
function findMatchingUrl(bookTitle, threshold = 0.8) {
  let bestMatch = null;
  let bestScore = 0;
  
  for (const item of igpsLibraryCatalog) {
    const similarity = calculateSimilarity(bookTitle, item.title);
    
    if (similarity >= threshold && similarity > bestScore) {
      bestScore = similarity;
      bestMatch = {
        url: item.url,
        title: item.title,
        score: similarity
      };
    }
  }
  
  return bestMatch;
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
    console.log('🚀 Starting book URL update from IGPS library...');
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
      
      // Search for matching URL
      const match = findMatchingUrl(book.title, minSimilarity);
      
      if (match) {
        console.log(`   ✅ Found match (${(match.score * 100).toFixed(0)}% similar)`);
        console.log(`   📄 IGPS: ${match.title}`);
        console.log(`   🔗 URL: ${match.url}`);
        
        if (!dryRun) {
          // Update in database
          const { error: updateError } = await supabase
            .from('books')
            .update({ 
              file_url: match.url,
              updated_at: new Date().toISOString()
            })
            .eq('id', book.id);
          
          if (updateError) {
            console.log(`   ❌ Update failed: ${updateError.message}`);
            results.errors.push({ book, error: updateError.message });
          } else {
            console.log(`   ✅ Updated in database`);
            results.updated.push({ ...book, url: match.url, matchTitle: match.title, score: match.score });
          }
        } else {
          console.log(`   🔄 Would update (dry run mode)`);
          results.updated.push({ ...book, url: match.url, matchTitle: match.title, score: match.score });
        }
      } else {
        console.log(`   ❌ No match found (< ${(minSimilarity * 100).toFixed(0)}% similarity)`);
        results.notFound.push(book);
      }
      
      console.log('');
    }
    
    // Save report
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const reportPath = `/mnt/d/dev/cursor/course builder/sample/books/igps_update_${timestamp}.json`;
    
    // Ensure directory exists
    const dir = '/mnt/d/dev/cursor/course builder/sample/books';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
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
      console.log(`   node scripts/update-books-from-igps.js --start ${startFrom + limit} --limit ${limit}${dryRun ? ' --dry-run' : ''}`);
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
  
  console.log('📝 Usage: node scripts/update-books-from-igps.js [options]');
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

module.exports = { updateBookUrls, findMatchingUrl };