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

// Database books (fetched from Supabase)
const databaseBooks = [
  {"id":"ed35d2e2-bd23-4ab0-b1ca-f586b80c847d","title":"100 Great Time Management Ideas","author":"Patrick Forsyth"},
  {"id":"83a310dc-4157-4527-86ad-dd0c255263bf","title":"12 SAT Practice Tests and PSAT with Answer Key","author":"nan"},
  {"id":"18f70a10-2aae-4522-8b74-4571a03ceb7a","title":"1984","author":"George Orwell"},
  {"id":"b95ba154-2f01-44f0-a4ca-195ce522aa16","title":"400 Must-Have Words for the TOEFL","author":"nan"},
  {"id":"eb4e2650-39e5-4a2a-9ec3-3c89f7dd77dc","title":"500+ Practice Questions for the New SAT","author":"nan"},
  {"id":"a271ea9d-09ad-4ab9-8688-bd4fca873bab","title":"A Brief History Of Time","author":"Stephen Hawking"},
  {"id":"562a1c8e-9319-4ee6-a39e-55c4adfe04c4","title":"A Child's History of England","author":"Charles Dickens"},
  {"id":"425444c4-3224-4a63-b60a-16d0666734fa","title":"A Christmas Carol","author":"Charles Dickens"},
  {"id":"2e5ffaef-f032-4817-b758-905f5113c893","title":"A Death in the Family","author":"James Agee"},
  {"id":"80d8b8f6-8bee-4c01-a590-16330416c23c","title":"A Different Mirror for Young People. A History of Multicultural America","author":"Ronald Takaki"},
  {"id":"56b45285-d89c-493e-84a2-d9aea645b99a","title":"A Farewell to Arms","author":"Ernest Hemingway"},
  {"id":"2b0238d2-a4ff-4664-942c-f87153770a1f","title":"A Great and Terrible Beauty","author":"Libba Bray"},
  {"id":"3edb64e6-6423-4255-8ffc-13de83bdeb77","title":"A Guest of Honour","author":"Nadine Gordimer"},
  {"id":"6cdd55d5-fdad-449e-a3c0-4dcbd7a6b430","title":"A History of the World in 6 Glasses","author":"Tom Standage"},
  {"id":"75ab5dcd-20da-4191-b9f0-beea1a6348cf","title":"A Little Life","author":"Hanya Yanagihara"},
  {"id":"e561e303-06c3-4b94-9bf0-e91c0b27e29b","title":"A Long Walk to Water","author":"Linda Sue Park"},
  {"id":"b21e1489-3fdf-4c0a-968c-245b3ea33d2a","title":"A Midsummer Night's Dream","author":"William Shakespeare"},
  {"id":"859dee2c-b96b-4765-b100-b2eba31e2bcc","title":"A Passage to India","author":"E. M. Forster"},
  {"id":"a81e6739-6473-45fe-ba1d-3caaf6c37111","title":"A Portrait of the Artist as a Young Man","author":"James Joyce"},
  {"id":"0b5bb46c-1faa-43e5-8838-207b22dac456","title":"A Promised Land","author":"Barack Obama"},
  {"id":"149a5dd1-a9fe-47a0-8ea6-45b0a6af602c","title":"A Room with a View","author":"E. M. Forster"},
  {"id":"e31e4817-2405-4375-8afc-d22aa0435b02","title":"A Sentimental Education","author":"Gustave Flaubert"},
  {"id":"e2a30ba1-d4e1-4621-942b-a9ba7ec1c767","title":"A soldier's embrace","author":"Nadine Gordimer"},
  {"id":"120c70cf-1310-4f42-b3dc-092639cade98","title":"A Song Below Water","author":"Bethany C. Morrow"},
  {"id":"2fb5cd9c-d9ec-4d83-babb-c5079ccec277","title":"A Sport of Nature","author":"Nadine Gordimer"},
  {"id":"95a5ca6a-c86e-4698-9e6e-d5e73f2618a2","title":"A Streetcar Named Desire","author":"Tennessee Williams"},
  {"id":"a298def8-31de-47c5-981f-ad13ed5fe772","title":"A Study in Scarlet","author":"Arthur Conan Doyle"},
  {"id":"2d8ac6ed-985c-434c-ac8f-4e7af4c62f47","title":"A Tale of Two Cities","author":"Charles Dickens"},
  {"id":"8291c8c4-355c-44c7-98a0-13de894cee60","title":"A Tear in the Ocean","author":"H. M. Bouwman"},
  {"id":"6e78863d-6bd7-4d0b-9f82-f1169d1753c8","title":"A Tree Grows in Brooklyn","author":"Betty Smith"},
  {"id":"6da4b4cb-665e-4d91-8990-f8f319565ed4","title":"A Visit from the Goon Squad","author":"Jennifer Egan"},
  {"id":"702e84e8-be5a-4851-943f-01257e79a893","title":"A Whistling Good Idea","author":"nan"},
  {"id":"d694bd62-b369-43a7-9d73-8ea0cb143621","title":"A Wizard Of Earthsea","author":"Ursula K. Le Guin"},
  {"id":"e95dc6c6-f366-44ef-83e4-673d3f72a435","title":"A Wrinkle in Time","author":"Madeleine L'Engle"},
  {"id":"9b8c8bf2-848b-4abf-afd3-ef95f0d8a061","title":"Absalom Absalom!","author":"William Faulkner"}
];

// Main function
async function compareBooks() {
  try {
    // Read the CSV file
    const csvPath = path.join(__dirname, '..', 'sample', 'books', 'book_list.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Parse CSV content
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const csvBooks = [];
    
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
      
      if (values.length >= 2) {
        csvBooks.push({
          index: parseInt(values[0]) || 0,
          name: values[1].replace(/^"|"$/g, ''), // Remove quotes
          url: values[2],
          size: values[3],
          normalized_name: normalizeTitle(values[1].replace(/^"|"$/g, ''))
        });
      }
    }
    
    console.log(`Loaded ${csvBooks.length} books from CSV`);
    console.log(`Loaded ${databaseBooks.length} books from database`);
    console.log('\n=== Checking for potential duplicates ===\n');
    
    const potentialDuplicates = [];
    
    // Compare each CSV book with database books
    csvBooks.forEach(csvBook => {
      databaseBooks.forEach(dbBook => {
        const dbNormalized = normalizeTitle(dbBook.title);
        const sim = similarity(csvBook.normalized_name, dbNormalized);
        
        // More precise matching:
        // - Exact match (95%+) for any length
        // - High similarity (90%+) for titles longer than 20 chars
        // - Very high similarity (95%+) for shorter titles
        const isMatch = sim >= 0.95 || 
                       (csvBook.normalized_name.length > 20 && dbNormalized.length > 20 && sim >= 0.90);
        
        if (isMatch) {
          potentialDuplicates.push({
            csv_index: csvBook.index,
            csv_name: csvBook.name,
            csv_size: csvBook.size,
            db_id: dbBook.id,
            db_title: dbBook.title,
            db_author: dbBook.author,
            similarity: (sim * 100).toFixed(1) + '%'
          });
        }
      });
    });
    
    console.log(`Found ${potentialDuplicates.length} potential duplicates:\n`);
    
    // Group by database book for better readability
    const groupedDuplicates = {};
    potentialDuplicates.forEach(dup => {
      const key = dup.db_id;
      if (!groupedDuplicates[key]) {
        groupedDuplicates[key] = {
          db_book: {
            id: dup.db_id,
            title: dup.db_title,
            author: dup.db_author
          },
          csv_matches: []
        };
      }
      groupedDuplicates[key].csv_matches.push({
        index: dup.csv_index,
        name: dup.csv_name,
        size: dup.csv_size,
        similarity: dup.similarity
      });
    });
    
    // Display results
    Object.values(groupedDuplicates).forEach(group => {
      console.log(`📚 Database Book: "${group.db_book.title}" by ${group.db_book.author}`);
      console.log(`   ID: ${group.db_book.id}`);
      group.csv_matches.forEach(match => {
        console.log(`   → CSV Match: "${match.name}" (${match.size}) - Similarity: ${match.similarity}`);
      });
      console.log('');
    });
    
    // Generate CSV report
    const reportPath = path.join(__dirname, '..', 'sample', 'books', 'database_duplicates_report.csv');
    let reportContent = 'CSV_Index,CSV_Name,CSV_Size,DB_ID,DB_Title,DB_Author,Similarity\n';
    
    potentialDuplicates.forEach(dup => {
      reportContent += [
        dup.csv_index,
        `"${dup.csv_name}"`,
        dup.csv_size,
        dup.db_id,
        `"${dup.db_title}"`,
        dup.db_author === 'nan' ? '""' : `"${dup.db_author}"`,
        dup.similarity
      ].join(',') + '\n';
    });
    
    fs.writeFileSync(reportPath, reportContent, 'utf8');
    
    console.log('=== Summary ===');
    console.log(`Total CSV books: ${csvBooks.length}`);
    console.log(`Total database books: ${databaseBooks.length}`);
    console.log(`Potential duplicates found: ${potentialDuplicates.length}`);
    console.log(`Report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('Error comparing books:', error);
    process.exit(1);
  }
}

// Run the script
compareBooks();