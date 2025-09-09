import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { googleBooksService } from '@/lib/services/google-books';
import type { Database } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filters, limit = 100 } = body;
    

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

    // Calculate cooldown period (30 minutes ago)
    const cooldownPeriod = new Date();
    cooldownPeriod.setMinutes(cooldownPeriod.getMinutes() - 30);
    const cooldownTimestamp = cooldownPeriod.toISOString();

    // Build query based on filters
    let query = supabase
      .from('books')
      .select('id, title, author, description, publisher, publication_year, isbn, language, cover_image_url, tags, sync_attempts, last_sync_attempt, sync_status')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // Exclude books that were recently attempted and failed
    // Only exclude if they've been attempted in the last 30 minutes
    query = query.or(`last_sync_attempt.is.null,last_sync_attempt.lt.${cooldownTimestamp}`);

    // Apply filters for missing properties
    if (filters?.missingDescription) {
      query = query.or('description.is.null,description.eq.""');
    }
    if (filters?.missingAuthor) {
      query = query.or('author.is.null,author.eq."",author.eq.nan');
    }
    if (filters?.missingCover) {
      query = query.or('cover_image_url.is.null,cover_image_url.eq.""');
    }
    if (filters?.missingPublisher) {
      query = query.or('publisher.is.null,publisher.eq.""');
    }
    if (filters?.missingYear) {
      query = query.is('publication_year', null);
    }
    if (filters?.missingISBN) {
      query = query.or('isbn.is.null,isbn.eq.""');
    }
    if (filters?.missingLanguage) {
      query = query.or('language.is.null,language.eq.""');
    }
    if (filters?.missingTags) {
      query = query.or('tags.is.null,tags.eq.{}');
    }

    const { data: books, error: booksError } = await query;

    if (booksError) {
      throw booksError;
    }

    if (!books || books.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No books found matching the criteria',
        totalProcessed: 0,
        totalUpdated: 0,
        results: []
      });
    }

    // Process books in batches to avoid rate limiting
    const results = [];
    let totalUpdated = 0;
    const batchSize = 5; // Process 5 books at a time
    
    for (let i = 0; i < books.length; i += batchSize) {
      const batch = books.slice(i, Math.min(i + batchSize, books.length));
      
      const batchPromises = batch.map(async (book) => {
        try {
          // Update sync tracking - increment attempts and set timestamp
          await supabase
            .from('books')
            .update({
              last_sync_attempt: new Date().toISOString(),
              sync_attempts: (book.sync_attempts || 0) + 1
            })
            .eq('id', book.id);

          // Search for the book on Google Books
          const searchResults = await googleBooksService.searchBooks(
            book.title,
            book.author,
            3
          );
          
          if (!searchResults.items || searchResults.items.length === 0) {
            // Update status as no_match
            await supabase
              .from('books')
              .update({ sync_status: 'no_match' })
              .eq('id', book.id);
              
            return {
              bookId: book.id,
              title: book.title,
              status: 'no_match',
              message: 'No results found on Google Books'
            };
          }
          
          // Find the best match
          const bestMatch = googleBooksService.findBestMatch(
            searchResults.items,
            book.title,
            book.author
          );
          
          if (!bestMatch || bestMatch.confidence < 0.7) {
            // Update status as low_confidence
            await supabase
              .from('books')
              .update({ sync_status: 'low_confidence' })
              .eq('id', book.id);
              
            return {
              bookId: book.id,
              title: book.title,
              status: 'low_confidence',
              message: `Match confidence too low: ${bestMatch?.confidence || 0}`,
              googleTitle: bestMatch?.book.title
            };
          }
          
          const googleBook = bestMatch.book;
          
          // Prepare update data - update ALL missing fields regardless of filter
          const updateData: any = {};
          
          // Always check and update ALL missing fields for selected books
          if (!book.description && googleBook.description) {
            updateData.description = googleBook.description;
          }
          
          if ((!book.author || book.author === 'nan') && googleBook.authors?.length > 0) {
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
            updateData.cover_image_url = googleBook.imageLinks.thumbnail.replace('&zoom=1', '&zoom=2');
          }
          
          if ((!book.tags || book.tags.length === 0) && googleBook.categories?.length > 0) {
            updateData.tags = googleBook.categories.slice(0, 5);
          }
          
          // Update if there are changes
          if (Object.keys(updateData).length > 0) {
            updateData.updated_at = new Date().toISOString();
            updateData.sync_status = 'success';
            updateData.sync_attempts = (book.sync_attempts || 0) + 1;
            
            const { error: updateError } = await supabase
              .from('books')
              .update(updateData)
              .eq('id', book.id);
            
            if (updateError) {
              throw updateError;
            }
            
            totalUpdated++;
            
            return {
              bookId: book.id,
              title: book.title,
              status: 'updated',
              updatedFields: Object.keys(updateData).filter(k => !['updated_at', 'sync_status', 'sync_attempts'].includes(k)),
              googleTitle: googleBook.title,
              confidence: bestMatch.confidence
            };
          } else {
            // No updates needed but sync was successful
            await supabase
              .from('books')
              .update({ sync_status: 'success' })
              .eq('id', book.id);
              
            return {
              bookId: book.id,
              title: book.title,
              status: 'no_updates',
              message: 'No missing fields to update',
              googleTitle: googleBook.title,
              confidence: bestMatch.confidence
            };
          }
        } catch (error: any) {
          // Update status as error
          await supabase
            .from('books')
            .update({ sync_status: 'error' })
            .eq('id', book.id);
            
          return {
            bookId: book.id,
            title: book.title,
            status: 'error',
            message: error.message || 'Failed to sync'
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < books.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${books.length} books, updated ${totalUpdated}`,
      totalProcessed: books.length,
      totalUpdated,
      results
    });
  } catch (error: any) {
    console.error('Batch Google Books sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to batch sync with Google Books' },
      { status: 500 }
    );
  }
}