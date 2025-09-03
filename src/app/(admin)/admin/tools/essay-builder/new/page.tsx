'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  ClipboardDocumentIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Book {
  id: string;
  title: string;
  author: string;
}

// Searchable Book Selector Component
const SearchableBookSelector = ({ 
  books, 
  selectedBook, 
  onChange, 
  placeholder,
  required = false
}: {
  books: Book[];
  selectedBook: string;
  onChange: (bookId: string) => void;
  placeholder: string;
  required?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search books when query changes
  useEffect(() => {
    const searchBooks = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/books?search=${encodeURIComponent(searchQuery)}&limit=50`);
        if (response.ok) {
          const results = await response.json();
          setSearchResults(results || []);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timer = setTimeout(searchBooks, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use search results when searching, otherwise show all books
  const filteredBooks = searchQuery.trim() ? searchResults : books;

  // Get selected book details from both books and search results
  const allAvailableBooks = [...books, ...searchResults];
  const selectedBookDetails = allAvailableBooks.find((book, index, self) => 
    book.id === selectedBook && 
    self.findIndex(b => b.id === book.id) === index // Remove duplicates
  );

  return (
    <div className="relative">
      <div 
        className="min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1">
          {!selectedBook ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            <div className="text-sm">
              <div className="font-medium">{selectedBookDetails?.title}</div>
              {selectedBookDetails?.author && (
                <div className="text-gray-500">{selectedBookDetails.author}</div>
              )}
            </div>
          )}
        </div>
        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-9 pr-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredBooks.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">No books found</div>
            ) : (
              filteredBooks.map(book => (
                <div
                  key={book.id}
                  className={`px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                    selectedBook === book.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(book.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="text-sm font-medium">{book.title}</div>
                  {book.author && (
                    <div className="text-xs text-gray-500">{book.author}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface Sentence {
  function: string;
  text: string;
}

interface Paragraph {
  type: string;
  sentences: Sentence[];
}

const paragraphTypes = [
  { type: 'introduction', label: 'Introduction', position: 1 },
  { type: 'body1', label: 'Body Paragraph 1', position: 2 },
  { type: 'body2', label: 'Body Paragraph 2', position: 3 },
  { type: 'body3', label: 'Body Paragraph 3', position: 4 },
  { type: 'conclusion', label: 'Conclusion', position: 5 }
];

const getSentenceFunction = (paragraphType: string, sentenceNum: number): string => {
  if (paragraphType === 'introduction') {
    switch(sentenceNum) {
      case 1: return 'hook';
      case 2: return 'lead-in';
      case 3: return 'thesis';
      case 4: return 'elaboration';
      case 5: return 'roadmap';
      default: return '';
    }
  } else if (paragraphType === 'conclusion') {
    switch(sentenceNum) {
      case 1: return 'restatement';
      case 2: return 'summary';
      case 3: return 'closing';
      case 4: return 'universality';
      case 5: return 'resonance';
      default: return '';
    }
  } else {
    // Body paragraphs
    switch(sentenceNum) {
      case 1: return 'topic';
      case 2: return 'evidence';
      case 3: return 'interpretation';
      case 4: return 'transition';
      case 5: return 'implication';
      default: return '';
    }
  }
};

const getSentenceLabel = (func: string): string => {
  const labels: { [key: string]: string } = {
    'hook': 'Hook',
    'lead-in': 'Lead-in',
    'thesis': 'Thesis',
    'elaboration': 'Elaboration',
    'roadmap': 'Roadmap',
    'topic': 'Topic Sentence',
    'evidence': 'Evidence/Quote',
    'interpretation': 'Interpretation',
    'transition': 'Transition',
    'implication': 'Implication',
    'restatement': 'Restatement',
    'summary': 'Summary',
    'closing': 'Closing Thought',
    'universality': 'Universality',
    'resonance': 'Resonance'
  };
  return labels[func] || func;
};

export default function NewEssayPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'paste'>('manual');
  
  // Form data
  const [title, setTitle] = useState('');
  const [bookId, setBookId] = useState('');
  const [thesisStatement, setThesisStatement] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  
  // Paste & Format data
  const [pastedContent, setPastedContent] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  // Load books on mount
  useEffect(() => {
    loadBooks();
    initializeParagraphs();
  }, []);

  const loadBooks = async () => {
    try {
      const response = await fetch('/api/books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  };

  const initializeParagraphs = () => {
    const initialParagraphs: Paragraph[] = paragraphTypes.map(pt => ({
      type: pt.type,
      sentences: Array(5).fill(null).map((_, index) => ({
        function: getSentenceFunction(pt.type, index + 1),
        text: ''
      }))
    }));
    setParagraphs(initialParagraphs);
  };

  const updateSentence = (paragraphIndex: number, sentenceIndex: number, text: string) => {
    const updatedParagraphs = [...paragraphs];
    updatedParagraphs[paragraphIndex].sentences[sentenceIndex].text = text;
    setParagraphs(updatedParagraphs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get selected book details
      const selectedBook = books.find(b => b.id === bookId);
      
      const essayData = {
        title,
        book_id: bookId,
        book_title: selectedBook?.title || '',
        book_author: selectedBook?.author || '',
        thesis_statement: thesisStatement,
        difficulty_level: 'intermediate', // Default to intermediate
        is_published: isPublished,
        paragraphs: paragraphs.map((p, pIndex) => ({
          type: p.type,
          content: p.sentences.map(s => s.text).join(' '),
          metadata: {},
          sentences: p.sentences.map((s, sIndex) => ({
            function: s.function,
            text: s.text,
            metadata: {}
          }))
        }))
      };

      const response = await fetch('/api/essays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(essayData)
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/tools/essay-builder');
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create essay');
      }
    } catch (error) {
      console.error('Error creating essay:', error);
      setError('An error occurred while creating the essay');
    } finally {
      setLoading(false);
    }
  };

  const countWords = () => {
    return paragraphs.reduce((total, p) => {
      return total + p.sentences.reduce((pTotal, s) => {
        return pTotal + (s.text ? s.text.split(' ').filter(w => w).length : 0);
      }, 0);
    }, 0);
  };

  const countCompletedSentences = () => {
    return paragraphs.reduce((total, p) => {
      return total + p.sentences.filter(s => s.text.trim()).length;
    }, 0);
  };

  // Enhanced sentence splitting with quote handling
  const splitSentencesWithQuotes = (text: string): string[] => {
    const sentences: string[] = [];
    let currentSentence = '';
    let inQuote = false;
    let quoteChar = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      const prevChar = text[i - 1];
      
      currentSentence += char;
      
      // Track quote state - be more careful about apostrophes
      if ((char === '"' || char === '"' || char === '"') && !inQuote) {
        // Only treat as opening quote if it's actual quote marks, not apostrophes
        inQuote = true;
        quoteChar = char;
      } else if ((char === "'" && !inQuote && prevChar === ' ')) {
        // Only treat single quote as opening if it's preceded by space
        inQuote = true;
        quoteChar = char;
      } else if ((char === '"' || char === '"' || char === '"') && inQuote) {
        inQuote = false;
        
        // Rule 1: If we encounter a close quote, look for sentence ending
        // Check if there's a period immediately after the quote
        if (i + 1 < text.length && text[i + 1] === '.') {
          currentSentence += '.';
          i++; // Skip the period since we added it
          
          // Complete the sentence if followed by space and capital letter OR end of text
          if ((i + 1 < text.length && text[i + 1] === ' ' && 
              i + 2 < text.length && text[i + 2].match(/[A-Z]/)) || 
              i === text.length - 1) {
            sentences.push(currentSentence.trim());
            currentSentence = '';
          }
        }
        // Also check if we should end sentence right after the closing quote
        // if followed by space and capital letter
        else if (i + 1 < text.length && text[i + 1] === ' ' && 
                 i + 2 < text.length && text[i + 2].match(/[A-Z]/)) {
          sentences.push(currentSentence.trim());
          currentSentence = '';
        }
        // Or if this is the end of the text
        else if (i === text.length - 1) {
          sentences.push(currentSentence.trim());
          currentSentence = '';
        }
        
        quoteChar = '';
      } else if (char === "'" && inQuote && quoteChar === "'") {
        // Handle closing single quote
        inQuote = false;
        quoteChar = '';
      }
      
      // Normal sentence ending (when not in quotes)
      if (!inQuote && (char === '.' || char === '!' || char === '?')) {
        // Look ahead to see if this is really a sentence ending
        if (nextChar === ' ' || nextChar === '\n' || nextChar === undefined) {
          const lookahead = text.substring(i + 1, i + 4);
          if (lookahead.match(/^\s*[A-Z]/) || i === text.length - 1) {
            sentences.push(currentSentence.trim());
            currentSentence = '';
          }
        }
      }
    }
    
    // Add any remaining content
    if (currentSentence.trim()) {
      sentences.push(currentSentence.trim());
    }
    
    // If we don't have enough sentences, fall back to more comprehensive splitting
    if (sentences.length < 3) {
      // Try multiple splitting patterns to catch edge cases
      let simpleSentences = text.split(/(?<=[.!?]["'""]?)\s+(?=[A-Z])/);
      
      // If still not enough sentences, try semicolon splitting for complex sentences
      if (simpleSentences.length < 4) {
        const enhancedSentences: string[] = [];
        
        simpleSentences.forEach(sentence => {
          // Split on semicolons followed by space and capital letter or specific transition words
          const parts = sentence.split(/;\s+(?=(?:firstly|secondly|thirdly|finally|however|thus|therefore|moreover|furthermore|consequently|similarly|ultimately|[A-Z]))/);
          
          if (parts.length > 1) {
            // If we split on semicolons, add periods to the parts that need them
            parts.forEach((part, index) => {
              part = part.trim();
              if (part && index < parts.length - 1 && !part.match(/[.!?]$/)) {
                part += '.';
              }
              if (part) enhancedSentences.push(part);
            });
          } else {
            // No semicolon split, keep the original sentence
            if (sentence.trim()) enhancedSentences.push(sentence.trim());
          }
        });
        
        simpleSentences = enhancedSentences;
      }
      
      // If still not enough, try even more aggressive splitting
      if (simpleSentences.length < 4) {
        simpleSentences = text.split(/(?<=[.!?])\s*["'""]?\s*(?=[A-Z])/);
      }
      
      // Apply 3-5 rule for sentence count
      const filteredSentences = simpleSentences.filter(s => s.trim().length > 3);
      return apply3To5Rule(filteredSentences);
      
      return filteredSentences;
    }
    
    return sentences.filter(s => s.length > 3);
  };

  // Apply 3-5 rule: Allow 3-5 sentences per paragraph
  // If more than 5, combine extras into the 5th sentence
  const apply3To5Rule = (sentences: string[]): string[] => {
    // If we have 3-5 sentences, that's perfect - return as is
    if (sentences.length >= 3 && sentences.length <= 5) {
      return sentences;
    }
    
    // If we have more than 5 sentences, apply the 4+n rule
    if (sentences.length > 5) {
      // Take first 4 sentences and combine remaining into 5th
      const result = sentences.slice(0, 4);
      const remaining = sentences.slice(4);
      
      // Join remaining sentences with proper spacing
      // Remove duplicate periods at join points
      const combined = remaining.join(' ').replace(/\.\s*\./g, '.');
      result.push(combined);
      
      return result;
    }
    
    // If we have less than 3 sentences, return what we have
    return sentences;
  };

  const parseEssayContent = () => {
    setParseErrors([]);
    const errors: string[] = [];
    
    // STEP 1: Clean up the content - normalize whitespace and line breaks
    let cleanedContent = pastedContent
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\/\//g, '') // Remove // markers if any
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines to double newlines
      .trim();
    
    if (!cleanedContent) {
      errors.push('No content to parse');
      setParseErrors(errors);
      return;
    }

    // STEP 2: CRITICAL - Get paragraph splitting right FIRST
    const newParagraphs: Paragraph[] = [];
    let paragraphTexts: string[] = [];
    
    // Priority 1: Try double newline separation (most reliable)
    let doubleNewlineParagraphs = cleanedContent.split(/\n\n+/).filter(p => p.trim());
    
    // If we don't get exactly 5 paragraphs, try to detect paragraph breaks more intelligently
    if (doubleNewlineParagraphs.length !== 5) {
      // Try to identify paragraphs by looking for lines that start with capital letters
      // after a line that ends with a period
      const lines = cleanedContent.split(/\n/).filter(p => p.trim());
      const paragraphStarts = [0]; // First line is always a paragraph start
      
      // Enhanced paragraph detection - look for strong paragraph indicators
      for (let i = 1; i < lines.length; i++) {
        const prevLine = lines[i - 1].trim();
        const currentLine = lines[i].trim();
        const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
        
        // Strong indicators of new paragraph starts:
        // 1. Previous line ends with punctuation AND current starts with transition/topic word
        // 2. Gap in content (empty line was removed but pattern remains)
        // 3. Clear topic shift indicators
        
        // Check for paragraph ending followed by new paragraph start
        if (prevLine.match(/[.!?]["'""]?$/)) {
          // Body paragraph starters (paragraphs 2, 3, 4)
          if (currentLine.match(/^(Firstly|First|Secondly|Second|Thirdly|Third|Furthermore|Moreover|Additionally|Next|Another|Similarly|Likewise|Also|In addition)/i)) {
            paragraphStarts.push(i);
          }
          // Conclusion starters (paragraph 5)
          else if (currentLine.match(/^(In conclusion|To conclude|In summary|Overall|Ultimately|Finally|Therefore|Thus|Hence|In essence|All in all)/i)) {
            paragraphStarts.push(i);
          }
          // Common essay paragraph starters
          else if (currentLine.match(/^(The author|The novel|The story|The book|The text|The passage|The writer|Through|By|With|This)/i) && 
                   prevLine.length > 80) {
            // Likely new paragraph if previous was long
            paragraphStarts.push(i);
          }
        }
      }
      
      // If we found reasonable paragraph breaks, use them
      if (paragraphStarts.length >= 4 && paragraphStarts.length <= 5) {
        // Ensure we have exactly 5 paragraphs
        if (paragraphStarts.length === 4) {
          // We have 4 starts, which means 4 paragraphs detected
          // Need to find one more break or treat the rest as conclusion
          
          // Look for the conclusion more carefully
          let conclusionStart = -1;
          for (let i = Math.floor(lines.length * 0.7); i < lines.length; i++) {
            if (lines[i].trim().match(/^(In conclusion|To conclude|In summary|Overall|Ultimately|Finally|Therefore|Thus)/i)) {
              conclusionStart = i;
              break;
            }
          }
          
          if (conclusionStart > 0 && !paragraphStarts.includes(conclusionStart)) {
            paragraphStarts.push(conclusionStart);
            paragraphStarts.sort((a, b) => a - b);
          }
        }
        
        paragraphStarts.push(lines.length); // Add end marker
        doubleNewlineParagraphs = [];
        
        // Build paragraphs from the detected starts
        for (let i = 0; i < Math.min(paragraphStarts.length - 1, 5); i++) {
          const start = paragraphStarts[i];
          const end = paragraphStarts[i + 1];
          const paragraphLines = lines.slice(start, end);
          doubleNewlineParagraphs.push(paragraphLines.join(' ').trim());
        }
      }
    }
    
    // CRITICAL: Ensure we have exactly 5 paragraphs
    if (doubleNewlineParagraphs.length === 5) {
      // Perfect - we have 5 paragraphs separated by blank lines
      // Each paragraph maintains its unity
      paragraphTexts = doubleNewlineParagraphs.map(para => {
        // Normalize line breaks within each paragraph to preserve sentence flow
        return para.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
      });
    } else if (doubleNewlineParagraphs.length > 5) {
      // Too many paragraphs - take first 5 to maintain structure
      paragraphTexts = doubleNewlineParagraphs.slice(0, 5).map(para => {
        return para.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
      });
      errors.push(`Found ${doubleNewlineParagraphs.length} paragraphs, using first 5.`);
    } else {
      // Not enough paragraphs from double newlines
      // Check if single newlines give us exactly 5
      const lines = cleanedContent.split(/\n/).filter(p => p.trim());
      
      if (lines.length === 5) {
        // Perfect - exactly 5 lines means 5 paragraphs
        // Each line is treated as a complete paragraph
        paragraphTexts = lines.map(line => line.trim());
      } else {
        // Smart line joining - preserve sentence boundaries
        // Join lines but be careful about sentence endings
        let smartJoinedText = '';
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // If the line ends with sentence punctuation, add it and a space
          if (line.match(/[.!?]["'""]?$/)) {
            smartJoinedText += line + ' ';
          }
          // CRITICAL FIX: Don't add periods after commas, colons, or semicolons
          else if (line.match(/[,:;]$/)) {
            // Line ends with comma, colon, or semicolon - just add space
            smartJoinedText += line + ' ';
          }
          // If the line doesn't end with punctuation and there's a next line,
          // join without adding extra space if the next line starts lowercase
          else if (i < lines.length - 1 && lines[i + 1].trim()) {
            const nextLine = lines[i + 1].trim();
            // If next line starts with lowercase, it's likely a continuation
            if (nextLine.match(/^[a-z]/)) {
              smartJoinedText += line + ' ';
            } else {
              // Next line starts with capital, so this line likely ends a sentence
              // BUT only add a period if it doesn't end with punctuation already
              smartJoinedText += line + '. ';
            }
          } else {
            smartJoinedText += line + ' ';
          }
        }
        
        const fullText = smartJoinedText.trim();
        
        // Protect abbreviations from sentence splitting
        const protectedText = fullText
          .replace(/\bMr\./g, 'Mr§')
          .replace(/\bMrs\./g, 'Mrs§')
          .replace(/\bMs\./g, 'Ms§')
          .replace(/\bDr\./g, 'Dr§')
          .replace(/\bProf\./g, 'Prof§')
          .replace(/\bSr\./g, 'Sr§')
          .replace(/\bJr\./g, 'Jr§')
          .replace(/\bvs\./g, 'vs§')
          .replace(/\bi\.e\./g, 'i§e§')
          .replace(/\be\.g\./g, 'e§g§')
          .replace(/\betc\./g, 'etc§')
          .replace(/\bU\.S\./g, 'U§S§')
          .replace(/\bU\.K\./g, 'U§K§')
          .replace(/\bPh\.D\./g, 'Ph§D§')
          .replace(/\bM\.D\./g, 'M§D§')
          .replace(/\bB\.A\./g, 'B§A§')
          .replace(/\bM\.A\./g, 'M§A§');
        
        // Enhanced sentence splitting with quote handling
        const allSentences = splitSentencesWithQuotes(protectedText);
        
        // Restore abbreviations
        const cleanSentences = allSentences.map(s => s.replace(/§/g, '.').trim());
        
        // Now distribute sentences into 5 paragraphs
        if (cleanSentences.length >= 25) {
          // We have at least 25 sentences - perfect for 5x5
          // Store the sentences in a special format so we know not to re-split them
          paragraphTexts = [
            `__PRESPLIT__${JSON.stringify(cleanSentences.slice(0, 5))}`,
            `__PRESPLIT__${JSON.stringify(cleanSentences.slice(5, 10))}`,
            `__PRESPLIT__${JSON.stringify(cleanSentences.slice(10, 15))}`,
            `__PRESPLIT__${JSON.stringify(cleanSentences.slice(15, 20))}`,
            `__PRESPLIT__${JSON.stringify(cleanSentences.slice(20, 25))}`
          ];
        } else if (cleanSentences.length >= 20) {
          // We have at least 20 sentences - distribute as evenly as possible
          const targetSize = 5; // Always try for 5 sentences per paragraph
          paragraphTexts = [];
          for (let i = 0; i < 5; i++) {
            const start = i * targetSize;
            const end = Math.min((i + 1) * targetSize, cleanSentences.length);
            if (start < cleanSentences.length) {
              const sentences = cleanSentences.slice(start, end);
              // Pad with empty if needed
              while (sentences.length < 5) {
                sentences.push('');
              }
              paragraphTexts.push(`__PRESPLIT__${JSON.stringify(sentences)}`);
            } else {
              paragraphTexts.push(`__PRESPLIT__${JSON.stringify(['', '', '', '', ''])}`);
            }
          }
        } else {
          // Not enough sentences - try to split the text more aggressively
          // Look for any period followed by a capital letter
          const aggressiveSentences = fullText.split(/(?<=[.!?])\s+(?=[A-Z])/);
          
          if (aggressiveSentences.length >= 15) {
            // Distribute whatever we have
            const perPara = Math.ceil(aggressiveSentences.length / 5);
            paragraphTexts = [];
            for (let i = 0; i < 5; i++) {
              const start = i * perPara;
              const end = Math.min((i + 1) * perPara, aggressiveSentences.length);
              if (start < aggressiveSentences.length) {
                paragraphTexts.push(aggressiveSentences.slice(start, end).join(' '));
              } else {
                paragraphTexts.push('');
              }
            }
          } else {
            // Last resort - just split the text into 5 equal parts
            const chunkSize = Math.ceil(fullText.length / 5);
            paragraphTexts = [];
            for (let i = 0; i < 5; i++) {
              const start = i * chunkSize;
              const end = Math.min((i + 1) * chunkSize, fullText.length);
              paragraphTexts.push(fullText.slice(start, end).trim());
            }
          }
        }
      }
    }
    
    // Now process the paragraph texts
    if (paragraphTexts.length !== 5) {
      errors.push(`Found ${paragraphTexts.length} paragraphs. The system will attempt to restructure into 5 paragraphs.`);
      // Ensure we have exactly 5 paragraphs
      while (paragraphTexts.length < 5) {
        paragraphTexts.push('');
      }
      paragraphTexts = paragraphTexts.slice(0, 5);
    }
    
    // STEP 3: Process each paragraph INDEPENDENTLY to maintain unity
    // CRITICAL PRINCIPLE: Sentences from one paragraph must NEVER mix with another
    paragraphTexts.forEach((paragraphText, pIndex) => {
      const paragraphType = paragraphTypes[pIndex].type;
      
      // Check if this paragraph was pre-split (we already have the sentences)
      if (paragraphText.startsWith('__PRESPLIT__')) {
        try {
          const sentences = JSON.parse(paragraphText.replace('__PRESPLIT__', ''));
          
          // Apply 3-5 rule to each paragraph
          const processedSentences = apply3To5Rule(sentences);
          
          const paragraph: Paragraph = {
            type: paragraphType,
            sentences: processedSentences.slice(0, 5).map((sentence: string, sIndex: number) => ({
              function: getSentenceFunction(paragraphType, sIndex + 1),
              text: (sentence || '').trim()
            }))
          };
          
          // Ensure we have exactly 5 sentences
          while (paragraph.sentences.length < 5) {
            paragraph.sentences.push({
              function: getSentenceFunction(paragraphType, paragraph.sentences.length + 1),
              text: ''
            });
          }
          
          newParagraphs.push(paragraph);
          return;
        } catch (e) {
          // Fall through to regular processing if JSON parse fails
          paragraphText = paragraphText.replace('__PRESPLIT__', '');
        }
      }
      
      // Regular processing for non-presplit paragraphs
      // First normalize line breaks to preserve sentence boundaries
      const cleanText = paragraphText
        .replace(/\n+/g, ' ') // Replace line breaks with spaces
        .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
        .trim();
      
      if (!cleanText) {
        // Empty paragraph
        const paragraph: Paragraph = {
          type: paragraphType,
          sentences: Array(5).fill(null).map((_, sIndex) => ({
            function: getSentenceFunction(paragraphType, sIndex + 1),
            text: ''
          }))
        };
        newParagraphs.push(paragraph);
        return;
      }
      
      // Protect common abbreviations
      let protectedText = cleanText
        .replace(/\bMr\./g, 'Mr§')
        .replace(/\bMrs\./g, 'Mrs§')
        .replace(/\bMs\./g, 'Ms§')
        .replace(/\bDr\./g, 'Dr§')
        .replace(/\bProf\./g, 'Prof§')
        .replace(/\bSr\./g, 'Sr§')
        .replace(/\bJr\./g, 'Jr§')
        .replace(/\bvs\./g, 'vs§')
        .replace(/\bi\.e\./g, 'i§e§')
        .replace(/\be\.g\./g, 'e§g§')
        .replace(/\betc\./g, 'etc§')
        .replace(/\bU\.S\./g, 'U§S§')
        .replace(/\bU\.K\./g, 'U§K§')
        .replace(/\bPh\.D\./g, 'Ph§D§')
        .replace(/\bM\.D\./g, 'M§D§')
        .replace(/\bB\.A\./g, 'B§A§')
        .replace(/\bM\.A\./g, 'M§A§');
      
      // IMPORTANT: Split into sentences WITHIN this paragraph only
      // This ensures paragraph unity - sentences stay in their original paragraph
      let rawSentences = splitSentencesWithQuotes(protectedText);
      
      // Restore protected abbreviations and clean up
      let sentences = rawSentences.map(s => 
        s.replace(/§/g, '.').trim()
      ).filter(s => s.length > 3); // Filter out very short fragments
      
      // If we have fewer than 5 sentences, try more aggressive splitting
      if (sentences.length < 5) {
        // First, check if we might have missed sentence boundaries
        // This can happen when "." appears mid-line
        const reSplit: string[] = [];
        sentences.forEach(sentence => {
          // Check for multiple sentences within what we thought was one sentence
          const internalSplit = sentence.split(/(?<=[.!?])\s+(?=[A-Z])/);
          if (internalSplit.length > 1) {
            reSplit.push(...internalSplit);
          } else {
            reSplit.push(sentence);
          }
        });
        sentences = reSplit;
        
        // If still not enough, try splitting on semicolons
        if (sentences.length < 5) {
          const enhancedSentences: string[] = [];
          sentences.forEach(sentence => {
            // Check if this sentence has semicolons that might be separating independent clauses
            if (sentence.includes(';')) {
              const parts = sentence.split(/;\s*/);
              if (parts.length > 1 && sentences.length < 5) {
                // Only split on semicolons if we need more sentences
                parts.forEach((part, idx) => {
                  part = part.trim();
                  // Add period if it doesn't end with punctuation
                  if (part && !part.match(/[.!?]$/)) {
                    part += '.';
                  }
                  if (part) enhancedSentences.push(part);
                });
              } else {
                enhancedSentences.push(sentence);
              }
            } else {
              enhancedSentences.push(sentence);
            }
          });
          sentences = enhancedSentences;
        }
      }
      
      // Apply 3-5 rule: allow 3-5 sentences per paragraph
      if (sentences.length > 5) {
        sentences = apply3To5Rule(sentences);
      } else if (sentences.length === 4) {
        // If we have exactly 4 sentences, we might need to split one of them
        // Check if any sentence is particularly long and might contain multiple thoughts
        const longSentenceIndex = sentences.findIndex(s => s.length > 150);
        if (longSentenceIndex !== -1) {
          const longSentence = sentences[longSentenceIndex];
          // Try to split on conjunctions or transition phrases
          const splitPattern = /,\s*(?:and|but|or|yet|so|for|nor|while|although|however|therefore|thus|hence|consequently|furthermore|moreover)\s+/i;
          const parts = longSentence.split(splitPattern);
          if (parts.length > 1) {
            // Replace the long sentence with its parts
            sentences.splice(longSentenceIndex, 1, ...parts.map(p => {
              p = p.trim();
              if (!p.match(/[.!?]$/)) p += '.';
              return p;
            }));
          }
        }
        // After attempting to split, apply 3-5 rule if needed
        if (sentences.length > 5) {
          sentences = apply3To5Rule(sentences);
        }
      }
      
      // Check if we have 3-5 sentences (acceptable range)
      if (sentences.length > 0 && (sentences.length < 3 || sentences.length > 5)) {
        errors.push(`Paragraph ${pIndex + 1} has ${sentences.length} sentences. Acceptable range is 3-5 sentences.`);
      }
      
      const paragraph: Paragraph = {
        type: paragraphType,
        sentences: sentences.slice(0, 5).map((sentence, sIndex) => ({
          function: getSentenceFunction(paragraphType, sIndex + 1),
          text: sentence.trim().replace(/\s+/g, ' ') // Clean up the sentence
        }))
      };
      
      // Fill in missing sentences if needed
      while (paragraph.sentences.length < 5) {
        paragraph.sentences.push({
          function: getSentenceFunction(paragraphType, paragraph.sentences.length + 1),
          text: ''
        });
      }
      
      newParagraphs.push(paragraph);
    });
    
    // Validate the parsed structure
    if (newParagraphs.length !== 5) {
      errors.push(`Parsed ${newParagraphs.length} paragraphs, expected 5.`);
    }
    
    newParagraphs.forEach((paragraph, index) => {
      const nonEmptySentences = paragraph.sentences.filter(s => s.text.trim()).length;
      if (nonEmptySentences > 0 && nonEmptySentences < 3) {
        errors.push(`Paragraph ${index + 1} has only ${nonEmptySentences} sentences. Minimum is 3 sentences.`);
      }
    });
    
    if (errors.length > 0) {
      setParseErrors(errors);
    } else {
      // Successfully parsed - update the form
      setParagraphs(newParagraphs);
      
      // Try to extract title from first sentence or set a default
      if (!title && newParagraphs[0]?.sentences[0]?.text) {
        const firstSentence = newParagraphs[0].sentences[0].text;
        const extractedTitle = firstSentence.slice(0, 100).replace(/[.!?].*$/, '');
        setTitle(extractedTitle || 'Untitled Essay');
      }
      
      // Try to extract thesis from introduction
      if (!thesisStatement && newParagraphs[0]?.sentences[2]?.text) {
        setThesisStatement(newParagraphs[0].sentences[2].text);
      }
      
      // Switch to manual tab to show the parsed content
      setActiveTab('manual');
      setPastedContent(''); // Clear paste area
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-xl font-semibold">Essay Created Successfully!</h2>
          <p className="mt-2 text-gray-600">Redirecting to essay list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/tools/essay-builder" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Essay List
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Create New Essay</h1>
        <p className="mt-1 text-sm text-gray-600">
          Build a structured 5/5/5 essay manually or paste existing content
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <XCircleIcon className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Information - Shared between tabs */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Essay Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Essay Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter essay title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Book <span className="text-red-500">*</span>
              </label>
              <SearchableBookSelector
                books={books}
                selectedBook={bookId}
                onChange={setBookId}
                placeholder="Select a book..."
                required={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publication Status
              </label>
              <select
                value={isPublished ? 'published' : 'draft'}
                onChange={(e) => setIsPublished(e.target.value === 'published')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Save as Draft</option>
                <option value="published">Publish Immediately</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thesis Statement <span className="text-red-500">*</span>
              </label>
              <textarea
                value={thesisStatement}
                onChange={(e) => setThesisStatement(e.target.value)}
                required
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the main thesis statement..."
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation for Content Input Method */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manual'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PencilSquareIcon className="h-5 w-5 inline-block mr-2" />
              Manual Input
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'paste'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ClipboardDocumentIcon className="h-5 w-5 inline-block mr-2" />
              Paste & Format
            </button>
          </nav>
        </div>

        {/* Paste & Format Tab */}
        {activeTab === 'paste' && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Paste Complete Essay - One-Click 5/5/5 Format</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Paste your entire essay below.</strong> The system will automatically parse it into a 5-paragraph structure with 3-5 sentences per paragraph (minimum 15, maximum 25 total sentences).
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                <p className="font-medium text-blue-900 mb-1">✨ Auto-Format Features:</p>
                <ul className="list-disc list-inside text-blue-800 space-y-1">
                  <li>Automatically splits your essay into 5 paragraphs</li>
                  <li>Identifies and separates sentences (3-5 per paragraph)</li>
                  <li>Accepts paragraphs with as few as 3 sentences</li>
                  <li>Combines excess sentences (6+) into the 5th sentence</li>
                  <li>Assigns proper sentence functions (Hook, Thesis, Topic, Evidence, etc.)</li>
                  <li>Extracts essay title and thesis statement automatically</li>
                </ul>
              </div>
            </div>

            <textarea
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Paste your complete essay here...

The system accepts essays in any of these formats:

Format 1 - Paragraphs separated by blank lines:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your introduction paragraph here. It should contain 3-5 sentences. Each sentence will be automatically detected. The system will identify the thesis statement. It will also extract the hook and roadmap if present.

Your first body paragraph goes here. Aim for 3-5 sentences. The topic sentence will be identified. Supporting evidence will be parsed. The transition to the next paragraph will be marked if included.

Your second body paragraph continues the argument. Include your evidence and analysis. Make connections to your thesis. Additional development sentences are optional.

Your third body paragraph provides additional support. Continue building your argument. Add more evidence and examples. Further analysis can be included if needed.

Your conclusion paragraph wraps up the essay. Restate your thesis in new words. Summarize your main points. A closing thought completes the essay.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Format 2 - With paragraph labels:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Introduction:
[Your introduction content with 3-5 sentences]

Body Paragraph 1:
[Your first body paragraph with 3-5 sentences]

Body Paragraph 2:
[Your second body paragraph with 3-5 sentences]

Body Paragraph 3:
[Your third body paragraph with 3-5 sentences]

Conclusion:
[Your conclusion with 3-5 sentences]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            />

            {parseErrors.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-2">Parsing Issues:</p>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  {parseErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                <span className="font-medium">Ready to convert?</span> Click the button to instantly transform your essay into 5/5/5 format.
              </div>
              <Button
                type="button"
                onClick={parseEssayContent}
                disabled={!pastedContent.trim()}
                className="min-w-[200px] bg-blue-600 hover:bg-blue-700"
              >
                🚀 Auto-Format to 5/5/5
              </Button>
            </div>
          </div>
        )}

        {/* Manual Input Tab */}
        {activeTab === 'manual' && (
          <>
            {/* Progress Bar */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">
                  {countCompletedSentences()} / 25 sentences • {countWords()} words
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(countCompletedSentences() / 25) * 100}%` }}
                />
              </div>
            </div>

            {/* Paragraphs */}
            {paragraphs.map((paragraph, pIndex) => (
              <div key={pIndex} className="bg-white shadow-sm rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {paragraphTypes.find(pt => pt.type === paragraph.type)?.label}
                </h2>
                
                <div className="space-y-3">
                  {paragraph.sentences.map((sentence, sIndex) => (
                    <div key={sIndex}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {sIndex + 1}. {getSentenceLabel(sentence.function)}
                      </label>
                      <textarea
                        value={sentence.text}
                        onChange={(e) => updateSentence(pIndex, sIndex, e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Enter ${getSentenceLabel(sentence.function).toLowerCase()}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Submit Buttons - Shared for both tabs */}
        <div className="flex justify-between items-center mt-6">
          <Link href="/admin/tools/essay-builder">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? 'Creating...' : 'Create Essay'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}