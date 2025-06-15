'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RichTextTruncateProps {
  content: string;
  maxLength?: number;
  maxLines?: number;
  className?: string;
  showReadMore?: boolean;
}

export function RichTextTruncate({
  content,
  maxLength = 150,
  maxLines = 3,
  className,
  showReadMore = false
}: RichTextTruncateProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  // Function to truncate HTML content while preserving tags
  const truncateHtml = (html: string, maxLen: number): { truncated: string; isTruncated: boolean } => {
    // Remove HTML tags for length calculation
    const textContent = html.replace(/<[^>]*>/g, '');
    
    if (textContent.length <= maxLen) {
      return { truncated: html, isTruncated: false };
    }

    // Simple truncation by character count while trying to preserve some formatting
    let truncated = '';
    let textLength = 0;
    let inTag = false;
    let tagStack: string[] = [];
    
    for (let i = 0; i < html.length && textLength < maxLen; i++) {
      const char = html[i];
      
      if (char === '<') {
        inTag = true;
        truncated += char;
      } else if (char === '>') {
        inTag = false;
        truncated += char;
        
        // Track opening/closing tags
        const tagMatch = html.substring(html.lastIndexOf('<', i), i + 1).match(/<\/?([a-zA-Z]+)/);
        if (tagMatch) {
          const tag = tagMatch[1].toLowerCase();
          if (html[html.lastIndexOf('<', i) + 1] === '/') {
            // Closing tag
            const lastOpenIndex = tagStack.lastIndexOf(tag);
            if (lastOpenIndex !== -1) {
              tagStack.splice(lastOpenIndex, 1);
            }
          } else {
            // Opening tag (skip self-closing tags like <br/>)
            if (!html.substring(html.lastIndexOf('<', i), i + 1).includes('/>')) {
              tagStack.push(tag);
            }
          }
        }
      } else {
        truncated += char;
        if (!inTag) {
          textLength++;
        }
      }
    }
    
    // Close any remaining open tags
    while (tagStack.length > 0) {
      const tag = tagStack.pop();
      truncated += `</${tag}>`;
    }
    
    return { truncated: truncated + '...', isTruncated: true };
  };

  // Check if content is likely HTML (contains HTML tags)
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  
  const displayContent = isExpanded ? content : (() => {
    if (isHtml) {
      return truncateHtml(content, maxLength).truncated;
    } else {
      return content.length > maxLength 
        ? content.substring(0, maxLength) + '...'
        : content;
    }
  })();

  const isTruncated = isHtml 
    ? truncateHtml(content, maxLength).isTruncated
    : content.length > maxLength;

  const lineClampStyle = !isExpanded ? {
    display: '-webkit-box',
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  } : {};

  return (
    <div className={cn('text-sm text-gray-600 dark:text-gray-400', className)}>
      {isHtml ? (
        <div
          className={cn(
            'rich-content',
            '[&>*]:text-inherit',
            '[&_strong]:font-semibold [&_strong]:text-gray-900 dark:[&_strong]:text-gray-100',
            '[&_em]:italic',
            '[&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-gray-900 dark:[&_h1]:text-gray-100',
            '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-900 dark:[&_h2]:text-gray-100',
            '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-gray-900 dark:[&_h3]:text-gray-100',
            '[&_ul]:list-disc [&_ul]:pl-4',
            '[&_ol]:list-decimal [&_ol]:pl-4',
            '[&_li]:mb-1',
            '[&_p]:mb-2 last:[&_p]:mb-0',
            '[&_br]:leading-4'
          )}
          style={lineClampStyle}
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      ) : (
        <p 
          className="text-sm"
          style={lineClampStyle}
        >
          {displayContent}
        </p>
      )}
      
      {showReadMore && isTruncated && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs mt-1 underline"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}