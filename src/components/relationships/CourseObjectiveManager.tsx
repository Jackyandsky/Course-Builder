'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { objectiveService } from '@/lib/supabase/objectives';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { 
  Target,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  X
} from 'lucide-react';

interface CourseObjectiveManagerProps {
  courseId: string;
  onUpdate?: () => void;
}

export function CourseObjectiveManager({ courseId, onUpdate }: CourseObjectiveManagerProps) {
  const router = useRouter();
  const [objectives, setObjectives] = useState<any[]>([]);
  const [courseObjectives, setCourseObjectives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allObjectives, courseObjectiveRelations] = await Promise.all([
        objectiveService.getObjectives({}),
        objectiveService.getCourseObjectives(courseId)
      ]);
      
      setObjectives(allObjectives);
      setCourseObjectives(courseObjectiveRelations);
    } catch (error) {
      console.error('Failed to load objectives:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredObjectives = objectives.filter(objective => 
    !courseObjectives.some(co => co.objective.id === objective.id) &&
    (objective.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     objective.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     objective.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleAddObjectives = async () => {
    if (selectedObjectives.length === 0) return;

    setAdding(true);
    try {
      for (const objectiveId of selectedObjectives) {
        await objectiveService.addObjectiveToCourse(courseId, objectiveId, {
          position: courseObjectives.length + selectedObjectives.indexOf(objectiveId)
        });
      }
      
      setShowAddModal(false);
      setSelectedObjectives([]);
      setSearchTerm('');
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to add objectives to course:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveObjective = async (relationId: string) => {
    try {
      await objectiveService.removeObjectiveFromCourse(relationId);
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to remove objective from course:', error);
    }
  };

  const toggleObjectiveSelection = (objectiveId: string) => {
    setSelectedObjectives(prev => 
      prev.includes(objectiveId)
        ? prev.filter(id => id !== objectiveId)
        : [...prev, objectiveId]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Target className="h-5 w-5" />
            Course Objectives
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {courseObjectives.length} objective{courseObjectives.length !== 1 ? 's' : ''} assigned to this course
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Objectives
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/objectives/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create New
          </Button>
        </div>
      </div>

      {/* Course Objectives List */}
      {courseObjectives.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No objectives assigned
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Add learning objectives to help students understand what they will achieve
          </p>
          <Button 
            className="mt-4" 
            size="sm"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Objectives
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {courseObjectives
            .sort((a, b) => a.position - b.position)
            .map((courseObjective) => (
              <Card key={courseObjective.id} className="hover:shadow-md transition-shadow">
                <Card.Content className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-lg">
                          {courseObjective.objective.title}
                        </h4>
                        {courseObjective.objective.category && (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: courseObjective.objective.category.color ? `${courseObjective.objective.category.color}20` : undefined,
                              color: courseObjective.objective.category.color || undefined,
                            }}
                          >
                            {courseObjective.objective.category.name}
                          </span>
                        )}
                      </div>
                      
                      {courseObjective.objective.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {courseObjective.objective.description}
                        </p>
                      )}
                      
                      {courseObjective.objective.tags && courseObjective.objective.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {courseObjective.objective.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/objectives/${courseObjective.objective.id}/edit`)}
                        leftIcon={<ExternalLink className="h-4 w-4" />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveObjective(courseObjective.id)}
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
        </div>
      )}

      {/* Add Objectives Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedObjectives([]);
          setSearchTerm('');
        }}
        title="Add Objectives to Course"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Search objectives..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredObjectives.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No objectives found matching your search.' : 'All available objectives are already added to this course.'}
              </div>
            ) : (
              filteredObjectives.map((objective) => (
                <div
                  key={objective.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedObjectives.includes(objective.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => toggleObjectiveSelection(objective.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedObjectives.includes(objective.id)}
                      onChange={() => toggleObjectiveSelection(objective.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium">{objective.title}</h5>
                        {objective.category && (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: objective.category.color ? `${objective.category.color}20` : undefined,
                              color: objective.category.color || undefined,
                            }}
                          >
                            {objective.category.name}
                          </span>
                        )}
                      </div>
                      {objective.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {objective.description}
                        </p>
                      )}
                      {objective.tags && objective.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {objective.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">
            {selectedObjectives.length} objective{selectedObjectives.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setSelectedObjectives([]);
                setSearchTerm('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddObjectives}
              disabled={selectedObjectives.length === 0 || adding}
              leftIcon={adding ? <Spinner size="sm" /> : <Plus className="h-4 w-4" />}
            >
              {adding ? 'Adding...' : `Add ${selectedObjectives.length} Objective${selectedObjectives.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}