import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { googleBooksService } from '@/lib/services/google-books';
import type { Database } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookId, googleBookId, action } = body;
    

    // Create supabase client for this request
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get Google Books API key from database settings (fallback to environment)
    let apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    
    // Try to get from database first
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'google_books_api_key')
      .eq('category', 'integrations')
      .single();

    if (settings?.value) {
      apiKey = settings.value;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Books API key not configured. Please configure it in Settings > Integrations.' },
        { status: 500 }
      );
    }

    // Check if Google Books integration is enabled
    const { data: enabledSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'google_books_enabled')
      .eq('category', 'integrations')
      .single();

    if (!enabledSetting?.value) {
      return NextResponse.json(
        { error: 'Google Books integration is disabled. Please enable it in Settings > Integrations.' },
        { status: 403 }
      );
    }

    googleBooksService.setApiKey(apiKey);

    // Get the book from database
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Handle different actions
    if (action === 'search') {
      // Search for books
      const results = await googleBooksService.searchBooks(
        book.title,
        book.author,
        10 // Get more results for better matching
      );

      // Find the best match
      const bestMatch = googleBooksService.findBestMatch(
        results.items,
        book.title,
        book.author
      );

      return NextResponse.json({
        results: results.items,
        bestMatch,
        totalItems: results.totalItems
      });
    } else if (action === 'sync') {
      // Sync with a specific Google Book
      let googleBook;
      
      if (googleBookId) {
        // Get specific book by ID
        googleBook = await googleBooksService.getBookById(googleBookId);
      } else {
        // Auto-search and get best match
        const results = await googleBooksService.searchBooks(
          book.title,
          book.author,
          5
        );
        
        const bestMatch = googleBooksService.findBestMatch(
          results.items,
          book.title,
          book.author
        );
        
        if (!bestMatch || bestMatch.confidence < 0.7) {
          return NextResponse.json({
            error: 'No confident match found',
            results: results.items,
            requiresManualSelection: true
          });
        }
        
        googleBook = bestMatch.book;
      }

      if (!googleBook) {
        return NextResponse.json(
          { error: 'Google Book not found' },
          { status: 404 }
        );
      }

      // Prepare update data
      const updateData: any = {};
      
      // Only update fields that are empty or missing
      if (!book.description && googleBook.description) {
        updateData.description = googleBook.description;
      }
      
      if ((!book.author || book.author === 'nan') && googleBook.authors && googleBook.authors.length > 0) {
        updateData.author = googleBook.authors.join(', ');
      }
      
      if (!book.publisher && googleBook.publisher) {
        updateData.publisher = googleBook.publisher;
      }
      
      if (!book.publication_year && googleBook.publishedDate) {
        const year = new Date(googleBook.publishedDate).getFullYear();
        if (year && !isNaN(year)) {
          updateData.publication_year = year;
        }
      }
      
      if (!book.isbn && googleBook.isbn) {
        updateData.isbn = googleBook.isbn;
      }
      
      
      if (!book.language && googleBook.language) {
        updateData.language = googleBook.language;
      }
      
      if (!book.cover_image_url && googleBook.imageLinks?.thumbnail) {
        // Use higher quality image if available
        updateData.cover_image_url = googleBook.imageLinks.thumbnail.replace('&zoom=1', '&zoom=2');
      }
      
      // Add categories as tags if not present
      if ((!book.tags || book.tags.length === 0) && googleBook.categories && googleBook.categories.length > 0) {
        updateData.tags = googleBook.categories.slice(0, 5); // Limit to 5 tags
      }

      // Update the book if there are changes
      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = new Date().toISOString();
        
        const { error: updateError } = await supabase
          .from('books')
          .update(updateData)
          .eq('id', bookId);

        if (updateError) {
          throw updateError;
        }

        return NextResponse.json({
          success: true,
          updatedFields: Object.keys(updateData),
          googleBook,
          message: `Updated ${Object.keys(updateData).length} fields`
        });
      } else {
        return NextResponse.json({
          success: true,
          updatedFields: [],
          googleBook,
          message: 'No fields needed updating'
        });
      }
    } else if (action === 'sync-with-replacement') {
      // This allows updating even non-empty fields (used for manual selection)
      const googleBook = await googleBooksService.getBookById(googleBookId);
      
      if (!googleBook) {
        return NextResponse.json(
          { error: 'Google Book not found' },
          { status: 404 }
        );
      }

      // Update all available fields from Google Books
      const updateData: any = {};
      
      if (googleBook.title) {
        updateData.title = googleBook.title;
      }
      
      if (googleBook.description) {
        updateData.description = googleBook.description;
      }
      
      if (googleBook.authors && googleBook.authors.length > 0) {
        updateData.author = googleBook.authors.join(', ');
      }
      
      if (googleBook.publisher) {
        updateData.publisher = googleBook.publisher;
      }
      
      if (googleBook.publishedDate) {
        const year = new Date(googleBook.publishedDate).getFullYear();
        if (year && !isNaN(year)) {
          updateData.publication_year = year;
        }
      }
      
      if (googleBook.isbn) {
        updateData.isbn = googleBook.isbn;
      }
      
      
      if (googleBook.language) {
        updateData.language = googleBook.language;
      }
      
      if (googleBook.imageLinks?.thumbnail) {
        updateData.cover_image_url = googleBook.imageLinks.thumbnail.replace('&zoom=1', '&zoom=2');
      }
      
      if (googleBook.categories && googleBook.categories.length > 0) {
        updateData.tags = googleBook.categories.slice(0, 5);
      }

      updateData.updated_at = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('books')
        .update(updateData)
        .eq('id', bookId);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        updatedFields: Object.keys(updateData),
        googleBook,
        message: `Updated ${Object.keys(updateData).length} fields (with replacement)`
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Google Books sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync with Google Books' },
      { status: 500 }
    );
  }
}