'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SearchBox } from '@/components/ui/SearchBox'
import { Badge } from '@/components/ui/Badge'
import { lessonService } from '@/lib/supabase/lessons'
import { vocabularyService } from '@/lib/supabase/vocabulary'
import { Languages, Loader2, X, Plus, BookOpen } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'

interface LessonVocabularyManagerProps {
  lessonId: string
  onUpdate?: () => void
}

export function LessonVocabularyManager({ lessonId, onUpdate }: LessonVocabularyManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [lessonVocabularyGroups, setLessonVocabularyGroups] = useState<any[]>([])
  const [availableGroups, setAvailableGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)

  // Load lesson vocabulary groups
  const loadLessonVocabularyGroups = useCallback(async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('lesson_vocabulary_groups')
        .select(`
          *,
          vocabulary_group:vocabulary_groups(
            *,
            vocabulary_group_items(count)
          )
        `)
        .eq('lesson_id', lessonId)
      
      if (error) throw error
      setLessonVocabularyGroups(data || [])
    } catch (error) {
      console.error('Failed to load lesson vocabulary groups:', error)
    }
  }, [lessonId])

  // Load available vocabulary groups with search
  const loadAvailableGroups = useCallback(async (search = '') => {
    setLoadingGroups(true)
    try {
      const groups = await vocabularyService.getVocabularyGroups({
        search: search.trim()
      })
      
      // Filter out groups already in the lesson
      const lessonGroupIds = lessonVocabularyGroups.map(lvg => lvg.vocabulary_group_id)
      const available = groups.filter(group => !lessonGroupIds.includes(group.id))
      
      setAvailableGroups(available)
    } catch (error) {
      console.error('Failed to load available vocabulary groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }, [lessonVocabularyGroups])

  // Initial load
  useEffect(() => {
    loadLessonVocabularyGroups()
  }, [lessonId, loadLessonVocabularyGroups])

  // Open modal
  const openModal = () => {
    setIsModalOpen(true)
    setSelectedGroups([])
    setSearchQuery('')
  }

  // Debounced search handler
  useEffect(() => {
    if (!isModalOpen) return
    
    const timeoutId = setTimeout(() => {
      loadAvailableGroups(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, isModalOpen, loadAvailableGroups])

  // Add selected vocabulary groups to lesson
  const handleAddGroups = async () => {
    if (selectedGroups.length === 0) return

    setLoading(true)
    try {
      for (const groupId of selectedGroups) {
        await lessonService.addVocabularyGroupToLesson(lessonId, groupId)
      }
      await loadLessonVocabularyGroups()
      onUpdate?.()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to add vocabulary groups:', error)
      alert('Failed to add vocabulary groups. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Remove vocabulary group from lesson
  const handleRemoveGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to remove this vocabulary group?')) return

    try {
      await lessonService.removeVocabularyGroupFromLesson(lessonId, groupId)
      await loadLessonVocabularyGroups()
      onUpdate?.()
    } catch (error) {
      console.error('Failed to remove vocabulary group:', error)
      alert('Failed to remove vocabulary group. Please try again.')
    }
  }

  // Toggle group selection
  const toggleGroupSelection = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId))
    } else {
      setSelectedGroups([...selectedGroups, groupId])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Vocabulary Groups
        </h3>
        <Button size="sm" onClick={openModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vocabulary Groups
        </Button>
      </div>

      {lessonVocabularyGroups.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No vocabulary groups added to this lesson yet.</p>
          <Button onClick={openModal} size="sm" className="mt-3">
            Add First Vocabulary Group
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {lessonVocabularyGroups.map((item) => (
            <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex-1">
                <h4 className="font-medium text-lg">{item.vocabulary_group?.name}</h4>
                {item.vocabulary_group?.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.vocabulary_group.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {item.vocabulary_group?.vocabulary_group_items?.[0]?.count && (
                    <span className="text-sm text-gray-500">
                      <Languages className="h-3 w-3 inline mr-1" />
                      {item.vocabulary_group.vocabulary_group_items[0].count} words
                    </span>
                  )}
                  {item.vocabulary_group?.language && (
                    <Badge variant="outline" size="sm">
                      {item.vocabulary_group.language}
                    </Badge>
                  )}
                  {item.vocabulary_group?.difficulty && (
                    <Badge variant="secondary" size="sm">
                      {item.vocabulary_group.difficulty}
                    </Badge>
                  )}
                </div>
                {item.notes && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                    Note: {item.notes}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveGroup(item.vocabulary_group_id)}
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
        title="Add Vocabulary Groups to Lesson"
        size="lg"
      >
        <div className="space-y-4">
          <SearchBox
            value={searchQuery}
            onSearch={setSearchQuery}
            placeholder="Search vocabulary groups..."
          />

          {loadingGroups ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : availableGroups.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              {searchQuery ? 'No vocabulary groups found matching your search.' : 'No available vocabulary groups to add.'}
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableGroups.map((group) => (
                <div
                  key={group.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedGroups.includes(group.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => toggleGroupSelection(group.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group.id)}
                      onChange={() => {}}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <h5 className="font-medium text-lg">{group.name}</h5>
                      {group.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {group.vocabulary_count && (
                          <span className="text-sm text-gray-500">
                            <Languages className="h-3 w-3 inline mr-1" />
                            {group.vocabulary_count} words
                          </span>
                        )}
                        {group.language && (
                          <Badge variant="outline" size="sm">{group.language}</Badge>
                        )}
                        {group.target_language && (
                          <Badge variant="outline" size="sm">→ {group.target_language}</Badge>
                        )}
                        {group.difficulty && (
                          <Badge variant="secondary" size="sm">{group.difficulty}</Badge>
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
              {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddGroups}
                disabled={selectedGroups.length === 0 || loading}
                loading={loading}
              >
                Add Groups
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}