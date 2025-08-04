import { PDFDocument } from 'pdf-lib';

// Use legacy build to avoid Promise.withResolvers issue
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');

// Disable worker in Node.js environment
if (typeof window === 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = null;
  pdfjsLib.GlobalWorkerOptions.workerPort = null;
}

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
   * Extract text content from a PDF file
   */
  static async extractContent(file: File | Blob): Promise<ExtractedContent> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF with worker disabled for server environment
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });
      
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      let title = '';
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        // Try to extract title from first page
        if (i === 1 && !title) {
          const lines = pageText.split('\n').filter((line: string) => line.trim());
          // Look for title in first few lines
          for (const line of lines.slice(0, 5)) {
            if (line.trim().length > 10 && line.trim().length < 200) {
              title = line.trim();
              break;
            }
          }
        }
        
        fullText += pageText + '\n\n';
      }
      
      // Get metadata
      const metadata = await pdf.getMetadata();
      
      // Use metadata title if available and no title found
      if (!title && metadata.info && metadata.info.Title) {
        title = metadata.info.Title;
      }
      
      // Fallback to filename
      if (!title && file instanceof File) {
        title = file.name.replace('.pdf', '');
      }
      
      return {
        title: title || 'Untitled Document',
        content: fullText.trim(),
        pageCount: pdf.numPages,
        metadata: metadata.info ? {
          author: metadata.info.Author,
          subject: metadata.info.Subject,
          keywords: metadata.info.Keywords,
          creationDate: metadata.info.CreationDate ? new Date(metadata.info.CreationDate) : undefined
        } : undefined
      };
    } catch (error) {
      console.error('Error extracting PDF content:', error);
      throw new Error('Failed to extract PDF content');
    }
  }
  
  /**
   * Extract content from multiple PDFs and combine them
   */
  static async extractMultiple(
    files: File[], 
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
        // Detect section headers (simple heuristic)
        if (line && line.length < 100 && 
            (line.toUpperCase() === line || 
             line.match(/^(Chapter|Section|Part)\s+\d+/i))) {
          // Save previous section
          if (sectionContent.length > 0) {
            if (!sections.has(currentSection)) {
              sections.set(currentSection, []);
            }
            sections.get(currentSection)!.push(sectionContent.join('\n'));
          }
          
          currentSection = line;
          sectionContent = [];
        } else {
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
      result += contents.join('\n\n');
      result += '\n\n';
    });
    
    return result;
  }
  
  /**
   * Analyze content to suggest appropriate category
   */
  static suggestCategory(content: ExtractedContent): string {
    const text = (content.title + ' ' + content.content).toLowerCase();
    
    // Category detection rules for proprietary products
    const categoryPatterns = {
      'decoders': ['decode', 'decoder', 'phonics', 'reading skills', 'pronunciation', 'decoding'],
      'complete-study-packages': ['study package', 'study guide', 'complete study', 'curriculum', 'syllabus', 'comprehensive'],
      'standardizers': ['standard', 'standardize', 'assessment', 'evaluation', 'benchmark', 'test']
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
    
    return bestCategory;
  }
}