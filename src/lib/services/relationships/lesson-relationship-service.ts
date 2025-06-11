import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

type LessonObjective = Database['public']['Tables']['lesson_objectives']['Insert']
type LessonMethod = Database['public']['Tables']['lesson_methods']['Insert']
type LessonTask = Database['public']['Tables']['lesson_tasks']['Insert']
type LessonBook = Database['public']['Tables']['lesson_books']['Insert']
type LessonVocabulary = Database['public']['Tables']['lesson_vocabulary']['Insert']

export class LessonRelationshipService {
  private supabase = createSupabaseClient()

  // === OBJECTIVES ===
  async addObjectiveToLesson(lessonId: string, objectiveId: string, position?: number) {
    const { data, error } = await this.supabase
      .from('lesson_objectives')
      .insert({
        lesson_id: lessonId,
        objective_id: objectiveId,
        position: position ?? 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async removeObjectiveFromLesson(lessonId: string, objectiveId: string) {
    const { error } = await this.supabase
      .from('lesson_objectives')
      .delete()
      .match({ lesson_id: lessonId, objective_id: objectiveId })

    if (error) throw error
  }

  async getLessonObjectives(lessonId: string) {
    const { data, error } = await this.supabase
      .from('lesson_objectives')
      .select(`
        *,
        objective:objectives (*)
      `)
      .eq('lesson_id', lessonId)
      .order('position', { ascending: true })

    if (error) throw error
    return data
  }

  // === METHODS ===
  async addMethodToLesson(lessonId: string, methodId: string, options?: {
    durationOverride?: number
    position?: number
    notes?: string
  }) {
    const { data, error } = await this.supabase
      .from('lesson_methods')
      .insert({
        lesson_id: lessonId,
        method_id: methodId,
        duration_override: options?.durationOverride,
        position: options?.position ?? 0,
        notes: options?.notes
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async removeMethodFromLesson(lessonId: string, methodId: string) {
    const { error } = await this.supabase
      .from('lesson_methods')
      .delete()
      .match({ lesson_id: lessonId, method_id: methodId })

    if (error) throw error
  }

  async getLessonMethods(lessonId: string) {
    const { data, error } = await this.supabase
      .from('lesson_methods')
      .select(`
        *,
        method:methods (*)
      `)
      .eq('lesson_id', lessonId)
      .order('position', { ascending: true })

    if (error) throw error
    return data
  }

  // === TASKS ===
  async addTaskToLesson(lessonId: string, taskId: string, options?: {
    durationOverride?: number
    position?: number
    notes?: string
    isHomework?: boolean
    dueDate?: string
  }) {
    const { data, error } = await this.supabase
      .from('lesson_tasks')
      .insert({
        lesson_id: lessonId,
        task_id: taskId,
        duration_override: options?.durationOverride,
        position: options?.position ?? 0,
        notes: options?.notes,
        is_homework: options?.isHomework ?? false,
        due_date: options?.dueDate
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async removeTaskFromLesson(lessonId: string, taskId: string) {
    const { error } = await this.supabase
      .from('lesson_tasks')
      .delete()
      .match({ lesson_id: lessonId, task_id: taskId })

    if (error) throw error
  }

  async getLessonTasks(lessonId: string) {
    const { data, error } = await this.supabase
      .from('lesson_tasks')
      .select(`
        *,
        task:tasks (*)
      `)
      .eq('lesson_id', lessonId)
      .order('position', { ascending: true })

    if (error) throw error
    return data
  }

  // === BOOKS ===
  async addBookToLesson(lessonId: string, bookId: string, options?: {
    pagesFrom?: number
    pagesTo?: number
    notes?: string
  }) {
    const { data, error } = await this.supabase
      .from('lesson_books')
      .insert({
        lesson_id: lessonId,
        book_id: bookId,
        pages_from: options?.pagesFrom,
        pages_to: options?.pagesTo,
        notes: options?.notes
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async removeBookFromLesson(lessonId: string, bookId: string) {
    const { error } = await this.supabase
      .from('lesson_books')
      .delete()
      .match({ lesson_id: lessonId, book_id: bookId })

    if (error) throw error
  }

  async getLessonBooks(lessonId: string) {
    const { data, error } = await this.supabase
      .from('lesson_books')
      .select(`
        *,
        book:books (
          id,
          title,
          author,
          cover_image_url
        )
      `)
      .eq('lesson_id', lessonId)

    if (error) throw error
    return data
  }

  // === VOCABULARY ===
  async addVocabularyToLesson(lessonId: string, vocabularyId: string, position?: number) {
    const { data, error } = await this.supabase
      .from('lesson_vocabulary')
      .insert({
        lesson_id: lessonId,
        vocabulary_id: vocabularyId,
        position: position ?? 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async removeVocabularyFromLesson(lessonId: string, vocabularyId: string) {
    const { error } = await this.supabase
      .from('lesson_vocabulary')
      .delete()
      .match({ lesson_id: lessonId, vocabulary_id: vocabularyId })

    if (error) throw error
  }

  async getLessonVocabulary(lessonId: string) {
    const { data, error } = await this.supabase
      .from('lesson_vocabulary')
      .select(`
        *,
        vocabulary:vocabulary (*)
      `)
      .eq('lesson_id', lessonId)
      .order('position', { ascending: true })

    if (error) throw error
    return data
  }

  // === BULK OPERATIONS ===
  async bulkAddObjectivesToLesson(lessonId: string, objectiveIds: string[]) {
    const inserts: LessonObjective[] = objectiveIds.map((id, index) => ({
      lesson_id: lessonId,
      objective_id: id,
      position: index
    }))

    const { data, error } = await this.supabase
      .from('lesson_objectives')
      .insert(inserts)
      .select()

    if (error) throw error
    return data
  }

  async bulkAddMethodsToLesson(lessonId: string, methods: Array<{
    methodId: string
    durationOverride?: number
    notes?: string
  }>) {
    const inserts: LessonMethod[] = methods.map((method, index) => ({
      lesson_id: lessonId,
      method_id: method.methodId,
      duration_override: method.durationOverride,
      notes: method.notes,
      position: index
    }))

    const { data, error } = await this.supabase
      .from('lesson_methods')
      .insert(inserts)
      .select()

    if (error) throw error
    return data
  }

  async bulkAddTasksToLesson(lessonId: string, tasks: Array<{
    taskId: string
    durationOverride?: number
    notes?: string
    isHomework?: boolean
    dueDate?: string
  }>) {
    const inserts: LessonTask[] = tasks.map((task, index) => ({
      lesson_id: lessonId,
      task_id: task.taskId,
      duration_override: task.durationOverride,
      notes: task.notes,
      is_homework: task.isHomework ?? false,
      due_date: task.dueDate,
      position: index
    }))

    const { data, error } = await this.supabase
      .from('lesson_tasks')
      .insert(inserts)
      .select()

    if (error) throw error
    return data
  }

  // === GET ALL LESSON CONTENT ===
  async getLessonContent(lessonId: string) {
    const [objectives, methods, tasks, books, vocabulary] = await Promise.all([
      this.getLessonObjectives(lessonId),
      this.getLessonMethods(lessonId),
      this.getLessonTasks(lessonId),
      this.getLessonBooks(lessonId),
      this.getLessonVocabulary(lessonId)
    ])

    return {
      objectives,
      methods,
      tasks,
      books,
      vocabulary
    }
  }

  // === COPY LESSON CONTENT ===
  async copyLessonContent(sourceLessonId: string, targetLessonId: string) {
    const content = await this.getLessonContent(sourceLessonId)

    // Copy objectives
    if (content.objectives.length > 0) {
      await this.bulkAddObjectivesToLesson(
        targetLessonId,
        content.objectives.map(o => o.objective_id)
      )
    }

    // Copy methods
    if (content.methods.length > 0) {
      await this.bulkAddMethodsToLesson(
        targetLessonId,
        content.methods.map(m => ({
          methodId: m.method_id,
          durationOverride: m.duration_override || undefined,
          notes: m.notes || undefined
        }))
      )
    }

    // Copy tasks
    if (content.tasks.length > 0) {
      await this.bulkAddTasksToLesson(
        targetLessonId,
        content.tasks.map(t => ({
          taskId: t.task_id,
          durationOverride: t.duration_override || undefined,
          notes: t.notes || undefined,
          isHomework: t.is_homework,
          dueDate: t.due_date || undefined
        }))
      )
    }

    // Copy books
    for (const book of content.books) {
      await this.addBookToLesson(targetLessonId, book.book_id, {
        pagesFrom: book.pages_from || undefined,
        pagesTo: book.pages_to || undefined,
        notes: book.notes || undefined
      })
    }

    // Copy vocabulary
    if (content.vocabulary.length > 0) {
      const vocabularyInserts: LessonVocabulary[] = content.vocabulary.map((v, index) => ({
        lesson_id: targetLessonId,
        vocabulary_id: v.vocabulary_id,
        position: index
      }))

      await this.supabase
        .from('lesson_vocabulary')
        .insert(vocabularyInserts)
    }
  }
}

export const lessonRelationshipService = new LessonRelationshipService()
