-- Add draft_type field to essay_content table to distinguish between drafts and examples
ALTER TABLE essay_content 
ADD COLUMN draft_type VARCHAR(50) DEFAULT 'example';

-- Add index for better query performance
CREATE INDEX idx_essay_content_draft_type ON essay_content(draft_type);

-- Add index for better query performance on created_by + draft_type combination
CREATE INDEX idx_essay_content_created_by_draft_type ON essay_content(created_by, draft_type);

-- Add comment to explain the field
COMMENT ON COLUMN essay_content.draft_type IS 'Type of content: draft (user drafts) or example (published examples)';