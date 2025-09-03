-- Migration: Add PDF-related fields to lessons table
-- Created: 2025-08-20
-- Description: Adds pdf_url and pdf_page columns to support PDF document display in lessons

-- Add PDF-related fields to lessons table
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_page INTEGER DEFAULT 1;

-- Add comments for documentation
COMMENT ON COLUMN lessons.pdf_url IS 'URL to PDF document with optional #toolbar=0 suffix to hide toolbar';
COMMENT ON COLUMN lessons.pdf_page IS 'Default page number to display when opening the PDF';