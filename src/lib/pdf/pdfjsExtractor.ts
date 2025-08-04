import { ExtractedContent } from './pdfProcessorFull';

// Dynamic import to avoid issues at build time
let pdfjsLib: any;

async function initPdfJs() {
  if (!pdfjsLib) {
    try {
      pdfjsLib = await import('pdfjs-dist');
      // Disable worker to avoid issues in Node.js environment
      pdfjsLib.GlobalWorkerOptions.workerSrc = false;
    } catch (error) {
      console.error('[PdfJsExtractor] Failed to load pdfjs-dist:', error);
      throw error;
    }
  }
  return pdfjsLib;
}

export class PdfJsExtractor {
  static async extractContent(file: any): Promise<ExtractedContent> {
    console.log('[PdfJsExtractor] Starting content extraction');
    
    try {
      // Initialize pdfjs
      const pdfjs = await initPdfJs();
      
      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      
      console.log('[PdfJsExtractor] Loading PDF document...');
      
      // Load the PDF document
      const loadingTask = pdfjs.getDocument({
        data: typedArray,
        // Use the legacy build to avoid worker issues
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });
      
      const pdf = await loadingTask.promise;
      console.log('[PdfJsExtractor] PDF loaded, pages:', pdf.numPages);
      
      // Extract text from all pages
      let fullText = '';
      const textParts: string[] = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Extract text items and join them
          const pageText = textContent.items
            .map((item: any) => {
              // Check if it's a text item (has 'str' property)
              if ('str' in item) {
                return item.str;
              }
              return '';
            })
            .join(' ');
          
          if (pageText.trim()) {
            textParts.push(pageText);
          }
          
          console.log(`[PdfJsExtractor] Extracted page ${pageNum}/${pdf.numPages}`);
        } catch (pageError) {
          console.error(`[PdfJsExtractor] Error extracting page ${pageNum}:`, pageError);
        }
      }
      
      fullText = textParts.join('\n\n');
      
      // Clean up the text
      fullText = this.cleanText(fullText);
      
      // Extract metadata
      let metadata: any = {};
      try {
        const pdfMetadata = await pdf.getMetadata();
        if (pdfMetadata.info) {
          metadata = {
            author: pdfMetadata.info.Author || undefined,
            subject: pdfMetadata.info.Subject || undefined,
            keywords: pdfMetadata.info.Keywords || undefined,
            creationDate: pdfMetadata.info.CreationDate ? new Date(pdfMetadata.info.CreationDate) : undefined,
            title: pdfMetadata.info.Title || undefined,
          };
        }
      } catch (metadataError) {
        console.warn('[PdfJsExtractor] Could not extract metadata:', metadataError);
      }
      
      // Determine title
      let title = metadata.title || '';
      
      if (!title) {
        // Try to extract title from the beginning of the content
        const lines = fullText.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          // Look for a title-like line in the first few lines
          for (let i = 0; i < Math.min(10, lines.length); i++) {
            const line = lines[i].trim();
            // Title heuristics
            if (line.length > 10 && line.length < 200) {
              // Check if it looks like a title
              if (line === line.toUpperCase() || 
                  line.match(/^[A-Z][A-Za-z\s,:\-]+$/) ||
                  !line.includes('.') || // Titles usually don't have periods
                  i === 0) { // First line is often the title
                title = line;
                break;
              }
            }
          }
        }
      }
      
      // Fallback to filename
      if (!title && file.name) {
        title = file.name.replace(/\.pdf$/i, '');
      }
      
      const result = {
        title: this.cleanText(title) || 'Untitled Document',
        content: fullText || 'No text content could be extracted from this PDF.',
        pageCount: pdf.numPages,
        metadata: metadata
      };
      
      console.log('[PdfJsExtractor] Extraction complete:', {
        title: result.title,
        contentLength: result.content.length,
        pageCount: result.pageCount,
        hasMetadata: Object.keys(metadata).length > 0
      });
      
      return result;
      
    } catch (error) {
      console.error('[PdfJsExtractor] Error extracting PDF content:', error);
      throw new Error('Failed to extract PDF content: ' + (error as Error).message);
    }
  }
  
  private static cleanText(text: string): string {
    return text
      .replace(/\u0000/g, '') // Remove null characters
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ') // Replace control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize line breaks
      .trim();
  }
  
  /**
   * Extract content from multiple PDFs and combine them
   */
  static async extractMultiple(
    files: any[], 
    combinationMethod: 'sequential' | 'merge' = 'sequential'
  ): Promise<ExtractedContent> {
    const extractedContents = await Promise.all(
      files.map(file => this.extractContent(file))
    );
    
    if (combinationMethod === 'sequential') {
      return {
        title: extractedContents.map(c => c.title).join(' + '),
        content: extractedContents.map(c => `--- ${c.title} ---\n\n${c.content}`).join('\n\n\n'),
        pageCount: extractedContents.reduce((sum, c) => sum + c.pageCount, 0),
        metadata: undefined
      };
    } else {
      // Simple merge
      return {
        title: 'Merged: ' + extractedContents.map(c => c.title).join(' & '),
        content: extractedContents.map(c => c.content).join('\n\n---\n\n'),
        pageCount: extractedContents.reduce((sum, c) => sum + c.pageCount, 0),
        metadata: undefined
      };
    }
  }
  
  /**
   * Analyze content to suggest appropriate category
   */
  static suggestCategory(content: ExtractedContent): string {
    const text = (content.title + ' ' + content.content).toLowerCase();
    
    // Category detection rules for proprietary products
    const categoryPatterns = {
      'decoders': [
        'decode', 'decoder', 'phonics', 'reading skills', 'pronunciation', 
        'decoding', 'sound', 'letter', 'vowel', 'consonant', 'blend',
        'digraph', 'phoneme', 'grapheme', 'syllable', 'literacy'
      ],
      'complete-study-packages': [
        'study package', 'study guide', 'complete study', 'curriculum', 
        'syllabus', 'comprehensive', 'course material', 'textbook',
        'workbook', 'lesson plan', 'unit plan', 'semester', 'academic',
        'education', 'learning', 'teaching'
      ],
      'standardizers': [
        'standard', 'standardize', 'assessment', 'evaluation', 'benchmark', 
        'test', 'exam', 'quiz', 'measure', 'rubric', 'criteria', 'score',
        'grade', 'performance', 'competency', 'proficiency', 'achievement'
      ],
      'lex': [
        'lexicon', 'vocabulary', 'dictionary', 'glossary', 'terminology',
        'word list', 'lexical', 'semantics', 'etymology', 'language'
      ]
    };
    
    let bestCategory = 'complete-study-packages'; // default
    let maxMatches = 0;
    
    for (const [category, keywords] of Object.entries(categoryPatterns)) {
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category;
      }
    }
    
    console.log('[PdfJsExtractor] Category suggestion:', {
      bestCategory: bestCategory,
      matchCount: maxMatches
    });
    
    return bestCategory;
  }
}