import { 
  GoogleBooksSearchResponse, 
  GoogleBookVolume, 
  BookSearchParams, 
  SimplifiedBook 
} from './types';

class GoogleBooksClient {
  private baseUrl = 'https://www.googleapis.com/books/v1';
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  }

  /**
   * Build search query from parameters
   */
  private buildQuery(params: BookSearchParams): string {
    const queryParts: string[] = [];

    if (params.query) {
      queryParts.push(params.query);
    }
    if (params.title) {
      queryParts.push(`intitle:"${params.title}"`);
    }
    if (params.author) {
      queryParts.push(`inauthor:"${params.author}"`);
    }
    if (params.isbn) {
      queryParts.push(`isbn:${params.isbn}`);
    }
    if (params.subject) {
      queryParts.push(`subject:"${params.subject}"`);
    }
    if (params.publisher) {
      queryParts.push(`inpublisher:"${params.publisher}"`);
    }

    return queryParts.join('+');
  }

  /**
   * Search for books
   */
  async searchBooks(params: BookSearchParams): Promise<SimplifiedBook[]> {
    try {
      const query = this.buildQuery(params);
      if (!query) {
        throw new Error('At least one search parameter is required');
      }

      const url = new URL(`${this.baseUrl}/volumes`);
      url.searchParams.append('q', query);
      
      // Add optional parameters
      if (params.maxResults) {
        url.searchParams.append('maxResults', Math.min(params.maxResults, 40).toString());
      }
      if (params.startIndex) {
        url.searchParams.append('startIndex', params.startIndex.toString());
      }
      if (params.orderBy) {
        url.searchParams.append('orderBy', params.orderBy);
      }
      if (params.printType) {
        url.searchParams.append('printType', params.printType);
      }
      if (params.filter) {
        url.searchParams.append('filter', params.filter);
      }
      if (params.langRestrict) {
        url.searchParams.append('langRestrict', params.langRestrict);
      }
      if (this.apiKey) {
        url.searchParams.append('key', this.apiKey);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google Books API error: ${response.status} - ${error}`);
      }

      const data: GoogleBooksSearchResponse = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return [];
      }

      return data.items.map(item => this.simplifyBookData(item));
    } catch (error) {
      console.error('Error searching Google Books:', error);
      throw error;
    }
  }

  /**
   * Get book by Google Books ID
   */
  async getBookById(volumeId: string): Promise<SimplifiedBook | null> {
    try {
      const url = new URL(`${this.baseUrl}/volumes/${volumeId}`);
      if (this.apiKey) {
        url.searchParams.append('key', this.apiKey);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Google Books API error: ${response.status}`);
      }

      const data: GoogleBookVolume = await response.json();
      return this.simplifyBookData(data);
    } catch (error) {
      console.error('Error fetching book by ID:', error);
      throw error;
    }
  }

  /**
   * Get book by ISBN
   */
  async getBookByISBN(isbn: string): Promise<SimplifiedBook | null> {
    try {
      const books = await this.searchBooks({ isbn, maxResults: 1 });
      return books.length > 0 ? books[0] : null;
    } catch (error) {
      console.error('Error fetching book by ISBN:', error);
      throw error;
    }
  }

  /**
   * Search books with automatic pagination
   */
  async searchAllBooks(
    params: BookSearchParams, 
    maxTotal: number = 100
  ): Promise<SimplifiedBook[]> {
    const allBooks: SimplifiedBook[] = [];
    const batchSize = 40; // Max allowed by API
    let startIndex = 0;

    while (allBooks.length < maxTotal) {
      const books = await this.searchBooks({
        ...params,
        maxResults: batchSize,
        startIndex
      });

      if (books.length === 0) {
        break;
      }

      allBooks.push(...books);
      startIndex += batchSize;

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return allBooks.slice(0, maxTotal);
  }

  /**
   * Convert Google Books data to simplified format
   */
  private simplifyBookData(volume: GoogleBookVolume): SimplifiedBook {
    const info = volume.volumeInfo;
    
    // Extract ISBN if available
    let isbn: string | undefined;
    if (info.industryIdentifiers) {
      const isbn13 = info.industryIdentifiers.find(id => id.type === 'ISBN_13');
      const isbn10 = info.industryIdentifiers.find(id => id.type === 'ISBN_10');
      isbn = isbn13?.identifier || isbn10?.identifier;
    }

    // Get best available thumbnail
    const thumbnail = info.imageLinks?.extraLarge ||
                     info.imageLinks?.large ||
                     info.imageLinks?.medium ||
                     info.imageLinks?.small ||
                     info.imageLinks?.thumbnail ||
                     info.imageLinks?.smallThumbnail;

    return {
      googleId: volume.id,
      isbn,
      title: info.title,
      subtitle: info.subtitle,
      authors: info.authors || [],
      publisher: info.publisher,
      publishedDate: info.publishedDate,
      description: info.description,
      pageCount: info.pageCount,
      categories: info.categories || [],
      language: info.language,
      thumbnailUrl: thumbnail,
      previewLink: info.previewLink,
      averageRating: info.averageRating,
      ratingsCount: info.ratingsCount
    };
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // Test with a simple query
      await this.searchBooks({ query: 'test', maxResults: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const googleBooksClient = new GoogleBooksClient();

// Export class for testing
export { GoogleBooksClient };