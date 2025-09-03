'use client';

import { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { UserRole } from '@/types/user-management';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportRow {
  email: string;
  full_name: string;
  role: UserRole;
  grade_level?: number;
  phone?: string;
  parent_email?: string;
  group_codes?: string;
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
}

export default function BulkImportModal({ isOpen, onClose, onImportComplete }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');

  const downloadTemplate = () => {
    const template = `email,full_name,role,grade_level,phone,parent_email,group_codes
john.doe@example.com,John Doe,student,9,+1234567890,parent@example.com,"Math101,Science202"
jane.smith@example.com,Jane Smith,teacher,,,,"Math101,English303"
parent@example.com,Parent Name,parent,,+1234567890,,`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): ImportRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map((line, index) => {
      const values = line.match(/(".*?"|[^,]+)/g) || [];
      const row: any = {};
      
      headers.forEach((header, i) => {
        let value = values[i]?.trim().replace(/^"|"$/g, '') || '';
        
        if (header === 'grade_level' && value) {
          row[header] = parseInt(value);
        } else if (header === 'group_codes' && value) {
          row[header] = value;
        } else {
          row[header] = value;
        }
      });
      
      return row as ImportRow;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    const text = await selectedFile.text();
    const parsed = parseCSV(text);
    setPreview(parsed);
    setStep('preview');
  };

  const handleImport = async () => {
    if (!preview.length) return;

    setLoading(true);
    const results: ImportResult = {
      total: preview.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process users in batches
    const batchSize = 10;
    for (let i = 0; i < preview.length; i += batchSize) {
      const batch = preview.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (user, index) => {
          try {
            const response = await fetch('/api/users/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...user,
                send_invitation: true,
                group_ids: user.group_codes?.split(',').map(code => code.trim()) || []
              }),
            });

            if (response.ok) {
              results.successful++;
            } else {
              const error = await response.json();
              results.failed++;
              results.errors.push({
                row: i + index + 2,
                email: user.email,
                error: error.error || 'Unknown error'
              });
            }
          } catch (error: any) {
            results.failed++;
            results.errors.push({
              row: i + index + 2,
              email: user.email,
              error: error.message || 'Network error'
            });
          }
        })
      );
    }

    setResult(results);
    setStep('result');
    setLoading(false);
    
    if (results.successful > 0) {
      onImportComplete();
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
    setStep('upload');
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Bulk Import Users" 
      className="max-w-4xl"
    >
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload CSV File
            </h3>
            <p className="text-gray-600 mb-6">
              Import multiple users at once from a CSV file
            </p>
            
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Upload className="h-5 w-5" />
              Choose CSV File
            </label>
          </div>

          <Card>
            <Card.Content className="p-6">
              <h4 className="font-medium text-gray-900 mb-3">File Format</h4>
              <p className="text-sm text-gray-600 mb-4">
                Your CSV file should include the following columns:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• <strong>email</strong> (required): User's email address</li>
                <li>• <strong>full_name</strong> (required): User's full name</li>
                <li>• <strong>role</strong> (required): student, teacher, parent, or admin</li>
                <li>• <strong>grade_level</strong> (optional): For students, grade 1-12</li>
                <li>• <strong>phone</strong> (optional): Contact number</li>
                <li>• <strong>parent_email</strong> (optional): For linking students to parents</li>
                <li>• <strong>group_codes</strong> (optional): Comma-separated group codes</li>
              </ul>
              <Button
                variant="secondary"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={downloadTemplate}
              >
                Download Template
              </Button>
            </Card.Content>
          </Card>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Preview Import
            </h3>
            <p className="text-gray-600">
              Found {preview.length} users to import
            </p>
          </div>

          <div className="max-h-96 overflow-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.slice(0, 20).map((user, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{user.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{user.role}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{user.grade_level || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 20 && (
              <div className="px-4 py-3 bg-gray-50 text-sm text-gray-600 text-center">
                And {preview.length - 20} more...
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={loading}
              leftIcon={<Upload className="h-4 w-4" />}
            >
              {loading ? 'Importing...' : `Import ${preview.length} Users`}
            </Button>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-6">
          <div className="text-center py-6">
            {result.successful > 0 ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            ) : (
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Import Complete
            </h3>
            <div className="space-y-1 text-sm">
              <p className="text-green-600">{result.successful} users imported successfully</p>
              {result.failed > 0 && (
                <p className="text-red-600">{result.failed} users failed to import</p>
              )}
            </div>
          </div>

          {result.errors.length > 0 && (
            <Card>
              <Card.Content className="p-4">
                <h4 className="font-medium text-red-900 mb-3">Import Errors</h4>
                <div className="max-h-48 overflow-auto space-y-2">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">Row {error.row} ({error.email}):</span>
                      <span className="text-red-600 ml-2">{error.error}</span>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}