const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Function to normalize book names for comparison
function normalizeName(name) {
  // Remove file extension and common variations
  return name
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[_\-\s]+/g, ' ') // Replace underscores, hyphens with spaces
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
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

// Function to parse file size to bytes
function parseSizeToBytes(sizeStr) {
  const match = sizeStr.match(/([\d.]+)\s*(\w+)/);
  if (!match) return 0;
  
  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  const multipliers = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024
  };
  
  return Math.round(num * (multipliers[unit] || 1));
}

// Main function
async function parseBookList() {
  try {
    // Read the HTML file
    const htmlPath = path.join(__dirname, '..', 'sample', 'books', 'book_list.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    // Parse with cheerio
    const $ = cheerio.load(html);
    
    // Extract book data
    const books = [];
    let index = 0;
    
    $('tr').each((i, row) => {
      const $row = $(row);
      const $link = $row.find('a[href*=".pdf"]').first();
      
      if ($link.length > 0) {
        const url = $link.attr('href');
        
        // The structure is: <a><i class="fa fa-file-pdf-o"></i> ACTUAL_NAME.pdf</a>
        // We need to get the text content AFTER the <i> tag
        
        let name = '';
        
        // Get the full HTML content of the link
        const linkHtml = $link.html();
        
        // Extract text after the </i> tag
        const afterIconMatch = linkHtml.match(/<\/i>\s*(.+?)$/s);
        if (afterIconMatch && afterIconMatch[1]) {
          name = afterIconMatch[1].trim();
        }
        
        // If that didn't work, try getting all text and removing icon text
        if (!name) {
          let rawText = $link.text().trim();
          // The icon adds a space and the actual filename follows
          // Split by the icon and take the last part
          const parts = rawText.split(/\s{2,}/); // Split by multiple spaces
          if (parts.length > 1) {
            name = parts[parts.length - 1].trim();
          } else {
            name = rawText.trim();
          }
        }
        
        // If name still looks weird or is empty, extract from URL as fallback
        if (!name || name.length < 3) {
          // Decode URL and extract filename
          const decodedUrl = decodeURIComponent(url);
          const urlParts = decodedUrl.split('/');
          name = urlParts[urlParts.length - 1];
        }
        
        // Clean up special characters and formatting issues
        name = name
          .replace(/%20/g, ' ') // Replace URL encoded spaces
          .replace(/%E2%80%99/g, "'") // Replace encoded apostrophe
          .replace(/%E2%80%94/g, "—") // Replace encoded em dash
          .replace(/%C3%A9/g, "é") // Replace encoded é
          .replace(/%C3%AD/g, "í") // Replace encoded í
          .replace(/%C3%B1/g, "ñ") // Replace encoded ñ
          .replace(/\s+/g, ' ') // Multiple spaces to single
          .trim();
        
        // Fix names that start with problematic characters for Excel
        // These characters can cause Excel to interpret as formulas
        if (name.match(/^[-+=@]/)) {
          // If name starts with -, +, =, or @, prepend with apostrophe
          // This tells Excel to treat it as text
          name = "'" + name;
        }
        
        // Also handle empty or very short names
        if (!name || name.length < 2) {
          // Extract from URL as fallback
          const decodedUrl = decodeURIComponent(url);
          const urlParts = decodedUrl.split('/');
          name = urlParts[urlParts.length - 1] || 'Unknown.pdf';
        }
        
        const $tds = $row.find('td');
        let size = '';
        let modtime = '';
        
        $tds.each((j, td) => {
          const text = $(td).text().trim();
          if (text.match(/\d+(\.\d+)?\s*(B|KB|MB|GB)/)) {
            size = text;
          } else if (text.match(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/)) {
            modtime = text;
          }
        });
        
        books.push({
          index: index++,
          name: name,
          url: url,
          size: size,
          size_bytes: parseSizeToBytes(size),
          modtime: modtime,
          normalized_name: normalizeName(name),
          is_duplicate: false,
          duplicate_of: null
        });
      }
    });
    
    // Mark potential duplicates
    console.log(`Found ${books.length} books. Checking for duplicates...`);
    
    for (let i = 0; i < books.length; i++) {
      if (books[i].is_duplicate) continue;
      
      // Check adjacent books (within 10 positions for better coverage)
      for (let j = Math.max(0, i - 10); j < Math.min(books.length, i + 11); j++) {
        if (i === j || books[j].is_duplicate) continue;
        
        const book1 = books[i];
        const book2 = books[j];
        
        // Check if same size (REQUIRED for duplicate)
        const sameSize = book1.size_bytes === book2.size_bytes && book1.size_bytes > 0;
        
        // Only consider as duplicate if SAME SIZE
        if (!sameSize) continue;
        
        // Check name similarity
        const nameSimilarity = similarity(book1.normalized_name, book2.normalized_name);
        
        // Mark as duplicate only if:
        // Same size AND name similarity > 60%
        // (Lower threshold since we now require same size)
        if (nameSimilarity > 0.6) {
          books[j].is_duplicate = true;
          books[j].duplicate_of = i;
          console.log(`  Duplicate found: "${book2.name}" is duplicate of "${book1.name}" (similarity: ${(nameSimilarity * 100).toFixed(1)}%, size: ${book1.size})`);
        }
      }
    }
    
    // Helper function to escape CSV fields
    function escapeCSVField(field) {
      if (field === null || field === undefined) return '';
      
      const stringField = String(field);
      
      // Always quote fields that contain commas, quotes, newlines, or start with special chars
      if (stringField.includes(',') || 
          stringField.includes('"') || 
          stringField.includes('\n') || 
          stringField.includes('\r') ||
          stringField.match(/^[-+=@]/)) {
        // Escape quotes by doubling them
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      
      return stringField;
    }
    
    // Generate CSV
    const csvPath = path.join(__dirname, '..', 'sample', 'books', 'book_list.csv');
    const csvHeader = 'Index,Name,URL,Size,Size_Bytes,ModTime,Is_Duplicate,Duplicate_Of,Normalized_Name\n';
    
    let csvContent = csvHeader;
    books.forEach(book => {
      const row = [
        book.index,
        escapeCSVField(book.name),
        escapeCSVField(book.url),
        escapeCSVField(book.size),
        book.size_bytes,
        escapeCSVField(book.modtime),
        book.is_duplicate ? 'TRUE' : 'FALSE',
        book.duplicate_of !== null ? book.duplicate_of : '',
        escapeCSVField(book.normalized_name)
      ].join(',');
      csvContent += row + '\n';
    });
    
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    
    // Statistics
    const duplicateCount = books.filter(b => b.is_duplicate).length;
    const uniqueCount = books.length - duplicateCount;
    
    console.log('\n=== Summary ===' );
    console.log(`Total books: ${books.length}`);
    console.log(`Unique books: ${uniqueCount}`);
    console.log(`Duplicates found: ${duplicateCount}`);
    console.log(`CSV file saved to: ${csvPath}`);
    
    // Also create a duplicates-only CSV for easy review
    const duplicatesPath = path.join(__dirname, '..', 'sample', 'books', 'duplicates_only.csv');
    let duplicatesCsv = 'Original_Index,Original_Name,Duplicate_Index,Duplicate_Name,Size,Similarity\n';
    
    books.filter(b => b.is_duplicate).forEach(dup => {
      const original = books[dup.duplicate_of];
      const sim = similarity(original.normalized_name, dup.normalized_name);
      duplicatesCsv += [
        original.index,
        escapeCSVField(original.name),
        dup.index,
        escapeCSVField(dup.name),
        escapeCSVField(dup.size),
        (sim * 100).toFixed(1) + '%'
      ].join(',') + '\n';
    });
    
    fs.writeFileSync(duplicatesPath, duplicatesCsv, 'utf8');
    console.log(`Duplicates-only CSV saved to: ${duplicatesPath}`);
    
    // Show some examples of duplicates found
    console.log('\n=== Example Duplicates Found ===');
    const duplicatesShown = new Set();
    let exampleCount = 0;
    
    books.filter(b => b.is_duplicate).forEach(dup => {
      if (exampleCount >= 10) return; // Show only first 10 examples
      
      const original = books[dup.duplicate_of];
      if (!duplicatesShown.has(original.index)) {
        duplicatesShown.add(original.index);
        console.log(`\nOriginal: "${original.name}" (${original.size})`);
        
        // Find all duplicates of this original
        const allDups = books.filter(b => b.duplicate_of === original.index);
        allDups.forEach(d => {
          console.log(`  → Duplicate: "${d.name}"`);
        });
        exampleCount++;
      }
    });
    
  } catch (error) {
    console.error('Error parsing book list:', error);
    process.exit(1);
  }
}

// Run the script
parseBookList();