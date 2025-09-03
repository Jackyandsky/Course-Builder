import type { Database } from '@/types/database'

type CourseBook = Database['public']['Tables']['course_books']['Insert']
type CourseBookRow = Database['public']['Tables']['course_books']['Row']

export class CourseBookService {
  // Add a book to a course - uses API route
  async addBookToCourse(courseId: string, bookId: string, options?: {
    isRequired?: boolean
    notes?: string
    position?: number
  }) {
    try {
      const response = await fetch(`/api/courses/${courseId}/books`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId,
          isRequired: options?.isRequired ?? false,
          notes: options?.notes,
          position: options?.position ?? 0
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add book to course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding book to course:', error);
      throw error;
    }
  }

  // Remove a book from a course - uses API route
  async removeBookFromCourse(courseId: string, bookId: string) {
    try {
      const response = await fetch(`/api/courses/${courseId}/books?bookId=${bookId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove book from course');
      }
    } catch (error) {
      console.error('Error removing book from course:', error);
      throw error;
    }
  }

  // Get all books for a course - uses API route
  async getCourseBooksWithDetails(courseId: string) {
    try {
      const response = await fetch(`/api/courses/${courseId}/books`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch course books');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course books:', error);
      throw error;
    }
  }

  // Get all courses using a specific book - TODO: Create API route
  async getCoursesUsingBook(bookId: string) {
    // This method needs an API route to be created
    // For now, return empty array
    console.warn('getCoursesUsingBook needs API route implementation');
    return [];
  }

  // Update book association details - uses API route
  async updateCourseBook(courseId: string, bookId: string, updates: {
    isRequired?: boolean
    notes?: string
    position?: number
  }) {
    try {
      const response = await fetch(`/api/courses/${courseId}/books`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId,
          isRequired: updates.isRequired,
          notes: updates.notes,
          position: updates.position
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update course book');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating course book:', error);
      throw error;
    }
  }

  // Reorder books in a course - uses API route
  async reorderCourseBooks(courseId: string, bookOrders: { bookId: string; position: number }[]) {
    try {
      // Update positions one by one using the API
      const promises = bookOrders.map(({ bookId, position }) =>
        this.updateCourseBook(courseId, bookId, { position })
      );

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error reordering course books:', error);
      throw error;
    }
  }

  // Bulk add books to course - uses API route
  async bulkAddBooksToCourse(courseId: string, bookIds: string[], isRequired = false) {
    try {
      // Add books one by one using the API
      const promises = bookIds.map((bookId, index) =>
        this.addBookToCourse(courseId, bookId, {
          isRequired,
          position: index
        })
      );

      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Error bulk adding books to course:', error);
      throw error;
    }
  }

  // Check if a book is associated with a course - uses API route
  async isBookInCourse(courseId: string, bookId: string): Promise<boolean> {
    try {
      const books = await this.getCourseBooksWithDetails(courseId);
      return books.some((cb: any) => cb.book_id === bookId);
    } catch (error) {
      console.error('Error checking if book is in course:', error);
      return false;
    }
  }
}

export const courseBookService = new CourseBookService()
