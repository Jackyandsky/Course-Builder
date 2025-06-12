'use client';

import { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { bookService, CreateBookData } from '@/lib/supabase/books';
import { categoryService } from '@/lib/supabase/categories';
import { ContentType } from '@/types/database';

interface BookImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  newCategories: string[];
}

export function BookImportModal({ isOpen, onClose, onImportComplete }: BookImportModalProps) {
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const sampleCsv = `Title,Author,Cover Image URL,Published Year,Categories,Description
"The Great Gatsby","F. Scott Fitzgerald","https://example.com/cover1.jpg",1925,"Classic Literature","A classic American novel about the Jazz Age and the American Dream"
"To Kill a Mockingbird","Harper Lee","https://example.com/cover2.jpg",1960,"Fiction,American Literature","A gripping tale of racial injustice and childhood innocence in the American South"
"1984","George Orwell","",1949,"Dystopian,Science Fiction","A dystopian social science fiction novel about totalitarian control"`;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCsvText(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const parseCSV = (text: string): Array<Record<string, string>> => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data: Array<Record<string, string>> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
    
    return data;
  };

  const getOrCreateCategory = async (categoryName: string, newCategories: Set<string>): Promise<string | undefined> => {
    if (!categoryName.trim()) return undefined;
    
    try {
      const categories = await categoryService.getCategories({ type: 'book' });
      const existing = categories.find(cat => 
        cat.name.toLowerCase() === categoryName.toLowerCase()
      );
      
      if (existing) {
        return existing.id;
      }
      
      const newCategory = await categoryService.createCategory({
        name: categoryName,
        type: 'book',
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
      });
      
      newCategories.add(categoryName);
      return newCategory.id;
    } catch (error) {
      console.error('Error creating category:', error);
      return undefined;
    }
  };

  const handleImport = async () => {
    if (!csvText.trim()) return;
    
    setImporting(true);
    setResult(null);
    
    try {
      const data = parseCSV(csvText);
      if (data.length === 0) {
        throw new Error('No valid data found in CSV');
      }
      
      const result: ImportResult = {
        success: 0,
        failed: 0,
        errors: [],
        newCategories: [],
      };
      
      const newCategories = new Set<string>();
      
      for (const row of data) {
        try {
          if (!row.Title?.trim()) {
            result.errors.push('Row skipped: Title is required');
            result.failed++;
            continue;
          }
          
          let categoryId: string | undefined;
          if (row.Categories?.trim()) {
            const categoryNames = row.Categories.split(',').map(c => c.trim());
            if (categoryNames.length > 0) {
              categoryId = await getOrCreateCategory(categoryNames[0], newCategories);
            }
          }
          
          const bookData: CreateBookData = {
            title: row.Title.trim(),
            author: row.Author?.trim() || undefined,
            cover_image_url: row['Cover Image URL']?.trim() || undefined,
            publication_year: row['Published Year'] ? parseInt(row['Published Year']) : undefined,
            description: row.Description?.trim() || undefined,
            category_id: categoryId,
            content_type: 'text' as ContentType,
            language: 'en',
            is_public: false,
          };
          
          await bookService.createBook(bookData);
          result.success++;
        } catch (error) {
          result.errors.push(`Row "${row.Title || 'Unknown'}": ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.failed++;
        }
      }
      
      result.newCategories = Array.from(newCategories);
      setResult(result);
      
      if (result.success > 0) {
        onImportComplete();
      }
    } catch (error) {
      setResult({
        success: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Import failed'],
        newCategories: [],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setCsvText('');
    setResult(null);
    setShowSample(false);
    onClose();
  };

  const downloadSample = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'book_import_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Books" size="lg">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">CSV Format</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload a CSV file with the following columns: Title, Author, Cover Image URL, Published Year, Categories, Description
          </p>
          
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSample}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Download Sample
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSample(!showSample)}
            >
              {showSample ? 'Hide' : 'Show'} Sample Format
            </Button>
          </div>
          
          {showSample && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm font-mono overflow-x-auto">
              <pre>{sampleCsv}</pre>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Upload CSV</h3>
          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Or paste CSV content:
              </label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Title,Author,Cover Image URL,Published Year,Categories,Description&#10;..."
                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
        </div>
        
        {result && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Import Results</h3>
            
            {result.success > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">
                    Successfully imported {result.success} book{result.success !== 1 ? 's' : ''}
                  </span>
                </div>
                {result.newCategories.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm">New categories created: {result.newCategories.join(', ')}</p>
                  </div>
                )}
              </div>
            )}
            
            {result.failed > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">
                    {result.failed} book{result.failed !== 1 ? 's' : ''} failed to import
                  </span>
                </div>
                {result.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <ul className="text-sm space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index} className="text-xs">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {importing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Importing books...</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={!csvText.trim() || importing}
          leftIcon={<Upload className="h-4 w-4" />}
        >
          {importing ? 'Importing...' : 'Import Books'}
        </Button>
      </div>
    </Modal>
  );
}