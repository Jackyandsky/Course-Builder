import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Objective } from '@/types/database';

const supabase = createClientComponentClient();

export interface CourseObjective {
  id: string;
  course_id: string;
  objective_id: string;
  position: number;
  created_at: string;
  // Relations
  objective?: Objective;
}

export interface CreateCourseObjectiveData {
  course_id: string;
  objective_id: string;
  position?: number;
}

export const courseObjectiveService = {
  // Get all objectives for a course
  async getCourseObjectives(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('course_objectives')
        .select(`
          *,
          objective:objectives(
            id,
            title,
            description,
            bloom_level,
            measurable,
            tags,
            is_template
          )
        `)
        .eq('course_id', courseId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as CourseObjective[];
    } catch (error: any) {
      // If the course_objectives table doesn't exist, return empty array
      if (error.message?.includes('course_objectives') || error.code === '42P01') {
        console.warn('course_objectives table not found, returning empty array');
        return [];
      }
      throw error;
    }
  },

  // Add objective to course
  async addObjectiveToCourse(data: CreateCourseObjectiveData) {
    try {
      // Get the next position
      const { data: existing } = await supabase
        .from('course_objectives')
        .select('position')
        .eq('course_id', data.course_id)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existing?.[0]?.position ? existing[0].position + 1 : 0;

      const { data: result, error } = await supabase
        .from('course_objectives')
        .insert({
          course_id: data.course_id,
          objective_id: data.objective_id,
          position: data.position ?? nextPosition,
        })
        .select(`
          *,
          objective:objectives(*)
        `)
        .single();

      if (error) throw error;
      return result as CourseObjective;
    } catch (error: any) {
      if (error.message?.includes('course_objectives') || error.code === '42P01') {
        throw new Error('Course objectives feature is not available. Please run the database migration to enable this feature.');
      }
      throw error;
    }
  },

  // Remove objective from course
  async removeObjectiveFromCourse(courseId: string, objectiveId: string) {
    const { error } = await supabase
      .from('course_objectives')
      .delete()
      .eq('course_id', courseId)
      .eq('objective_id', objectiveId);

    if (error) throw error;
  },

  // Update objective position in course
  async updateObjectivePosition(courseId: string, objectiveId: string, newPosition: number) {
    const { data, error } = await supabase
      .from('course_objectives')
      .update({ position: newPosition })
      .eq('course_id', courseId)
      .eq('objective_id', objectiveId)
      .select()
      .single();

    if (error) throw error;
    return data as CourseObjective;
  },

  // Reorder all objectives in a course
  async reorderCourseObjectives(courseId: string, objectiveIds: string[]) {
    const updates = objectiveIds.map((objectiveId, index) => ({
      course_id: courseId,
      objective_id: objectiveId,
      position: index,
    }));

    const { data, error } = await supabase
      .from('course_objectives')
      .upsert(updates)
      .select(`
        *,
        objective:objectives(*)
      `);

    if (error) throw error;
    return data as CourseObjective[];
  },

  // Get courses that use a specific objective
  async getCoursesUsingObjective(objectiveId: string) {
    const { data, error } = await supabase
      .from('course_objectives')
      .select(`
        course_id,
        position,
        course:courses(id, title, status)
      `)
      .eq('objective_id', objectiveId);

    if (error) throw error;
    return data;
  },

  // Bulk add objectives to course
  async bulkAddObjectivesToCourse(courseId: string, objectiveIds: string[]) {
    const { data: existing } = await supabase
      .from('course_objectives')
      .select('position')
      .eq('course_id', courseId)
      .order('position', { ascending: false })
      .limit(1);

    const startPosition = existing?.[0]?.position ? existing[0].position + 1 : 0;

    const inserts = objectiveIds.map((objectiveId, index) => ({
      course_id: courseId,
      objective_id: objectiveId,
      position: startPosition + index,
    }));

    const { data, error } = await supabase
      .from('course_objectives')
      .insert(inserts)
      .select(`
        *,
        objective:objectives(*)
      `);

    if (error) throw error;
    return data as CourseObjective[];
  },
};