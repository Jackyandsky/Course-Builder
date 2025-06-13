'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, X, Target, GripVertical } from 'lucide-react';
import { Button, Input, Modal, Badge, Card } from '@/components/ui';
import { objectiveService } from '@/lib/supabase/objectives';
import { courseObjectiveService, CourseObjective } from '@/lib/supabase/course-objectives';
import type { Objective } from '@/types/database';
import { cn } from '@/lib/utils';

interface ObjectiveSelectorProps {
  courseId?: string;
  selectedObjectives: CourseObjective[];
  onObjectivesChange: (objectives: CourseObjective[]) => void;
  disabled?: boolean;
}

export function ObjectiveSelector({ 
  courseId, 
  selectedObjectives, 
  onObjectivesChange, 
  disabled 
}: ObjectiveSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableObjectives, setAvailableObjectives] = useState<Objective[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      loadAvailableObjectives();
    }
  }, [isModalOpen]);

  const loadAvailableObjectives = async () => {
    try {
      setLoading(true);
      const objectives = await objectiveService.getObjectives({});
      // Filter out already selected objectives
      const selectedIds = selectedObjectives.map(co => co.objective_id);
      const available = objectives.filter(obj => !selectedIds.includes(obj.id));
      setAvailableObjectives(available);
    } catch (error) {
      console.error('Failed to load objectives:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredObjectives = availableObjectives.filter(obj => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      obj.title.toLowerCase().includes(query) ||
      (obj.description && obj.description.toLowerCase().includes(query)) ||
      (obj.tags && obj.tags.some(tag => tag.toLowerCase().includes(query))) ||
      (obj.bloom_level && obj.bloom_level.toLowerCase().includes(query))
    );
  });

  const handleAddObjective = async (objective: Objective) => {
    try {
      if (courseId) {
        // If course exists, add to database
        const courseObjective = await courseObjectiveService.addObjectiveToCourse({
          course_id: courseId,
          objective_id: objective.id,
        });
        onObjectivesChange([...selectedObjectives, courseObjective]);
      } else {
        // If course doesn't exist yet, just add to local state
        const tempCourseObjective: CourseObjective = {
          id: `temp-${Date.now()}`,
          course_id: courseId || '',
          objective_id: objective.id,
          position: selectedObjectives.length,
          created_at: new Date().toISOString(),
          objective,
        };
        onObjectivesChange([...selectedObjectives, tempCourseObjective]);
      }
      
      // Remove from available objectives
      setAvailableObjectives(prev => prev.filter(obj => obj.id !== objective.id));
    } catch (error) {
      console.error('Failed to add objective:', error);
    }
  };

  const handleRemoveObjective = async (courseObjectiveId: string, objectiveId: string) => {
    try {
      if (courseId && !courseObjectiveId.startsWith('temp-')) {
        // If course exists and this is a real relationship, remove from database
        await courseObjectiveService.removeObjectiveFromCourse(courseId, objectiveId);
      }
      
      // Remove from selected objectives
      const updatedObjectives = selectedObjectives.filter(co => co.id !== courseObjectiveId);
      onObjectivesChange(updatedObjectives);
      
      // Add back to available objectives if modal is open
      if (isModalOpen) {
        const removedObjective = selectedObjectives.find(co => co.id === courseObjectiveId)?.objective;
        if (removedObjective) {
          setAvailableObjectives(prev => [...prev, removedObjective]);
        }
      }
    } catch (error) {
      console.error('Failed to remove objective:', error);
    }
  };

  const handleReorderObjectives = async (reorderedObjectives: CourseObjective[]) => {
    try {
      if (courseId) {
        // Update positions in database
        const objectiveIds = reorderedObjectives.map(co => co.objective_id);
        await courseObjectiveService.reorderCourseObjectives(courseId, objectiveIds);
      }
      onObjectivesChange(reorderedObjectives);
    } catch (error) {
      console.error('Failed to reorder objectives:', error);
    }
  };

  const moveObjective = (fromIndex: number, toIndex: number) => {
    const reordered = [...selectedObjectives];
    const [movedItem] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedItem);
    
    // Update positions
    const updatedObjectives = reordered.map((obj, index) => ({
      ...obj,
      position: index,
    }));
    
    handleReorderObjectives(updatedObjectives);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Course Objectives
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          disabled={disabled}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Objective
        </Button>
      </div>

      {selectedObjectives.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No objectives selected</p>
          <p className="text-sm">Add objectives to define what students will achieve</p>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedObjectives
            .sort((a, b) => a.position - b.position)
            .map((courseObjective, index) => (
              <Card key={courseObjective.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="cursor-move text-gray-400 hover:text-gray-600"
                      onMouseDown={() => {
                        // Simple drag implementation - could be enhanced with react-beautiful-dnd
                      }}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium text-gray-500 min-w-[1.5rem]">
                      {index + 1}.
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {courseObjective.objective?.title}
                    </h4>
                    {courseObjective.objective?.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {courseObjective.objective.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {courseObjective.objective?.bloom_level && (
                        <Badge variant="secondary" size="sm">
                          {courseObjective.objective.bloom_level}
                        </Badge>
                      )}
                      {courseObjective.objective?.measurable && (
                        <Badge variant="outline" size="sm">
                          Measurable
                        </Badge>
                      )}
                      {courseObjective.objective?.tags?.slice(0, 2).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveObjective(courseObjective.id, courseObjective.objective_id)}
                    disabled={disabled}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* Add Objectives Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Add Objectives"
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search objectives..."
              className="pl-10"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading objectives...</p>
              </div>
            ) : filteredObjectives.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No objectives found</p>
                {searchQuery && (
                  <p className="text-sm">Try adjusting your search terms</p>
                )}
              </div>
            ) : (
              filteredObjectives.map((objective) => (
                <Card key={objective.id} className="p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {objective.title}
                      </h4>
                      {objective.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {objective.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {objective.bloom_level && (
                          <Badge variant="secondary" size="sm">
                            {objective.bloom_level}
                          </Badge>
                        )}
                        {objective.measurable && (
                          <Badge variant="outline" size="sm">
                            Measurable
                          </Badge>
                        )}
                        {objective.is_template && (
                          <Badge variant="outline" size="sm">
                            Template
                          </Badge>
                        )}
                        {objective.tags?.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddObjective(objective)}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Add
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}