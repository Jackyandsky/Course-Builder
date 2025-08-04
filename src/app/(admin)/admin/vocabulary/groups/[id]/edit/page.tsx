'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { VocabularyGroup } from '@/types/database';
import { 
  Button, Card 
} from '@/components/ui';
import { VocabularyGroupForm } from '@/components/vocabulary';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EditVocabularyGroupPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [group, setGroup] = useState<VocabularyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const groupId = params.id as string;

  useEffect(() => {
    if (groupId) {
      loadGroup();
    }
  }, [groupId]);

  const loadGroup = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vocabulary_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      setGroup(data);
    } catch (error) {
      console.error('Failed to load vocabulary group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: Omit<VocabularyGroup, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('vocabulary_groups')
        .update(formData)
        .eq('id', groupId);

      if (error) throw error;
      router.push(`/admin/vocabulary/groups/${groupId}`);
    } catch (error) {
      console.error('Failed to update vocabulary group:', error);
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

  if (!group) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Vocabulary Group Not Found</h1>
          <p className="mt-2 text-gray-600">The vocabulary group you're trying to edit doesn't exist.</p>
          <Button
            className="mt-4"
            onClick={() => router.push('/admin/vocabulary/groups')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Groups
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
            onClick={() => router.push(`/admin/vocabulary/groups/${groupId}`)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Vocabulary Group</h1>
            <p className="mt-1 text-sm text-gray-600">
              Update the details of "{group.name}"
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <Card.Content className="p-6">
          <VocabularyGroupForm
            initialData={group}
            onSave={handleSave}
            isLoading={saving}
            onCancel={() => router.push(`/admin/vocabulary/groups/${groupId}`)}
          />
        </Card.Content>
      </Card>
    </div>
  );
}