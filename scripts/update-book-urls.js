const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');

// Initialize Supabase client
const supabase = createClient(
  'https://djvmoqharkefksvceetu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdm1vcWhhcmtlZmtzdmNlZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDk2MDUsImV4cCI6MjA2NDk4NTYwNX0.3B6g4kgKW-TBCiwtpapuLuTzNdEhbAjP68_K9V2onJA'
);

// Function to clean book title for search
function cleanTitle(title) {
  if (!title) return '';
  // Remove parenthetical content, special characters, and extra spaces
  return title
    .replace(/\([^)]*\)/g, '') // Remove content in parentheses
    .replace(/[–—]/g, ' ')      // Replace dashes with spaces
    .replace(/[^a-zA-Z0-9\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ')       // Normalize spaces
    .trim();
}

// Function to search IGPS library
async function searchIGPSLibrary(bookTitle, author = '') {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Clean the title for search
    const searchQuery = cleanTitle(bookTitle);
    const searchUrl = `https://share.igpsedu.com/Library?search=${encodeURIComponent(searchQuery)}`;
    
    console.log(`   🔍 Searching: ${searchUrl}`);
    
    // Navigate to search page
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for results to load
    await page.waitForTimeout(2000);
    
    // Try to find book links
    const bookLinks = await page.evaluate(() => {
      const links = [];
      // Adjust selector based on actual IGPS library structure
      const bookElements = document.querySelectorAll('a[href*="/Library/"]');
      
      bookElements.forEach(element => {
        const href = element.href;
        const title = element.textContent?.trim();
        if (href && title) {
          links.push({ url: href, title });
        }
      });
      
      return links;
    });
    
    // Find best match
    if (bookLinks.length > 0) {
      // Try to find exact or close match
      const normalizedSearchTitle = searchQuery.toLowerCase();
      let bestMatch = bookLinks[0];
      
      for (const link of bookLinks) {
        const normalizedLinkTitle = link.title.toLowerCase();
        if (normalizedLinkTitle.includes(normalizedSearchTitle) || 
            normalizedSearchTitle.includes(normalizedLinkTitle)) {
          bestMatch = link;
          break;
        }
      }
      
      console.log(`   ✅ Found: ${bestMatch.url}`);
      return bestMatch.url;
    }
    
    console.log(`   ❌ No results found`);
    return null;
    
  } catch (error) {
    console.log(`   ❌ Search error: ${error.message}`);
    return null;
  } finally {
    await browser.close();
  }
}

// Main function to update books
async function updateBookUrls() {
  try {
    console.log('🚀 Starting book URL update process...\n');
    
    // Get books without file_url
    const { data: booksWithoutUrl, error } = await supabase
      .from('books')
      .select('id, title, author')
      .or('file_url.is.null,file_url.eq.')
      .limit(5); // Start with 5 books for testing
    
    if (error) throw error;
    
    console.log(`📚 Processing ${booksWithoutUrl.length} books...\n`);
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const book of booksWithoutUrl) {
      console.log(`📖 Book: "${book.title}"`);
      if (book.author && book.author !== 'nan') {
        console.log(`   Author: ${book.author}`);
      }
      
      // Search for the book
      const foundUrl = await searchIGPSLibrary(book.title, book.author);
      
      if (foundUrl) {
        // Update the book with the found URL
        const { error: updateError } = await supabase
          .from('books')
          .update({ file_url: foundUrl })
          .eq('id', book.id);
        
        if (updateError) {
          console.log(`   ❌ Failed to update: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated successfully!`);
          updatedCount++;
        }
      } else {
        notFoundCount++;
      }
      
      console.log('');
      
      // Add delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Updated: ${updatedCount} books`);
    console.log(`   ❌ Not found: ${notFoundCount} books`);
    console.log(`   📚 Total processed: ${booksWithoutUrl.length} books`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the update
if (require.main === module) {
  updateBookUrls()
    .then(() => {
      console.log('\n✨ Book URL update completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateBookUrls, searchIGPSLibrary };