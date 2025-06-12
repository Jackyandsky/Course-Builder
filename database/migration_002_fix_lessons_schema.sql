-- Migration: 002_fix_lessons_schema
-- Description: Fix lessons table schema to include schedule_id and add missing types
-- Date: 2025-06-11

-- Create missing enum types if they don't exist
CREATE TYPE IF NOT EXISTS recurrence_type_enum AS ENUM ('none', 'daily', 'weekly', 'biweekly', 'monthly');
CREATE TYPE IF NOT EXISTS day_of_week_enum AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Add schedule_id column to lessons table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'schedule_id') THEN
        ALTER TABLE lessons ADD COLUMN schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add duration_minutes column to lessons table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'duration_minutes') THEN
        ALTER TABLE lessons ADD COLUMN duration_minutes INTEGER;
    END IF;
END $$;

-- Add lesson_number column to lessons table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'lesson_number') THEN
        ALTER TABLE lessons ADD COLUMN lesson_number INTEGER;
    END IF;
END $$;

-- Add tags column to lessons table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'tags') THEN
        ALTER TABLE lessons ADD COLUMN tags TEXT[];
    END IF;
END $$;

-- Add user_id column to lessons table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'user_id') THEN
        ALTER TABLE lessons ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'present', -- 'present', 'absent', 'late', 'excused'
    notes TEXT,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(lesson_id, student_name)
);

-- Create indexes for attendance if they don't exist
CREATE INDEX IF NOT EXISTS idx_attendance_lesson_id ON attendance(lesson_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_name ON attendance(student_name);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Create vocabulary_books table if it doesn't exist
CREATE TABLE IF NOT EXISTS vocabulary_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vocabulary_id UUID REFERENCES vocabulary(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    page_number INTEGER,
    section VARCHAR(255),
    notes TEXT,
    UNIQUE(vocabulary_id, book_id)
);

-- Create vocabulary_group_books table if it doesn't exist
CREATE TABLE IF NOT EXISTS vocabulary_group_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vocabulary_group_id UUID REFERENCES vocabulary_groups(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    notes TEXT,
    position INTEGER DEFAULT 0,
    UNIQUE(vocabulary_group_id, book_id)
);

-- Create indexes for new tables and columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_lessons_schedule_id ON lessons(schedule_id);
CREATE INDEX IF NOT EXISTS idx_lessons_user_id ON lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_books_vocabulary_id ON vocabulary_books(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_books_book_id ON vocabulary_books(book_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_group_books_group_id ON vocabulary_group_books(vocabulary_group_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_group_books_book_id ON vocabulary_group_books(book_id);

-- Update any existing lessons to have a valid user_id if they don't have one
-- This assumes there's at least one user in the system
UPDATE lessons 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM auth.users);

-- For any lessons that have a course_id but no schedule_id, we'll leave them as is
-- The application should handle creating proper schedules going forward

-- Add a comment to track migration
COMMENT ON SCHEMA public IS 'Course Builder schema v1.1.0 - Fixed lessons table and added vocabulary_books';