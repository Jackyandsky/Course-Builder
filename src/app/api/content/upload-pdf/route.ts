import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { contentService } from '@/lib/supabase/content';

// Dynamic import to avoid build issues
const getPDFProcessor = async () => {
  const { PDFProcessor } = await import('@/lib/pdf/pdfProcessorFull');
  return PDFProcessor;
};

// Use the simpler parser for now
const getSimplePDFParser = async () => {
  const { SimplePDFParser } = await import('@/lib/pdf/pdfParser');
  return SimplePDFParser;
};

// Use the text extractor as primary method
const getPDFTextExtractor = async () => {
  const { PDFTextExtractor } = await import('@/lib/pdf/pdfTextExtractor');
  return PDFTextExtractor;
};

// Use simple extractor for now
const getSimpleExtractor = async () => {
  const { SimplePdfExtractor } = await import('@/lib/pdf/simplePdfExtractor');
  return SimplePdfExtractor;
};

// Use PDF.js extractor for proper text extraction
const getPdfJsExtractor = async () => {
  const { PdfJsExtractor } = await import('@/lib/pdf/pdfjsExtractor');
  return PdfJsExtractor;
};

// Use raw PDF handler to store PDF as-is
const getRawPdfHandler = async () => {
  const { RawPdfHandler } = await import('@/lib/pdf/rawPdfHandler');
  return RawPdfHandler;
};

export async function POST(request: NextRequest) {

  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'content';
    const bookIds = formData.get('bookIds') as string; // comma-separated book IDs
    

    if (!file || !file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Please provide a valid PDF file' }, { status: 400 });
    }

    // Extract content from PDF

    // Use raw PDF handler to store the PDF data as-is
    const RawPdfHandler = await getRawPdfHandler();
    const extractedContent = await RawPdfHandler.extractContent(file);

    // Get proprietary product categories to find the category ID

    const categories = await contentService.getProprietaryProductCategories();
    console.log('[API] Available categories:', categories.map(c => ({ id: c.id, name: c.name })));
    
    // Map category slug to category ID
    let categoryId: string | null = null;
    let categorySlug = category;
    if (category === 'auto') {
      categorySlug = RawPdfHandler.suggestCategory(extractedContent);
    }
    

    // Find the category by matching the slug
    const matchedCategory = categories.find(
      cat => cat.name.toLowerCase().replace(/\s+/g, '-') === categorySlug
    );
    
    if (matchedCategory) {
      categoryId = matchedCategory.id;

    } else {
      console.warn('[API] No matching category found for slug:', categorySlug);
    }

    // Check for duplicate title and append number if needed
    let finalTitle = extractedContent.title;
    let counter = 1;
    let isDuplicate = await contentService.checkDuplicateName(finalTitle);
    
    while (isDuplicate) {
      counter++;
      finalTitle = `${extractedContent.title} (${counter})`;
      isDuplicate = await contentService.checkDuplicateName(finalTitle);
    }
    
    if (counter > 1) {

    }

    // Prepare content data
    const contentData = {
      name: finalTitle,
      content: extractedContent.content,
      category_id: categoryId,
      user_id: user.id,
      metadata: {
        source: 'pdf_upload',
        filename: file.name,
        pageCount: extractedContent.pageCount,
        uploadedAt: new Date().toISOString(),
        originalTitle: extractedContent.title,
        ...extractedContent.metadata
      },
      is_public: false,
      status: 'active' as const
    };

    // Insert into content table

    });
    
    const { data: content, error: contentError } = await supabase
      .from('content')
      .insert(contentData)
      .select()
      .single();

    if (contentError) {
      console.error('[API] Error inserting content:', contentError);
      console.error('[API] Error details:', {
        message: contentError.message,
        details: contentError.details,
        hint: contentError.hint,
        code: contentError.code
      });
      return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
    }
    

    // Link to books if specified
    if (bookIds && content) {
      const bookIdArray = bookIds.split(',').filter(id => id.trim());
      if (bookIdArray.length > 0) {
        const contentBookLinks = bookIdArray.map((bookId, index) => ({
          content_id: content.id,
          book_id: parseInt(bookId.trim()),
          is_primary: index === 0,
          position: index
        }));

        const { error: linkError } = await supabase
          .from('content_books')
          .insert(contentBookLinks);

        if (linkError) {
          console.error('[API] Error linking to books:', linkError);
          // Non-fatal error - content was still created
        }
      }
    }

    const responseData = {
      success: true,
      content: {
        id: content.id,
        title: content.name,
        category: categorySlug,
        pageCount: extractedContent.pageCount
      }
    };
    

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[API] PDF upload error:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to process PDF file' }, 
      { status: 500 }
    );
  }
}

// Batch upload endpoint
export async function PUT(request: NextRequest) {

  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const category = formData.get('category') as string || 'content';
    const bookIds = formData.get('bookIds') as string;
    const combinationMethod = formData.get('combinationMethod') as 'sequential' | 'merge' | 'individual' || 'sequential';
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Validate all files are PDFs
    const invalidFiles = files.filter(file => !file.name.endsWith('.pdf'));
    if (invalidFiles.length > 0) {
      return NextResponse.json({ 
        error: `Invalid files: ${invalidFiles.map(f => f.name).join(', ')}. Only PDF files are allowed.` 
      }, { status: 400 });
    }

    const results = [];
    
    // Use RawPdfHandler for batch processing as well
    const RawPdfHandler = await getRawPdfHandler();

    // Process based on combination method
    if (files.length === 1 || combinationMethod === 'individual') {
      // Process each file individually
      for (const file of files) {
        try {
          const extractedContent = await RawPdfHandler.extractContent(file);
          
          // Get proprietary product categories to find the category ID
          const categories = await contentService.getProprietaryProductCategories();
          
          // Map category slug to category ID
          let categoryId: string | null = null;
          const categorySlug = category === 'auto' 
            ? RawPdfHandler.suggestCategory(extractedContent) 
            : category;
          
          const matchedCategory = categories.find(
            cat => cat.name.toLowerCase().replace(/\s+/g, '-') === categorySlug
          );
          
          if (matchedCategory) {
            categoryId = matchedCategory.id;
          }

          // Check for duplicate title and append number if needed
          let finalTitle = extractedContent.title;
          let counter = 1;
          let isDuplicate = await contentService.checkDuplicateName(finalTitle);
          
          while (isDuplicate) {
            counter++;
            finalTitle = `${extractedContent.title} (${counter})`;
            isDuplicate = await contentService.checkDuplicateName(finalTitle);
          }

          const contentData = {
            name: finalTitle,
            content: extractedContent.content,
            category_id: categoryId,
            user_id: user.id,
            metadata: {
              source: 'pdf_batch_upload',
              filename: file.name,
              pageCount: extractedContent.pageCount,
              uploadedAt: new Date().toISOString(),
              originalTitle: extractedContent.title,
              ...extractedContent.metadata
            },
            is_public: false,
            status: 'active' as const
          };

          const { data: content, error } = await supabase
            .from('content')
            .insert(contentData)
            .select()
            .single();

          if (error) {
            results.push({ 
              filename: file.name, 
              success: false, 
              error: error.message 
            });
          } else {
            // Link to books if specified
            if (bookIds && content) {
              const bookIdArray = bookIds.split(',').filter(id => id.trim());
              if (bookIdArray.length > 0) {
                const contentBookLinks = bookIdArray.map((bookId, index) => ({
                  content_id: content.id,
                  book_id: parseInt(bookId.trim()),
                  is_primary: index === 0,
                  position: index
                }));

                await supabase.from('content_books').insert(contentBookLinks);
              }
            }

            results.push({ 
              filename: file.name, 
              success: true, 
              contentId: content.id,
              title: content.name 
            });
          }
        } catch (error) {
          results.push({ 
            filename: file.name, 
            success: false, 
            error: 'Failed to process file' 
          });
        }
      }
    } else {
      // Combine all PDFs into one content
      try {
        const extractedContent = await RawPdfHandler.extractMultiple(files, combinationMethod);
        const finalCategory = category === 'auto' 
          ? RawPdfHandler.suggestCategory(extractedContent) 
          : category;

        // Get proprietary product categories to find the category ID
        const categories = await contentService.getProprietaryProductCategories();
        let categoryId: string | null = null;
        
        const matchedCategory = categories.find(
          cat => cat.name.toLowerCase().replace(/\s+/g, '-') === finalCategory
        );
        
        if (matchedCategory) {
          categoryId = matchedCategory.id;
        }

        // Check for duplicate title and append number if needed
        let finalTitle = extractedContent.title;
        let counter = 1;
        let isDuplicate = await contentService.checkDuplicateName(finalTitle);
        
        while (isDuplicate) {
          counter++;
          finalTitle = `${extractedContent.title} (${counter})`;
          isDuplicate = await contentService.checkDuplicateName(finalTitle);
        }

        const contentData = {
          name: finalTitle,
          content: extractedContent.content,
          category_id: categoryId,
          user_id: user.id,
          metadata: {
            source: 'pdf_batch_upload_combined',
            filenames: files.map(f => f.name),
            pageCount: extractedContent.pageCount,
            combinationMethod,
            uploadedAt: new Date().toISOString(),
            originalTitle: extractedContent.title
          },
          is_public: false,
          status: 'active' as const
        };

        const { data: content, error } = await supabase
          .from('content')
          .insert(contentData)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ 
            error: 'Failed to save combined content' 
          }, { status: 500 });
        }

        // Link to books if specified
        if (bookIds && content) {
          const bookIdArray = bookIds.split(',').filter(id => id.trim());
          if (bookIdArray.length > 0) {
            const contentBookLinks = bookIdArray.map((bookId, index) => ({
              content_id: content.id,
              book_id: parseInt(bookId.trim()),
              is_primary: index === 0,
              position: index
            }));

            await supabase.from('content_books').insert(contentBookLinks);
          }
        }

        results.push({
          combined: true,
          success: true,
          contentId: content.id,
          title: content.name,
          filesProcessed: files.length
        });
      } catch (error) {
        return NextResponse.json({ 
          error: 'Failed to process and combine PDFs' 
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[API] Batch PDF upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF files' }, 
      { status: 500 }
    );
  }
}