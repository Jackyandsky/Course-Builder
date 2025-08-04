'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Vocabulary } from '@/types/database';
import { 
  Button, Card 
} from '@/components/ui';
import { VocabularyForm } from '@/components/vocabulary';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EditVocabularyPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [vocabulary, setVocabulary] = useState<Vocabulary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const vocabularyId = params.id as string;

  useEffect(() => {
    if (vocabularyId) {
      loadVocabulary();
    }
  }, [vocabularyId]);

  const loadVocabulary = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('id', vocabularyId)
        .single();

      if (error) throw error;
      setVocabulary(data);
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: Omit<Vocabulary, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('vocabulary')
        .update(formData)
        .eq('id', vocabularyId);

      if (error) throw error;
      router.push(`/admin/vocabulary/${vocabularyId}`);
    } catch (error) {
      console.error('Failed to update vocabulary:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!vocabulary) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Vocabulary Word Not Found</h1>
          <p className="mt-2 text-gray-600">The vocabulary word you're trying to edit doesn't exist.</p>
          <Button
            className="mt-4"
            onClick={() => router.push('/admin/vocabulary')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Vocabulary
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/vocabulary/${vocabularyId}`)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Vocabulary Word</h1>
            <p className="mt-1 text-sm text-gray-600">
              Update the details of "{vocabulary.word}"
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <Card.Content className="p-6">
          <VocabularyForm
            initialData={vocabulary}
            onSave={handleSave}
            isLoading={saving}
            onCancel={() => router.push(`/admin/vocabulary/${vocabularyId}`)}
          />
        </Card.Content>
      </Card>
    </div>
  );
}