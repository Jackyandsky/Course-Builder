import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

type CourseBook = Database['public']['Tables']['course_books']['Insert']
type CourseBookRow = Database['public']['Tables']['course_books']['Row']

export class CourseBookService {
  private supabase = createSupabaseClient()

  // Add a book to a course
  async addBookToCourse(courseId: string, bookId: string, options?: {
    isRequired?: boolean
    notes?: string
    position?: number
  }) {
    const { data, error } = await this.supabase
      .from('course_books')
      .insert({
        course_id: courseId,
        book_id: bookId,
        is_required: options?.isRequired ?? false,
        notes: options?.notes,
        position: options?.position ?? 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Remove a book from a course
  async removeBookFromCourse(courseId: string, bookId: string) {
    const { error } = await this.supabase
      .from('course_books')
      .delete()
      .match({ course_id: courseId, book_id: bookId })

    if (error) throw error
  }

  // Get all books for a course
  async getCourseBooksWithDetails(courseId: string) {
    const { data, error } = await this.supabase
      .from('course_books')
      .select(`
        *,
        book:books (
          id,
          title,
          author,
          isbn,
          publisher,
          publication_year,
          cover_image_url,
          content_type,
          file_url,
          category_id,
          category:categories (
            id,
            name,
            color,
            icon
          )
        )
      `)
      .eq('course_id', courseId)
      .order('position', { ascending: true })

    if (error) throw error
    return data
  }

  // Get all courses using a specific book
  async getCoursesUsingBook(bookId: string) {
    const { data, error } = await this.supabase
      .from('course_books')
      .select(`
        *,
        course:courses (
          id,
          title,
          description,
          status,
          difficulty
        )
      `)
      .eq('book_id', bookId)

    if (error) throw error
    return data
  }

  // Update book association details
  async updateCourseBook(courseId: string, bookId: string, updates: {
    isRequired?: boolean
    notes?: string
    position?: number
  }) {
    const { data, error } = await this.supabase
      .from('course_books')
      .update({
        is_required: updates.isRequired,
        notes: updates.notes,
        position: updates.position
      })
      .match({ course_id: courseId, book_id: bookId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Reorder books in a course
  async reorderCourseBooks(courseId: string, bookOrders: { bookId: string; position: number }[]) {
    const updates = bookOrders.map(({ bookId, position }) => 
      this.supabase
        .from('course_books')
        .update({ position })
        .match({ course_id: courseId, book_id: bookId })
    )

    const results = await Promise.all(updates)
    const errors = results.filter(r => r.error)
    
    if (errors.length > 0) {
      throw new Error(`Failed to reorder books: ${errors.map(e => e.error?.message).join(', ')}`)
    }
  }

  // Bulk add books to course
  async bulkAddBooksToCourse(courseId: string, bookIds: string[], isRequired = false) {
    const inserts: CourseBook[] = bookIds.map((bookId, index) => ({
      course_id: courseId,
      book_id: bookId,
      is_required: isRequired,
      position: index
    }))

    const { data, error } = await this.supabase
      .from('course_books')
      .insert(inserts)
      .select()

    if (error) throw error
    return data
  }

  // Check if a book is associated with a course
  async isBookInCourse(courseId: string, bookId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('course_books')
      .select('id')
      .match({ course_id: courseId, book_id: bookId })
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  }
}

export const courseBookService = new CourseBookService()
