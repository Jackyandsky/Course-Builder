'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X } from 'lucide-react';

interface DraftNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName?: string;
  isUpdating?: boolean;
}

export const DraftNameModal: React.FC<DraftNameModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultName = '',
  isUpdating = false
}) => {
  const [draftName, setDraftName] = useState(defaultName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraftName(defaultName || 'draft_');
    }
  }, [isOpen, defaultName]);

  const handleSave = async () => {
    if (!draftName.trim()) return;
    
    setLoading(true);
    try {
      await onSave(draftName.trim());
      onClose();
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isUpdating ? 'Update Draft' : 'Save Draft'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <Input
            label="Draft Name"
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="draft_my_essay_name"
            className="w-full"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter a name for your {isUpdating ? 'updated' : 'new'} draft
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !draftName.trim()}
            loading={loading}
          >
            {isUpdating ? 'Update Draft' : 'Save Draft'}
          </Button>
        </div>
      </div>
    </div>
  );
};