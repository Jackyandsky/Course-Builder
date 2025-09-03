'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote,
  Link,
  FileText,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image
} from 'lucide-react';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
  required?: boolean;
  minHeight?: number;
  maxHeight?: number;
  allowPdfEmbed?: boolean;
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Enter content...',
  className,
  disabled = false,
  label,
  error,
  required = false,
  minHeight = 200,
  maxHeight = 600,
  allowPdfEmbed = true
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Handle keyboard events for Word-like deletion of PDFs
  useEffect(() => {
    if (!editorRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Delete or Backspace key is pressed
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        
        // Check if we have a PDF embed selected
        if (range.collapsed === false) {
          // Something is selected - check if it's a PDF embed
          const commonAncestor = range.commonAncestorContainer;
          const pdfEmbed = commonAncestor.nodeType === Node.ELEMENT_NODE 
            ? (commonAncestor as Element).closest('.pdf-embed-wrapper')
            : (commonAncestor.parentElement?.closest('.pdf-embed-wrapper'));
          
          if (pdfEmbed) {
            // Delete the PDF embed
            e.preventDefault();
            pdfEmbed.remove();
            handleContentChange();
            return;
          }
        } else {
          // Nothing selected - check if cursor is adjacent to a PDF embed
          const container = range.startContainer;
          const offset = range.startOffset;
          
          // Get the parent element
          const parentEl = container.nodeType === Node.TEXT_NODE 
            ? container.parentElement 
            : container as Element;
          
          if (parentEl && editorRef.current?.contains(parentEl)) {
            // Check for PDF embed immediately before (for Backspace) or after (for Delete) cursor
            let targetEmbed: Element | null = null;
            
            if (e.key === 'Backspace' && offset === 0) {
              // Check for PDF embed before cursor
              const prevSibling = container.nodeType === Node.TEXT_NODE
                ? container.previousSibling
                : (container as Element).childNodes[offset - 1];
              
              if (prevSibling && prevSibling.nodeType === Node.ELEMENT_NODE) {
                const element = prevSibling as Element;
                if (element.classList?.contains('pdf-embed-wrapper')) {
                  targetEmbed = element;
                }
              }
            } else if (e.key === 'Delete') {
              // Check for PDF embed after cursor
              const nextSibling = container.nodeType === Node.TEXT_NODE
                ? container.nextSibling
                : (container as Element).childNodes[offset];
              
              if (nextSibling && nextSibling.nodeType === Node.ELEMENT_NODE) {
                const element = nextSibling as Element;
                if (element.classList?.contains('pdf-embed-wrapper')) {
                  targetEmbed = element;
                }
              }
            }
            
            if (targetEmbed) {
              e.preventDefault();
              targetEmbed.remove();
              handleContentChange();
            }
          }
        }
      }
    };

    const editor = editorRef.current;
    editor.addEventListener('keydown', handleKeyDown);
    
    return () => {
      editor.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      handleCommand('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  const embedPdf = () => {
    if (pdfUrl && editorRef.current) {
      // Ensure the URL is properly formatted
      let formattedUrl = pdfUrl.trim();
      
      // If it's a Google Drive link, convert to embed format
      if (formattedUrl.includes('drive.google.com')) {
        // Convert Google Drive share link to embed link
        const fileIdMatch = formattedUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (fileIdMatch) {
          formattedUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
        }
      }
      
      // In edit mode, preserve page parameters but don't add toolbar parameters
      // These will be added automatically in view mode
      
      // Generate unique ID for this PDF embed
      const embedId = `pdf-embed-${Date.now()}`;
      
      // Create wrapper with delete button at bottom right (visible on hover only)
      // The wrapper is contenteditable="false" but has tabindex to be selectable
      const embedHtml = `<div id="${embedId}" class="pdf-embed-wrapper" contenteditable="false" tabindex="0" data-pdf-embed="true" style="position: relative; margin: 20px 0; outline: none;" onmouseover="this.querySelector('button').style.opacity='1'" onmouseout="this.querySelector('button').style.opacity='0'">
        <button 
          onclick="this.parentElement.remove()" 
          contenteditable="false"
          style="position: absolute; bottom: 10px; right: 10px; z-index: 10; background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; opacity: 0; transition: opacity 0.2s ease;"
          onmouseover="this.style.background='#dc2626'"
          onmouseout="this.style.background='#ef4444'"
          title="Remove PDF"
        >✕ Remove</button>
        <div class="pdf-embed">
          <iframe 
            src="${formattedUrl}" 
            width="100%" 
            height="600" 
            style="border: 1px solid #ddd; border-radius: 8px;"
            frameborder="0"
            allowfullscreen="true"
            title="PDF Document"
          ></iframe>
          <p style="text-align: center; color: #666; font-size: 14px; margin-top: 8px;">
            <a href="${pdfUrl}" target="_blank" style="color: #3b82f6;">Open PDF in new tab</a>
          </p>
        </div>
      </div>`;
      
      // Focus the editor first to ensure we have a selection
      editorRef.current.focus();
      
      // Get current selection/cursor position
      const selection = window.getSelection();
      if (!selection) return;
      
      // Use execCommand to insert HTML at cursor position (more reliable)
      document.execCommand('insertHTML', false, embedHtml);
      
      // After insertion, set up keyboard handling for the newly inserted element
      setTimeout(() => {
        const insertedElement = document.getElementById(embedId);
        if (insertedElement) {
          // Make the PDF embed selectable and deletable
          insertedElement.addEventListener('click', (e) => {
            e.stopPropagation();
            // Select the entire PDF embed when clicked
            const range = document.createRange();
            range.selectNode(insertedElement);
            const sel = window.getSelection();
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
            }
          });
        }
      }, 0);
      
      handleContentChange();
      setPdfUrl('');
      setShowPdfDialog(false);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      handleCommand('insertImage', url);
    }
  };

  const formatBlock = (tag: string) => {
    handleCommand('formatBlock', tag);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 p-2 flex flex-wrap gap-1">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
            <button
              type="button"
              onClick={() => formatBlock('h1')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Heading 1"
              disabled={disabled}
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => formatBlock('h2')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Heading 2"
              disabled={disabled}
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => formatBlock('h3')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Heading 3"
              disabled={disabled}
            >
              <Heading3 className="h-4 w-4" />
            </button>
          </div>

          {/* Basic Formatting */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
            <button
              type="button"
              onClick={() => handleCommand('bold')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Bold"
              disabled={disabled}
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleCommand('italic')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Italic"
              disabled={disabled}
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleCommand('underline')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Underline"
              disabled={disabled}
            >
              <Underline className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => formatBlock('pre')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Code"
              disabled={disabled}
            >
              <Code className="h-4 w-4" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
            <button
              type="button"
              onClick={() => handleCommand('justifyLeft')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Align Left"
              disabled={disabled}
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleCommand('justifyCenter')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Align Center"
              disabled={disabled}
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleCommand('justifyRight')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Align Right"
              disabled={disabled}
            >
              <AlignRight className="h-4 w-4" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
            <button
              type="button"
              onClick={() => handleCommand('insertUnorderedList')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Bullet List"
              disabled={disabled}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleCommand('insertOrderedList')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Numbered List"
              disabled={disabled}
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => formatBlock('blockquote')}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Quote"
              disabled={disabled}
            >
              <Quote className="h-4 w-4" />
            </button>
          </div>

          {/* Media */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowLinkDialog(true)}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Insert Link"
              disabled={disabled}
            >
              <Link className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={insertImage}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Insert Image"
              disabled={disabled}
            >
              <Image className="h-4 w-4" />
            </button>
            {allowPdfEmbed && (
              <button
                type="button"
                onClick={() => setShowPdfDialog(true)}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Embed PDF"
                disabled={disabled}
              >
                <FileText className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          className={cn(
            'p-4 focus:outline-none',
            'prose prose-sm max-w-none',
            'dark:prose-invert',
            'text-gray-900 dark:text-gray-100',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ 
            minHeight: `${minHeight}px`, 
            maxHeight: `${maxHeight}px`,
            overflowY: 'auto'
          }}
          onInput={handleContentChange}
          onBlur={handleContentChange}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Embed Dialog */}
      {showPdfDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Embed PDF</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Enter a PDF URL or Google Drive share link
            </p>
            <input
              type="url"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://example.com/document.pdf"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-2"
              autoFocus
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 space-y-1">
              <p>💡 Tips:</p>
              <p>• For PDFs: Add #page=5 to jump to a specific page</p>
              <p>• For Google Drive: Use the shareable link</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPdfDialog(false);
                  setPdfUrl('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={embedPdf}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Embed
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}