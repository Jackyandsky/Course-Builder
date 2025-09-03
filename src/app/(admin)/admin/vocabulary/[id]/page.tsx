'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Volume2 } from 'lucide-react';
import { Vocabulary } from '@/types/database';
import { 
  Button, Card, Badge 
} from '@/components/ui';
import { getMiddlewareSupabaseClient } from '@/lib/supabase/middleware-helper';

export default function VocabularyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = getMiddlewareSupabaseClient();
  const [vocabulary, setVocabulary] = useState<Vocabulary | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async () => {
    if (!vocabulary || !confirm('Are you sure you want to delete this vocabulary word?')) return;

    try {
      const { error } = await supabase
        .from('vocabulary')
        .delete()
        .eq('id', vocabulary.id);

      if (error) throw error;
      router.push('/admin/vocabulary');
    } catch (error) {
      console.error('Failed to delete vocabulary:', error);
    }
  };

  const playAudio = () => {
    if (vocabulary?.audio_url) {
      const audio = new Audio(vocabulary.audio_url);
      audio.play();
    }
  };

  if (!vocabulary && !loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Vocabulary Word Not Found</h1>
          <p className="mt-2 text-gray-600">The vocabulary word you're looking for doesn't exist.</p>
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p>Loading...</p>
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
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/vocabulary')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vocabulary?.word}</h1>
            {vocabulary?.translation && (
              <p className="mt-1 text-lg text-gray-600">{vocabulary.translation}</p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/vocabulary/${vocabularyId}/edit`)}
            leftIcon={<Edit className="h-4 w-4" />}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Word Details */}
      {vocabulary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <Card.Header>
              <Card.Title>Basic Information</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Word</label>
                <div className="mt-1 flex items-center space-x-2">
                  <p className="text-lg font-semibold">{vocabulary.word}</p>
                  {vocabulary.audio_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={playAudio}
                      leftIcon={<Volume2 className="h-4 w-4" />}
                    >
                      Play
                    </Button>
                  )}
                </div>
              </div>

              {vocabulary.translation && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Translation</label>
                  <p className="mt-1">{vocabulary.translation}</p>
                </div>
              )}

              {vocabulary.pronunciation && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Pronunciation</label>
                  <p className="mt-1 font-mono">{vocabulary.pronunciation}</p>
                </div>
              )}

              {vocabulary.part_of_speech && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Part of Speech</label>
                  <p className="mt-1">
                    <Badge variant="secondary">{vocabulary.part_of_speech}</Badge>
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Difficulty</label>
                <p className="mt-1">
                  <Badge variant={vocabulary.difficulty === 'basic' ? 'success' : 
                              vocabulary.difficulty === 'standard' ? 'warning' : 'danger'}>
                    {vocabulary.difficulty}
                  </Badge>
                </p>
              </div>
            </Card.Content>
          </Card>

          {/* Definition and Examples */}
          <Card>
            <Card.Header>
              <Card.Title>Definition & Examples</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              {vocabulary.definition && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Definition</label>
                  <p className="mt-1">{vocabulary.definition}</p>
                </div>
              )}

              {vocabulary.example_sentence && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Example Sentence</label>
                  <p className="mt-1 italic">"{vocabulary.example_sentence}"</p>
                  {vocabulary.example_translation && (
                    <p className="mt-1 text-sm text-gray-600">
                      Translation: "{vocabulary.example_translation}"
                    </p>
                  )}
                </div>
              )}

              {vocabulary.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1">{vocabulary.notes}</p>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Tags and Media */}
      {vocabulary && (vocabulary.tags?.length || vocabulary.image_url) && (
        <Card>
          <Card.Header>
            <Card.Title>Additional Information</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            {vocabulary.tags && vocabulary.tags.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Tags</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {vocabulary.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {vocabulary.image_url && (
              <div>
                <label className="text-sm font-medium text-gray-700">Image</label>
                <div className="mt-2">
                  <img
                    src={vocabulary.image_url}
                    alt={vocabulary.word}
                    className="max-w-xs rounded-lg shadow-md"
                  />
                </div>
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Metadata */}
      {vocabulary && (
        <Card>
          <Card.Header>
            <Card.Title>Metadata</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1">{new Date(vocabulary.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <p className="mt-1">{new Date(vocabulary.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}