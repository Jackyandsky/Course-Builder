const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  'https://djvmoqharkefksvceetu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdm1vcWhhcmtlZmtzdmNlZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDk2MDUsImV4cCI6MjA2NDk4NTYwNX0.3B6g4kgKW-TBCiwtpapuLuTzNdEhbAjP68_K9V2onJA'
);

/**
 * REFINED ADVANCED DUPLICATE DETECTION
 * 
 * Improvements:
 * 1. More conservative thresholds to reduce false positives
 * 2. Better series detection
 * 3. Author name importance when different
 * 4. Publication info consideration
 * 5. Exact title prioritization
 */

// === CORE SIMILARITY FUNCTIONS ===

function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

function jaroWinkler(str1, str2) {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  const s1Matches = new Array(str1.length).fill(false);
  const s2Matches = new Array(str2.length).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, str2.length);
    
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || str1[i] !== str2[j]) continue;
      s1Matches[i] = s2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0.0;
  
  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }
  
  const jaro = (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;
  
  let prefix = 0;
  for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
    if (str1[i] === str2[i]) prefix++;
    else break;
  }
  
  return jaro + (0.1 * prefix * (1 - jaro));
}

// === IMPROVED NORMALIZATION ===

function smartNormalize(title) {
  if (!title) return '';
  
  let normalized = title.toLowerCase().trim();
  
  // Remove common patterns that don't affect duplicate detection
  normalized = normalized.replace(/^(the|a|an)\s+/g, ''); // Leading articles
  normalized = normalized.replace(/\s+(the|a|an)$/g, ''); // Trailing articles
  
  // Normalize author indicators but preserve main title
  normalized = normalized.replace(/\s*by\s+[^(]+$/g, ''); // "by Author"
  normalized = normalized.replace(/\s*\([^)]*\)$/g, ''); // Trailing parentheses with author
  
  // Normalize punctuation consistently
  normalized = normalized.replace(/['']/g, "'"); // Normalize apostrophes
  normalized = normalized.replace(/[""]/g, '"'); // Normalize quotes
  normalized = normalized.replace(/[–—]/g, '-'); // Normalize dashes
  normalized = normalized.replace(/[^\w\s'-]/g, ' '); // Replace other punctuation with spaces
  normalized = normalized.replace(/\s+/g, ' '); // Normalize whitespace
  
  return normalized.trim();
}

// === ENHANCED SERIES DETECTION ===

function isSeriesVariation(title1, title2) {
  const norm1 = smartNormalize(title1);
  const norm2 = smartNormalize(title2);
  
  // Common series patterns
  const seriesPatterns = [
    /\b(vol|volume|part|book|chapter|number|no\.?)\s*(\d+)/gi,
    /\b(\d+)\s*(of|\/)\s*(\d+)/gi,
    /\b(\d{1,2})\s*[:-]\s*/gi,
    /\(\d+\s*of\s*\d+\)/gi,
    /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\b/gi
  ];
  
  let hasPattern1 = false, hasPattern2 = false;
  let baseTitle1 = norm1;
  let baseTitle2 = norm2;
  
  for (const pattern of seriesPatterns) {
    if (pattern.test(title1)) {
      hasPattern1 = true;
      baseTitle1 = norm1.replace(pattern, ' ').replace(/\s+/g, ' ').trim();
    }
    if (pattern.test(title2)) {
      hasPattern2 = true;
      baseTitle2 = norm2.replace(pattern, ' ').replace(/\s+/g, ' ').trim();
    }
  }
  
  // If both have series indicators and base titles are similar, they're series
  if (hasPattern1 && hasPattern2 && baseTitle1.length > 5 && baseTitle2.length > 5) {
    const baseSimilarity = jaroWinkler(baseTitle1, baseTitle2);
    return baseSimilarity > 0.80;
  }
  
  return false;
}

// === STRICT DUPLICATE DETECTION ===

function calculateDuplicateProbability(book1, book2) {
  const title1 = book1.title || '';
  const title2 = book2.title || '';
  const author1 = book1.author || '';
  const author2 = book2.author || '';
  
  // Quick exact match check
  if (title1.toLowerCase().trim() === title2.toLowerCase().trim()) {
    return { 
      score: 1.0, 
      confidence: 'exact_match', 
      reason: 'Identical titles',
      isDuplicate: true
    };
  }
  
  // Series detection - immediately reject if detected
  if (isSeriesVariation(title1, title2)) {
    return { 
      score: 0.0, 
      confidence: 'series_variation', 
      reason: 'Detected as series volumes',
      isDuplicate: false
    };
  }
  
  // Normalize for comparison
  const norm1 = smartNormalize(title1);
  const norm2 = smartNormalize(title2);
  
  if (!norm1 || !norm2 || norm1.length < 3 || norm2.length < 3) {
    return { 
      score: 0.0, 
      confidence: 'insufficient_data', 
      reason: 'Titles too short or empty',
      isDuplicate: false
    };
  }
  
  // Calculate primary similarities
  const maxLen = Math.max(norm1.length, norm2.length);
  const levenshtein = 1 - (levenshteinDistance(norm1, norm2) / maxLen);
  const jaro = jaroWinkler(norm1, norm2);
  
  // Word-level comparison
  const words1 = norm1.split(/\s+/).filter(w => w.length > 2);
  const words2 = norm2.split(/\s+/).filter(w => w.length > 2);
  const commonWords = words1.filter(w => words2.includes(w));
  const wordOverlap = commonWords.length * 2 / (words1.length + words2.length);
  
  // Author comparison
  let authorPenalty = 0;
  if (author1 && author2 && author1.trim() !== '' && author2.trim() !== '') {
    const normAuthor1 = smartNormalize(author1);
    const normAuthor2 = smartNormalize(author2);
    const authorSim = jaroWinkler(normAuthor1, normAuthor2);
    
    if (authorSim < 0.8) {
      authorPenalty = 0.3; // Significant penalty for different authors
    }
  }
  
  // Calculate composite score
  const titleScore = (levenshtein * 0.4 + jaro * 0.4 + wordOverlap * 0.2);
  const finalScore = Math.max(0, titleScore - authorPenalty);
  
  // Determine duplicate status with conservative thresholds
  let isDuplicate = false;
  let confidence = 'low';
  let reason = '';
  
  if (finalScore >= 0.98) {
    isDuplicate = true;
    confidence = 'very_high';
    reason = 'Near-identical titles';
  } else if (finalScore >= 0.95 && authorPenalty === 0) {
    isDuplicate = true;
    confidence = 'high';
    reason = 'Very similar titles, compatible authors';
  } else if (finalScore >= 0.92 && wordOverlap > 0.8) {
    isDuplicate = true;
    confidence = 'high';
    reason = 'High word overlap and similarity';
  } else if (finalScore >= 0.85) {
    confidence = 'medium';
    reason = 'Similar but not duplicate';
  } else {
    confidence = 'low';
    reason = 'Different titles';
  }
  
  return {
    score: finalScore,
    confidence,
    reason,
    isDuplicate,
    details: {
      levenshtein: levenshtein.toFixed(3),
      jaroWinkler: jaro.toFixed(3),
      wordOverlap: wordOverlap.toFixed(3),
      authorPenalty: authorPenalty.toFixed(3),
      titleScore: titleScore.toFixed(3),
      finalScore: finalScore.toFixed(3)
    }
  };
}

// === MAIN DETECTION FUNCTION ===

async function refinedAdvancedDetection() {
  try {
    console.log('🎯 Starting Refined Advanced Duplicate Detection');
    console.log('📈 Target: >90% Precision, Minimal False Positives\n');
    
    // Reset flags
    console.log('🔄 Resetting duplicate flags...');
    await supabase.from('books').update({ is_duplicate: false }).eq('is_duplicate', true);
    
    // Load all books in batches
    console.log('📚 Loading all books...');
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
      
      console.log(`📖 Loaded ${allBooks.length} books...`);
    }
    
    console.log(`📊 Total books: ${allBooks.length}\n`);
    
    // Detection results
    const results = {
      totalBooks: allBooks.length,
      duplicateGroups: [],
      possibleDuplicates: [],
      statistics: {
        exactMatch: 0,
        veryHigh: 0,
        high: 0,
        medium: 0,
        seriesRejected: 0,
        processed: 0
      }
    };
    
    const processed = new Set();
    
    console.log('🔍 Analyzing with conservative thresholds...');
    
    for (let i = 0; i < allBooks.length; i++) {
      if (processed.has(allBooks[i].id)) continue;
      
      const currentBook = allBooks[i];
      const duplicates = [currentBook];
      const possibles = [];
      
      for (let j = i + 1; j < allBooks.length; j++) {
        if (processed.has(allBooks[j].id)) continue;
        
        const compareBook = allBooks[j];
        const analysis = calculateDuplicateProbability(currentBook, compareBook);
        
        // Count statistics
        results.statistics[analysis.confidence.replace('_', '')]++;
        
        if (analysis.isDuplicate) {
          duplicates.push(compareBook);
          processed.add(compareBook.id);
          console.log(`✅ DUPLICATE: "${currentBook.title}" ↔ "${compareBook.title}"`);
          console.log(`   Score: ${(analysis.score * 100).toFixed(1)}% | ${analysis.reason}`);
        } else if (analysis.score >= 0.80) {
          possibles.push({ book1: currentBook, book2: compareBook, analysis });
          console.log(`⚠️  REVIEW: "${currentBook.title}" ↔ "${compareBook.title}"`);
          console.log(`   Score: ${(analysis.score * 100).toFixed(1)}% | ${analysis.reason}`);
        }
      }
      
      if (duplicates.length > 1) {
        duplicates.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        results.duplicateGroups.push(duplicates);
      }
      
      if (possibles.length > 0) {
        results.possibleDuplicates.push(...possibles);
      }
      
      processed.add(currentBook.id);
      results.statistics.processed++;
      
      if (i % 200 === 0) {
        console.log(`📊 Progress: ${i}/${allBooks.length} (${((i/allBooks.length)*100).toFixed(1)}%)`);
      }
    }
    
    // Calculate results
    const totalDuplicates = results.duplicateGroups.reduce((sum, group) => sum + (group.length - 1), 0);
    const precisionEstimate = results.statistics.exactMatch + results.statistics.veryHigh;
    
    console.log('\n🎉 Refined Detection Complete!');
    console.log('📊 FINAL RESULTS:');
    console.log(`   📚 Total Books: ${results.totalBooks}`);
    console.log(`   🔄 Duplicate Groups: ${results.duplicateGroups.length}`);
    console.log(`   ❌ Books Marked as Duplicates: ${totalDuplicates}`);
    console.log(`   ✅ Unique Books: ${results.totalBooks - totalDuplicates}`);
    console.log(`   ⚠️  Manual Review Needed: ${results.possibleDuplicates.length}`);
    
    console.log('\n📈 CONFIDENCE BREAKDOWN:');
    console.log(`   🎯 Exact Matches: ${results.statistics.exactMatch}`);
    console.log(`   🟢 Very High Confidence: ${results.statistics.veryHigh}`);
    console.log(`   🟡 High Confidence: ${results.statistics.high}`);
    console.log(`   🟠 Medium Confidence: ${results.statistics.medium}`);
    console.log(`   📚 Series Rejected: ${results.statistics.seriesRejected}`);
    
    // Calculate precision
    const highConfidenceDetections = results.statistics.exactMatch + results.statistics.veryHigh;
    const estimatedPrecision = results.duplicateGroups.length > 0 
      ? (highConfidenceDetections / totalDuplicates) * 100 
      : 100;
    
    console.log(`\n🎯 ESTIMATED PRECISION: ${estimatedPrecision.toFixed(1)}%`);
    
    // Save report
    const reportPath = '/mnt/d/dev/cursor/course builder/sample/books/refined_advanced_report.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`📄 Detailed report: ${reportPath}`);
    
    // Mark confirmed duplicates
    console.log('\n🏷️  Marking confirmed duplicates...');
    let markedCount = 0;
    
    for (const group of results.duplicateGroups) {
      console.log(`\n📂 Group: "${group[0].title}" (${group.length} books)`);
      for (let i = 1; i < group.length; i++) {
        const { error } = await supabase
          .from('books')
          .update({ is_duplicate: true })
          .eq('id', group[i].id);
        
        if (!error) {
          markedCount++;
          console.log(`   ✅ Marked: "${group[i].title}"`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log(`\n🎉 Successfully marked ${markedCount} duplicates!`);
    console.log(`🎯 High precision algorithm with conservative thresholds`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Refined detection failed:', error);
    throw error;
  }
}

// Run the refined detection
if (require.main === module) {
  refinedAdvancedDetection()
    .then(() => {
      console.log('\n🏁 Refined advanced detection completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { refinedAdvancedDetection, calculateDuplicateProbability };