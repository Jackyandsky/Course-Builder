-- Add missing fields to enrollments table for better tracking
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'suspended', 'cancelled')),
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT '{"completed_lessons": [], "current_lesson": null, "completion_percentage": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update existing enrollments to have proper status based on is_active
UPDATE enrollments 
SET status = CASE 
  WHEN is_active = true THEN 'active'
  ELSE 'completed'
END
WHERE status IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON enrollments(course_id, status);

-- Add comment for documentation
COMMENT ON COLUMN enrollments.status IS 'Enrollment status: pending (not started), active (in progress), completed, suspended, or cancelled';
COMMENT ON COLUMN enrollments.progress IS 'JSON object tracking course progress including completed lessons and completion percentage';
COMMENT ON COLUMN enrollments.metadata IS 'Additional metadata for the enrollment (last accessed, notes, etc)';