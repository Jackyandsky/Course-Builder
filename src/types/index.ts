// Common types used throughout the application

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Category extends BaseEntity {
  name: string;
  description?: string;
  type: 'course' | 'book' | 'vocabulary' | 'method' | 'objective' | 'task';
  parent_id?: string;
  color?: string;
}

export interface Course extends BaseEntity {
  name: string;
  description?: string;
  category_id?: string;
  cover_image?: string;
  target_audience?: string;
  prerequisites?: string;
  status: 'draft' | 'published' | 'archived';
  is_public?: boolean;
  
  // Relations
  category?: Category;
  books?: Book[];
  schedules?: Schedule[];
}

export interface Book extends BaseEntity {
  title: string;
  author?: string;
  description?: string;
  category_id?: string;
  cover_image?: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  tags?: string[];
  
  // Relations
  category?: Category;
  vocabulary_groups?: VocabularyGroup[];
}

export interface Vocabulary extends BaseEntity {
  word: string;
  part_of_speech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'interjection' | 'other';
  definition: string;
  pronunciation?: string;
  example_sentence?: string;
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  difficulty_level?: number; // 1-10
  tags?: string[];
}

export interface VocabularyGroup extends BaseEntity {
  name: string;
  description?: string;
  book_id?: string;
  category_id?: string;
  
  // Relations
  book?: Book;
  category?: Category;
  vocabulary?: Vocabulary[];
}

export interface Schedule extends BaseEntity {
  name: string;
  description?: string;
  total_weeks: number;
  sessions_per_week: number;
  session_duration: number; // in minutes
  start_date?: string;
  end_date?: string;
  template_type?: string;
  
  // Relations
  lessons?: Lesson[];
}

export interface Lesson extends BaseEntity {
  schedule_id: string;
  title: string;
  description?: string;
  week_number: number;
  session_number: number;
  date?: string;
  duration?: number; // in minutes
  notes?: string;
  attendance_notes?: string;
  
  // Relations
  schedule?: Schedule;
  objectives?: Objective[];
  methods?: Method[];
  tasks?: Task[];
  vocabulary_groups?: VocabularyGroup[];
}

export interface Objective extends BaseEntity {
  name: string;
  description: string;
  category_id?: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  difficulty_level?: number; // 1-10
  
  // Relations
  category?: Category;
}

export interface Method extends BaseEntity {
  name: string;
  description: string;
  category_id?: string;
  methodology_type: 'PBL' | 'flipped_classroom' | 'group_discussion' | 'lecture' | 'workshop' | 'seminar' | 'other';
  estimated_duration?: number; // in minutes
  required_materials?: string;
  
  // Relations
  category?: Category;
}

export interface Task extends BaseEntity {
  name: string;
  description: string;
  category_id?: string;
  type: 'quiz' | 'assignment' | 'reading' | 'writing' | 'discussion' | 'presentation' | 'project' | 'other';
  estimated_duration?: number; // in minutes
  difficulty_level?: number; // 1-10
  instructions?: string;
  materials_needed?: string;
  
  // Relations
  category?: Category;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface PaginatedResponse<T = any> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Form and UI types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FilterOptions {
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Component prop types
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Navigation and routing types
export interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  current?: boolean;
  children?: NavItem[];
}

// Search and pagination
export interface SearchFilters {
  query?: string;
  categories?: string[];
  dateFrom?: string;
  dateTo?: string;
  status?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Export/Import types
export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  fields: string[];
  filters?: FilterOptions;
}

// Bulk operations
export interface BulkOperation {
  action: 'delete' | 'update' | 'export';
  selectedIds: string[];
  updateData?: Partial<any>;
}

export interface BulkOperationResult {
  success: boolean;
  affected: number;
  errors: Array<{
    id: string;
    message: string;
  }>;
}
