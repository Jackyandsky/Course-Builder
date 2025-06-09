// Database types
export type CourseStatus = 'draft' | 'published' | 'archived';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type LessonStatus = 'draft' | 'scheduled' | 'completed' | 'cancelled';
export type ContentType = 'text' | 'video' | 'audio' | 'pdf' | 'image' | 'interactive';

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
