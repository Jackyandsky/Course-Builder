#!/usr/bin/env node

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

// Function to extract and refine book information
function extractBookInfo(line) {
  if (!line.trim()) return null;
  
  // Extract filename (everything after the file size)
  const parts = line.trim().split(/\s+/);
  if (parts.length < 5) return null;
  
  // Skip date, time, AM/PM, and size to get filename
  const filename = parts.slice(4).join(' ');
  
  // Remove file extension
  const nameWithoutExt = filename.replace(/\s*-\s*PDF\.pdf$/i, '').replace(/\.pdf$/i, '');
  
  let title = '';
  let author = '';
  let year = null;
  
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
    // Pattern: POETRY - Title, by Author
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
    // Just a title
    title = nameWithoutExt.trim();
  }
  
  // Clean up author names
  if (author) {
    // Normalize author names (G.K. Chesterton vs Gilbert Keith Chesterton)
    author = author
      .replace('Gilbert Keith Chesterton', 'G.K. Chesterton')
      .replace('A. E. Housman', 'A.E. Housman')
      .replace('A.C. Doyle', 'Arthur Conan Doyle');
  }
  
  return {
    title: title.trim(),
    author: author.trim() || null,
    publication_year: year,
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

console.log('Extracted Books:');
console.log('================\n');

books.forEach((book, index) => {
  console.log(`${index + 1}. "${book.title}"`);
  if (book.author) console.log(`   Author: ${book.author}`);
  if (book.publication_year) console.log(`   Year: ${book.publication_year}`);
  console.log('');
});

console.log(`\nTotal: ${books.length} books`);

// Export for SQL generation
module.exports = { books };