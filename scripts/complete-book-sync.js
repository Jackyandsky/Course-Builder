const fs = require('fs');
const path = require('path');

// Since we're working with the MCP server, we'll need to create SQL statements
// that can be executed through the Supabase interface

// Function to normalize book titles for comparison
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim();
}

// Function to calculate string similarity (Levenshtein distance)
function similarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s2.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s1.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(j - 1) !== s2.charAt(i - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s1.length] = lastValue;
  }
  return costs[s2.length];
}

// Parse CSV content
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const books = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Simple CSV parsing (handles quoted fields)
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"' && (j === 0 || lines[i][j-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && (j === lines[i].length - 1 || lines[i][j+1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current); // Add the last value
    
    if (values.length >= 3) {
      books.push({
        index: parseInt(values[0]) || 0,
        name: values[1].replace(/^"|"$/g, ''), // Remove quotes
        url: values[2].replace(/^"|"$/g, ''), // Remove quotes
        size: values[3],
        normalized_name: normalizeTitle(values[1].replace(/^"|"$/g, ''))
      });
    }
  }
  
  return books;
}

// Find best match for a database book in CSV
function findBestMatch(dbTitle, csvBooks) {
  const dbNormalized = normalizeTitle(dbTitle);
  let bestMatch = null;
  let bestSimilarity = 0;
  
  for (const csvBook of csvBooks) {
    const sim = similarity(dbNormalized, csvBook.normalized_name);
    
    // Consider as match if similarity > 90% for exact matches or 85% for longer titles
    const isMatch = sim >= 0.90 || 
                   (dbNormalized.length > 15 && csvBook.normalized_name.length > 15 && sim >= 0.85);
    
    if (isMatch && sim > bestSimilarity) {
      bestMatch = csvBook;
      bestSimilarity = sim;
    }
  }
  
  return bestMatch ? { match: bestMatch, similarity: bestSimilarity } : null;
}

// Main function
async function generateBookSyncSQL() {
  try {
    console.log('=== Generating SQL for Book Synchronization ===\\n');
    
    // Read the CSV file
    const csvPath = path.join(__dirname, '..', 'sample', 'books', 'book_list.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const csvBooks = parseCSV(csvContent);
    
    console.log(`Loaded ${csvBooks.length} books from CSV`);
    
    // Generate SQL to fetch all database books and create temp table for matching
    const outputDir = path.join(__dirname, '..', 'sample', 'books');
    
    // Step 1: Create SQL to export all database books to a temporary format
    const exportSQL = `
-- Step 1: Export all database books for matching
-- Copy this result and save as 'database_books_export.json'
SELECT json_agg(
  json_build_object(
    'id', id,
    'title', title,
    'author', author,
    'file_url', file_url
  )
) as all_books
FROM books
ORDER BY title;
`;
    
    // Step 2: Generate matching SQL that can be executed
    // This will create a comprehensive matching script
    const matchingSQL = `
-- Step 2: Comprehensive Book Matching and Update Script
-- This script will match database books with CSV entries and update file_url

-- Create temporary table with CSV data
CREATE TEMP TABLE csv_books (
  index_num INTEGER,
  name TEXT,
  url TEXT,
  size TEXT
);

-- Insert CSV data into temporary table
-- NOTE: Replace this with actual CSV data
${csvBooks.slice(0, 50).map(book => {
  const escapedName = book.name.replace(/'/g, "''");
  const escapedUrl = book.url.replace(/'/g, "''");
  return `INSERT INTO csv_books VALUES (${book.index}, '${escapedName}', '${escapedUrl}', '${book.size}');`;
}).join('\\n')}

-- Function to calculate similarity (simplified version)
-- In practice, you'd use a proper fuzzy matching extension like pg_trgm

-- Update books with matching file URLs
UPDATE books 
SET file_url = csv_books.url
FROM csv_books
WHERE 
  books.file_url IS NULL 
  AND (
    -- Exact title match
    LOWER(REGEXP_REPLACE(books.title, '[^a-zA-Z0-9\\\\s]', '', 'g')) = 
    LOWER(REGEXP_REPLACE(csv_books.name, '[^a-zA-Z0-9\\\\s]', '', 'g'))
    OR
    -- Partial match for longer titles
    (
      LENGTH(books.title) > 15 
      AND LOWER(books.title) LIKE '%' || LOWER(SPLIT_PART(csv_books.name, ' ', 1)) || '%'
      AND LOWER(books.title) LIKE '%' || LOWER(SPLIT_PART(csv_books.name, ' ', 2)) || '%'
    )
  );

-- Select matched books for verification
SELECT 
  b.id,
  b.title as db_title,
  c.name as csv_name,
  b.file_url,
  'MATCHED' as status
FROM books b
JOIN csv_books c ON b.file_url = c.url
ORDER BY b.title;
`;

    // Step 3: Generate individual update statements for manual execution
    let individualUpdates = `-- Step 3: Individual Update Statements\\n`;
    individualUpdates += `-- Execute these one by one if needed\\n\\n`;
    
    // Create a sample of update statements for the first few exact matches
    const exactMatches = [];
    for (const csvBook of csvBooks.slice(0, 100)) {
      // Find books that might match exactly
      const csvNormalized = normalizeTitle(csvBook.name);
      
      // Generate update statement for potential exact matches
      const escapedUrl = csvBook.url.replace(/'/g, "''");
      const escapedTitle = csvBook.name.replace(/'/g, "''");
      
      individualUpdates += `-- Update for: ${csvBook.name}\\n`;
      individualUpdates += `UPDATE books SET file_url = '${escapedUrl}' \\n`;
      individualUpdates += `WHERE LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9\\\\s]', '', 'g')) = `;
      individualUpdates += `LOWER(REGEXP_REPLACE('${escapedTitle}', '[^a-zA-Z0-9\\\\s]', '', 'g'))\\n`;
      individualUpdates += `AND file_url IS NULL;\\n\\n`;
    }
    
    // Step 4: Generate insert statements for new books
    let insertStatements = `-- Step 4: Insert New Books\\n`;
    insertStatements += `-- Books from CSV that don't exist in database\\n\\n`;
    
    for (const csvBook of csvBooks) {
      const escapedTitle = csvBook.name.replace(/'/g, "''");
      const escapedUrl = csvBook.url.replace(/'/g, "''");
      
      insertStatements += `-- Check if book exists, if not insert\\n`;
      insertStatements += `INSERT INTO books (title, file_url)\\n`;
      insertStatements += `SELECT '${escapedTitle}', '${escapedUrl}'\\n`;
      insertStatements += `WHERE NOT EXISTS (\\n`;
      insertStatements += `  SELECT 1 FROM books \\n`;
      insertStatements += `  WHERE LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9\\\\s]', '', 'g')) = \\n`;
      insertStatements += `        LOWER(REGEXP_REPLACE('${escapedTitle}', '[^a-zA-Z0-9\\\\s]', '', 'g'))\\n`;
      insertStatements += `);\\n\\n`;
    }
    
    // Write all SQL files
    fs.writeFileSync(path.join(outputDir, 'step1_export_database_books.sql'), exportSQL, 'utf8');
    fs.writeFileSync(path.join(outputDir, 'step2_comprehensive_matching.sql'), matchingSQL, 'utf8');
    fs.writeFileSync(path.join(outputDir, 'step3_individual_updates.sql'), individualUpdates, 'utf8');
    fs.writeFileSync(path.join(outputDir, 'step4_insert_new_books.sql'), insertStatements, 'utf8');
    
    // Generate summary report
    const summaryPath = path.join(outputDir, 'book_sync_summary.txt');
    let summary = `Book Synchronization Summary\\n`;
    summary += `================================\\n\\n`;
    summary += `Total CSV books: ${csvBooks.length}\\n`;
    summary += `Database books: 871 (to be confirmed)\\n\\n`;
    summary += `Generated Files:\\n`;
    summary += `1. step1_export_database_books.sql - Export database books\\n`;
    summary += `2. step2_comprehensive_matching.sql - Comprehensive matching script\\n`;
    summary += `3. step3_individual_updates.sql - Individual update statements\\n`;
    summary += `4. step4_insert_new_books.sql - Insert new books\\n\\n`;
    summary += `Execution Steps:\\n`;
    summary += `1. Run step1 to export all database books\\n`;
    summary += `2. Run step2 for bulk matching and updates\\n`;
    summary += `3. Use step3 for manual fine-tuning\\n`;
    summary += `4. Run step4 to insert completely new books\\n\\n`;
    summary += `Note: Review all SQL statements before execution!\\n`;
    
    fs.writeFileSync(summaryPath, summary, 'utf8');
    
    console.log('\\n=== Generated Files ===');
    console.log(`1. Export SQL: ${path.join(outputDir, 'step1_export_database_books.sql')}`);
    console.log(`2. Matching SQL: ${path.join(outputDir, 'step2_comprehensive_matching.sql')}`);
    console.log(`3. Individual Updates: ${path.join(outputDir, 'step3_individual_updates.sql')}`);
    console.log(`4. Insert New Books: ${path.join(outputDir, 'step4_insert_new_books.sql')}`);
    console.log(`5. Summary: ${summaryPath}`);
    
    console.log('\\n=== Next Steps ===');
    console.log('1. Execute step1_export_database_books.sql to get all database books');
    console.log('2. Review and execute the matching and update scripts');
    console.log('3. Verify results and run insert script for new books');
    
  } catch (error) {
    console.error('Error generating book sync SQL:', error);
    process.exit(1);
  }
}

// Run the script
generateBookSyncSQL();