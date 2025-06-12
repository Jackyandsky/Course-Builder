'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SearchBox } from '@/components/ui/SearchBox'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { courseBookService } from '@/lib/services/relationships'
import { bookService } from '@/lib/supabase/books'
import { Book, Loader2 } from 'lucide-react'

interface CourseBookManagerProps {
  courseId: string
  onUpdate?: () => void
}

export function CourseBookManager({ courseId, onUpdate }: CourseBookManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [courseBooks, setCourseBooks] = useState<any[]>([])
  const [availableBooks, setAvailableBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingBooks, setLoadingBooks] = useState(false)

  // Load course books
  const loadCourseBooks = async () => {
    try {
      const books = await courseBookService.getCourseBooksWithDetails(courseId)
      setCourseBooks(books || [])
    } catch (error) {
      console.error('Failed to load course books:', error)
    }
  }

  // Load available books with search and filters
  const loadAvailableBooks = useCallback(async (search = '') => {
    setLoadingBooks(true)
    try {
      // Use server-side search with limit for better performance
      const books = await bookService.getBooks({
        search: search.trim(),
        limit: 100 // Limit results for performance
      })
      // Filter out books already in the course
      const courseBooksIds = courseBooks.map(cb => cb.book_id)
      const available = books.filter(book => !courseBooksIds.includes(book.id))
      setAvailableBooks(available)
    } catch (error) {
      console.error('Failed to load available books:', error)
    } finally {
      setLoadingBooks(false)
    }
  }, [courseBooks])

  // Initial load
  useEffect(() => {
    loadCourseBooks()
  }, [courseId])

  // Open modal and load data
  const openModal = async () => {
    setIsModalOpen(true)
    setSelectedBooks([])
    setSearchQuery('')
    await loadAvailableBooks('')
  }

  // Debounced search handler
  useEffect(() => {
    if (!isModalOpen) return
    
    const timeoutId = setTimeout(() => {
      loadAvailableBooks(searchQuery)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, isModalOpen, loadAvailableBooks])

  // Add selected books to course
  const handleAddBooks = async () => {
    if (selectedBooks.length === 0) return

    setLoading(true)
    try {
      await courseBookService.bulkAddBooksToCourse(courseId, selectedBooks)
      setSelectedBooks([])
      await loadCourseBooks()
      onUpdate?.()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to add books:', error)
    } finally {
      setLoading(false)
    }
  }

  // Remove book from course
  const handleRemoveBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to remove this book from the course?')) return

    try {
      await courseBookService.removeBookFromCourse(courseId, bookId)
      await loadCourseBooks()
      onUpdate?.()
    } catch (error) {
      console.error('Failed to remove book:', error)
    }
  }

  // Toggle book required status
  const handleToggleRequired = async (bookId: string, currentRequired: boolean) => {
    try {
      await courseBookService.updateCourseBook(courseId, bookId, {
        isRequired: !currentRequired
      })
      await loadCourseBooks()
    } catch (error) {
      console.error('Failed to update book:', error)
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

  // No need for client-side filtering since we're using server-side search
  const filteredBooks = availableBooks
  
  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Course Books</h3>
          <Button onClick={openModal} size="sm">
            <Book className="h-4 w-4 mr-2" />
            Manage Books
          </Button>
        </div>

        {courseBooks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {courseBooks.map((courseBook) => (
              <div
                key={courseBook.id}
                className="border rounded-lg p-2 hover:shadow-md transition-shadow group relative"
              >
                {courseBook.book?.cover_image_url && (
                  <img
                    src={courseBook.book.cover_image_url}
                    alt={courseBook.book.title}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                )}
                <div className="space-y-1">
                  <h4 className="font-medium text-xs line-clamp-2" title={courseBook.book?.title}>
                    {courseBook.book?.title}
                  </h4>
                  {courseBook.book?.author && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1" title={courseBook.book.author}>
                      {courseBook.book.author}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={courseBook.is_required ? 'default' : 'secondary'}
                      className="cursor-pointer text-xs px-1 py-0.5"
                      onClick={() => handleToggleRequired(courseBook.book_id, courseBook.is_required)}
                    >
                      {courseBook.is_required ? 'Req' : 'Opt'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBook(courseBook.book_id)}
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
            No books added to this course yet.
          </p>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Books to Course"
        size="lg"
      >
        <div className="space-y-4">
          <SearchBox
            value={searchQuery}
            onSearch={setSearchQuery}
            placeholder="Search books by title, author, or ISBN..."
          />

          {loadingBooks ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
                        checked={filteredBooks.length > 0 && filteredBooks.every(book => selectedBooks.includes(book.id))}
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
                    label: 'Title',
                    render: (book) => (
                      <div className="max-w-xs">
                        <p className="font-medium truncate" title={book.title}>{book.title}</p>
                        {book.isbn && (
                          <p className="text-xs text-gray-500 truncate">ISBN: {book.isbn}</p>
                        )}
                      </div>
                    )
                  },
                  { 
                    key: 'author', 
                    label: 'Author',
                    render: (book) => (
                      <div className="max-w-32">
                        <span className="truncate block" title={book.author}>
                          {book.author || '-'}
                        </span>
                      </div>
                    )
                  },
                  {
                    key: 'category',
                    label: 'Category',
                    render: (book) => (
                      <div className="max-w-24">
                        <span className="truncate block" title={book.category?.name}>
                          {book.category?.name || '-'}
                        </span>
                      </div>
                    )
                  },
                  {
                    key: 'type',
                    label: 'Type',
                    render: (book) => (
                      <Badge variant="warning" className="text-xs whitespace-nowrap">
                        {book.content_type || 'text'}
                      </Badge>
                    )
                  }
                ]}
                data={filteredBooks}
              />
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No books found matching your search.' : 'No available books to add.'}
            </p>
          )}

          <div className="flex justify-between items-center border-t pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddBooks}
                disabled={selectedBooks.length === 0 || loading}
                loading={loading}
              >
                Add Books
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
