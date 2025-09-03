'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  ClipboardDocumentIcon,
  SparklesIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Book {
  id: string;
  title: string;
  author: string;
}

interface ParsedEssay {
  paragraphs: {
    type: 'introduction' | 'body1' | 'body2' | 'body3' | 'conclusion';
    sentences: string[];
  }[];
  thesis?: string;
  wordCount: number;
}

export default function PasteAndFormatPage() {
  const router = useRouter();
  const [pastedText, setPastedText] = useState('');
  const [parsedEssay, setParsedEssay] = useState<ParsedEssay | null>(null);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [essayTitle, setEssayTitle] = useState('');
  const [difficulty, setDifficulty] = useState<string>('intermediate');
  const [books, setBooks] = useState<Book[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadBooks();
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

  const parseEssay = () => {
    setProcessing(true);
    setErrors([]);
    setParsedEssay(null);

    try {
      // Split text into paragraphs (separated by double newlines or single newlines)
      const paragraphs = pastedText
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      if (paragraphs.length !== 5) {
        setErrors([`Expected 5 paragraphs, found ${paragraphs.length}`]);
      }

      const parsed: ParsedEssay = {
        paragraphs: [],
        wordCount: 0
      };

      // Process each paragraph
      paragraphs.forEach((paragraph, index) => {
        // Split into sentences (basic split by period, question mark, or exclamation)
        const sentences = paragraph
          .split(/(?<=[.!?])\s+/)
          .map(s => s.trim())
          .filter(s => s.length > 0);

        // Determine paragraph type
        let type: 'introduction' | 'body1' | 'body2' | 'body3' | 'conclusion';
        switch (index) {
          case 0:
            type = 'introduction';
            // Try to extract thesis (usually the last sentence of introduction)
            if (sentences.length >= 3) {
              parsed.thesis = sentences[sentences.length - 1];
            }
            break;
          case 1:
            type = 'body1';
            break;
          case 2:
            type = 'body2';
            break;
          case 3:
            type = 'body3';
            break;
          case 4:
            type = 'conclusion';
            break;
          default:
            type = 'body1';
        }

        // Check sentence count (3-5 sentences accepted)
        if (sentences.length < 3 || sentences.length > 5) {
          setErrors(prev => [...prev, `${type} paragraph has ${sentences.length} sentences (should be 3-5)`]);
        }

        parsed.paragraphs.push({
          type,
          sentences: sentences // Accept all sentences (3-5 expected)
        });

        // Count words
        parsed.wordCount += paragraph.split(/\s+/).length;
      });

      setParsedEssay(parsed);
    } catch (error) {
      setErrors(['Failed to parse essay. Please check the format.']);
    } finally {
      setProcessing(false);
    }
  };

  const autoFormat = () => {
    setProcessing(true);
    setErrors([]);

    try {
      // Attempt to clean and format the text
      let formatted = pastedText
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
        .trim();

      // Try to detect paragraph breaks
      const lines = formatted.split('\n');
      const paragraphs: string[] = [];
      let currentParagraph = '';

      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed === '') {
          if (currentParagraph) {
            paragraphs.push(currentParagraph);
            currentParagraph = '';
          }
        } else {
          currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
        }
      });
      if (currentParagraph) {
        paragraphs.push(currentParagraph);
      }

      // Rejoin with proper paragraph breaks
      formatted = paragraphs.join('\n\n');
      setPastedText(formatted);
      
      // Auto-parse after formatting
      setTimeout(() => parseEssay(), 100);
    } catch (error) {
      setErrors(['Failed to auto-format text']);
    } finally {
      setProcessing(false);
    }
  };

  const saveEssay = async () => {
    if (!selectedBook || !essayTitle || !parsedEssay) {
      setErrors(['Please select a book and provide a title']);
      return;
    }

    try {
      // Here you would save to database
      // For now, just navigate back with success
      router.push('/admin/tools/essay-builder?success=created');
    } catch (error) {
      setErrors(['Failed to save essay']);
    }
  };

  const getParagraphLabel = (type: string) => {
    switch (type) {
      case 'introduction': return 'Introduction';
      case 'body1': return 'Body Paragraph 1';
      case 'body2': return 'Body Paragraph 2';
      case 'body3': return 'Body Paragraph 3';
      case 'conclusion': return 'Conclusion';
      default: return type;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/admin/tools/essay-builder"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Essay Builder
        </Link>
        
        <h1 className="text-2xl font-semibold text-gray-900">Paste & Format Essay</h1>
        <p className="mt-1 text-sm text-gray-600">
          Paste a complete 5/5/5 essay and automatically format it for the system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium mb-4">Essay Input</h2>
            
            {/* Book Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Book <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a book...</option>
                {books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} - {book.author}
                  </option>
                ))}
              </select>
            </div>

            {/* Essay Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Essay Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={essayTitle}
                onChange={(e) => setEssayTitle(e.target.value)}
                placeholder="Enter essay title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Difficulty Level */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Text Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste Essay Text
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your complete 5-paragraph essay here...

Each paragraph should be separated by a blank line.
Each paragraph should contain 3-5 sentences."
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Tip: Ensure paragraphs are separated by blank lines
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={parseEssay}
                disabled={!pastedText || processing}
                className="flex items-center gap-2"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                Parse Essay
              </Button>
              <Button
                onClick={autoFormat}
                disabled={!pastedText || processing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <SparklesIcon className="h-4 w-4" />
                Auto-Format
              </Button>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Formatting Issues:</p>
                    <ul className="mt-1 text-xs text-red-700 list-disc list-inside">
                      {errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium mb-4">Parsed Preview</h2>
            
            {parsedEssay ? (
              <div className="space-y-4">
                {/* Stats */}
                <div className="flex gap-4 p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <span className="text-gray-600">Paragraphs:</span>
                    <span className="ml-2 font-medium">{parsedEssay.paragraphs.length}/5</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Sentences:</span>
                    <span className="ml-2 font-medium">
                      {parsedEssay.paragraphs.reduce((sum, p) => sum + p.sentences.length, 0)}/25
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Word Count:</span>
                    <span className="ml-2 font-medium">{parsedEssay.wordCount}</span>
                  </div>
                </div>

                {/* Thesis */}
                {parsedEssay.thesis && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-blue-900 mb-1">Detected Thesis:</p>
                    <p className="text-sm text-blue-800 italic">{parsedEssay.thesis}</p>
                  </div>
                )}

                {/* Paragraphs */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {parsedEssay.paragraphs.map((paragraph, pIndex) => (
                    <div key={pIndex} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-sm">
                          {getParagraphLabel(paragraph.type)}
                        </h3>
                        <Badge className={
                          (paragraph.sentences.length >= 3 && paragraph.sentences.length <= 5) 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }>
                          {paragraph.sentences.length} sentences
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {paragraph.sentences.map((sentence, sIndex) => (
                          <div key={sIndex} className="flex gap-2">
                            <span className="text-xs text-gray-500 mt-0.5">S{sIndex + 1}:</span>
                            <p className="text-sm text-gray-700 flex-1">{sentence}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={saveEssay}
                    disabled={!selectedBook || !essayTitle || errors.length > 0}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Save Essay
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <ClipboardDocumentIcon className="h-12 w-12 mx-auto mb-3" />
                <p className="text-sm">Paste and parse an essay to see preview</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Format Requirements:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Exactly 5 paragraphs</li>
              <li>• Each paragraph should have 3-5 sentences</li>
              <li>• Paragraphs separated by blank lines</li>
              <li>• Introduction should contain thesis statement</li>
              <li>• Body paragraphs should include evidence/quotes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}