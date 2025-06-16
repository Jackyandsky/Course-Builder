'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SearchBox } from '@/components/ui/SearchBox'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { lessonService } from '@/lib/supabase/lessons'
import { bookService } from '@/lib/supabase/books'
import { courseBookService } from '@/lib/services/relationships'
import { Book, Loader2 } from 'lucide-react'

interface LessonBookManagerProps {
  lessonId: string
  courseId?: string
  onUpdate?: () => void
}

export function LessonBookManager({ lessonId, courseId, onUpdate }: LessonBookManagerProps) {
  console.log('LessonBookManager rendered with props:', { lessonId, courseId }); // Debug log
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [lessonBooks, setLessonBooks] = useState<any[]>([])
  const [availableBooks, setAvailableBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingBooks, setLoadingBooks] = useState(false)

  // Load lesson books
  const loadLessonBooks = useCallback(async () => {
    try {
      const lesson = await lessonService.getLesson(lessonId)
      setLessonBooks(lesson?.lesson_books || [])
    } catch (error) {
      console.error('Failed to load lesson books:', error)
    }
  }, [lessonId])

  // Load available books with search and filters
  const loadAvailableBooks = useCallback(async (search = '') => {
    setLoadingBooks(true)
    try {
      let books: any[] = []
      
      if (courseId) {
        // Get books from the course if courseId is provided
        const courseBooks = await courseBookService.getCourseBooksWithDetails(courseId)
        books = courseBooks?.map(cb => cb.book) || []
      } else {
        // Get all books if no courseId
        books = await bookService.getBooks({
          search: search.trim(),
          limit: 100
        })
      }
      
      // Filter out books already in the lesson
      const lessonBookIds = lessonBooks.map(lb => lb.book_id)
      const available = books.filter(book => !lessonBookIds.includes(book.id))
      setAvailableBooks(available)
    } catch (error) {
      console.error('Failed to load available books:', error)
    } finally {
      setLoadingBooks(false)
    }
  }, [lessonBooks, courseId])

  // Initial load
  useEffect(() => {
    loadLessonBooks()
  }, [lessonId, loadLessonBooks])

  // Open modal and load data
  const openModal = async () => {
    setIsModalOpen(true)
    setSelectedBooks([])
    setSearchQuery('')
    // Don't load here - let the useEffect handle it
  }

  // Debounced search handler
  useEffect(() => {
    if (!isModalOpen) return
    
    const timeoutId = setTimeout(() => {
      loadAvailableBooks(searchQuery)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, isModalOpen, loadAvailableBooks])

  // Add selected books to lesson
  const handleAddBooks = async () => {
    if (selectedBooks.length === 0) return

    setLoading(true)
    try {
      for (const bookId of selectedBooks) {
        await lessonService.addBookToLesson(lessonId, bookId)
      }
      setSelectedBooks([])
      await loadLessonBooks()
      onUpdate?.()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to add books:', error)
    } finally {
      setLoading(false)
    }
  }

  // Remove book from lesson
  const handleRemoveBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to remove this book from the lesson?')) return

    try {
      await lessonService.removeBookFromLesson(lessonId, bookId)
      await loadLessonBooks()
      onUpdate?.()
    } catch (error) {
      console.error('Failed to remove book:', error)
    }
  }

  // Toggle book selection
  const toggleBookSelection = (bookId: string) => {
    if (selectedBooks.includes(bookId)) {
      setSelectedBooks(selectedBooks.filter(id => id !== bookId))
    } else {
      setSelectedBooks([...selectedBooks, bookId])
    }
  }

  const filteredBooks = availableBooks
  
  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Lesson Books</h3>
          <Button onClick={openModal} size="sm">
            <Book className="h-4 w-4 mr-2" />
            Manage Books
          </Button>
        </div>
        

        {lessonBooks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {lessonBooks.map((lessonBook) => (
              <div
                key={lessonBook.id}
                className="border rounded-lg p-2 hover:shadow-md transition-shadow group relative"
              >
                {lessonBook.book?.cover_image_url && (
                  <img
                    src={lessonBook.book.cover_image_url}
                    alt={lessonBook.book.title}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                )}
                <div className="space-y-1">
                  <h4 className="font-medium text-xs line-clamp-2" title={lessonBook.book?.title}>
                    {lessonBook.book?.title}
                  </h4>
                  {lessonBook.book?.author && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1" title={lessonBook.book.author}>
                      {lessonBook.book.author}
                    </p>
                  )}
                  {(lessonBook.pages_from || lessonBook.pages_to) && (
                    <p className="text-xs text-blue-600">
                      Pages: {lessonBook.pages_from || ''}{lessonBook.pages_from && lessonBook.pages_to ? '-' : ''}{lessonBook.pages_to || ''}
                    </p>
                  )}
                  <div className="flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBook(lessonBook.book_id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No books added to this lesson yet.
          </p>
        )}
      </div>

      <Modal
        title="Add Books to Lesson"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
      >
        <div className="space-y-4">
          <SearchBox
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={courseId ? "Search course books..." : "Search all books..."}
          />

          {loadingBooks ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <Table
                responsive={false}
                size="sm"
                className="w-full"
                columns={[
                  {
                    key: 'select',
                    label: (
                      <input
                        type="checkbox"
                        checked={selectedBooks.length === filteredBooks.length && filteredBooks.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBooks(filteredBooks.map(book => book.id))
                          } else {
                            setSelectedBooks([])
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    ),
                    render: (book) => (
                      <input
                        type="checkbox"
                        checked={selectedBooks.includes(book.id)}
                        onChange={() => toggleBookSelection(book.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )
                  },
                  {
                    key: 'title',
                    label: 'Book',
                    render: (book) => (
                      <div className="flex items-center space-x-3">
                        {book.cover_image_url && (
                          <img
                            src={book.cover_image_url}
                            alt={book.title}
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                        <span className="font-medium">{book.title}</span>
                      </div>
                    )
                  },
                  { 
                    key: 'author', 
                    label: 'Author',
                    render: (book) => book.author || '-'
                  },
                  {
                    key: 'category',
                    label: 'Category',
                    render: (book) => book.category ? (
                      <Badge variant="outline">{book.category}</Badge>
                    ) : '-'
                  },
                  {
                    key: 'content_type',
                    label: 'Type',
                    render: (book) => book.content_type ? (
                      <Badge variant="secondary">{book.content_type}</Badge>
                    ) : '-'
                  }
                ]}
                data={filteredBooks}
              />
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">
              {courseId ? "No course books available to add" : "No books found"}
            </p>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddBooks}
              disabled={selectedBooks.length === 0}
              loading={loading}
            >
              Add {selectedBooks.length} Book{selectedBooks.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}