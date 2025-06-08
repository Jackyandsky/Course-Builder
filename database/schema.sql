-- Course Builder Database Schema
-- Version: 1.0
-- Description: Complete database schema for the course builder application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create custom types
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE lesson_status AS ENUM ('draft', 'scheduled', 'completed', 'cancelled');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE content_type AS ENUM ('text', 'video', 'audio', 'pdf', 'image', 'interactive');

-- Categories table (for organizing all entities)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'course', 'book', 'vocabulary', 'objective', 'method', 'task'
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50), -- Icon identifier
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, type, user_id)
);

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    status course_status DEFAULT 'draft',
    difficulty difficulty_level DEFAULT 'beginner',
    duration_hours INTEGER,
    objectives TEXT[], -- Array of learning objectives
    prerequisites TEXT[], -- Array of prerequisites
    tags TEXT[], -- Array of tags for searching
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT false,
    public_slug VARCHAR(255) UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Books/Materials Library
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(20),
    publisher VARCHAR(255),
    publication_year INTEGER,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    content_type content_type DEFAULT 'text',
    file_url TEXT, -- URL to uploaded file
    cover_image_url TEXT,
    total_pages INTEGER,
    language VARCHAR(10) DEFAULT 'en',
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    public_slug VARCHAR(255) UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Vocabulary Groups
CREATE TABLE vocabulary_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    language VARCHAR(10) DEFAULT 'en',
    target_language VARCHAR(10),
    difficulty difficulty_level DEFAULT 'beginner',
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    public_slug VARCHAR(255) UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Vocabulary Items
CREATE TABLE vocabulary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word VARCHAR(255) NOT NULL,
    translation VARCHAR(255),
    pronunciation VARCHAR(255),
    part_of_speech VARCHAR(50), -- noun, verb, adjective, etc.
    definition TEXT,
    example_sentence TEXT,
    example_translation TEXT,
    notes TEXT,
    difficulty difficulty_level DEFAULT 'beginner',
    audio_url TEXT,
    image_url TEXT,
    tags TEXT[],
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Vocabulary to Groups mapping (many-to-many)
CREATE TABLE vocabulary_group_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vocabulary_group_id UUID REFERENCES vocabulary_groups(id) ON DELETE CASCADE NOT NULL,
    vocabulary_id UUID REFERENCES vocabulary(id) ON DELETE CASCADE NOT NULL,
    position INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vocabulary_group_id, vocabulary_id)
);

-- Teaching Objectives Library
CREATE TABLE objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    bloom_level VARCHAR(50), -- 'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'
    measurable BOOLEAN DEFAULT true,
    tags TEXT[],
    is_template BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Teaching Methods Library
CREATE TABLE methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    instructions TEXT,
    duration_minutes INTEGER,
    group_size_min INTEGER DEFAULT 1,
    group_size_max INTEGER,
    materials_needed TEXT[],
    tags TEXT[],
    is_template BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Tasks/Activities Library
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    instructions TEXT,
    duration_minutes INTEGER,
    difficulty difficulty_level DEFAULT 'beginner',
    materials_needed TEXT[],
    assessment_criteria TEXT,
    tags TEXT[],
    is_template BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Schedules (Teaching Schedules)
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    recurrence_rule TEXT, -- iCal RRULE format
    tags TEXT[],
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Lessons (Individual lessons within a schedule)
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lesson_number INTEGER,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    status lesson_status DEFAULT 'draft',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Relationship Tables for Many-to-Many associations

-- Course-Book associations
CREATE TABLE course_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    is_required BOOLEAN DEFAULT false,
    notes TEXT,
    position INTEGER DEFAULT 0,
    UNIQUE(course_id, book_id)
);

-- Course-Vocabulary Group associations
CREATE TABLE course_vocabulary_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    vocabulary_group_id UUID REFERENCES vocabulary_groups(id) ON DELETE CASCADE NOT NULL,
    position INTEGER DEFAULT 0,
    UNIQUE(course_id, vocabulary_group_id)
);

-- Lesson-Objective associations
CREATE TABLE lesson_objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    objective_id UUID REFERENCES objectives(id) ON DELETE CASCADE NOT NULL,
    position INTEGER DEFAULT 0,
    UNIQUE(lesson_id, objective_id)
);

-- Lesson-Method associations
CREATE TABLE lesson_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    method_id UUID REFERENCES methods(id) ON DELETE CASCADE NOT NULL,
    duration_override INTEGER, -- Override default duration
    position INTEGER DEFAULT 0,
    notes TEXT,
    UNIQUE(lesson_id, method_id)
);

-- Lesson-Task associations
CREATE TABLE lesson_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    duration_override INTEGER,
    position INTEGER DEFAULT 0,
    notes TEXT,
    is_homework BOOLEAN DEFAULT false,
    due_date DATE,
    UNIQUE(lesson_id, task_id)
);

-- Lesson-Book associations
CREATE TABLE lesson_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    pages_from INTEGER,
    pages_to INTEGER,
    notes TEXT,
    UNIQUE(lesson_id, book_id)
);

-- Lesson-Vocabulary associations
CREATE TABLE lesson_vocabulary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    vocabulary_id UUID REFERENCES vocabulary(id) ON DELETE CASCADE NOT NULL,
    position INTEGER DEFAULT 0,
    UNIQUE(lesson_id, vocabulary_id)
);

-- Public sharing links
CREATE TABLE public_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'course', 'book', 'vocabulary_group', etc.
    entity_id UUID NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    password_hash TEXT,
    max_views INTEGER,
    current_views INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_user_id ON categories(user_id);

CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_public_slug ON courses(public_slug) WHERE public_slug IS NOT NULL;
CREATE INDEX idx_courses_tags ON courses USING GIN(tags);

CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_isbn ON books(isbn) WHERE isbn IS NOT NULL;
CREATE INDEX idx_books_tags ON books USING GIN(tags);

CREATE INDEX idx_vocabulary_user_id ON vocabulary(user_id);
CREATE INDEX idx_vocabulary_word ON vocabulary(word);
CREATE INDEX idx_vocabulary_tags ON vocabulary USING GIN(tags);

CREATE INDEX idx_vocabulary_groups_user_id ON vocabulary_groups(user_id);
CREATE INDEX idx_vocabulary_group_items_group ON vocabulary_group_items(vocabulary_group_id);
CREATE INDEX idx_vocabulary_group_items_vocab ON vocabulary_group_items(vocabulary_id);

CREATE INDEX idx_objectives_user_id ON objectives(user_id);
CREATE INDEX idx_methods_user_id ON methods(user_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

CREATE INDEX idx_schedules_user_id ON schedules(user_id);
CREATE INDEX idx_schedules_course_id ON schedules(course_id);
CREATE INDEX idx_schedules_dates ON schedules(start_date, end_date);

CREATE INDEX idx_lessons_schedule_id ON lessons(schedule_id);
CREATE INDEX idx_lessons_date ON lessons(date);
CREATE INDEX idx_lessons_status ON lessons(status);

CREATE INDEX idx_public_links_token ON public_links(token);
CREATE INDEX idx_public_links_entity ON public_links(entity_type, entity_id);

-- Full text search indexes
CREATE INDEX idx_courses_search ON courses USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_books_search ON books USING GIN(to_tsvector('english', title || ' ' || COALESCE(author, '') || ' ' || COALESCE(description, '')));
CREATE INDEX idx_vocabulary_search ON vocabulary USING GIN(to_tsvector('english', word || ' ' || COALESCE(translation, '') || ' ' || COALESCE(definition, '')));

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers to all tables with updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vocabulary_groups_updated_at BEFORE UPDATE ON vocabulary_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vocabulary_updated_at BEFORE UPDATE ON vocabulary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON objectives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_methods_updated_at BEFORE UPDATE ON methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
