import type { Database } from '@/types/database'

type CourseVocabularyGroup = Database['public']['Tables']['course_vocabulary_groups']['Insert']

export class CourseVocabularyService {
  // Add a vocabulary group to a course - uses API route
  async addVocabularyGroupToCourse(courseId: string, vocabularyGroupId: string, position?: number) {
    try {
      const response = await fetch(`/api/courses/${courseId}/vocabulary`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vocabularyGroupId,
          position: position ?? 0
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add vocabulary to course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding vocabulary to course:', error);
      throw error;
    }
  }

  // Remove a vocabulary group from a course - uses API route
  async removeVocabularyGroupFromCourse(courseId: string, vocabularyGroupId: string) {
    try {
      const response = await fetch(`/api/courses/${courseId}/vocabulary?vocabularyGroupId=${vocabularyGroupId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove vocabulary from course');
      }
    } catch (error) {
      console.error('Error removing vocabulary from course:', error);
      throw error;
    }
  }

  // Get all vocabulary groups for a course - uses API route
  async getCourseVocabularyGroups(courseId: string) {
    try {
      const response = await fetch(`/api/courses/${courseId}/vocabulary`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch course vocabulary');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course vocabulary:', error);
      throw error;
    }
  }

  // Get all vocabulary items for a course (flattened) - TODO: needs API route
  async getCourseVocabularyItems(courseId: string) {
    // This needs a dedicated API route for fetching vocabulary items
    console.warn('getCourseVocabularyItems needs API route implementation');
    return [];
  }

  // Get courses using a vocabulary group - TODO: needs API route
  async getCoursesUsingVocabularyGroup(vocabularyGroupId: string) {
    // This needs a dedicated API route
    console.warn('getCoursesUsingVocabularyGroup needs API route implementation');
    return [];
  }

  // Reorder vocabulary groups in a course - uses API route
  async reorderCourseVocabularyGroups(courseId: string, groupOrders: { groupId: string; position: number }[]) {
    try {
      // Update positions one by one using the API
      const promises = groupOrders.map(({ groupId, position }) =>
        fetch(`/api/courses/${courseId}/vocabulary`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vocabularyGroupId: groupId,
            position
          }),
        })
      );

      const results = await Promise.all(promises);
      
      // Check if any request failed
      const errors = results.filter(r => !r.ok);
      if (errors.length > 0) {
        throw new Error('Failed to reorder vocabulary groups');
      }
    } catch (error) {
      console.error('Error reordering vocabulary groups:', error);
      throw error;
    }
  }

  // Bulk add vocabulary groups to course - uses API route
  async bulkAddVocabularyGroupsToCourse(courseId: string, groupIds: string[]) {
    try {
      // Add groups one by one using the API
      const promises = groupIds.map((groupId, index) =>
        this.addVocabularyGroupToCourse(courseId, groupId, index)
      );

      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Error bulk adding vocabulary groups:', error);
      throw error;
    }
  }

  // Get vocabulary statistics for a course - TODO: needs implementation
  async getCourseVocabularyStats(courseId: string) {
    // This would need vocabulary items to be fetched first
    console.warn('getCourseVocabularyStats needs API route implementation');
    return {
      totalWords: 0,
      byDifficulty: {},
      byPartOfSpeech: {},
      languages: new Set<string>()
    };
  }
}

export const courseVocabularyService = new CourseVocabularyService()
