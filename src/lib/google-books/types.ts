export interface GoogleBookVolume {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: 'ISBN_10' | 'ISBN_13' | 'OTHER';
      identifier: string;
    }>;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    maturityRating?: string;
    language?: string;
    previewLink?: string;
    infoLink?: string;
    canonicalVolumeLink?: string;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
  };
  saleInfo?: {
    country?: string;
    saleability?: string;
    isEbook?: boolean;
    listPrice?: {
      amount: number;
      currencyCode: string;
    };
    retailPrice?: {
      amount: number;
      currencyCode: string;
    };
    buyLink?: string;
  };
  accessInfo?: {
    country?: string;
    viewability?: string;
    embeddable?: boolean;
    publicDomain?: boolean;
    textToSpeechPermission?: string;
    epub?: {
      isAvailable: boolean;
      acsTokenLink?: string;
    };
    pdf?: {
      isAvailable: boolean;
      acsTokenLink?: string;
    };
    webReaderLink?: string;
    accessViewStatus?: string;
  };
}

export interface GoogleBooksSearchResponse {
  kind: string;
  totalItems: number;
  items?: GoogleBookVolume[];
}

export interface BookSearchParams {
  query?: string;           // General search query
  title?: string;           // Search by title
  author?: string;          // Search by author
  isbn?: string;            // Search by ISBN
  subject?: string;         // Search by subject/category
  publisher?: string;       // Search by publisher
  maxResults?: number;      // Max results (default 10, max 40)
  startIndex?: number;      // Pagination
  orderBy?: 'relevance' | 'newest';  // Sort order
  printType?: 'all' | 'books' | 'magazines';
  filter?: 'partial' | 'full' | 'free-ebooks' | 'paid-ebooks' | 'ebooks';
  langRestrict?: string;    // Language code (e.g., 'en')
}

export interface SimplifiedBook {
  googleId: string;
  isbn?: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories: string[];
  language?: string;
  thumbnailUrl?: string;
  previewLink?: string;
  averageRating?: number;
  ratingsCount?: number;
}