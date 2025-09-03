'use client';

import { useState, useCallback } from 'react';
import { Upload, X, File, Image, Video, Music, FileText, Trash2, Download } from 'lucide-react';
import { Button, Spinner } from '@/components/ui';

interface MediaFile {
  id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
}

interface MediaUploadProps {
  taskId: string;
  mediaRequired?: boolean;
  allowedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  existingFiles?: MediaFile[];
  onUploadComplete?: (file: MediaFile) => void;
  onDeleteComplete?: (fileId: string) => void;
  editable?: boolean;
}

export function MediaUpload({
  taskId,
  mediaRequired = false,
  allowedTypes = ['image', 'video', 'audio', 'document'],
  maxFileSize = 200,
  maxFiles = 5,
  existingFiles = [],
  onUploadComplete,
  onDeleteComplete,
  editable = true
}: MediaUploadProps) {
  const [files, setFiles] = useState<MediaFile[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'audio':
        return <Music className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let fileType = 'document';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(fileExtension || '')) {
      fileType = 'image';
    } else if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(fileExtension || '')) {
      fileType = 'video';
    } else if (['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac', 'wma'].includes(fileExtension || '')) {
      fileType = 'audio';
    }

    if (!allowedTypes.includes(fileType)) {
      return `File type ${fileType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }

    // Check file size
    const maxSizeBytes = maxFileSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file count
    if (files.length >= maxFiles) {
      return `Maximum number of files (${maxFiles}) reached`;
    }

    return null;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!editable) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [editable]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    setError(null);
    
    // Validate files
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Upload files one by one
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/tasks/${taskId}/media/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      const newFile: MediaFile = data.file;
      
      setFiles(prev => [...prev, newFile]);
      if (onUploadComplete) {
        onUploadComplete(newFile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}/media/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setFiles(prev => prev.filter(f => f.id !== fileId));
      if (onDeleteComplete) {
        onDeleteComplete(fileId);
      }
    } catch (err) {
      setError('Failed to delete file');
    }
  };

  const downloadFile = (file: MediaFile) => {
    // Create a link to download the file
    const link = document.createElement('a');
    link.href = `/api/media/serve${file.file_path}`;
    link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {editable && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            onChange={handleChange}
            accept={allowedTypes.map(type => {
              switch (type) {
                case 'image': return 'image/*';
                case 'video': return 'video/*';
                case 'audio': return 'audio/*';
                case 'document': return '.pdf,.doc,.docx,.txt,.csv,.xlsx';
                default: return '*';
              }
            }).join(',')}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading || files.length >= maxFiles}
          />
          
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                Uploading...
              </span>
            ) : (
              <>
                Drag and drop files here, or click to select
                {mediaRequired && <span className="text-red-500 ml-1">*</span>}
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {allowedTypes.join(', ').toUpperCase()} files up to {maxFileSize}MB
          </p>
          {files.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {files.length}/{maxFiles} files uploaded
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
          <div className="grid gap-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-500">
                    {getFileIcon(file.file_type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file_size)} • {new Date(file.upload_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(file)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {editable && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteFile(file.id)}
                      title="Delete"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mediaRequired && files.length === 0 && (
        <p className="text-sm text-red-500">
          * At least one file upload is required for this task
        </p>
      )}
    </div>
  );
}