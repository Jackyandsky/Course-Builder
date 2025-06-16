-- Migration: 003_fix_lesson_books_schema
-- Description: Add missing columns to lesson_books table
-- Date: 2025-06-16

-- Add is_required column to lesson_books table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_books' AND column_name = 'is_required') THEN
        ALTER TABLE lesson_books ADD COLUMN is_required BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add position column to lesson_books table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_books' AND column_name = 'position') THEN
        ALTER TABLE lesson_books ADD COLUMN position INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add reading_pages column to lesson_books table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_books' AND column_name = 'reading_pages') THEN
        ALTER TABLE lesson_books ADD COLUMN reading_pages TEXT;
    END IF;
END $$;

-- Update comment to track migration
COMMENT ON SCHEMA public IS 'Course Builder schema v1.2.0 - Fixed lesson_books table schema';