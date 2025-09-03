-- Add PDF URL and parameters to lessons table
ALTER TABLE lessons 
ADD COLUMN pdf_url TEXT,
ADD COLUMN pdf_page INTEGER,
ADD COLUMN pdf_hide_toolbar BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN lessons.pdf_url IS 'URL to PDF document (can be direct PDF link or Google Drive link)';
COMMENT ON COLUMN lessons.pdf_page IS 'Specific page number to display when PDF loads';
COMMENT ON COLUMN lessons.pdf_hide_toolbar IS 'Whether to hide PDF toolbar (download, print buttons)';