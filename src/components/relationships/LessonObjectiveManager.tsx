'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SearchBox } from '@/components/ui/SearchBox'
import { Badge } from '@/components/ui/Badge'
import { lessonRelationshipService } from '@/lib/services/relationships'
import { objectiveService } from '@/lib/supabase/objectives'
import { Target, Loader2, X, Plus } from 'lucide-react'

interface LessonObjectiveManagerProps {
  lessonId: string
  onUpdate?: () => void
}

export function LessonObjectiveManager({ lessonId, onUpdate }: LessonObjectiveManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([])
  const [lessonObjectives, setLessonObjectives] = useState<any[]>([])
  const [availableObjectives, setAvailableObjectives] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingObjectives, setLoadingObjectives] = useState(false)

  // Load lesson objectives
  const loadLessonObjectives = useCallback(async () => {
    try {
      const content = await lessonRelationshipService.getLessonContent(lessonId)
      setLessonObjectives(content?.objectives || [])
    } catch (error) {
      console.error('Failed to load lesson objectives:', error)
    }
  }, [lessonId])

  // Load available objectives with search
  const loadAvailableObjectives = useCallback(async (search = '') => {
    setLoadingObjectives(true)
    try {
      const objectives = await objectiveService.getObjectives()
      
      // Filter out objectives already in the lesson
      const lessonObjectiveIds = lessonObjectives.map(lo => lo.objective_id)
      let available = objectives.filter(obj => !lessonObjectiveIds.includes(obj.id))
      
      // Apply search filter
      if (search.trim()) {
        const searchLower = search.toLowerCase()
        available = available.filter(obj => 
          obj.title?.toLowerCase().includes(searchLower) ||
          obj.description?.toLowerCase().includes(searchLower)
        )
      }
      
      setAvailableObjectives(available)
    } catch (error) {
      console.error('Failed to load available objectives:', error)
    } finally {
      setLoadingObjectives(false)
    }
  }, [lessonObjectives])

  // Initial load
  useEffect(() => {
    loadLessonObjectives()
  }, [lessonId, loadLessonObjectives])

  // Open modal
  const openModal = () => {
    setIsModalOpen(true)
    setSelectedObjectives([])
    setSearchQuery('')
  }

  // Debounced search handler
  useEffect(() => {
    if (!isModalOpen) return
    
    const timeoutId = setTimeout(() => {
      loadAvailableObjectives(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, isModalOpen, loadAvailableObjectives])

  // Add selected objectives to lesson
  const handleAddObjectives = async () => {
    if (selectedObjectives.length === 0) return

    setLoading(true)
    try {
      await lessonRelationshipService.bulkAddObjectivesToLesson(lessonId, selectedObjectives)
      await loadLessonObjectives()
      onUpdate?.()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to add objectives:', error)
      alert('Failed to add objectives. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Remove objective from lesson
  const handleRemoveObjective = async (objectiveId: string) => {
    if (!confirm('Are you sure you want to remove this objective?')) return

    try {
      await lessonRelationshipService.removeObjectiveFromLesson(lessonId, objectiveId)
      await loadLessonObjectives()
      onUpdate?.()
    } catch (error) {
      console.error('Failed to remove objective:', error)
      alert('Failed to remove objective. Please try again.')
    }
  }

  // Toggle objective selection
  const toggleObjectiveSelection = (objectiveId: string) => {
    if (selectedObjectives.includes(objectiveId)) {
      setSelectedObjectives(selectedObjectives.filter(id => id !== objectiveId))
    } else {
      setSelectedObjectives([...selectedObjectives, objectiveId])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Target className="h-5 w-5" />
          Lesson Objectives
        </h3>
        <Button size="sm" onClick={openModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Objectives
        </Button>
      </div>

      {lessonObjectives.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Target className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No objectives added to this lesson yet.</p>
          <Button onClick={openModal} size="sm" className="mt-3">
            Add First Objective
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {lessonObjectives.map((item) => (
            <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex-1">
                <h4 className="font-medium">{item.objective?.title}</h4>
                {item.objective?.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.objective.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {item.objective?.bloom_level && (
                    <Badge variant="outline" size="sm">
                      {item.objective.bloom_level}
                    </Badge>
                  )}
                  {item.objective?.category && (
                    <Badge variant="secondary" size="sm">
                      {item.objective.category}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveObjective(item.objective_id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Objectives to Lesson"
        size="lg"
      >
        <div className="space-y-4">
          <SearchBox
            value={searchQuery}
            onSearch={setSearchQuery}
            placeholder="Search objectives..."
          />

          {loadingObjectives ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : availableObjectives.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              {searchQuery ? 'No objectives found matching your search.' : 'No available objectives to add.'}
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableObjectives.map((objective) => (
                <div
                  key={objective.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedObjectives.includes(objective.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => toggleObjectiveSelection(objective.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedObjectives.includes(objective.id)}
                      onChange={() => {}}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <h5 className="font-medium">{objective.title}</h5>
                      {objective.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {objective.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {objective.bloom_level && (
                          <Badge variant="outline" size="sm">{objective.bloom_level}</Badge>
                        )}
                        {objective.category && (
                          <Badge variant="secondary" size="sm">{objective.category}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center border-t pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedObjectives.length} objective{selectedObjectives.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddObjectives}
                disabled={selectedObjectives.length === 0 || loading}
                loading={loading}
              >
                Add Objectives
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}