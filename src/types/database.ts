// Database types
export type CourseStatus = 'draft' | 'published' | 'archived';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type LessonStatus = 'draft' | 'scheduled' |
  'completed' | 'cancelled';
export type ContentType = 'text' | 'video' | 'audio' | 'pdf' | 'image' | 'interactive';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';


// Category type
export interface Category {
  id: string;
  name: string;
  description?: string;
  type: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Course type
export interface Course {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  status: CourseStatus;
  difficulty: DifficultyLevel;
  duration_hours?: number;
  objectives?: string[];
  prerequisites?: string[];
  tags?: string[];
  thumbnail_url?: string;
  is_public: boolean;
  public_slug?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  metadata?: Record<string, any>;
  
  // Relations
  category?: Category;
  book_count?: number;
  vocabulary_group_count?: number;
  schedule_count?: number;
  // Add these lines for the relations
  course_books?: CourseBook[];
  course_vocabulary_groups?: CourseVocabularyGroup[];
  course_objectives?: CourseObjective[];
}

// Book type
export interface Book {
  id: string;
  title: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  description?: string;
  category_id?: string;
  content_type: ContentType;
  file_url?: string;
  cover_image_url?: string;
  total_pages?: number;
  language: string;
  tags?: string[];
  is_public: boolean;
  public_slug?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  
  // Relations
  category?: Category;
  vocabulary_group_books?: VocabularyGroupBook[];
}

// VocabularyGroup type
export interface VocabularyGroup {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  language: string;
  target_language?: string;
  difficulty: DifficultyLevel;
  tags?: string[];
  is_public: boolean;
  public_slug?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  // Relations
  category?: Category;
  vocabulary_group_items?: VocabularyGroupItem[];
  vocabulary_group_books?: VocabularyGroupBook[];
  vocabulary_count?: number;
}

// Vocabulary type
export interface Vocabulary {
  id: string;
  word: string;
  translation?: string;
  pronunciation?: string;
  part_of_speech?: string;
  definition?: string;
  example_sentence?: string;
  example_translation?: string;
  notes?: string;
  difficulty: DifficultyLevel;
  audio_url?: string;
  image_url?: string;
  tags?: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// VocabularyGroupItem relation type
export interface VocabularyGroupItem {
  id: string;
  vocabulary_group_id: string;
  vocabulary_id: string;
  position: number;
  added_at: string;
  // Relations
  vocabulary_group?: VocabularyGroup;
  vocabulary?: Vocabulary;
}

// CourseBook relation type
export interface CourseBook {
  id: string;
  course_id: string;
  book_id: string;
  is_required: boolean;
  notes?: string;
  position: number;
  
  // Relations
  course?: Course;
  book?: Book;
}

// CourseVocabularyGroup relation type
export interface CourseVocabularyGroup {
  id: string;
  course_id: string;
  vocabulary_group_id: string;
  position: number;
  // Relations
  course?: Course;
  vocabulary_group?: VocabularyGroup;
}

// Objective type
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
  // Relations
  category?: Category;
}

// Method type
export interface Method {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  tags?: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  
  // Relations
  category?: Category;
}

// Task type
export interface Task {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  points?: number;
  tags?: string[];
  belongingCourses?: any[];
  belongingLessons?: any[];
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  
  // Relations
  category?: Category;
}

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
  course?: Course;
  lessons?: Lesson[];
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
  status: LessonStatus;
  notes?: string;
  tags?: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  
  // Relations
  schedule?: Schedule;
  course?: Course;
  objectives?: LessonObjective[];
  methods?: LessonMethod[];
  tasks?: LessonTask[];
  books?: LessonBook[];
  lesson_books?: LessonBook[];  // Add for service layer compatibility
  lesson_tasks?: LessonTask[];  // Add for service layer compatibility
  vocabulary?: LessonVocabulary[];
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
}

// PublicLink type
export interface PublicLink {
    id: string;
    entity_type: string;
    entity_id: string;
    token: string;
    expires_at?: string;
    password_hash?: string;
    max_views?: number;
    current_views: number;
    is_active: boolean;
    created_at: string;
    metadata?: Record<string, any>;
}

// Relation types for Courses and Lessons
export interface CourseObjective {
    id: string;
    course_id: string;
    objective_id: string;
    position: number;
    created_at: string;
    // Relations
    course?: Course;
    objective?: Objective;
}

export interface CourseTask {
    id: string;
    course_id: string;
    task_id: string;
    position: number;
    created_at: string;
    // Relations
    course?: Course;
    task?: Task;
}

export interface CourseMethod {
    id: string;
    course_id: string;
    method_id: string;
    position: number;
    created_at: string;
    // Relations
    course?: Course;
    method?: Method;
}

export interface LessonObjective {
    id: string;
    lesson_id: string;
    objective_id: string;
    position: number;
    // Relations
    lesson?: Lesson;
    objective?: Objective;
}
export interface LessonMethod {
    id: string;
    lesson_id: string;
    method_id: string;
    duration_override?: number;
    position: number;
    notes?: string;
}
export interface LessonTask {
    id: string;
    lesson_id: string;
    task_id: string;
    duration_override?: number;
    position: number;
    notes?: string;
    is_homework: boolean;
    due_date?: string;
}
export interface LessonBook {
    id: string;
    lesson_id: string;
    book_id: string;
    pages_from?: number;
    pages_to?: number;
    notes?: string;
}
export interface LessonVocabulary {
    id: string;
    lesson_id: string;
    vocabulary_id: string;
    position: number;
}

export interface VocabularyBook {
    id: string;
    vocabulary_id: string;
    book_id: string;
    page_number?: number;
    section?: string;
    notes?: string;
}

export interface VocabularyGroupBook {
    id: string;
    vocabulary_group_id: string;
    book_id: string;
    notes?: string;
    position: number;
    // Relations
    vocabulary_group?: VocabularyGroup;
    book?: Book;
}


// --- Main Database Type ---
export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Category, 'id' | 'user_id'>>;
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Course, 'id' | 'user_id'>>;
      };
      books: {
        Row: Book;
        Insert: Omit<Book, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Book, 'id' | 'user_id'>>;
      };
      vocabulary_groups: {
        Row: VocabularyGroup;
        Insert: Omit<VocabularyGroup, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<VocabularyGroup, 'id' | 'user_id'>>;
      };
      vocabulary: {
        Row: Vocabulary;
        Insert: Omit<Vocabulary, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Vocabulary, 'id' | 'user_id'>>;
      };
      vocabulary_group_items: {
        Row: VocabularyGroupItem;
        Insert: Omit<VocabularyGroupItem, 'id'>;
        Update: Partial<Omit<VocabularyGroupItem, 'id'>>;
      };
      objectives: {
        Row: Objective;
        Insert: Omit<Objective, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Objective, 'id' | 'user_id'>>;
      };
      methods: {
        Row: Method;
        Insert: Omit<Method, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Method, 'id' | 'user_id'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Task, 'id' | 'user_id'>>;
      };
      schedules: {
        Row: Schedule;
        Insert: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Schedule, 'id' | 'user_id'>>;
      };
      lessons: {
        Row: Lesson;
        Insert: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Lesson, 'id' | 'user_id'>>;
      };
      course_books: {
        Row: CourseBook;
        Insert: Omit<CourseBook, 'id'>;
        Update: Partial<Omit<CourseBook, 'id'>>;
      };
      course_vocabulary_groups: {
        Row: CourseVocabularyGroup;
        Insert: Omit<CourseVocabularyGroup, 'id'>;
        Update: Partial<Omit<CourseVocabularyGroup, 'id'>>;
      };
      course_objectives: {
        Row: CourseObjective;
        Insert: Omit<CourseObjective, 'id' | 'created_at'>;
        Update: Partial<Omit<CourseObjective, 'id'>>;
      };
      lesson_objectives: {
        Row: LessonObjective;
        Insert: Omit<LessonObjective, 'id'>;
        Update: Partial<Omit<LessonObjective, 'id'>>;
      };
      lesson_methods: {
        Row: LessonMethod;
        Insert: Omit<LessonMethod, 'id'>;
        Update: Partial<Omit<LessonMethod, 'id'>>;
      };
      lesson_tasks: {
        Row: LessonTask;
        Insert: Omit<LessonTask, 'id'>;
        Update: Partial<Omit<LessonTask, 'id'>>;
      };
      lesson_books: {
        Row: LessonBook;
        Insert: Omit<LessonBook, 'id'>;
        Update: Partial<Omit<LessonBook, 'id'>>;
      };
      lesson_vocabulary: {
        Row: LessonVocabulary;
        Insert: Omit<LessonVocabulary, 'id'>;
        Update: Partial<Omit<LessonVocabulary, 'id'>>;
      };
      vocabulary_books: {
        Row: VocabularyBook;
        Insert: Omit<VocabularyBook, 'id'>;
        Update: Partial<Omit<VocabularyBook, 'id'>>;
      };
      vocabulary_group_books: {
        Row: VocabularyGroupBook;
        Insert: Omit<VocabularyGroupBook, 'id'>;
        Update: Partial<Omit<VocabularyGroupBook, 'id'>>;
      };
      attendance: {
        Row: Attendance;
        Insert: Omit<Attendance, 'id' | 'marked_at'>;
        Update: Partial<Omit<Attendance, 'id'>>;
      };
      public_links: {
        Row: PublicLink;
        Insert: Omit<PublicLink, 'id' | 'created_at' | 'current_views'>;
        Update: Partial<Omit<PublicLink, 'id'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      course_status: 'draft' | 'published' | 'archived';
      lesson_status: 'draft' | 'scheduled' | 'completed' | 'cancelled';
      difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      content_type: 'text' | 'video' | 'audio' | 'pdf' | 'image' | 'interactive';
      recurrence_type_enum: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
      day_of_week_enum: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
      attendance_status: 'present' | 'absent' | 'late' | 'excused';
    };
  };
};