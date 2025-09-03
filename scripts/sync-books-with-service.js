const fs = require('fs');
const csv = require('csv-parser');

// We'll import the book service - this requires running in the Next.js context
// Since we can't easily import TypeScript in Node.js, we'll use a different approach

// Instead, let's create a simple script that generates UPDATE statements 
// that set the updated_at manually to work around the trigger

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

function escapeApostrophes(str) {
  return str.replace(/'/g, "''");
}

async function generateSyncSQL() {
  try {
    console.log('🔄 Generating SQL for book synchronization...');
    
    // Load CSV books
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
    
    // Load database books from the export we created earlier
    console.log('📚 Loading database books from export...');
    
    // We'll need to create this export first using our previous SQL
    const dbBooks = JSON.parse(fs.readFileSync('/mnt/d/dev/cursor/course builder/sample/books/database_books_export.json', 'utf8'));
    
    console.log(`✅ Loaded ${dbBooks.length} books from database`);
    
    // Generate UPDATE statements with explicit updated_at
    const updateStatements = [];
    const insertStatements = [];
    let matchedCount = 0;
    
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
        console.log(`📝 Matched "${dbBook.title}" -> "${bestMatch.name}" (${Math.round(bestSimilarity * 100)}% match)`);
        
        // Generate UPDATE statement with explicit updated_at and user context
        const updateSQL = `
-- Update: ${escapeApostrophes(dbBook.title)} -> ${escapeApostrophes(bestMatch.name)} (${Math.round(bestSimilarity * 100)}% match)
UPDATE books 
SET file_url = '${escapeApostrophes(bestMatch.url)}',
    updated_at = NOW()
WHERE id = '${dbBook.id}';`;
        
        updateStatements.push(updateSQL);
      }
    }
    
    console.log(`✅ Generated ${updateStatements.length} UPDATE statements`);
    
    // Find books in CSV that don't exist in database
    console.log('🔍 Finding new books to insert...');
    
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
        const insertSQL = `
-- Insert new book: ${escapeApostrophes(csvBook.name)}
INSERT INTO books (title, file_url, content_type, language, is_public, user_id, created_at, updated_at)
VALUES (
  '${escapeApostrophes(csvBook.name)}',
  '${escapeApostrophes(csvBook.url)}',
  'pdf',
  'en',
  false,
  '4ef526fd-43a0-44fd-82e4-2ab404ef673c',
  NOW(),
  NOW()
);`;
        
        insertStatements.push(insertSQL);
      }
    }
    
    console.log(`✅ Generated ${insertStatements.length} INSERT statements`);
    
    // Write the SQL files
    const updateSQL = `-- Book URL Updates Generated ${new Date().toISOString()}
-- This script updates file_url for matched books with explicit updated_at
-- Run this against your Supabase database

BEGIN;

${updateStatements.join('\n')}

COMMIT;

-- Summary: ${updateStatements.length} books to update
`;
    
    const insertSQL = `-- New Book Inserts Generated ${new Date().toISOString()}
-- This script inserts new books found in CSV but not in database
-- Run this against your Supabase database

BEGIN;

${insertStatements.join('\n')}

COMMIT;

-- Summary: ${insertStatements.length} new books to insert
`;
    
    fs.writeFileSync('/mnt/d/dev/cursor/course builder/sample/books/final_updates.sql', updateSQL);
    fs.writeFileSync('/mnt/d/dev/cursor/course builder/sample/books/final_inserts.sql', insertSQL);
    
    console.log('\n🎉 SQL generation completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Database books: ${dbBooks.length}`);
    console.log(`   - CSV books: ${csvBooks.length}`);
    console.log(`   - Generated updates: ${updateStatements.length}`);
    console.log(`   - Generated inserts: ${insertStatements.length}`);
    console.log(`   - Files created:`);
    console.log(`     - final_updates.sql`);
    console.log(`     - final_inserts.sql`);
    
  } catch (error) {
    console.error('❌ Generation failed:', error);
  }
}

// Run the SQL generation
if (require.main === module) {
  generateSyncSQL();
}

module.exports = { generateSyncSQL };