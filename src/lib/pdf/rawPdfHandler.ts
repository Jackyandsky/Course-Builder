import { ExtractedContent } from './pdfProcessorFull';

// Dynamic import pdf-parse
async function getPdfParse() {
  try {
    const pdfParse = await import('pdf-parse/lib/pdf-parse');
    return pdfParse.default || pdfParse;
  } catch (error) {
    console.error('[RawPdfHandler] Failed to load pdf-parse:', error);
    throw error;
  }
}

// Dynamic import pdfjs-dist as fallback
async function getPdfJs() {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    // Disable worker to avoid issues in Node.js environment
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    return pdfjsLib;
  } catch (error) {
    console.error('[RawPdfHandler] Failed to load pdfjs-dist:', error);
    throw error;
  }
}

export class RawPdfHandler {
  static async extractContent(file: any): Promise<ExtractedContent> {
    console.log('[RawPdfHandler] Processing PDF file');
    
    try {
      // Get basic file information
      const fileName = file.name || 'Unknown.pdf';
      const title = fileName.replace(/\.pdf$/i, '');
      const fileSize = file.size || 0;
      
      // Convert file to buffer for pdf-parse
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      let textContent = '';
      let pageCount = 1;
      
      try {
        // Try to extract text using pdf-parse
        const pdfParse = await getPdfParse();
        const data = await pdfParse(buffer);
        
        textContent = data.text || '';
        pageCount = data.numpages || 1;
        
        // Format the text to improve readability
        if (textContent) {
          // Split by common paragraph indicators
          textContent = textContent
            .split(/\n\s*\n/)
            .map(para => para.trim())
            .filter(para => para.length > 0)
            .join('\n\n');
        }
        
        console.log('[RawPdfHandler] Extracted text from PDF using pdf-parse:', {
          textLength: textContent.length,
          pageCount: pageCount
        });
      } catch (parseError) {
        console.warn('[RawPdfHandler] pdf-parse failed, trying pdfjs-dist:', parseError);
        
        try {
          // Try pdfjs-dist as fallback
          const pdfjs = await getPdfJs();
          const typedArray = new Uint8Array(arrayBuffer);
          
          const loadingTask = pdfjs.getDocument({
            data: typedArray,
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
          });
          
          const pdf = await loadingTask.promise;
          pageCount = pdf.numPages;
          
          const textParts: string[] = [];
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            try {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              
              // Process text items to preserve structure
              let pageText = '';
              let lastY = null;
              let lastX = null;
              
              for (const item of textContent.items) {
                if (!('str' in item) || !item.str) continue;
                
                // Check if we need a line break based on Y position
                if (lastY !== null && item.transform && Math.abs(item.transform[5] - lastY) > 1) {
                  pageText += '\n';
                  
                  // Add extra line break for larger gaps (paragraphs)
                  if (Math.abs(item.transform[5] - lastY) > 10) {
                    pageText += '\n';
                  }
                }
                
                // Check if we need a space based on X position
                if (lastX !== null && item.transform && item.transform[4] - lastX > 10) {
                  pageText += ' ';
                }
                
                pageText += item.str;
                
                // Update positions
                if (item.transform) {
                  lastY = item.transform[5];
                  lastX = item.transform[4] + (item.width || 0);
                }
              }
              
              if (pageText.trim()) {
                textParts.push(pageText);
              }
            } catch (pageError) {
              console.error(`[RawPdfHandler] Error extracting page ${pageNum}:`, pageError);
            }
          }
          
          // Join pages with clear separators
          textContent = textParts
            .map((text, index) => {
              // Add page header for multi-page documents
              if (textParts.length > 1) {
                return `=== Page ${index + 1} ===\n\n${text}`;
              }
              return text;
            })
            .join('\n\n\n');
          
          console.log('[RawPdfHandler] Extracted text from PDF using pdfjs-dist:', {
            textLength: textContent.length,
            pageCount: pageCount
          });
        } catch (pdfjsError) {
          console.warn('[RawPdfHandler] Both pdf-parse and pdfjs-dist failed:', pdfjsError);
          // If both fail, store a message about the PDF
          textContent = `PDF Document: ${fileName}\n\n` +
            `File Size: ${fileSize} bytes\n` +
            `Upload Date: ${new Date().toISOString()}\n\n` +
            `Note: Text extraction failed. This PDF may contain images, scanned content, or use an unsupported format.`;
        }
      }
      
      // Clean the text content
      const cleanedContent = this.cleanText(textContent);
      
      // Add document header with metadata
      let finalContent = `📄 ${title}\n`;
      finalContent += `${'='.repeat(title.length + 2)}\n\n`;
      finalContent += `📅 Uploaded: ${new Date().toLocaleDateString()}\n`;
      finalContent += `📊 Pages: ${pageCount}\n`;
      finalContent += `📁 Size: ${(fileSize / 1024).toFixed(1)} KB\n`;
      finalContent += `\n${'-'.repeat(50)}\n\n`;
      
      // Add table of contents for multi-page documents
      if (pageCount > 3) {
        finalContent += `📑 TABLE OF CONTENTS\n`;
        finalContent += `${'─'.repeat(20)}\n`;
        for (let i = 1; i <= Math.min(pageCount, 20); i++) {
          finalContent += `  Page ${i}\n`;
        }
        if (pageCount > 20) {
          finalContent += `  ... and ${pageCount - 20} more pages\n`;
        }
        finalContent += `\n${'-'.repeat(50)}\n\n`;
      }
      
      // Add the main content
      finalContent += `📖 DOCUMENT CONTENT\n`;
      finalContent += `${'─'.repeat(20)}\n\n`;
      finalContent += cleanedContent || 'No text content could be extracted from this PDF.';
      
      // Add footer
      finalContent += `\n\n${'-'.repeat(50)}\n`;
      finalContent += `End of Document: ${title}\n`;
      finalContent += `${'='.repeat(title.length + 17)}\n`;
      
      const result = {
        title: title,
        content: finalContent,
        pageCount: pageCount,
        metadata: undefined
      };
      
      console.log('[RawPdfHandler] PDF processed:', {
        title: result.title,
        fileSize: fileSize,
        contentLength: result.content.length,
        pageCount: result.pageCount
      });
      
      return result;
      
    } catch (error) {
      console.error('[RawPdfHandler] Error:', error);
      throw new Error('Failed to process PDF: ' + (error as Error).message);
    }
  }
  
  private static cleanText(text: string): string {
    // First pass: basic cleaning
    let cleaned = text
      .replace(/\u0000/g, '') // Remove null characters
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ') // Replace control characters
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n'); // Convert Mac line endings
    
    // Second pass: smart formatting
    const lines = cleaned.split('\n');
    const formattedLines: string[] = [];
    let previousLineEmpty = true;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip multiple consecutive empty lines
      if (trimmedLine === '') {
        if (!previousLineEmpty) {
          formattedLines.push('');
          previousLineEmpty = true;
        }
        continue;
      }
      
      // Detect potential headers (all caps, short lines, or lines ending with colon)
      const isHeader = 
        (trimmedLine.length < 60 && trimmedLine === trimmedLine.toUpperCase() && /[A-Z]/.test(trimmedLine)) ||
        (trimmedLine.length < 60 && trimmedLine.endsWith(':')) ||
        (trimmedLine.match(/^(Chapter|Section|Part)\s+\d+/i));
      
      // Detect list items
      const isListItem = trimmedLine.match(/^[\u2022\u2023\u2043•·▪▫◦‣⁃]\s/) || // Bullet points
                        trimmedLine.match(/^[a-zA-Z]\.\s/) || // Letter lists (a. b. c.)
                        trimmedLine.match(/^\d+\.\s/) || // Numbered lists (1. 2. 3.)
                        trimmedLine.match(/^[-*+]\s/); // Markdown-style lists
      
      // Add extra spacing before headers
      if (isHeader && !previousLineEmpty && formattedLines.length > 0) {
        formattedLines.push('');
      }
      
      // Format list items with consistent indentation
      if (isListItem) {
        formattedLines.push('  ' + trimmedLine);
      } else {
        formattedLines.push(trimmedLine);
      }
      
      // Add extra spacing after headers
      if (isHeader) {
        formattedLines.push('');
        previousLineEmpty = true;
      } else {
        previousLineEmpty = false;
      }
    }
    
    return formattedLines.join('\n').trim();
  }
  
  /**
   * Extract content from multiple PDFs
   */
  static async extractMultiple(
    files: any[], 
    combinationMethod: 'sequential' | 'merge' = 'sequential'
  ): Promise<ExtractedContent> {
    const extractedContents = await Promise.all(
      files.map(file => this.extractContent(file))
    );
    
    let combinedContent: string;
    let combinedTitle: string;
    
    if (combinationMethod === 'sequential') {
      // Sequential: Keep each document separate with clear headers
      combinedTitle = extractedContents.map(c => c.title).join(' + ');
      combinedContent = extractedContents
        .map(c => `--- ${c.title} ---\n\n${c.content}`)
        .join('\n\n\n');
    } else {
      // Merge: Simply concatenate all content
      combinedTitle = 'Merged: ' + extractedContents.map(c => c.title).join(' & ');
      combinedContent = extractedContents
        .map(c => c.content)
        .join('\n\n---\n\n');
    }
    
    return {
      title: combinedTitle,
      content: combinedContent,
      pageCount: extractedContents.reduce((sum, c) => sum + c.pageCount, 0),
      metadata: undefined
    };
  }
  
  /**
   * Simple category suggestion based on filename
   */
  static suggestCategory(content: ExtractedContent): string {
    const title = content.title.toLowerCase();
    
    if (title.includes('decode') || title.includes('phonic') || title.includes('reading')) {
      return 'decoders';
    } else if (title.includes('study') || title.includes('guide') || title.includes('course')) {
      return 'complete-study-packages';
    } else if (title.includes('standard') || title.includes('test') || title.includes('exam')) {
      return 'standardizers';
    } else if (title.includes('lex') || title.includes('vocab') || title.includes('dictionary')) {
      return 'lex';
    }
    
    return 'complete-study-packages';
  }
}