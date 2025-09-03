-- Add sync tracking fields to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS last_sync_attempt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sync_status TEXT CHECK (sync_status IN ('success', 'no_match', 'low_confidence', 'error', NULL));

-- Create an index for efficient filtering of books by sync status and time
CREATE INDEX IF NOT EXISTS idx_books_sync_tracking 
ON books (last_sync_attempt, sync_status) 
WHERE last_sync_attempt IS NOT NULL;

-- Comment on new columns
COMMENT ON COLUMN books.last_sync_attempt IS 'Timestamp of the last sync attempt with Google Books';
COMMENT ON COLUMN books.sync_attempts IS 'Number of sync attempts made for this book';
COMMENT ON COLUMN books.sync_status IS 'Status of the last sync attempt';