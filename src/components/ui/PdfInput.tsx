'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { FileText, Loader2 } from 'lucide-react';

interface PdfInputProps {
  url: string;
  page: number;
  hideToolbar: boolean;
  onUrlChange: (url: string) => void;
  onPageChange: (page: number) => void;
  onHideToolbarChange: (hide: boolean) => void;
  className?: string;
}

export function PdfInput({
  url,
  page,
  hideToolbar,
  onUrlChange,
  onPageChange,
  onHideToolbarChange,
  className
}: PdfInputProps) {
  const [maxPages, setMaxPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (url) {
      validatePdfUrl(url);
    } else {
      setMaxPages(null);
      setUrlError(null);
    }
  }, [url]);

  const validatePdfUrl = async (pdfUrl: string) => {
    setLoading(true);
    setUrlError(null);
    
    try {
      // Convert Google Drive links to preview format
      let processedUrl = pdfUrl;
      if (pdfUrl.includes('drive.google.com')) {
        const fileIdMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (fileIdMatch) {
          processedUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
        } else {
          setUrlError('Invalid Google Drive link format');
          setLoading(false);
          return;
        }
      }
      
      // For direct PDF URLs, validate format
      if (!processedUrl.includes('drive.google.com')) {
        if (!processedUrl.match(/\.pdf(\?|#|$)/i) && !processedUrl.includes('/pdf/')) {
          setUrlError('URL does not appear to be a PDF');
        }
      }
      
      // Note: Getting actual page count requires server-side processing
      // For now, we'll allow any page number
      setMaxPages(null);
      
    } catch (error) {
      console.error('Error validating PDF:', error);
      setUrlError('Failed to validate PDF URL');
    } finally {
      setLoading(false);
    }
  };

  const formatPdfUrl = (pdfUrl: string) => {
    // Convert Google Drive links to embed format
    if (pdfUrl.includes('drive.google.com')) {
      const fileIdMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }
    return pdfUrl;
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-medium">PDF Document (Optional)</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 max-w-xl">
            <label className="block text-sm font-medium text-gray-700 mb-1">PDF URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://example.com/document.pdf or Google Drive link"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              {urlError || "Direct PDF link or Google Drive share link"}
            </p>
          </div>
          
          {url && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Page
                </label>
                <input
                  type="number"
                  value={page}
                  onChange={(e) => {
                    const newPage = parseInt(e.target.value) || 1;
                    onPageChange(Math.max(1, newPage));
                  }}
                  min={1}
                  max={maxPages || undefined}
                  className="w-16 px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center gap-2 self-center">
                <input
                  type="checkbox"
                  id="hide-toolbar"
                  checked={hideToolbar}
                  onChange={(e) => onHideToolbarChange(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="hide-toolbar" className="text-sm text-gray-700 whitespace-nowrap">
                  Hide toolbar
                </label>
              </div>
            </>
          )}
        </div>
        
        {url && !urlError && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">PDF Preview:</p>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              {(() => {
                let previewUrl = formatPdfUrl(url);
                
                // Add parameters for non-Google Drive PDFs
                if (!previewUrl.includes('drive.google.com')) {
                  const params = [];
                  if (page > 1) {
                    params.push(`page=${page}`);
                  }
                  if (hideToolbar) {
                    params.push('toolbar=0', 'navpanes=0', 'scrollbar=0');
                  }
                  if (params.length > 0) {
                    previewUrl = previewUrl + (previewUrl.includes('#') ? '&' : '#') + params.join('&');
                  }
                }
                
                return (
                  <iframe
                    src={previewUrl}
                    className="w-full h-96"
                    title="PDF Preview"
                  />
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}