// Dynamic import to avoid CommonJS issues in Next.js
let pdfParse: any;

export interface ExtractedContent {
  title: string;
  content: string;
  pageCount: number;
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: Date;
  };
}

export class PDFProcessor {
  /**
   * Extract full text content from a PDF file
   */
  static async extractContent(file: any): Promise<ExtractedContent> {
    console.log('[PDFProcessor] Starting content extraction');
    console.log('[PDFProcessor] File info:', {
      name: file.name || 'Unknown',
      size: file.size,
      type: file.type || 'application/pdf'
    });
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log('[PDFProcessor] Buffer created, size:', buffer.length);
      
      // Parse PDF using pdf-parse
      console.log('[PDFProcessor] Parsing PDF with pdf-parse...');
      
      // Dynamic import pdf-parse
      if (!pdfParse) {
        pdfParse = (await import('pdf-parse')).default;
      }
      
      const data = await pdfParse(buffer);
      console.log('[PDFProcessor] PDF parsed successfully:', {
        numPages: data.numpages,
        textLength: data.text?.length || 0,
        hasInfo: !!data.info
      });
      
      // Extract title from metadata or first line of text
      let title = data.info?.Title || '';
      
      if (!title && data.text) {
        // Try to extract title from first non-empty line
        const lines = data.text.split('\n').filter((line: string) => line.trim());
        if (lines.length > 0) {
          // Look for a title-like line in the first few lines
          for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i].trim();
            // Title heuristics: not too short, not too long, might be in caps
            if (line.length > 10 && line.length < 200 && 
                (line === line.toUpperCase() || line.match(/^[A-Z][A-Za-z\s,:\-]+$/))) {
              title = line;
              break;
            }
          }
        }
      }
      
      // Fallback to filename
      if (!title && file.name) {
        title = file.name.replace(/\.pdf$/i, '');
      }
      
      // Clean up the text content
      let content = data.text || '';
      
      // Remove excessive whitespace and clean up formatting
      content = content
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newline
        .trim();
      
      const result = {
        title: title || 'Untitled Document',
        content: content,
        pageCount: data.numpages || 0,
        metadata: data.info ? {
          author: data.info.Author,
          subject: data.info.Subject,
          keywords: data.info.Keywords,
          creationDate: data.info.CreationDate ? new Date(data.info.CreationDate) : undefined
        } : undefined
      };
      
      console.log('[PDFProcessor] Extraction complete:', {
        title: result.title,
        contentLength: result.content.length,
        pageCount: result.pageCount,
        hasMetadata: !!result.metadata
      });
      
      return result;
    } catch (error) {
      console.error('[PDFProcessor] Error extracting PDF content:', error);
      console.error('[PDFProcessor] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw new Error('Failed to extract PDF content: ' + (error as Error).message);
    }
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
      // Merge method - combine similar sections
      const mergedContent = this.mergeSimilarSections(extractedContents);
      return {
        title: 'Merged: ' + extractedContents.map(c => c.title).join(' & '),
        content: mergedContent,
        pageCount: extractedContents.reduce((sum, c) => sum + c.pageCount, 0)
      };
    }
  }
  
  /**
   * Merge similar sections from multiple contents
   */
  private static mergeSimilarSections(contents: ExtractedContent[]): string {
    const sections: Map<string, string[]> = new Map();
    
    contents.forEach(content => {
      const lines = content.content.split('\n');
      let currentSection = 'Introduction';
      let sectionContent: string[] = [];
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        
        // Detect section headers (improved heuristics)
        if (trimmedLine && 
            trimmedLine.length < 100 && 
            (trimmedLine === trimmedLine.toUpperCase() || 
             trimmedLine.match(/^(Chapter|Section|Part|Unit|Lesson|Module)\s+\d+/i) ||
             trimmedLine.match(/^\d+\.\s+[A-Z]/) || // Numbered sections
             trimmedLine.match(/^[IVX]+\.\s+/) // Roman numerals
            )) {
          // Save previous section
          if (sectionContent.length > 0) {
            if (!sections.has(currentSection)) {
              sections.set(currentSection, []);
            }
            sections.get(currentSection)!.push(sectionContent.join('\n'));
          }
          
          currentSection = trimmedLine;
          sectionContent = [];
        } else if (trimmedLine) {
          sectionContent.push(line);
        }
      });
      
      // Don't forget last section
      if (sectionContent.length > 0) {
        if (!sections.has(currentSection)) {
          sections.set(currentSection, []);
        }
        sections.get(currentSection)!.push(sectionContent.join('\n'));
      }
    });
    
    // Combine sections
    let result = '';
    sections.forEach((contents, sectionName) => {
      result += `\n## ${sectionName}\n\n`;
      // Merge similar content within each section
      const uniqueContent = Array.from(new Set(contents));
      result += uniqueContent.join('\n\n');
      result += '\n\n';
    });
    
    return result;
  }
  
  /**
   * Analyze content to suggest appropriate category
   */
  static suggestCategory(content: ExtractedContent): string {
    console.log('[PDFProcessor] Suggesting category for content');
    const text = (content.title + ' ' + content.content).toLowerCase();
    console.log('[PDFProcessor] Text sample for analysis:', text.substring(0, 200) + '...');
    
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
    
    console.log('[PDFProcessor] Category suggestion:', {
      bestCategory: bestCategory,
      matchCount: maxMatches
    });
    
    return bestCategory;
  }
}