import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

type CourseVocabularyGroup = Database['public']['Tables']['course_vocabulary_groups']['Insert']

export class CourseVocabularyService {
  private supabase = createSupabaseClient()

  // Add a vocabulary group to a course
  async addVocabularyGroupToCourse(courseId: string, vocabularyGroupId: string, position?: number) {
    const { data, error } = await this.supabase
      .from('course_vocabulary_groups')
      .insert({
        course_id: courseId,
        vocabulary_group_id: vocabularyGroupId,
        position: position ?? 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Remove a vocabulary group from a course
  async removeVocabularyGroupFromCourse(courseId: string, vocabularyGroupId: string) {
    const { error } = await this.supabase
      .from('course_vocabulary_groups')
      .delete()
      .match({ course_id: courseId, vocabulary_group_id: vocabularyGroupId })

    if (error) throw error
  }

  // Get all vocabulary groups for a course
  async getCourseVocabularyGroups(courseId: string) {
    const { data, error } = await this.supabase
      .from('course_vocabulary_groups')
      .select(`
        *,
        vocabulary_group:vocabulary_groups (
          id,
          name,
          description,
          language,
          target_language,
          difficulty,
          tags,
          vocabulary_group_items (
            vocabulary:vocabulary (
              id,
              word,
              translation,
              part_of_speech,
              difficulty
            )
          )
        )
      `)
      .eq('course_id', courseId)
      .order('position', { ascending: true })

    if (error) throw error
    return data
  }

  // Get all vocabulary items for a course (flattened)
  async getCourseVocabularyItems(courseId: string) {
    const { data, error } = await this.supabase
      .from('course_vocabulary_groups')
      .select(`
        vocabulary_group:vocabulary_groups (
          id,
          name,
          vocabulary_group_items (
            vocabulary:vocabulary (*)
          )
        )
      `)
      .eq('course_id', courseId)

    if (error) throw error

    // Flatten the vocabulary items with proper typing
    const vocabularyItems = data?.flatMap(group => {
      const vocabGroup = group.vocabulary_group as any
      return vocabGroup?.vocabulary_group_items?.map((item: any) => item.vocabulary) ?? []
    }).filter(Boolean)

    return vocabularyItems
  }

  // Get courses using a vocabulary group
  async getCoursesUsingVocabularyGroup(vocabularyGroupId: string) {
    const { data, error } = await this.supabase
      .from('course_vocabulary_groups')
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
      .eq('vocabulary_group_id', vocabularyGroupId)

    if (error) throw error
    return data
  }

  // Reorder vocabulary groups in a course
  async reorderCourseVocabularyGroups(courseId: string, groupOrders: { groupId: string; position: number }[]) {
    const updates = groupOrders.map(({ groupId, position }) => 
      this.supabase
        .from('course_vocabulary_groups')
        .update({ position })
        .match({ course_id: courseId, vocabulary_group_id: groupId })
    )

    const results = await Promise.all(updates)
    const errors = results.filter(r => r.error)
    
    if (errors.length > 0) {
      throw new Error(`Failed to reorder vocabulary groups: ${errors.map(e => e.error?.message).join(', ')}`)
    }
  }

  // Bulk add vocabulary groups to course
  async bulkAddVocabularyGroupsToCourse(courseId: string, groupIds: string[]) {
    const inserts: CourseVocabularyGroup[] = groupIds.map((groupId, index) => ({
      course_id: courseId,
      vocabulary_group_id: groupId,
      position: index
    }))

    const { data, error } = await this.supabase
      .from('course_vocabulary_groups')
      .insert(inserts)
      .select()

    if (error) throw error
    return data
  }

  // Get vocabulary statistics for a course
  async getCourseVocabularyStats(courseId: string) {
    const vocabularyItems = await this.getCourseVocabularyItems(courseId)
    
    const stats = {
      totalWords: vocabularyItems.length,
      byDifficulty: {} as Record<string, number>,
      byPartOfSpeech: {} as Record<string, number>,
      languages: new Set<string>()
    }

    vocabularyItems.forEach(item => {
      if (item) {
        // Count by difficulty
        const difficulty = item.difficulty || 'unknown'
        stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1
        
        // Count by part of speech
        const partOfSpeech = item.part_of_speech || 'unknown'
        stats.byPartOfSpeech[partOfSpeech] = (stats.byPartOfSpeech[partOfSpeech] || 0) + 1
      }
    })

    return stats
  }
}

export const courseVocabularyService = new CourseVocabularyService()
