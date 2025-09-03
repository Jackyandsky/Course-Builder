const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

// Initialize Supabase client
const supabase = createClient(
  'https://djvmoqharkefksvceetu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdm1vcWhhcmtlZmtzdmNlZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDk2MDUsImV4cCI6MjA2NDk4NTYwNX0.3B6g4kgKW-TBCiwtpapuLuTzNdEhbAjP68_K9V2onJA'
);

// Enhanced cleaning function
function cleanTitle(title) {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')  // Remove parentheses
    .replace(/\[[^\]]*\]/g, '')  // Remove brackets  
    .replace(/\d+(st|nd|rd|th)\s+edition/gi, '') // Remove edition
    .replace(/volume\s+\d+/gi, '') // Remove volume
    .replace(/vol\.\s*\d+/gi, '')   // Remove vol. X
    .replace(/book\s+\d+/gi, '')    // Remove book number
    .replace(/part\s+\d+/gi, '')    // Remove part number
    .replace(/chapter\s+\d+/gi, '')  // Remove chapter
    .replace(/\d{4}-\d{4}/g, '')    // Remove year ranges
    .replace(/teacher['']?s?\s+(guide|manual|edition)/gi, '') // Remove teacher's guide
    .replace(/student['']?s?\s+(guide|manual|edition|book|workbook)/gi, '') // Remove student's X
    .replace(/answer\s+key/gi, '')  // Remove answer key
    .replace(/study\s+guide/gi, '')  // Remove study guide
    .replace(/test\s+prep/gi, '')    // Remove test prep
    .replace(/practice\s+tests?/gi, '') // Remove practice test
    .replace(/workbook/gi, '')       // Remove workbook
    .replace(/textbook/gi, '')       // Remove textbook
    .replace(/by\s+.+$/g, '')        // Remove "by Author Name"
    .replace(/\.pdf$/gi, '')         // Remove .pdf extension
    .replace(/[–—-]/g, ' ')          // Replace dashes
    .replace(/[:;,\.!?'"]/g, '')    // Remove punctuation
    .replace(/\s+/g, ' ')            // Normalize spaces
    .trim();
}

// Extract important keywords from title
function extractKeywords(title) {
  const cleaned = cleanTitle(title);
  const words = cleaned.split(' ').filter(w => w.length > 2);
  
  // Important subject keywords to prioritize
  const subjectKeywords = [
    'algebra', 'calculus', 'geometry', 'trigonometry', 'statistics', 'mathematics', 'math',
    'physics', 'chemistry', 'biology', 'science', 'anatomy', 'physiology', 'ecology',
    'english', 'spanish', 'french', 'german', 'italian', 'chinese', 'japanese', 'latin',
    'history', 'geography', 'economics', 'psychology', 'philosophy', 'sociology',
    'art', 'music', 'literature', 'poetry', 'novel', 'drama', 'shakespeare',
    'computer', 'programming', 'coding', 'javascript', 'python', 'java',
    'business', 'finance', 'accounting', 'marketing', 'management', 'leadership',
    'sat', 'act', 'gre', 'gmat', 'toefl', 'ielts', 'ap', 'ib', 'gcse',
    'cambridge', 'oxford', 'pearson', 'mcgraw', 'cengage'
  ];
  
  // Find matching subject keywords
  const foundSubjects = [];
  for (const keyword of subjectKeywords) {
    if (cleaned.includes(keyword)) {
      foundSubjects.push(keyword);
    }
  }
  
  return {
    subjects: foundSubjects,
    keywords: words.filter(w => w.length > 4 || subjectKeywords.includes(w)),
    original: words
  };
}

// Enhanced similarity calculation
function calculateSimilarity(bookTitle, catalogTitle) {
  if (!bookTitle || !catalogTitle) return 0;
  
  const book = cleanTitle(bookTitle);
  const catalog = cleanTitle(catalogTitle);
  
  // Exact match after cleaning
  if (book === catalog) return 1.0;
  
  // Extract keywords from both titles
  const bookKeywords = extractKeywords(bookTitle);
  const catalogKeywords = extractKeywords(catalogTitle);
  
  // Score based on subject matches (highest priority)
  let subjectScore = 0;
  if (bookKeywords.subjects.length > 0 && catalogKeywords.subjects.length > 0) {
    const matchingSubjects = bookKeywords.subjects.filter(s => 
      catalogKeywords.subjects.includes(s)
    );
    subjectScore = matchingSubjects.length / Math.max(bookKeywords.subjects.length, catalogKeywords.subjects.length);
  }
  
  // Score based on keyword matches
  let keywordScore = 0;
  if (bookKeywords.keywords.length > 0 && catalogKeywords.keywords.length > 0) {
    let matches = 0;
    for (const bk of bookKeywords.keywords) {
      for (const ck of catalogKeywords.keywords) {
        if (bk === ck || 
            (bk.length > 4 && ck.length > 4 && 
             (bk.includes(ck) || ck.includes(bk)))) {
          matches++;
          break;
        }
      }
    }
    keywordScore = matches / Math.max(bookKeywords.keywords.length, catalogKeywords.keywords.length);
  }
  
  // Score based on all word matches
  let wordScore = 0;
  if (bookKeywords.original.length > 0 && catalogKeywords.original.length > 0) {
    let matches = 0;
    for (const bw of bookKeywords.original) {
      if (catalogKeywords.original.includes(bw)) {
        matches++;
      }
    }
    wordScore = matches / Math.max(bookKeywords.original.length, catalogKeywords.original.length);
  }
  
  // Check if one title contains the other
  let containsScore = 0;
  if (book.includes(catalog) || catalog.includes(book)) {
    containsScore = 0.9;
  }
  
  // Weighted final score
  const finalScore = Math.max(
    subjectScore * 0.95,      // Subject match is very important
    keywordScore * 0.9,       // Keyword match is important
    wordScore * 0.8,          // Word match is good
    containsScore             // Contains match is reliable
  );
  
  return finalScore;
}

// Load and parse CSV catalog
function loadCatalog() {
  const csvPath = path.join(__dirname, '../sample/books/book_list.csv');
  
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = csv.parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  // Transform CSV records to our catalog format
  return records.map(record => ({
    title: record.Name,
    url: record.URL,
    size: record.Size,
    modTime: record.ModTime,
    normalized: record.Normalized_Name
  }));
}

// Search function using CSV catalog
function searchInCatalog(bookTitle, bookAuthor, catalog) {
  let bestMatch = null;
  let bestScore = 0;
  
  // Try with title + author if available
  const searchTerms = [bookTitle];
  if (bookAuthor && bookAuthor !== 'nan' && bookAuthor !== 'null') {
    searchTerms.push(`${bookTitle} ${bookAuthor}`);
    searchTerms.push(`${bookAuthor} ${bookTitle}`);
  }
  
  for (const searchTerm of searchTerms) {
    for (const item of catalog) {
      const similarity = calculateSimilarity(searchTerm, item.title);
      
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = {
          url: item.url,
          title: item.title,
          score: similarity,
          size: item.size
        };
      }
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
    console.log('🚀 Book URL Update from CSV Catalog');
    console.log(`📋 Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
    console.log(`🎯 Minimum similarity: ${(minSimilarity * 100).toFixed(0)}%`);
    
    // Load CSV catalog
    console.log('📁 Loading IGPS library catalog from CSV...');
    const catalog = loadCatalog();
    console.log(`✅ Loaded ${catalog.length} books from catalog\n`);
    
    // Get total count of books without URLs
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
      
      // Extract keywords for logging
      const keywords = extractKeywords(book.title);
      if (keywords.subjects.length > 0) {
        console.log(`   📚 Subjects: ${keywords.subjects.join(', ')}`);
      }
      
      // Search for matching URL in catalog
      const match = searchInCatalog(book.title, book.author, catalog);
      
      if (match && match.score >= minSimilarity) {
        console.log(`   ✅ Found match (${(match.score * 100).toFixed(0)}% similar)`);
        console.log(`   📄 IGPS: ${match.title}`);
        console.log(`   📦 Size: ${match.size}`);
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
            results.updated.push({ 
              ...book, 
              url: match.url, 
              matchTitle: match.title, 
              score: match.score,
              size: match.size
            });
          }
        } else {
          console.log(`   🔄 Would update (dry run mode)`);
          results.updated.push({ 
            ...book, 
            url: match.url, 
            matchTitle: match.title, 
            score: match.score,
            size: match.size
          });
        }
      } else {
        const bestScore = match ? match.score : 0;
        console.log(`   ❌ No match found (best: ${(bestScore * 100).toFixed(0)}% < ${(minSimilarity * 100).toFixed(0)}% required)`);
        if (match && match.score > 0.5) {
          console.log(`   🔍 Closest match: "${match.title}" (${(match.score * 100).toFixed(0)}%)`);
        }
        results.notFound.push({ 
          ...book, 
          bestScore,
          closestMatch: match && match.score > 0.5 ? match.title : null
        });
      }
      
      console.log('');
    }
    
    // Save report
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const reportPath = path.join(__dirname, `../sample/books/csv_update_${timestamp}.json`);
    
    // Ensure directory exists
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      mode: dryRun ? 'dry_run' : 'live',
      catalogSize: catalog.length,
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
        successRate: booksWithoutUrl.length > 0 
          ? ((results.updated.length / booksWithoutUrl.length) * 100).toFixed(1) + '%'
          : '0%'
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
    
    // Show suggestions for not found books
    if (results.notFound.length > 0) {
      console.log('\n💡 Books needing manual review:');
      results.notFound.slice(0, 5).forEach(book => {
        console.log(`   • "${book.title}" (best: ${(book.bestScore * 100).toFixed(0)}%)`);
        if (book.closestMatch) {
          console.log(`     Closest: "${book.closestMatch}"`);
        }
      });
    }
    
    // Suggest next batch
    if (startFrom + limit < totalCount) {
      console.log(`\n💡 To continue with next batch, run:`);
      console.log(`   node scripts/update-books-from-csv.js --start ${startFrom + limit} --limit ${limit}${dryRun ? ' --dry-run' : ''}`);
    } else {
      console.log(`\n✨ All books processed!`);
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
    dryRun: false,
    minSimilarity: 0.8
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
    } else if (args[i] === '--threshold' && args[i + 1]) {
      options.minSimilarity = parseFloat(args[i + 1]) / 100;
      i++;
    }
  }
  
  console.log('📝 Usage: node scripts/update-books-from-csv.js [options]');
  console.log('   Options:');
  console.log('     --limit <n>       Number of books to process (default: 10)');
  console.log('     --start <n>       Start from book number (default: 0)');
  console.log('     --threshold <n>   Minimum similarity % (default: 80)');
  console.log('     --dry-run         Test without updating database\n');
  
  updateBookUrls(options)
    .then(() => {
      console.log('\n✨ CSV-based update completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateBookUrls, searchInCatalog, calculateSimilarity };