import { ExtractedContent } from './pdfProcessorFull';

export class PDFTextExtractor {
  static async extractContent(file: any): Promise<ExtractedContent> {
    console.log('[PDFTextExtractor] Starting content extraction');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // For now, use a very simple extraction that avoids the pdf-parse issues
      // This is a temporary solution until we can properly configure pdf-parse
      
      // Convert buffer to string and try to extract readable text
      const rawText = buffer.toString('latin1'); // Use latin1 to preserve byte values
      
      // Extract text between BT and ET markers (PDF text objects)
      const textObjects: string[] = [];
      const btPattern = /BT\s*([\s\S]*?)\s*ET/g;
      let match;
      
      while ((match = btPattern.exec(rawText)) !== null) {
        const textContent = match[1];
        
        // Extract text from Tj and TJ operators
        const tjPattern = /\((.*?)\)\s*Tj/g;
        const tjArrayPattern = /\[(.*?)\]\s*TJ/g;
        
        let tjMatch;
        while ((tjMatch = tjPattern.exec(textContent)) !== null) {
          const text = this.decodePDFString(tjMatch[1]);
          if (text && text.trim()) {
            textObjects.push(text);
          }
        }
        
        let tjArrayMatch;
        while ((tjArrayMatch = tjArrayPattern.exec(textContent)) !== null) {
          const arrayContent = tjArrayMatch[1];
          const stringPattern = /\((.*?)\)/g;
          let stringMatch;
          
          while ((stringMatch = stringPattern.exec(arrayContent)) !== null) {
            const text = this.decodePDFString(stringMatch[1]);
            if (text && text.trim()) {
              textObjects.push(text);
            }
          }
        }
      }
      
      // Join text objects with spaces
      let extractedText = textObjects.join(' ');
      
      // If no text found using BT/ET, try simpler extraction
      if (!extractedText || extractedText.length < 100) {
        console.log('[PDFTextExtractor] Using fallback text extraction');
        extractedText = this.simpleFallbackExtraction(rawText);
      }
      
      // Clean up the text
      extractedText = this.cleanText(extractedText);
      
      // Extract title from filename or first line
      let title = '';
      if (file.name) {
        title = file.name.replace(/\.pdf$/i, '');
      }
      
      // Try to find a better title from the content
      const lines = extractedText.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        for (let i = 0; i < Math.min(5, lines.length); i++) {
          const line = lines[i].trim();
          if (line.length > 10 && line.length < 200) {
            // Check if it looks like a title
            if (line === line.toUpperCase() || 
                line.match(/^[A-Z][A-Za-z\s,:\-]+$/) ||
                line.match(/^(Chapter|Section|Part)\s+\d+/i)) {
              title = line;
              break;
            }
          }
        }
      }
      
      const result = {
        title: this.cleanText(title) || 'Untitled Document',
        content: extractedText || 'Unable to extract text from PDF',
        pageCount: this.estimatePageCount(rawText),
        metadata: {
          author: undefined,
          subject: undefined,
          keywords: undefined,
          creationDate: undefined
        }
      };
      
      console.log('[PDFTextExtractor] Extraction complete:', {
        title: result.title,
        contentLength: result.content.length,
        pageCount: result.pageCount,
        hasMetadata: !!result.metadata
      });
      
      return result;
      
    } catch (error) {
      console.error('[PDFTextExtractor] Error extracting PDF content:', error);
      throw new Error('Failed to extract PDF content: ' + (error as Error).message);
    }
  }
  
  private static decodePDFString(str: string): string {
    // Decode PDF escape sequences
    return str
      .replace(/\\([0-7]{3})/g, (match, octal) => String.fromCharCode(parseInt(octal, 8)))
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\b/g, '\b')
      .replace(/\\f/g, '\f')
      .replace(/\\(.)/g, '$1') // Escaped parentheses
      .replace(/\\\\/g, '\\'); // Escaped backslash
  }
  
  private static simpleFallbackExtraction(rawText: string): string {
    // Extract readable ASCII text
    const chunks: string[] = [];
    const minChunkSize = 10;
    let currentChunk = '';
    
    for (let i = 0; i < rawText.length; i++) {
      const char = rawText[i];
      const code = char.charCodeAt(0);
      
      // Keep printable ASCII characters and common whitespace
      if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) {
        currentChunk += char;
      } else {
        // Non-printable character, save current chunk if it's long enough
        if (currentChunk.trim().length >= minChunkSize) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = '';
      }
    }
    
    // Don't forget the last chunk
    if (currentChunk.trim().length >= minChunkSize) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.join(' ');
  }
  
  private static cleanText(text: string): string {
    return text
      .replace(/\u0000/g, '') // Remove null characters
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ') // Replace control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize line breaks
      .trim();
  }
  
  private static estimatePageCount(rawText: string): number {
    // Count page markers in PDF
    const pagePattern = /\/Type\s*\/Page[^s]/g;
    const matches = rawText.match(pagePattern);
    return matches ? matches.length : 1;
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
        pageCount: extractedContents.reduce((sum, c) => sum + c.pageCount, 0)
      };
    } else {
      // Simple merge for now
      return {
        title: 'Merged: ' + extractedContents.map(c => c.title).join(' & '),
        content: extractedContents.map(c => c.content).join('\n\n---\n\n'),
        pageCount: extractedContents.reduce((sum, c) => sum + c.pageCount, 0)
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
        'digraph', 'phoneme', 'grapheme', 'syllable'
      ],
      'complete-study-packages': [
        'study package', 'study guide', 'complete study', 'curriculum', 
        'syllabus', 'comprehensive', 'course material', 'textbook',
        'workbook', 'lesson plan', 'unit plan', 'semester', 'academic'
      ],
      'standardizers': [
        'standard', 'standardize', 'assessment', 'evaluation', 'benchmark', 
        'test', 'exam', 'quiz', 'measure', 'rubric', 'criteria', 'score',
        'grade', 'performance', 'competency', 'proficiency'
      ]
    };
    
    let bestCategory = 'decoders'; // default to decoders if no match
    let maxMatches = 0;
    
    for (const [category, keywords] of Object.entries(categoryPatterns)) {
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category;
      }
    }
    
    console.log('[PDFTextExtractor] Category suggestion:', {
      bestCategory: bestCategory,
      matchCount: maxMatches
    });
    
    return bestCategory;
  }
}