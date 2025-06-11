'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SearchBox } from '@/components/ui/SearchBox'
import { lessonRelationshipService } from '@/lib/services/relationships'
import { objectiveService } from '@/lib/supabase/objectives'
import { methodService } from '@/lib/supabase/methods'
import { taskService } from '@/lib/supabase/tasks'
import { bookService } from '@/lib/supabase/books'
import { vocabularyService } from '@/lib/supabase/vocabulary'
import { 
  Target, 
  Lightbulb, 
  ClipboardList, 
  Book, 
  Languages,
  Plus,
  X,
  Clock,
  Users,
  Calendar,
  Loader2
} from 'lucide-react'

interface LessonContentManagerProps {
  lessonId: string
  onUpdate?: () => void
}

interface TabContent {
  objectives: any[]
  methods: any[]
  tasks: any[]
  books: any[]
  vocabulary: any[]
}

export function LessonContentManager({ lessonId, onUpdate }: LessonContentManagerProps) {
  const [activeTab, setActiveTab] = useState('objectives')
  const [content, setContent] = useState<TabContent>({
    objectives: [],
    methods: [],
    tasks: [],
    books: [],
    vocabulary: []
  })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<keyof TabContent>('objectives')
  const [searchQuery, setSearchQuery] = useState('')
  const [availableItems, setAvailableItems] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [loadingModal, setLoadingModal] = useState(false)
  const [savingItems, setSavingItems] = useState(false)

  // Load all lesson content
  const loadLessonContent = async () => {
    setLoading(true)
    try {
      const lessonContent = await lessonRelationshipService.getLessonContent(lessonId)
      setContent(lessonContent)
    } catch (error) {
      console.error('Failed to load lesson content:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLessonContent()
  }, [lessonId])

  // Load available items based on type
  const loadAvailableItems = async (type: keyof TabContent) => {
    setLoadingModal(true)
    try {
      let items: any[] = []
      const currentIds = content[type].map(item => {
        switch (type) {
          case 'objectives': return item.objective_id
          case 'methods': return item.method_id
          case 'tasks': return item.task_id
          case 'books': return item.book_id
          case 'vocabulary': return item.vocabulary_id
          default: return null
        }
      }).filter(Boolean)

      switch (type) {
        case 'objectives':
          const objectives = await objectiveService.getObjectives()
          items = objectives.filter(obj => !currentIds.includes(obj.id))
          break
        case 'methods':
          const methods = await methodService.getMethods()
          items = methods.filter(method => !currentIds.includes(method.id))
          break
        case 'tasks':
          const tasks = await taskService.getTasks()
          items = tasks.filter(task => !currentIds.includes(task.id))
          break
        case 'books':
          const books = await bookService.getBooks()
          items = books.filter(book => !currentIds.includes(book.id))
          break
        case 'vocabulary':
          const vocabulary = await vocabularyService.getVocabulary()
          items = vocabulary.filter(vocab => !currentIds.includes(vocab.id))
          break
      }

      setAvailableItems(items)
    } catch (error) {
      console.error(`Failed to load available ${type}:`, error)
    } finally {
      setLoadingModal(false)
    }
  }

  // Handle opening add modal
  const openAddModal = async (type: keyof TabContent) => {
    setModalType(type)
    setModalOpen(true)
    setSearchQuery('')
    setSelectedItems([])
    await loadAvailableItems(type)
  }

  // Handle removing items
  const handleRemove = async (type: keyof TabContent, itemId: string) => {
    if (!confirm(`Are you sure you want to remove this ${type.slice(0, -1)}?`)) return

    try {
      switch (type) {
        case 'objectives':
          await lessonRelationshipService.removeObjectiveFromLesson(lessonId, itemId)
          break
        case 'methods':
          await lessonRelationshipService.removeMethodFromLesson(lessonId, itemId)
          break
        case 'tasks':
          await lessonRelationshipService.removeTaskFromLesson(lessonId, itemId)
          break
        case 'books':
          await lessonRelationshipService.removeBookFromLesson(lessonId, itemId)
          break
        case 'vocabulary':
          await lessonRelationshipService.removeVocabularyFromLesson(lessonId, itemId)
          break
      }
      await loadLessonContent()
      onUpdate?.()
    } catch (error) {
      console.error(`Failed to remove ${type}:`, error)
    }
  }

  // Handle adding selected items
  const handleAddItems = async () => {
    if (selectedItems.length === 0) return

    setSavingItems(true)
    try {
      switch (modalType) {
        case 'objectives':
          await lessonRelationshipService.bulkAddObjectivesToLesson(lessonId, selectedItems)
          break
        case 'methods':
          await lessonRelationshipService.bulkAddMethodsToLesson(
            lessonId,
            selectedItems.map(id => ({ methodId: id }))
          )
          break
        case 'tasks':
          await lessonRelationshipService.bulkAddTasksToLesson(
            lessonId,
            selectedItems.map(id => ({ taskId: id }))
          )
          break
        case 'books':
          for (const bookId of selectedItems) {
            await lessonRelationshipService.addBookToLesson(lessonId, bookId)
          }
          break
        case 'vocabulary':
          for (const vocabId of selectedItems) {
            await lessonRelationshipService.addVocabularyToLesson(lessonId, vocabId)
          }
          break
      }
      await loadLessonContent()
      onUpdate?.()
      setModalOpen(false)
    } catch (error) {
      console.error(`Failed to add ${modalType}:`, error)
    } finally {
      setSavingItems(false)
    }
  }

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId))
    } else {
      setSelectedItems([...selectedItems, itemId])
    }
  }

  // Filter items based on search
  const getFilteredItems = () => {
    if (!searchQuery) return availableItems

    return availableItems.filter(item => {
      const searchLower = searchQuery.toLowerCase()
      switch (modalType) {
        case 'objectives':
          return item.title?.toLowerCase().includes(searchLower) ||
                 item.description?.toLowerCase().includes(searchLower)
        case 'methods':
          return item.name?.toLowerCase().includes(searchLower) ||
                 item.description?.toLowerCase().includes(searchLower)
        case 'tasks':
          return item.title?.toLowerCase().includes(searchLower) ||
                 item.description?.toLowerCase().includes(searchLower)
        case 'books':
          return item.title?.toLowerCase().includes(searchLower) ||
                 item.author?.toLowerCase().includes(searchLower) ||
                 item.isbn?.toLowerCase().includes(searchLower)
        case 'vocabulary':
          return item.word?.toLowerCase().includes(searchLower) ||
                 item.translation?.toLowerCase().includes(searchLower)
        default:
          return true
      }
    })
  }

  const tabs = [
    {
      key: 'objectives',
      label: 'Objectives',
      icon: <Target className="h-4 w-4" />,
      count: content.objectives.length
    },
    {
      key: 'methods',
      label: 'Methods',
      icon: <Lightbulb className="h-4 w-4" />,
      count: content.methods.length
    },
    {
      key: 'tasks',
      label: 'Tasks',
      icon: <ClipboardList className="h-4 w-4" />,
      count: content.tasks.length
    },
    {
      key: 'books',
      label: 'Books',
      icon: <Book className="h-4 w-4" />,
      count: content.books.length
    },
    {
      key: 'vocabulary',
      label: 'Vocabulary',
      icon: <Languages className="h-4 w-4" />,
      count: content.vocabulary.length
    }
  ]

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )
    }

    const currentContent = content[activeTab as keyof TabContent]

    if (currentContent.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No {activeTab} added to this lesson yet.
          </p>
          <Button onClick={() => openAddModal(activeTab as keyof TabContent)}>
            <Plus className="h-4 w-4 mr-2" />
            Add {activeTab}
          </Button>
        </div>
      )
    }

    switch (activeTab) {
      case 'objectives':
        return (
          <div className="space-y-3">
            {content.objectives.map((item) => (
              <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex-1">
                  <h4 className="font-medium">{item.objective?.title}</h4>
                  {item.objective?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.objective.description}</p>
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
                  onClick={() => handleRemove('objectives', item.objective_id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )

      case 'methods':
        return (
          <div className="space-y-3">
            {content.methods.map((item) => (
              <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex-1">
                  <h4 className="font-medium">{item.method?.name}</h4>
                  {item.method?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.method.description}</p>
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
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">Note: {item.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove('methods', item.method_id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )

      case 'tasks':
        return (
          <div className="space-y-3">
            {content.tasks.map((item) => (
              <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{item.task?.title}</h4>
                    {item.is_homework && (
                      <Badge variant="warning" size="sm">Homework</Badge>
                    )}
                  </div>
                  {item.task?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.task.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.duration_override || item.task?.duration_minutes} min
                    </span>
                    {item.task?.difficulty && (
                      <Badge variant="outline" size="sm">{item.task.difficulty}</Badge>
                    )}
                    {item.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">Note: {item.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove('tasks', item.task_id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )

      case 'books':
        return (
          <div className="space-y-3">
            {content.books.map((item) => (
              <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center gap-3 flex-1">
                  {item.book?.cover_image_url && (
                    <img
                      src={item.book.cover_image_url}
                      alt={item.book.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.book?.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.book?.author}</p>
                    {(item.pages_from || item.pages_to) && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Pages: {item.pages_from || '?'} - {item.pages_to || '?'}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Note: {item.notes}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove('books', item.book_id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )

      case 'vocabulary':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {content.vocabulary.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex-1">
                  <h4 className="font-medium">{item.vocabulary?.word}</h4>
                  {item.vocabulary?.translation && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.vocabulary.translation}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {item.vocabulary?.part_of_speech && (
                      <Badge variant="outline" size="sm">
                        {item.vocabulary.part_of_speech}
                      </Badge>
                    )}
                    {item.vocabulary?.difficulty && (
                      <Badge variant="secondary" size="sm">
                        {item.vocabulary.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove('vocabulary', item.vocabulary_id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  // Render modal content based on type
  const renderModalContent = () => {
    const filteredItems = getFilteredItems()

    if (loadingModal) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )
    }

    if (filteredItems.length === 0) {
      return (
        <p className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchQuery ? `No ${modalType} found matching your search.` : `No available ${modalType} to add.`}
        </p>
      )
    }

    switch (modalType) {
      case 'objectives':
        return (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedItems.includes(item.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => toggleItemSelection(item.id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => {}}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <h5 className="font-medium">{item.title}</h5>
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {item.bloom_level && (
                        <Badge variant="outline" size="sm">{item.bloom_level}</Badge>
                      )}
                      {item.category && (
                        <Badge variant="secondary" size="sm">{item.category}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'methods':
        return (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedItems.includes(item.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => toggleItemSelection(item.id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => {}}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <h5 className="font-medium">{item.name}</h5>
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.duration_minutes} min
                      </span>
                      {item.group_size_min && item.group_size_max && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {item.group_size_min}-{item.group_size_max}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'tasks':
        return (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedItems.includes(item.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => toggleItemSelection(item.id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => {}}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <h5 className="font-medium">{item.title}</h5>
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {item.duration_minutes} min
                      </span>
                      {item.difficulty && (
                        <Badge variant="outline" size="sm">{item.difficulty}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'books':
        return (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedItems.includes(item.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => toggleItemSelection(item.id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => {}}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {item.cover_image_url && (
                    <img
                      src={item.cover_image_url}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h5 className="font-medium">{item.title}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.author}</p>
                    {item.isbn && (
                      <p className="text-xs text-gray-500 mt-1">ISBN: {item.isbn}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'vocabulary':
        return (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedItems.includes(item.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => toggleItemSelection(item.id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => {}}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <h5 className="font-medium">{item.word}</h5>
                    {item.translation && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.translation}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {item.part_of_speech && (
                        <Badge variant="outline" size="sm">{item.part_of_speech}</Badge>
                      )}
                      {item.difficulty && (
                        <Badge variant="secondary" size="sm">{item.difficulty}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Lesson Content</h3>
        <Button 
          size="sm" 
          onClick={() => openAddModal(activeTab as keyof TabContent)}
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {activeTab.slice(0, -1)}
        </Button>
      </div>

      {/* <Tabs
        tabs={tabs.map(tab => ({
          ...tab,
          label: (
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {tab.count}
                </Badge>
              )}
            </span>
          )
        }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      /> */}
      <Tabs value={activeTab} onValueChange={setActiveTab}> {/* */}
        <TabsList className="w-full justify-start overflow-x-auto"> {/* */}
          {tabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}> {/* */}
              <span className="flex items-center gap-2"> {/* */}
                {tab.icon} {/* */}
                {tab.label} {/* */}
                {tab.count > 0 && ( /* */
                  <Badge variant="secondary" className="ml-1"> {/* */}
                    {tab.count} {/* */}
                  </Badge>
                )}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            {renderContent()}
          </TabsContent>
        ))}
      </Tabs>


      {/* Add Content Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Add ${modalType.charAt(0).toUpperCase() + modalType.slice(1)} to Lesson`}
        size="lg"
      >
        <div className="space-y-4">
          <SearchBox
            value={searchQuery}
            onSearch={setSearchQuery}
            placeholder={`Search ${modalType}...`}
          />

          {renderModalContent()}

          <div className="flex justify-between items-center border-t pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedItems.length} {modalType.slice(0, -1)}{selectedItems.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddItems}
                disabled={selectedItems.length === 0 || savingItems}
                loading={savingItems}
              >
                Add {modalType}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}