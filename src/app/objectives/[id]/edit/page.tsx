'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ObjectiveForm } from '@/components/objectives/ObjectiveForm';
import { objectiveService } from '@/lib/supabase/objectives';
import { Spinner } from '@/components/ui/Spinner';
import type { Objective } from '@/types/database';

export default function EditObjectivePage() {
  const params = useParams();
  const objectiveId = params.id as string;
  
  const [objective, setObjective] = useState<Objective | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (objectiveId) {
      loadObjective();
    }
  }, [objectiveId]);

  const loadObjective = async () => {
    try {
      const data = await objectiveService.getObjective(objectiveId);
      setObjective(data);
    } catch (error) {
      console.error('Failed to load objective:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!objective) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Objective not found
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          The objective you're trying to edit doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <ObjectiveForm objective={objective} />
    </div>
  );
}