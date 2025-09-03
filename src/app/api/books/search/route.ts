import { NextRequest, NextResponse } from 'next/server';
import { googleBooksClient } from '@/lib/google-books/client';
import { BookSearchParams } from '@/lib/google-books/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build search parameters from query string
    const params: BookSearchParams = {
      query: searchParams.get('q') || undefined,
      title: searchParams.get('title') || undefined,
      author: searchParams.get('author') || undefined,
      isbn: searchParams.get('isbn') || undefined,
      subject: searchParams.get('subject') || undefined,
      publisher: searchParams.get('publisher') || undefined,
      maxResults: searchParams.get('maxResults') 
        ? parseInt(searchParams.get('maxResults')!) 
        : 10,
      startIndex: searchParams.get('startIndex') 
        ? parseInt(searchParams.get('startIndex')!) 
        : 0,
      orderBy: (searchParams.get('orderBy') as 'relevance' | 'newest') || 'relevance',
      langRestrict: searchParams.get('lang') || undefined,
    };

    // Validate that at least one search parameter is provided
    if (!params.query && !params.title && !params.author && !params.isbn && !params.subject) {
      return NextResponse.json(
        { error: 'At least one search parameter is required' },
        { status: 400 }
      );
    }

    const books = await googleBooksClient.searchBooks(params);

    return NextResponse.json({
      success: true,
      count: books.length,
      books
    });
  } catch (error) {
    console.error('Error searching books:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search books',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get book by ID or ISBN
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isbn } = body;

    if (!id && !isbn) {
      return NextResponse.json(
        { error: 'Either id or isbn is required' },
        { status: 400 }
      );
    }

    let book;
    if (id) {
      book = await googleBooksClient.getBookById(id);
    } else if (isbn) {
      book = await googleBooksClient.getBookByISBN(isbn);
    }

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      book
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch book',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}