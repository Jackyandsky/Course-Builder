const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  'https://djvmoqharkefksvceetu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdm1vcWhhcmtlZmtzdmNlZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDk2MDUsImV4cCI6MjA2NDk4NTYwNX0.3B6g4kgKW-TBCiwtpapuLuTzNdEhbAjP68_K9V2onJA'
);

async function exportDatabaseBooks() {
  try {
    console.log('📚 Exporting all books from database...');
    
    const allBooks = [];
    const batchSize = 100;
    let page = 0;
    let hasMore = true;
    
    while (hasMore) {
      const start = page * batchSize;
      const end = start + batchSize - 1;
      
      console.log(`📖 Fetching books ${start + 1} to ${end + 1}...`);
      
      const { data: books, error } = await supabase
        .from('books')
        .select('id, title, author, file_url')
        .order('title')
        .range(start, end);
      
      if (error) {
        console.error('❌ Error fetching books:', error);
        throw error;
      }
      
      if (books && books.length > 0) {
        allBooks.push(...books);
        console.log(`✅ Fetched ${books.length} books (total: ${allBooks.length})`);
      }
      
      hasMore = books && books.length === batchSize;
      page++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`✅ Export completed! Total books: ${allBooks.length}`);
    
    // Write to JSON file
    const outputPath = '/mnt/d/dev/cursor/course builder/sample/books/database_books_export.json';
    fs.writeFileSync(outputPath, JSON.stringify(allBooks, null, 2));
    
    console.log(`💾 Saved to: ${outputPath}`);
    
    // Quick stats
    const booksWithUrl = allBooks.filter(book => book.file_url);
    const booksWithoutUrl = allBooks.filter(book => !book.file_url);
    
    console.log(`📊 Statistics:`);
    console.log(`   - Total books: ${allBooks.length}`);
    console.log(`   - Books with file_url: ${booksWithUrl.length}`);
    console.log(`   - Books without file_url: ${booksWithoutUrl.length}`);
    
    return allBooks;
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
}

// Run the export
if (require.main === module) {
  exportDatabaseBooks();
}

module.exports = { exportDatabaseBooks };