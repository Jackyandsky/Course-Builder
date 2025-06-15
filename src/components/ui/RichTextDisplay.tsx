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

  // Check if content is likely HTML (contains HTML tags)
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  
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
          className
        )}
        dangerouslySetInnerHTML={{ __html: content }}
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
      {content}
    </div>
  );
}