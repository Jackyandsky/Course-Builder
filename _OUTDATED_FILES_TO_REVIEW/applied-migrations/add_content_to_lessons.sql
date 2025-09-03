-- Add content field to lessons table for rich text content
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS content TEXT;