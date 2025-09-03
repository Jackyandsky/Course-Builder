-- Add text submission fields to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS text_submission_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS min_text_length integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_text_length integer DEFAULT 5000,
ADD COLUMN IF NOT EXISTS text_submission_placeholder text DEFAULT 'Enter your response here...',
ADD COLUMN IF NOT EXISTS text_submission_instructions text;

-- Add submission type tracking
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS submission_type text DEFAULT 'both' CHECK (submission_type IN ('text_only', 'media_only', 'both', 'either'));

-- Update existing tasks to have sensible defaults
UPDATE tasks 
SET submission_type = CASE 
  WHEN media_required = true THEN 'both'
  ELSE 'either'
END
WHERE submission_type IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN tasks.text_submission_enabled IS 'Whether text submission is allowed for this task';
COMMENT ON COLUMN tasks.min_text_length IS 'Minimum character length for text submissions';
COMMENT ON COLUMN tasks.max_text_length IS 'Maximum character length for text submissions';
COMMENT ON COLUMN tasks.text_submission_placeholder IS 'Placeholder text for the submission textarea';
COMMENT ON COLUMN tasks.text_submission_instructions IS 'Specific instructions for text submission';
COMMENT ON COLUMN tasks.submission_type IS 'Type of submission required: text_only, media_only, both (requires both), either (at least one)';