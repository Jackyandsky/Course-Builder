-- Migration to rename description column to content in the content table

-- Rename the column
ALTER TABLE public.content 
RENAME COLUMN description TO content;

-- Update any views or functions that might reference the old column name
-- (none found in current schema)

-- Add a comment to clarify the purpose of this column
COMMENT ON COLUMN public.content.content IS 'The main content/body text of the content item. This can contain rich text, markdown, or plain text depending on the content type.';