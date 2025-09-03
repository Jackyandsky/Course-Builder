'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SearchBox } from '@/components/ui/SearchBox'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { lessonRelationshipService } from '@/lib/services/relationships'
import { methodService } from '@/lib/supabase/methods'
import { Lightbulb, Loader2, X, Plus, Clock, Users } from 'lucide-react'

interface LessonMethodManagerProps {
  lessonId: string
  onUpdate?: () => void
}

export function LessonMethodManager({ lessonId, onUpdate }: LessonMethodManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMethods, setSelectedMethods] = useState<Array<{id: string, duration?: number, notes?: string}>>([])
  const [lessonMethods, setLessonMethods] = useState<any[]>([])
  const [availableMethods, setAvailableMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMethods, setLoadingMethods] = useState(false)

  // Load lesson methods
  const loadLessonMethods = useCallback(async () => {
    try {
      const content = await lessonRelationshipService.getLessonContent(lessonId)
      setLessonMethods(content?.methods || [])
    } catch (error) {
      console.error('Failed to load lesson methods:', error)
    }
  }, [lessonId])

  // Load available methods with search
  const loadAvailableMethods = useCallback(async (search = '') => {
    setLoadingMethods(true)
    try {
      const methods = await methodService.getMethods()
      
      // Filter out methods already in the lesson
      const lessonMethodIds = lessonMethods.map(lm => lm.method_id)
      let available = methods.filter(method => !lessonMethodIds.includes(method.id))
      
      // Apply search filter
      if (search.trim()) {
        const searchLower = search.toLowerCase()
        available = available.filter(method => 
          method.name?.toLowerCase().includes(searchLower) ||
          method.description?.toLowerCase().includes(searchLower)
        )
      }
      
      setAvailableMethods(available)
    } catch (error) {
      console.error('Failed to load available methods:', error)
    } finally {
      setLoadingMethods(false)
    }
  }, [lessonMethods])

  // Initial load
  useEffect(() => {
    loadLessonMethods()
  }, [lessonId, loadLessonMethods])

  // Open modal
  const openModal = () => {
    setIsModalOpen(true)
    setSelectedMethods([])
    setSearchQuery('')
  }

  // Debounced search handler
  useEffect(() => {
    if (!isModalOpen) return
    
    const timeoutId = setTimeout(() => {
      loadAvailableMethods(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, isModalOpen, loadAvailableMethods])

  // Add selected methods to lesson
  const handleAddMethods = async () => {
    if (selectedMethods.length === 0) return

    setLoading(true)
    try {
      const methodsData = selectedMethods.map(m => ({
        methodId: m.id,
        duration_override: m.duration,
        notes: m.notes
      }))
      await lessonRelationshipService.bulkAddMethodsToLesson(lessonId, methodsData)
      await loadLessonMethods()
      onUpdate?.()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to add methods:', error)
      alert('Failed to add methods. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Remove method from lesson
  const handleRemoveMethod = async (methodId: string) => {
    if (!confirm('Are you sure you want to remove this method?')) return

    try {
      await lessonRelationshipService.removeMethodFromLesson(lessonId, methodId)
      await loadLessonMethods()
      onUpdate?.()
    } catch (error) {
      console.error('Failed to remove method:', error)
      alert('Failed to remove method. Please try again.')
    }
  }

  // Toggle method selection
  const toggleMethodSelection = (method: any) => {
    const exists = selectedMethods.find(m => m.id === method.id)
    if (exists) {
      setSelectedMethods(selectedMethods.filter(m => m.id !== method.id))
    } else {
      setSelectedMethods([...selectedMethods, { 
        id: method.id, 
        duration: method.duration_minutes 
      }])
    }
  }

  // Update method customization
  const updateMethodCustomization = (methodId: string, field: 'duration' | 'notes', value: any) => {
    setSelectedMethods(selectedMethods.map(m => 
      m.id === methodId ? { ...m, [field]: value } : m
    ))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Lesson Methods
        </h3>
        <Button size="sm" onClick={openModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Methods
        </Button>
      </div>

      {lessonMethods.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Lightbulb className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No methods added to this lesson yet.</p>
          <Button onClick={openModal} size="sm" className="mt-3">
            Add First Method
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {lessonMethods.map((item) => (
            <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex-1">
                <h4 className="font-medium">{item.method?.name}</h4>
                {item.method?.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.method.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.duration_override || item.method?.duration_minutes} min
                  </span>
                  {item.method?.group_size_min && item.method?.group_size_max && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {item.method.group_size_min}-{item.method.group_size_max}
                    </span>
                  )}
                  {item.method?.category && (
                    <Badge variant="outline" size="sm">
                      {item.method.category}
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
                onClick={() => handleRemoveMethod(item.method_id)}
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
        title="Add Methods to Lesson"
        size="lg"
      >
        <div className="space-y-4">
          <SearchBox
            value={searchQuery}
            onSearch={setSearchQuery}
            placeholder="Search methods..."
          />

          {loadingMethods ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : availableMethods.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              {searchQuery ? 'No methods found matching your search.' : 'No available methods to add.'}
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableMethods.map((method) => {
                const selected = selectedMethods.find(m => m.id === method.id)
                return (
                  <div
                    key={method.id}
                    className={`p-3 border rounded-lg transition-all ${
                      selected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div 
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => toggleMethodSelection(method)}
                    >
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => {}}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <h5 className="font-medium">{method.name}</h5>
                        {method.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {method.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {method.duration_minutes} min
                          </span>
                          {method.group_size_min && method.group_size_max && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {method.group_size_min}-{method.group_size_max}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {selected && (
                      <div className="mt-3 ml-6 space-y-2 border-t pt-2">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Duration override (min)"
                            value={selected.duration || ''}
                            onChange={(e) => updateMethodCustomization(method.id, 'duration', e.target.value ? parseInt(e.target.value) : undefined)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-40"
                          />
                          <Input
                            placeholder="Notes (optional)"
                            value={selected.notes || ''}
                            onChange={(e) => updateMethodCustomization(method.id, 'notes', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-between items-center border-t pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedMethods.length} method{selectedMethods.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddMethods}
                disabled={selectedMethods.length === 0 || loading}
                loading={loading}
              >
                Add Methods
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}