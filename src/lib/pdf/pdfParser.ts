import { ExtractedContent } from './pdfProcessorFull';
import { PDFProcessor } from './pdfProcessorFull';

export class SimplePDFParser {
  static async extractContent(file: any): Promise<ExtractedContent> {
    console.log('[SimplePDFParser] Starting content extraction');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Try to use pdf-parse with error handling
      let data;
      try {
        // Dynamically import pdf-parse
        const pdfParse = await import('pdf-parse');
        
        // Create a minimal options object to avoid the test file issue
        const options = {
          pagerender: undefined,
          max: 0,
          version: 'default'
        };
        
        data = await pdfParse.default(buffer, options);
      } catch (parseError) {
        console.log('[SimplePDFParser] pdf-parse failed, using fallback method');
        // Fallback: Extract basic text from PDF structure
        data = await this.fallbackExtraction(buffer);
      }
      
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
      
      // Remove null characters and other problematic Unicode
      content = content
        .replace(/\u0000/g, '') // Remove null characters
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Replace control characters with space
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newline
        .trim();
      
      // Also clean the title
      title = title
        .replace(/\u0000/g, '')
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
        .trim();
      
      const result = {
        title: title || 'Untitled Document',
        content: content,
        pageCount: data.numpages || data.numPages || 1,
        metadata: data.info ? {
          author: data.info.Author,
          subject: data.info.Subject,
          keywords: data.info.Keywords,
          creationDate: data.info.CreationDate ? new Date(data.info.CreationDate) : undefined
        } : undefined
      };
      
      console.log('[SimplePDFParser] Extraction complete:', {
        title: result.title,
        contentLength: result.content.length,
        pageCount: result.pageCount,
        hasMetadata: !!result.metadata
      });
      
      return result;
      
    } catch (error) {
      console.error('[SimplePDFParser] Error extracting PDF content:', error);
      throw new Error('Failed to extract PDF content: ' + (error as Error).message);
    }
  }
  
  // Fallback method to extract basic text from PDF
  private static async fallbackExtraction(buffer: Buffer): Promise<any> {
    const text = buffer.toString('utf-8', 0, Math.min(buffer.length, 10000));
    
    // Try to find text between stream markers
    const textMatches = text.match(/stream\s*([\s\S]*?)\s*endstream/g) || [];
    let extractedText = '';
    
    for (const match of textMatches) {
      // Extract readable text
      const cleaned = match
        .replace(/stream\s*/, '')
        .replace(/\s*endstream/, '')
        .replace(/[^\x20-\x7E\n]/g, ' ') // Keep only printable ASCII
        .trim();
      
      if (cleaned.length > 10) {
        extractedText += cleaned + '\n';
      }
    }
    
    // Also try to extract from text objects
    const textObjects = text.match(/\(([^)]+)\)/g) || [];
    for (const obj of textObjects) {
      const cleaned = obj
        .replace(/[()]/g, '')
        .replace(/\\[0-9]{3}/g, '') // Remove octal sequences
        .trim();
      
      if (cleaned.length > 5) {
        extractedText += cleaned + ' ';
      }
    }
    
    return {
      text: extractedText || 'Unable to extract text from PDF',
      numpages: 1,
      numPages: 1,
      info: {}
    };
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
    return PDFProcessor.suggestCategory(content);
  }
}