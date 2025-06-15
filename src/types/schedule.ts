// Schedule and Lesson types
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

// Schedule type
export interface Schedule {
  id: string;
  course_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  recurrence_type: RecurrenceType;
  recurrence_days?: DayOfWeek[];
  recurrence_interval?: number;
  default_start_time: string;
  default_duration_minutes: number;
  timezone: string;
  location?: string;
  max_students?: number;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  
  // Relations
  course?: any; // Will be Course type from database.ts
  lessons?: Lesson[];
  student_count?: number;
}

// Lesson type
export interface Lesson {
  id: string;
  schedule_id: string;
  course_id: string;
  title: string;
  description?: string;
  lesson_number?: number;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes?: number;
  location?: string;
  status: 'draft' | 'scheduled' | 'completed' | 'cancelled';
  tags?: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  
  // Relations - Enhanced for course content integration
  schedule?: Schedule;
  objectives?: LessonObjective[];
  methods?: LessonMethod[];
  tasks?: LessonTask[];
  books?: LessonBook[];
  lesson_books?: LessonBook[];  // Add for service layer compatibility
  lesson_tasks?: LessonTask[];  // Add for service layer compatibility
  vocabulary_groups?: LessonVocabularyGroup[];
  attendance?: Attendance[];
}

// Attendance type
export interface Attendance {
  id: string;
  lesson_id: string;
  student_name: string;
  student_id?: string;
  status: AttendanceStatus;
  notes?: string;
  marked_at: string;
  marked_by?: string;
  
  // Relations
  lesson?: Lesson;
}

// Objective type (simplified for now)
export interface Objective {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  bloom_level?: string;
  measurable: boolean;
  tags?: string[];
  is_template: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// Method type (simplified for now)
export interface Method {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  estimated_minutes?: number;
  materials_needed?: string[];
  tags?: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// Task type (simplified for now)
export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'quiz' | 'assignment' | 'reading' | 'writing' | 'speaking' | 'listening' | 'other';
  category_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  points?: number;
  estimated_minutes?: number;
  instructions?: string;
  tags?: string[];
  belongingCourses?: any[];
  belongingLessons?: any[];
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// Lesson-Objective relation
export interface LessonObjective {
  id: string;
  lesson_id: string;
  objective_id: string;
  position: number;
  
  // Relations
  lesson?: Lesson;
  objective?: Objective;
}

// Lesson-Method relation
export interface LessonMethod {
  id: string;
  lesson_id: string;
  method_id: string;
  position: number;
  duration_minutes?: number;
  notes?: string;
  
  // Relations
  lesson?: Lesson;
  method?: Method;
}

// Lesson-Task relation
export interface LessonTask {
  id: string;
  lesson_id: string;
  task_id: string;
  position: number;
  is_homework: boolean;
  due_date?: string;
  notes?: string;
  
  // Relations
  lesson?: Lesson;
  task?: Task;
}

// Calendar event type for UI
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    lesson: Lesson;
    schedule: Schedule;
  };
  className?: string;
}

// Schedule template type
export interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  default_duration_minutes: number;
  recurrence_type: RecurrenceType;
  recurrence_days?: DayOfWeek[];
  default_objectives?: string[];
  default_methods?: string[];
  default_tasks?: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Lesson-Book relation
export interface LessonBook {
  id: string;
  lesson_id: string;
  book_id: string;
  position: number;
  is_required: boolean;
  reading_pages?: string;
  notes?: string;
  
  // Relations
  lesson?: Lesson;
  book?: any; // Will be Book type from database.ts
}

// Lesson-VocabularyGroup relation
export interface LessonVocabularyGroup {
  id: string;
  lesson_id: string;
  vocabulary_group_id: string;
  position: number;
  focus_words?: string[];
  notes?: string;
  
  // Relations
  lesson?: Lesson;
  vocabulary_group?: any; // Will be VocabularyGroup type from database.ts
}
