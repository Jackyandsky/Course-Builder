export interface GoogleBookInfo {
  id: string;
  title: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  isbn?: string;
  pageCount?: number;
  categories?: string[];
  language?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  averageRating?: number;
  ratingsCount?: number;
}

export interface GoogleBooksSearchResult {
  items: GoogleBookInfo[];
  totalItems: number;
}

class GoogleBooksService {
  private apiKey: string | undefined;
  private baseUrl = 'https://www.googleapis.com/books/v1/volumes';

  constructor() {
    // API key will be passed from the API endpoint which has access to process.env
    this.apiKey = undefined;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  /**
   * Search for books by title and optional author
   */
  async searchBooks(
    title: string, 
    author?: string,
    maxResults: number = 5
  ): Promise<GoogleBooksSearchResult> {
    if (!this.apiKey) {
      throw new Error('Google Books API key not set');
    }

    // Build search query
    let query = `intitle:${encodeURIComponent(title)}`;
    if (author && author !== 'nan' && author !== 'null') {
      query += `+inauthor:${encodeURIComponent(author)}`;
    }

    const url = `${this.baseUrl}?q=${query}&maxResults=${maxResults}&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return { items: [], totalItems: 0 };
      }

      // Transform the results to our format
      const items: GoogleBookInfo[] = data.items.map((item: any) => ({
        id: item.id,
        title: item.volumeInfo?.title || '',
        subtitle: item.volumeInfo?.subtitle,
        authors: item.volumeInfo?.authors || [],
        publisher: item.volumeInfo?.publisher,
        publishedDate: item.volumeInfo?.publishedDate,
        description: item.volumeInfo?.description,
        isbn: this.extractISBN(item.volumeInfo?.industryIdentifiers),
        pageCount: item.volumeInfo?.pageCount,
        categories: item.volumeInfo?.categories || [],
        language: item.volumeInfo?.language,
        imageLinks: item.volumeInfo?.imageLinks,
        averageRating: item.volumeInfo?.averageRating,
        ratingsCount: item.volumeInfo?.ratingsCount
      }));

      return {
        items,
        totalItems: data.totalItems || items.length
      };
    } catch (error) {
      console.error('Google Books API error:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific book by Google Books ID
   */
  async getBookById(bookId: string): Promise<GoogleBookInfo | null> {
    if (!this.apiKey) {
      throw new Error('Google Books API key not set');
    }

    const url = `${this.baseUrl}/${bookId}?key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Google Books API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        title: data.volumeInfo?.title || '',
        subtitle: data.volumeInfo?.subtitle,
        authors: data.volumeInfo?.authors || [],
        publisher: data.volumeInfo?.publisher,
        publishedDate: data.volumeInfo?.publishedDate,
        description: data.volumeInfo?.description,
        isbn: this.extractISBN(data.volumeInfo?.industryIdentifiers),
        pageCount: data.volumeInfo?.pageCount,
        categories: data.volumeInfo?.categories || [],
        language: data.volumeInfo?.language,
        imageLinks: data.volumeInfo?.imageLinks,
        averageRating: data.volumeInfo?.averageRating,
        ratingsCount: data.volumeInfo?.ratingsCount
      };
    } catch (error) {
      console.error('Google Books API error:', error);
      throw error;
    }
  }

  /**
   * Extract ISBN from industry identifiers
   */
  private extractISBN(identifiers?: any[]): string | undefined {
    if (!identifiers) return undefined;
    
    // Prefer ISBN_13 over ISBN_10
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13');
    if (isbn13) return isbn13.identifier;
    
    const isbn10 = identifiers.find(id => id.type === 'ISBN_10');
    if (isbn10) return isbn10.identifier;
    
    return undefined;
  }

  /**
   * Calculate similarity between two strings (for matching)
   */
  calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1.0;
    
    // Simple word matching
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    
    let matches = 0;
    for (const word1 of words1) {
      if (words2.includes(word1)) {
        matches++;
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }

  /**
   * Find best match from search results
   */
  findBestMatch(
    searchResults: GoogleBookInfo[], 
    originalTitle: string,
    originalAuthor?: string
  ): { book: GoogleBookInfo; confidence: number } | null {
    if (searchResults.length === 0) return null;
    
    let bestMatch = searchResults[0];
    let bestScore = 0;
    
    for (const book of searchResults) {
      let score = this.calculateSimilarity(book.title, originalTitle);
      
      // Boost score if author matches
      if (originalAuthor && book.authors && book.authors.length > 0) {
        const authorMatch = book.authors.some(author => 
          this.calculateSimilarity(author, originalAuthor) > 0.7
        );
        if (authorMatch) {
          score += 0.2;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = book;
      }
    }
    
    return {
      book: bestMatch,
      confidence: Math.min(bestScore, 1.0)
    };
  }
}

export const googleBooksService = new GoogleBooksService();