#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Book list from file directory
const rawBookList = `
2025-08-20  03:50 PM         1,318,741 A.C. Doyle – The Return of Sherlock Holmes - PDF.pdf
2025-08-20  03:49 PM           776,633 Arnold Bennett – The Old Wives' Tale - PDF.pdf
2025-08-20  03:50 PM           279,789 Arthur Machen – The White People - PDF.pdf
2025-08-20  03:49 PM         2,231,764 G.K. Chesterton – The Napoleon of Notting Hill (1904) - PDF.pdf
2025-08-20  03:50 PM         9,805,341 Gilbert Keith Chesterton – The Man Who Was Thursday (1908) - PDF.pdf
2025-08-20  03:50 PM           724,833 H.G. Wells – The Food of the Gods - PDF.pdf
2025-08-20  03:50 PM         1,375,336 Hilaire Belloc – The Bad Child's Book of Beasts - PDF.pdf
2025-08-20  03:49 PM         2,181,122 John Buchan – The Thirty-Nine Steps (1915) - PDF.pdf
2025-08-20  03:49 PM            82,101 Lord Dunsany – The Gods of Pegāna - PDF.pdf
2025-08-20  03:49 PM           227,287 Oscar Wilde – De Profundis (1905, posthumous publication) - PDF.pdf
2025-08-20  03:49 PM           110,597 POETRY - A Shropshire Lad, by A. E. Housman.pdf
2025-08-20  03:50 PM            84,021 POETRY - John Masefield – The Everlasting Mercy .pdf
2025-08-20  03:49 PM           530,306 Pollyanna, by Eleanor H. Porter - PDF.pdf
2025-08-20  03:50 PM           585,623 Rudyard Kipling – Kim (1901) - PDF.pdf
2025-08-20  03:49 PM           144,564 The Good Soldier by Ford Madox Ford - PDF.pdf
2025-08-20  03:49 PM         1,966,471 The Island of Doctor Moreau - PDF .pdf
2025-08-20  03:50 PM           518,829 The Red Badge of Courage - PDF.pdf
2025-08-20  03:50 PM        11,938,571 The Tale of Peter Rabbit, by Beatrix Potter.pdf
2025-08-20  03:49 PM           195,437 William Hope Hodgson – The House on the Borderland - PDF.pdf
`;

// Function to escape SQL strings
function escapeSQLString(str) {
  if (!str) return null;
  return str.replace(/'/g, "''");
}

// Function to extract and refine book information
function extractBookInfo(line) {
  if (!line.trim()) return null;
  
  // Extract filename (everything after the file size)
  const parts = line.trim().split(/\s+/);
  if (parts.length < 5) return null;
  
  // Skip date, time, AM/PM, and size to get filename
  const filename = parts.slice(4).join(' ');
  
  // Remove file extension
  const nameWithoutExt = filename
    .replace(/\s*-\s*PDF\.pdf$/i, '')
    .replace(/\.pdf$/i, '')
    .replace(/\s*-\s*PDF\s*$/, '');
  
  let title = '';
  let author = '';
  let year = null;
  let genre = 'Classic Literature';
  let isbn = null;
  
  // Handle different patterns
  if (nameWithoutExt.includes(' – ')) {
    // Pattern: Author – Title (Year)
    const [authorPart, ...titleParts] = nameWithoutExt.split(' – ');
    author = authorPart.trim();
    let titlePart = titleParts.join(' – ').trim();
    
    // Extract year if present
    const yearMatch = titlePart.match(/\((\d{4})[^)]*\)/);
    if (yearMatch) {
      year = parseInt(yearMatch[1]);
      titlePart = titlePart.replace(/\s*\([^)]+\)/, '').trim();
    }
    title = titlePart;
  } else if (nameWithoutExt.startsWith('POETRY - ')) {
    // Pattern: POETRY - Title, by Author or POETRY - Author – Title
    genre = 'Poetry';
    const poetryContent = nameWithoutExt.replace('POETRY - ', '');
    if (poetryContent.includes(', by ')) {
      const [titlePart, authorPart] = poetryContent.split(', by ');
      title = titlePart.trim();
      author = authorPart.trim();
    } else if (poetryContent.includes(' – ')) {
      const [authorPart, titlePart] = poetryContent.split(' – ');
      author = authorPart.trim();
      title = titlePart.trim();
    } else {
      title = poetryContent.trim();
    }
  } else if (nameWithoutExt.includes(', by ')) {
    // Pattern: Title, by Author
    const [titlePart, authorPart] = nameWithoutExt.split(', by ');
    title = titlePart.trim();
    author = authorPart.trim();
  } else if (nameWithoutExt.includes(' by ')) {
    // Pattern: Title by Author
    const [titlePart, authorPart] = nameWithoutExt.split(' by ');
    title = titlePart.trim();
    author = authorPart.trim();
  } else {
    // Just a title - need to add missing authors
    title = nameWithoutExt.trim();
    
    // Add known authors for titles missing them
    if (title === 'The Island of Doctor Moreau') {
      author = 'H.G. Wells';
      genre = 'Science Fiction';
    } else if (title === 'The Red Badge of Courage') {
      author = 'Stephen Crane';
      genre = 'War Fiction';
    }
  }
  
  // Clean up and normalize author names
  if (author) {
    author = author
      .replace('Gilbert Keith Chesterton', 'G.K. Chesterton')
      .replace('A. E. Housman', 'A.E. Housman')
      .replace('A.C. Doyle', 'Arthur Conan Doyle');
  }
  
  // Determine genre based on content
  if (title.includes('Sherlock Holmes')) genre = 'Mystery';
  if (title.includes('Peter Rabbit')) genre = 'Children\'s Literature';
  if (author === 'H.G. Wells') genre = 'Science Fiction';
  
  return {
    title: title.trim(),
    author: author.trim() || null,
    publication_year: year,
    genre: genre,
    isbn: isbn,
    filename: filename
  };
}

// Process all books
const books = rawBookList
  .split('\n')
  .map(extractBookInfo)
  .filter(book => book && book.title);

// Sort by title
books.sort((a, b) => a.title.localeCompare(b.title));

// Generate SQL
const sql = `-- Insert books from refined list
-- Generated on ${new Date().toISOString()}
-- Total: ${books.length} books

-- First check for existing books to avoid duplicates
WITH new_books AS (
  SELECT * FROM (VALUES
${books.map((book, index) => {
  const values = [
    `'${escapeSQLString(book.title)}'`,
    book.author ? `'${escapeSQLString(book.author)}'` : 'NULL',
    book.isbn ? `'${escapeSQLString(book.isbn)}'` : 'NULL',
    book.publication_year || 'NULL',
    `'${escapeSQLString(book.genre)}'`,
    'NULL', // publisher
    'NULL', // description
    'NULL', // cover_image_url
    'NULL', // total_pages
    "'English'", // language
    'true', // available
    '0', // stock_quantity
    'NULL', // location
    'NOW()',
    'NOW()'
  ];
  
  const isLast = index === books.length - 1;
  return `    (${values.join(', ')})${isLast ? '' : ','}`;
}).join('\n')}
  ) AS t(title, author, isbn, publication_year, genre, publisher, description, cover_image_url, total_pages, language, available, stock_quantity, location, created_at, updated_at)
)
INSERT INTO books (title, author, isbn, publication_year, genre, publisher, description, cover_image_url, total_pages, language, available, stock_quantity, location, created_at, updated_at)
SELECT nb.* FROM new_books nb
WHERE NOT EXISTS (
  SELECT 1 FROM books b 
  WHERE LOWER(b.title) = LOWER(nb.title) 
  AND (
    (b.author IS NULL AND nb.author IS NULL) OR 
    (LOWER(b.author) = LOWER(nb.author))
  )
);

-- Return count of inserted books
SELECT COUNT(*) as inserted_count FROM books 
WHERE created_at >= NOW() - INTERVAL '1 minute';
`;

// Save SQL to file
const outputPath = path.join(__dirname, '..', 'database', 'migrations', 'insert_books.sql');
fs.writeFileSync(outputPath, sql, 'utf8');

console.log('Book Processing Summary:');
console.log('========================\n');

books.forEach((book, index) => {
  console.log(`${index + 1}. "${book.title}"`);
  if (book.author) console.log(`   Author: ${book.author}`);
  if (book.publication_year) console.log(`   Year: ${book.publication_year}`);
  console.log(`   Genre: ${book.genre}`);
  console.log('');
});

console.log(`Total: ${books.length} books`);
console.log(`\nSQL file generated: ${outputPath}`);
console.log('\nThe SQL includes duplicate prevention using:');
console.log('- Title matching (case-insensitive)');
console.log('- Author matching (case-insensitive)');
console.log('- Only inserts books that don\'t already exist');