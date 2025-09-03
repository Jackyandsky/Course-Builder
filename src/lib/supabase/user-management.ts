// User Management Supabase Functions

import { createSupabaseClient } from '@/lib/supabase';
import type { 
  UserProfile, 
  Organization, 
  UserGroup, 
  Enrollment, 
  UserProgress,
  BulkEnrollmentRequest,
  EnrollmentStatus,
  UserRole
} from '@/types/user-management';

const getSupabase = () => createSupabaseClient();

// User Profile Functions
export async function getUserProfile(userId: string) {
  const { data, error } = await getSupabase()
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await getSupabase()
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
}

export async function getUsersByRole(role: UserRole) {
  const { data, error } = await getSupabase()
    .from('user_profiles')
    .select('*')
    .eq('role', role)
    .order('full_name');
  
  return { data, error };
}

export async function getAllUsers() {
  const { data, error } = await getSupabase()
    .from('user_profiles')
    .select('*')
    .order('full_name');
  
  return { data, error };
}

// Organization Functions
export async function getOrganizations() {
  const { data, error } = await getSupabase()
    .from('organizations')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  return { data, error };
}

export async function createOrganization(org: Omit<Organization, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await getSupabase()
    .from('organizations')
    .insert(org)
    .select()
    .single();
  
  return { data, error };
}

// User Group Functions
export async function getUserGroups(organizationId?: string) {
  let query = getSupabase()
    .from('user_groups')
    .select(`
      *,
      organization:organizations(*),
      teacher:user_profiles!teacher_id(*)
    `)
    .eq('is_active', true);
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  const { data, error } = await query.order('name');
  return { data, error };
}

export async function createUserGroup(group: Omit<UserGroup, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await getSupabase()
    .from('user_groups')
    .insert(group)
    .select()
    .single();
  
  return { data, error };
}

export async function addUsersToGroup(groupId: string, userIds: string[]) {
  const members = userIds.map(userId => ({
    group_id: groupId,
    user_id: userId
  }));
  
  const { data, error } = await getSupabase()
    .from('group_members')
    .upsert(members, { onConflict: 'group_id,user_id' })
    .select();
  
  return { data, error };
}

export async function getGroupMembers(groupId: string) {
  const { data, error } = await getSupabase()
    .from('group_members')
    .select(`
      *,
      user:user_profiles(*)
    `)
    .eq('group_id', groupId)
    .eq('is_active', true);
  
  return { data, error };
}

// Enrollment Functions
export async function enrollUserInCourse(
  userId: string, 
  courseId: string, 
  enrolledBy: string,
  groupId?: string
) {
  const { data, error } = await getSupabase()
    .rpc('enroll_user_in_course', {
      p_user_id: userId,
      p_course_id: courseId,
      p_enrolled_by: enrolledBy,
      p_group_id: groupId
    });
  
  return { data, error };
}

export async function bulkEnrollUsers(request: BulkEnrollmentRequest & { enrolled_by: string }) {
  const { data, error } = await getSupabase()
    .rpc('bulk_enroll_users', {
      p_user_ids: request.user_ids,
      p_course_ids: request.course_ids,
      p_enrolled_by: request.enrolled_by,
      p_group_id: request.group_id
    });
  
  return { data, error };
}

export async function getUserEnrollments(userId: string) {
  const { data, error } = await getSupabase()
    .from('enrollments')
    .select(`
      *,
      course:courses(*),
      group:user_groups(*)
    `)
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false });
  
  return { data, error };
}

export async function getCourseEnrollments(courseId: string) {
  const { data, error } = await getSupabase()
    .from('enrollments')
    .select(`
      *,
      user:user_profiles(*),
      group:user_groups(*)
    `)
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: false });
  
  return { data, error };
}

export async function updateEnrollmentStatus(
  enrollmentId: string, 
  status: EnrollmentStatus
) {
  const updates: any = { status };
  
  if (status === 'active' && !updates.started_at) {
    updates.started_at = new Date().toISOString();
  } else if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }
  
  const { data, error } = await getSupabase()
    .from('enrollments')
    .update(updates)
    .eq('id', enrollmentId)
    .select()
    .single();
  
  return { data, error };
}

// Progress Tracking Functions
export async function trackUserProgress(progress: Omit<UserProgress, 'id' | 'started_at'>) {
  const { data, error } = await getSupabase()
    .from('user_progress')
    .upsert(progress, {
      onConflict: 'user_id,lesson_id',
      ignoreDuplicates: false
    })
    .select()
    .single();
  
  return { data, error };
}

export async function getUserCourseProgress(userId: string, courseId: string) {
  const { data, error } = await getSupabase()
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('started_at', { ascending: false });
  
  return { data, error };
}

export async function getEnrollmentProgress(enrollmentId: string) {
  const { data, error } = await getSupabase()
    .from('user_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('started_at', { ascending: false });
  
  return { data, error };
}

// Bulk Import Functions
export async function createImportJob(job: {
  type: string;
  organization_id?: string;
  config?: any;
  file_url?: string;
}) {
  const { data, error } = await getSupabase()
    .from('import_jobs')
    .insert(job)
    .select()
    .single();
  
  return { data, error };
}

export async function getImportJobs(organizationId?: string) {
  let query = getSupabase()
    .from('import_jobs')
    .select('*');
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

// Helper function to check user permissions
export async function checkUserPermission(action: string, resource?: string) {
  const { data: { user } } = await getSupabase().auth.getUser();
  if (!user) return false;
  
  const { data: profile } = await getUserProfile(user.id);
  if (!profile) return false;
  
  // Simple permission check - expand as needed
  if (profile.role === 'admin') return true;
  
  if (profile.role === 'teacher') {
    // Teachers can manage their own groups and students
    if (action === 'enroll' || action === 'view_progress') return true;
  }
  
  return false;
}