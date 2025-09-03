// Content types for flexible proprietary product management

export interface ContentBook {
  id: string;
  content_id: string;
  book_id: string;
  is_primary: boolean;
  notes?: string;
  position: number;
  created_at: string;
  book?: {
    id: string;
    title: string;
    author?: string;
    content_type?: string;
    description?: string;
  };
}

export interface Content {
  id: string;
  name: string;
  content?: string;
  content_data?: ContentData;
  category_id?: string;
  parent_category_id?: string;
  tags: string[];
  book_id?: string;
  is_public: boolean;
  public_slug?: string;
  price: number;
  currency: string;
  discount_percentage?: number;
  sale_price?: number;
  is_free: boolean;
  stripe_product_id?: string;
  stripe_price_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  status?: 'active' | 'archived' | 'draft';
  sort_order?: number;
  featured?: boolean;
  show_on_menu?: boolean;
  show_on_homepage?: boolean;
  menu_order?: number;
  homepage_order?: number;
  
  // Relations
  category?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
    parent_id?: string;
  };
  parent_category?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  book?: {
    id: string;
    title: string;
    author?: string;
    content_type?: string;
    description?: string;
  };
  content_books?: ContentBook[];
}

// Flexible content data structure for different types
export interface ContentData {
  type: 'decoder' | 'study_package' | 'standardizer' | string;
  // For decoders
  usage_instructions?: string;
  // For study packages
  package_contents?: PackageContent[];
  duration_hours?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  // For standardizers
  assessment_type?: string;
  passing_score?: number;
  // Generic fields that can be used by any type
  features?: string[];
  prerequisites?: string[];
  learning_outcomes?: string[];
  [key: string]: any; // Allow additional fields
}

export interface PackageContent {
  title: string;
  description?: string;
  type: 'document' | 'video' | 'quiz' | 'assignment';
  order: number;
  duration_minutes?: number;
  resource_url?: string;
}

export interface ContentFilters {
  search?: string;
  category_id?: string;
  parent_category_id?: string;
  book_id?: string;
  tags?: string[];
  is_public?: boolean;
  status?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateContentData {
  name: string;
  content?: string;
  content_data?: ContentData;
  category_id: string;
  parent_category_id?: string;
  tags?: string[];
  book_id?: string; // Deprecated, use book_ids
  book_ids?: string[]; // New: Support multiple books
  is_public?: boolean;
  public_slug?: string;
  price?: number;
  currency?: string;
  discount_percentage?: number;
  sale_price?: number;
  is_free?: boolean;
  status?: 'active' | 'archived' | 'draft';
  sort_order?: number;
  featured?: boolean;
  show_on_menu?: boolean;
  show_on_homepage?: boolean;
  menu_order?: number;
  homepage_order?: number;
  metadata?: Record<string, any>;
}

export interface UpdateContentData extends Partial<CreateContentData> {
  id: string;
}

// Category structure for proprietary products
export interface ProprietaryProductCategory {
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
  
  // Relations
  subcategories?: ProprietaryProductCategory[];
  content_count?: number;
}