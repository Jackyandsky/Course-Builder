const fs = require('fs');
const path = require('path');

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
function findBestMatch(dbBook, csvBooks) {
  const dbNormalized = normalizeTitle(dbBook.title);
  let bestMatch = null;
  let bestSimilarity = 0;
  
  for (const csvBook of csvBooks) {
    const sim = similarity(dbNormalized, csvBook.normalized_name);
    
    // Consider as match if similarity > 85% or exact match on shorter titles
    const isMatch = sim >= 0.95 || 
                   (dbNormalized.length > 15 && csvBook.normalized_name.length > 15 && sim >= 0.85);
    
    if (isMatch && sim > bestSimilarity) {
      bestMatch = csvBook;
      bestSimilarity = sim;
    }
  }
  
  return bestMatch ? { match: bestMatch, similarity: bestSimilarity } : null;
}

// Main function
async function syncBooksWithDatabase() {
  try {
    console.log('=== Starting Books Synchronization ===\n');
    
    // Read the CSV file
    const csvPath = path.join(__dirname, '..', 'sample', 'books', 'book_list.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const csvBooks = parseCSV(csvContent);
    
    console.log(`Loaded ${csvBooks.length} books from CSV`);
    
    // For this script, we'll use the first 200 database books as a sample
    // In a real implementation, you'd want to fetch all 871 books in batches
    const databaseBooks = [
      // Sample database books from the previous query
      {"id":"ed35d2e2-bd23-4ab0-b1ca-f586b80c847d","title":"100 Great Time Management Ideas","author":"Patrick Forsyth","file_url":null},
      {"id":"83a310dc-4157-4527-86ad-dd0c255263bf","title":"12 SAT Practice Tests and PSAT with Answer Key","author":"nan","file_url":null},
      {"id":"18f70a10-2aae-4522-8b74-4571a03ceb7a","title":"1984","author":"George Orwell","file_url":null},
      {"id":"b95ba154-2f01-44f0-a4ca-195ce522aa16","title":"400 Must-Have Words for the TOEFL","author":"nan","file_url":null},
      {"id":"eb4e2650-39e5-4a2a-9ec3-3c89f7dd77dc","title":"500+ Practice Questions for the New SAT","author":"nan","file_url":null},
      {"id":"a271ea9d-09ad-4ab9-8688-bd4fca873bab","title":"A Brief History Of Time","author":"Stephen Hawking","file_url":null},
      {"id":"562a1c8e-9319-4ee6-a39e-55c4adfe04c4","title":"A Child's History of England","author":"Charles Dickens","file_url":null},
      {"id":"425444c4-3224-4a63-b60a-16d0666734fa","title":"A Christmas Carol","author":"Charles Dickens","file_url":null},
      {"id":"2e5ffaef-f032-4817-b758-905f5113c893","title":"A Death in the Family","author":"James Agee","file_url":null},
      {"id":"80d8b8f6-8bee-4c01-a590-16330416c23c","title":"A Different Mirror for Young People. A History of Multicultural America","author":"Ronald Takaki","file_url":null}
      // Add more books as needed...
    ];
    
    console.log(`Sample: ${databaseBooks.length} database books`);
    
    // Task 1: Match database books with CSV and generate update statements
    console.log('\\n=== Task 1: Matching Database Books with CSV ===');
    const updateStatements = [];
    const matchedBooks = [];
    const unmatchedDbBooks = [];
    
    for (const dbBook of databaseBooks) {
      const result = findBestMatch(dbBook, csvBooks);
      
      if (result) {
        matchedBooks.push({
          db_id: dbBook.id,
          db_title: dbBook.title,
          csv_name: result.match.name,
          csv_url: result.match.url,
          similarity: (result.similarity * 100).toFixed(1) + '%'
        });
        
        // Generate SQL update statement
        const escapedUrl = result.match.url.replace(/'/g, "''");
        updateStatements.push(
          `UPDATE books SET file_url = '${escapedUrl}' WHERE id = '${dbBook.id}';`
        );
      } else {
        unmatchedDbBooks.push(dbBook);
      }
    }
    
    console.log(`Matched ${matchedBooks.length} database books with CSV entries`);
    console.log(`Unmatched database books: ${unmatchedDbBooks.length}`);
    
    // Task 2: Find books in CSV that are not in database
    console.log('\\n=== Task 2: Finding New Books to Insert ===');
    const usedCsvBooks = new Set(matchedBooks.map(m => m.csv_name));
    const newBooks = [];
    
    for (const csvBook of csvBooks) {
      if (!usedCsvBooks.has(csvBook.name)) {
        // Check if this book title is similar to any database book
        let isNewBook = true;
        
        for (const dbBook of databaseBooks) {
          const sim = similarity(normalizeTitle(dbBook.title), csvBook.normalized_name);
          if (sim > 0.8) {
            isNewBook = false;
            break;
          }
        }
        
        if (isNewBook) {
          newBooks.push(csvBook);
        }
      }
    }
    
    console.log(`Found ${newBooks.length} new books to insert`);
    
    // Generate insert statements
    const insertStatements = [];
    for (const book of newBooks) {
      const escapedTitle = book.name.replace(/'/g, "''");
      const escapedUrl = book.url.replace(/'/g, "''");
      
      insertStatements.push(
        `INSERT INTO books (title, file_url) VALUES ('${escapedTitle}', '${escapedUrl}');`
      );
    }
    
    // Generate output files
    const outputDir = path.join(__dirname, '..', 'sample', 'books');
    
    // 1. Update statements file
    const updateFilePath = path.join(outputDir, 'update_file_urls.sql');
    let updateContent = `-- Update file_url for matched books (${updateStatements.length} updates)\\n\\n`;
    updateContent += updateStatements.join('\\n');
    fs.writeFileSync(updateFilePath, updateContent, 'utf8');
    
    // 2. Insert statements file
    const insertFilePath = path.join(outputDir, 'insert_new_books.sql');
    let insertContent = `-- Insert new books from CSV (${insertStatements.length} inserts)\\n\\n`;
    insertContent += insertStatements.join('\\n');
    fs.writeFileSync(insertFilePath, insertContent, 'utf8');
    
    // 3. Match report CSV
    const matchReportPath = path.join(outputDir, 'database_csv_matches.csv');
    let matchContent = 'DB_ID,DB_Title,CSV_Name,CSV_URL,Similarity\\n';
    matchedBooks.forEach(match => {
      matchContent += [
        match.db_id,
        `"${match.db_title}"`,
        `"${match.csv_name}"`,
        `"${match.csv_url}"`,
        match.similarity
      ].join(',') + '\\n';
    });
    fs.writeFileSync(matchReportPath, matchContent, 'utf8');
    
    // 4. New books report CSV
    const newBooksReportPath = path.join(outputDir, 'new_books_to_insert.csv');
    let newBooksContent = 'Index,Title,File_URL,Size\\n';
    newBooks.forEach(book => {
      newBooksContent += [
        book.index,
        `"${book.name}"`,
        `"${book.url}"`,
        book.size
      ].join(',') + '\\n';
    });
    fs.writeFileSync(newBooksReportPath, newBooksContent, 'utf8');
    
    // Summary
    console.log('\\n=== Summary ===');
    console.log(`Total CSV books: ${csvBooks.length}`);
    console.log(`Total database books (sample): ${databaseBooks.length}`);
    console.log(`Successful matches: ${matchedBooks.length}`);
    console.log(`Unmatched database books: ${unmatchedDbBooks.length}`);
    console.log(`New books to insert: ${newBooks.length}`);
    console.log('\\n=== Generated Files ===');
    console.log(`Update SQL: ${updateFilePath}`);
    console.log(`Insert SQL: ${insertFilePath}`);
    console.log(`Match report: ${matchReportPath}`);
    console.log(`New books report: ${newBooksReportPath}`);
    
    console.log('\\n=== Example Matches ===');
    matchedBooks.slice(0, 10).forEach(match => {
      console.log(`"${match.db_title}" → "${match.csv_name}" (${match.similarity})`);
    });
    
    console.log('\\n=== Example New Books ===');
    newBooks.slice(0, 10).forEach(book => {
      console.log(`"${book.name}" (${book.size})`);
    });
    
  } catch (error) {
    console.error('Error syncing books:', error);
    process.exit(1);
  }
}

// Run the script
syncBooksWithDatabase();