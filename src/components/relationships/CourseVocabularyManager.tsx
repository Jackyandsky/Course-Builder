'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SearchBox } from '@/components/ui/SearchBox'
import { Badge } from '@/components/ui/Badge'
import { courseVocabularyService } from '@/lib/services/relationships'
import { vocabularyService } from '@/lib/supabase/vocabulary'
import { BookOpen, Languages, Loader2, X } from 'lucide-react'

interface CourseVocabularyManagerProps {
  courseId: string
  onUpdate?: () => void
}

export function CourseVocabularyManager({ courseId, onUpdate }: CourseVocabularyManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [courseGroups, setCourseGroups] = useState<any[]>([])
  const [availableGroups, setAvailableGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [stats, setStats] = useState<any>(null)

  // Load course vocabulary groups
  const loadCourseGroups = async () => {
    try {
      const groups = await courseVocabularyService.getCourseVocabularyGroups(courseId)
      setCourseGroups(groups || [])
      
      // Load stats
      const vocabStats = await courseVocabularyService.getCourseVocabularyStats(courseId)
      setStats(vocabStats)
    } catch (error) {
      console.error('Failed to load course vocabulary groups:', error)
    }
  }

  // Load available vocabulary groups
  const loadAvailableGroups = async () => {
    setLoadingGroups(true)
    try {
      const groups = await vocabularyService.getVocabularyGroups()
      // Filter out groups already in the course
      const courseGroupIds = courseGroups.map(cg => cg.vocabulary_group_id)
      const available = groups.filter(group => !courseGroupIds.includes(group.id))
      setAvailableGroups(available)
    } catch (error) {
      console.error('Failed to load available groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }

  useEffect(() => {
    loadCourseGroups()
  }, [courseId])

  // Open modal and load data
  const openModal = async () => {
    setIsModalOpen(true)
    setSelectedGroups([])
    setSearchQuery('')
    await loadAvailableGroups()
  }

  // Add selected groups to course
  const handleAddGroups = async () => {
    if (selectedGroups.length === 0) return

    setLoading(true)
    try {
      await courseVocabularyService.bulkAddVocabularyGroupsToCourse(courseId, selectedGroups)
      setSelectedGroups([])
      await loadCourseGroups()
      onUpdate?.()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to add vocabulary groups:', error)
    } finally {
      setLoading(false)
    }
  }

  // Remove group from course
  const handleRemoveGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to remove this vocabulary group from the course?')) return

    try {
      await courseVocabularyService.removeVocabularyGroupFromCourse(courseId, groupId)
      await loadCourseGroups()
      onUpdate?.()
    } catch (error) {
      console.error('Failed to remove vocabulary group:', error)
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

  // Filter available groups based on search
  const filteredGroups = availableGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.language?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.target_language?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success'
      case 'intermediate': return 'warning'
      case 'advanced': return 'danger'
      case 'expert': return 'secondary'
      default: return 'default'
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Vocabulary Groups</h3>
            {stats && stats.totalWords > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total words: {stats.totalWords}
              </p>
            )}
          </div>
          <Button onClick={openModal} size="sm">
            <Languages className="h-4 w-4 mr-2" />
            Manage Vocabulary
          </Button>
        </div>

        {courseGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {courseGroups.map((courseGroup) => {
              const group = courseGroup.vocabulary_group
              const wordCount = group?.vocabulary_group_items?.length || 0
              
              return (
                <div
                  key={courseGroup.id}
                  className="border rounded-lg p-3 hover:shadow-md transition-shadow group relative"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm line-clamp-2" title={group?.name}>
                        {group?.name}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGroup(courseGroup.vocabulary_group_id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        ×
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant={getDifficultyColor(group?.difficulty)} className="text-xs px-1 py-0.5">
                        {group?.difficulty}
                      </Badge>
                      {group?.language && group?.target_language && (
                        <Badge variant="outline" className="text-xs px-1 py-0.5">
                          {group.language}→{group.target_language}
                        </Badge>
                      )}
                    </div>
                    
                    {group?.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2" title={group.description}>
                        {group.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
                      {group?.tags && group.tags.length > 0 && (
                        <span>{group.tags.length} tag{group.tags.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No vocabulary groups added to this course yet.
          </p>
        )}

        {stats && stats.totalWords > 0 && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium mb-3">Vocabulary Statistics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">By Difficulty:</p>
                <ul className="space-y-1">
                  {Object.entries(stats.byDifficulty).map(([level, count]) => (
                    <li key={level} className="flex justify-between">
                      <span className="capitalize text-gray-700 dark:text-gray-300">{level}:</span>
                      <span className="font-medium">{count as number}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">By Part of Speech:</p>
                <ul className="space-y-1">
                  {Object.entries(stats.byPartOfSpeech).slice(0, 5).map(([pos, count]) => (
                    <li key={pos} className="flex justify-between">
                      <span className="capitalize text-gray-700 dark:text-gray-300">{pos}:</span>
                      <span className="font-medium">{count as number}</span>
                    </li>
                  ))}
                  {Object.keys(stats.byPartOfSpeech).length > 5 && (
                    <li className="text-gray-500 dark:text-gray-400 text-xs">
                      +{Object.keys(stats.byPartOfSpeech).length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Vocabulary Groups"
        size="lg"
      >
        <div className="space-y-4">
          <SearchBox
            value={searchQuery}
            onSearch={setSearchQuery}
            placeholder="Search vocabulary groups by name, description, or language..."
          />

          {loadingGroups ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredGroups.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedGroups.includes(group.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => toggleGroupSelection(group.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={() => {}}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium">{group.name}</h5>
                          <Badge variant={getDifficultyColor(group.difficulty)} size="sm">
                            {group.difficulty}
                          </Badge>
                          {group.language && group.target_language && (
                            <Badge variant="outline" size="sm">
                              {group.language} → {group.target_language}
                            </Badge>
                          )}
                        </div>
                        {group.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{group.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{group.vocabulary_group_items?.length || 0} words</span>
                          {group.tags && group.tags.length > 0 && (
                            <span>{group.tags.length} tags</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <BookOpen className="h-4 w-4 text-gray-400 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No vocabulary groups found matching your search.' : 'No available vocabulary groups to add.'}
            </p>
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
    </>
  )
}
