// User Management System Types

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'guest';
export type EnrollmentStatus = 'pending' | 'active' | 'completed' | 'suspended' | 'cancelled';
export type OrganizationType = 'school' | 'district' | 'institution' | 'company' | 'other';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type IntegrationType = 'google_classroom' | 'canvas' | 'moodle' | 'csv' | 'api';

export interface UserProfile {
  id: string;
  email?: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  grade_level?: number;
  date_of_birth?: string;
  parent_id?: string;
  parent_email?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  code?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  contact_info?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  settings?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserGroup {
  id: string;
  organization_id?: string;
  organization?: Organization;
  name: string;
  code?: string;
  grade_level?: number;
  teacher_id?: string;
  teacher?: UserProfile;
  academic_year?: string;
  max_students?: number;
  settings?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  group?: UserGroup;
  user?: UserProfile;
  joined_at: string;
  left_at?: string;
  is_active: boolean;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  group_id?: string;
  enrolled_by?: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
  progress: {
    completed_lessons: string[];
    current_lesson?: string;
    completion_percentage: number;
  };
  metadata?: Record<string, any>;
  // Relations
  user?: UserProfile;
  course?: any; // Course type from existing system
  group?: UserGroup;
  enrolled_by_user?: UserProfile;
}

export interface UserProgress {
  id: string;
  user_id: string;
  enrollment_id?: string;
  course_id?: string;
  lesson_id?: string;
  content_id?: string;
  started_at: string;
  completed_at?: string;
  time_spent: number; // in seconds
  attempts: number;
  score?: number; // percentage
  assessment_data?: Record<string, any>;
  is_completed: boolean;
  // Relations
  user?: UserProfile;
  enrollment?: Enrollment;
}

export interface AssignmentRule {
  id: string;
  name: string;
  organization_id?: string;
  is_active: boolean;
  priority: number;
  conditions: {
    grade_level?: number;
    role?: UserRole;
    group_id?: string;
    [key: string]: any;
  };
  actions: {
    assign_courses?: string[];
    add_to_groups?: string[];
    [key: string]: any;
  };
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportJob {
  id: string;
  type: IntegrationType;
  status: ImportStatus;
  organization_id?: string;
  created_by?: string;
  config?: Record<string, any>;
  file_url?: string;
  results?: {
    total: number;
    successful: number;
    failed: number;
    errors?: Array<{
      row?: number;
      message: string;
      data?: any;
    }>;
  };
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface IntegrationConfig {
  id: string;
  organization_id?: string;
  type: IntegrationType;
  name: string;
  is_active: boolean;
  credentials?: Record<string, any>; // Should be encrypted
  settings?: Record<string, any>;
  last_sync_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Helper types for bulk operations
export interface BulkEnrollmentRequest {
  user_ids: string[];
  course_ids: string[];
  group_id?: string;
}

export interface UserImportRow {
  email: string;
  full_name: string;
  role?: UserRole;
  grade_level?: number;
  group_code?: string;
  parent_email?: string;
  [key: string]: any;
}

export interface UserInvitation {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  grade_level?: number;
  phone?: string;
  parent_email?: string;
  group_ids?: string[];
  invited_by: string;
  created_at: string;
  accepted_at?: string;
  status: 'pending' | 'accepted' | 'expired';
}