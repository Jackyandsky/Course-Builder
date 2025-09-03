'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  PencilIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';

interface Sentence {
  id?: string;
  function: string;
  text: string;
  position_order?: number;
}

interface Paragraph {
  id?: string;
  type: string;
  position_order?: number;
  sentences: Sentence[];
}

interface Essay {
  id: string;
  title: string;
  book_id: string;
  book_title: string;
  book_author: string;
  thesis_statement: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_published: boolean;
  word_count: number;
  created_at: string;
  updated_at: string;
  paragraphs: Paragraph[];
}

const paragraphTypes = [
  { type: 'introduction', label: 'Introduction', position: 1 },
  { type: 'body1', label: 'Body Paragraph 1', position: 2 },
  { type: 'body2', label: 'Body Paragraph 2', position: 3 },
  { type: 'body3', label: 'Body Paragraph 3', position: 4 },
  { type: 'conclusion', label: 'Conclusion', position: 5 }
];

const getSentenceLabel = (func: string): string => {
  const labels: { [key: string]: string } = {
    'hook': 'Hook',
    'lead-in': 'Lead-in',
    'thesis': 'Thesis',
    'elaboration': 'Elaboration',
    'roadmap': 'Roadmap',
    'topic': 'Topic Sentence',
    'evidence': 'Evidence/Quote',
    'interpretation': 'Interpretation',
    'transition': 'Transition',
    'implication': 'Implication',
    'restatement': 'Restatement',
    'summary': 'Summary',
    'closing': 'Closing Thought',
    'universality': 'Universality',
    'resonance': 'Resonance'
  };
  return labels[func] || func;
};

export default function ViewEssayPage() {
  const router = useRouter();
  const params = useParams();
  const essayId = params.id as string;
  
  const [essay, setEssay] = useState<Essay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadEssay();
  }, [essayId]);

  const loadEssay = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/essays/${essayId}`);
      if (response.ok) {
        const data = await response.json();
        setEssay(data);
      } else {
        setError('Failed to load essay');
      }
    } catch (error) {
      console.error('Failed to load essay:', error);
      setError('An error occurred while loading the essay');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/essays?id=${essayId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        router.push('/admin/tools/essay-builder');
      } else {
        setError('Failed to delete essay');
      }
    } catch (error) {
      console.error('Failed to delete essay:', error);
      setError('An error occurred while deleting the essay');
    }
  };

  const handleCopy = async () => {
    if (!essay) return;
    
    try {
      // Format the essay content for copying
      let essayText = `${essay.title}\n\n`;
      essayText += `Book: ${essay.book_title}${essay.book_author ? ' by ' + essay.book_author : ''}\n`;
      essayText += `Thesis: ${essay.thesis_statement}\n\n`;
      
      // Add paragraphs
      if (essay.paragraphs && essay.paragraphs.length > 0) {
        essay.paragraphs.forEach((paragraph) => {
          const paragraphType = paragraph.type || '';
          const label = paragraphType.charAt(0).toUpperCase() + paragraphType.slice(1).replace(/\d+/, ' $&');
          essayText += `${label}:\n`;
          
          if (paragraph.sentences && paragraph.sentences.length > 0) {
            paragraph.sentences.forEach((sentence) => {
              if (sentence.text) {
                essayText += `${sentence.text} `;
              }
            });
            essayText += '\n\n';
          }
        });
      }
      
      // Copy to clipboard
      await navigator.clipboard.writeText(essayText);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy essay:', error);
      setError('Failed to copy essay to clipboard');
      
      // Fallback for clipboard access issues
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setError('Clipboard access denied. Please enable clipboard permissions.');
      }
    }
  };

  const handlePublishToggle = async () => {
    if (!essay) return;
    
    try {
      const response = await fetch(`/api/essays/${essayId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_published: !essay.is_published
        })
      });
      
      if (response.ok) {
        setEssay({ ...essay, is_published: !essay.is_published });
      } else {
        setError('Failed to update publish status');
      }
    } catch (error) {
      console.error('Failed to update publish status:', error);
      setError('An error occurred while updating publish status');
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading essay...</p>
        </div>
      </div>
    );
  }

  if (error || !essay) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold">Error Loading Essay</h2>
          <p className="mt-2 text-gray-600">{error || 'Essay not found'}</p>
          <Link href="/admin/tools/essay-builder" className="mt-4 inline-block">
            <Button>Back to Essay List</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/tools/essay-builder" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Essay List
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{essay.title}</h1>
            <div className="mt-2 flex items-center gap-4">
              <span className="text-sm text-gray-600">
                <strong>Book:</strong> {essay.book_title} by {essay.book_author}
              </span>
              <Badge className={getDifficultyColor(essay.difficulty_level)}>
                {essay.difficulty_level}
              </Badge>
              {essay.is_published ? (
                <Badge className="bg-green-100 text-green-700">Published</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-700">Draft</Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link href={`/admin/tools/essay-builder/${essayId}/edit`}>
              <Button variant="outline" size="sm">
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCopy}
            >
              <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePublishToggle}
            >
              {essay.is_published ? (
                <>
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Unpublish
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Essay copied to clipboard successfully!
          </p>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 mb-3">
            Are you sure you want to delete this essay? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Yes, Delete
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Essay Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-gray-600">Word Count</span>
            <p className="text-2xl font-semibold">{essay.word_count || 0}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Paragraphs</span>
            <p className="text-2xl font-semibold">{essay.paragraphs?.length || 0}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Sentences</span>
            <p className="text-2xl font-semibold">
              {essay.paragraphs?.reduce((total, p) => total + (p.sentences?.length || 0), 0) || 0}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Created</span>
            <p className="text-sm font-medium">
              {essay.created_at ? new Date(essay.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Thesis Statement */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Thesis Statement</h2>
        <p className="text-gray-700 italic">{essay.thesis_statement}</p>
      </div>

      {/* Essay Content */}
      <div className="space-y-6">
        {essay.paragraphs?.map((paragraph, pIndex) => (
          <div key={pIndex} className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {paragraphTypes.find(pt => 
                pt.type === paragraph.type || 
                pt.position === paragraph.position_order || 
                pt.position === pIndex + 1
              )?.label || `Paragraph ${pIndex + 1}`}
            </h3>
            
            <div className="space-y-3">
              {paragraph.sentences?.map((sentence, sIndex) => (
                <div key={sIndex} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {getSentenceLabel(sentence.function)}
                    </span>
                  </div>
                  <p className="text-gray-700">
                    {sentence.text || <span className="text-gray-400 italic">No content</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}