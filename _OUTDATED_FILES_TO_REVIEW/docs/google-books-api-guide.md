# Google Books API Integration Guide

## Overview

The Google Books API allows you to search and retrieve information about books from Google's extensive database. This includes metadata like title, authors, ISBN, description, cover images, and more.

## API Features

### Free Tier Limits
- **Without API Key**: 1,000 requests per day
- **With API Key**: 1,000 requests per day (but with better tracking)
- **No cost** for basic usage
- **Rate Limit**: ~100 requests per 100 seconds

## Setup Instructions

### 1. Get Your API Key (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Library**
4. Search for "Books API" and enable it
5. Go to **APIs & Services** → **Credentials**
6. Click **Create Credentials** → **API Key**
7. Copy your API key
8. (Optional) Restrict the key:
   - Click on the key to edit
   - Under **API restrictions**, select "Restrict key"
   - Select "Books API" from the list
   - Save

### 2. Add to Environment Variables

```env
# .env.local
GOOGLE_BOOKS_API_KEY=your_api_key_here
```

## Usage Examples

### Search Books

```typescript
// Search by title
const response = await fetch('/api/books/search?title=Harry Potter');
const { books } = await response.json();

// Search by author
const response = await fetch('/api/books/search?author=J.K. Rowling');

// Search by ISBN
const response = await fetch('/api/books/search?isbn=9780439708180');

// Combined search
const response = await fetch('/api/books/search?title=Harry&author=Rowling&maxResults=5');

// General search
const response = await fetch('/api/books/search?q=javascript programming');
```

### Get Specific Book

```typescript
// By Google Books ID
const response = await fetch('/api/books/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 'zyTCAlFPjgYC' })
});

// By ISBN
const response = await fetch('/api/books/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ isbn: '9780439708180' })
});
```

## API Response Format

### Search Response
```json
{
  "success": true,
  "count": 10,
  "books": [
    {
      "googleId": "zyTCAlFPjgYC",
      "isbn": "9780439708180",
      "title": "Harry Potter and the Sorcerer's Stone",
      "subtitle": "",
      "authors": ["J.K. Rowling"],
      "publisher": "Pottermore Publishing",
      "publishedDate": "2015-12-08",
      "description": "The first book in the Harry Potter series...",
      "pageCount": 309,
      "categories": ["Juvenile Fiction"],
      "language": "en",
      "thumbnailUrl": "https://books.google.com/books/content?id=...",
      "previewLink": "https://books.google.com/books?id=...",
      "averageRating": 4.5,
      "ratingsCount": 3289
    }
  ]
}
```

## Search Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `q` | string | General search query | `q=harry potter` |
| `title` | string | Search by title | `title=The Great Gatsby` |
| `author` | string | Search by author | `author=F. Scott Fitzgerald` |
| `isbn` | string | Search by ISBN | `isbn=9780743273565` |
| `subject` | string | Search by subject/category | `subject=fiction` |
| `publisher` | string | Search by publisher | `publisher=Penguin` |
| `maxResults` | number | Max results (1-40) | `maxResults=20` |
| `startIndex` | number | Pagination offset | `startIndex=10` |
| `orderBy` | string | Sort order: relevance, newest | `orderBy=newest` |
| `lang` | string | Language restriction | `lang=en` |

## Integration in Course Builder

### Use Cases

1. **Import Book Information**
   - Search for books by ISBN or title
   - Auto-fill book details in the admin panel
   - Import cover images and descriptions

2. **Reading Lists**
   - Create curated reading lists for courses
   - Display book covers and information
   - Link to Google Books preview

3. **Library Integration**
   - Build a searchable book database
   - Track recommended readings
   - Show availability and ratings

### Example: Book Import Component

```typescript
import { useState } from 'react';
import { SimplifiedBook } from '@/lib/google-books/types';

function BookImporter() {
  const [isbn, setIsbn] = useState('');
  const [book, setBook] = useState<SimplifiedBook | null>(null);
  const [loading, setLoading] = useState(false);

  const searchBook = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/books/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbn })
      });
      
      const data = await response.json();
      if (data.success) {
        setBook(data.book);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={isbn}
        onChange={(e) => setIsbn(e.target.value)}
        placeholder="Enter ISBN"
      />
      <button onClick={searchBook} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      {book && (
        <div>
          <h3>{book.title}</h3>
          <p>Authors: {book.authors.join(', ')}</p>
          <p>Publisher: {book.publisher}</p>
          <p>Pages: {book.pageCount}</p>
          {book.thumbnailUrl && (
            <img src={book.thumbnailUrl} alt={book.title} />
          )}
        </div>
      )}
    </div>
  );
}
```

## Best Practices

### 1. Caching
- Cache search results to reduce API calls
- Store book data in your database after import
- Use stale-while-revalidate strategy

### 2. Error Handling
```typescript
try {
  const books = await googleBooksClient.searchBooks({ isbn });
  if (books.length === 0) {
    // Handle no results
    console.log('No books found');
  }
} catch (error) {
  if (error.message.includes('429')) {
    // Rate limit exceeded
    console.log('Too many requests. Please wait.');
  } else if (error.message.includes('403')) {
    // API key issue
    console.log('Invalid API key');
  }
}
```

### 3. Rate Limiting
- Implement client-side debouncing for search
- Add server-side rate limiting
- Use pagination for large result sets

### 4. Data Validation
- Not all books have complete data
- Always check for undefined fields
- Provide fallback values

## Common Issues & Solutions

### Issue: No API Key
**Solution**: The API works without a key but with stricter limits. Add a key for production.

### Issue: CORS Errors
**Solution**: Always call Google Books API from your backend, not directly from the browser.

### Issue: Missing Book Covers
**Solution**: Some books don't have cover images. Use a placeholder image as fallback.

### Issue: Rate Limit Exceeded
**Solution**: 
- Add delays between requests
- Cache results
- Use batch operations wisely

## Advanced Features

### 1. Batch Import
```typescript
const isbns = ['9780439708180', '9780439064873', '9780439136365'];
const books = [];

for (const isbn of isbns) {
  const book = await googleBooksClient.getBookByISBN(isbn);
  if (book) books.push(book);
  
  // Rate limiting
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

### 2. Full-Text Search
```typescript
// Search within book content (if available)
const results = await googleBooksClient.searchBooks({
  query: 'specific phrase in book',
  filter: 'partial' // Books with preview available
});
```

### 3. Language-Specific Search
```typescript
// Search for Spanish books about cooking
const books = await googleBooksClient.searchBooks({
  query: 'cocina',
  langRestrict: 'es',
  subject: 'Cooking'
});
```

## Testing the Integration

### Test URLs
```bash
# Search by title
curl "http://localhost:3000/api/books/search?title=Harry%20Potter"

# Search by ISBN
curl "http://localhost:3000/api/books/search?isbn=9780439708180"

# Get specific book
curl -X POST "http://localhost:3000/api/books/search" \
  -H "Content-Type: application/json" \
  -d '{"isbn": "9780439708180"}'
```

## Security Considerations

1. **API Key Protection**
   - Never expose API key in client-side code
   - Use environment variables
   - Restrict key to specific APIs and domains

2. **Rate Limiting**
   - Implement server-side rate limiting
   - Track usage per user/IP
   - Return appropriate error messages

3. **Data Sanitization**
   - Sanitize book descriptions before displaying
   - Validate ISBN format
   - Escape special characters in search queries

## Useful Links

- [Google Books API Documentation](https://developers.google.com/books/docs/v1/using)
- [API Explorer](https://developers.google.com/books/docs/v1/reference/volumes/list)
- [Search Query Parameters](https://developers.google.com/books/docs/v1/using#query-params)
- [API Quotas & Limits](https://developers.google.com/books/docs/v1/using#quota)