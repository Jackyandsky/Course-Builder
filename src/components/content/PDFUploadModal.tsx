'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Checkbox } from '@/components/ui/Checkbox';
import { useRouter } from 'next/navigation';
import { contentService } from '@/lib/supabase/content';

interface PDFUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId?: number;
  defaultCategory?: string;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function PDFUploadModal({ 
  isOpen, 
  onClose, 
  bookId,
  defaultCategory = 'content' 
}: PDFUploadModalProps) {
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [category, setCategory] = useState(defaultCategory);
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [autoDetectCategory, setAutoDetectCategory] = useState(false);
  const [combineFiles, setCombineFiles] = useState(false);
  const [combinationMethod, setCombinationMethod] = useState<'sequential' | 'merge'>('sequential');
  const [isUploading, setIsUploading] = useState(false);

  // Reset form when modal is closed
  const handleClose = () => {
    setFiles([]);
    setCategory(defaultCategory);
    setAutoDetectCategory(false);
    setCombineFiles(false);
    setCombinationMethod('sequential');
    setIsUploading(false);
    onClose();
  };

  // Load proprietary product categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const proprietaryCategories = await contentService.getProprietaryProductCategories();
        setCategories(proprietaryCategories.map(cat => ({
          id: cat.name.toLowerCase().replace(/\s+/g, '-'),
          name: cat.name
        })));
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: 'pending' as const
      }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    console.log('[PDFUploadModal] Starting upload process');
    console.log('[PDFUploadModal] Files to upload:', files.length);
    console.log('[PDFUploadModal] Category:', category);
    console.log('[PDFUploadModal] Auto-detect category:', autoDetectCategory);
    console.log('[PDFUploadModal] Combine files:', combineFiles);
    
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      if (files.length === 1 || !combineFiles) {
        // Upload individually
        for (const uploadFile of files) {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
          ));

          const formData = new FormData();
          formData.append('file', uploadFile.file);
          formData.append('category', autoDetectCategory ? 'auto' : category);
          if (bookId) {
            formData.append('bookIds', bookId.toString());
          }

          try {
            console.log(`[PDFUploadModal] Uploading file: ${uploadFile.file.name}`);
            console.log('[PDFUploadModal] FormData contents:', {
              file: uploadFile.file.name,
              category: autoDetectCategory ? 'auto' : category,
              bookId: bookId
            });
            
            const response = await fetch('/api/content/upload-pdf', {
              method: 'POST',
              body: formData
            });

            console.log('[PDFUploadModal] Response status:', response.status);
            const result = await response.json();
            console.log('[PDFUploadModal] Response result:', result);

            if (response.ok) {
              console.log(`[PDFUploadModal] Upload successful for ${uploadFile.file.name}`);
              setFiles(prev => prev.map(f => 
                f.id === uploadFile.id ? { ...f, status: 'success' } : f
              ));
            } else {
              console.error(`[PDFUploadModal] Upload failed for ${uploadFile.file.name}:`, result.error);
              setFiles(prev => prev.map(f => 
                f.id === uploadFile.id ? { ...f, status: 'error', error: result.error } : f
              ));
            }
          } catch (error) {
            console.error(`[PDFUploadModal] Exception during upload for ${uploadFile.file.name}:`, error);
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { ...f, status: 'error', error: 'Upload failed' } : f
            ));
          }
        }
      } else {
        // Batch upload with combination
        const formData = new FormData();
        files.forEach(uploadFile => {
          formData.append('files', uploadFile.file);
        });
        formData.append('category', autoDetectCategory ? 'auto' : category);
        formData.append('combinationMethod', combinationMethod);
        if (bookId) {
          formData.append('bookIds', bookId.toString());
        }

        const response = await fetch('/api/content/upload-pdf', {
          method: 'PUT',
          body: formData
        });

        const result = await response.json();

        if (response.ok) {
          setFiles(prev => prev.map(f => ({ ...f, status: 'success' })));
        } else {
          setFiles(prev => prev.map(f => ({ ...f, status: 'error', error: result.error })));
        }
      }

      // Check if all uploads were successful
      const hasErrors = files.some(f => f.status === 'error');
      
      if (!hasErrors) {
        // Clear file list after successful uploads
        console.log('[PDFUploadModal] All uploads successful, clearing file list');
        setTimeout(() => {
          setFiles([]); // Clear the file list
          setAutoDetectCategory(false); // Reset auto-detect
          setCombineFiles(false); // Reset combine files
          setCombinationMethod('sequential'); // Reset combination method
        }, 1500);
      }
      
      // Refresh the page after successful upload
      console.log('[PDFUploadModal] All uploads complete, refreshing in 2 seconds');
      setTimeout(() => {
        console.log('[PDFUploadModal] Refreshing page and closing modal');
        router.refresh();
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('[PDFUploadModal] Global upload error:', error);
      setFiles(prev => prev.map(f => ({ ...f, status: 'error', error: 'Upload failed' })));
    } finally {
      console.log('[PDFUploadModal] Upload process finished');
      setIsUploading(false);
    }
  };

  const allSuccess = files.length > 0 && files.every(f => f.status === 'success');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload PDF Study Materials"
      size="xl"
      className="max-h-[90vh]"
    >
      <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-600">
              {isDragActive
                ? 'Drop the PDF files here...'
                : 'Drag & drop PDF files here, or click to select'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Only PDF files are accepted
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Selected Files ({files.length})</label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {files.map(uploadFile => (
                  <div
                    key={uploadFile.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm truncate">{uploadFile.file.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {uploadFile.status === 'uploading' && (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                      )}
                      {uploadFile.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {uploadFile.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {uploadFile.status === 'pending' && (
                        <button
                          onClick={() => removeFile(uploadFile.id)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Options */}
          {files.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <Select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={autoDetectCategory}
                  options={
                    categories.length > 0 
                      ? categories.map(cat => ({ value: cat.id, label: cat.name }))
                      : [
                          { value: 'decoders', label: 'Decoders' },
                          { value: 'complete-study-packages', label: 'Complete Study Packages' },
                          { value: 'standardizers', label: 'Standardizers' }
                        ]
                  }
                  placeholder="Select a category"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoDetect"
                  checked={autoDetectCategory}
                  onChange={(checked) => setAutoDetectCategory(checked)}
                />
                <label htmlFor="autoDetect" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Auto-detect category from content
                </label>
              </div>

              {files.length > 1 && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="combine"
                      checked={combineFiles}
                      onChange={(checked) => setCombineFiles(checked)}
                    />
                    <label htmlFor="combine" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Combine all files into one content item
                    </label>
                  </div>

                  {combineFiles && (
                    <div className="space-y-2 ml-6">
                      <label htmlFor="combinationMethod" className="block text-sm font-medium text-gray-700 mb-1">Combination Method</label>
                      <Select
                        id="combinationMethod"
                        value={combinationMethod}
                        onChange={(e) => setCombinationMethod(e.target.value as 'sequential' | 'merge')}
                        options={[
                          { value: 'sequential', label: 'Sequential (one after another)' },
                          { value: 'merge', label: 'Merge (combine similar sections)' }
                        ]}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={uploadFiles}
              disabled={files.length === 0 || isUploading || allSuccess}
            >
              {isUploading ? 'Uploading...' : allSuccess ? 'Uploaded!' : 'Upload'}
            </Button>
          </div>
      </div>
    </Modal>
  );
}