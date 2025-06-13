'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { objectiveService } from '@/lib/supabase/objectives';
import type { Objective } from '@/types/database';
import { 
  ArrowLeft, 
  Edit, 
  Target, 
  Clock, 
  Users, 
  BookOpen, 
  CheckCircle2,
  Award,
  Tag
} from 'lucide-react';

export default function ObjectiveDetailPage() {
  const router = useRouter();
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
      router.push('/objectives');
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
          The objective you're looking for doesn't exist.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push('/objectives')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Objectives
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/objectives')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {objective.title}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              {objective.bloom_level && (
                <Badge variant="secondary">
                  {objective.bloom_level.charAt(0).toUpperCase() + objective.bloom_level.slice(1)}
                </Badge>
              )}
              {objective.measurable && (
                <Badge variant="outline">
                  Measurable
                </Badge>
              )}
              {objective.is_template && (
                <Badge variant="outline">
                  Template
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/objectives/${objective.id}/edit`)}
          leftIcon={<Edit className="h-4 w-4" />}
        >
          Edit Objective
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <Card.Content className="p-6">
              <div className="flex items-center mb-4">
                <Target className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold">Description</h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {objective.description}
              </p>
            </Card.Content>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <Card.Content className="p-6">
              <h3 className="font-semibold mb-4">Quick Information</h3>
              <div className="space-y-4">
                {objective.bloom_level && (
                  <div className="flex items-center">
                    <Target className="h-4 w-4 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Bloom's Taxonomy</p>
                      <Badge variant="secondary" size="sm">
                        {objective.bloom_level.charAt(0).toUpperCase() + objective.bloom_level.slice(1)}
                      </Badge>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Measurable</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {objective.measurable ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                {objective.category && (
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Category</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {objective.category.name}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Type</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {objective.is_template ? 'Template Objective' : 'Custom Objective'}
                    </p>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Tags */}
          {objective.tags && objective.tags.length > 0 && (
            <Card>
              <Card.Content className="p-6">
                <div className="flex items-center mb-3">
                  <Tag className="h-4 w-4 text-gray-500 mr-2" />
                  <h3 className="font-semibold">Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {objective.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Usage Information */}
          <Card>
            <Card.Content className="p-6">
              <h3 className="font-semibold mb-3">Usage & Integration</h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <p>This objective can be:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Added to course planning</li>
                  <li>• Assigned to individual lessons</li>
                  <li>• Used as a template for similar objectives</li>
                  <li>• Tracked for assessment purposes</li>
                </ul>
              </div>
            </Card.Content>
          </Card>

          {/* Metadata */}
          <Card>
            <Card.Content className="p-6">
              <h3 className="font-semibold mb-3">Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Created:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    {new Date(objective.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    {new Date(objective.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}