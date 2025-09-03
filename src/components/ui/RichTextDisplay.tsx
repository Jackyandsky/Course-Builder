'use client';

import { cn } from '@/lib/utils';

interface RichTextDisplayProps {
  content: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RichTextDisplay({
  content,
  className,
  size = 'md'
}: RichTextDisplayProps) {
  if (!content) return null;

  // Process content to hide remove buttons and add toolbar hiding parameters
  let processedContent = content;
  
  // Remove the entire remove button element from display (they're only for editing)
  processedContent = processedContent.replace(
    /<button[^>]*?onclick="this\.parentElement\.remove\(\)"[^>]*?>[\s\S]*?<\/button>/gi,
    ''
  );
  
  // Remove hover event handlers from the wrapper div in view mode
  processedContent = processedContent.replace(
    /onmouseover="[^"]*"/gi,
    ''
  ).replace(
    /onmouseout="[^"]*"/gi,
    ''
  );
  
  // Add toolbar=0 parameters to PDF iframe URLs in view mode
  // This hides download/print buttons while preserving any user-specified parameters like page numbers
  processedContent = processedContent.replace(
    /<iframe([^>]*?)src="([^"]+)"([^>]*?)>/gi,
    (match, before, url, after) => {
      // Process all PDF URLs (but not Google Drive)
      if (!url.includes('drive.google.com') && (url.includes('.pdf') || url.includes('pdf'))) {
        // Preserve existing parameters (like #page=18) and add toolbar hiding parameters
        if (!url.includes('toolbar=0')) {
          // Check if URL has existing hash parameters
          if (url.includes('#')) {
            // URL has hash parameters (like #page=18)
            // Check if it's just a page parameter or has other parameters
            const hashIndex = url.indexOf('#');
            const baseUrl = url.substring(0, hashIndex);
            const hashPart = url.substring(hashIndex + 1);
            
            // If hash part contains = it's likely parameters, otherwise might be an anchor
            if (hashPart.includes('=')) {
              // Append toolbar parameters to existing parameters
              url = baseUrl + '#' + hashPart + '&toolbar=0&navpanes=0&scrollbar=0';
            } else {
              // Replace simple anchor with parameters
              url = baseUrl + '#toolbar=0&navpanes=0&scrollbar=0';
            }
          } else {
            // Add as new hash parameters
            url = url + '#toolbar=0&navpanes=0&scrollbar=0';
          }
        }
      }
      return `<iframe${before}src="${url}"${after}>`;
    }
  );

  // Check if content is likely HTML (contains HTML tags)
  const isHtml = /<[a-z][\s\S]*>/i.test(processedContent);
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (isHtml) {
    return (
      <div
        className={cn(
          'rich-content prose max-w-none',
          sizeClasses[size],
          // Headings
          'prose-headings:text-gray-900 dark:prose-headings:text-gray-100',
          'prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4',
          'prose-h2:text-xl prose-h2:font-semibold prose-h2:mb-3',
          'prose-h3:text-lg prose-h3:font-semibold prose-h3:mb-2',
          'prose-h4:text-base prose-h4:font-semibold prose-h4:mb-2',
          'prose-h5:text-sm prose-h5:font-semibold prose-h5:mb-1',
          'prose-h6:text-sm prose-h6:font-medium prose-h6:mb-1',
          // Paragraphs and text
          'prose-p:text-gray-600 dark:prose-p:text-gray-300',
          'prose-p:mb-3 prose-p:leading-relaxed',
          'prose-strong:font-semibold prose-strong:text-gray-900 dark:prose-strong:text-gray-100',
          'prose-em:italic prose-em:text-gray-600 dark:prose-em:text-gray-300',
          // Lists
          'prose-ul:text-gray-600 dark:prose-ul:text-gray-300',
          'prose-ol:text-gray-600 dark:prose-ol:text-gray-300',
          'prose-li:text-gray-600 dark:prose-li:text-gray-300',
          'prose-li:mb-1',
          'prose-ul:list-disc prose-ul:pl-6',
          'prose-ol:list-decimal prose-ol:pl-6',
          // Links
          'prose-a:text-blue-600 dark:prose-a:text-blue-400',
          'prose-a:underline prose-a:decoration-blue-600/30',
          'hover:prose-a:decoration-blue-600',
          // Code
          'prose-code:text-gray-900 dark:prose-code:text-gray-100',
          'prose-code:bg-gray-100 dark:prose-code:bg-gray-800',
          'prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
          'prose-code:text-sm prose-code:font-mono',
          // Pre and code blocks
          'prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800',
          'prose-pre:text-gray-900 dark:prose-pre:text-gray-100',
          'prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto',
          // Blockquotes
          'prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-300',
          'prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600',
          'prose-blockquote:pl-4 prose-blockquote:italic',
          // Tables
          'prose-table:text-gray-600 dark:prose-table:text-gray-300',
          'prose-thead:text-gray-900 dark:prose-thead:text-gray-100',
          'prose-th:font-semibold prose-th:border-b prose-th:border-gray-300 dark:prose-th:border-gray-600',
          'prose-td:border-b prose-td:border-gray-200 dark:prose-td:border-gray-700',
          // Images
          'prose-img:rounded-lg prose-img:shadow-sm',
          // HR
          'prose-hr:border-gray-300 dark:prose-hr:border-gray-600',
          // PDF embeds and iframes
          '[&_.pdf-embed]:my-6',
          '[&_.pdf-embed_iframe]:w-full [&_.pdf-embed_iframe]:min-h-[600px]',
          '[&_.pdf-embed_iframe]:rounded-lg [&_.pdf-embed_iframe]:border',
          '[&_.pdf-embed_iframe]:border-gray-300 dark:[&_.pdf-embed_iframe]:border-gray-600',
          '[&_.pdf-embed_p]:text-center [&_.pdf-embed_p]:text-sm',
          '[&_.pdf-embed_p]:text-gray-600 dark:[&_.pdf-embed_p]:text-gray-400',
          '[&_.pdf-embed_a]:text-blue-600 dark:[&_.pdf-embed_a]:text-blue-400',
          '[&_.pdf-embed_a]:underline [&_.pdf-embed_a]:hover:text-blue-800',
          // Hide any remove buttons in display mode
          '[&_.pdf-embed-wrapper_button]:hidden',
          className
        )}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    );
  }

  // Plain text fallback
  return (
    <div className={cn(
      sizeClasses[size],
      'text-gray-600 dark:text-gray-300',
      'leading-relaxed whitespace-pre-wrap',
      className
    )}>
      {processedContent}
    </div>
  );
}